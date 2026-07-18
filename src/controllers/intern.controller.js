'use strict';

const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const path      = require('path');
const fs        = require('fs');
const { Op }    = require('sequelize');

const {
  Intern,
  InternDocument,
  InternProject,
  InternTask,
  InternWorkLog,
  User,
  sequelize,
} = require('../models');

const { moveUploadedFile, deleteUploadedFile, deleteInternFolder } = require('../utils/fileUpload');
const generateDisplayId = require('../utils/generateDisplayId');

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const internIncludes = [
  {
    model: User,
    as: 'mentor',
    attributes: ['id', 'name', 'employee_id'],
  },
  {
    model: User,
    as: 'approvedBy',
    attributes: ['id', 'name', 'employee_id'],
  },
  {
    model: InternDocument,
    as: 'documents',
  },
];

// ─────────────────────────────────────────────
// PUBLIC — Register
// ─────────────────────────────────────────────

const register = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      name,
      email,
      mobile,
      enrollment_no,
      college_name,
      degree_type,
      intern_type,
      document_type,
      college_detail, // optional stringified JSON
    } = req.body;

    // ── 1. Required field checks ──
    if (!name || !email || !mobile || !enrollment_no || !college_name || !degree_type || !intern_type || !document_type) {
      await t.rollback();
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    // ── 2. Required file checks ──
    if (!req.files?.id_proof?.[0]) {
      await t.rollback();
      return res.status(400).json({ message: 'ID proof is required.' });
    }

    if (!req.files?.photo?.[0]) {
      await t.rollback();
      return res.status(400).json({ message: 'Passport photo is required.' });
    }

    // ── 3. Validate enums ──
    const validInternTypes    = ['intern', 'trainee'];
    const validDegreeTypes    = ['bachelor', 'master'];
    const validDocumentTypes  = ['aadhaar', 'voter_card', 'passport', 'driving_licence'];

    if (!validInternTypes.includes(intern_type)) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid intern type.' });
    }

    if (!validDegreeTypes.includes(degree_type)) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid degree type.' });
    }

    if (!validDocumentTypes.includes(document_type)) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid document type.' });
    }

    // ── 4. Check duplicate email / enrollment ──
    const existing = await Intern.findOne({
      where: {
        [Op.or]: [{ email }, { enrollment_no }],
      },
    });

    if (existing) {
      await t.rollback();
      const field = existing.email === email ? 'email' : 'enrollment number';
      return res.status(409).json({ message: `An intern with this ${field} already exists.` });
    }

    // ── 5. Create intern record ──
    const intern = await Intern.create({
      name:          name.trim(),
      email:         email.trim().toLowerCase(),
      mobile,
      enrollment_no,
      college_name:  college_name.trim(),
      degree_type,
      intern_type,
      status:        'pending',
    }, { transaction: t });

    // ── 6. Move uploaded files to intern's folder ──
    const idProofResult = moveUploadedFile(
      req.files.id_proof[0].path,
      `interns/${intern.id}`,
      'id_proof'
    );

    const photoResult = moveUploadedFile(
      req.files.photo[0].path,
      `interns/${intern.id}`,
      'photo'
    );

    if (!idProofResult || !photoResult) {
      await t.rollback();
      return res.status(500).json({ message: 'File upload failed.' });
    }

    // optional files
    let resumeResult      = null;
    let marksheetResult   = null;

    if (req.files?.resume?.[0]) {
      resumeResult = moveUploadedFile(
        req.files.resume[0].path,
        `interns/${intern.id}`,
        'resume'
      );
    }

    if (req.files?.last_sem_marksheet?.[0]) {
      marksheetResult = moveUploadedFile(
        req.files.last_sem_marksheet[0].path,
        `interns/${intern.id}`,
        'last_sem_marksheet'
      );
    }

    // ── 7. Parse college_detail ──
    let parsedCollegeDetail = null;
    if (college_detail) {
      try {
        parsedCollegeDetail = typeof college_detail === 'string'
          ? JSON.parse(college_detail)
          : college_detail;
      } catch {
        parsedCollegeDetail = null;
      }
    }

    // ── 8. Create document record ──
    await InternDocument.create({
      intern_id:          intern.id,
      document_type,
      id_proof:           idProofResult.url,
      photo:              photoResult.url,
      college_detail:     parsedCollegeDetail,
      resume:             resumeResult?.url     || null,
      last_sem_marksheet: marksheetResult?.url  || null,
    }, { transaction: t });

    await t.commit();

    return res.status(201).json({
      message: 'Registration submitted successfully. Please wait for admin approval.',
      intern_id: intern.id,
    });

  } catch (err) {
    await t.rollback();

    // clean up any uploaded temp files on error
    ['id_proof', 'photo', 'resume', 'last_sem_marksheet'].forEach((field) => {
      if (req.files?.[field]?.[0]?.path) {
        if (fs.existsSync(req.files[field][0].path)) {
          fs.unlinkSync(req.files[field][0].path);
        }
      }
    });

    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// PUBLIC — Check Status (waiting screen polling)
// ─────────────────────────────────────────────

const checkStatus = async (req, res) => {
  try {
    const { intern_id } = req.params;

    const intern = await Intern.findByPk(intern_id, {
      attributes: [
        'id', 'name', 'status',
        'rejection_reason',
        'setup_token',
        'setup_token_expires_at',
      ],
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found.' });
    }

    // if approved and setup token exists and not expired — return token
    // so waiting screen can redirect to /intern/setup-password?token=xxx
    if (intern.status === 'approved' && intern.setup_token) {
      const tokenExpired = new Date() > new Date(intern.setup_token_expires_at);

      if (tokenExpired) {
        return res.status(200).json({
          status:  'approved',
          message: 'Your account has been approved but your setup link has expired. Please contact admin.',
          token_expired: true,
        });
      }

      return res.status(200).json({
        status:       'approved',
        message:      'Your account has been approved. Please set your password.',
        setup_token:  intern.setup_token,
        name:         intern.name,
      });
    }

    if (intern.status === 'rejected') {
      return res.status(200).json({
        status:           'rejected',
        message:          'Your application has been rejected.',
        rejection_reason: intern.rejection_reason,
      });
    }

    return res.status(200).json({
      status:  intern.status,
      message: 'Your application is under review. Please check back later.',
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// PUBLIC — Setup Password (one-time token)
// ─────────────────────────────────────────────

const setupPassword = async (req, res) => {
  try {
    const { setup_token, password, confirm_password } = req.body;

    if (!setup_token || !password || !confirm_password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const intern = await Intern.findOne({
      where: { setup_token },
    });

    if (!intern) {
      return res.status(404).json({ message: 'Invalid or expired setup link.' });
    }

    if (new Date() > new Date(intern.setup_token_expires_at)) {
      return res.status(400).json({ message: 'Setup link has expired. Please contact admin.' });
    }

    if (intern.password_hash) {
      return res.status(400).json({ message: 'Password already set. Please login.' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    // generate display_id now that intern is fully set up
    const display_id = generateDisplayId({
      prefix:     'IN',
      employeeId: intern.enrollment_no,
    });

    await intern.update({
      password_hash,
      display_id,
      status:                  'active',
      setup_token:             null, // clear token after use
      setup_token_expires_at:  null,
    });

    return res.status(200).json({
      message: 'Password set successfully. You can now login.',
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// PUBLIC — Login
// ─────────────────────────────────────────────

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const intern = await Intern.findOne({
      where: { email: email.trim().toLowerCase() },
      include: [
        {
          model: User,
          as: 'mentor',
          attributes: ['id', 'name', 'employee_id'],
        },
      ],
    });

    if (!intern) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (intern.status === 'pending') {
      return res.status(403).json({ message: 'Your application is still pending approval.' });
    }

    if (intern.status === 'rejected') {
      return res.status(403).json({ message: 'Your application has been rejected.' });
    }

    if (intern.status === 'completed') {
      return res.status(403).json({ message: 'Your internship period has ended.' });
    }

    if (!intern.password_hash) {
      return res.status(403).json({ message: 'Please set your password first using the setup link.' });
    }

    const isMatch = await bcrypt.compare(password, intern.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // update last login
    await intern.update({ last_login: new Date() });

    const token = jwt.sign(
      {
        sub:         intern.id,
        type:        'intern',
        intern_type: intern.intern_type,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      message: 'Login successful.',
      accessToken: token,
      intern: {
        id:           intern.id,
        display_id:   intern.display_id,
        name:         intern.name,
        email:        intern.email,
        intern_type:  intern.intern_type,
        degree_type:  intern.degree_type,
        college_name: intern.college_name,
        start_date:   intern.start_date,
        end_date:     intern.end_date,
        mentor:       intern.mentor,
      },
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Get All Interns
// ─────────────────────────────────────────────

const getAllInterns = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { status, intern_type, search } = req.query;

    const where = {};
    if (status)      where.status      = status;
    if (intern_type) where.intern_type = intern_type;

    if (search) {
      where[Op.or] = [
        { name:          { [Op.iLike]: `%${search}%` } },
        { email:         { [Op.iLike]: `%${search}%` } },
        { enrollment_no: { [Op.iLike]: `%${search}%` } },
        { college_name:  { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Intern.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'mentor',
          attributes: ['id', 'name', 'employee_id'],
        },
      ],
      order:    [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      total:      count,
      page,
      totalPages: Math.ceil(count / limit),
      interns:    rows,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Get Intern By ID
// ─────────────────────────────────────────────

const getInternById = async (req, res) => {
  try {
    const { id } = req.params;

    const intern = await Intern.findByPk(id, {
      include: internIncludes,
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found.' });
    }

    return res.status(200).json({ intern });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Approve Intern
// ─────────────────────────────────────────────

const approveIntern = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const admin_id = req.user.id;
    const { id }   = req.params;

    const {
      start_date,
      end_date,
      mentor_id,
    } = req.body;

    if (!start_date || !end_date) {
      await t.rollback();
      return res.status(400).json({ message: 'start_date and end_date are required.' });
    }

    if (new Date(start_date) >= new Date(end_date)) {
      await t.rollback();
      return res.status(400).json({ message: 'end_date must be after start_date.' });
    }

    const intern = await Intern.findByPk(id);

    if (!intern) {
      await t.rollback();
      return res.status(404).json({ message: 'Intern not found.' });
    }

    if (intern.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: `Intern is already ${intern.status}.` });
    }

    // generate one-time setup token
    const setup_token            = crypto.randomBytes(32).toString('hex');
    const setup_token_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await intern.update({
      status:                 'approved',
      start_date,
      end_date,
      mentor_id:              mentor_id || null,
      approved_by:            admin_id,
      approved_at:            new Date(),
      setup_token,
      setup_token_expires_at,
    }, { transaction: t });

    await t.commit();

// ✅ just return the token — frontend builds the URL itself
return res.status(200).json({
  message:     'Intern approved successfully.',
  setup_token, // admin copies this or shares the link manually
});
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Reject Intern
// ─────────────────────────────────────────────

const rejectIntern = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id }               = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason || !rejection_reason.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'rejection_reason is required.' });
    }

    const intern = await Intern.findByPk(id);

    if (!intern) {
      await t.rollback();
      return res.status(404).json({ message: 'Intern not found.' });
    }

    if (intern.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: `Intern is already ${intern.status}.` });
    }

    await intern.update({
      status:           'rejected',
      rejection_reason: rejection_reason.trim(),
    }, { transaction: t });

    await t.commit();

    return res.status(200).json({ message: 'Intern application rejected.' });

  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Extend Internship
// ─────────────────────────────────────────────

const extendInternship = async (req, res) => {
  try {
    const { id }       = req.params;
    const { end_date } = req.body;

    if (!end_date) {
      return res.status(400).json({ message: 'New end_date is required.' });
    }

    const intern = await Intern.findByPk(id);

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found.' });
    }

    if (!['approved', 'active'].includes(intern.status)) {
      return res.status(400).json({ message: 'Can only extend active or approved interns.' });
    }

    if (new Date(end_date) <= new Date(intern.end_date)) {
      return res.status(400).json({
        message: `New end date must be after current end date (${intern.end_date}).`,
      });
    }

    await intern.update({ end_date });

    return res.status(200).json({
      message:  'Internship extended successfully.',
      end_date: intern.end_date,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Deactivate Intern
// ─────────────────────────────────────────────

const deactivateIntern = async (req, res) => {
  try {
    const { id } = req.params;

    const intern = await Intern.findByPk(id);

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found.' });
    }

    if (intern.status === 'completed') {
      return res.status(400).json({ message: 'Intern is already deactivated.' });
    }

    await intern.update({ status: 'completed' });

    return res.status(200).json({ message: 'Intern deactivated successfully.' });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Regenerate Setup Token
// (in case token expired before intern set password)
// ─────────────────────────────────────────────

const regenerateSetupToken = async (req, res) => {
  try {
    const { id } = req.params;

    const intern = await Intern.findByPk(id);

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found.' });
    }

    if (!['approved', 'active'].includes(intern.status)) {
      return res.status(400).json({ message: 'Can only regenerate token for approved interns.' });
    }

    if (intern.password_hash) {
      return res.status(400).json({ message: 'Intern has already set their password.' });
    }

    const setup_token            = crypto.randomBytes(32).toString('hex');
    const setup_token_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await intern.update({ setup_token, setup_token_expires_at });

    const setupUrl = `${process.env.INTERN_PORTAL_URL}/setup-password?token=${setup_token}`;

    return res.status(200).json({
      message:    'Setup token regenerated.',
      setup_url:  setupUrl,
      setup_token,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────

module.exports.internController = {
  register,
  checkStatus,
  setupPassword,
  login,
  getAllInterns,
  getInternById,
  approveIntern,
  rejectIntern,
  extendInternship,
  deactivateIntern,
  regenerateSetupToken,
};