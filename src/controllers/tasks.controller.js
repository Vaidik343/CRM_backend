const { body, param } = require("express-validator");
const { Task, User, Call, Project, Role, ProjectMember, TaskStatusLog } = require("../models");
const { handleValidation } = require("../utils/validate");
const { Op } = require("sequelize");
const generateDisplayId = require("../utils/generateDisplayId");
const { appendRemark } = require("../utils/remarksLog");
const { createNotification } = require("./notifications.controller");
// ── Validators ────────────────────────────────────────────────────────────────

const createTaskValidators = [
  body("project_id")
  .optional()
  .isUUID(),
  body("call_id").optional({ nullable: true, checkFalsy: true }).isUUID(),
  body("task").isString().trim().notEmpty(),
  body("description").optional({ nullable: true }).isString(),
  body("assigned_to").optional({ nullable: true, checkFalsy: true }).isUUID(),
  body("due_date").optional({ nullable: true }).isISO8601().toDate(),
  // status intentionally excluded — auto-set by server
  handleValidation,
];

const updateTaskValidators = [
  param("id").isUUID(),
  body("task").optional().isString().trim().notEmpty(),
  body("description").optional({ nullable: true }).isString(),
  body("due_date").optional({ nullable: true }).isISO8601(),
  body("status").optional().isIn(["open", "ongoing","hold" ,"closed"]),
  handleValidation,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const taskIncludes = [
  {
    model: User,
    as: "assignee",
    attributes: ["id", "name", "employee_id"],
  },

  {
    model: User,
    as: "assigner",
    attributes: ["id", "name", "employee_id"],
  },

  {
    model: Project,
    as: "project",
    attributes: ["id", "name", "code"],
  },

  {
    model: Call,
    as: "call",
    attributes: ["id", "display_id"],
  },
];

const getProjectMembership = async (user_id, project_id) => {
  return await ProjectMember.findOne({ where: { user_id, project_id } });
};

// const getUserRole = async (user_id) => {
//   const user = await User.findByPk(user_id, {
//     include: [{ model: Role }],
//   });
// return user?.Role?.name; // "Team Lead", "Developer" etc.
// };



// ── Controllers ───────────────────────────────────────────────────────────────

const createTask = async (req, res) => {
  try {
    const { call_id, project_id,  task, description, assigned_to, due_date } = req.body;
    const assignedId = assigned_to || req.user.id;
    
    // // 1. Verify assignee exists
    const assignee = await User.findByPk(assignedId);
    // console.log("🚀 ~ createTask ~ assignee:", assignee)
    if (!assignee) {
      return res.status(404).json({ message: "Assignee not found" });
    }

    // 2. Verify project exists


    if (project_id) {
      const project = await Project.findByPk(project_id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
    }

    if(call_id)
    {
      const call = await Call.findByPk(call_id);

      if(!call)
      {
        return res.status(404).json({
          message:"Call not found"
        })
      }
    }

    // prefix for display id
    
    let prefix = "T";


if(assignedId  !== req.user.id)
{
  prefix = "TA";
}



    //generate display id
    const displayId = await generateDisplayId({prefix, employeeId: req.user.employee_id});

    
// Auto-set status: self-assign → ongoing, assign to other → open
    // const status = assignedId === req.user.id ? "ongoing" : "open";

    const allowedStatuses = ["open", "ongoing", "hold"];

const defaultStatus =
  assignedId === req.user.id
    ? "ongoing"
    : "open";

const status =
  allowedStatuses.includes(req.body.status)
    ? req.body.status
    : defaultStatus;

    let remarksLog = [];

// if fronted sends initial remark
const remarkText = req.body.remark || req.body.remarks;
if (remarkText) {
  remarksLog = appendRemark({
    existingRemarks: [],
    text: remarkText,
    user_id: req.user.id,
    user_name: req.user.name,
  });
}



    // 6. Create task
    const newTask = await Task.create({
      call_id: call_id || null,
      project_id: project_id || null,
      display_id: displayId,
      task,
      description: description || null,
      assigned_to : assignedId,
      assigned_by: req.user.id,
      start_date: new Date(),
      due_date: due_date || null,
      status,
      remarks : remarksLog
    });
    // console.log("🚀 ~ createTask ~ newTask:", newTask)

    await TaskStatusLog.create({
  task_id: newTask.id,
  changed_by: req.user.id,
  from_status: null,
  to_status: newTask.status,
  reason: null,
  changed_at: new Date(),
});

    // notify assignee only if someone else was assigned
if (assignedId !== req.user.id) {
  const io = req.app.get("io");
  await createNotification(io, {
    user_id: assignedId,
    type:    "TASK_ASSIGNED",
    title:   "New Task Assigned",
    message: `You have been assigned a task: ${newTask.task}`,
    data:    { task_id: newTask.id, display_id: newTask.display_id },
  });
}
    await newTask.reload({ include: taskIncludes });
    const io = req.app.get("io");
if (assignedId !== req.user.id) {
  io.to(`user:${assignedId}`).emit("TASK_CREATED", newTask);
}
io.to("user:admins_room").emit("TASK_CREATED", newTask);

    return res.status(201).json({ task: newTask });

  } catch (err) {
    console.error("createTask error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
 
const listTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim();
    const due_filter = req.query.due_filter; // "overdue" | "due_soon" | undefined
    console.log("🚀 ~ listTasks ~ due_filter:", due_filter)
    const status_filter = req.query.status_filter;
   


const { from, to } = req.query;
let dateWhere = {};
if (from && to) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  dateWhere = { createdAt: { [Op.between]: [start, end] } };
} else if (!req.user.is_admin && req.query.all_dates !== "true") {
  const start = new Date();
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  dateWhere = { createdAt: { [Op.between]: [start, end] } };
}

    // Get all teams user belongs to
    const membership = await ProjectMember.findAll({
      where: { user_id: req.user.id },
    });
    const projectIds = membership.map((m) => m.project_id);

    // Get user role to determine visibility scope
    // const userRole = await getUserRole(req.user.id);
    // const isLead = ["Team Lead", "Project Manager"].includes(userRole);

    // let where = {};
    // if (req.user.is_admin) {
    //   where = {};                          // Admin: see all tasks
    // } else if (isLead) {
    //   where = { team_id: teamIds };        // Lead/PM: see all tasks in their teams
    // } else {
    //   where = { assigned_to: req.user.id }; // Developer: see only own tasks
    // }


    // ── Assemble all conditions into one array, wrapped once at the end ──
    const conditions = [];

    conditions.push(
      req.user.is_admin
        ? {}
        : { [Op.or]: [{ assigned_to: req.user.id }, { assigned_by: req.user.id }] }
    );

    // Employee: dateWhere always applies (today/7-day default or explicit range).
    // Admin: dateWhere only applies if explicitly provided via from/to.
    if (!req.user.is_admin) {
      if (Object.keys(dateWhere).length) conditions.push(dateWhere);
    } else if (from && to) {
      if (Object.keys(dateWhere).length) conditions.push(dateWhere);
    }



    if (search) {
      conditions.push({
        [Op.or]: [
          { task: { [Op.iLike]: `%${search}%` } },
          { display_id: { [Op.iLike]: `%${search}%` } },

            { "$project.name$": { [Op.iLike]: `%${search}%` } },
      { "$project.code$": { [Op.iLike]: `%${search}%` } },

      { "$assignee.name$": { [Op.iLike]: `%${search}%` } },
      { "$assignee.employee_id$": { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    const now = new Date();

    if (due_filter === "overdue") {
      conditions.push({
        due_date: { [Op.lt]: now },
        status: { [Op.ne]: "closed" },
      });
    } else if (due_filter === "due_soon") {
      const in48hrs = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      conditions.push({
        due_date: { [Op.between]: [now, in48hrs] },
        status: { [Op.ne]: "closed" },
      });
    } 
    // ← add this
if (status_filter && ["open", "ongoing", "hold"].includes(status_filter)) {
  conditions.push({ status: status_filter });
}
    const where = { [Op.and]: conditions };

    const { count, rows } = await Task.findAndCountAll({
      where,
      include: taskIncludes,
      order: [
        ["createdAt", "DESC"]
        // ["status", "ASC"],
        // ["due_date", "ASC"],
        // ["createdAt", "ASC"],
      ],
      limit,
      offset,
    });

    return res.status(200).json({
      message: "List of all Tasks",
      data: rows,
      total: count,
      limit,
      page,
    });

  } catch (err) {
    console.error("listTasks error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, { include: taskIncludes });
    if (!task) return res.status(404).json({ message: "Task not found" });
if (
  !req.user.is_admin &&
  task.assigned_to !== req.user.id &&
  task.assigned_by !== req.user.id
) {
  return res.status(403).json({
    message: "Forbidden",
  });
}

    return res.json({ task });

  } catch (err) {
    console.error("getTask error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    // console.log("🚀 ~ updateTask ~ task:", task)
    if (!task) return res.status(404).json({ message: "Task not found" });

   if (
  !req.user.is_admin &&
  task.assigned_to !== req.user.id &&
  task.assigned_by !== req.user.id
) {
  return res.status(403).json({
    message: "Forbidden",
  });
}

const patch = {};
["task", "description", "due_date", "status"].forEach((f) => {
  if (typeof req.body[f] !== "undefined") patch[f] = req.body[f] ?? null;
});

const oldStatus = task.status; 
const statusChanged = patch.status && patch.status !== task.status;

    if (req.body.status === "closed" && task.status !== "closed") {
  patch.completedAt = new Date();
}

const remarkText = req.body.remark || req.body.remarks;
if (remarkText) {
  patch.remarks = appendRemark({
    existingRemarks: task.remarks || [],  
    text: remarkText,
    user_id: req.user.id,
    user_name: req.user.name,
  });
}

    await task.update(patch);

    if (statusChanged) {
  await TaskStatusLog.create({
    task_id: task.id,
    changed_by: req.user.id,
     from_status: oldStatus,   
    to_status: patch.status,
    reason: req.body.reason || null,
    changed_at: new Date(),
  });
}


    await task.reload({ include: taskIncludes });
    const io = req.app.get("io");
io.to(`user:${task.assigned_to}`).emit("TASK_UPDATED", task);
if (task.assigned_by !== task.assigned_to) {
  io.to(`user:${task.assigned_by}`).emit("TASK_UPDATED", task);
}
io.to("user:admins_room").emit("TASK_UPDATED", task);

    return res.status(200).json({ task });

  } catch (err) {
    console.error("updateTask error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const getTaskStatusLogs = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const logs = await TaskStatusLog.findAll({
      where: { task_id: req.params.id },
      include: [{ model: User, as: 'changedBy', attributes: ['id', 'name', 'employee_id'] }],
      order: [['changed_at', 'ASC']],
    });

    return res.json({ logs });
  } catch (err) {
    console.error("getTaskStatusLogs error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};



const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Only creator (assigned_by) or admin can delete
    if (!req.user.is_admin && task.assigned_by !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
const io = req.app.get("io");

const { assigned_to, assigned_by } = task;
await task.destroy();

io.to(`user:${assigned_to}`).emit("TASK_DELETED", { id: req.params.id });
if (assigned_by !== assigned_to) {
  io.to(`user:${assigned_by}`).emit("TASK_DELETED", { id: req.params.id });
}
io.to("user:admins_room").emit("TASK_DELETED", { id: req.params.id });
return res.json({ message: "Task deleted" });


  } catch (err) {
    console.error("deleteTask error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
    getTaskStatusLogs,
  createTaskValidators,
  updateTaskValidators,
};