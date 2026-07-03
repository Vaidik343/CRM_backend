const ExcelJS = require("exceljs");
const { Call, Task, WorkLog, User, Project, ProjectMember, Role } = require("../models");
const { Op } = require("sequelize");

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
      ];
sheet.getColumn(10).numFmt = "dd/mm/yyyy hh:mm AM/PM";

    const cc = sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
         createdAt: r.createdAt, // Date object
        project: r.project?.name || "",
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
sheet.getColumn(8).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Created At
sheet.getColumn(9).numFmt = "dd/mm/yyyy hh:mm AM/PM"; // Due Date

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
      ],
      order: [["createdAt", "DESC"]],
    });
    taskSheet.addRows(tasks.map((r) => ({
      ...r.toJSON(),
      project:          r.project?.name  || "",
      assigned_to_name: r.assignee?.name || "",
      assigned_by_name: r.assigner?.name || "",
      remarks:          flattenRemarks(r.remarks),
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
module.exports = { exportData, exportMyData, exportEmployeeData, exportProjectData , exportAllEmployeeData };
// module.exports = { exportData };


