const { body, param } = require("express-validator");
const { Role } = require("../models");
const { handleValidation } = require("../utils/validate");

// ── Validators ────────────────────────────────────────────────────────────────

const createRoleValidators = [
  body("name").isString().trim().notEmpty(),
  handleValidation,
];

const updateRoleValidators = [
  param("id").isUUID(),
  body("name").isString().trim().notEmpty(),
  handleValidation,
];

// ── Handlers ──────────────────────────────────────────────────────────────────

const createRole = async (req, res) => {
  try {

    const {name} = req.body;

    if(!name)
    {
      return res.status(400).json({message: "Field required!"})
    }

  
    const existing = await Role.findOne({ where: {name} });
    if (existing) return res.status(409).json({ message: "Role already exists" });

    const role = await Role.create({ name});
    return res.status(201).json({message:"role created", role });
  } catch (err) {
    console.error("createRole error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const listRoles = async(req, res) => {
  try {
    const roles = await Role.findAll({ order: [["name", "ASC"]] });
    return res.json({message:"List of all roles", roles });
  } catch (err) {
    console.error("listRoles error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const getRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });
    return res.json({ role });
  } catch (err) {
    console.error("getRole error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const updateRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    const duplicate = await Role.findOne({ where: { name: req.body.name } });
    if (duplicate && duplicate.id !== role.id) {
      return res.status(409).json({ message: "Role name already in use" });
    }

    await role.update({ name: req.body.name });
    return res.json({ role });
  } catch (err) {
    console.error("updateRole error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    await role.destroy();
    return res.json({ message: "Role deleted" });
  } catch (err) {
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(409).json({ message: "Cannot delete role: users are assigned to it" });
    }
    console.error("deleteRole error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  createRole,
  listRoles,
  getRole,
  updateRole,
  deleteRole,
  createRoleValidators,
  updateRoleValidators,
};
