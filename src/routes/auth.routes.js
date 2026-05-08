const express = require("express");
const { login, loginValidators, logout } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/auth/login", loginValidators, login);
router.post("/auth/logout", logout);
// LOGOUT

module.exports = router;

