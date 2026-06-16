const jwt = require("jsonwebtoken");

function signAccessToken(user) {
  return jwt.sign(
    {
      employee_id: user.employee_id,
      is_admin: user.is_admin,
      role_id: user.role_id,
    },
    process.env.JWT_SECRET,
    { subject: String(user.id), expiresIn: "15d" },
  );
}

module.exports = { signAccessToken };
