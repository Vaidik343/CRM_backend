const { body, param } = require("express-validator");
const { WorkLog, User } = require("../models");
const { handleValidation } = require("../utils/validate");

// ── Validators ────────────────────────────────────────────────────────────────

const createWorkLogValidators = [
  body("description").isString().trim().notEmpty(),
  body("date").isISO8601().toDate(),
  handleValidation,
];

const updateWorkLogValidators = [
  param("id").isUUID(),
  body("description").optional().isString().trim().notEmpty(),
  body("date").optional().isISO8601().toDate(),
  handleValidation,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const workLogIncludes = [
  { model: User, attributes: ["id", "name", "employee_id"] },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

const createWorkLog = async(req, res) => {
  try {
    const workLog = await WorkLog.create({
      user_id: req.user.id,
      description: req.body.description,
      date: req.body.date,
    });
    return res.status(201).json({ workLog });
  } catch (err) {
    console.error("createWorkLog error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const listWorkLogs = async(req, res) => {
  try {
    const where = req.user.is_admin ? {} : { user_id: req.user.id };
    const workLogs = await WorkLog.findAll({
      where,
      include: workLogIncludes,
      order: [["date", "DESC"], ["createdAt", "DESC"]],
    });
    return res.json({ workLogs });
  } catch (err) {
    console.error("listWorkLogs error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const getWorkLog = async (req, res) => {
  try {
    const workLog = await WorkLog.findByPk(req.params.id, { include: workLogIncludes });
    if (!workLog) return res.status(404).json({ message: "Work log not found" });
    if (!req.user.is_admin && workLog.user_id !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });
    return res.json({ workLog });
  } catch (err) {
    console.error("getWorkLog error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const updateWorkLog = async(req, res) => {
  try {
    const workLog = await WorkLog.findByPk(req.params.id);
    if (!workLog) return res.status(404).json({ message: "Work log not found" });
    if (!req.user.is_admin && workLog.user_id !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });

    const patch = {};
    if (req.body.description) patch.description = req.body.description;
    if (req.body.date) patch.date = req.body.date;

    await workLog.update(patch);
    return res.json({ workLog });
  } catch (err) {
    console.error("updateWorkLog error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

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
