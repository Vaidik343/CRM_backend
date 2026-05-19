const { TeamMember, User, Team } = require("../models");
const { handleValidation } = require("../utils/validate");

// ─────────────────────────────────────────────
// ADD TEAM MEMBER
// ─────────────────────────────────────────────

const createTeamMember = async (req, res) => {
  try {
    const { team_id, user_id, role } = req.body;

    // Validation
    if (!team_id) {
      return res.status(400).json({
        message: "team_id is required",
      });
    }

    if (!user_id) {
      return res.status(400).json({
        message: "user_id is required",
      });
    }

    // Check user exists
    const user = await User.findByPk(user_id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check team exists
    const team = await Team.findByPk(team_id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    // Prevent duplicate member
    const existingMember = await TeamMember.findOne({
      where: {
        team_id,
        user_id,
      },
    });

    if (existingMember) {
      return res.status(400).json({
        message: "User already exists in this team",
      });
    }

    // Create member
    const member = await TeamMember.create({
      team_id,
      user_id,
      role: role || "Developer",
      is_active: true,
    });

    return res.status(201).json({
      message: "Member added successfully",
      member,
    });

  } catch (error) {
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

    if (req.body.role) {
      patch.role = req.body.role;
    }

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