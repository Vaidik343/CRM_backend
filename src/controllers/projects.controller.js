const { body, param } = require("express-validator");
const { Project, User, Team, TeamMember, Role , sequelize } = require("../models");
const { Op } = require("sequelize");
const { handleValidation } = require("../utils/validate");

// ── Validators ────────────────────────────────────────────────────────────────

const createProjectValidators = [
  // body("team_id").optional({ nullable: true, checkFalsy: true }).isUUID(),
  body("name").isString().trim().notEmpty(),
  body("description").optional({ nullable: true }).isString(),
  body("remarks").optional({ nullable: true }).isString(),
  handleValidation,
];

const updateProjectValidators = [
  param("id").isUUID(),
  // body("team_id").optional({ nullable: true, checkFalsy: true }).isUUID(),
  body("name").optional().isString().trim().notEmpty(),
  body("description").optional({ nullable: true }).isString(),
  body("remarks").optional({ nullable: true }).isString(),
  body("is_active").optional().isBoolean(),
  handleValidation,
];

// ── Helpers ───────────────────────────────────────────────────────────────────



const projectIncludes = [
  {
    model: User,
    as: "creator",
    attributes: ["id", "name", "employee_id"],
  },
  {
    model: Team,
    as: "teams",
    attributes: ["id", "name", "project_id"],
  },
];

const getUserRole = async (user_id) => {
  const user = await User.findByPk(user_id, {
    include: [{ model: Role}]
  });
  return user?.Role?.name; // "Team Lead", "Developer" etc.
};
// ── Handlers ──────────────────────────────────────────────────────────────────

const createProject = async (req, res) => {
    const transaction = await sequelize.transaction();
  try {
    const { name, description, remarks } = req.body;

        if(!name)
    {
        await transaction.rollback();
      return res.status(400).json({message: "Name Field required!"})
    }


    


    // optional
    //only admin or team lead can create project

// FIX — clean rewrite:
// if (!req.user.is_admin) {
//   const member = await TeamMember.findOne({
//     where: {  user_id: req.user.id, is_active: true },
//        transaction,
//   });

//   if (!member) {
//     return res.status(403).json({ message: "You are not part of this team" });
//   }

//   const userRole = await getUserRole(req.user.id);
//   if (!["Team Lead", "Project Manager"].includes(userRole)) {
//     return res.status(403).json({ message: "Only Team Lead can create project" });
//   }
// }

    const existing = await Project.findOne({
      where: {name},
            transaction,
    })

      if(existing)
    {
        await transaction.rollback();
        return res.status(409).json({message:"Already Exist in this team!"})
    }

    
    const project = await Project.create({
      name,
      
      description: description || null,
      remarks: remarks || null,
      created_by: req.user.id,
      is_active: true,
    } ,{ transaction });

      await transaction.commit();
    await project.reload({ include: projectIncludes });
    return res.status(201).json({ project });
  } catch (err) {
       await transaction.rollback();

    console.error("createProject error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}


const listProjects = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let where = {
      is_active: true,
    };

    // EMPLOYEE
    if (!req.user.is_admin) {

      // Get all active team memberships
      const memberships = await TeamMember.findAll({
        where: {
          user_id: req.user.id,
          is_active: true,
        },
        attributes: ["team_id"],
      });

      const teamIds = memberships.map((m) => m.team_id);

      // No team assigned
      if (!teamIds.length) {
        return res.status(200).json({
          message: "No projects found",
          data: [],
          total: 0,
          page,
          limit,
        });
      }

      // Get teams linked to projects
      const teams = await Team.findAll({
        where: {
          id: teamIds,
          project_id: {
            [Op.ne]: null,
          },
        },
        attributes: ["project_id"],
      });

      const projectIds = teams.map((t) => t.project_id);

      // No project linked
      if (!projectIds.length) {
        return res.status(200).json({
          message: "No projects found",
          data: [],
          total: 0,
          page,
          limit,
        });
      }

      // Filter projects
      where.id = projectIds;
    }

    const { count, rows } = await Project.findAndCountAll({
      limit,
      offset,
      where,
      include: projectIncludes,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });

    return res.status(200).json({
      message: "List of Projects",
      data: rows,
      total: count,
      page,
      limit,
    });

  } catch (err) {

    console.error("listProjects error:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, { include: projectIncludes });
    if (!project) return res.status(404).json({ message: "Project not found" });
     // Employee access check
    if (!req.user.is_admin) {

      const member = await TeamMember.findOne({
        where: {
          // team_id: project.team_id,
          user_id: req.user.id,
          is_active: true,
        },
      });

      if (!member) {
        return res.status(403).json({
          message: "Access denied",
        });
      }
    }
    return res.status(200).json({ project });
  } catch (err) {
    console.error("getProject error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const updateProject = async (req, res) => {
  try {

    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Permission check
    if (!req.user.is_admin) {

      const member = await TeamMember.findOne({
        where: {
          // team_id: project.team_id,
          user_id: req.user.id,
          is_active: true,
        },
      });

      if (!member) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      const userRole = await getUserRole(req.user.id);
if (!["Team Lead", "Project Manager"].includes(userRole)) {
  return res.status(403).json({ message: "Only Team Lead can update project" });
}

    }

    const patch = {};

    [
      "name",
      "description",
      "remarks",
      "is_active",
    ].forEach((field) => {

      if (typeof req.body[field] !== "undefined") {
        patch[field] = req.body[field];
      }
    });

    await project.update(patch);

    return res.status(200).json({
      message: "Project updated successfully",
      project,
    });

  } catch (err) {

    console.error("updateProject error:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};




// ─────────────────────────────────────────────
// DELETE PROJECT
// ─────────────────────────────────────────────
const deleteProject = async (req, res) => {
  try {

    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Permission check
    if (!req.user.is_admin) {

      const member = await TeamMember.findOne({
        where: {
          // team_id: project.team_id,
          user_id: req.user.id,
          is_active: true,
        },
      });

     if (!member) {
  return res.status(403).json({ message: "Access denied" });
}
const userRole = await getUserRole(req.user.id);
if (!["Team Lead", "Project Manager"].includes(userRole)) {
  return res.status(403).json({ message: "Only Team Lead can delete project" });
}
    }

    await project.destroy();

    return res.status(200).json({
      message: "Project deleted successfully",
    });

  } catch (err) {

    console.error("deleteProject error:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  createProjectValidators,
  updateProjectValidators,
};
