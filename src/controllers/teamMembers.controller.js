const { TeamMember, User, Team, Role, sequelize } = require("../models");
const { handleValidation } = require("../utils/validate");

// ADD TEAM MEMBER

const createTeamMember = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { team_id, members } = req.body;

    // Validation
    if (!team_id) {
      await transaction.rollback();

      return res.status(400).json({
        message: "team_id is required",
      });
    }

    if (!Array.isArray(members) || members.length === 0) {
      await transaction.rollback();

      return res.status(400).json({
        message: "members array is required",
      });
    }

    // Check team exists
    const team = await Team.findByPk(team_id);

    if (!team) {
      await transaction.rollback();

      return res.status(404).json({
        message: "Team not found",
      });
    }

    const createdMembers = [];
    console.log("🚀 ~ createTeamMember ~ createdMembers:", createdMembers)
    const skippedMembers = [];
    console.log("🚀 ~ createTeamMember ~ skippedMembers:", skippedMembers)

    for (const item of members) {
      const { user_id, role_id } = item;

      // Check user exists
      const user = await User.findByPk(user_id);

      if (!user) {
        skippedMembers.push({
          user_id,
          reason: "User not found",
        });

        continue;
      }

    

      // Prevent duplicate member
     const existingMember = await TeamMember.findOne({
  where: {
    team_id,
    user_id,
  },
});

if (existingMember) {

  // Reactivate if previously removed
  if (!existingMember.is_active) {
    await existingMember.update(
      { is_active: true },
      { transaction }
    );

    createdMembers.push(existingMember);
    continue;
  }

  skippedMembers.push({
    user_id,
    reason: "User already exists in this team",
  });

  continue;
}

      // Create member
      const member = await TeamMember.create(
        {
          team_id,
          user_id,
          
          is_active: true,
        },
        { transaction }
      );
      console.log("🚀 ~ createTeamMember ~ member:", member)

      createdMembers.push(member);
    }

    // If everything skipped
    if (createdMembers.length === 0) {
      await transaction.rollback();

      return res.status(400).json({
        message: "No members were added",
        skipped_members: skippedMembers,
      });
    }

    await transaction.commit();

    return res.status(201).json({
      message: "Members processed successfully",
      added_count: createdMembers.length,
      skipped_count: skippedMembers.length,
      added_members: createdMembers,
      skipped_members: skippedMembers,
    });

  } catch (error) {
    await transaction.rollback();

    console.error("createTeamMember error:", error);

    return res.status(500).json({
      message: "Something went wrong!",
    });
  }
};

// ─────────────────────────────────────────────
// GET ALL TEAM MEMBERS
// ─────────────────────────────────────────────

const getAllTeamMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

const { count, rows } = await TeamMember.findAndCountAll({
  // attributes: {
  //   exclude: ["role_id"],
  // },
where: {
    is_active: true,
  },
  limit,
  offset,

  include: [
    {
      model: Team,
      as: "team",
      attributes: ["id", "name"],
    },
    {
      model: User,
      as: "user",
      attributes: ["id", "name", "employee_id", "email"],
      include: [
        {
          model: Role,
          attributes: ["id", "name"],
        },
      ],
    },
  ],

  order: [["createdAt", "DESC"]],
});
    return res.status(200).json({
      message: "List of all Team Members",
      data: rows,
      total: count,
      page,
      limit,
    });

  } catch (error) {
    console.error("getAllTeamMembers error:", error);

    return res.status(500).json({
      message: "Something went wrong!",
    });
  }
};

// ─────────────────────────────────────────────
// GET SINGLE TEAM MEMBER
// ─────────────────────────────────────────────

const getTeamMember = async (req, res) => {
  try {
    const memberId = req.params.id;

   const member = await TeamMember.findByPk(memberId, {
  attributes: {
    exclude: ["role_id"],
  },

  include: [
    {
      model: Team,
      as: "team",
      attributes: ["id", "name"],
    },
    {
      model: User,
      as: "user",
      attributes: ["id", "name", "employee_id", "email"],
      include: [
        {
          model: Role,
          attributes: ["id", "name"],
        },
      ],
    },
  ],
});

    if (!member) {
      return res.status(404).json({
        message: "Team member not found",
      });
    }

    return res.status(200).json({
      member,
    });

  } catch (err) {
    console.error("getTeamMember error:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ─────────────────────────────────────────────
// UPDATE TEAM MEMBER
// ─────────────────────────────────────────────

const updateTeamMember = async (req, res) => {
  try {
    const teamMemberId = req.params.id;

    const teamMember = await TeamMember.findByPk(teamMemberId);

    if (!teamMember) {
      return res.status(404).json({
        message: "Team member not found",
      });
    }

    const patch = {};


    if (typeof req.body.is_active !== "undefined") {
      patch.is_active = req.body.is_active;
    }

    await teamMember.update(patch);

    return res.status(200).json({
      message: "Team member updated successfully",
      teamMember,
    });

  } catch (error) {
    console.error("updateTeamMember error:", error);

    return res.status(500).json({
      message: "Something went wrong!",
    });
  }
};

// ─────────────────────────────────────────────
// SOFT DELETE TEAM MEMBER
// ─────────────────────────────────────────────

// name to remove team member
const deleteMember = async (req, res) => {
  try {
    const memberId = req.params.id;

    const member = await TeamMember.findByPk(memberId);

    if (!member) {
      return res.status(404).json({
        message: "Team member not found",
      });
    }

    // Soft delete
    await member.update({
      is_active: false,
    });

    return res.status(200).json({
      message: "Team member deactivated successfully",
    });

  } catch (err) {
    console.error("deleteMember error:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports.teamMemberController = {
  createTeamMember,
  getAllTeamMembers,
  getTeamMember,
  updateTeamMember,
  deleteMember,
};