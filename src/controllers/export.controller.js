const ExcelJS = require("exceljs");
const { Call, Task, WorkLog, User, Project } = require("../models");
const { Op } = require("sequelize");

const exportData = async (req, res) => {
  try {
    const type = String(req.query.type || "").toLowerCase();
    if (!["calls", "tasks", "work-logs"].includes(type)) {
      return res.status(400).json({ message: "type must be one of: calls, tasks, work-logs" });
    }

    // date filter
    const { date, from, to } = req.query;
    let dateWhere = {};

    if (date) {
      // single date — full day range
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      dateWhere = { createdAt: { [Op.between]: [start, end] } };
    } else if (from && to) {
      // date range
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      dateWhere = { createdAt: { [Op.between]: [start, end] } };
    } else {
      // default — today
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      dateWhere = { createdAt: { [Op.between]: [start, end] } };
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(type);

    if (type === "calls") {
      const rows = await Call.findAll({
        where: dateWhere,
        include: [
          { model: User,    attributes: ["name", "employee_id"] },
          { model: Project, attributes: ["name"] },
        ],
        order: [["createdAt", "DESC"]],
      });
 sheet.columns = [
  // { header: "ID",           key: "id", width: 35 },
  { header: "Employee",     key: "employee", width: 20 },
  { header: "Employee ID",  key: "employee_id", width: 15 },
  { header: "Project",      key: "project", width: 20 },
  { header: "Caller Name",  key: "caller_name", width: 20 },
  { header: "Caller Number",key: "caller_number", width: 18 },
  { header: "Call Type",    key: "call_type", width: 15 },
  { header: "Call Subtype", key: "call_subtype", width: 20 },
  { header: "Receive Type", key: "receive_type", width: 15 },
  { header: "Summary",      key: "call_summary", width: 30 },
  { header: "Remarks",      key: "remarks", width: 30 },
  { header: "Created At",   key: "createdAt", width: 20 }, // increase this
];
      sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
        employee:    r.User?.name        || "",
        employee_id: r.User?.employee_id || "",
        project:     r.Project?.name     || "",
      })));
    }

    if (type === "tasks") {
      const rows = await Task.findAll({
        where: dateWhere,
        include: [
          { model: User, as: "assignee", attributes: ["name", "employee_id"] },
          { model: User, as: "assigner", attributes: ["name", "employee_id"] },
        ],
        order: [["createdAt", "DESC"]],
      });
      sheet.columns = [
        // { header: "ID",           key: "id" , width: 35},
        { header: "Task",         key: "task" , width: 25},
        { header: "Description",  key: "description", width: 25 },
        { header: "Assigned To",  key: "assigned_to_name", width: 25 },
        { header: "Assigned By",  key: "assigned_by_name", width: 25 },
        { header: "Status",       key: "status" , width: 25},
        { header: "Start Date",   key: "start_date" , width: 25},
        { header: "Due Date",     key: "due_date", width: 25 },
        { header: "Created At",   key: "createdAt", width: 25 },
      ];
      sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
        assigned_to_name: r.assignee?.name || "",
        assigned_by_name: r.assigner?.name || "",
      })));
    }

    if (type === "work-logs") {
      // work logs use date field not createdAt
      let workLogWhere = {};
      if (date) {
        workLogWhere = { date };
      } else if (from && to) {
        workLogWhere = { date: { [Op.between]: [from, to] } };
      } else {
        workLogWhere = { date: new Date().toISOString().split("T")[0] };
      }

      const rows = await WorkLog.findAll({
        where: workLogWhere,
        include: [{ model: User, attributes: ["name", "employee_id"] }],
        order: [["date", "DESC"]],
      });
      sheet.columns = [
        // { header: "ID",          key: "id" , width: 35},
        { header: "Employee",    key: "employee", width: 25 },
        { header: "Employee ID", key: "employee_id", width: 25 },
        { header: "Description", key: "description" , width: 25},
        { header: "Date",        key: "date" , width: 25},
        { header: "Created At",  key: "createdAt", width: 25 },
      ];
      sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
        employee:    r.User?.name        || "",
        employee_id: r.User?.employee_id || "",
      })));
    }

    // filename reflects filter
    const fileLabel = date ? date : from && to ? `${from}_to_${to}` : "today";
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${type}_${fileLabel}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("exportData error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { exportData };


