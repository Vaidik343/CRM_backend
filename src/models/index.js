const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// ── Initialize models ─────────────────────────────────────────


const User       = require("./user.model")(sequelize, DataTypes);
const Role       = require("./role.model")(sequelize, DataTypes);
const Permission = require("./permission.model")(sequelize, DataTypes);
const Project    = require("./project.model")(sequelize, DataTypes);
const Call       = require("./call.model")(sequelize, DataTypes);
const Task       = require("./task.model")(sequelize, DataTypes);
const WorkLog    = require("./workLog.model")(sequelize, DataTypes);
const Team = require('./team.model')(sequelize, DataTypes);
const TeamMember = require('./teamMembers.model')(sequelize, DataTypes);

// ── Layer 1: Role → User ──────────────────────────────────────
Role.hasMany(User, { foreignKey: "role_id", onDelete: "RESTRICT" });
User.belongsTo(Role, { foreignKey: "role_id" });

// ── Layer 2: User → Permission (1-to-1) ───────────────────────
User.hasOne(Permission, { foreignKey: "user_id", onDelete: "CASCADE" });
Permission.belongsTo(User, { foreignKey: "user_id" });

// ── Layer 3: Project ──────────────────────────────────────────
User.hasMany(Project, { foreignKey: "created_by", as: "createdProjects", onDelete: "RESTRICT" });
Project.belongsTo(User, { foreignKey: "created_by", as: "creator" });

// ── Layer 4: Call → User + Project ───────────────────────────
User.hasMany(Call, { foreignKey: "user_id", onDelete: "RESTRICT" });
Call.belongsTo(User, { foreignKey: "user_id" });

Project.hasMany(Call, { foreignKey: "project_id", onDelete: "RESTRICT" });
Call.belongsTo(Project, { foreignKey: "project_id" });

Project.hasMany(Task, { foreignKey: "project_id", as: "projectTasks", onDelete: "SET NULL" });
Task.belongsTo(Project, { foreignKey: "project_id", as: "project" });

Project.hasMany(Team, {
  foreignKey: "project_id",
  as: "teams",
});

Team.belongsTo(Project, {
  foreignKey: "project_id",
  as: "project",
});


Call.hasMany(Task, { foreignKey: "call_id", as: "tasks", onDelete: "SET NULL" });
Task.belongsTo(Call, { foreignKey: "call_id", as: "call" });

// ── Layer 5: Task → User (assigned_to + assigned_by) ─────────
User.hasMany(Task, { foreignKey: "assigned_to", as: "assignedTasks", onDelete: "RESTRICT" });
Task.belongsTo(User, { foreignKey: "assigned_to", as: "assignee" });

User.hasMany(Task, { foreignKey: "assigned_by", as: "createdTasks", onDelete: "RESTRICT" });
Task.belongsTo(User, { foreignKey: "assigned_by", as: "assigner" });

// ── Layer 6: WorkLog → User ───────────────────────────────────
User.hasMany(WorkLog, { foreignKey: "user_id", onDelete: "CASCADE" });
WorkLog.belongsTo(User, { foreignKey: "user_id" });



// Team creator
Team.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Team, { foreignKey: 'created_by', as: 'created_teams' });

// Add associations
// TeamMember.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
// Role.hasMany(TeamMember, { foreignKey: 'role_id' });

// // Team ↔ Members (through TeamMember)
// Team.belongsToMany(User, {
//   through: TeamMember,
//   foreignKey: 'team_id',
//   otherKey: 'user_id',
//   as: 'members',
// });
// User.belongsToMany(Team, {
//   through: TeamMember,
//   foreignKey: 'user_id',
//   otherKey: 'team_id',
//   as: 'teams',
// });

// Direct TeamMember access
Team.hasMany(TeamMember, { foreignKey: 'team_id', as: 'team_memberships' });
TeamMember.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });
TeamMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Team ↔ Projects
// Team.hasMany(Project, { foreignKey: 'team_id', as: 'projects' });
// Project.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });

// Team ↔ Tasks
Team.hasMany(Task, { foreignKey: 'team_id', as: 'tasks' });
Task.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });

// ── Export ────────────────────────────────────────────────────
module.exports = {
  sequelize,
  Team,
  TeamMember,
  User,
  Role,
  Permission,
  Project,
  Call,
  Task,
  WorkLog,
};