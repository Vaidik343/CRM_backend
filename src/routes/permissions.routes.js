const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { listPermissions, getPermission, updatePermission, resetPermission, updatePermissionValidators } = require("../controllers/permissions.controller");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get   ("/permissions",                   listPermissions);
router.get   ("/permissions/:user_id",          getPermission);
router.patch ("/permissions/:user_id",          updatePermissionValidators, updatePermission);
router.patch ("/permissions/:user_id/reset",    resetPermission);  // reset → PATCH not DELETE

module.exports = router;