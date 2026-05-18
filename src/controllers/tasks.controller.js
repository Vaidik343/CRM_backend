const { body, param } = require("express-validator");
const { Task, User, Call, Project  } = require("../models");
const { handleValidation } = require("../utils/validate");

const createTaskValidators = [
  body("call_id").optional({ nullable: true ,checkFalsy: true}).isUUID(),
  body("task").isString().trim().notEmpty(),
  body("description").optional({ nullable: true }).isString(),
  body("assigned_to").optional({nullable: true ,checkFalsy: true}).isUUID(),
  body("due_date").optional({ nullable: true }).isISO8601().toDate(),
  // status intentionally excluded — auto-set by server
  handleValidation,
];

const updateTaskValidators = [
  param("id").isUUID(),
  body("task").optional().isString().trim().notEmpty(),
  body("description").optional({ nullable: true }).isString(),
  body("due_date").optional({ nullable: true }).isISO8601(),
  body("status").optional().isIn(["open", "ongoing", "closed"]),
  handleValidation,
];

const taskIncludes = [
  { model: User, as: "assignee", attributes: ["id", "name", "employee_id"] },
  { model: User, as: "assigner", attributes: ["id", "name", "employee_id"] },
  { model: Project, as: "project", attributes: ["id", "name"] },
  
];

const createTask = async(req, res) => {
  try {
    const {call_id , project_id, task, description,  due_date } = req.body;
const assigned_to = req.body.assigned_to || req.user.id;

    const assignee = await User.findByPk(assigned_to);
    if (!assignee) return res.status(404).json({ message: "Assignee not found" });

    // replace the current admin check with this
if (!req.user.is_admin && assigned_to !== req.user.id) {
  return res.status(403).json({ message: "Employees can only assign tasks to themselves" });
}
    // Auto-set status: self-assign → ongoing, assign to other → open
    const status = assigned_to === req.user.id ? "ongoing" : "open";

    

    const newTask = await Task.create({
      call_id: call_id || null,
      project_id: project_id || null,
      task,
      description: description || null,
      assigned_to,
      assigned_by: req.user.id,
      start_date: new Date(),
      due_date: due_date || null,
      status,
    });
    console.log("🚀 ~ createTask ~ newTask:", newTask)
    await newTask.reload({ include: taskIncludes });
    return res.status(201).json({ task: newTask });
    
  } catch (err) {
    console.error("createTask error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const listTasks = async(req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page -1) * limit;
    const where = req.user.is_admin ? {} : { assigned_to: req.user.id };

    const {count, rows} = await Task.findAndCountAll({
      where,
      include: taskIncludes,
      order: [["status", "ASC"], ["due_date", "ASC"], ["createdAt", "ASC"]],
        limit,
  offset,
    });
    return res.status(200).json({message: "List of all Tasks", data: rows, total: count, limit,  page, });
  } catch (err) {
    console.error("listTasks error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const getTask = async(req, res) => {
  try {
    const taskId = req.params.id;
    // console.log("🚀 ~ getTask ~ taskId:", taskId)
    
    const task = await Task.findByPk(taskId);
    // console.log("🚀 ~ getTask ~ task:", task)
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!req.user.is_admin && task.assigned_to !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({ task });
  } catch (err) {
    console.error("getTask error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // ownership check restored
    if (!req.user.is_admin && task.assigned_to !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!req.user.is_admin && task.status === "closed") {
      return res.status(400).json({ message: "Cannot update a closed task" });
    }

    const patch = {};
    ["task", "description", "due_date", "status"].forEach((f) => {
      if (typeof req.body[f] !== "undefined") patch[f] = req.body[f] ?? null;
    });

    await task.update(patch);
    await task.reload({ include: taskIncludes });
    return res.status(200).json({ task: task });


  } catch (err) {
    console.error("updateTask error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const deleteTask = async(req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Only the creator (assigned_by) or admin can delete
    if (!req.user.is_admin && task.assigned_by !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await task.destroy();
    return res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("deleteTask error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { createTask, listTasks, getTask, updateTask, deleteTask, createTaskValidators, updateTaskValidators };

