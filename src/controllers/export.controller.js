const ExcelJS = require("exceljs");
const { Call, Task, WorkLog, User, Project } = require("../models");

async function exportData(req, res) {
  try {
    const type = String(req.query.type || "").toLowerCase();
    if (!["calls", "tasks", "work-logs"].includes(type)) {
      return res.status(400).json({ message: "type must be one of: calls, tasks, work-logs" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(type);

    if (type === "calls") {
      const rows = await Call.findAll({ order: [["createdAt", "DESC"]] });
      sheet.columns = [
        { header: "id",           key: "id" },
        { header: "user_id",      key: "user_id" },
        { header: "caller_name",  key: "caller_name" },
        { header: "caller_number",key: "caller_number" },
        { header: "project_id",   key: "project_id" },
        { header: "call_type",    key: "call_type" },
        { header: "call_subtype", key: "call_subtype" },
        { header: "call_summary", key: "call_summary" },
        { header: "remarks",      key: "remarks" },
        { header: "receive_type", key: "receive_type" },
        { header: "createdAt",    key: "createdAt" },
      ];
      sheet.addRows(rows.map((r) => r.toJSON()));
    }

    if (type === "tasks") {
      const rows = await Task.findAll({ order: [["createdAt", "DESC"]] });
      sheet.columns = [
        { header: "id",          key: "id" },
        { header: "task",        key: "task" },
        { header: "description", key: "description" },
        { header: "assigned_to", key: "assigned_to" },
        { header: "assigned_by", key: "assigned_by" },
        { header: "status",      key: "status" },
        { header: "start_date",  key: "start_date" },
        { header: "due_date",    key: "due_date" },
        { header: "createdAt",   key: "createdAt" },
      ];
      sheet.addRows(rows.map((r) => r.toJSON()));
    }

    if (type === "work-logs") {
      const rows = await WorkLog.findAll({ order: [["date", "DESC"], ["createdAt", "DESC"]] });
      sheet.columns = [
        { header: "id",          key: "id" },
        { header: "user_id",     key: "user_id" },
        { header: "description", key: "description" },
        { header: "date",        key: "date" },
        { header: "createdAt",   key: "createdAt" },
      ];
      sheet.addRows(rows.map((r) => r.toJSON()));
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${type}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("exportData error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { exportData };
