/**
 * requireRole("admin") — allows users whose Role.name matches OR who are is_admin.
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.is_admin || req.user.role === role) return next();
    return res.status(403).json({ message: "Forbidden" });
  };
}

/**
 * requireAdmin — shorthand that only allows is_admin users.
 */
function requireAdmin(req, res, next) {
  console.log("requireAdmin hit:", req.method, req.path, "is_admin:", req.user?.is_admin);
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (!req.user.is_admin) return res.status(403).json({ message: "Forbidden: Admins only" });
  next();
}


module.exports = { requireRole, requireAdmin };

