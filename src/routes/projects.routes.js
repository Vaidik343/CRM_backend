const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { createProject, listProjects, getProject, updateProject, deleteProject, createProjectValidators, updateProjectValidators } = require("../controllers/projects.controller");

const router = express.Router();

router.get   ("/projects",      authenticate,               listProjects);
router.get   ("/projects/:id",  authenticate,               getProject);
router.post  ("/projects",      authenticate, requireAdmin, createProjectValidators,  createProject);
router.patch ("/projects/:id",  authenticate, requireAdmin, updateProjectValidators,  updateProject);
router.delete("/projects/:id",  authenticate, requireAdmin,                           deleteProject);

module.exports = router; 