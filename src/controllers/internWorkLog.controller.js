

const { Op } = require('sequelize');
const {
  InternWorkLog,
  InternProject,
  InternTask,
  sequelize,
} = require('../models');

const generateDisplayId = require('../utils/generateDisplayId');

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const worklogIncludes = [
  {
    model: InternProject,
    as: 'project',
    attributes: ['id', 'display_id', 'name'],
  },
  {
    model: InternTask,
    as: 'task',
    attributes: ['id', 'display_id', 'task'],
  },
];

// ─────────────────────────────────────────────
// INTERN — Create WorkLog
// ─────────────────────────────────────────────

const createWorkLog = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const intern_id = req.intern.id;

    const {
      description,
      hours,
      log_date,
      intern_project_id,
      intern_task_id,
    } = req.body;

    // ── Required fields ──
    if (!description || !description.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'description is required.' });
    }

    if (!hours) {
      await t.rollback();
      return res.status(400).json({ message: 'hours is required.' });
    }

    if (!log_date) {
      await t.rollback();
      return res.status(400).json({ message: 'log_date is required.' });
    }

    if (isNaN(parseFloat(hours)) || parseFloat(hours) <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'hours must be a positive number.' });
    }

    // ── Validate project if provided ──
    if (intern_project_id) {
      const project = await InternProject.findOne({
        where: { id: intern_project_id, intern_id },
      });
      if (!project) {
        await t.rollback();
        return res.status(404).json({ message: 'Project not found.' });
      }
    }

    // ── Validate task if provided ──
    if (intern_task_id) {
      const task = await InternTask.findOne({
        where: { id: intern_task_id, intern_id },
      });
      if (!task) {
        await t.rollback();
        return res.status(404).json({ message: 'Task not found.' });
      }
    }

    const display_id = generateDisplayId({
      prefix:     'IW',
      employeeId: req.intern.enrollment_no,
    });

    const worklog = await InternWorkLog.create({
      intern_id,
      display_id,
      description:       description.trim(),
      hours:             parseFloat(hours),
      log_date,
      intern_project_id: intern_project_id || null,
      intern_task_id:    intern_task_id    || null,
    }, { transaction: t });

    await t.commit();

    await worklog.reload({ include: worklogIncludes });

    return res.status(201).json({
      message: 'Work log created successfully.',
      worklog,
    });

  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// INTERN — Get My WorkLogs
// ─────────────────────────────────────────────

const getMyWorkLogs = async (req, res) => {
  try {
    const intern_id = req.intern.id;

    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { from, to, search } = req.query;

    const where = { intern_id };

    if (from || to) {
      where.log_date = {};
      if (from) where.log_date[Op.gte] = from;
      if (to)   where.log_date[Op.lte] = to;
    }

    if (search) {
      where.description = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await InternWorkLog.findAndCountAll({
      where,
      include:  worklogIncludes,
      order:    [['log_date', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      total:      count,
      page,
      totalPages: Math.ceil(count / limit),
      worklogs:   rows,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// INTERN — Update WorkLog
// ─────────────────────────────────────────────

const updateWorkLog = async (req, res) => {
  try {
    const intern_id = req.intern.id;
    const { id }    = req.params;

    const { description, hours, log_date, intern_project_id, intern_task_id } = req.body;

    const worklog = await InternWorkLog.findOne({
      where: { id, intern_id },
    });

    if (!worklog) {
      return res.status(404).json({ message: 'Work log not found.' });
    }

    if (hours !== undefined && (isNaN(parseFloat(hours)) || parseFloat(hours) <= 0)) {
      return res.status(400).json({ message: 'hours must be a positive number.' });
    }

    // validate project if changing
    if (intern_project_id !== undefined && intern_project_id) {
      const project = await InternProject.findOne({
        where: { id: intern_project_id, intern_id },
      });
      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }
    }

    // validate task if changing
    if (intern_task_id !== undefined && intern_task_id) {
      const task = await InternTask.findOne({
        where: { id: intern_task_id, intern_id },
      });
      if (!task) {
        return res.status(404).json({ message: 'Task not found.' });
      }
    }

    await worklog.update({
      description: description?.trim()      || worklog.description,
      hours:       hours !== undefined
        ? parseFloat(hours)
        : worklog.hours,
      log_date:    log_date                 || worklog.log_date,
      intern_project_id: intern_project_id !== undefined
        ? intern_project_id || null
        : worklog.intern_project_id,
      intern_task_id: intern_task_id !== undefined
        ? intern_task_id || null
        : worklog.intern_task_id,
    });

    await worklog.reload({ include: worklogIncludes });

    return res.status(200).json({
      message: 'Work log updated successfully.',
      worklog,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Get Intern WorkLogs
// ─────────────────────────────────────────────

const getInternWorkLogs = async (req, res) => {
  try {
    const { intern_id } = req.params;

    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { from, to } = req.query;

    const where = { intern_id };

    if (from || to) {
      where.log_date = {};
      if (from) where.log_date[Op.gte] = from;
      if (to)   where.log_date[Op.lte] = to;
    }

    const { count, rows } = await InternWorkLog.findAndCountAll({
      where,
      include:  worklogIncludes,
      order:    [['log_date', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      total:      count,
      page,
      totalPages: Math.ceil(count / limit),
      worklogs:   rows,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createWorkLog,
  getMyWorkLogs,
  updateWorkLog,
  getInternWorkLogs,
};