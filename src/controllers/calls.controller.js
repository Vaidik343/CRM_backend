const { body, param } = require("express-validator");
const { Call, User, Project, Task, Team, TeamMember } = require("../models");
const { handleValidation } = require("../utils/validate");
const CALL_TYPES = require("../constants/callTypes");

const createCallValidators = [
  body("caller_name").isString().trim().notEmpty(),
  body("caller_number").optional({ nullable: true }).isString().trim(),
  body("project_id").optional({nullable: true}).isUUID(),
  body("call_type").isIn(["inquiry", "request", "complaint"]),
  body("call_subtype").isString().trim().notEmpty(),
  body("call_summary").optional({ nullable: true }).isString(),
  body("remarks").optional({ nullable: true }).isString(),
  body("receive_type").isIn(["call", "msg", "email", "meeting"]),
   body("is_task").optional({ nullable: true }).isBoolean(),
  handleValidation,
];

const updateCallValidators = [
  param("id").isUUID(),
  body("caller_name").optional().isString().trim().notEmpty(),
  body("caller_number").optional({ nullable: true }).isString().trim(),
  body("project_id").optional({nullable: true}).isUUID(),
  body("call_type").optional().isIn(["inquiry", "request", "complaint"]),
  body("call_subtype").optional().isString().trim().notEmpty(),
  body("call_summary").optional({ nullable: true }).isString(),
  body("remarks").optional({ nullable: true }).isString(),
  body("receive_type").optional().isIn(["call", "msg", "email", "meeting"]),
  handleValidation,
];

const callIncludes = [
  { model: User, attributes: ["id", "name", "employee_id"] },     
  { model: Project, attributes: ["id", "name"] },                  
];
// ── Subtype validator helper ───────────────────────────────────
function validateSubtype(call_type, call_subtype) {
  const validSubtypes = CALL_TYPES[call_type];
  if (!validSubtypes) return false;
  return validSubtypes.includes(call_subtype);
}

const createCall = async (req, res) => {
  try {
    const {
      caller_name,
      caller_number,
      project_id,
      call_type,
      call_subtype,
      call_summary,
      remarks,
      receive_type,
      is_task,        // NEW
    } = req.body;

    // 1. Validate subtype belongs to type
    if (!validateSubtype(call_type, call_subtype)) {
      return res.status(400).json({
        message: `Invalid call_subtype "${call_subtype}" for call_type "${call_type}". Valid options: ${CALL_TYPES[call_type]?.join(", ")}`,
      });
    }

    // 2. is_task requires project_id (need team_id from project for task)
    if (is_task && !project_id) {
      return res.status(400).json({
        message: "project_id is required when is_task is true",
      });
    }

    // 3. Validate project exists if provided
    let project = null;
    if (project_id) {
      project = await Project.findByPk(project_id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
    }

    // 4. Create the call
    const call = await Call.create({
      user_id:      req.user.id,
      caller_name,
      caller_number: caller_number || null,
      project_id:   project_id || null,
      call_type,
      call_subtype,
      call_summary:  call_summary || null,
      remarks:       remarks || null,
      receive_type,
      is_task:       is_task || false,   // NEW
    });
    console.log("🚀 ~ createCall ~ call:", call)

    await call.reload({ include: callIncludes });

    // 5. If is_task → auto-create task from call data
    if (is_task) {
  console.log("🚀 ~ createCall ~ is_task:", is_task)
  // Find team that has this project linked
  const teamForProject = await Team.findOne({
    where: { project_id: project_id }
  });
  console.log("🚀 ~ createCall ~ teamForProject:", teamForProject)

  if (!teamForProject) {
    return res.status(201).json({
      call,
      task: null,
      warning: "Call created but task was not auto-created because no team is linked to this project",
    });
  }

  const team_id = teamForProject.id;  // ✅ correct team_id


   // ✅ CREATE TASK
  const task = await Task.create({
    call_id: call.id,
    project_id: project_id,
    team_id: team_id,
    task: call_summary
      ? `Follow up: ${call_summary}`.slice(0, 255)
      : `Follow up: ${call_subtype} from ${caller_name}`,

    description: call_summary || null,

    assigned_to: req.user.id,
    assigned_by: req.user.id,

    status: "ongoing",
    start_date: new Date(),
    due_date: null,
  });

  
      await task.reload({
        include: [
          { model: User, as: "assignee", attributes: ["id", "name", "employee_id"] },
          { model: User, as: "assigner", attributes: ["id", "name", "employee_id"] },
          { model: Project, as: "project" , attributes: ["id", "name"] },
          { model: Team, as: "team", attributes: ["id", "name"] },
        ],
      });

      return res.status(201).json({ call, task});
    }

    // 6. Normal call (no task)
    return res.status(201).json({ call, task: null });

  } catch (err) {
    console.error("createCall error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const listCalls = async(req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page -1) * limit;
    const where = req.user.is_admin ? {} : { user_id: req.user.id };

    const {count,rows} = await Call.findAndCountAll({
      limit,
      offset,
      where,
      include: callIncludes,
      order: [["id", "DESC"]],
    });

    // console.log("call all", count, rows)
    return res.status(200).json({message:"List of All calls", data: rows, total: count, page, limit})
  } catch (err) {
    console.error("listCalls error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const getCall = async (req, res) => {
  console.log("body call by id", req.body)
  try {
    const callId = req.params.id;
    console.log("🚀 ~ getCall ~ callId:", callId)
    const call = await Call.findByPk(callId);
    console.log("🚀 ~ getCall ~ call:", call)
    if (!call) return res.status(404).json({ message: "Call not found" });

    if (!req.user.is_admin && call.user_id !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({ call });
  } catch (err) {
    console.error("getCall error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const updateCall = async  (req, res) => {
  try {
    const call = await Call.findByPk(req.params.id);
    if (!call) return res.status(404).json({ message: "Call not found" });

    if (!req.user.is_admin && call.user_id !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // If either call_type or call_subtype is being updated, validate the pair
    const newType    = req.body.call_type    || call.call_type;
    const newSubtype = req.body.call_subtype || call.call_subtype;
    if ((req.body.call_type || req.body.call_subtype) && !validateSubtype(newType, newSubtype)) {
      return res.status(400).json({
        message: `Invalid call_subtype "${newSubtype}" for call_type "${newType}". Valid options: ${CALL_TYPES[newType]?.join(", ")}`,
      });
    }

    const fields = ["caller_name", "caller_number", "project_id", "call_type", "call_subtype", "call_summary", "remarks", "receive_type"];
    const patch = {};
    fields.forEach((f) => {
      if (typeof req.body[f] !== "undefined") patch[f] = req.body[f];
    });

    const uc = await call.update(patch);
    await call.reload({ include: callIncludes });
    return res.json({ call });
  } catch (err) {
    console.error("updateCall error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const deleteCall = async  (req, res) => {
  try {
    const call = await Call.findByPk(req.params.id);
    if (!call) return res.status(404).json({ message: "Call not found" });

    if (!req.user.is_admin && call.user_id !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await call.destroy();
    return res.json({ message: "Call deleted" });
  } catch (err) {
    console.error("deleteCall error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { createCall, listCalls, getCall, updateCall, deleteCall, createCallValidators, updateCallValidators };