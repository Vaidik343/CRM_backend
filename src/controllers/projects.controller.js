const { body, param } = require("express-validator");
const { Project, User, Team, TeamMember } = require("../models");
const { handleValidation } = require("../utils/validate");

// ── Validators ────────────────────────────────────────────────────────────────

const createProjectValidators = [
  body("team_id").optional({ nullable: true, checkFalsy: true }).isUUID(),
  body("name").isString().trim().notEmpty(),
  body("description").optional({ nullable: true }).isString(),
  body("remarks").optional({ nullable: true }).isString(),
  handleValidation,
];

const updateProjectValidators = [
  param("id").isUUID(),
  body("team_id").optional({ nullable: true, checkFalsy: true }).isUUID(),
  body("name").optional().isString().trim().notEmpty(),
  body("description").optional({ nullable: true }).isString(),
  body("remarks").optional({ nullable: true }).isString(),
  body("is_active").optional().isBoolean(),
  handleValidation,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const projectIncludes = [
  { model: User, as: "creator", attributes: ["id", "name", "employee_id"] },
   {
    model: Team,
    as: "team",
    attributes: ["id", "name"],
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

const createProject = async (req, res) => {
  try {
    const { name, team_id, description, remarks } = req.body;

        if(!name)
    {
      return res.status(400).json({message: "Field required!"})
    }

    if(!team_id)
    {
       return res.status(400).json({message:"Field required!"});
    }

    
      // Check team exists
    const team = await Team.findByPk(team_id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }


    // optional
    //only admin or team lead can create project

    if(!req.user.is_admin)
    {
      const member = await TeamMember.findOnd({
        where: {
          team_id,
          user_id: req.user.id,
          is_active: true,
        },
      });

      if(!member)
      {
        return res.status(403).json({
          message: "You are not part of this team",
        });
      }

      if(member.role !== "Team Lead")
      {
        return res.status(403).json({
          message: "Only Team Lead can create project",
        });
      }
    }

    const existing = await Project.findOne({
      where: {name, team_id}
    })

      if(existing)
    {
        return res.status(409).json({message:"Already Exist in this team!"})
    }

    
    const project = await Project.create({
      name,
      description: description || null,
      remarks: remarks || null,
      created_by: req.user.id,
      is_active: true,
    });

    await project.reload({ include: projectIncludes });
    return res.status(201).json({ project });
  } catch (err) {
    console.error("createProject error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}


const listProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page -1) * limit;
    
    let where = {};

    //Admin sees all projects 
    if(!req.user.is_admin)
    {
      // Get all teams of logged-in user

      const memberships = await TeamMember.findAll({
        where: {

          user_id: req.user.id,
          is_active: true,
        },
      });

      const teamIds = memberships.map( (m) => m.team_id);

      where.team_id = teamIds;
      where.is_active = true;
    }

    const {count, rows} = await Project.findAndCountAll({
      limit,
      offset,
      where,
      include: projectIncludes,
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({message:"List of All Projects", data: rows, total: count, page, limit});
  } catch (err) {
    console.error("listProjects error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const getProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, { include: projectIncludes });
    if (!project) return res.status(404).json({ message: "Project not found" });
     // Employee access check
    if (!req.user.is_admin) {

      const member = await TeamMember.findOne({
        where: {
          team_id: project.team_id,
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
          team_id: project.team_id,
          user_id: req.user.id,
          is_active: true,
        },
      });

      if (!member) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      if (member.role !== "Team Lead") {
        return res.status(403).json({
          message: "Only Team Lead can update project",
        });
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
          team_id: project.team_id,
          user_id: req.user.id,
          is_active: true,
        },
      });

      if (!member || member.role !== "Team Lead") {

        return res.status(403).json({
          message: "Only Team Lead can delete project",
        });
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
