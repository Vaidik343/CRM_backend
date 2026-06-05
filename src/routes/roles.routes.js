const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { createRole, listRoles, getRole, updateRole, deleteRole, createRoleValidators, updateRoleValidators } = require("../controllers/roles.controller");

const router = express.Router();

// router.use(authenticate, requireAdmin);

router.post  ("/roles",   authenticate, requireAdmin,    createRoleValidators,   createRole);
router.get   ("/roles",   authenticate, requireAdmin,                            listRoles);
router.get   ("/roles/:id",        authenticate, requireAdmin,                   getRole);
router.patch ("/roles/:id",  authenticate, requireAdmin, updateRoleValidators,   updateRole);
router.delete("/roles/:id",   authenticate, requireAdmin,                        deleteRole);

module.exports = router;