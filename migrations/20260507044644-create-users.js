'use strict';

const bcrypt = require('bcryptjs');
const { roleIds } = require('./01-roles');

// Fixed UUIDs for cross-seed references
const userIds = {
  admin:  '22222222-0000-0000-0000-000000000001',
  harsh:  '22222222-0000-0000-0000-000000000002', // Project Manager
  john:   '22222222-0000-0000-0000-000000000003', // Sr. Developer
  vaidik: '22222222-0000-0000-0000-000000000004', // Developer
  elena:  '22222222-0000-0000-0000-000000000005', // Designer
  tom:    '22222222-0000-0000-0000-000000000006', // QA
  sarah:  '22222222-0000-0000-0000-000000000007', // Developer (Team B)
};

// Password format: first 3 letters of name (lowercase) + 4 digits
// Admin password is fixed as Admin@123
const hash = (plain) => bcrypt.hashSync(plain, 12);

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('users', [
      {
        id:          userIds.admin,
        employee_id: 'EMP001',
        name:        'Admin',
        email:       'admin@crm.com',
        password:    hash('Admin@123'),
        role_id:     roleIds.other,   // Admin has no specific team role
        is_admin:    true,
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
      {
        id:          userIds.harsh,
        employee_id: 'EMP002',
        name:        'Harsh',
        email:       'harsh@crm.com',
        password:    hash('har1234'),  // har + 4 digits
        role_id:     roleIds.projectManager,
        is_admin:    false,
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
      {
        id:          userIds.john,
        employee_id: 'EMP003',
        name:        'John',
        email:       'john@crm.com',
        password:    hash('joh1234'),  // joh + 4 digits
        role_id:     roleIds.srDeveloper,
        is_admin:    false,
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
      {
        id:          userIds.vaidik,
        employee_id: 'EMP004',
        name:        'Vaidik',
        email:       'vaidik@crm.com',
        password:    hash('vai1234'),  // vai + 4 digits
        role_id:     roleIds.developer,
        is_admin:    false,
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
      {
        id:          userIds.elena,
        employee_id: 'EMP005',
        name:        'Elena',
        email:       'elena@crm.com',
        password:    hash('ele1234'),  // ele + 4 digits
        role_id:     roleIds.designer,
        is_admin:    false,
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
      {
        id:          userIds.tom,
        employee_id: 'EMP006',
        name:        'Tom',
        email:       'tom@crm.com',
        password:    hash('tom1234'),  // tom + 4 digits
        role_id:     roleIds.qa,
        is_admin:    false,
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
      {
        id:          userIds.sarah,
        employee_id: 'EMP007',
        name:        'Sarah',
        email:       'sarah@crm.com',
        password:    hash('sar1234'),  // sar + 4 digits
        role_id:     roleIds.developer,
        is_admin:    false,
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  },
};

module.exports.userIds = userIds;