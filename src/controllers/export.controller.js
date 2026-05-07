const exportData = async (req, res) => {
  try {
    const type = String(req.query.type || "").toLowerCase();
    if (!["calls", "tasks", "work-logs"].includes(type)) {
      return res.status(400).json({ message: "type must be one of: calls, tasks, work-logs" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(type);

    if (type === "calls") {
      const rows = await Call.findAll({
        include: [
          { model: User,    attributes: ["name", "employee_id"] },
          { model: Project, attributes: ["name"] },
        ],
        order: [["createdAt", "DESC"]],
      });
      sheet.columns = [
        { header: "ID",           key: "id" },
        { header: "Employee",     key: "employee" },
        { header: "Employee ID",  key: "employee_id" },
        { header: "Project",      key: "project" },
        { header: "Caller Name",  key: "caller_name" },
        { header: "Caller Number",key: "caller_number" },
        { header: "Call Type",    key: "call_type" },
        { header: "Call Subtype", key: "call_subtype" },
        { header: "Receive Type", key: "receive_type" },
        { header: "Summary",      key: "call_summary" },
        { header: "Remarks",      key: "remarks" },
        { header: "Created At",   key: "createdAt" },
      ];
      sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
        employee:    r.User?.name        || r.user_id,
        employee_id: r.User?.employee_id || "",
        project:     r.Project?.name     || r.project_id,
      })));
    }

    if (type === "tasks") {
      const rows = await Task.findAll({
        include: [
          { model: User, as: "assignee", attributes: ["name", "employee_id"] },
          { model: User, as: "assigner", attributes: ["name", "employee_id"] },
        ],
        order: [["createdAt", "DESC"]],
      });
      sheet.columns = [
        { header: "ID",           key: "id" },
        { header: "Task",         key: "task" },
        { header: "Description",  key: "description" },
        { header: "Assigned To",  key: "assigned_to_name" },
        { header: "Assigned By",  key: "assigned_by_name" },
        { header: "Status",       key: "status" },
        { header: "Start Date",   key: "start_date" },
        { header: "Due Date",     key: "due_date" },
        { header: "Created At",   key: "createdAt" },
      ];
      sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
        assigned_to_name: r.assignee?.name || r.assigned_to,
        assigned_by_name: r.assigner?.name || r.assigned_by,
      })));
    }

    if (type === "work-logs") {
      const rows = await WorkLog.findAll({
        include: [{ model: User, attributes: ["name", "employee_id"] }],
        order: [["date", "DESC"], ["createdAt", "DESC"]],
      });
      sheet.columns = [
        { header: "ID",          key: "id" },
        { header: "Employee",    key: "employee" },
        { header: "Employee ID", key: "employee_id" },
        { header: "Description", key: "description" },
        { header: "Date",        key: "date" },
        { header: "Created At",  key: "createdAt" },
      ];
      sheet.addRows(rows.map((r) => ({
        ...r.toJSON(),
        employee:    r.User?.name        || r.user_id,
        employee_id: r.User?.employee_id || "",
      })));
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${type}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("exportData error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { exportData };


