const masterDataService = require('../services/masterDataService');
const csvIngestionService = require('../services/csvIngestionService');

/**
 * Thin Master Data Controller
 * Delegates data operations to MasterDataService and CSVIngestionService
 */

// ===================== STUDENTS =====================
async function getStudents(req, res) {
  try {
    const data = await masterDataService.getAllStudents();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function createStudent(req, res) {
  try {
    const id = await masterDataService.createStudent(req.body);
    res.status(201).json({ success: true, message: 'Student created successfully.', id });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function updateStudent(req, res) {
  try {
    await masterDataService.updateStudent(req.params.id, req.body);
    res.json({ success: true, message: 'Student updated successfully.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function deleteStudent(req, res) {
  try {
    await masterDataService.deleteStudent(req.params.id);
    res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

// ===================== FACULTY =====================
async function getFaculty(req, res) {
  try {
    const data = await masterDataService.getAllFaculty();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function createFaculty(req, res) {
  try {
    const id = await masterDataService.createFaculty(req.body);
    res.status(201).json({ success: true, message: 'Faculty created successfully.', id });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function updateFaculty(req, res) {
  try {
    await masterDataService.updateFaculty(req.params.id, req.body);
    res.json({ success: true, message: 'Faculty updated successfully.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function deleteFaculty(req, res) {
  try {
    await masterDataService.deleteFaculty(req.params.id);
    res.json({ success: true, message: 'Faculty deleted successfully.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

// ===================== COURSES =====================
async function getCourses(req, res) {
  try {
    const data = await masterDataService.getAllCourses();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function createCourse(req, res) {
  try {
    const id = await masterDataService.createCourse(req.body);
    res.status(201).json({ success: true, message: 'Course created successfully.', id });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function updateCourse(req, res) {
  try {
    await masterDataService.updateCourse(req.params.id, req.body);
    res.json({ success: true, message: 'Course updated successfully.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function deleteCourse(req, res) {
  try {
    await masterDataService.deleteCourse(req.params.id);
    res.json({ success: true, message: 'Course deleted successfully.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

// ===================== ROOMS =====================
async function getRooms(req, res) {
  try {
    const data = await masterDataService.getAllRooms();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function createRoom(req, res) {
  try {
    const id = await masterDataService.createRoom(req.body);
    res.status(201).json({ success: true, message: 'Room created successfully.', id });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function updateRoom(req, res) {
  try {
    await masterDataService.updateRoom(req.params.id, req.body);
    res.json({ success: true, message: 'Room updated successfully.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function deleteRoom(req, res) {
  try {
    await masterDataService.deleteRoom(req.params.id);
    res.json({ success: true, message: 'Room deleted successfully.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

// ===================== BULK CSV UPLOAD =====================
async function uploadMasterCSV(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No CSV file uploaded.' });
  }

  const { entityType } = req.params;
  const filePath = req.file.path;

  try {
    const summary = await csvIngestionService.ingestCSV(filePath, entityType);
    return res.status(200).json({
      success: true,
      message: `Bulk CSV ingestion completed for ${entityType}.`,
      summary
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  uploadMasterCSV
};
