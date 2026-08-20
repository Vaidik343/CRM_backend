'use strict';

const express = require('express');
const router = express.Router();
const { downloadBackup } = require('../controllers/backup.controller');

// ─────────────────────────────────────────────────────────────────────────────
// SECRET KEY — Only you know this exists.
// Change this to any long random string you prefer.
// To hide this endpoint completely: comment out the line in routeFiles[] in index.js
// ─────────────────────────────────────────────────────────────────────────────

function verifyBackupKey(req, res, next) {
  const key = req.headers['x-backup-key'];
  if (!key || key !== BACKUP_SECRET) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

/**
 * @swagger
 * tags:
 *   name: Backup
 *   description: Database and file backup (admin only)
 */

/**
 * @swagger
 * /api/backup/download:
 *   get:
 *     summary: Download full backup (DB + uploads) as a ZIP
 *     tags: [Backup]
 *     security: []
 *     parameters:
 *       - in: header
 *         name: x-backup-key
 *         required: true
 *         schema:
 *           type: string
 *         description: Secret backup key
 *     responses:
 *       200:
 *         description: ZIP file containing SQL dump and uploads folder
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized - wrong or missing key
 *       500:
 *         description: Backup generation failed
 */
router.get('/backup/download', verifyBackupKey, downloadBackup);

module.exports = router;
