const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const { User, Role, Permission } = require("../models");
const { signAccessToken } = require("../services/jwt.service");
const { handleValidation } = require("../utils/validate");

const loginValidators = [
  body("employee_id").isString().trim().notEmpty(),
  body("password").isString().notEmpty(),
  handleValidation,
];

const login = async (req, res) => {
  try {
    const { employee_id, password } = req.body;

    const user = await User.findOne({
      where: { employee_id },
      include: [
        { model: Role, attributes: ["id", "name"] },
        { model: Permission, attributes: ["can_read", "can_write", "can_update", "can_delete"] },
      ],
    });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = signAccessToken(user);

    return res.json({
      accessToken,
      user: {
        id: user.id,
        employee_id: user.employee_id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
        role: user.Role?.name || null,
        permissions: user.Permission || null,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}


  
const logout = (req, res) => {
  return res.json({ message: "Logged out successfully" });
};
module.exports = { login, loginValidators, logout};