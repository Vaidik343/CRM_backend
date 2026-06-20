// utils/notificationCleanup.js
const { Op } = require("sequelize");
const { Notification } = require("../models");

const cleanupOldNotifications = async () => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const deletedCount = await Notification.destroy({
      where: {
        is_read: true,
        createdAt: { [Op.lt]: cutoff },
      },
    });

    console.log(`[notification-cleanup] Deleted ${deletedCount} read notifications older than 30 days`);
  } catch (err) {
    console.error("[notification-cleanup] error:", err);
  }
};

module.exports = { cleanupOldNotifications };