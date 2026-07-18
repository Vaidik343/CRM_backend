const fs   = require('fs');
const path = require('path');

const BASE_UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');

/**
 * Move file from temp location to final destination.
 * Equivalent to cloudinary.uploader.upload()
 *
 * @param {string} tempFilePath  - path where multer saved the file temporarily
 * @param {string} subFolder     - e.g. 'interns/abc-uuid-123'
 * @param {string} fieldName     - e.g. 'id_proof', 'photo', 'resume'
 * @returns {{ url: string, file_path: string, original_name: string } | null}
 */
const moveUploadedFile = (tempFilePath, subFolder, fieldName) => {
  try {
    if (!tempFilePath) return null;

    // build final directory
    const finalDir = path.join(BASE_UPLOAD_PATH, subFolder);

    // create directory if it doesn't exist
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }

    // keep the same filename multer generated
    const fileName  = path.basename(tempFilePath);
    const finalPath = path.join(finalDir, fileName);

    // move file from temp → final
    fs.renameSync(tempFilePath, finalPath);

    // build public URL
    // e.g. /uploads/interns/abc-uuid/id_proof_123456789.jpg
    const publicUrl = `/uploads/${subFolder.replace(/\\/g, '/')}/${fileName}`;

    console.log(`File moved to: ${finalPath}`);

    return {
      file_path:     finalPath,   // absolute path on disk (for deletion)
      url:           publicUrl,   // relative URL to serve to frontend
      original_name: fileName,
    };

  } catch (error) {
    console.error('moveUploadedFile error:', error);

    // clean up temp file if move failed
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return null;
  }
};

/**
 * Delete a file from disk.
 * Equivalent to cloudinary.uploader.destroy()
 *
 * @param {string} filePath - absolute path on disk
 */
const deleteUploadedFile = (filePath) => {
  try {
    if (!filePath) return;

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File deleted: ${filePath}`);
    } else {
      console.warn(`File not found for deletion: ${filePath}`);
    }
  } catch (error) {
    console.error('deleteUploadedFile error:', error);
  }
};

/**
 * Delete entire folder (e.g. when intern record is deleted)
 *
 * @param {string} subFolder - e.g. 'interns/abc-uuid-123'
 */
const deleteInternFolder = (subFolder) => {
  try {
    const folderPath = path.join(BASE_UPLOAD_PATH, subFolder);

    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log(`Folder deleted: ${folderPath}`);
    }
  } catch (error) {
    console.error('deleteInternFolder error:', error);
  }
};

module.exports = {
  moveUploadedFile,
  deleteUploadedFile,
  deleteInternFolder,
};