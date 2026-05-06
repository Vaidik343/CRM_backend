const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { createRole, listRoles, getRole, updateRole, deleteRole, createRoleValidators, updateRoleValidators } = require("../controllers/roles.controller");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.post  ("/roles",       createRoleValidators,   createRole);
router.get   ("/roles",                               listRoles);
router.get   ("/roles/:id",                           getRole);
router.patch ("/roles/:id",   updateRoleValidators,   updateRole);
router.delete("/roles/:id",                           deleteRole);

module.exports = router;