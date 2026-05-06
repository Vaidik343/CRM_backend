const { body, param } = require("express-validator");
const { Call, User, Project } = require("../models");
const { handleValidation } = require("../utils/validate");
const CALL_TYPES = require("../constants/callTypes");

const createCallValidators = [
  body("caller_name").isString().trim().notEmpty(),
  body("caller_number").optional({ nullable: true }).isString().trim(),
  body("project_id").isUUID(),
  body("call_type").isIn(["inquiry", "request", "complaint"]),
  body("call_subtype").isString().trim().notEmpty(),
  body("call_summary").optional({ nullable: true }).isString(),
  body("remarks").optional({ nullable: true }).isString(),
  body("receive_type").isIn(["call", "msg", "email", "meeting"]),
  handleValidation,
];

const updateCallValidators = [
  param("id").isUUID(),
  body("caller_name").optional().isString().trim().notEmpty(),
  body("caller_number").optional({ nullable: true }).isString().trim(),
  body("project_id").optional().isUUID(),
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

const createCall = async (req, res) =>  {
  try {
    const { caller_name, caller_number, project_id, call_type, call_subtype, call_summary, remarks, receive_type } = req.body;

    // Validate subtype belongs to type
    if (!validateSubtype(call_type, call_subtype)) {
      return res.status(400).json({
        message: `Invalid call_subtype "${call_subtype}" for call_type "${call_type}". Valid options: ${CALL_TYPES[call_type]?.join(", ")}`,
      });
    }

    const project = await Project.findByPk(project_id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const call = await Call.create({
      user_id: req.user.id,
      caller_name,
      caller_number: caller_number || null,
      project_id,
      call_type,
      call_subtype,
      call_summary: call_summary || null,
      remarks: remarks || null,
      receive_type,
    });

    return res.status(201).json({ call });
  } catch (err) {
    console.error("createCall error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const listCalls = (req, res) => {
  try {
    const where = req.user.is_admin ? {} : { user_id: req.user.id };
    const calls = await Call.findAll({
      where,
      include: callIncludes,
      order: [["createdAt", "DESC"]],
    });
    return res.json({ calls });
  } catch (err) {
    console.error("listCalls error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const getCall = (req, res) => {
  try {
    const call = await Call.findByPk(req.params.id, { include: callIncludes });
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

const updateCall = (req, res) => {
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

    await call.update(patch);
    return res.json({ call });
  } catch (err) {
    console.error("updateCall error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const deleteCall = (req, res) => {
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