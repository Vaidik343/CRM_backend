const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
// const { requireAdmin } = require("../middlewares/role.middleware");
const { createUser, listUsers, getUser, updateUser, deleteUser, createUserValidators, updateUserValidators } = require("../controllers/users.controller");

const router = express.Router();


router.post  ("/users",   authenticate,    createUserValidators,   createUser);
router.get   ("/users",         authenticate,                  listUsers);
router.get   ("/users/:id",           authenticate,                getUser);
router.patch ("/users/:id", authenticate,  updateUserValidators,   updateUser);
router.delete("/users/:id",       authenticate,                    deleteUser);

module.exports = router;