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
  announceEvent,
  getDesignPreviews ,
  updateEvent
} = require("../controllers/event.controller");

const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin }  = require('../middlewares/role.middleware');
// Admin routes
router.post("/events", authenticate, requireAdmin, createEvent);
router.get("/events/admin/all", authenticate, requireAdmin, getAllEvents);
router.delete("/events/:id", authenticate, requireAdmin, deleteEvent);
router.post("/events/ai-preview", authenticate, requireAdmin, previewAICard);
router.patch("/events/:id/announce", authenticate, requireAdmin, announceEvent);
router.get("/events/design-previews", authenticate, requireAdmin, getDesignPreviews);

router.put("/events/:id", authenticate, requireAdmin, updateEvent);

// Shared
router.get("/events/shared", authenticate, getEmployeeEvents);
router.get("/events/shared/:id", authenticate, getEventById);
router.get("/events/shared/:id/export/png", authenticate, exportCardPNG);

module.exports = router; 