const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { requirePermission } = require("../middlewares/permission.middleware");
const { createTask, listTasks, getTask, updateTask, getTaskStatusLogs, deleteTask, createTaskValidators, updateTaskValidators } = require("../controllers/tasks.controller");

const router = express.Router();

router.get   ("/tasks",authenticate,listTasks);
router.get   ("/tasks/:id",authenticate, getTask);
router.get('/tasks/:id/status-logs', authenticate, getTaskStatusLogs);

router.post  ("/tasks",       authenticate,   requirePermission("can_write"),                      createTaskValidators,  createTask);

router.patch ("/tasks/:id",   authenticate, requirePermission("can_update"),  updateTask);
router.delete("/tasks/:id",   authenticate, requireAdmin,                         deleteTask);

module.exports = router;