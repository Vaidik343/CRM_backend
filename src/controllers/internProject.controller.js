const { Op, where } = require('sequelize');

const {
  InternProject,
  InternTask,
  User,
  Intern,
  sequelize,
} = require('../models');

const generateDisplayId = require('../utils/generateDisplayId');

// ── HELPER ──
const getProjectMentors = async (mentor_ids) => {
  if (!mentor_ids || mentor_ids.length === 0) return [];
  return await User.findAll({
    where: { id: mentor_ids },
    attributes: ['id', 'name', 'employee_id'],
  });
};

const attachProjectMentors = async (project) => {
  const plain = project.toJSON ? project.toJSON() : { ...project };
  plain.mentors = await getProjectMentors(plain.mentor_ids || []);
  return plain;
};


// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// INTERN — Create Project
// ─────────────────────────────────────────────


  
const createProject = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const intern_id = req.intern.id;
    const { name, description, tech_details, mentor_ids } = req.body;
    console.log("project", req.body);

    if (!name || !name.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Project name is required.' });
    }

    const existing = await InternProject.findOne({ where: { intern_id } });
    if (existing) {
      await t.rollback();
      return res.status(409).json({ message: 'You already have a project defined.' });
    }

    // validate mentor_ids if provided
    if (mentor_ids && Array.isArray(mentor_ids) && mentor_ids.length > 0) {
      const mentors = await User.findAll({ where: { id: mentor_ids } });
      if (mentors.length !== mentor_ids.length) {
        await t.rollback();
        return res.status(404).json({ message: 'One or more mentors not found.' });
      }
    }

    const display_id = generateDisplayId({
      prefix:     'IP',
      employeeId: req.intern.enrollment_no,
    });

    const project = await InternProject.create({
      intern_id,
      display_id,
      name:        name.trim(),
      description: description?.trim() || null,
      tech_details: tech_details       || null,
      mentor_ids:  mentor_ids          || [],
    }, { transaction: t });

    await t.commit();

    const projectWithMentors = await attachProjectMentors(project);

    return res.status(201).json({
      message: 'Project created successfully.',
      project: projectWithMentors,
    });

  } catch (err) {
    console.log("🚀 ~ createProject ~ err:", err)
    await t.rollback();
    return res.status(500).json({ message: err.message });
  }
};

// inter get own project

const getMyProject = async (req, res) => {
  try {
    const intern_id = req.intern.id;

    const project = await InternProject.findOne({ where: { intern_id } });

    if (!project) {
      return res.status(404).json({ message: 'No project found.' });
    }

    const projectWithMentors = await attachProjectMentors(project);

    return res.status(200).json({ project: projectWithMentors });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// inter - update own project

const updateProject = async (req, res) => {
  try {
    const intern_id = req.intern.id;
    const { name, description, tech_details } = req.body;
    // note: intern cannot change mentor_ids — only admin can

    const project = await InternProject.findOne({ where: { intern_id } });
    if (!project) {
      return res.status(404).json({ message: 'No project found.' });
    }

    await project.update({
      name:         name?.trim()        || project.name,
      description:  description !== undefined ? description?.trim() || null : project.description,
      tech_details: tech_details !== undefined ? tech_details : project.tech_details,
    });

    const projectWithMentors = await attachProjectMentors(project);

    return res.status(200).json({
      message: 'Project updated successfully.',
      project: projectWithMentors,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// admin - get intern's project


const getInternProject = async (req, res) => {
  try {
    const { intern_id } = req.params;

    const project = await InternProject.findOne({ where: { intern_id } });

    if (!project) {
      return res.status(404).json({ message: 'No project found for this intern.' });
    }

    const projectWithMentors = await attachProjectMentors(project);

    return res.status(200).json({ project: projectWithMentors });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// ── ADMIN — Create Project ──
const adminCreateProject = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { intern_id } = req.params;
    const { title, name, description, tech_details, tech_stack, mentor_ids } = req.body;

    const projectName = title || name;
    const projectTech = tech_details || tech_stack || {};

    const intern = await Intern.findByPk(intern_id);
    if (!intern) {
      await t.rollback();
      return res.status(404).json({ message: 'Intern not found.' });
    }

    const existing = await InternProject.findOne({ where: { intern_id } });
    if (existing) {
      await t.rollback();
      return res.status(409).json({ message: 'Project already exists for this intern. Use update instead.' });
    }

    if (!projectName || !projectName.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Project name/title is required.' });
    }

    if (mentor_ids && Array.isArray(mentor_ids) && mentor_ids.length > 0) {
      const mentors = await User.findAll({ where: { id: mentor_ids } });
      if (mentors.length !== mentor_ids.length) {
        await t.rollback();
        return res.status(404).json({ message: 'One or more mentors not found.' });
      }
    }

    const display_id = generateDisplayId({
      prefix: 'IP',
      employeeId: intern.enrollment_no,
    });

    const project = await InternProject.create({
      intern_id,
      display_id,
      name: projectName.trim(),
      description: description?.trim() || null,
      tech_details: projectTech,
      mentor_ids: mentor_ids || [],
    }, { transaction: t });

    await t.commit();

    const projectWithMentors = await attachProjectMentors(project);
    return res.status(201).json({ message: 'Project created successfully.', project: projectWithMentors });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: err.message });
  }
};

// ── ADMIN — Update Project ──
const adminUpdateProject = async (req, res) => {
  try {
    const { intern_id } = req.params;
    const { mentor_ids, title, name, description, tech_details, tech_stack } = req.body;

    const project = await InternProject.findOne({ where: { intern_id } });
    if (!project) {
      return res.status(404).json({ message: 'No project found for this intern.' });
    }

    if (mentor_ids && Array.isArray(mentor_ids) && mentor_ids.length > 0) {
      const mentors = await User.findAll({ where: { id: mentor_ids } });
      if (mentors.length !== mentor_ids.length) {
        return res.status(404).json({ message: 'One or more mentors not found.' });
      }
    }

    const projectName = title || name;
    const projectTech = tech_details !== undefined ? tech_details : tech_stack;

    await project.update({
      ...(mentor_ids !== undefined && { mentor_ids }),
      ...(projectName !== undefined && { name: projectName.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(projectTech !== undefined && { tech_details: projectTech }),
    });

    const projectWithMentors = await attachProjectMentors(project);
    return res.status(200).json({ message: 'Project updated.', project: projectWithMentors });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createProject,
  getMyProject,
  updateProject,
  getInternProject,
  adminUpdateProject,
  adminCreateProject
};