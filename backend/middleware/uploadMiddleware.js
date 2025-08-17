const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/books');
fs.ensureDirSync(uploadsDir);

// Configure multer for EPUB file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.id}-${uniqueSuffix}-${file.originalname}`);
  }
});

// File filter to accept only EPUB files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/epub+zip' || 
      path.extname(file.originalname).toLowerCase() === '.epub') {
    cb(null, true);
  } else {
    cb(new Error('Only EPUB files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

module.exports = upload;