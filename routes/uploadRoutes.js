const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'file-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

module.exports = (uploadController) => {
  const router = express.Router();
  
  // POST /upload/
  router.post('/', upload.single('file'), (req, res) => {
    console.log('Upload route hit');
    uploadController.uploadMusic(req, res);
  });
  
  // POST /upload/batch
  router.post('/batch', upload.array('files', 10), (req, res) => {
    uploadController.uploadMultipleMusic(req, res);
  });

  return router;
};