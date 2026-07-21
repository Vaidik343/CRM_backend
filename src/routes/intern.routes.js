'use strict';

const express = require('express');
const router  = express.Router();

const {
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
  updateMyProfile
} = require('../controllers/intern.controller');

const {
  createProject,
  getMyProject,
  updateProject,
  getInternProject,
  adminUpdateProject,
} = require('../controllers/internProject.controller');


const {
  createTask,
  getMyTasks,
  updateTask,
  adminAssignTask,
  getInternTasks,
  adminUpdateTask,
} = require('../controllers/internTask.controller');

const {
  createWorkLog,
  getMyWorkLogs,
  updateWorkLog,
  getInternWorkLogs,
} = require('../controllers/internWorkLog.controller');


const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin }  = require('../middlewares/role.middleware');
const { authenticateIntern } = require('../middlewares/internAuth.middleware');
const { internUpload }  = require('../middlewares/multer');

// ─────────────────────────────────────────────
// VALIDATION MIDDLEWARE
// ─────────────────────────────────────────────

const validateRegister = (req, res, next) => {
  const errors = [];

  const {
    name, email, mobile, enrollment_no,
    college_name, degree_type, intern_type, document_type,
  } = req.body;

  if (!name || !name.trim())             errors.push('name is required.');
  if (!email || !email.trim())           errors.push('email is required.');
  if (!mobile)                           errors.push('mobile is required.');
  if (!enrollment_no)                    errors.push('enrollment_no is required.');
  if (!college_name || !college_name.trim()) errors.push('college_name is required.');
  if (!degree_type)                      errors.push('degree_type is required.');
  if (!intern_type)                      errors.push('intern_type is required.');
  if (!document_type)                    errors.push('document_type is required.');

  // email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email.trim())) {
    errors.push('Invalid email format.');
  }

  // mobile — 10 digits
  if (mobile && !/^\d{10}$/.test(mobile)) {
    errors.push('Mobile must be a 10-digit number.');
  }

  // enums
  if (intern_type && !['intern', 'trainee'].includes(intern_type)) {
    errors.push('intern_type must be intern or trainee.');
  }

  if (degree_type && !['bachelor', 'master'].includes(degree_type)) {
    errors.push('degree_type must be bachelor or master.');
  }

  if (
    document_type &&
    !['aadhaar', 'voter_card', 'passport', 'driving_licence'].includes(document_type)
  ) {
    errors.push('Invalid document_type.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  next();
};

// ─────────────────────────────────────────────

const validateApprove = (req, res, next) => {
  const { start_date, end_date } = req.body;
  const errors = [];

  if (!start_date) errors.push('start_date is required.');
  if (!end_date)   errors.push('end_date is required.');

  if (start_date && isNaN(new Date(start_date))) {
    errors.push('start_date is not a valid date.');
  }

  if (end_date && isNaN(new Date(end_date))) {
    errors.push('end_date is not a valid date.');
  }

  if (
    start_date && end_date &&
    !isNaN(new Date(start_date)) && !isNaN(new Date(end_date)) &&
    new Date(start_date) >= new Date(end_date)
  ) {
    errors.push('end_date must be after start_date.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  next();
};

// ─────────────────────────────────────────────

const validateReject = (req, res, next) => {
  const { rejection_reason } = req.body;

  if (!rejection_reason || !rejection_reason.trim()) {
    return res.status(400).json({ message: 'rejection_reason is required.' });
  }

  if (rejection_reason.trim().length < 5) {
    return res.status(400).json({ message: 'rejection_reason must be at least 5 characters.' });
  }

  next();
};

// ─────────────────────────────────────────────

const validateSetupPassword = (req, res, next) => {
  const { setup_token, password, confirm_password } = req.body;
  const errors = [];

  if (!setup_token)       errors.push('setup_token is required.');
  if (!password)          errors.push('password is required.');
  if (!confirm_password)  errors.push('confirm_password is required.');

  if (password && password.length < 6) {
    errors.push('password must be at least 6 characters.');
  }

  if (password && confirm_password && password !== confirm_password) {
    errors.push('Passwords do not match.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  next();
};

// ─────────────────────────────────────────────

const validateExtend = (req, res, next) => {
  const { end_date } = req.body;

  if (!end_date) {
    return res.status(400).json({ message: 'end_date is required.' });
  }

  if (isNaN(new Date(end_date))) {
    return res.status(400).json({ message: 'end_date is not a valid date.' });
  }

  next();
};

// ─────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────

// POST /api/intern/register
// multipart/form-data — text fields + file uploads
// Required: name, email, mobile, enrollment_no, college_name,
//           degree_type, intern_type, document_type, id_proof, photo
// Optional: college_detail (JSON string), resume, last_sem_marksheet
router.post(
  '/intern/register',
  internUpload,           // multer handles files first
  validateRegister,       // then validate text fields
  register
);

// GET /api/intern/status/:intern_id
// No auth — intern polls this from waiting screen
// Returns: status, setup_token (if approved), rejection_reason (if rejected)
router.get('/intern/status/:intern_id', checkStatus);

// POST /api/intern/setup-password
// No auth — uses one-time setup_token
// Required: setup_token, password, confirm_password
router.post('/intern/setup-password', validateSetupPassword, setupPassword);

// POST /api/intern/login
// No auth
// Required: email, password
router.post('/intern/login', login);

// ─────────────────────────────────────────────
// INTERN ROUTES (authenticated)
// ─────────────────────────────────────────────

// GET /api/intern/me
// Returns own profile
// in intern.routes.js — update the /intern/me route
router.get('/intern/me', authenticateIntern, async (req, res) => {
  const intern = await Intern.findByPk(req.intern.id, {
    include: [
      { model: User, as: 'mentor', attributes: ['id', 'name', 'employee_id'] },
      { model: InternDocument, as: 'documents' },
    ],
  });
  return res.status(200).json({ intern });
});

// PATCH /api/intern/me
router.patch('/intern/me', authenticateIntern, updateMyProfile);
// ─────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────

// GET /api/admin/interns
// Query (all optional): page, limit, status, intern_type, search
router.get('/admin/interns', authenticate, requireAdmin, getAllInterns);

// GET /api/admin/interns/:id
// Returns full intern detail with documents
router.get('/admin/interns/:id', authenticate, requireAdmin, getInternById);

// PATCH /api/admin/interns/:id/approve
// Required body: start_date, end_date
// Optional body: mentor_id
router.patch(
  '/admin/interns/:id/approve',
  authenticate,
  requireAdmin,
  validateApprove,
  approveIntern
);

// PATCH /api/admin/interns/:id/reject
// Required body: rejection_reason (min 5 chars)
router.patch(
  '/admin/interns/:id/reject',
  authenticate,
  requireAdmin,
  validateReject,
  rejectIntern
);

// PATCH /api/admin/interns/:id/extend
// Required body: end_date (must be after current end_date)
router.patch(
  '/admin/interns/:id/extend',
  authenticate,
  requireAdmin,
  validateExtend,
  extendInternship
);

// PATCH /api/admin/interns/:id/deactivate
// No body required
router.patch(
  '/admin/interns/:id/deactivate',
  authenticate,
  requireAdmin,
  deactivateIntern
);

// POST /api/admin/interns/:id/regenerate-token
// No body — generates new setup token if old one expired
router.post(
  '/admin/interns/:id/regenerate-token',
  authenticate,
  requireAdmin,
  regenerateSetupToken
);

// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// INTERN — Project Routes
// ─────────────────────────────────────────────

// POST   /api/intern/project        → create own project
// GET    /api/intern/project        → get own project
// PATCH  /api/intern/project        → update own project
router.post('/intern/project',   authenticateIntern, createProject);
router.get('/intern/project',    authenticateIntern, getMyProject);
router.patch('/intern/project',  authenticateIntern, updateProject);

// ─────────────────────────────────────────────
// INTERN — Task Routes
// ─────────────────────────────────────────────

// POST   /api/intern/tasks          → self create task
// GET    /api/intern/tasks          → get all own tasks
// PATCH  /api/intern/tasks/:id      → update own task
router.post('/intern/tasks',        authenticateIntern, createTask);
router.get('/intern/tasks',         authenticateIntern, getMyTasks);
router.patch('/intern/tasks/:id',   authenticateIntern, updateTask);

// ─────────────────────────────────────────────
// INTERN — WorkLog Routes
// ─────────────────────────────────────────────

// POST   /api/intern/worklogs       → create worklog
// GET    /api/intern/worklogs       → get own worklogs
// PATCH  /api/intern/worklogs/:id   → update worklog
router.post('/intern/worklogs',       authenticateIntern, createWorkLog);
router.get('/intern/worklogs',        authenticateIntern, getMyWorkLogs);
router.patch('/intern/worklogs/:id',  authenticateIntern, updateWorkLog);

// ─────────────────────────────────────────────
// ADMIN — Project Routes
// ─────────────────────────────────────────────

// GET    /api/admin/interns/:intern_id/project       → get intern's project
// PATCH  /api/admin/interns/:intern_id/project       → update mentor
router.get('/admin/interns/:intern_id/project',   authenticate, requireAdmin, getInternProject);
router.patch('/admin/interns/:intern_id/project', authenticate, requireAdmin, adminUpdateProject);

// ─────────────────────────────────────────────
// ADMIN — Task Routes
// ─────────────────────────────────────────────

// POST   /api/admin/intern/tasks              → assign task to intern
// GET    /api/admin/interns/:intern_id/tasks  → get intern's tasks
// PATCH  /api/admin/intern/tasks/:id          → update any intern task
router.post('/admin/intern/tasks',                authenticate, requireAdmin, adminAssignTask);
router.get('/admin/interns/:intern_id/tasks',     authenticate, requireAdmin, getInternTasks);
router.patch('/admin/intern/tasks/:id',           authenticate, requireAdmin, adminUpdateTask);

// ─────────────────────────────────────────────
// ADMIN — WorkLog Routes
// ─────────────────────────────────────────────

// GET  /api/admin/interns/:intern_id/worklogs → get intern's worklogs
router.get('/admin/interns/:intern_id/worklogs', authenticate, requireAdmin, getInternWorkLogs);

module.exports = router;