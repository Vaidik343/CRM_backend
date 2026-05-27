const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  updateMemberRole,
  removeMember,
  addProjectMembers,
  createProjectValidators,
  updateProjectValidators,
} = require("../controllers/projects.controller");

const router = express.Router();

router.get   ("/projects",             authenticate,               listProjects);
router.get   ("/projects/:id",         authenticate,               getProject);
router.post  ("/projects",             authenticate, requireAdmin, createProjectValidators,  createProject);
router.patch ("/projects/:id",         authenticate, requireAdmin, updateProjectValidators,  updateProject);
router.delete("/projects/:id",         authenticate, requireAdmin,                           deleteProject);

// Project member management routes
router.post  ("/projects/:id/members", authenticate, requireAdmin, addProjectMembers);
router.patch ("/projects/members/:id", authenticate, requireAdmin, updateMemberRole);
router.delete("/projects/members/:id", authenticate, requireAdmin, removeMember);

module.exports = router; 