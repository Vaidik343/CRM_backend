const { EmployeeApplication, EmployeeApplicationDocument ,sequelize} = require('../models');
const { Op } = require('sequelize');
const path = require('path');

// ── helpers ──────────────────────────────────────────────────────────────────

const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');

async function generateDisplayId() {
  const last = await EmployeeApplication.findOne({
    order: [['created_at', 'DESC']],
    paranoid: false,
  });

  if (!last) return 'AP001';

  const num = parseInt(last.display_id.replace('AP', ''), 10);
  return `AP${String(num + 1).padStart(3, '0')}`;
}

// photo_id subtypes that can conflict with address_id
const CONFLICTABLE_SUBTYPES = ['aadhaar', 'voter_card', 'passport', 'driving_licence'];

// ── public: submit application ────────────────────────────────────────────────

// POST /api/employee-applications/register
// multipart/form-data — files: photo_id, address_id, educational_certificate, bank_document
const submitApplication = async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone, alternate_number, address, gender,
      photo_id_subtype, address_id_subtype,
      bank_name, account_number, ifsc_code, account_holder_name,
    } = req.body;

    console.log(req.body);
    
    // ── basic field validation ──
    if (!first_name || !last_name || !email || !phone || !address || !gender) {
      return res.status(400).json({ message: 'All personal info fields are required.' });
    }

    if (!photo_id_subtype || !address_id_subtype) {
      return res.status(400).json({ message: 'Photo ID type and Address ID type are required.' });
    }

    if (!bank_name || !account_number || !ifsc_code || !account_holder_name) {
      return res.status(400).json({ message: 'All bank detail fields are required.' });
    }

    // ── subtype conflict validation ──
    if (
      CONFLICTABLE_SUBTYPES.includes(photo_id_subtype) &&
      photo_id_subtype === address_id_subtype
    ) {
      return res.status(400).json({
        message: `You cannot use the same document type (${photo_id_subtype.replace('_', ' ')}) for both Photo ID and Address ID.`,
      });
    }

    // ── file validation ──
    const files = req.files || {};
    if (!files.photo_id?.[0]) return res.status(400).json({ message: 'Photo ID file is required.' });
    if (!files.address_id?.[0]) return res.status(400).json({ message: 'Address ID file is required.' });
    if (!files.educational_certificate?.[0]) return res.status(400).json({ message: 'Educational certificate is required.' });
    if (!files.bank_document?.[0]) return res.status(400).json({ message: 'Bank document is required.' });

    const display_id = await generateDisplayId();

    const application = await EmployeeApplication.create({
      display_id,
      first_name,
      last_name,
      email,
      phone,
       alternate_number: alternate_number?.trim() || null,
      address,
      gender,
      bank_name,
      account_number,
      ifsc_code,
      account_holder_name,
      status: 'pending',
    });
    console.log("🚀 ~ submitApplication ~ application:", application)

    // ── save documents ──
    const docsToCreate = [
      {
        application_id: application.id,
        document_type: 'photo_id',
        document_subtype: photo_id_subtype,
        file_path: files.photo_id[0].path,
        original_name: files.photo_id[0].originalname,
        uploaded_at: new Date(),
      },
      {
        application_id: application.id,
        document_type: 'address_id',
        document_subtype: address_id_subtype,
        file_path: files.address_id[0].path,
        original_name: files.address_id[0].originalname,
        uploaded_at: new Date(),
      },
      {
        application_id: application.id,
        document_type: 'educational_certificate',
        document_subtype: null,
        file_path: files.educational_certificate[0].path,
        original_name: files.educational_certificate[0].originalname,
        uploaded_at: new Date(),
      },
      {
        application_id: application.id,
        document_type: 'bank_document',
        document_subtype: null,
        file_path: files.bank_document[0].path,
        original_name: files.bank_document[0].originalname,
        uploaded_at: new Date(),
      },
    ];

    await EmployeeApplicationDocument.bulkCreate(docsToCreate);

    return res.status(201).json({
      message: 'Application submitted successfully. Admin will review and contact you.',
      display_id,
    });
  } catch (err) {
    console.error('submitApplication error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── admin: list all applications ─────────────────────────────────────────────

// GET /api/employee-applications?status=&search=&page=&limit=
const getAllApplications = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];

    if (status) conditions.push({ status });

    if (search) {
      conditions.push({
        [Op.or]: [
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { display_id: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    const { count, rows } = await EmployeeApplication.findAndCountAll({
      where: conditions.length ? { [Op.and]: conditions } : {},
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return res.json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      applications: rows,
    });
  } catch (err) {
    console.error('getAllApplications error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── admin: get single application with documents ──────────────────────────────

// GET /api/employee-applications/:id
const getApplicationById = async (req, res) => {
  try {
    const application = await EmployeeApplication.findByPk(req.params.id, {
      include: [
        {
          model: EmployeeApplicationDocument,
          as: 'documents',
          separate: true,
          order: [['uploaded_at', 'ASC']],
        },
      ],
    });

    if (!application) return res.status(404).json({ message: 'Application not found.' });

    return res.json({ application });
  } catch (err) {
    console.error('getApplicationById error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── admin: approve ────────────────────────────────────────────────────────────

// PATCH /api/employee-applications/:id/approve
const approveApplication = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { work_location_type, work_location } = req.body;

    if (!work_location_type) {
      await t.rollback();
      return res.status(400).json({ message: 'Work location type is required.' });
    }
    if (work_location_type === 'out_of_office' && !work_location?.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Work location is required for out of office.' });
    }

    const application = await EmployeeApplication.findByPk(req.params.id);
    if (!application) {
      await t.rollback();
      return res.status(404).json({ message: 'Application not found.' });
    }
    if (application.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: `Application is already ${application.status}.` });
    }

    await application.update({
      status: 'approved',
      rejection_reason: null,
      work_location_type,
      work_location: work_location_type === 'out_of_office' ? work_location.trim() : null,
    }, { transaction: t });

    await t.commit();

    return res.json({
      message: 'Application approved.',
      application,
    });

  } catch (err) {
    await t.rollback();
    console.log('approveApplication error:', err);
    return res.status(500).json({ message: err.message });
  }
};
// ── admin: reject ─────────────────────────────────────────────────────────────

// PATCH /api/employee-applications/:id/reject
const rejectApplication = async (req, res) => {
  try {
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({ message: 'Rejection reason is required.' });
    }

    const application = await EmployeeApplication.findByPk(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found.' });

    if (application.status === 'rejected') {
      return res.status(400).json({ message: 'Application is already rejected.' });
    }

    await application.update({ status: 'rejected', rejection_reason });

    return res.json({ message: 'Application rejected.', application });
  } catch (err) {
    console.error('rejectApplication error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── admin: delete ─────────────────────────────────────────────────────────────

// DELETE /api/employee-applications/:id
const deleteApplication = async (req, res) => {
  try {
    const application = await EmployeeApplication.findByPk(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found.' });

    await EmployeeApplicationDocument.destroy({ where: { application_id: application.id } });
    await application.destroy();

    return res.json({ message: 'Application deleted.' });
  } catch (err) {
    console.error('deleteApplication error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


const getApprovedPending = async (req, res) => {
  try {
    const { User } = require('../models');
    
    // get all approved applications
    const applications = await EmployeeApplication.findAll({
      where: { status: 'approved' },
      order: [['createdAt', 'DESC']],
    });

    // filter out ones whose email already exists in users table
    const emails = applications.map(a => a.email);
    const existingUsers = await User.findAll({
      where: { email: emails },
      attributes: ['email'],
    });
    const existingEmails = new Set(existingUsers.map(u => u.email));

    const pending = applications.filter(a => !existingEmails.has(a.email));

    return res.json({ applications: pending });
  } catch (err) {
    console.log('getApprovedPending error:', err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
   submitApplication, getAllApplications, getApplicationById, approveApplication, rejectApplication, deleteApplication, getApprovedPending
}