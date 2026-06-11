const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const {
  listClients,
  createClient,
  updateClient,
  deleteClient,
  createClientValidators,
  updateClientValidators,
} = require("../controllers/client.controller");

// Both admin and employee can read (for call form dropdown)
router.get("/clients", authenticate, listClients);

// Admin only for write operations
router.post("/clients", authenticate, requireAdmin, createClientValidators, createClient);
router.patch("/clients/:id", authenticate, requireAdmin, updateClientValidators, updateClient);
router.delete("/clients/:id", authenticate, requireAdmin, deleteClient);

module.exports = router;