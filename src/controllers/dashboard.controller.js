const { Op } = require("sequelize");
const { User, Call, Task, WorkLog, Role, Team, TeamMember, Project,  } = require("../models");

const getDashboard = async (req, res) => {
  try {
    const { from, to } = req.query;

    // ── Totals section filter ─────────────────────────────
    let totalsWhere = {};
    if (from && to) {
      const start = new Date(from); start.setHours(0, 0, 0, 0);
      const end   = new Date(to);   end.setHours(23, 59, 59, 999);
      totalsWhere = { createdAt: { [Op.between]: [start, end] } };
    }

    // ── Activity section filter ───────────────────────────
    const { actFrom, actTo } = req.query;
    let activityWhere = {};
    if (actFrom && actTo) {
      const start = new Date(actFrom); start.setHours(0, 0, 0, 0);
      const end   = new Date(actTo);   end.setHours(23, 59, 59, 999);
      activityWhere = { createdAt: { [Op.between]: [start, end] } };
    } else {
      // default last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      activityWhere = { createdAt: { [Op.gte]: sevenDaysAgo } };
    }

    const [totalEmployees, totalCalls, totalTasks, totalWorkLogs] = await Promise.all([
      User.count({ where: { is_admin: false, ...totalsWhere } }),
      Call.count({ where: totalsWhere }),
      Task.count({ where: totalsWhere }),
      WorkLog.count({ where: totalsWhere }),
    ]);

    const [recentCalls, recentTasks, recentWorkLogs] = await Promise.all([
      Call.count({ where: activityWhere }),
      Task.count({ where: activityWhere }),
      WorkLog.count({ where: activityWhere }),
    ]);

    const taskStatusRows = await Task.findAll({
      attributes: ["status", [Task.sequelize.fn("COUNT", Task.sequelize.col("status")), "count"]],
      where: totalsWhere,
      group: ["status"],
      raw: true,
    });
    const taskStatusBreakdown = { open: 0, ongoing: 0, closed: 0 };
    taskStatusRows.forEach((r) => { taskStatusBreakdown[r.status] = parseInt(r.count); });

    const callTypeRows = await Call.findAll({
      attributes: ["call_type", [Call.sequelize.fn("COUNT", Call.sequelize.col("call_type")), "count"]],
      where: totalsWhere,
      group: ["call_type"],
      raw: true,
    });
    const callTypeBreakdown = { inquiry: 0, request: 0, complaint: 0 };
    callTypeRows.forEach((r) => { callTypeBreakdown[r.call_type] = parseInt(r.count); });

    const employees = await User.findAll({
      where: { is_admin: false },
      attributes: ["id", "name", "employee_id"],
      include: [{ model: Role, attributes: ["name"] }],
      raw: true,
      nest: true,
    });

    const employeeIds = employees.map((e) => e.id);
    const empWhere = { ...totalsWhere };

    const [empCalls, empTasks, empLogs] = await Promise.all([
      Call.findAll({
        attributes: ["user_id", [Call.sequelize.fn("COUNT", Call.sequelize.col("user_id")), "count"]],
        where: { user_id: { [Op.in]: employeeIds }, ...empWhere },
        group: ["user_id"], raw: true,
      }),
      Task.findAll({
        attributes: ["assigned_to", [Task.sequelize.fn("COUNT", Task.sequelize.col("assigned_to")), "count"]],
        where: { assigned_to: { [Op.in]: employeeIds }, ...empWhere },
        group: ["assigned_to"], raw: true,
      }),
      WorkLog.findAll({
        attributes: ["user_id", [WorkLog.sequelize.fn("COUNT", WorkLog.sequelize.col("user_id")), "count"]],
        where: { user_id: { [Op.in]: employeeIds }, ...empWhere },
        group: ["user_id"], raw: true,
      }),
    ]);

    const callMap = Object.fromEntries(empCalls.map((r) => [r.user_id,     parseInt(r.count)]));
    const taskMap = Object.fromEntries(empTasks.map((r) => [r.assigned_to, parseInt(r.count)]));
    const logMap  = Object.fromEntries(empLogs.map((r)  => [r.user_id,     parseInt(r.count)]));

    const employeeBreakdown = employees.map((e) => ({
      id:          e.id,
      name:        e.name,
      employee_id: e.employee_id,
      role:        e.Role?.name || null,
      calls:       callMap[e.id] || 0,
      tasks:       taskMap[e.id] || 0,
      work_logs:   logMap[e.id]  || 0,
    }));

    return res.json({
      totals:                 { employees: totalEmployees, calls: totalCalls, tasks: totalTasks, work_logs: totalWorkLogs },
      last_7_days:            { calls: recentCalls, tasks: recentTasks, work_logs: recentWorkLogs },
      task_status_breakdown:  taskStatusBreakdown,
      call_type_breakdown:    callTypeBreakdown,
      employee_breakdown:     employeeBreakdown,
    });
  } catch (err) {
    console.error("getDashboard error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// ── GET /api/teams/:id/dashboard ─────────────────────────────────────────────
// Access: Admin (any team) | Team Lead/PM (their team only)

const getTeamDashboard = async (req, res) => {
  try {
    const team_id = req.params.id;

    // 1. Verify team exists
    const team = await Team.findByPk(team_id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // 2. Access check — must be admin or member of this team
    if (!req.user.is_admin) {
      const membership = await TeamMember.findOne({
        where: { team_id, user_id: req.user.id, is_active: true },
      });
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // ── SECTION 1: Team Members ───────────────────────────────────────────
    const members = await TeamMember.findAll({
      where: { team_id, is_active: true },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "employee_id"],
          include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
        },
      ],
    });

    // ── SECTION 2: Projects in this team ─────────────────────────────────
    const projects = await Project.findAll({
      where: { team_id, is_active: true },
      attributes: ["id", "name", "description", "is_active", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    const projectIds = projects.map((p) => p.id);

    // ── SECTION 3: Task stats (overall + per project) ─────────────────────
    const allTasks = await Task.findAll({
      where: { team_id },
      attributes: ["id", "task", "status", "due_date", "assigned_to", "project_id", "createdAt"],
      include: [
        { model: User, as: "assignee", attributes: ["id", "name", "employee_id"] },
        { model: Project, as: "project", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const taskStats = {
      total:   allTasks.length,
      open:    allTasks.filter((t) => t.status === "open").length,
      ongoing: allTasks.filter((t) => t.status === "ongoing").length,
      closed:  allTasks.filter((t) => t.status === "closed").length,
    };

    // Per-project task breakdown
    const projectStats = projects.map((project) => {
      const projectTasks = allTasks.filter(
        (t) => t.project_id === project.id
      );
      return {
        project_id:   project.id,
        project_name: project.name,
        total:        projectTasks.length,
        open:         projectTasks.filter((t) => t.status === "open").length,
        ongoing:      projectTasks.filter((t) => t.status === "ongoing").length,
        closed:       projectTasks.filter((t) => t.status === "closed").length,
      };
    });

    // ── SECTION 4: Overdue / urgent tasks (due within 48 hours) ──────────
    const now = new Date();
    const in48hrs = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const urgentTasks = allTasks.filter((t) => {
      if (!t.due_date || t.status === "closed") return false;
      const due = new Date(t.due_date);
      return due <= in48hrs;
    });

    const overdueTasks = urgentTasks.filter((t) => new Date(t.due_date) < now);
    const dueSoonTasks = urgentTasks.filter((t) => new Date(t.due_date) >= now);

    // ── SECTION 5: Per-member productivity ───────────────────────────────
    const memberStats = members.map((m) => {
      const memberTasks = allTasks.filter(
        (t) => t.assigned_to === m.user_id
      );
      return {
        user_id:       m.user_id,
        name:          m.user?.name,
        employee_id:   m.user?.employee_id,
        role:          m.user?.role?.name,
        tasks_total:   memberTasks.length,
        tasks_open:    memberTasks.filter((t) => t.status === "open").length,
        tasks_ongoing: memberTasks.filter((t) => t.status === "ongoing").length,
        tasks_closed:  memberTasks.filter((t) => t.status === "closed").length,
      };
    });

    // ── SECTION 6: Recent calls for team's projects ───────────────────────
    const recentCalls = await Call.findAll({
      where: {
        project_id: { [Op.in]: projectIds.length > 0 ? projectIds : [null] },
      },
      include: [
        { model: User, attributes: ["id", "name", "employee_id"] },
        { model: Project, attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    // ── SECTION 7: Recent activity feed (last 10 tasks updated) ──────────
    const recentActivity = await Task.findAll({
      where: { team_id },
      include: [
        { model: User, as: "assignee", attributes: ["id", "name"] },
        { model: User, as: "assigner", attributes: ["id", "name"] },
        { model: Project, as: "project", attributes: ["id", "name"] },
      ],
      order: [["updatedAt", "DESC"]],
      limit: 10,
    });

    // ── RESPONSE ──────────────────────────────────────────────────────────
    return res.status(200).json({
      message: "Team Dashboard",
      team: {
        id:          team.id,
        name:        team.name,
        description: team.description,
        is_active:   team.is_active,
      },
      summary: {
        total_members:  members.length,
        total_projects: projects.length,
        task_stats:     taskStats,
      },
      alerts: {
        overdue_count:   overdueTasks.length,
        due_soon_count:  dueSoonTasks.length,
        overdue_tasks:   overdueTasks,
        due_soon_tasks:  dueSoonTasks,
      },
      members,
      member_stats:    memberStats,
      project_stats:   projectStats,
      recent_calls:    recentCalls,
      recent_activity: recentActivity,
    });

  } catch (err) {
    console.error("getTeamDashboard error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// ── GET /api/me/dashboard ─────────────────────────────────────────────────────
// Access: Any logged-in user (sees only their own data)

const getEmployeeDashboard = async (req, res) => {
  try {
    const user_id = req.user.id;

    // ── SECTION 1: My Teams ───────────────────────────────────────────────
    const myMemberships = await TeamMember.findAll({
      where: { user_id, is_active: true },
      include: [
        {
          model: Team,
          as: "team",
          attributes: ["id", "name", "description", "is_active"],
        },
      ],
    });

    const myTeams = myMemberships
      .filter((m) => m.team)
      .map((m) => ({
        team_id:   m.team_id,
        team_name: m.team.name,
        is_active: m.team.is_active,
      }));

    const myTeamIds = myMemberships.map((m) => m.team_id);

    // ── SECTION 2: My Projects ────────────────────────────────────────────
    const myProjects = await Project.findAll({
      where: {
        team_id: { [Op.in]: myTeamIds.length > 0 ? myTeamIds : ["none"] },
        is_active: true,
      },
      include: [
        { model: Team, as: "team", attributes: ["id", "name"] },
        { model: User, as: "creator", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    // ── SECTION 3: My Tasks ───────────────────────────────────────────────
    const myTasks = await Task.findAll({
      where: { assigned_to: user_id },
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: Team, as: "team", attributes: ["id", "name"] },
        { model: User, as: "assigner", attributes: ["id", "name", "employee_id"] },
      ],
      order: [
        ["status", "ASC"],
        ["due_date", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    // Task stats breakdown
    const taskStats = {
      total:   myTasks.length,
      open:    myTasks.filter((t) => t.status === "open").length,
      ongoing: myTasks.filter((t) => t.status === "ongoing").length,
      closed:  myTasks.filter((t) => t.status === "closed").length,
    };

    // ── SECTION 4: Urgent tasks (due within 48 hours, not closed) ────────
    const now = new Date();
    const in48hrs = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const urgentTasks = myTasks.filter((t) => {
      if (!t.due_date || t.status === "closed") return false;
      const due = new Date(t.due_date);
      return due <= in48hrs;
    });

    const overdueTasks = urgentTasks.filter((t) => new Date(t.due_date) < now);
    const dueSoonTasks = urgentTasks.filter((t) => new Date(t.due_date) >= now);

    // ── SECTION 5: My Calls ───────────────────────────────────────────────
    const myCalls = await Call.findAll({
      where: { user_id },
      include: [
        { model: Project, attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 20,
    });

    const callStats = {
      total:     myCalls.length,
      inquiry:   myCalls.filter((c) => c.call_type === "inquiry").length,
      request:   myCalls.filter((c) => c.call_type === "request").length,
      complaint: myCalls.filter((c) => c.call_type === "complaint").length,
    };

    // ── SECTION 6: My open tasks per project (quick overview) ────────────
    const tasksByProject = myProjects.map((project) => {
      const projectTasks = myTasks.filter(
        (t) => t.project_id === project.id
      );
      return {
        project_id:   project.id,
        project_name: project.name,
        team_name:    project.team?.name,
        my_tasks:     projectTasks.length,
        open:         projectTasks.filter((t) => t.status === "open").length,
        ongoing:      projectTasks.filter((t) => t.status === "ongoing").length,
        closed:       projectTasks.filter((t) => t.status === "closed").length,
      };
    });

    // ── RESPONSE ──────────────────────────────────────────────────────────
    return res.status(200).json({
      message: "Employee Dashboard",
      summary: {
        total_teams:    myTeams.length,
        total_projects: myProjects.length,
        task_stats:     taskStats,
        call_stats:     callStats,
      },
      alerts: {
        overdue_count:  overdueTasks.length,
        due_soon_count: dueSoonTasks.length,
        overdue_tasks:  overdueTasks,
        due_soon_tasks: dueSoonTasks,
      },
      my_teams:           myTeams,
      my_projects:        myProjects,
      my_tasks:           myTasks,
      tasks_by_project:   tasksByProject,
      my_calls:           myCalls,
    });

  } catch (err) {
    console.error("getEmployeeDashboard error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = { getDashboard, getTeamDashboard, getEmployeeDashboard };