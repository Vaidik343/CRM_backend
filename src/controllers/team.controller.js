const { body, param } = require("express-validator");
const { Team, TeamMember, User, Project } = require("../models");
const { handleValidation } = require("../utils/validate");

// VALIDATORS 

const createTeamValidators = [
  body("name").isString().trim().notEmpty(),
  body("description").optional({ nullable: true }).isString(),
  handleValidation,
];

const updateTeamValidators = [
  param("id").isUUID(),
  body("name").optional().isString().trim().notEmpty(),
  body("description").optional({ nullable: true }).isString(),
  body("is_active").optional().isBoolean(),
  handleValidation,
];

// const addMemberValidators = [
//   param("id").isUUID(), // team id
//   body("user_id").isUUID(),
//   body("role")
//     .isIn([
//       "Team Lead",
//       "Sr. Developer",
//       "Developer",
//       "Junior Developer",
//       "QA",
//       "Designer",
//       "Project Manager",
//       "Intern",
//       "Other",
//     ]),
//   handleValidation,
// ];

// const updateMemberRoleValidators = [
//   param("teamId").isUUID(),
//   param("memberId").isUUID(),
//   body("role")
//     .isIn([
//       "Team Lead",
//       "Sr. Developer",
//       "Developer",
//       "Junior Developer",
//       "QA",
//       "Designer",
//       "Project Manager",
//       "Intern",
//       "Other",
//     ]),
//   handleValidation,
// ];

// CREATE TEAM


const createTeam = async (req, res) => {
  try {
    const {project_id, name, description } = req.body;

   if(!project_id || !name)
   {
     return res.status(403).json({message:"Project id and name required."});
   }

    const project = await Project.findByPk(project_id);

    if(!project)
    {
      return res.status(403).json({message:"Project id not found"})
    }
    const exists = await Team.findOne({
      where: { name },
    });

    if (exists) {
      return res.status(400).json({
        message: "Team name already exists",
      });
    }

    const team = await Team.create({
      name,
      project_id,
      description: description || null,
      created_by: req.user.id,
    });

    return res.status(201).json({
      message: "Team created successfully",
      team,
    });
  } catch (err) {
    console.error("createTeam error:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// LIST TEAMS


const listTeams = async (req, res) => {
  try {
    const teams = await Team.findAll({
      include: [
        {
          model: Project,
            as: "project",
                    attributes: ["id", "name"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "employee_id"],
        },
        
        {
          model: TeamMember,
          as: "team_memberships",
             where: { is_active: true },      // ← add this
  required: false, 
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "employee_id"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    console.log("🚀 ~ listTeams ~ teams:", teams)

    return res.status(200).json({
      message: "List of all teams",
      
      teams,
    });
  } catch (err) {
    console.error("listTeams error:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ─────────────────────────────────────────────
// GET SINGLE TEAM
// ─────────────────────────────────────────────

const getTeam = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [
        {
          model: Project,
           as: "project",
                    attributes: ["id", "name"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "employee_id"],
        },
        {
          model: TeamMember,
          as: "team_memberships",
            where: { is_active: true },      // ← add this
  required: false, 
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "employee_id"],
            },
          ],
        },
      ],
    });

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    return res.status(200).json({
      team,
    });
  } catch (err) {
    console.error("getTeam error:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// UPDATE TEAM


const updateTeam = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    const patch = {};

    ["name", "description", "is_active"].forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        patch[field] = req.body[field];
      }
    });

    await team.update(patch);

    return res.status(200).json({
      message: "Team updated successfully",
      team,
    });
  } catch (err) {
    console.error("updateTeam error:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// DELETE TEAM


const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    await team.destroy();

    return res.status(200).json({
      message: "Team deleted successfully",
    });
  } catch (err) {
    console.error("deleteTeam error:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ADD MEMBER TO TEAM


// const addMemberToTeam = async (req, res) => {
//   try {
//     const { user_id, role } = req.body;

//     const team = await Team.findByPk(req.params.id);

//     if (!team) {
//       return res.status(404).json({
//         message: "Team not found",
//       });
//     }

//     const user = await User.findByPk(user_id);

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     const existingMember = await TeamMember.findOne({
//       where: {
//         team_id: team.id,
//         user_id,
//       },
//     });

//     if (existingMember) {
//       return res.status(400).json({
//         message: "User already exists in this team",
//       });
//     }

//     const member = await TeamMember.create({
//       team_id: team.id,
//       user_id,
//       role,
//     });

//     return res.status(201).json({
//       message: "Member added successfully",
//       member,
//     });
//   } catch (err) {
//     console.error("addMemberToTeam error:", err);
//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

// // UPDATE MEMBER ROLE


// const updateMemberRole = async (req, res) => {
//   try {
//     const { role } = req.body;

//     const member = await TeamMember.findOne({
//       where: {
//         id: req.params.memberId,
//         team_id: req.params.teamId,
//       },
//     });

//     if (!member) {
//       return res.status(404).json({
//         message: "Team member not found",
//       });
//     }

//     await member.update({ role });

//     return res.status(200).json({
//       message: "Member role updated successfully",
//       member,
//     });
//   } catch (err) {
//     console.error("updateMemberRole error:", err);
//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };


// // REMOVE MEMBER

// const removeMemberFromTeam = async (req, res) => {
//   try {
//     const member = await TeamMember.findOne({
//       where: {
//         id: req.params.memberId,
//         team_id: req.params.teamId,
//       },
//     });

//     if (!member) {
//       return res.status(404).json({
//         message: "Team member not found",
//       });
//     }

//     await member.destroy();

//     return res.status(200).json({
//       message: "Member removed successfully",
//     });
//   } catch (err) {
//     console.error("removeMemberFromTeam error:", err);
//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

// ─────────────────────────────────────────────

module.exports.teamController = {
  createTeam,
  listTeams,
  getTeam,
  updateTeam,
  deleteTeam,

  // addMemberToTeam,
  // updateMemberRole,
  // removeMemberFromTeam,

  createTeamValidators,
  updateTeamValidators,
  // addMemberValidators,
  // updateMemberRoleValidators,
};