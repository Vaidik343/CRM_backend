const express = require("express");
const { login, loginValidators } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/auth/login", loginValidators, login);

module.exports = router;

