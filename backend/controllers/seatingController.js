const seatingService = require('../services/seatingService');

/**
 * Thin Seating Controller
 * Delegates anti-cheating seating logic to SeatingService
 */

async function allocateSeating(req, res) {
  try {
    const { examId, roomIds, strategy } = req.body;
    if (!examId) {
      return res.status(400).json({ success: false, message: 'examId is required.' });
    }
    const result = await seatingService.allocateSeatingForExam(examId, { roomIds, strategy });
    res.status(200).json({ success: true, message: result.message, data: result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function getSeatingForExam(req, res) {
  try {
    const data = await seatingService.getSeatingByExam(req.params.examId);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function getRoomSeatingGrid(req, res) {
  try {
    const { roomId } = req.params;
    const { examId } = req.query;
    const data = await seatingService.getRoomSeatingGrid(roomId, examId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function getRoomsOverview(req, res) {
  try {
    const { examId } = req.query;
    const data = await seatingService.getRoomsOverview(examId);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function clearAllocations(req, res) {
  try {
    await seatingService.clearAllocations(req.params.examId);
    res.json({ success: true, message: 'Seat allocations cleared successfully.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

module.exports = {
  allocateSeating,
  getSeatingForExam,
  getRoomSeatingGrid,
  getRoomsOverview,
  clearAllocations
};
