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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for Excel (.xlsx, .xls) and CSV (.csv) files
const spreadsheetFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.csv', '.xlsx', '.xls'];
  const allowedMimeTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
    'application/wps-office.xlsx'
  ];

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only Excel spreadsheets (.xlsx, .xls) and CSV files (.csv) are supported.'), false);
  }
};

const uploadSpreadsheet = multer({
  storage: storage,
  fileFilter: spreadsheetFileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit for large multi-sheet workbooks
});

// Alias for backward compatibility
const uploadCSV = uploadSpreadsheet;

module.exports = {
  uploadSpreadsheet,
  uploadCSV
};
