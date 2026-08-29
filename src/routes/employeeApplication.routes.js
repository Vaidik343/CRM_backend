'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// const { verifyToken, isAdmin } = require('../middleware/auth');
const { authenticate } = require("../middlewares/auth.middleware");
const ctrl = require('../controllers/employeeApplication.controller');

const { employeeUpload }       = require('../middlewares/employeeUpload');
// Submit new employee application (public — no auth)
router.post('/employee-applications/register',
   employeeUpload,
   ctrl.submitApplication);

// ── admin routes ──────────────────────────────────────────────────────────────

router.get('/employee-applications',authenticate, ctrl.getAllApplications);
router.get('/employee-applications/approved-pending', authenticate, ctrl.getApprovedPending);

router.get('/employee-applications/:id', authenticate, ctrl.getApplicationById);
router.patch('/employee-applications/:id/approve', authenticate, ctrl.approveApplication);
router.patch('/employee-applications/:id/reject', authenticate, ctrl.rejectApplication);
router.delete('/employee-applications/:id', authenticate, ctrl.deleteApplication);


module.exports = router;
