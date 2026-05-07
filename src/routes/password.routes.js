const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const {
  changeOwnPassword,
  resetPassword,
  changeOwnPasswordValidators,
  resetPasswordValidators,
} = require("../controllers/password.controller");

const router = express.Router();

// Any logged-in employee changes their own password
router.patch("/password/change", authenticate, changeOwnPasswordValidators, changeOwnPassword);

// Admin resets any employee's password
router.patch("/password/reset/:id", authenticate, requireAdmin, resetPasswordValidators, resetPassword);

module.exports = router;