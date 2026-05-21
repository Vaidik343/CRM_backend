const { body, param } = require("express-validator");
const { Task, User, Call, Project, Team, TeamMember, Role } = require("../models");
const { handleValidation } = require("../utils/validate");

// ── Validators ────────────────────────────────────────────────────────────────

const createTaskValidators = [
  body("team_id").optional({ nullable: true, checkFalsy: true }).isUUID(),
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
  body("status").optional().isIn(["open", "ongoing", "closed"]),
  handleValidation,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const taskIncludes = [
  { model: User, as: "assignee", attributes: ["id", "name", "employee_id"] },
  // { model: User, as: "assigner", attributes: ["id", "name", "employee_id"] },
  { model: Project, as: "project", attributes: ["id", "name"] },
  { model: Team, as: "team", attributes: ["id", "name"] },
];

const getTeamMembership = async (user_id, team_id) => {
  return await TeamMember.findOne({ where: { user_id, team_id } });
};

const getUserRole = async (user_id) => {
  const user = await User.findByPk(user_id, {
    include: [{ model: Role, as: "Role" }],
  });
  return user?.role?.name; // "Team Lead", "Developer" etc.
};

// ── Controllers ───────────────────────────────────────────────────────────────

const createTask = async (req, res) => {
  try {
    const { call_id, project_id, team_id, task, description, due_date } = req.body;
    const assigned_to = req.body.assigned_to || req.user.id;

    // 1. Verify assignee exists
    const assignee = await User.findByPk(assigned_to);
    if (!assignee) {
      return res.status(404).json({ message: "Assignee not found" });
    }

    // 2. Verify team exists
    const team = await Team.findByPk(team_id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // 3. Non-admin checks: membership + role permissions
    if (!req.user.is_admin) {

      // 3a. Creator must be team member
      const currentMember = await getTeamMembership(req.user.id, team_id);
      if (!currentMember) {
        return res.status(403).json({ message: "You are not part of this team" });
      }

      // 3b. Assignee must be in same team
      const assigneeMember = await getTeamMembership(assigned_to, team_id);
      if (!assigneeMember) {
        return res.status(400).json({ message: "Assigned user is not part of this team" });
      }

      // 3c. Only Team Lead / PM can assign to others
      const userRole = await getUserRole(req.user.id);
      const isLead = ["Team Lead", "Project Manager"].includes(userRole);
      if (!isLead && assigned_to !== req.user.id) {
        return res.status(403).json({ message: "You can only create tasks for yourself" });
      }
    }

    // 4. If project provided, verify it belongs to same team
    if (project_id) {
      const project = await Project.findByPk(project_id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.team_id !== team_id) {
        return res.status(400).json({ message: "Project does not belong to this team" });
      }
    }

    // 5. Auto-set status: self-assign → ongoing, assign to other → open
    const status = assigned_to === req.user.id ? "ongoing" : "open";

    // 6. Create task
    const newTask = await Task.create({
      call_id: call_id || null,
      project_id: project_id || null,
      team_id,
      task,
      description: description || null,
      assigned_to,
      assigned_by: req.user.id,
      start_date: new Date(),
      due_date: due_date || null,
      status,
    });

    await newTask.reload({ include: taskIncludes });
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

    // Get all teams user belongs to
    const membership = await TeamMember.findAll({
      where: { user_id: req.user.id },
    });
    const teamIds = membership.map((m) => m.team_id);

    // Get user role to determine visibility scope
    const userRole = await getUserRole(req.user.id);
    const isLead = ["Team Lead", "Project Manager"].includes(userRole);

    let where = {};
    if (req.user.is_admin) {
      where = {};                          // Admin: see all tasks
    } else if (isLead) {
      where = { team_id: teamIds };        // Lead/PM: see all tasks in their teams
    } else {
      where = { assigned_to: req.user.id }; // Developer: see only own tasks
    }

    const { count, rows } = await Task.findAndCountAll({
      where,
      include: taskIncludes,
      order: [
        ["status", "ASC"],
        ["due_date", "ASC"],
        ["createdAt", "ASC"],
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

    if (!req.user.is_admin) {
      // Must be team member
      const membership = await getTeamMembership(req.user.id, task.team_id);
      if (!membership) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Lead/PM can see all team tasks; others only their own
      const userRole = await getUserRole(req.user.id);
      const isLead = ["Team Lead", "Project Manager"].includes(userRole);
      if (!isLead && task.assigned_to !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
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
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!req.user.is_admin) {
      // Must be team member
      const membership = await getTeamMembership(req.user.id, task.team_id);
      if (!membership) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Lead/PM can update any task in team; others only their own
      const userRole = await getUserRole(req.user.id);
      const isLead = ["Team Lead", "Project Manager"].includes(userRole);
      if (!isLead && task.assigned_to !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Cannot update a closed task
      if (task.status === "closed") {
        return res.status(400).json({ message: "Cannot update a closed task" });
      }
    }

    const patch = {};
    ["task", "description", "due_date", "status"].forEach((f) => {
      if (typeof req.body[f] !== "undefined") patch[f] = req.body[f] ?? null;
    });

    await task.update(patch);
    await task.reload({ include: taskIncludes });
    return res.status(200).json({ task });

  } catch (err) {
    console.error("updateTask error:", err);
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

    await task.destroy();
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
  createTaskValidators,
  updateTaskValidators,
};