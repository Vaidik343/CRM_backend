// seed-admin.js
const bcrypt = require("bcryptjs");
const { sequelize, Users, Roles, Permission } = require("./src/models");
const ADMIN_EMPLOYEE_ID = "EMP001";
const ADMIN_NAME = "Admin";
const ADMIN_EMAIL = "admin@crm.com";
const ADMIN_PASSWORD = "Admin@123";
const ADMIN_ROLE_NAME = "Admin";
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    // 1 — ensure Admin role exists
    const [adminRole] = await Roles.findOrCreate({
      where: { name: ADMIN_ROLE_NAME },
      defaults: { name: ADMIN_ROLE_NAME },
    });
    // 2 — check if admin user already exists
    const existing = await Users.findOne({ where: { employee_id: ADMIN_EMPLOYEE_ID } });
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    let adminUser;
    if (existing) {
      await existing.update({ password: hash, is_admin: true, role_id: adminRole.id });
      adminUser = existing;
      console.log("Existing admin user updated.");
    } else {
      adminUser = await Users.create({
        employee_id: ADMIN_EMPLOYEE_ID,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hash,
        role_id: adminRole.id,
        is_admin: true,
      });
      console.log("Admin user created.");
    }
    // 3 — ensure Permission row exists with full access
    await Permission.findOrCreate({
      where: { user_id: adminUser.id },
      defaults: {
        user_id: adminUser.id,
        can_read: true,
        can_write: true,
        can_update: true,
        can_delete: true,
      },
    });
    console.log(`Admin ready → employee_id: ${ADMIN_EMPLOYEE_ID}, password: ${ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (err) {
    console.error("Seed admin error:", err);
    process.exit(1);
  }
})();
