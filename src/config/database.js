require("dotenv").config();

const { Sequelize } = require("sequelize");

const databaseUrl = (process.env.DATABASE_URL || "").trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required (e.g. postgres://user:pass@host:5432/db)");
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
});

module.exports = { sequelize };

