const express = require("express");
const router = express.Router();
const {
  createEvent,
  getAllEvents,
  getEmployeeEvents,
  getEventById,
  deleteEvent,
  exportCardPNG,
  previewAICard,
} = require("../controllers/event.controller");

const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin }  = require('../middlewares/role.middleware');
// Admin routes
router.post("/event", authenticate, requireAdmin, createEvent);
router.get("/event/admin/all", authenticate, requireAdmin, getAllEvents);
router.delete("event/:id", authenticate, requireAdmin, deleteEvent);
router.post("/event/ai-preview", authenticate, requireAdmin, previewAICard);

// Shared
router.get("/event/shared", authenticate, getEmployeeEvents);
router.get("/event/shared/:id", authenticate, getEventById);
router.get("/event/shared/:id/export/png", authenticate, exportCardPNG);

module.exports = router; 