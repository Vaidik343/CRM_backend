const { body, param } = require("express-validator");
const { Client, User } = require("../models");
const { Op, literal } = require("sequelize");
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

// ── Internal helper — called from calls.controller.js ──────────────────────
const findOrCreateClientForCall = async ({ phone, name, email, company, created_by }) => {
  if (!phone) return null;

  let client = await Client.findOne({ where: { phone } });

  if (!client) {
    return await Client.create({
      phone,
      names: name ? [name] : [],
      email: email || null,
      company: company || null,
      created_by,
      is_active: true,
    });
  }

  let changed = false;
  const names = [...(client.names || [])];

  if (name && !names.some((n) => n.toLowerCase() === name.toLowerCase())) {
    names.push(name);
    changed = true;
  }

  if (company && company !== client.company) {
    client.company = company;
    changed = true;
  }

  // only update email if client has none yet — don't overwrite existing
  if (email && !client.email) {
    client.email = email;
    changed = true;
  }

  if (changed) {
    client.names = names;
    await client.save();
  }

  return client;
};

// ── Controllers ───────────────────────────────────────────────────

const listClients = async (req, res) => {
  try {


     const search = req.query.search?.trim();
    let where = { is_active: true };

    if (search) {
      where[Op.or] = [
        { phone: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } },
        literal(`"Client"."names"::text ILIKE '%${search.replace(/'/g, "''")}%'`),
      ];
    }

    const clients = await Client.findAll({
      where,
      order: [["createdAt", "DESC"]],
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

      if (!phone || !name) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    // Prevent duplicate name
    const existing = await Client.findOne({ where: { phone } });
    if (existing) {
      // merge instead of erroring — same "update details" behavior
      const client = await findOrCreateClientForCall({
        phone, name, company, created_by: req.user.id,
      });
      return res.status(200).json({ message: "Client updated (existing number)", client });
    }
    // if (existing) {
    //   return res.status(409).json({ message: "Client with this name already exists" });
    // }

    const client = await Client.create({
      phone,
      names: [name],
      company: company || null,
      email: email || null,
      created_by: req.user.id,
      is_active: true,
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

    // Duplicate check on name change - no use now after its change to names
      // const existing = await Client.findOne({
      //   where: {
      //     names: [] ,
      //     is_active: true,
      //     id: { [Op.ne]: client.id },
      //   },
      // });
      // if (existing) {
      //   return res.status(409).json({ message: "Client with this name already exists" });
      // }
    

    const patch = {};
    ["names", "phone", "email", "company"].forEach((f) => {
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
  findOrCreateClientForCall,
  createClientValidators,
  updateClientValidators,
};