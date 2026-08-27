const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const { Intern, InternProject, InternTask, InternWorkLog, User } = require('../models');

const exportInternReport = async (req, res) => {
  try {
    const internId = req.params.id || req.user?.intern_id || req.user?.id;
    const { from, to } = req.query;

    // 1. Fetch Intern & Projects
    const intern = await Intern.findByPk(internId, {
      include: [
        { model: InternProject, as: 'projects' }
      ]
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    const activeProject = intern.projects && intern.projects.length > 0 ? intern.projects[0] : null;

    // 2. Date range filter (filters by createdAt)
    const dateWhere = {};
    if (from && to) {
      dateWhere.createdAt = { 
        [Op.between]: [new Date(`${from}T00:00:00.000Z`), new Date(`${to}T23:59:59.999Z`)] 
      };
    }

    // 3. Fetch Tasks
    const tasks = await InternTask.findAll({ 
      where: { intern_id: internId, ...dateWhere },
      include: [{ model: User, as: 'assigner', attributes: ['name'] }],
      order: [['createdAt', 'DESC']]
    });

    // 4. Fetch Work Logs (Ordered by 'log_date')
    const workLogs = await InternWorkLog.findAll({ 
      where: { intern_id: internId, ...dateWhere },
      order: [['log_date', 'DESC']] // ← Fixed column name here!
    });

    // 5. Initialize ExcelJS Workbook
    const workbook = new ExcelJS.Workbook();

    // --- SHEET 1: OVERVIEW & PROJECT ---
    const sheet1 = workbook.addWorksheet('Overview & Project');
    sheet1.columns = [
      { header: 'Field', key: 'field', width: 25 }, 
      { header: 'Value', key: 'val', width: 55 }
    ];
    sheet1.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '132EA7' } };
    
    sheet1.addRow({ field: 'Intern Name', val: intern.name });
    sheet1.addRow({ field: 'Intern ID', val: intern.display_id || intern.employee_id || '—' });
    sheet1.addRow({ field: 'Email', val: intern.email });
    sheet1.addRow({ field: 'Mobile', val: intern.mobile || '—' });
    sheet1.addRow({ field: 'Status', val: intern.status?.toUpperCase() });
    sheet1.addRow({ field: 'Start Date', val: intern.start_date || '—' });
    sheet1.addRow({ field: 'End Date', val: intern.end_date || '—' });
    sheet1.addRow({});
    sheet1.addRow({ field: 'PROJECT DETAILS', val: '' });
    sheet1.addRow({ field: 'Project Title', val: activeProject?.name || activeProject?.title || 'Not Assigned' });
    sheet1.addRow({ field: 'Project Description', val: activeProject?.description || '—' });


      // --- SHEET 2: TASKS ---
    const sheet2 = workbook.addWorksheet('Tasks');
    sheet2.columns = [
      { header: 'Display ID', key: 'display_id', width: 15 },
      { header: 'Task Name', key: 'title', width: 35 },
      { header: 'Description', key: 'description', width: 45 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Assigned By', key: 'assigner', width: 20 },
      { header: 'Due Date', key: 'due_date', width: 15 },
      { header: 'Remark / Admin Notes', key: 'remark', width: 45 }, // ← Added Remark Column!
      { header: 'Created Date', key: 'createdAt', width: 18 }
    ];
    sheet2.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '132EA7' } };

    tasks.forEach(t => {
      sheet2.addRow({
        display_id: t.display_id || `TASK-${t.id}`,
        title: t.task || t.title || '—',
        description: t.description || '—',
        status: (t.status || '—').toUpperCase(),
        assigner: t.assigner?.name || 'Admin',
        due_date: t.due_date || '—',
        remark: t.remark || '—', // ← Populates Remark value!
        createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—',
      });
    });

    // --- SHEET 3: WORK LOGS ---
    const sheet3 = workbook.addWorksheet('Work Logs');
    sheet3.columns = [
      { header: 'Log Date', key: 'log_date', width: 15 },
      { header: 'Description', key: 'description', width: 55 },
      { header: 'Hours Spent', key: 'hours', width: 15 }
    ];
    sheet3.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet3.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '132EA7' } };

    workLogs.forEach(w => {
      sheet3.addRow({
        log_date: w.log_date || (w.createdAt ? new Date(w.createdAt).toISOString().split('T')[0] : '—'),
        description: w.description || '—',
        hours: w.hours || '—',
      });
    });

    // 6. Response Headers & File Stream
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
