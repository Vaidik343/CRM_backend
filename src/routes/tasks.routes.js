const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { requirePermission } = require("../middlewares/permission.middleware");
const { createTask, listTasks, getTask, updateTask, deleteTask, createTaskValidators, updateTaskValidators } = require("../controllers/tasks.controller");

const router = express.Router();

router.post  ("/tasks",       authenticate, requireAdmin,                        createTaskValidators,  createTask);
router.get   ("/tasks",       authenticate,                                       listTasks);
router.get   ("/tasks/:id",   authenticate,                                       getTask);
router.patch ("/tasks/:id",   authenticate, requirePermission("can_update"),     updateTaskValidators,  updateTask);
router.delete("/tasks/:id",   authenticate, requireAdmin,                         deleteTask);

module.exports = router;