const cron = require("node-cron");
const { Event, User } = require("../models");
const { createNotification } = require("../controllers/notifications.controller");
const { Op } = require("sequelize");

const scheduleEventNotifications = (io) => {
  // Runs every day at 9:30 AM
  cron.schedule("30 9 * * *", async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const events = await Event.findAll({
        where: {
          event_date: today,
          is_published: true,
        },
      });

      if (!events.length) return;

      // Get all active employees
      const employees = await User.findAll({
        where: { is_active: true },
        attributes: ["id"],
      });

      for (const event of events) {
        for (const employee of employees) {
          await createNotification(io, {
            user_id: employee.id,
            type: "EVENT",
            title: getEventTitle(event.event_type),
            message: getEventMessage(event),
            data: { event_id: event.id },
          });
        }
      }

      console.log(`✅ Event notifications sent for ${today} — ${events.length} event(s)`);
    } catch (error) {
      console.error("Event cron error:", error);
    }
  });
};

const getEventTitle = (type) => {
  const titles = {
    birthday:  "🎂 Birthday Today!",
    promotion: "🏆 Promotion Announcement",
    office:    "🏢 Office Event",
    trip:      "✈️ Company Trip",
    fun_game:  "🎮 Fun & Games",
  };
  return titles[type] || "📅 Event Today";
};

const getEventMessage = (event) => {
  const messages = {
    birthday:  `Today is ${event.employee_name}'s birthday! 🎉 Wish them a great day!`,
    promotion: `Congratulations to ${event.employee_name} on their promotion! 🚀`,
    office:    `Office event today featuring ${event.employee_name}. Check it out!`,
    trip:      `Company trip day! ${event.employee_name} — have a great time! ✈️`,
    fun_game:  `Fun & games today! Join ${event.employee_name} for some team activities! 🎮`,
  };
  return messages[event.event_type] || `Event today: ${event.employee_name}`;
};

module.exports = { scheduleEventNotifications };