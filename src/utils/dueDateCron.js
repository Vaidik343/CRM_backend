const cron = require("node-cron");
const {Op, where} = require("sequelize");
const {Task, User, Call} = require("../models");
const {createNotification} = require("../controllers/notifications.controller");

const startDueDateCron = (io) => {
    // runs every day at   am

    cron.schedule("0 9 * * *", async () => {
        try {
            const today = new Date();
            const threeDaysLater = new Date();
            threeDaysLater.setDate(today.getDate() + 3);

            //Find task due within 3 days that are not closed

            const tasks = await Task.findAll({
                where: {
                    status: {[Op.ne]: "closed"},
                    due_data: {
                        [Op.between] : [today, threeDaysLater],
                    },
                },
                include:  [{model: User, as: "assignee", attributes: ["id", "name"]}],
            });

            for(const task of tasks)
            {
                await createNotification(io, {
                    user_id: task.assigned_to,
                    type: "TASK_ASSIGNED",
                    title: "New Task Assigned",
 message: `Task "${task.task}" is due on ${task.due_date}`,
          data:    { task_id: task.id, display_id: task.display_id, due_date: task.due_date },
                });
            }

             console.log(`✅ Due date cron ran — checked ${tasks.length} tasks`);
        } catch (error) {
              console.error("Due date cron error:", err); 
        }
    })
}

module.exports = {startDueDateCron};