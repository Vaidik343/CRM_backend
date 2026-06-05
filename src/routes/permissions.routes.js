const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { listPermissions, getPermission, updatePermission, resetPermission, updatePermissionValidators } = require("../controllers/permissions.controller");

const router = express.Router();

// router.use(authenticate, requireAdmin);

router.get   ("/permissions",             authenticate, requireAdmin,      listPermissions);
router.get   ("/permissions/:user_id",authenticate, requireAdmin,          getPermission);
router.patch ("/permissions/:user_id", authenticate, requireAdmin,          updatePermissionValidators, updatePermission);
router.patch ("/permissions/:user_id/reset", authenticate, requireAdmin,   resetPermission);  // reset → PATCH not DELETE

module.exports = router;