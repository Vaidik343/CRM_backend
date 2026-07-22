'use strict';

const { Op } = require('sequelize');
const {
  InternTask,
  InternProject,
  Intern,
  User,
  sequelize,
} = require('../models');

const generateDisplayId = require('../utils/generateDisplayId');
const { appendRemark }  = require('../utils/remarksLog');

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const taskIncludes = [
  {
    model: InternProject,
    as: 'project',
    attributes: ['id', 'display_id', 'name'],
  },
  {
    model: User,
    as: 'assigner',
    attributes: ['id', 'name', 'employee_id'],
  },
];

// ─────────────────────────────────────────────
// INTERN — Create Own Task (self assigned)
// ─────────────────────────────────────────────

const createTask = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const intern_id = req.intern.id;

    const {
      task,
      description,
      intern_project_id,
      due_date,
      remark,
    } = req.body;

    if (!task || !task.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Task name is required.' });
    }

    // validate project belongs to this intern if provided
    if (intern_project_id) {
      const project = await InternProject.findOne({
        where: { id: intern_project_id, intern_id },
      });
      if (!project) {
        await t.rollback();
        return res.status(404).json({ message: 'Project not found.' });
      }
    }

    // self created — prefix IT
    const display_id = generateDisplayId({
      prefix:     'IT',
      employeeId: req.intern.enrollment_no,
    });

    let remarks = [];
    if (remark) {
      remarks = appendRemark({
        existingRemarks: [],
        text:            remark,
        user_id:         intern_id,
        user_name:       req.intern.name,
      });
    }

    const internTask = await InternTask.create({
      intern_id,
      display_id,
      intern_project_id: intern_project_id || null,
      task:              task.trim(),
      description:       description?.trim() || null,
      assigned_by:       null, // null = self created
      status:            'ongoing', // self assign → ongoing
      due_date:          due_date || null,
      remarks,
    }, { transaction: t });

    await t.commit();

    await internTask.reload({ include: taskIncludes });

    return res.status(201).json({
      message: 'Task created successfully.',
      task: internTask,
    });

  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// INTERN — Get My Tasks (self + admin assigned)
// ─────────────────────────────────────────────

const getMyTasks = async (req, res) => {
  try {
    const intern_id = req.intern.id;

    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { status, search, from, to } = req.query;

    const where = { intern_id };

    if (status) where.status = status;

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to)   where.createdAt[Op.lte] = new Date(to);
    }

    if (search) {
      where[Op.or] = [
        { task:       { [Op.iLike]: `%${search}%` } },
        { display_id: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await InternTask.findAndCountAll({
      where,
      include:  taskIncludes,
      order:    [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      total:      count,
      page,
      totalPages: Math.ceil(count / limit),
      tasks:      rows,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// INTERN — Update Own Task
// ─────────────────────────────────────────────

const updateTask = async (req, res) => {
  try {
    const intern_id = req.intern.id;
    const { id }    = req.params;

    const {
      task,
      description,
      status,
      due_date,
      remark,
    } = req.body;

    const internTask = await InternTask.findOne({
      where: { id, intern_id },
    });

    if (!internTask) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const validStatuses = ['open', 'ongoing', 'hold', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    let updatedRemarks = internTask.remarks || [];
    if (remark) {
      updatedRemarks = appendRemark({
        existingRemarks: updatedRemarks,
        text:            remark,
        user_id:         intern_id,
        user_name:       req.intern.name,
      });
    }

    const completed_at =
      status === 'closed' && internTask.status !== 'closed'
        ? new Date()
        : internTask.completed_at;

    await internTask.update({
      task:        task?.trim()        || internTask.task,
      description: description !== undefined
        ? description?.trim() || null
        : internTask.description,
      status:      status              || internTask.status,
      due_date:    due_date !== undefined
        ? due_date || null
        : internTask.due_date,
      remarks:     updatedRemarks,
      completed_at,
    });

    await internTask.reload({ include: taskIncludes });

    return res.status(200).json({
      message: 'Task updated successfully.',
      task: internTask,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Assign Task to Intern
// ─────────────────────────────────────────────

const adminAssignTask = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const admin_id = req.user.id;

    const {
      intern_id,
      task,
      description,
      intern_project_id,
      due_date,
      remark,
    } = req.body;

    if (!intern_id || !task || !task.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'intern_id and task are required.' });
    }

    // verify intern exists and is active
    const intern = await Intern.findByPk(intern_id);
    if (!intern || intern.status !== 'active') {
      await t.rollback();
      return res.status(404).json({ message: 'Active intern not found.' });
    }

    // validate project if provided
    if (intern_project_id) {
      const project = await InternProject.findOne({
        where: { id: intern_project_id, intern_id },
      });
      if (!project) {
        await t.rollback();
        return res.status(404).json({ message: 'Project not found for this intern.' });
      }
    }

    // admin assigned — prefix ITA
    const display_id = generateDisplayId({
      prefix:     'ITA',
      employeeId: intern.enrollment_no,
    });

    let remarks = [];
    if (remark) {
      const admin = await User.findByPk(admin_id, { attributes: ['name'] });
      remarks = appendRemark({
        existingRemarks: [],
        text:            remark,
        user_id:         admin_id,
        user_name:       admin.name,
      });
    }

    const internTask = await InternTask.create({
      intern_id,
      display_id,
      intern_project_id: intern_project_id || null,
      task:              task.trim(),
      description:       description?.trim() || null,
      assigned_by:       admin_id,
      status:            'open', // admin assigned → open
      due_date:          due_date || null,
      remarks,
    }, { transaction: t });

    await t.commit();

    await internTask.reload({ include: taskIncludes });

    return res.status(201).json({
      message: 'Task assigned to intern successfully.',
      task: internTask,
    });

  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Get Intern Tasks
// ─────────────────────────────────────────────

const getInternTasks = async (req, res) => {
  try {
    const { intern_id } = req.params;

    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { status } = req.query;

    const where = { intern_id };
    if (status) where.status = status;

    const { count, rows } = await InternTask.findAndCountAll({
      where,
      include:  taskIncludes,
      order:    [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      total:      count,
      page,
      totalPages: Math.ceil(count / limit),
      tasks:      rows,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Update Intern Task
// ─────────────────────────────────────────────

const adminUpdateTask = async (req, res) => {
  try {
    const { id }   = req.params;
    const admin_id = req.user.id;

    const { task, description, status, due_date, remark } = req.body;

    const internTask = await InternTask.findByPk(id);

    if (!internTask) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const validStatuses = ['open', 'ongoing', 'hold', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    let updatedRemarks = internTask.remarks || [];
    if (remark) {
      const admin = await User.findByPk(admin_id, { attributes: ['name'] });
      updatedRemarks = appendRemark({
        existingRemarks: updatedRemarks,
        text:            remark,
        user_id:         admin_id,
        user_name:       admin.name,
      });
    }

    const completed_at =
      status === 'closed' && internTask.status !== 'closed'
        ? new Date()
        : internTask.completed_at;

    await internTask.update({
      task:        task?.trim()  || internTask.task,
      description: description !== undefined
        ? description?.trim() || null
        : internTask.description,
      status:      status        || internTask.status,
      due_date:    due_date !== undefined
        ? due_date || null
        : internTask.due_date,
      remarks:     updatedRemarks,
      completed_at,
    });

    await internTask.reload({ include: taskIncludes });

    return res.status(200).json({
      message: 'Task updated.',
      task: internTask,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createTask,
  getMyTasks,
  updateTask,
  adminAssignTask,
  getInternTasks,
  adminUpdateTask,
};