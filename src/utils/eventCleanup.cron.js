const cron = require("node-cron");
const { Event } = require("../models");
const { Op } = require("sequelize");

const scheduleEventCleanup = () => {
  // Runs every day at midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Soft delete all published events where event_date < today
      const deleted = await Event.destroy({
        where: {
          event_date:   { [Op.lt]: today },
          is_published: true,
          deleted_at:   null,
        },
      });

      console.log(`✅ Event cleanup: ${deleted} past event(s) soft deleted.`);
    } catch (error) {
      console.error("Event cleanup cron error:", error);
    }
  });
};

module.exports = { scheduleEventCleanup };