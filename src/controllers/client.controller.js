const { body, param } = require("express-validator");
const { Client, User } = require("../models");
const { Op } = require("sequelize");
const { handleValidation } = require("../utils/validate");

// ── Validators ────────────────────────────────────────────────────

const createClientValidators = [
  body("name").isString().trim().notEmpty(),
  body("phone").optional({ nullable: true }).isString(),
  body("email").optional({ nullable: true }).isEmail(),
  body("company").optional({ nullable: true }).isString(),
  handleValidation,
];

const updateClientValidators = [
  param("id").isUUID(),
  body("name").optional().isString().trim().notEmpty(),
  body("phone").optional({ nullable: true }).isString(),
  body("email").optional({ nullable: true }).isEmail(),
  body("company").optional({ nullable: true }).isString(),
  handleValidation,
];

// ── Controllers ───────────────────────────────────────────────────

const listClients = async (req, res) => {
  try {
    const clients = await Client.findAll({
      where: { is_active: true },
      order: [["name", "ASC"]],
      include: [{ model: User, as: "creator", attributes: ["id", "name"] }],
    });
    return res.status(200).json({ message: "List of Clients", data: clients });
  } catch (err) {
    console.error("listClients error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createClient = async (req, res) => {
  try {
    const { name, phone, email, company } = req.body;

    // Prevent duplicate name
    const existing = await Client.findOne({
      where: { name: { [Op.iLike]: name }, is_active: true },
    });
    if (existing) {
      return res.status(409).json({ message: "Client with this name already exists" });
    }

    const client = await Client.create({
      name,
      phone: phone || null,
      email: email || null,
      company: company || null,
      created_by: req.user.id,
    });

    return res.status(201).json({ message: "Client created", client });
  } catch (err) {
    console.error("createClient error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client || !client.is_active) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Duplicate check on name change
    if (req.body.name && req.body.name.toLowerCase() !== client.name.toLowerCase()) {
      const existing = await Client.findOne({
        where: {
          name: { [Op.iLike]: req.body.name },
          is_active: true,
          id: { [Op.ne]: client.id },
        },
      });
      if (existing) {
        return res.status(409).json({ message: "Client with this name already exists" });
      }
    }

    const patch = {};
    ["name", "phone", "email", "company"].forEach((f) => {
      if (typeof req.body[f] !== "undefined") patch[f] = req.body[f];
    });

    await client.update(patch);
    return res.status(200).json({ message: "Client updated", client });
  } catch (err) {
    console.error("updateClient error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    await client.update({ is_active: false });
    return res.status(200).json({ message: "Client deleted" });
  } catch (err) {
    console.error("deleteClient error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  listClients,
  createClient,
  updateClient,
  deleteClient,
  createClientValidators,
  updateClientValidators,
};