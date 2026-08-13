
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const BASE_UPLOAD_PATH = process.env.UPLOAD_PATH
  ? path.join(process.env.UPLOAD_PATH, 'leaves')
  : path.join(__dirname, '..', 'uploads', 'leaves');

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
    'application/pdf',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpg, png) and PDF files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
});
console.log("🚀 ~ upload:", upload)

// specific field config for leave medical document
const leaveUpload = upload.single('medical_document');
console.log("🚀 ~ leaveUpload:", leaveUpload)

module.exports = { leaveUpload, tempPath, BASE_UPLOAD_PATH };