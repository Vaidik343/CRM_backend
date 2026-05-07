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

// ── Export ────────────────────────────────────────────────────
module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  Project,
  Call,
  Task,
  WorkLog,
};