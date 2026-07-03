const { body, param } = require("express-validator");
const { WorkLog, User ,Project ,Task} = require("../models");
const { handleValidation } = require("../utils/validate");
const {appendRemark} = require("../utils/remarksLog")
const { Op } = require("sequelize");

// ── Validators ────────────────────────────────────────────────────────────────

const createWorkLogValidators = [
  body("description").isString().trim().notEmpty(),
  body("date").isISO8601().toDate(),
  body("task_id").optional({ nullable: true, checkFalsy: true }).isUUID(),
  handleValidation,
];

const updateWorkLogValidators = [
  param("id").isUUID(),
  body("description").optional().isString().trim().notEmpty(),
  body("date").optional().isISO8601().toDate(),
  body("task_id").optional({ nullable: true, checkFalsy: true }).isUUID(), 
  handleValidation,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const workLogIncludes = [
  { model: User, as: "user", attributes: ["id", "name", "employee_id",] },
  {model: Project, attributes: ["id", "name"]},
    { model: Task, as: "task", attributes: ["id", "display_id", "task", "project_id"] },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

const createWorkLog = async(req, res) => {
  try {

    const {user_id, project_id, task_id, description} = req.body;

    let remarksLog = [];

    //if frontend sends initial remark

    if(req.body.remark)
    {
      remarksLog = appendRemark({

         existingRemarks:[],
        text:req.body.remark,
        user_id:req.user.id,
        user_name:req.user.name
      }
      );
    }


  let resolvedProjectId = project_id || null;

    // If task_id is given but no project_id, auto-fill project from task
    if (task_id) {
      const task = await Task.findByPk(task_id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      // Only allow logging against your own tasks
      if (task.assigned_to !== req.user.id) {
        return res.status(403).json({ message: "You can only log work against tasks assigned to you" });
      }
      if (!resolvedProjectId) {
        resolvedProjectId = task.project_id;  // ← auto-fill project from task
      }
    } else if (project_id) {
      const project = await Project.findByPk(project_id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
    }

    const workLog = await WorkLog.create({
      user_id: req.user.id,
      project_id: resolvedProjectId,
      task_id: task_id || null,   // ← add
      description: req.body.description,
      date: req.body.date,
      remarks: remarksLog,
    });

      await workLog.reload({ include: workLogIncludes }); 
    
    // console.log("🚀 ~ createWorkLog ~ workLog:", workLog)
    return res.status(201).json({ workLog });

  } catch (err) {
    console.error("createWorkLog error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const listWorkLogs = async(req, res) => {
  
  try {
    const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page -1) * limit;
    let where = req.user.is_admin ? {} : { user_id: req.user.id };
        const search = req.query.search?.trim();

    

const { from, to } = req.query;

let dateWhere = {};
if (from && to) {
  dateWhere = { date: { [Op.between]: [from, to] } };
} else if (!req.user.is_admin) {
  // employee default: today only
  const todayStr = new Date().toISOString().split("T")[0];
  dateWhere = { date: todayStr };
}
        
 if (!req.user.is_admin) {
  // employee: always scoped to today/selected range
  where = { ...where, ...dateWhere };
} else if (from && to) {
  // admin: only filter by date if explicitly provided
  where = { ...where, ...dateWhere };
}
// else admin with no from/to → no date filter, sees everything

if (search) {
  where = {
    [Op.and]: [
      where,
      {
        [Op.or]: [
          { "$user.name$": { [Op.iLike]: `%${search}%` } },
          { "$user.employee_id$": { [Op.iLike]: `%${search}%` } },
          { "$Project.name$": { [Op.iLike]: `%${search}%` } },
        ],
      },
    ],
  };
}

    const {count, rows} = await WorkLog.findAndCountAll({
      limit,
      offset,
      where,
      include: workLogIncludes,
      order: [["date", "DESC"], ["createdAt", "DESC"]],
       subQuery: false,
    });
    return res.status(200).json({message:"List of All Work logs", data: rows, total: count, page, limit});
  } catch (err) {
    console.error("listWorkLogs error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const getWorkLog = async (req, res) => {
  try {
      
    
    const workLog = await WorkLog.findByPk(req.params.id, { include: workLogIncludes });
    // console.log("🚀 ~ getWorkLog ~ workLog:", workLog)
    if (!workLog) return res.status(404).json({ message: "Work log not found" });
    if (!req.user.is_admin && workLog.user_id !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });
    return res.json({ workLog });
  } catch (err) {
    console.error("getWorkLog error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const updateWorkLog = async (req, res) => {
  try {
    const workLog = await WorkLog.findByPk(req.params.id);
    if (!workLog) return res.status(404).json({ message: "Work log not found" });
    if (!req.user.is_admin && workLog.user_id !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });

    const patch = {};
    if (req.body.description) patch.description = req.body.description;
    if (req.body.date) patch.date = req.body.date;
    if (typeof req.body.task_id !== "undefined") patch.task_id = req.body.task_id || null;  // ← add
    if (typeof req.body.project_id !== "undefined") patch.project_id = req.body.project_id || null;

    if (req.body.remark) {
      patch.remarks = appendRemark({
        existingRemarks: workLog.remarks,
        text: req.body.remark,
        user_id: req.user.id,
        user_name: req.user.name,
      });
    }

    await workLog.update(patch);
    await workLog.reload({ include: workLogIncludes });  // ← reload for consistent response
    return res.json({ workLog });
  } catch (err) {
    console.error("updateWorkLog error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteWorkLog = async (req, res) => {
  try {
    const workLog = await WorkLog.findByPk(req.params.id);
    if (!workLog) return res.status(404).json({ message: "Work log not found" });
    if (!req.user.is_admin && workLog.user_id !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });

    await workLog.destroy();
    return res.json({ message: "Work log deleted" });
  } catch (err) {
    console.error("deleteWorkLog error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  createWorkLog,
  listWorkLogs,
  getWorkLog,
  updateWorkLog,
  deleteWorkLog,
  createWorkLogValidators,
  updateWorkLogValidators,
};
