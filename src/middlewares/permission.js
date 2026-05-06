const { Permission } = require("../models");

const VALID_FLAGS = ["can_read", "can_write", "can_update", "can_delete"];

function requirePermission(flag) {
  return async (req, res, next) => {
    try {
      if (!VALID_FLAGS.includes(flag)) {
        console.error(`requirePermission: unknown flag "${flag}"`);
        return res.status(500).json({ message: "Internal server error" });
      }

      if (req.user.is_admin) return next();

      const permission = await Permission.findOne({
        where: { user_id: req.user.id },
      });

      if (!permission || !permission[flag]) {
        return res.status(403).json({ message: "Forbidden: insufficient permissions" });
      }

      next();
    } catch (err) {
      console.error("requirePermission error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}