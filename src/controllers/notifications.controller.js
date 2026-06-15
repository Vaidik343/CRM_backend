const { Notification, User } = require("../models");

/**
 * Internal helper — called by other controllers (tasks, calls, projects)
 * Saves notification to DB and emits to user's socket room.
 *
 * Usage:
 *   const { createNotification } = require("./notifications.controller");
 *   await createNotification(io, {
 *     user_id, type, title, message, data
 *   });
 */
const createNotification = async (io, { user_id, type, title, message, data = {} }) => {
  try {
    const notification = await Notification.create({
      user_id,
      type,
      title,
      message,
      data,
      is_read: false,
    });

    // Emit to user's private room
    if (io) {
      const payload = {
        id:         notification.id,
        type:       notification.type,
        title:      notification.title,
        message:    notification.message,
        data:       notification.data,
        is_read:    notification.is_read,
        createdAt:  notification.createdAt,
      };

      io.to(`user:${user_id}`).emit("notification", payload);

      // also notify admins in real-time, even though this notification
      // belongs to an employee
      io.to("user:admins_room").emit("notification", payload);
    }

    return notification;
  } catch (err) {
    // Non-fatal — log but don't crash the calling controller
    console.error("createNotification error:", err);
    return null;
  }
};

// ── Route handlers ────────────────────────────────────────────────────────────

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const where = req.user.is_admin ? {} : { user_id: req.user.id };

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const unreadCount = await Notification.count({
      where: { ...where, is_read: false },
    });

    return res.status(200).json({
      message: "List of notifications",
      data: rows,
      total: count,
      unread: unreadCount,
      page,
      limit,
    });
  } catch (err) {
    console.error("getNotifications error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Employee can only mark their own
    if (!req.user.is_admin && notification.user_id !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await notification.update({ is_read: true });
    return res.status(200).json({ message: "Marked as read", notification });
  } catch (err) {
    console.error("markRead error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    const where = req.user.is_admin
      ? { is_read: false }
      : { user_id: req.user.id, is_read: false };

    await Notification.update({ is_read: true }, { where });

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("markAllRead error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createNotification,   // internal helper — import this in other controllers
  getNotifications,
  markRead,
  markAllRead,
};