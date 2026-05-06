const { sequelize } = require("./database");
const bcrypt = require("bcryptjs");
const { User, Role } = require("../models"); // registers models + associations

async function connectDB() {
  await sequelize.authenticate();

  // MVP: keep schema in sync during development.
  // In production, use migrations instead.
  const isProd = process.env.NODE_ENV === "production";
  await sequelize.sync({ alter: !isProd });

  if (String(process.env.SEED_ADMIN || "").toLowerCase() === "true") {
    // Ensure default roles exist if we are seeding
    let adminRole = await Role.findOne({ where: { name: "admin" } });
    if (!adminRole) {
      adminRole = await Role.create({ name: "admin" });
    }

    let employeeRole = await Role.findOne({ where: { name: "employee" } });
    if (!employeeRole) {
      await Role.create({ name: "employee" });
    }

    const anyUser = await User.findOne({ attributes: ["id"] });
    if (!anyUser) {
      const adminName = process.env.ADMIN_NAME || "Admin";
      const adminEmployeeId = process.env.ADMIN_EMPLOYEE_ID || "EMP001";
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        throw new Error("SEED_ADMIN=true requires ADMIN_PASSWORD");
      }

      await User.create({
        employee_id: adminEmployeeId,
        name: adminName,
        email: process.env.ADMIN_EMAIL || "admin@example.com",
        role_id: adminRole.id,
        is_admin: true,
        password: await bcrypt.hash(adminPassword, 12),
      });
      console.log(`✅ Seeded admin user: ${adminEmployeeId}`);
    }
  }

  return sequelize;
}

module.exports = { connectDB };
