const { body, param } = require("express-validator");
const { Project, User } = require("../models");
const { handleValidation } = require("../utils/validate");

// ── Validators ────────────────────────────────────────────────────────────────

const createProjectValidators = [
  body("name").isString().trim().notEmpty(),
  body("description").optional({ nullable: true }).isString(),
  body("remarks").optional({ nullable: true }).isString(),
  handleValidation,
];

const updateProjectValidators = [
  param("id").isUUID(),
  body("name").optional().isString().trim().notEmpty(),
  body("description").optional({ nullable: true }).isString(),
  body("remarks").optional({ nullable: true }).isString(),
  body("is_active").optional().isBoolean(),
  handleValidation,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const projectIncludes = [
  { model: User, as: "creator", attributes: ["id", "name", "employee_id"] },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

const createProject = async (req, res) => {
  try {
    const { name, description, remarks } = req.body;

        if(!name)
    {
      return res.status(400).json({message: "Field required!"})
    }

    const existing = await Project.findOne({
      where: {name}
    })

      if(existing)
    {
        return res.status(409).json({message:"Already Exist!"})
    }

    const project = await Project.create({
      name,
      description: description || null,
      remarks: remarks || null,
      created_by: req.user.id,
      is_active: true,
    });

    return res.status(201).json({ project });
  } catch (err) {
    console.error("createProject error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}


const listProjects = async (req, res) => {
  try {

    const where = req.user.is_admin ? {} : { is_active: true };

    const projects = await Project.findAll({
      where,
      include: projectIncludes,
      order: [["createdAt", "DESC"]],
    });
    return res.json( projects );
  } catch (err) {
    console.error("listProjects error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const getProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, { include: projectIncludes });
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json({ project });
  } catch (err) {
    console.error("getProject error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only creator or admin can update
    if (!req.user.is_admin && project.created_by !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const patch = {};
    ["name", "description", "remarks", "is_active"].forEach((f) => {
      if (typeof req.body[f] !== "undefined") patch[f] = req.body[f] ?? null;
    });

    await project.update(patch);
    return res.json({ project });
  } catch (err) {
    console.error("updateProject error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const deleteProject = async (req, res) =>{
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!req.user.is_admin && project.created_by !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await project.destroy();
    return res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("deleteProject error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  createProjectValidators,
  updateProjectValidators,
};
