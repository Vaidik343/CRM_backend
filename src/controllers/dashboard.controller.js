const { Op } = require("sequelize");
const { User, Call, Task, WorkLog, Role } = require("../models");

const getDashboard = async (req, res) => {
  try {
    const { from, to } = req.query;

    // ── Totals section filter ─────────────────────────────
    let totalsWhere = {};
    if (from && to) {
      const start = new Date(from); start.setHours(0, 0, 0, 0);
      const end   = new Date(to);   end.setHours(23, 59, 59, 999);
      totalsWhere = { createdAt: { [Op.between]: [start, end] } };
    }

    // ── Activity section filter ───────────────────────────
    const { actFrom, actTo } = req.query;
    let activityWhere = {};
    if (actFrom && actTo) {
      const start = new Date(actFrom); start.setHours(0, 0, 0, 0);
      const end   = new Date(actTo);   end.setHours(23, 59, 59, 999);
      activityWhere = { createdAt: { [Op.between]: [start, end] } };
    } else {
      // default last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      activityWhere = { createdAt: { [Op.gte]: sevenDaysAgo } };
    }

    const [totalEmployees, totalCalls, totalTasks, totalWorkLogs] = await Promise.all([
      User.count({ where: { is_admin: false, ...totalsWhere } }),
      Call.count({ where: totalsWhere }),
      Task.count({ where: totalsWhere }),
      WorkLog.count({ where: totalsWhere }),
    ]);

    const [recentCalls, recentTasks, recentWorkLogs] = await Promise.all([
      Call.count({ where: activityWhere }),
      Task.count({ where: activityWhere }),
      WorkLog.count({ where: activityWhere }),
    ]);

    const taskStatusRows = await Task.findAll({
      attributes: ["status", [Task.sequelize.fn("COUNT", Task.sequelize.col("status")), "count"]],
      where: totalsWhere,
      group: ["status"],
      raw: true,
    });
    const taskStatusBreakdown = { open: 0, ongoing: 0, closed: 0 };
    taskStatusRows.forEach((r) => { taskStatusBreakdown[r.status] = parseInt(r.count); });

    const callTypeRows = await Call.findAll({
      attributes: ["call_type", [Call.sequelize.fn("COUNT", Call.sequelize.col("call_type")), "count"]],
      where: totalsWhere,
      group: ["call_type"],
      raw: true,
    });
    const callTypeBreakdown = { inquiry: 0, request: 0, complaint: 0 };
    callTypeRows.forEach((r) => { callTypeBreakdown[r.call_type] = parseInt(r.count); });

    const employees = await User.findAll({
      where: { is_admin: false },
      attributes: ["id", "name", "employee_id"],
      include: [{ model: Role, attributes: ["name"] }],
      raw: true,
      nest: true,
    });

    const employeeIds = employees.map((e) => e.id);
    const empWhere = { ...totalsWhere };

    const [empCalls, empTasks, empLogs] = await Promise.all([
      Call.findAll({
        attributes: ["user_id", [Call.sequelize.fn("COUNT", Call.sequelize.col("user_id")), "count"]],
        where: { user_id: { [Op.in]: employeeIds }, ...empWhere },
        group: ["user_id"], raw: true,
      }),
      Task.findAll({
        attributes: ["assigned_to", [Task.sequelize.fn("COUNT", Task.sequelize.col("assigned_to")), "count"]],
        where: { assigned_to: { [Op.in]: employeeIds }, ...empWhere },
        group: ["assigned_to"], raw: true,
      }),
      WorkLog.findAll({
        attributes: ["user_id", [WorkLog.sequelize.fn("COUNT", WorkLog.sequelize.col("user_id")), "count"]],
        where: { user_id: { [Op.in]: employeeIds }, ...empWhere },
        group: ["user_id"], raw: true,
      }),
    ]);

    const callMap = Object.fromEntries(empCalls.map((r) => [r.user_id,     parseInt(r.count)]));
    const taskMap = Object.fromEntries(empTasks.map((r) => [r.assigned_to, parseInt(r.count)]));
    const logMap  = Object.fromEntries(empLogs.map((r)  => [r.user_id,     parseInt(r.count)]));

    const employeeBreakdown = employees.map((e) => ({
      id:          e.id,
      name:        e.name,
      employee_id: e.employee_id,
      role:        e.Role?.name || null,
      calls:       callMap[e.id] || 0,
      tasks:       taskMap[e.id] || 0,
      work_logs:   logMap[e.id]  || 0,
    }));

    return res.json({
      totals:                 { employees: totalEmployees, calls: totalCalls, tasks: totalTasks, work_logs: totalWorkLogs },
      last_7_days:            { calls: recentCalls, tasks: recentTasks, work_logs: recentWorkLogs },
      task_status_breakdown:  taskStatusBreakdown,
      call_type_breakdown:    callTypeBreakdown,
      employee_breakdown:     employeeBreakdown,
    });
  } catch (err) {
    console.error("getDashboard error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getDashboard };