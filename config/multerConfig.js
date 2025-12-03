const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const audioDir = path.join(uploadsDir, 'audio');
const videoDir = path.join(uploadsDir, 'video');

[uploadsDir, audioDir, videoDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine if it's audio or video based on mimetype
    if (file.mimetype.startsWith('audio/')) {
      cb(null, audioDir);
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, videoDir);
    } else {
      cb(new Error('Invalid file type'), null);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedAudioTypes = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 
    'audio/aac', 'audio/ogg', 'audio/x-m4a'
  ];
  
  const allowedVideoTypes = [
    'video/mp4', 'video/avi', 'video/mkv', 'video/mov',
    'video/webm', 'video/x-msvideo'
  ];

  if (file.mimetype.startsWith('audio/') && allowedAudioTypes.includes(file.mimetype)) {
    cb(null, true);
  } else if (file.mimetype.startsWith('video/') && allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio and video files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

module.exports = { upload, audioDir, videoDir };