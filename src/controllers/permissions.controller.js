const { body, param } = require("express-validator");
const { Permission, User } = require("../models");
const { handleValidation } = require("../utils/validate");

// ── Validators ────────────────────────────────────────────────────────────────


const upsertPermissionValidators = [
  // user_id removed from body — it comes from req.params.user_id
  body("can_read").optional().isBoolean(),
  body("can_write").optional().isBoolean(),
  body("can_update").optional().isBoolean(),
  body("can_delete").optional().isBoolean(),
  handleValidation,
];

const updatePermissionValidators = [
  param("user_id").isUUID(),
  body("can_read").optional().isBoolean(),
  body("can_write").optional().isBoolean(),
  body("can_update").optional().isBoolean(),
  body("can_delete").optional().isBoolean(),
  handleValidation,
];

// ── Handlers ──────────────────────────────────────────────────────────────────

/** GET /permissions — list all users with their permissions (admin only) */
const listPermissions = async(req, res) => {
  try {
    const permissions = await Permission.findAll({
      include: [{ model: User, attributes: ["id", "name", "employee_id", "email"] }],
      order: [["createdAt", "ASC"]],
    });
    return res.json({ permissions });
  } catch (err) {
    console.error("listPermissions error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/** GET /permissions/:user_id — get a single user's permission record */
const getPermission = async(req, res) => {
  try {
    const permission = await Permission.findOne({
      where: { user_id: req.params.user_id },
      include: [{ model: User, attributes: ["id", "name", "employee_id", "email"] }],
    });
    if (!permission) return res.status(404).json({ message: "Permission record not found" });
    return res.json({ permission });
  } catch (err) {
    console.error("getPermission error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/** PUT /permissions/:user_id — update flags for a user (admin only) */
const updatePermission = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [permission, created] = await Permission.findOrCreate({
      where: { user_id: req.params.user_id },
      defaults: { user_id: req.params.user_id },
    });

    const patch = {};
    const body = req.body || {};

    ["can_read", "can_write", "can_update", "can_delete"].forEach((f) => {
      if (typeof body[f] !== "undefined") {
        patch[f] = body[f];
      }
    });

    const updatedPermission = await permission.update(patch);

    return res.json({
      permission: updatedPermission,
      created,
    });

  } catch (err) {
    console.error("updatePermission error:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/** DELETE /permissions/:user_id — reset permissions to default (admin only) */
const resetPermission = async(req, res) => {
  try {
    const permission = await Permission.findOne({ where: { user_id: req.params.user_id } });
    console.log("🚀 ~ resetPermission ~ permission:", permission)
    if (!permission) return res.status(404).json({ message: "Permission record not found" });

    await permission.update({
      can_read: true,
      can_write: true,
      can_update: false,
      can_delete: false,
    });

    return res.json({ message: "Permissions reset to default", permission });
  } catch (err) {
    console.error("resetPermission error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  listPermissions,
  getPermission,
  updatePermission,
  resetPermission,
  upsertPermissionValidators,
  updatePermissionValidators,
};
