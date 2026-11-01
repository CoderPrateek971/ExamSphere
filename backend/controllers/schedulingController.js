const schedulingService = require('../services/schedulingService');

/**
 * Thin Scheduling Controller
 * Delegates scheduling logic, live conflict detection, automated timetable generation,
 * and matrix visualization to SchedulingService
 */

async function getExams(req, res) {
  try {
    const data = await schedulingService.getAllExams(req.query);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function getExam(req, res) {
  try {
    const data = await schedulingService.getExamById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function validateSlot(req, res) {
  try {
    const result = await schedulingService.validateExamSlot(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function suggestSlot(req, res) {
  try {
    const result = await schedulingService.findOptimalSlotForExam(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function createExam(req, res) {
  try {
    const id = await schedulingService.createExam(req.body);
    res.status(201).json({ success: true, message: 'Exam scheduled successfully.', id });
  } catch (err) {
    res.status(err.statusCode || 500).json({ 
      success: false, 
      message: err.message,
      conflicts: err.conflicts || []
    });
  }
}

async function updateExam(req, res) {
  try {
    await schedulingService.updateExam(req.params.id, req.body);
    res.json({ success: true, message: 'Exam schedule updated successfully.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ 
      success: false, 
      message: err.message,
      conflicts: err.conflicts || []
    });
  }
}

async function deleteExam(req, res) {
  try {
    await schedulingService.deleteExam(req.params.id);
    res.json({ success: true, message: 'Exam deleted successfully.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function detectConflicts(req, res) {
  try {
    const result = await schedulingService.detectConflicts();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function generateTimetable(req, res) {
  try {
    const result = await schedulingService.generateAutomatedTimetable(req.body);
    res.status(201).json({ success: true, message: result.message, data: result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function getTimetableMatrix(req, res) {
  try {
    const result = await schedulingService.getTimetableMatrix(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function seedDemoSchedule(req, res) {
  try {
    const result = await schedulingService.seedDemoSchedule();
    res.status(201).json({ success: true, message: 'Demo examination schedule generated successfully.', data: result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function autoResolve(req, res) {
  try {
    const result = await schedulingService.autoResolveConflicts(req.body);
    res.json({ success: true, message: result.message, data: result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function clearSchedule(req, res) {
  try {
    const result = await schedulingService.clearAllExams();
    res.json({ success: true, message: result.message });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function getDatesSpan(req, res) {
  try {
    const data = await schedulingService.getTimetableDatesSpan();
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function saveDatesSpan(req, res) {
  try {
    const data = await schedulingService.saveTimetableDatesSpan(req.body);
    res.json({ success: true, message: data.message, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getExams,
  getExam,
  validateSlot,
  createExam,
  updateExam,
  deleteExam,
  detectConflicts,
  generateTimetable,
  getTimetableMatrix,
  autoResolve,
  suggestSlot,
  seedDemoSchedule,
  clearSchedule,
  getDatesSpan,
  saveDatesSpan
};

