const bcrypt = require("bcryptjs");
const { body, param } = require("express-validator");
const { User } = require("../models");
const { handleValidation } = require("../utils/validate");

// ── Validators ────────────────────────────────────────────────

const changeOwnPasswordValidators = [
  body("current_password").isString().notEmpty(),
  body("new_password").isString().isLength({ min: 6 }),
  handleValidation,
];

const resetPasswordValidators = [
  param("id").isUUID(),
  handleValidation,
];

// ── Handlers ─────────────────────────────────────────────────

/** PATCH /password/change — employee changes their own password */
const changeOwnPassword = async(req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(req.body.current_password, user.password);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(req.body.new_password, 12);
    await user.update({ password: hashed });

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("changeOwnPassword error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/** PATCH /password/reset/:id — admin resets any employee's password */
const resetPassword = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate new password from their name
    const { generateTempPassword } = require("../services/password.service");
    const plainPassword = generateTempPassword(user.name);
    const hashed = await bcrypt.hash(plainPassword, 12);

    await user.update({ password: hashed });

    return res.json({
      message: "Password reset successfully",
      credentials: {
        employee_id: user.employee_id,
        password: plainPassword,
      },
    });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  changeOwnPassword,
  resetPassword,
  changeOwnPasswordValidators,
  resetPasswordValidators,
};