const express = require("express");
const router = express.Router();
const { getNotifications, markRead, markAllRead } = require("../controllers/notifications.controller");
const { authenticate } = require("../middlewares/auth.middleware");

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications — get all notifications (scoped by user)
router.get("/notifications", getNotifications);

// PATCH /api/notifications/read-all — mark all as read (must be before /:id route)
router.patch("/notifications/read-all", markAllRead);

// PATCH /api/notifications/:id/read — mark single as read
router.patch("/notifications/:id/read", markRead);

module.exports = router;