'use strict';

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    // Get the Admin role id seeded in 001
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'Admin' LIMIT 1`
    );
    const adminRoleId = roles[0]?.id;
    if (!adminRoleId) throw new Error('Admin role not found — run role seeder first');

    const password = process.env.ADMIN_PASSWORD;
    if (!password) throw new Error('ADMIN_PASSWORD must be set in .env');

    const adminId = uuidv4();

    await queryInterface.bulkInsert('users', [{
      id:          adminId,
      employee_id: process.env.ADMIN_EMPLOYEE_ID || 'EMP001',
      name:        process.env.ADMIN_NAME        || 'Admin',
      email:       process.env.ADMIN_EMAIL       || null,
      password:    await bcrypt.hash(password, 12),
      role_id:     adminRoleId,
      is_admin:    true,
      created_at:   new Date(),
      updated_at:   new Date(),
    }]);

    // Auto-create permission row for admin (all true)
    await queryInterface.bulkInsert('permissions', [{
      id:         uuidv4(),
      user_id:    adminId,
      can_read:   true,
      can_write:  true,
      can_update: true,
      can_delete: true,
      created_at:  new Date(),
      updated_at:  new Date(),
    }]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users',       { employee_id: process.env.ADMIN_EMPLOYEE_ID || 'EMP001' }, {});
    await queryInterface.bulkDelete('permissions', null, {});
  },
};