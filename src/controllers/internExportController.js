const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const { Intern, InternProject, InternTask, InternWorkLog, User } = require('../models');

// ── same helper used in employee export ──────────────────────────────────────
const flattenRemarks = (remarks) => {
  if (!Array.isArray(remarks) || remarks.length === 0) return '';
  return remarks
    .map((r) => `[${new Date(r.created_at).toLocaleDateString('en-IN')} — ${r.added_by_name || 'Admin'}]: ${r.text}`)
    .join('\n');
};

const exportInternReport = async (req, res) => {
  try {
    const internId = req.params.id || req.user?.intern_id || req.user?.id;
    const { from, to } = req.query;

    // 1. Fetch Intern & Projects
    const intern = await Intern.findByPk(internId, {
      include: [{ model: InternProject, as: 'projects' }],
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    const activeProject =
      intern.projects && intern.projects.length > 0 ? intern.projects[0] : null;

    // 2. Date range filter
    const dateWhere = {};
    if (from && to) {
      dateWhere.createdAt = {
        [Op.between]: [
          new Date(`${from}T00:00:00.000Z`),
          new Date(`${to}T23:59:59.999Z`),
        ],
      };
    }

    // 3. Fetch Tasks
    const tasks = await InternTask.findAll({
      where: { intern_id: internId, ...dateWhere },
      include: [{ model: User, as: 'assigner', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
    });

    // 4. Fetch Work Logs
    // NOTE: InternWorkLog model has no remarks field yet.
    // When you add it, flattenRemarks(w.remarks) will work automatically.
    const workLogs = await InternWorkLog.findAll({
      where: { intern_id: internId, ...dateWhere },
      order: [['log_date', 'DESC']],
    });

    // 5. Build workbook
    const workbook = new ExcelJS.Workbook();

    const applyHeader = (sheet) => {
      sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '132EA7' } };
      });
    };

    // ── SHEET 1: Overview & Project ──────────────────────────────────────────
    const sheet1 = workbook.addWorksheet('Overview & Project');
    sheet1.columns = [
      { header: 'Field', key: 'field', width: 25 },
      { header: 'Value', key: 'val',   width: 55 },
    ];
    applyHeader(sheet1);

    sheet1.addRow({ field: 'Intern Name',         val: intern.name });
    sheet1.addRow({ field: 'Intern ID',           val: intern.display_id || '—' });
    sheet1.addRow({ field: 'Email',               val: intern.email });
    sheet1.addRow({ field: 'Mobile',              val: intern.mobile || '—' });
    sheet1.addRow({ field: 'Status',              val: intern.status?.toUpperCase() });
    sheet1.addRow({ field: 'Start Date',          val: intern.start_date || '—' });
    sheet1.addRow({ field: 'End Date',            val: intern.end_date || '—' });
    sheet1.addRow({});
    sheet1.addRow({ field: 'PROJECT DETAILS',     val: '' });
    sheet1.addRow({ field: 'Project Title',       val: activeProject?.name || 'Not Assigned' });
    sheet1.addRow({ field: 'Project Description', val: activeProject?.description || '—' });

    // ── SHEET 2: Tasks ───────────────────────────────────────────────────────
    const sheet2 = workbook.addWorksheet('Tasks');
    sheet2.columns = [
      { header: 'Display ID',   key: 'display_id',  width: 15 },
      { header: 'Task Name',    key: 'title',        width: 35 },
      { header: 'Description',  key: 'description',  width: 40 },
      { header: 'Status',       key: 'status',       width: 15 },
      { header: 'Assigned By',  key: 'assigner',     width: 20 },
      { header: 'Due Date',     key: 'due_date',     width: 15 },
      { header: 'Remarks',      key: 'remarks',      width: 55 },
      { header: 'Created Date', key: 'createdAt',    width: 18 },
    ];
    applyHeader(sheet2);

    tasks.forEach((t) => {
      const row = sheet2.addRow({
        display_id:  t.display_id || `TASK-${t.id}`,
        title:       t.task || '—',
        description: t.description || '—',
        status:      (t.status || '—').toUpperCase(),
        assigner:    t.assigner?.name || 'Admin',
        due_date:    t.due_date || '—',
        // BUG FIX: was t.remark (single string) — now flattens JSONB array
        remarks:     flattenRemarks(t.remarks),
        createdAt:   t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : '—',
      });
      row.getCell('remarks').alignment = { wrapText: true, vertical: 'top' };
    });

    // ── SHEET 3: Work Logs ───────────────────────────────────────────────────
    const sheet3 = workbook.addWorksheet('Work Logs');
    sheet3.columns = [
      { header: 'Log Date',    key: 'log_date',    width: 15 },
      { header: 'Description', key: 'description', width: 55 },
      { header: 'Hours Spent', key: 'hours',       width: 15 },
      // remarks column ready — will populate once model gets the field
      { header: 'Remarks',     key: 'remarks',     width: 55 },
    ];
    applyHeader(sheet3);

    workLogs.forEach((w) => {
      const row = sheet3.addRow({
        log_date:    w.log_date || (w.createdAt ? new Date(w.createdAt).toISOString().split('T')[0] : '—'),
        description: w.description || '—',
        hours:       w.hours || '—',
        // BUG FIX: guard against missing remarks field on InternWorkLog model
        remarks:     w.remarks ? flattenRemarks(w.remarks) : '',
      });
      row.getCell('remarks').alignment = { wrapText: true, vertical: 'top' };
    });

    // ── SHEET 4: Remarks Detail ──────────────────────────────────────────────
    // Each individual remark entry gets its own row — same granularity
    // as the employee export. Useful for sorting/filtering by date or author.
    const sheet4 = workbook.addWorksheet('Remarks Detail');
    sheet4.columns = [
      { header: 'Task / Log',  key: 'source',      width: 35 },
      { header: 'Source Type', key: 'source_type', width: 15 },
      { header: 'Date',        key: 'date',         width: 18 },
      { header: 'Added By',    key: 'added_by',     width: 20 },
      { header: 'Remark',      key: 'text',         width: 70 },
    ];
    applyHeader(sheet4);

    // expand task remarks — one row per remark entry
    tasks.forEach((t) => {
      if (!Array.isArray(t.remarks) || t.remarks.length === 0) return;
      t.remarks.forEach((r) => {
        const row = sheet4.addRow({
          source:      t.task || t.display_id || '—',
          source_type: 'Task',
          date:        r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—',
          added_by:    r.added_by_name || '—',
          text:        r.text || '—',
        });
        row.getCell('text').alignment = { wrapText: true, vertical: 'top' };
      });
    });

    // expand work log remarks — guarded since model has no remarks field yet
    workLogs.forEach((w) => {
      if (!Array.isArray(w.remarks) || w.remarks.length === 0) return;
      w.remarks.forEach((r) => {
        const row = sheet4.addRow({
          source:      `Work Log — ${w.log_date || '—'}`,
          source_type: 'Work Log',
          date:        r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—',
          added_by:    r.added_by_name || '—',
          text:        r.text || '—',
        });
        row.getCell('text').alignment = { wrapText: true, vertical: 'top' };
      });
    });

    // 6. Stream response
    const fileName = `Intern_Report_${intern.name.replace(/\s+/g, '_')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
};

module.exports = { exportInternReport };