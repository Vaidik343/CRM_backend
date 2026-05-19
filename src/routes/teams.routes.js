const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const {requireAdmin} = require("../middlewares/role.middleware");

const {teamController} = require("../controllers/team.controller");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.post("/teams", authenticate, teamController.createTeamValidators ,teamController.createTeam);

// get all
router.get("/teams", authenticate, teamController.listTeams)


router.get("/teams/:id", authenticate, teamController.getTeam);

router.put("/teams/:id", authenticate, teamController.updateTeamValidators , teamController.updateTeam);

// add member to team
router.post("/teams/:id/members", authenticate, teamController.addMemberValidators ,teamController.addMemberToTeam);


// update team member role
router.put("/teams/:id/members/:id" , authenticate, teamController.updateMemberRoleValidators, teamController.updateMemberRole);

//Remove team Member
router.delete("/teams/:id/members/:id", authenticate, teamController.removeMemberFromTeam);

module.exports = router;