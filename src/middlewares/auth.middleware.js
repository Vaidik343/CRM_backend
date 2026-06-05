const jwt = require("jsonwebtoken");
const { User, Role } = require("../models");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    // console.log("🚀 ~ authenticate ~ authHeader:", authHeader)
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(payload.sub, {
      attributes: ["id", "employee_id", "name", "email", "role_id", "is_admin"],
      include: [{ model: Role, attributes: ["id", "name"] }],
    });
    // console.log("🚀 ~ authenticate ~ user:", user)
    if (!user) return res.status(401).json({ message: "Invalid token" });
// console.log("AUTH USER:", req.user);
    // Flatten to a plain object and attach the role name for convenience
    req.user = user.toJSON();
    req.user.role = req.user.Role?.name || null;


    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = { authenticate };
