const { body, param } = require("express-validator");
const { Task, User, Call, Project,Team, TeamMember   } = require("../models");
const { handleValidation } = require("../utils/validate");
const { where } = require("sequelize");

const createTaskValidators = [
    body("team_id").optional({ nullable: true, checkFalsy: true }).isUUID(),
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
   {
    model: Team,
    as: "team",
    attributes: ["id", "name"],
  },
  
];

const getTeamMembership = async (user_id, team_id) => {
  return await TeamMember.findOne({
    where: {
      user_id,
      team_id,
    },
  });
};


const createTask = async(req, res) => {
  try {
    const {call_id , project_id, team_id, task, description,  due_date } = req.body;

const assigned_to = req.body.assigned_to || req.user.id;

    const assignee = await User.findByPk(assigned_to);
    if (!assignee) return res.status(404).json({ message: "Assignee not found" });

    // replace the current admin check with this
// if (!req.user.is_admin && assigned_to !== req.user.id) {
//   return res.status(403).json({ message: "Employees can only assign tasks to themselves" });
// }

    // check exists

    const team = await Team.findByPk(team_id);

    if(!team)
    {
      return res.status(404).json({
        message:"Team not found",
      });
    }

    // check current user belongs to team
      const currentMember = await getTeamMembership(
        req.user.id,
        team_id
      );

      if(!currentMember)
      {
        return res.status(403).json({
          message: "You are not part of this team"
        })
      }

      // check assignee belongs to same team

      const assigneeMember = await getTeamMembership(
        assigned_to,
        team_id
      );

      if(!assigneeMember)
      {
        return res.status(400).json({
          message: "Assigned user is not part of this team"
        });
      }

      // permission rules
      const isLead = currentMember.role === "Team Lead" || currentMember.role === "Project Manager";

      // developers can assign to only themselves
      if(!isLead && assigned_to !== req.user.id)
      {
        return res.status(403).json({
          message: "You can only create tasks for yourself"
        });
      }


      // validate project team
      if(project_id)
      {
        const project = await Project.findByPk(project_id);

        if(!project_id)
        {
          return res.status(404).json({
            message: "Project not found",
          });
        }

        if(project.team_id !== team_id)
        {
          return res.status(400).json({
            message: "Project does not belong to this team"
          });
        }
      }


          // Auto-set status: self-assign → ongoing, assign to other → open
    const status = assigned_to === req.user.id ? "ongoing" : "open";


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
    // console.log("🚀 ~ createTask ~ newTask:", newTask)
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
    // const where = req.user.is_admin ? {} : { assigned_to: req.user.id };

    const membership = await TeamMember.findAll({
      where: {
        user_id: req.user.id,
      }
    });

    const teamIds = membership.map((m) => m.team_id);

    const leadTeams = membership.filter((m) => ["Team Lead", "Project Manager"].includes(m.role)).map((m) => m.team_id)


    let where = {};

    if(req.user.is_admin)
    {
      where = {};
    } else if (leadTeams.length > 0)
    {
      where = {
        team_id: leadTeams
      };
    } else {
  where = {
    assigned_to: req.user.id,
  };
}

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

    const membership = await getTeamMembership(
  req.user.id,
  task.team_id
);

if (!membership && !req.user.is_admin) {
  return res.status(403).json({
    message: "Forbidden",
  });
}

const isLead =
  membership &&
  ["Team Lead", "Project Manager"].includes(
    membership.role
  );

if (
  !req.user.is_admin &&
  !isLead &&
  task.assigned_to !== req.user.id
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
}

const updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // ownership check restored
const membership = await getTeamMembership(
  req.user.id,
  task.team_id
);

if (!membership && !req.user.is_admin) {
  return res.status(403).json({
    message: "Forbidden",
  });
}

const isLead =
  membership &&
  ["Team Lead", "Project Manager"].includes(
    membership.role
  );

if (
  !req.user.is_admin &&
  !isLead &&
  task.assigned_to !== req.user.id
) {
  return res.status(403).json({
    message: "Forbidden",
  });
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

