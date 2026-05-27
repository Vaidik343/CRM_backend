const bcrypt = require("bcryptjs");
const { body, param } = require("express-validator");
const { User, Role, Permission } = require("../models");
const { generateNextEmployeeId } = require("../services/employeeId.service");
const { generateTempPassword } = require("../services/password.service");
const { handleValidation } = require("../utils/validate");

// ── Validators ────────────────────────────────────────────────────────────────

const createUserValidators = [
  body("name").isString().trim().notEmpty(),
  body("email").optional({ nullable: true }).isEmail(),  // removed normalizeEmail()
  body("role_id").isUUID(),
  body("is_admin").optional().isBoolean(),
  handleValidation,
];

const updateUserValidators = [
  param("id").isUUID(),
  body("name").optional().isString().trim().notEmpty(),
  body("email").optional().isEmail(),  // removed normalizeEmail()
  body("role_id").optional().isUUID(),
  body("is_admin").optional().isBoolean(),
  handleValidation,
];
// ── Helpers ───────────────────────────────────────────────────────────────────

const safeAttributes = ["id", "employee_id", "name", "email", "role_id", "is_admin", "createdAt"];

const userIncludes = [{ model: Role, attributes: ["id", "name"] }];

// ── Handlers ──────────────────────────────────────────────────────────────────

const createUser = async(req, res) => {
  try {
    const { name, email, role_id, is_admin } = req.body;

    // Validate role exists
    const role = await Role.findByPk(role_id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    const employee_id = await generateNextEmployeeId();
    const plainPassword = generateTempPassword(name);
    const password = await bcrypt.hash(plainPassword, 12);

    const user = await User.create({
      employee_id,
      name,
      email,
      password,
      role_id,
      is_admin: is_admin ?? false,
    });

    // Auto-create default permission record for this user
    await Permission.create({ user_id: user.id });

    return res.status(201).json({
      message: "User created",
      user: {
        id: user.id,
        employee_id: user.employee_id,
        name: user.name,
        email: user.email,
        role_id: user.role_id,
        role: role.name,
        is_admin: user.is_admin,
        createdAt: user.createdAt, // check this in db
      },
      credentials: {
        employee_id: user.employee_id,
        password: plainPassword,
      },
    });
  } catch (err) {
      console.log("createUser full error:", err.name, err.message, err.errors);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Email already in use" });
    }

    console.error("createUser error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const listUsers = async(req, res) => {
  try {
    const users = await User.findAll({
      attributes: safeAttributes,
      include: userIncludes,
      order: [["createdAt", "ASC"]],
    });
    return res.json({ users });
  } catch (err) {
    console.error("listUsers error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const getUser = async(req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: safeAttributes,
      include: userIncludes,
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (err) {
    console.error("getUser error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const updateUser = async(req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.role_id) {
      const role = await Role.findByPk(req.body.role_id);
      if (!role) return res.status(404).json({ message: "Role not found" });
    }

    const patch = {};
    ["name", "email", "role_id", "is_admin"].forEach((f) => {
      if (typeof req.body[f] !== "undefined") patch[f] = req.body[f];
    });

    await user.update(patch);

    const updated = await User.findByPk(user.id, {
      attributes: safeAttributes,
      include: userIncludes,
    });
    return res.json({ user: updated });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Email already in use" });
    }
    // console.error("updateUser error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}


const deleteUser = async(req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    // console.log("🚀 ~ deleteUser ~ user:", user)
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    await user.destroy();
    return res.json({ message: "User deleted" });
  } catch (err) {
    // console.error("deleteUser error:", err);
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(409).json({ message: "Cannot delete employee: They are currently assigned to projects or tasks." });
    }
      
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  createUserValidators,
  updateUserValidators,
};
