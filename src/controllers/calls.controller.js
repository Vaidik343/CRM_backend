const { body, param } = require("express-validator");
const { Call, User, Project, Task, Team, TeamMember, Client  } = require("../models");
const { handleValidation } = require("../utils/validate");
const CALL_TYPES = require("../constants/callTypes");
const { appendRemark } = require("../utils/remarksLog");
const generateDisplayId = require("../utils/generateDisplayId");
const { createNotification } = require("./notifications.controller");


const createCallValidators = [
  body("caller_name").isString().trim().notEmpty(),
  body("caller_number").optional({ nullable: true }).isString().trim(),
  body("project_id").optional({nullable: true, checkFalsy: true}).isUUID(),
  body("client_id")
  .optional({ nullable: true, checkFalsy: true})
  .isUUID(),
  body("call_type").isIn(["inquiry", "request", "complaint"]),
  body("call_subtype").isString().trim().notEmpty(),
  body("call_summary").optional({ nullable: true }).isString(),
  body("remark").optional().isString().trim().notEmpty(),
  body("receive_type").isIn(["call", "msg", "email", "meeting"]),
   body("is_task").optional({ nullable: true }).isBoolean(),
  handleValidation,
];

const updateCallValidators = [
  param("id").isUUID(),
  body("caller_name").optional().isString().trim().notEmpty(),
  body("caller_number").optional({ nullable: true }).isString().trim(),
  body("project_id").optional({nullable: true, checkFalsy: true}).isUUID(),
  body("client_id")
  .optional({ nullable: true, checkFalsy: true})
  .isUUID(),
  body("call_type").optional().isIn(["inquiry", "request", "complaint"]),
  body("call_subtype").optional().isString().trim().notEmpty(),
  body("call_summary").optional({ nullable: true }).isString(),
  body("remark").optional().trim().notEmpty(),
  body("receive_type").optional().isIn(["call", "msg", "email", "meeting"]),
  handleValidation,
];

const callIncludes = [
  {
    model: User,
    as: "caller",
    attributes: ["id", "name", "employee_id"],
  },

  {
    model: User,
    as: "transferredTo",
    attributes: ["id", "name", "employee_id"],
  },

  {
    model: User,
    as: "taskAssignee",
    attributes: ["id", "name", "employee_id"],
  },

  {
    model: Project,
    as: "project",
    attributes: ["id", "name"],
  },
  {
  model: Client,
  as: "client",
  attributes: ["id", "name", "phone", "company"],
  required: false,
},
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
      client_id ,
      call_type,
      call_subtype,
      call_summary,
      receive_type,
      is_task,        // NEW
      transfer_to,
      task_assigned_to,
      follow_up,
      parent_call_id
    } = req.body;

    const assignedTo = req.user?.id;
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


    //follow up required parent call id
    // if(follow_up && !parent_call_id)
    // {
    //   return res.status(400).json({
    //     message:"parent call id required when its follow_up"
    //   })
    // }

    // task assign to (when is_task is true and given to other emp)
    if(task_assigned_to && !is_task )
    {
      return res.status(400).json({
           message: "is_task must be true when assigning task",
      })
    }

    if (task_assigned_to) {
  const assigneeExists = await User.findByPk(task_assigned_to);
  if (!assigneeExists) {
    return res.status(404).json({ message: "task_assigned_to user not found" });
  }
}
    // transfer to
    if(transfer_to === req.user.id)
    {
     return res.status(400).json({
      message: "Cannot transfer call to yourself",
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



    // prefix display id

    let prefix = "C"

    if(transfer_to)
    {
      prefix = "CTR"
    }
    else if(is_task && task_assigned_to)
    {
      prefix = "CTA"
    }
    else if(is_task)
    {
      prefix = "CT"
    }
    else if(parent_call_id)
    {
      prefix = "CFB"
    }
    else {
      prefix = "C"
    }
    
    

    // generate display id
    const displayId = await generateDisplayId({prefix, employeeId: req.user.employee_id});
// remarks

let remarksLog = [];

// if fronted sends initial remark
if(req.body.remark)
{
  remarksLog = appendRemark({
 existingRemarks: [],
    text:req.body.remark,
    user_id:req.user.id,
    user_name:req.user.name
  }
    
  )
}
    
    // 4. Create the call
    const call = await Call.create({
      user_id:      req.user.id,
      display_id: displayId,
      client_id: client_id || null,
      caller_name,
      caller_number: caller_number || null,
      project_id:   project_id || null,
      call_type,
      call_subtype,
      call_summary:  call_summary || null,
      receive_type,
      is_task:       is_task || false,   // NEW
      transfer_to : transfer_to || null,
      task_assigned_to: task_assigned_to || null,
      // follow_up : follow_up || null,
parent_call_id: parent_call_id || null,
      remarks: remarksLog,
    });
    // console.log("🚀 ~ createCall ~ call:", call)

    await call.reload({ include: callIncludes });

    // 5. If is_task → auto-create task from call data
    if (is_task) {
  // console.log("🚀 ~ createCall ~ is_task:", is_task)

   // ✅ CREATE TASK

  //  if this logic dont work then get back old logic
const taskAssignee = task_assigned_to || req.user.id;

const task = await Task.create({
  call_id: call.id,
  project_id,
  display_id: call.display_id,
  task: call_summary
    ? `Follow up: ${call_summary}`.slice(0, 255)
    : `Follow up: ${call_subtype} from ${caller_name}`,
  description: call_summary || null,
  assigned_to: taskAssignee,
  assigned_by: req.user.id,
  status: taskAssignee === req.user.id ? "ongoing" : "open",
  start_date: new Date(),
  remarks: remarksLog,
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

    const io = req.app.get("io");

// call transferred
if (transfer_to) {
  await createNotification(io, {
    user_id: transfer_to,
    type:    "CALL_TRANSFER",
    title:   "Call Transferred to You",
    message: `A call from ${caller_name} has been transferred to you`,
    data:    { call_id: call.id, display_id: call.display_id },
  });
}

// task auto-created and assigned to someone else
if (is_task && task_assigned_to) {
  await createNotification(io, {
    user_id: task_assigned_to,
    type:    "TASK_ASSIGNED",
    title:   "New Task Assigned",
    message: `You have been assigned a task from call: ${call.display_id}`,
    data:    { task_id: task.id, display_id: task.display_id, call_id: call.id },
  });
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
      order: [["createdAt", "DESC"]],
    });

    // console.log("call all", count, rows)
    return res.status(200).json({message:"List of All calls", data: rows, total: count, page, limit})
  } catch (err) {
    console.error("listCalls error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const getCall = async (req, res) => {
  // console.log("body call by id", req.body)
  try {
    const callId = req.params.id;
    // console.log("🚀 ~ getCall ~ callId:", callId)
    const call = await Call.findByPk(callId);
    // console.log("🚀 ~ getCall ~ call:", call)
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

    const fields = ["caller_name", "caller_number", "project_id", "call_type", "call_subtype", "call_summary", "remarks", "receive_type", "client_id"];
    const patch = {};
    fields.forEach((f) => {
      if (typeof req.body[f] !== "undefined") patch[f] = req.body[f];
    });

    if(req.body.remark)
    {
     patch.remarks = appendRemark({
  existingRemarks: call.remarks,
  text: req.body.remark,
  user_id: req.user.id,
    user_name: req.user.name,
});
    }
    const uc = await call.update(patch);
    // console.log("🚀 ~ updateCall ~ uc:", uc)
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