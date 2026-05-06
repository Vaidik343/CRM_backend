const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permission.middleware");
const { createTask, listTasks, getTask, updateTask, deleteTask, createTaskValidators, updateTaskValidators } = require("../controllers/tasks.controller");

const router = express.Router();

router.post  ("/tasks",       authenticate, requirePermission("can_write"),  createTaskValidators,  createTask);
router.get   ("/tasks",       authenticate,                                                          listTasks);
router.get   ("/tasks/:id",   authenticate,                                                          getTask);
router.patch ("/tasks/:id",   authenticate, requirePermission("can_update"), updateTaskValidators,  updateTask);
router.delete("/tasks/:id",   authenticate, requirePermission("can_delete"),                        deleteTask);

module.exports = router;