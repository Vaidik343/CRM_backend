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
          { model: User,  as:"caller",   attributes: ["name", "employee_id"] },
          { model: Project, as:"project", attributes: ["name"] },
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

const exportMyData = async (req, res) => {
  try {
    const type = String(req.query.type || "").toLowerCase();
    if (!["calls", "tasks", "work-logs"].includes(type)) {
      return res.status(400).json({ message: "type must be one of: calls, tasks, work-logs" });
    }

    const { from, to } = req.query;
    const userId = req.user.id;

    const start = new Date(from || new Date());
    start.setHours(0, 0, 0, 0);
    const end = new Date(to || new Date());
    end.setHours(23, 59, 59, 999);
    const dateWhere = { createdAt: { [Op.between]: [start, end] } };

    // helper — flatten remarks array to readable string
    const flattenRemarks = (remarks) => {
      if (!Array.isArray(remarks) || remarks.length === 0) return "";
      return remarks
        .map((r) => `[${new Date(r.created_at).toLocaleDateString()} - ${r.added_by_name}]: ${r.text}`)
        .join("\n");
    };

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(type);

    if (type === "calls") {
      const rows = await Call.findAll({
        where: {
          ...dateWhere,
          // ✅ all calls by this user — creator, transfer recipient, or follow-up
          [Op.or]: [
            { user_id: userId },
            { transfer_to: userId },
          ],
        },
        include: [{ model: Project, as:"project", attributes: ["name"] }],
        order: [["createdAt", "DESC"]],
      });

      sheet.columns = [
        { header: "Display ID",    key: "display_id",    width: 20 },
        { header: "Project",       key: "project",       width: 20 },
        { header: "Caller Name",   key: "caller_name",   width: 20 },
        { header: "Caller Number", key: "caller_number", width: 18 },
        { header: "Call Type",     key: "call_type",     width: 15 },
        { header: "Call Subtype",  key: "call_subtype",  width: 20 },
        { header: "Medium",        key: "receive_type",  width: 15 },
        { header: "Summary",       key: "call_summary",  width: 30 },
        { header: "Remarks",       key: "remarks",       width: 40 },
        { header: "Created At",    key: "createdAt",     width: 20 },
      ];

      sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
        project: r.project?.name || "",
        remarks: flattenRemarks(r.remarks),
      })));
    }

    if (type === "tasks") {
      const rows = await Task.findAll({
        where: {
          ...dateWhere,
          [Op.or]: [
            { assigned_to: userId },
            { assigned_by: userId },
          ],
        },
        include: [
          { model: User, as: "assignee", attributes: ["name"] },
          { model: User, as: "assigner", attributes: ["name"] },
          { model: Project, as: "project", attributes: ["name"] },
        ],
        order: [["createdAt", "DESC"]],
      });

      sheet.columns = [
        { header: "Display ID",   key: "display_id",       width: 20 },
        { header: "Task",         key: "task",             width: 25 },
        { header: "Description",  key: "description",      width: 25 },
        { header: "Project",      key: "project",          width: 20 },
        { header: "Assigned To",  key: "assigned_to_name", width: 20 },
        { header: "Assigned By",  key: "assigned_by_name", width: 20 },
        { header: "Status",       key: "status",           width: 15 },
        { header: "Due Date",     key: "due_date",         width: 15 },
        { header: "Remarks",      key: "remarks",          width: 40 },
        { header: "Created At",   key: "createdAt",        width: 20 },
      ];

      sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
        project:          r.project?.name  || "",
        assigned_to_name: r.assignee?.name || "",
        assigned_by_name: r.assigner?.name || "",
        remarks:          flattenRemarks(r.remarks),
      })));
    }

    if (type === "work-logs") {
      let workLogWhere = { user_id: userId };
      if (from && to) {
        workLogWhere.date = { [Op.between]: [from, to] };
      } else {
        workLogWhere.date = new Date().toISOString().split("T")[0];
      }

      const rows = await WorkLog.findAll({
        where: workLogWhere,
            include: [{ model: Project, as: "Project", attributes: ["name"] }],
        order: [["date", "DESC"]],
      });

      sheet.columns = [
        { header: "Description", key: "description", width: 30 },
        { header: "Date",        key: "date",        width: 15 },
        { header: "Project",     key: "project",     width: 30 },
        { header: "Remarks",     key: "remarks",     width: 40 },
        { header: "Created At",  key: "createdAt",   width: 20 },
      ];

      sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
        project: r.Project?.name || "",  //
        remarks: flattenRemarks(r.remarks),
      })));
    }

    // style header row
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9EDF5" } };
    });

    const fileLabel = from && to ? `${from}_to_${to}` : new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${type}_${fileLabel}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("exportMyData error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const exportEmployeeData = async (req, res) => {
  try {
    const type = String(req.query.type || "").toLowerCase();
    console.log("🚀 ~ exportEmployeeData ~ type:", type)
    if (!["calls", "tasks", "work-logs"].includes(type)) {
      return res.status(400).json({ message: "type must be one of: calls, tasks, work-logs" });
    }

    const { from, to } = req.query;
    const targetUserId = req.params.userId;

    // Verify target user exists
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const start = new Date(from || new Date());
    start.setHours(0, 0, 0, 0);
    const end = new Date(to || new Date());
    end.setHours(23, 59, 59, 999);
    const dateWhere = { createdAt: { [Op.between]: [start, end] } };

    const flattenRemarks = (remarks) => {
      if (!Array.isArray(remarks) || remarks.length === 0) return "";
      return remarks
        .map((r) => `[${new Date(r.created_at).toLocaleDateString()} - ${r.added_by_name}]: ${r.text}`)
        .join("\n");
    };

    const workbook = new ExcelJS.Workbook();
    console.log("🚀 ~ exportEmployeeData ~ workbook:", workbook)
    
    const sheet = workbook.addWorksheet(type);
    console.log("🚀 ~ exportEmployeeData ~ sheet:", sheet)

    if (type === "calls") {
      const rows = await Call.findAll({
        
        where: {
          ...dateWhere,
          [Op.or]: [
            { user_id: targetUserId },
            { transfer_to: targetUserId },
          ],
          
        },
        include: [{ model: Project, as: "project", attributes: ["name"] }],
        order: [["createdAt", "DESC"]],
        
      });
      console.log("🚀 ~ exportEmployeeData ~ rows:", rows)

      sheet.columns = [
        
        { header: "Display ID",    key: "display_id",    width: 20 },
        { header: "Project",       key: "project",       width: 20 },
        { header: "Caller Name",   key: "caller_name",   width: 20 },
        { header: "Caller Number", key: "caller_number", width: 18 },
        { header: "Call Type",     key: "call_type",     width: 15 },
        { header: "Call Subtype",  key: "call_subtype",  width: 20 },
        { header: "Medium",        key: "receive_type",  width: 15 },
        { header: "Summary",       key: "call_summary",  width: 30 },
        { header: "Remarks",       key: "remarks",       width: 40 },
        { header: "Created At",    key: "createdAt",     width: 20 },
      ];

    const cc = sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
        project: r.project?.name || "",
        remarks: flattenRemarks(r.remarks),
      })));
    console.log("🚀 ~ exportEmployeeData ~ cc:", cc)
    }

    if (type === "tasks") {
      const rows = await Task.findAll({
        where: {
          ...dateWhere,
          [Op.or]: [
            { assigned_to: targetUserId },
            { assigned_by: targetUserId },
          ],
        },
        include: [
          { model: User, as: "assignee", attributes: ["name"] },
          { model: User, as: "assigner", attributes: ["name"] },
          { model: Project, as: "project", attributes: ["name"] },
        ],
        order: [["createdAt", "DESC"]],
      });

      sheet.columns = [
        { header: "Display ID",   key: "display_id",       width: 20 },
        { header: "Task",         key: "task",             width: 25 },
        { header: "Description",  key: "description",      width: 25 },
        { header: "Project",      key: "project",          width: 20 },
        { header: "Assigned To",  key: "assigned_to_name", width: 20 },
        { header: "Assigned By",  key: "assigned_by_name", width: 20 },
        { header: "Status",       key: "status",           width: 15 },
        { header: "Due Date",     key: "due_date",         width: 15 },
        { header: "Remarks",      key: "remarks",          width: 40 },
        { header: "Created At",   key: "createdAt",        width: 20 },
      ];

      sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
        project:          r.project?.name  || "",
        assigned_to_name: r.assignee?.name || "",
        assigned_by_name: r.assigner?.name || "",
        remarks:          flattenRemarks(r.remarks),
      })));
    }

if (type === "work-logs") {
  let workLogWhere = { user_id: targetUserId };
  if (from && to) {
    workLogWhere.date = { [Op.between]: [from, to] };
  } else {
    workLogWhere.date = new Date().toISOString().split("T")[0];
  }

  const rows = await WorkLog.findAll({
    where: workLogWhere,
    include: [{ model: Project, as: "Project", attributes: ["name"] }],  // ← add this
    order: [["date", "DESC"]],
  });
  console.log("🚀 ~ exportEmployeeData ~ rows:", rows)

  sheet.columns = [
    { header: "Description", key: "description", width: 30 },
    { header: "Date",        key: "date",        width: 15 },
    { header: "Project",     key: "project",     width: 30 },
    { header: "Remarks",     key: "remarks",     width: 40 },
    { header: "Created At",  key: "createdAt",   width: 20 },
  ];

 const cw =  sheet.addRows(rows.map((r) => ({
    ...r.toJSON(),
    project: r.Project?.name || "",  // 
    remarks: flattenRemarks(r.remarks),
  })));
 console.log("🚀 ~ exportEmployeeData ~ cw:", cw)
}
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9EDF5" } };
    });

    const fileLabel = from && to ? `${from}_to_${to}` : new Date().toISOString().split("T")[0];
    const empLabel = targetUser.employee_id || targetUser.name.replace(/\s+/g, "_");

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${empLabel}_${type}_${fileLabel}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("exportEmployeeData error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { exportData, exportMyData, exportEmployeeData };
// module.exports = { exportData };


