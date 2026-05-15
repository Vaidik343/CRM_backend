const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permission.middleware");
const { createCall, listCalls, getCall, updateCall, deleteCall, createCallValidators, updateCallValidators } = require("../controllers/calls.controller");

const router = express.Router();

router.post("/calls",       authenticate, requirePermission("can_write"),  createCallValidators,  createCall);
router.get   ("/calls",       authenticate,                                                          listCalls);
router.get   ("/calls/:id",   authenticate,                                                          getCall);
router.patch ("/calls/:id",   authenticate, requirePermission("can_update"), updateCallValidators,  updateCall);
router.delete("/calls/:id",   authenticate, requirePermission("can_delete"),                        deleteCall);

module.exports = router;