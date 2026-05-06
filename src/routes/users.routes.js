const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { createUser, listUsers, getUser, updateUser, deleteUser, createUserValidators, updateUserValidators } = require("../controllers/users.controller");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.post  ("/users",       createUserValidators,   createUser);
router.get   ("/users",                               listUsers);
router.get   ("/users/:id",                           getUser);
router.patch ("/users/:id",   updateUserValidators,   updateUser);
router.delete("/users/:id",                           deleteUser);

module.exports = router;