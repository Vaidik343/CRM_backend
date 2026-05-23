const express = require("express");

const router = express.Router();

const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");

const {
  teamMemberController,
} = require("../controllers/teamMembers.controller");

// Protect all routes
// router.use(authenticate, requireAdmin);

// ─────────────────────────────────────────────
// CREATE TEAM MEMBER
// POST /api/team-members
// ─────────────────────────────────────────────
router.post(
  "/team-members", authenticate, requireAdmin,
  teamMemberController.createTeamMember
);

// ─────────────────────────────────────────────
// GET ALL TEAM MEMBERS
// GET /api/team-members
// ─────────────────────────────────────────────
router.get(
  "/team-members",  authenticate, requireAdmin,
  teamMemberController.getAllTeamMembers
);

// ─────────────────────────────────────────────
// GET SINGLE TEAM MEMBER
// GET /api/team-members/:id
// ─────────────────────────────────────────────
router.get(
  "/team-members/:id",  authenticate, requireAdmin,
  teamMemberController.getTeamMember
);

// ─────────────────────────────────────────────
// UPDATE TEAM MEMBER
// PUT /api/team-members/:id
// ─────────────────────────────────────────────
router.put(
  "/team-members/:id",  authenticate, requireAdmin,
  teamMemberController.updateTeamMember
);

// ─────────────────────────────────────────────
// DELETE TEAM MEMBER (SOFT DELETE)
// DELETE /api/team-members/:id
// ─────────────────────────────────────────────
router.delete(
  "/team-members/:id",  authenticate, requireAdmin,
  teamMemberController.deleteMember
);

module.exports = router;