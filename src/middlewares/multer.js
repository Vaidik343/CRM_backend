'use strict';

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const BASE_UPLOAD_PATH = process.env.UPLOAD_PATH
  ? path.join(process.env.UPLOAD_PATH, 'interns')
  : path.join(__dirname, '..', 'uploads', 'interns');

// ensure temp dir exists on startup
const tempPath = path.join(BASE_UPLOAD_PATH, 'temp');
if (!fs.existsSync(tempPath)) {
  fs.mkdirSync(tempPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempPath);
  },
  filename: function (req, file, cb) {
    const ext          = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '_' + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpg, png, webp) and documents (pdf, doc, docx) are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 4,                   // id_proof, photo, resume, marksheet
  },
});

// specific field config for intern registration
const internUpload = upload.fields([
  { name: 'id_proof',            maxCount: 1 },
  { name: 'photo',               maxCount: 1 },
  { name: 'resume',              maxCount: 1 },
  { name: 'last_sem_marksheet',  maxCount: 1 },
]);

module.exports = { upload, internUpload, tempPath, BASE_UPLOAD_PATH };