const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// ── Initialize models ─────────────────────────────────────────


const User       = require("./user.model")(sequelize, DataTypes);
const Role       = require("./role.model")(sequelize, DataTypes);
const Permission = require("./permission.model")(sequelize, DataTypes);
const Project    = require("./project.model")(sequelize, DataTypes);
const Call       = require("./call.model")(sequelize, DataTypes);
const Client = require("./client.model")(sequelize, DataTypes);
const Task       = require("./task.model")(sequelize, DataTypes);
const WorkLog    = require("./workLog.model")(sequelize, DataTypes);
const Team = require('./team.model')(sequelize, DataTypes);
const TeamMember = require('./teamMembers.model')(sequelize, DataTypes);
const ProjectMember = require("./projectMembers.model")(sequelize, DataTypes);
const Notification = require("./notification.model")(sequelize, DataTypes);
const TaskStatusLog = require("../models/taskStatusLog.model")(sequelize, DataTypes);

 
// ── Role ↔ User ───────────────────────────────────────────────
Role.hasMany(User, { foreignKey: "role_id", onDelete: "RESTRICT" });
User.belongsTo(Role, { foreignKey: "role_id" });
 
 
// ── User ↔ Permission (1-to-1) ────────────────────────────────
User.hasOne(Permission, { foreignKey: "user_id", onDelete: "CASCADE" });
Permission.belongsTo(User, { foreignKey: "user_id" });
 
 
// ── Project ↔ User (creator) ──────────────────────────────────
User.hasMany(Project, { foreignKey: "created_by", as: "createdProjects", onDelete: "RESTRICT" });
Project.belongsTo(User, { foreignKey: "created_by", as: "creator" });
 
 
// ── Project ↔ ProjectMember ───────────────────────────────────
Project.hasMany(ProjectMember, { foreignKey: "project_id", as: "members", onDelete: "CASCADE" });
ProjectMember.belongsTo(Project, { foreignKey: "project_id", as: "project" });
 
User.hasMany(ProjectMember, { foreignKey: "user_id", as: "projectMemberships", onDelete: "CASCADE" });
ProjectMember.belongsTo(User, { foreignKey: "user_id", as: "user" });
 
Role.hasMany(ProjectMember, { foreignKey: "role_id", onDelete: "SET NULL" });
ProjectMember.belongsTo(Role, { foreignKey: "role_id", as: "role" });
 
 
// ── Call ↔ User + Project ─────────────────────────────────────
User.hasMany(Call, { foreignKey: "user_id", as: "calls", onDelete: "RESTRICT" });
Call.belongsTo(User, { foreignKey: "user_id", as: "caller" });
 
Project.hasMany(Call, { foreignKey: "project_id", as: "calls", onDelete: "RESTRICT" });
Call.belongsTo(Project, { foreignKey: "project_id", as: "project" });
 
// Call transfer_to → User
User.hasMany(Call, { foreignKey: "transfer_to", as: "transferredCalls" });
Call.belongsTo(User, { foreignKey: "transfer_to", as: "transferredTo" });
 
// Call task_assigned_to → User
User.hasMany(Call, { foreignKey: "task_assigned_to", as: "callTaskAssignments" });
Call.belongsTo(User, { foreignKey: "task_assigned_to", as: "taskAssignee" });
 
 
// ── Task ↔ Project + Call ─────────────────────────────────────
Project.hasMany(Task, { foreignKey: "project_id", as: "projectTasks", onDelete: "SET NULL" });
Task.belongsTo(Project, { foreignKey: "project_id", as: "project" });
 
Call.hasMany(Task, { foreignKey: "call_id", as: "tasks", onDelete: "SET NULL" });
Task.belongsTo(Call, { foreignKey: "call_id", as: "call" });
 
// Self-referencing: follow-up call links back to the original call
Call.belongsTo(Call, { foreignKey: "parent_call_id", as: "parentCall" });
Call.hasMany(Call, { foreignKey: "parent_call_id", as: "followUpCalls" });
 
// Call → Client
Call.belongsTo(Client, { foreignKey: "client_id", as: "client" });
Client.hasMany(Call, { foreignKey: "client_id", as: "calls" });


// ── Task ↔ User (assigned_to + assigned_by) ───────────────────
User.hasMany(Task, { foreignKey: "assigned_to", as: "assignedTasks", onDelete: "RESTRICT" });
Task.belongsTo(User, { foreignKey: "assigned_to", as: "assignee" });
 
User.hasMany(Task, { foreignKey: "assigned_by", as: "createdTasks", onDelete: "RESTRICT" });
Task.belongsTo(User, { foreignKey: "assigned_by", as: "assigner" });
 
 
// ── WorkLog ↔ User ────────────────────────────────────────────
User.hasMany(WorkLog, { foreignKey: "user_id",  as: "workLogs",  onDelete: "CASCADE" });
WorkLog.belongsTo(User, { foreignKey: "user_id",  as: "user"  });


// Client associations
Client.belongsTo(User, { foreignKey: "created_by", as: "creator" });

//worklog to project
Project.hasMany(WorkLog,{foreignKey: "project_id"});
WorkLog.belongsTo(Project,{foreignKey: "project_id"})
 

// worklog and task

  WorkLog.belongsTo(Task, { foreignKey: 'task_id', as: 'task' }); // ← add this
// ── Notification ↔ User ───────────────────────────────────────
User.hasMany(Notification, { foreignKey: "user_id", as: "notifications", onDelete: "CASCADE" });
Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });
 

// Task status log to task
Task.hasMany(TaskStatusLog, { foreignKey: 'task_id', as: 'statusLogs' });
TaskStatusLog.belongsTo(Task, { foreignKey: 'task_id' });
TaskStatusLog.belongsTo(User, { foreignKey: 'changed_by', as: 'changedBy' });

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
  TaskStatusLog,
  Permission,
  Project,
  Call,
  Client,
  Task,
  WorkLog,
  ProjectMember,
  Notification
};