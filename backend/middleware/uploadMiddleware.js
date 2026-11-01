const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1e9);

    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  }
});

// File filter for CSV (.csv) files
const spreadsheetFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedExtensions = ['.csv'];

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error('Only CSV files are allowed'),
      false
    );
  }
};

const uploadSpreadsheet = multer({
  storage: storage,
  fileFilter: spreadsheetFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit
  }
});

// Alias for backward compatibility
const uploadCSV = uploadSpreadsheet;

module.exports = {
  uploadSpreadsheet,
  uploadCSV
};
