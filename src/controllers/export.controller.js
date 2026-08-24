const ExcelJS = require("exceljs");
const { Call, Task, WorkLog, User, Project, ProjectMember, Role, TaskStatusLog, LeaveRequest, LeaveBalance } = require("../models");
const { Op } = require("sequelize");
const PDFDocument = require("pdfkit");

 
  const flattenStatusLogs = (logs) => {
  if (!Array.isArray(logs) || logs.length === 0) return "";
  return logs
    .map((l) => {
      const transition = l.from_status
        ? `${l.from_status} → ${l.to_status}`
        : `Created as ${l.to_status}`;
      const by = l.changedBy?.name || "—";
      const at = new Date(l.changed_at).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
      const reason = l.reason ? ` | Reason: ${l.reason}` : "";
      return `[${at}] ${transition} — By ${by}${reason}`;
    })
    .join("\n");
};



const exportData = async (req, res) => {
  try {
    const type = String(req.query.type || "").toLowerCase();
    console.log("🚀 ~ exportData ~ type:", type)
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
  { header: "Created At",   key: "createdAt", width: 30 }, // increase this
];
      sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
        employee:    r.User?.name        || "",
        employee_id: r.User?.employee_id || "",
        project:     r.Project?.name     || "",
      })));
    }
sheet.getColumn(11).numFmt = "dd/mm/yyyy hh:mm AM/PM";

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
    { header: "Completed At",   key: "completedAt",      width: 30 },
  { header: "Created At",     key: "createdAt",        width: 30 },
  { header: "Updated At",     key: "updatedAt",        width: 30 },

      ];
      sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
        assigned_to_name: r.assignee?.name || "",
        assigned_by_name: r.assigner?.name || "",
      })));
    }

    sheet.getColumn(8).numFmt = "dd/mm/yyyy hh:mm AM/PM";  // Completed At
sheet.getColumn(9).numFmt = "dd/mm/yyyy hh:mm AM/PM";  // Created At
sheet.getColumn(10).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Updated At


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
        include: [{ model: User, as: 'user' ,attributes: ["name", "employee_id"] }],
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
    sheet.getColumn(2).numFmt = "dd/mm/yyyy";              // Date
sheet.getColumn(5).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Created At

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
          createdAt: r.createdAt,
        project: r.project?.name || "",
        remarks: flattenRemarks(r.remarks),
      })));
    }

    sheet.getColumn(10).numFmt = "dd/mm/yyyy hh:mm AM/PM"; 

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
         { header: "Updated At",    key: "updatedAt",        width: 20 },
      ];

      sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
         createdAt: r.createdAt,
  due_date: r.due_date,
        project:          r.project?.name  || "",
        assigned_to_name: r.assignee?.name || "",
        assigned_by_name: r.assigner?.name || "",
        remarks:          flattenRemarks(r.remarks),
      })));
    }

    sheet.getColumn(11).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Created At
sheet.getColumn(12).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Updated At

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
          createdAt: r.createdAt,
  date: r.date,
        project: r.Project?.name || "",  //
        remarks: flattenRemarks(r.remarks),
      })));
    }
sheet.getColumn(2).numFmt = "dd/mm/yyyy";              // Date
sheet.getColumn(5).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Created At
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

    const { from, to, project_id  } = req.query;
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
      const where = {
        ...dateWhere,
        [Op.or]: [{ user_id: targetUserId }, { transfer_to: targetUserId }],
      };
      if (project_id) where.project_id = project_id;  // ← add filter

      const rows = await Call.findAll({
        where,
        include: [{ model: Project, as: "project", attributes: ["name"] }],
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
        { header: "Activity Timeline", key: "activity", width: 70 },
      ];
sheet.getColumn(10).numFmt = "dd/mm/yyyy hh:mm AM/PM";

    const cc = sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
         createdAt: r.createdAt, // Date object
        project: r.project?.name || "",
         activity: flattenStatusLogs(r.statusLogs),
        remarks: flattenRemarks(r.remarks),
      })));
    console.log("🚀 ~ exportEmployeeData ~ cc:", cc)
    }


    if (type === "tasks") {
      const where = {
        ...dateWhere,
        [Op.or]: [{ assigned_to: targetUserId }, { assigned_by: targetUserId }],
      };
      if (project_id) where.project_id = project_id;  // ← add filter

      const rows = await Task.findAll({
        where,
        include: [
          { model: User, as: "assignee", attributes: ["name"] },
          { model: User, as: "assigner", attributes: ["name"] },
          { model: Project, as: "project", attributes: ["name"] },
           {                                          
      model: TaskStatusLog,
      as: "statusLogs",
      include: [{ model: User, as: "changedBy", attributes: ["name"] }],
      order: [["changed_at", "ASC"]],
    },
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
        { header: "Created At",   key: "createdAt",        width: 20 },
        { header: "Updated At",   key: "updatedAt",        width: 20 },
        { header: "Due Date",     key: "due_date",         width: 15 },
        { header: "Completed Date",     key: "completedAt",         width: 20 },
        { header: "Remarks",      key: "remarks",          width: 40 },
        { header: "Status History",  key: "status_history",   width: 50 }, 
      ];


      sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
          createdAt: r.createdAt,
  due_date: r.due_date,
        project:          r.project?.name  || "",
        assigned_to_name: r.assignee?.name || "",
        assigned_by_name: r.assigner?.name || "",
        remarks:          flattenRemarks(r.remarks),
         status_history:   flattenStatusLogs(r.statusLogs || []),
      })));
    }
sheet.getColumn(8).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Created At
sheet.getColumn(9).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Due Date
sheet.getColumn(13).alignment = { wrapText: true, vertical: "top" };

    if (type === "work-logs") {
      let workLogWhere = { user_id: targetUserId };
      if (from && to) workLogWhere.date = { [Op.between]: [from, to] };
      else workLogWhere.date = new Date().toISOString().split("T")[0];
      if (project_id) workLogWhere.project_id = project_id;  // ← add filter

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


 const cw =  sheet.addRows(rows.map((r) => ({
    ...r.toJSON(),
      createdAt: r.createdAt,
  date: r.date,
    project: r.Project?.name || "",  // 
    remarks: flattenRemarks(r.remarks),
  })));
  sheet.getColumn(2).numFmt = "dd/mm/yyyy";
sheet.getColumn(5).numFmt = "dd/mm/yyyy hh:mm AM/PM";

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

const exportAllEmployeeData = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const { from, to , project_id  } = req.query;

    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) return res.status(404).json({ message: "Employee not found" });

    const start = new Date(from || new Date()); start.setHours(0, 0, 0, 0);
    const end   = new Date(to   || new Date()); end.setHours(23, 59, 59, 999);

    const flattenRemarks = (remarks) => {
      if (!Array.isArray(remarks) || remarks.length === 0) return "";
      return remarks
        .map((r) => `[${new Date(r.created_at).toLocaleDateString()} - ${r.added_by_name}]: ${r.text}`)
        .join("\n");
    };

    const workbook = new ExcelJS.Workbook();

    // ── Sheet 1: Calls ────────────────────────────────────────────
    const callSheet = workbook.addWorksheet("Calls");
    callSheet.columns = [
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


       const callWhere = {
      createdAt: { [Op.between]: [start, end] },
      [Op.or]: [{ user_id: targetUserId }, { transfer_to: targetUserId }],
    };
    if (project_id) callWhere.project_id = project_id;  

    const calls = await Call.findAll({
      where: callWhere,
      include: [{ model: Project, as: "project", attributes: ["name"] }],
      order: [["createdAt", "DESC"]],
    });


    callSheet.addRows(calls.map((r) => ({
      ...r.toJSON(),
      project: r.project?.name || "",
      remarks: flattenRemarks(r.remarks),
    })));

    // Total row
const callTotalRow = callSheet.addRow({
  display_id: "TOTAL CALLS",
  project: calls.length,
});

callTotalRow.font = { bold: true };
callTotalRow.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFDE9D9" },
};

    callSheet.getColumn(10).numFmt = "dd/mm/yyyy hh:mm AM/PM";
    callSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9EDF5" } };
    });

    // ── Sheet 2: Tasks ────────────────────────────────────────────
    const taskSheet = workbook.addWorksheet("Tasks");
    taskSheet.columns = [
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
        { header: "Status History",  key: "status_history",   width: 50 },
    ];



   const taskWhere = {
      createdAt: { [Op.between]: [start, end] },
      [Op.or]: [{ assigned_to: targetUserId }, { assigned_by: targetUserId }],
    };
    if (project_id) taskWhere.project_id = project_id;  // ← add

    const tasks = await Task.findAll({
      where: taskWhere,
      include: [
        { model: User,    as: "assignee", attributes: ["name"] },
        { model: User,    as: "assigner", attributes: ["name"] },
        { model: Project, as: "project",  attributes: ["name"] },
         {                                          
      model: TaskStatusLog,
      as: "statusLogs",
      include: [{ model: User, as: "changedBy", attributes: ["name"] }],
      order: [["changed_at", "ASC"]],
    },
      ],
      order: [["createdAt", "DESC"]],
    });
    taskSheet.addRows(tasks.map((r) => ({
      ...r.toJSON(),
      project:          r.project?.name  || "",
      assigned_to_name: r.assignee?.name || "",
      assigned_by_name: r.assigner?.name || "",
      remarks:          flattenRemarks(r.remarks),
       status_history:   flattenStatusLogs(r.statusLogs || []),
    })));

    const taskTotalRow = taskSheet.addRow({
  display_id: "TOTAL TASKS",
  task: tasks.length,
});

taskTotalRow.font = { bold: true };
taskTotalRow.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFDE9D9" },
};
  taskSheet.getColumn(9).numFmt = "dd/mm/yyyy hh:mm AM/PM";              // Date
taskSheet.getColumn(10).numFmt = "dd/mm/yyyy hh:mm AM/PM"; 
taskSheet.getColumn(11).alignment = { wrapText: true, vertical: "top" };

    taskSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9EDF5" } };
    });

    // ── Sheet 3: Work Logs ────────────────────────────────────────
    const wlSheet = workbook.addWorksheet("Work Logs");
    wlSheet.columns = [
      { header: "Description", key: "description", width: 30 },
      { header: "Date",        key: "date",        width: 15 },
      { header: "Project",     key: "project",     width: 30 },
      { header: "Remarks",     key: "remarks",     width: 40 },
      { header: "Created At",  key: "createdAt",   width: 20 },
    ];
   const workLogWhere = {
      user_id: targetUserId,
      date: from && to
        ? { [Op.between]: [from, to] }
        : new Date().toISOString().split("T")[0],
    };
    if (project_id) workLogWhere.project_id = project_id;  // ← add

    const workLogs = await WorkLog.findAll({
      where: workLogWhere,
      include: [{ model: Project, as: "Project", attributes: ["name"] }],
      order: [["date", "DESC"]],
    });

    
    wlSheet.addRows(workLogs.map((r) => ({
      ...r.toJSON(),
      project: r.Project?.name || "",
      remarks: flattenRemarks(r.remarks),
    })));

const workLogTotalRow = wlSheet.addRow({
  description: "TOTAL WORK LOGS",
  project: workLogs.length,   // column C instead of Date column
});

workLogTotalRow.font = { bold: true };
workLogTotalRow.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFDE9D9" },
};
    
    wlSheet.getColumn(2).numFmt = "dd/mm/yyyy";              // Date
wlSheet.getColumn(5).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Created At
    wlSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9EDF5" } };
    });

    // ── Send ──────────────────────────────────────────────────────
    const fileLabel = from && to ? `${from}_to_${to}` : new Date().toISOString().split("T")[0];
    const empLabel  = targetUser.employee_id || targetUser.name.replace(/\s+/g, "_");

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${empLabel}_all_${fileLabel}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("exportAllEmployeeData error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};



const exportProjectData = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { from, to } = req.query;

    const project = await Project.findByPk(projectId, {
      include: [
        { model: User, as: "creator", attributes: ["name"] },
        { model: ProjectMember, as: "members", include: [
          { model: User, as: "user", attributes: ["name", "employee_id"] },
          { model: Role, as: "role", attributes: ["name"] },
        ]},
      ],
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!req.user.is_admin) {
      const membership = await ProjectMember.findOne({
        where: { project_id: projectId, user_id: req.user.id, is_active: true },
      });
      if (!membership) {
        return res.status(403).json({ message: "You are not a member of this project" });
      }
    }

    let dateWhere = {};
    if (from && to) {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      dateWhere = { createdAt: { [Op.between]: [start, end] } };
    }

    const flattenRemarks = (remarks) => {
      if (!Array.isArray(remarks) || remarks.length === 0) return "";
      return remarks
        .map((r) => `[${new Date(r.created_at).toLocaleDateString()} - ${r.added_by_name}]: ${r.text}`)
        .join("\n");
    };

    const workbook = new ExcelJS.Workbook();

    // --- Project Info sheet ---
    const infoSheet = workbook.addWorksheet("Project Info");
    infoSheet.columns = [
      { header: "Field", key: "field", width: 22 },
      { header: "Value", key: "value", width: 60 },
    ];

    const projectTypesStr = Object.entries(project.project_types || {})
      .map(([cat, subs]) => `${cat}: ${(subs || []).join(", ")}`)
      .join(" | ") || "—";

    const techDetailsStr = Array.isArray(project.tech_details)
      ? project.tech_details.map((t) => {
          const dbs = Array.isArray(t.databases) && t.databases.length
            ? ` [DB: ${t.databases.map((d) => `${d.name}${d.version ? ` v${d.version}` : ""}`).join(", ")}]`
            : "";
          return `${t.name || "—"}${t.version ? ` v${t.version}` : ""}${dbs}`;
        }).join(" | ")
      : (project.tech_details || "—");

    const membersStr = (project.members || [])
      .map((m) => `${m.user?.name || "—"} (${m.role?.name || "No role"})`)
      .join(" | ") || "—";

    infoSheet.addRows([
      { field: "Name", value: project.name },
      { field: "Code", value: project.code || "—" },
      { field: "Status", value: project.development_status },
      { field: "Description", value: project.description || "—" },
      { field: "Project Type", value: projectTypesStr },
      { field: "Tech Stack", value: techDetailsStr },
      { field: "Members & Roles", value: membersStr },
      { field: "Created By", value: project.creator?.name || "—" },
      { field: "Created At", value: new Date(project.createdAt).toLocaleDateString() },
     
    ]);

    // --- Calls sheet ---
    const callsSheet = workbook.addWorksheet("Calls");
    const calls = await Call.findAll({
      where: { ...dateWhere, project_id: projectId },
      include: [{ model: Project, as: "project", attributes: ["name"] }],
      order: [["createdAt", "DESC"]],
    });

    callsSheet.columns = [
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
      { header: "Updated At",    key: "updatedAt",     width: 20 },
    ];

    callsSheet.addRows(calls.map((r) => ({
      ...r.toJSON(),
      project: r.project?.name || "",
      remarks: flattenRemarks(r.remarks),
    })));

    callsSheet.getColumn(10).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Created At
callsSheet.getColumn(11).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Updated At

    // --- Tasks sheet ---
    const tasksSheet = workbook.addWorksheet("Tasks");
    const tasks = await Task.findAll({
      where: { ...dateWhere, project_id: projectId },
      include: [
        { model: User, as: "assignee", attributes: ["name"] },
        { model: User, as: "assigner", attributes: ["name"] },
        { model: Project, as: "project", attributes: ["name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    tasksSheet.columns = [
      { header: "Display ID",   key: "display_id",       width: 20 },
      { header: "Task",         key: "task",             width: 25 },
      { header: "Description",  key: "description",      width: 25 },
      { header: "Project",      key: "project",          width: 20 },
      { header: "Assigned To",  key: "assigned_to_name", width: 20 },
      { header: "Assigned By",  key: "assigned_by_name", width: 20 },
      { header: "Status",       key: "status",           width: 15 },
      { header: "Due Date",     key: "due_date",         width: 15 },
       { header: "Completed At",  key: "completedAt",      width: 20 },
      { header: "Remarks",      key: "remarks",          width: 40 },
      { header: "Created At",   key: "createdAt",        width: 20 },
      { header: "Updated At",   key: "updatedAt",     width: 20 },
      
    ];

    tasksSheet.addRows(tasks.map((r) => ({
      ...r.toJSON(),
      project:          r.project?.name  || "",
      assigned_to_name: r.assignee?.name || "",
      assigned_by_name: r.assigner?.name || "",
      remarks:          flattenRemarks(r.remarks),
    })));
tasksSheet.getColumn(8).numFmt = "dd/mm/yyyy";              // Due Date
tasksSheet.getColumn(9).numFmt = "dd/mm/yyyy hh:mm AM/PM";  // Completed At
tasksSheet.getColumn(10).numFmt = "dd/mm/yyyy hh:mm AM/PM";  // Completed At
tasksSheet.getColumn(11).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Created At
tasksSheet.getColumn(12).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Updated At
    // --- Work Logs sheet ---
const workLogsSheet = workbook.addWorksheet("Work Logs");
const workLogs = await WorkLog.findAll({
  where: { ...dateWhere, project_id: projectId },
  include: [{ model: User, as: "user", attributes: ["name", "employee_id"] }],
  order: [["date", "DESC"]],
});

workLogsSheet.columns = [
  { header: "Employee",    key: "employee_name", width: 22 },
  { header: "Employee ID", key: "employee_id",   width: 15 },
  { header: "Date",        key: "date",          width: 15 },
  { header: "Description", key: "description",   width: 40 },
  { header: "Remarks",     key: "remarks",       width: 40 },
  { header: "Created At",  key: "createdAt",     width: 20 },
  { header: "Updated At",  key: "updatedAt",     width: 20 },
];

workLogsSheet.addRows(workLogs.map((r) => ({
  ...r.toJSON(),
  employee_name: r.user?.name || "",
  employee_id:   r.user?.employee_id || "",
  remarks:       flattenRemarks(r.remarks),
})));

workLogsSheet.getColumn(3).numFmt = "dd/mm/yyyy";              // Date
workLogsSheet.getColumn(6).numFmt = "dd/mm/yyyy hh:mm AM/PM";  // Created At
workLogsSheet.getColumn(7).numFmt = "dd/mm/yyyy hh:mm AM/PM";  // Updated At

    // style header rows on all sheets
    [infoSheet, callsSheet, tasksSheet, workLogsSheet].forEach((sheet) => {
      sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9EDF5" } };
      });
    });

    const fileLabel = from && to ? `${from}_to_${to}` : new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${project.name}_activity_${fileLabel}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("exportProjectData error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};



const exportProjectDataAiOnly = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { from, to } = req.query;

    const {
      Project, User, ProjectMember, Role,
      Call, Task, WorkLog, TaskStatusLog,
    } = require('../models');

    const project = await Project.findByPk(projectId, {
      include: [
        { model: User, as: "creator", attributes: ["name"] },
        {
          model: ProjectMember, as: "members", include: [
            { model: User, as: "user", attributes: ["name", "employee_id"] },
            { model: Role, as: "role", attributes: ["name"] },
          ],
        },
      ],
    });
    if (!project) return res.status(404).json({ message: "Project not found" });

    // ── Date filter ──────────────────────────────────
    let dateWhere = {};
    if (from && to) {
      const start = new Date(from); start.setHours(0, 0, 0, 0);
      const end   = new Date(to);   end.setHours(23, 59, 59, 999);
      dateWhere = { createdAt: { [Op.between]: [start, end] } };
    }

    // ── Fetch data ───────────────────────────────────
    const calls = await Call.findAll({
      where: { ...dateWhere, project_id: projectId },
      order: [["createdAt", "ASC"]],
    });

    const tasks = await Task.findAll({
      where: { ...dateWhere, project_id: projectId },
      order: [["createdAt", "ASC"]],
    });

    let wlWhere = { project_id: projectId };
    if (from && to) {
      wlWhere.date = { [Op.between]: [from, to] };
    }
    const workLogs = await WorkLog.findAll({
      where: wlWhere,
      order: [["date", "ASC"]],
    });

    // ── Status logs for tasks ────────────────────────
    const taskIds = tasks.map((t) => t.id);
    const statusLogs = taskIds.length > 0
      ? await TaskStatusLog.findAll({
          where: { task_id: { [Op.in]: taskIds } },
          order: [["changed_at", "ASC"]],
        })
      : [];

    const logsByTaskId = {};
    for (const log of statusLogs) {
      if (!logsByTaskId[log.task_id]) logsByTaskId[log.task_id] = [];
      logsByTaskId[log.task_id].push(log);
    }

    // Map work logs to their respective task (if task_id exists on work logs)
    const workLogsByTaskId = {};
    for (const wl of workLogs) {
      if (wl.task_id) {
        if (!workLogsByTaskId[wl.task_id]) workLogsByTaskId[wl.task_id] = [];
        workLogsByTaskId[wl.task_id].push(wl);
      }
    }

    // ── Helpers ──────────────────────────────────────
    const calculateActualWorkingDays = (logs) => {
      if (!logs || logs.length === 0) return null;
      let totalMs = 0;
      let ongoingStart = null;
      for (const log of logs) {
        const ts = new Date(log.changed_at).getTime();
        if (log.to_status === "ongoing") {
          ongoingStart = ts;
        } else if ((log.to_status === "hold" || log.to_status === "closed") && ongoingStart !== null) {
          totalMs += ts - ongoingStart;
          ongoingStart = null;
        }
      }
      if (ongoingStart !== null) totalMs += Date.now() - ongoingStart;
      const days = totalMs / (1000 * 60 * 60 * 24);
      return days > 0 ? days.toFixed(1) : "0";
    };

    const buildStatusJourney = (logs) => {
      if (!logs || logs.length === 0) return "No status changes recorded";
      return logs
        .map((l) => {
          let st = l.to_status;
          if (st === "open" || st === "ongoing") st = "working";
          return `${st.toUpperCase()}(${new Date(l.changed_at).toLocaleDateString("en-IN")})`;
        })
        .join(" → ");
    };

    const cleanMarkdown = (text) => text
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g,     "$1")
      .replace(/#{1,6}\s/g,      "")
      .replace(/`(.+?)`/g,       "$1")
      .replace(/^>\s/gm,         "")
      .trim();

    // ── Tech stack string ────────────────────────────
    const techDetailsStr = Array.isArray(project.tech_details)
      ? project.tech_details.map((t) => {
          const dbs = Array.isArray(t.databases) && t.databases.length
            ? ` [DB: ${t.databases.map((d) => `${d.name}${d.version ? ` v${d.version}` : ""}`).join(", ")}]`
            : "";
          return `${t.name || "—"}${t.version ? ` v${t.version}` : ""}${dbs}`;
        }).join(", ")
      : (project.tech_details || "—");

    // ── Build prompt data (no employee names) ────────

    // Call type breakdown
    const callTypeCounts = {};
    for (const call of calls) {
      const type = call.call_type || "other";
      callTypeCounts[type] = (callTypeCounts[type] || 0) + 1;
    }
    const callTypeStr = Object.entries(callTypeCounts)
      .map(([type, count]) => `${type}: ${count}`)
      .join(", ") || "None";

    const callDates = calls.map((c) => new Date(c.createdAt)).sort((a, b) => a - b);
    const firstCall = callDates[0]     ? callDates[0].toLocaleDateString("en-IN")     : "—";
    const lastCall  = callDates.at(-1) ? callDates.at(-1).toLocaleDateString("en-IN") : "—";

    // Combined task counts: merge 'open' and 'ongoing' into 'working'
    const taskStatusCounts = { working: 0, hold: 0, closed: 0 };
    let totalWorkDays = 0;
    let workDayCount  = 0;
    const taskLines   = [];

    for (const task of tasks) {
      const logs    = logsByTaskId[task.id] || [];
      const taskWls = workLogsByTaskId[task.id] || [];
      const wd      = calculateActualWorkingDays(logs);
      const journey = buildStatusJourney(logs);

      // Map open/ongoing -> working
      const mappedStatus = (task.status === "open" || task.status === "ongoing") ? "working" : task.status;
      taskStatusCounts[mappedStatus] = (taskStatusCounts[mappedStatus] || 0) + 1;

      if (wd !== null) {
        totalWorkDays += parseFloat(wd);
        workDayCount++;
      }

      // Format activity notes (remarks + inline work logs)
      let taskActivity = [];
      if (Array.isArray(task.remarks) && task.remarks.length > 0) {
        taskActivity.push(...task.remarks.map((r) => `[${new Date(r.created_at).toLocaleDateString("en-IN")}] ${r.text}`));
      }
      if (taskWls.length > 0) {
        taskActivity.push(...taskWls.map((w) => `[Work Update ${w.date}] ${w.description || ""}`));
      }

      const activityStr = taskActivity.length > 0 ? `\n    Updates: ${taskActivity.join("; ")}` : "";

      taskLines.push(
        `  - [${task.display_id}] "${task.task}" | Due: ${task.due_date || "—"} | Status: ${mappedStatus} | Actual work: ${wd ?? "—"} days | Journey: ${journey}${activityStr}`
      );
    }

    const avgWorkDays    = workDayCount > 0 ? (totalWorkDays / workDayCount).toFixed(1) : "—";
    const taskSummaryStr = taskLines.join("\n") || "  No tasks recorded.";

    // Activity date range
    const allDates = [
      ...calls.map((c)    => new Date(c.createdAt)),
      ...tasks.map((t)    => new Date(t.createdAt)),
      ...workLogs.map((w) => new Date(w.date)),
    ].filter(Boolean).sort((a, b) => a - b);

    const projectStart  = allDates[0]
      ? allDates[0].toLocaleDateString("en-IN")
      : new Date(project.createdAt).toLocaleDateString("en-IN");
    const projectLatest = allDates.at(-1)
      ? allDates.at(-1).toLocaleDateString("en-IN")
      : "Ongoing";

    const teamSize = (project.members || []).length;

    // ── Prompt ───────────────────────────────────────
    const prompt = `
You are a professional project analyst preparing a formal client-facing report.
Below is complete data for a software project. Write a professional project timeline and analysis report.
Do NOT mention individual employee or developer names anywhere in the report.
Do NOT use markdown formatting — no **, no *, no #, no backticks.
Use plain text only. Use "=== SECTION NAME ===" as section dividers.

=== PROJECT DETAILS ===
Name: ${project.name}
Code: ${project.code || "—"}
Current Status: ${project.development_status}
Description: ${project.description || "—"}
Tech Stack: ${techDetailsStr}
Team Size: ${teamSize} members
Activity Period: ${projectStart} to ${projectLatest}
${from && to ? `Filtered Range: ${from} to ${to}` : "Scope: Full project history"}

=== CALL ACTIVITY ===
Total Calls: ${calls.length}
Breakdown by type: ${callTypeStr}
First Call: ${firstCall} | Last Call: ${lastCall}

=== TASK DATA ===
Total Tasks: ${tasks.length}
Working: ${taskStatusCounts.working} | Hold: ${taskStatusCounts.hold} | Completed: ${taskStatusCounts.closed}
Average actual working days per task: ${avgWorkDays} days
Task Details:
${taskSummaryStr}

Write the following sections using "=== SECTION NAME ===" as dividers.
Use plain business language. No markdown. No employee names. Be specific with numbers and dates.
Write as if sending directly to a client.

Sections:
1. Executive Summary
2. Project Timeline and Milestones
3. Task Performance Analysis
4. Communication and Meeting Summary
5. Current Status and Next Steps
    `.trim();

    // ── Call Gemini ──────────────────────────────────
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ message: "GEMINI_API_KEY not configured." });

    const genAI  = new GoogleGenerativeAI(apiKey);
    const model  = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent(prompt);
    const aiText = result.response.text();

    // ── Build Excel ──────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    const aiSheet  = workbook.addWorksheet("AI Analysis");
    aiSheet.getColumn(1).width = 130;

    // Title
    const titleRow = aiSheet.addRow([`PROJECT ANALYSIS REPORT — ${project.name.toUpperCase()}`]);
    titleRow.getCell(1).font      = { bold: true, size: 16, color: { argb: "FF132EA7" } };
    titleRow.getCell(1).fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9EDF5" } };
    titleRow.getCell(1).alignment = { vertical: "middle", wrapText: true };
    titleRow.height = 32;

    const subRow = aiSheet.addRow([
      `Activity Period: ${projectStart} to ${projectLatest}${from && to ? `  |  Filtered: ${from} to ${to}` : ""}   |   Generated: ${new Date().toLocaleDateString("en-IN")}`
    ]);
    subRow.getCell(1).font = { size: 9, color: { argb: "FF64748B" } };
    aiSheet.addRow([""]);

    // Parse and write sections
    const sections = aiText.split(/===\s*(.+?)\s*===/g).filter(Boolean);
    let isHeader = true;

    for (const part of sections) {
      const trimmed = cleanMarkdown(part.trim());
      if (!trimmed) continue;

      if (isHeader) {
        aiSheet.addRow([""]);
        const headerRow = aiSheet.addRow([trimmed.toUpperCase()]);
        headerRow.getCell(1).font      = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
        headerRow.getCell(1).fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF132EA7" } };
        headerRow.getCell(1).alignment = { vertical: "middle", wrapText: true };
        headerRow.height = 22;
        isHeader = false;
      } else {
        const lines = trimmed.split("\n").filter((l) => l.trim());
        for (const line of lines) {
          const cleaned  = cleanMarkdown(line);
          const bodyRow  = aiSheet.addRow([cleaned]);
          bodyRow.getCell(1).font      = { size: 10 };
          bodyRow.getCell(1).alignment = { wrapText: true, vertical: "top" };
          bodyRow.height = 18;
        }
        isHeader = true;
      }
    }

    // Footer
    aiSheet.addRow([""]);
    const footerRow = aiSheet.addRow(["This report was generated automatically using AI analysis of project data."]);
    footerRow.getCell(1).font      = { italic: true, size: 9, color: { argb: "FF94A3B8" } };
    footerRow.getCell(1).alignment = { horizontal: "center" };

    // ── Send file ────────────────────────────────────
    const fileLabel = from && to
      ? `${from}_to_${to}`
      : new Date().toISOString().split("T")[0];

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${project.name}_AI_Analysis_${fileLabel}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("exportProjectDataAiOnly error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

const exportLeaveData = async (req, res) => {
  try {
    const { from, to, user_id } = req.query;

    // ── Date range ──
    const start = new Date(from || new Date(new Date().getFullYear(), 0, 1)); // default: start of year
    start.setHours(0, 0, 0, 0);
    const end = new Date(to || new Date());
    end.setHours(23, 59, 59, 999);

    // ── Target user (admin can pass user_id, otherwise all employees) ──
    const userWhere = user_id ? { id: user_id } : { is_admin: false };
    const targetUser = user_id ? await User.findByPk(user_id) : null;
    if (user_id && !targetUser) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const workbook = new ExcelJS.Workbook();

    // ════════════════════════════════════════════════════
    // SHEET 1 — All Leave Requests
    // ════════════════════════════════════════════════════
    const leaveSheet = workbook.addWorksheet("Leave Requests");

    leaveSheet.columns = [
      { header: "Display ID",     key: "display_id",    width: 18 },
      { header: "Employee",       key: "employee_name", width: 22 },
      { header: "Employee ID",    key: "employee_id",   width: 15 },
      { header: "Leave Type",     key: "leave_type",    width: 18 },
      { header: "Reason Type",    key: "reason_type",   width: 18 },
      { header: "Duration",       key: "duration",      width: 18 },
      { header: "Start Date",     key: "start_date",    width: 15 },
      { header: "End Date",       key: "end_date",      width: 15 },
      { header: "Status",         key: "status",        width: 15 },
      { header: "Reason",         key: "reason",        width: 30 },
      { header: "Rejection Reason", key: "rejection_reason", width: 30 },
      { header: "Approved By",    key: "approved_by_name",   width: 20 },
      { header: "Approved At",    key: "approved_at",   width: 20 },
      { header: "Applied On",     key: "createdAt",     width: 20 },
    ];

    const leaveWhere = {
      start_date: { [Op.between]: [start.toISOString().split("T")[0], end.toISOString().split("T")[0]] },
    };
    if (user_id) leaveWhere.user_id = user_id;

    const leaves = await LeaveRequest.findAll({
      where: leaveWhere,
      include: [
        { model: User, as: "employee", where: userWhere, attributes: ["id", "name", "employee_id"] },
        { model: User, as: "approver", attributes: ["name"], required: false },
      ],
      order: [["start_date", "DESC"]],
    });

    leaveSheet.addRows(leaves.map((r) => ({
      ...r.toJSON(),
      employee_name:    r.employee?.name       || "—",
      employee_id:      r.employee?.employee_id || "—",
      approved_by_name: r.approver?.name        || "—",
      approved_at:      r.approved_at           || null,
    })));

    // Total row
    const leaveTotalRow = leaveSheet.addRow({
      display_id:    "TOTAL LEAVES",
      employee_name: leaves.length,
    });
    leaveTotalRow.font = { bold: true };
    leaveTotalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDE9D9" } };

    leaveSheet.getColumn(7).numFmt  = "dd/mm/yyyy"; // Start Date
    leaveSheet.getColumn(8).numFmt  = "dd/mm/yyyy"; // End Date
    leaveSheet.getColumn(13).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Approved At
    leaveSheet.getColumn(14).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Applied On

    leaveSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9EDF5" } };
    });

    // ════════════════════════════════════════════════════
    // SHEET 2 — Month-wise Leave Summary
    // ════════════════════════════════════════════════════
    const summarySheet = workbook.addWorksheet("Monthly Summary");

    // Get all unique employees in the result
    const employeeIds = [...new Set(leaves.map((l) => l.user_id))];

    // Get leave balance records for these employees in date range
    const startYear = start.getFullYear();
    const endYear   = end.getFullYear();
    const startMonth = start.getMonth() + 1;
    const endMonth   = end.getMonth() + 1;

    const balances = await LeaveBalance.findAll({
      where: {
        user_id: employeeIds.length > 0 ? employeeIds : ['00000000-0000-0000-0000-000000000000'], // avoid empty IN
        [Op.or]: [
          // include all months between start and end year/month
          {
            year:  startYear,
            month: { [Op.gte]: startMonth },
          },
          {
            year:  endYear,
            month: { [Op.lte]: endMonth },
          },
          // years in between
          {
            year: { [Op.between]: [startYear + 1, endYear - 1] },
          },
        ],
      },
      include: [
        { model: User, as: "employee", attributes: ["name", "employee_id"] },
      ],
      order: [["year", "ASC"], ["month", "ASC"]],
    });

    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    summarySheet.columns = [
      { header: "Employee",       key: "employee_name",  width: 22 },
      { header: "Employee ID",    key: "employee_id",    width: 15 },
      { header: "Month",          key: "month_label",    width: 12 },
      { header: "Year",           key: "year",           width: 10 },
      { header: "Entitled Paid",  key: "entitled_paid",  width: 16 },
      { header: "Used Paid",      key: "used_paid",      width: 14 },
      { header: "Used Unpaid",    key: "used_unpaid",    width: 14 },
      { header: "Used Exchange",  key: "used_exchange",  width: 16 },
      { header: "Remaining Paid", key: "remaining_paid", width: 16 },
    ];

    summarySheet.addRows(balances.map((b) => ({
      employee_name:  b.employee?.name        || "—",
      employee_id:    b.employee?.employee_id || "—",
      month_label:    MONTH_NAMES[(b.month || 1) - 1],
      year:           b.year,
      entitled_paid:  parseFloat(b.entitled_paid  || 0),
      used_paid:      parseFloat(b.used_paid       || 0),
      used_unpaid:    parseFloat(b.used_unpaid     || 0),
      used_exchange:  parseFloat(b.used_exchange   || 0),
      remaining_paid: parseFloat(b.entitled_paid || 0) - parseFloat(b.used_paid || 0),
    })));

    summarySheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9EDF5" } };
    });

    // ── Send ──
    const fileLabel = from && to
      ? `${from}_to_${to}`
      : `${start.getFullYear()}`;

    const empLabel = targetUser
      ? (targetUser.employee_id || targetUser.name.replace(/\s+/g, "_"))
      : "all_employees";

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${empLabel}_leaves_${fileLabel}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("exportLeaveData error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const exportAllLeavesExcel = async (req, res) => {
  try {
    const { user_id } = req.query;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "EWM CRM";
    workbook.created = new Date();

    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    // Helper function to safely parse dates
    const parseSafeDate = (dateVal) => {
      if (!dateVal) return null;
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? null : d;
    };

    // ── Target employees ──
    const userWhere = user_id
      ? { id: user_id }
      : { is_admin: false, is_active: true };

    const employees = await User.findAll({
      where: userWhere,
      attributes: ["id", "name", "employee_id"],
      order: [["name", "ASC"]],
    });

    const employeeIds = employees.map((e) => e.id);

    // ── Fetch all leave requests ──
    const leaves = await LeaveRequest.findAll({
      where: user_id ? { user_id } : { user_id: { [Op.in]: employeeIds } },
      include: [
        { model: User, as: "employee", attributes: ["id", "name", "employee_id"] },
        { model: User, as: "approver", attributes: ["name"], required: false },
      ],
      order: [["start_date", "DESC"]],
    });

    // ── Fetch all balance records ──
    const balances = await LeaveBalance.findAll({
      where: user_id ? { user_id } : { user_id: { [Op.in]: employeeIds } },
      include: [
        { model: User, as: "employee", attributes: ["name", "employee_id"] },
      ],
      order: [["year", "DESC"], ["month", "DESC"]],
    });

    // ════════════════════════
    // SHEET 1 — Leave Requests
    // ════════════════════════
    const leaveSheet = workbook.addWorksheet("Leave Requests");

    const headerFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF132EA7" } };
    const headerFont = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    const totalFill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDE9D9" } };

    leaveSheet.columns = [
      { header: "Display ID",       key: "display_id",       width: 18 },
      { header: "Employee",         key: "employee_name",    width: 22 },
      { header: "Employee ID",      key: "employee_id",      width: 15 },
      { header: "Leave Type",       key: "leave_type",       width: 15 },
      { header: "Reason Type",      key: "reason_type",      width: 15 },
      { header: "Duration",         key: "duration",         width: 15 },
      { header: "From",             key: "start_date",       width: 14 },
      { header: "To",               key: "end_date",         width: 14 },
      { header: "Days",             key: "days",             width: 8  },
      { header: "Status",           key: "status",           width: 13 },
      { header: "Reason",           key: "reason",           width: 30 },
      { header: "Rejection Reason", key: "rejection_reason", width: 30 },
      { header: "Approved By",      key: "approved_by",      width: 20 },
      { header: "Approved At",      key: "approved_at",      width: 20 },
      { header: "Applied On",       key: "applied_on",       width: 20 },
    ];

    // Style header row
    leaveSheet.getRow(1).eachCell((cell) => {
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
    leaveSheet.getRow(1).height = 32;

    // Add data rows
    leaves.forEach((leave, index) => {
      const startDate  = parseSafeDate(leave.start_date);
      const endDate    = parseSafeDate(leave.end_date);
      const approvedAt = parseSafeDate(leave.approved_at);
      
      // Fallback check for Sequelize timestamps (createdAt vs created_at)
      const rawAppliedDate = leave.created_at || leave.createdAt;
      const appliedOn  = parseSafeDate(rawAppliedDate);

      let days = 0;
      if (leave.duration === "first_half" || leave.duration === "second_half") {
        days = 0.5;
      } else if (startDate && endDate) {
        days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      }

      const row = leaveSheet.addRow({
        display_id:       leave.display_id,
        employee_name:    leave.employee?.name        || "—",
        employee_id:      leave.employee?.employee_id || "—",
        leave_type:       leave.leave_type,
        reason_type:      leave.reason_type,
        duration:         leave.duration,
        start_date:       startDate  || "—",
        end_date:         endDate    || "—",
        days,
        status:           leave.status,
        reason:           leave.reason,
        rejection_reason: leave.rejection_reason || "—",
        approved_by:      leave.approver?.name    || "—",
        approved_at:      approvedAt || "—",
        applied_on:       appliedOn  || "—",
      });

      // Alternating row color
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFF" } };
        });
      }

      // Status color
      const statusCell = row.getCell("status");
      const statusColors = {
        approved:  { argb: "FF16A34A" },
        pending:   { argb: "FFD97706" },
        rejected:  { argb: "FFDC2626" },
        cancelled: { argb: "FF64748B" },
      };
      if (statusColors[leave.status]) {
        statusCell.font = { bold: true, color: statusColors[leave.status] };
      }

      // Apply number formats ONLY if valid Date objects exist
      if (startDate)  row.getCell("start_date").numFmt = "dd/mm/yyyy";
      if (endDate)    row.getCell("end_date").numFmt   = "dd/mm/yyyy";
      if (appliedOn)  row.getCell("applied_on").numFmt = "dd/mm/yyyy";
      if (approvedAt) row.getCell("approved_at").numFmt = "dd/mm/yyyy hh:mm AM/PM";
    });

    // Total row
    const leaveTotalRow = leaveSheet.addRow({
      display_id:    "TOTAL",
      employee_name: `${leaves.length} requests`,
    });
    leaveTotalRow.font = { bold: true };
    leaveTotalRow.fill = totalFill;

    // ════════════════════════
    // SHEET 2 — Monthly Summary
    // ════════════════════════
    const summarySheet = workbook.addWorksheet("Monthly Summary");

    summarySheet.columns = [
      { header: "Employee",     key: "employee_name",  width: 22 },
      { header: "Employee ID",  key: "employee_id",    width: 15 },
      { header: "Month",        key: "month_label",    width: 14 },
      { header: "Year",         key: "year",           width: 10 },
      { header: "Entitled",     key: "entitled_paid",  width: 12 },
      { header: "Paid Used",    key: "used_paid",      width: 12 },
      { header: "Unpaid",       key: "used_unpaid",    width: 12 },
      { header: "Exchange",     key: "used_exchange",  width: 12 },
      { header: "Remaining",    key: "remaining_paid", width: 12 },
    ];

    summarySheet.getRow(1).eachCell((cell) => {
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    summarySheet.getRow(1).height = 32;

    balances.forEach((b, index) => {
      const remaining = parseFloat(b.entitled_paid) - parseFloat(b.used_paid);
      const row = summarySheet.addRow({
        employee_name:  b.employee?.name        || "—",
        employee_id:    b.employee?.employee_id || "—",
        month_label:    MONTH_NAMES[(b.month || 1) - 1],
        year:           b.year,
        entitled_paid:  parseFloat(b.entitled_paid  || 0),
        used_paid:      parseFloat(b.used_paid      || 0),
        used_unpaid:    parseFloat(b.used_unpaid    || 0),
        used_exchange:  parseFloat(b.used_exchange  || 0),
        remaining_paid: remaining,
      });

      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFF" } };
        });
      }

      // Color remaining
      const remCell = row.getCell("remaining_paid");
      if (remaining <= 0) {
        remCell.font = { bold: true, color: { argb: "FFDC2626" } };
      } else if (remaining < parseFloat(b.entitled_paid)) {
        remCell.font = { bold: true, color: { argb: "FFD97706" } };
      } else {
        remCell.font = { bold: true, color: { argb: "FF16A34A" } };
      }

      // Unpaid warning color
      if (parseFloat(b.used_unpaid) > 0) {
        row.getCell("used_unpaid").font = { bold: true, color: { argb: "FFDC2626" } };
      }
    });

    // Total row
    const summaryTotalRow = summarySheet.addRow({
      employee_name: "TOTAL RECORDS",
      employee_id:   String(balances.length),
    });
    summaryTotalRow.font = { bold: true };
    summaryTotalRow.fill = totalFill;

    // ── Send ──
    const empLabel = user_id
      ? employees[0]?.employee_id || "employee"
      : "all_employees";

    const dateLabel = new Date().toISOString().split("T")[0];

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${empLabel}_leaves_${dateLabel}.xlsx"`
    );
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("exportAllLeavesExcel error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const exportAllLeavesPDF = async (req, res) => {
  try {
    const { user_id } = req.query;

    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    const formatD = (d) => {
      if (!d) return "—";
      const date = new Date(d);
      return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
    };

    // ── Fetch employees ──
    const userWhere = user_id
      ? { id: user_id }
      : { is_admin: false, is_active: true };

    const employees = await User.findAll({
      where: userWhere,
      attributes: ["id", "name", "employee_id"],
      order: [["name", "ASC"]],
    });

    const employeeIds = employees.map((e) => e.id);

    // ── Fetch leaves ──
    const leaves = await LeaveRequest.findAll({
      where: user_id ? { user_id } : { user_id: { [Op.in]: employeeIds } },
      include: [
        { model: User, as: "employee", attributes: ["id", "name", "employee_id"] },
        { model: User, as: "approver", attributes: ["name"], required: false },
      ],
      order: [["start_date", "DESC"]],
    });

    // ── Fetch balances ──
    const balances = await LeaveBalance.findAll({
      where: user_id ? { user_id } : { user_id: { [Op.in]: employeeIds } },
      include: [
        { model: User, as: "employee", attributes: ["name", "employee_id"] },
      ],
      order: [["year", "DESC"], ["month", "DESC"]],
    });

    // ── Summary stats ──
    const totalLeaves    = leaves.length;
    const totalApproved  = leaves.filter((l) => l.status === "approved").length;
    const totalPending   = leaves.filter((l) => l.status === "pending").length;
    const totalRejected  = leaves.filter((l) => l.status === "rejected").length;
    const totalCancelled = leaves.filter((l) => l.status === "cancelled").length;
    const totalUnpaid    = balances.reduce((sum, b) => sum + parseFloat(b.used_unpaid || 0), 0);

    const empLabel = user_id
      ? `${employees[0]?.name} (${employees[0]?.employee_id})`
      : "All Employees";

    const generatedOn = new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric",
    });

    // ── Build leave rows HTML ──
    const leaveRowsHTML = leaves.map((leave, i) => {
      const start = new Date(leave.start_date);
      const end   = new Date(leave.end_date);
      const days  =
        leave.duration === "first_half" || leave.duration === "second_half"
          ? 0.5
          : Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

      const statusColors = {
        approved:  { bg: "#dcfce7", text: "#16a34a" },
        pending:   { bg: "#fef9c3", text: "#d97706" },
        rejected:  { bg: "#fee2e2", text: "#dc2626" },
        cancelled: { bg: "#f1f5f9", text: "#64748b" },
      };
      const sc = statusColors[leave.status] || statusColors.pending;

      return `
        <tr style="background:${i % 2 === 0 ? "#f8faff" : "#ffffff"};">
          <td style="padding:10px 12px;font-family:monospace;font-size:11px;color:#132ea7;font-weight:700;">
            ${leave.display_id}
          </td>
          <td style="padding:10px 12px;font-size:12px;font-weight:700;color:#1e293b;">
            ${leave.employee?.name || "—"}
            <div style="font-size:10px;color:#94a3b8;font-weight:600;">${leave.employee?.employee_id || ""}</div>
          </td>
          <td style="padding:10px 12px;font-size:11px;font-weight:700;color:#475569;text-transform:capitalize;">
            ${leave.leave_type}
            ${leave.reason_type === "emergency"
              ? `<div style="font-size:9px;background:#fee2e2;color:#dc2626;padding:2px 6px;border-radius:4px;display:inline-block;margin-top:2px;font-weight:800;text-transform:uppercase;">Emergency</div>`
              : ""}
          </td>
          <td style="padding:10px 12px;font-size:11px;color:#475569;font-weight:600;">${formatD(leave.start_date)}</td>
          <td style="padding:10px 12px;font-size:11px;color:#475569;font-weight:600;">${formatD(leave.end_date)}</td>
          <td style="padding:10px 12px;font-size:11px;color:#475569;font-weight:700;text-align:center;">${days}</td>
          <td style="padding:10px 12px;">
            <span style="background:${sc.bg};color:${sc.text};padding:3px 10px;border-radius:6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;">
              ${leave.status}
            </span>
          </td>
          <td style="padding:10px 12px;font-size:11px;color:#475569;">${leave.approver?.name || "—"}</td>
        </tr>`;
    }).join("");

    // ── Build balance rows HTML ──
    const balanceRowsHTML = balances.map((b, i) => {
      const remaining = parseFloat(b.entitled_paid) - parseFloat(b.used_paid);
      const remColor  = remaining <= 0 ? "#dc2626" : remaining < parseFloat(b.entitled_paid) ? "#d97706" : "#16a34a";
      const unpaidColor = parseFloat(b.used_unpaid) > 0 ? "#dc2626" : "#64748b";

      return `
        <tr style="background:${i % 2 === 0 ? "#f8faff" : "#ffffff"};">
          <td style="padding:10px 12px;font-size:12px;font-weight:700;color:#1e293b;">
            ${b.employee?.name || "—"}
            <div style="font-size:10px;color:#94a3b8;font-weight:600;">${b.employee?.employee_id || ""}</div>
          </td>
          <td style="padding:10px 12px;font-size:12px;font-weight:700;color:#475569;">
            ${MONTH_NAMES[(b.month || 1) - 1]} ${b.year}
          </td>
          <td style="padding:10px 12px;font-size:12px;font-weight:700;color:#132ea7;text-align:center;">${parseFloat(b.entitled_paid)}</td>
          <td style="padding:10px 12px;font-size:12px;font-weight:700;color:#132ea7;text-align:center;">${parseFloat(b.used_paid)}</td>
          <td style="padding:10px 12px;font-size:12px;font-weight:700;color:${unpaidColor};text-align:center;">${parseFloat(b.used_unpaid)}</td>
          <td style="padding:10px 12px;font-size:12px;font-weight:700;color:#d97706;text-align:center;">${parseFloat(b.used_exchange)}</td>
          <td style="padding:10px 12px;text-align:center;">
            <span style="background:${remaining <= 0 ? "#fee2e2" : remaining < parseFloat(b.entitled_paid) ? "#fef9c3" : "#dcfce7"};
              color:${remColor};padding:3px 10px;border-radius:6px;font-size:11px;font-weight:800;">
              ${remaining}
            </span>
          </td>
        </tr>`;
    }).join("");

    // ── Full HTML ──
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #1e293b; }
          
          .cover {
            background: linear-gradient(135deg, #132ea7 0%, #1e40af 50%, #0f2490 100%);
            padding: 60px 50px;
            min-height: 220px;
            position: relative;
            overflow: hidden;
          }
          .cover::after {
            content: '';
            position: absolute;
            top: -60px; right: -60px;
            width: 250px; height: 250px;
            background: rgba(255,255,255,0.06);
            border-radius: 50%;
          }
          .cover::before {
            content: '';
            position: absolute;
            bottom: -40px; left: 30%;
            width: 180px; height: 180px;
            background: rgba(255,255,255,0.04);
            border-radius: 50%;
          }
          .cover-label {
            font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.5);
            text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 10px;
          }
          .cover-title {
            font-size: 36px; font-weight: 900; color: #fff;
            letter-spacing: -0.5px; margin-bottom: 6px;
          }
          .cover-sub {
            font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.75);
            margin-bottom: 30px;
          }
          .cover-meta {
            display: flex; gap: 30px; flex-wrap: wrap;
          }
          .cover-meta-item {
            background: rgba(255,255,255,0.1);
            border-radius: 12px; padding: 10px 18px;
          }
          .cover-meta-label {
            font-size: 9px; font-weight: 800; color: rgba(255,255,255,0.5);
            text-transform: uppercase; letter-spacing: 0.2em;
          }
          .cover-meta-value {
            font-size: 14px; font-weight: 900; color: #fff; margin-top: 2px;
          }

          .stats-bar {
            display: flex; gap: 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .stat-item {
            flex: 1; padding: 20px 24px; text-align: center;
            border-right: 1px solid #e2e8f0;
          }
          .stat-item:last-child { border-right: none; }
          .stat-value {
            font-size: 28px; font-weight: 900; color: #132ea7;
          }
          .stat-label {
            font-size: 9px; font-weight: 800; color: #94a3b8;
            text-transform: uppercase; letter-spacing: 0.15em; margin-top: 3px;
          }
          .stat-approved .stat-value { color: #16a34a; }
          .stat-pending  .stat-value { color: #d97706; }
          .stat-rejected .stat-value { color: #dc2626; }
          .stat-unpaid   .stat-value { color: #dc2626; }

          .section { padding: 40px 50px; }
          .section-title {
            font-size: 10px; font-weight: 800; color: #94a3b8;
            text-transform: uppercase; letter-spacing: 0.25em;
            margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
          }
          .section-title::after {
            content: ''; flex: 1; height: 1px; background: #e2e8f0;
          }

          table { width: 100%; border-collapse: collapse; }
          thead tr {
            background: #132ea7;
          }
          thead th {
            padding: 12px 12px;
            font-size: 9px; font-weight: 800; color: #fff;
            text-transform: uppercase; letter-spacing: 0.15em;
            text-align: left;
          }
          tbody tr:hover { background: #f1f5f9; }
          tbody td { border-bottom: 1px solid #f1f5f9; }

          .footer {
            padding: 20px 50px;
            border-top: 1px solid #e2e8f0;
            display: flex; justify-content: space-between; align-items: center;
          }
          .footer-text {
            font-size: 10px; color: #94a3b8; font-weight: 600;
          }

          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>

        <!-- COVER SECTION -->
        <div class="cover">
          <div class="cover-label">Employee Work Management — CRM</div>
          <div class="cover-title">Leave Report</div>
          <div class="cover-sub">${empLabel}</div>
          <div class="cover-meta">
            <div class="cover-meta-item">
              <div class="cover-meta-label">Generated On</div>
              <div class="cover-meta-value">${generatedOn}</div>
            </div>
            <div class="cover-meta-item">
              <div class="cover-meta-label">Total Requests</div>
              <div class="cover-meta-value">${totalLeaves}</div>
            </div>
            <div class="cover-meta-item">
              <div class="cover-meta-label">Scope</div>
              <div class="cover-meta-value">${user_id ? "Individual" : "All Employees"}</div>
            </div>
          </div>
        </div>

        <!-- STATS BAR -->
        <div class="stats-bar">
          <div class="stat-item">
            <div class="stat-value">${totalLeaves}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat-item stat-approved">
            <div class="stat-value">${totalApproved}</div>
            <div class="stat-label">Approved</div>
          </div>
          <div class="stat-item stat-pending">
            <div class="stat-value">${totalPending}</div>
            <div class="stat-label">Pending</div>
          </div>
          <div class="stat-item stat-rejected">
            <div class="stat-value">${totalRejected}</div>
            <div class="stat-label">Rejected</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${totalCancelled}</div>
            <div class="stat-label">Cancelled</div>
          </div>
          <div class="stat-item stat-unpaid">
            <div class="stat-value">${totalUnpaid}</div>
            <div class="stat-label">Unpaid Days</div>
          </div>
        </div>

        <!-- LEAVE REQUESTS TABLE -->
        <div class="section">
          <div class="section-title">Leave Requests</div>
          <table>
            <thead>
              <tr>
                <th>Display ID</th>
                <th>Employee</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Status</th>
                <th>Approved By</th>
              </tr>
            </thead>
            <tbody>
              ${leaveRowsHTML || `<tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8;font-size:13px;">No leave requests found</td></tr>`}
            </tbody>
          </table>
        </div>

        <!-- PAGE BREAK -->
        <div class="page-break"></div>

        <!-- MONTHLY SUMMARY TABLE -->
        <div class="cover" style="min-height:100px;padding:40px 50px;">
          <div class="cover-label">Employee Work Management — CRM</div>
          <div class="cover-title" style="font-size:26px;">Monthly Balance Summary</div>
          <div class="cover-sub" style="margin-bottom:0;">${empLabel} • ${generatedOn}</div>
        </div>

        <div class="section">
          <div class="section-title">Balance History</div>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Month</th>
                <th style="text-align:center;">Entitled</th>
                <th style="text-align:center;">Paid Used</th>
                <th style="text-align:center;">Unpaid</th>
                <th style="text-align:center;">Exchange</th>
                <th style="text-align:center;">Remaining</th>
              </tr>
            </thead>
            <tbody>
              ${balanceRowsHTML || `<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;font-size:13px;">No balance records found</td></tr>`}
            </tbody>
          </table>
        </div>

        <!-- FOOTER -->
        <div class="footer">
          <div class="footer-text">EWM CRM — Leave Report</div>
          <div class="footer-text">Generated on ${generatedOn}</div>
        </div>

      </body>
      </html>`;

    // ── Generate PDF via Puppeteer ──
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
    });

    await browser.close();

    const empFileLabel = user_id
      ? employees[0]?.employee_id || "employee"
      : "all_employees";
    const dateLabel = new Date().toISOString().split("T")[0];

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${empFileLabel}_leaves_${dateLabel}.pdf"`
    );
    res.send(pdfBuffer);

  } catch (err) {
    console.error("exportAllLeavesPDF error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { exportData, exportMyData, exportEmployeeData, exportProjectData , exportAllEmployeeData, exportLeaveData  ,  exportAllLeavesExcel,exportProjectDataAiOnly,
  exportAllLeavesPDF};
// module.exports = { exportData };


