'use strict';

// Fixed UUIDs so other seeds can reference them reliably
const roleIds = {
  teamLead:        '11111111-0000-0000-0000-000000000001',
  srDeveloper:     '11111111-0000-0000-0000-000000000002',
  developer:       '11111111-0000-0000-0000-000000000003',
  juniorDeveloper: '11111111-0000-0000-0000-000000000004',
  qa:              '11111111-0000-0000-0000-000000000005',
  designer:        '11111111-0000-0000-0000-000000000006',
  projectManager:  '11111111-0000-0000-0000-000000000007',
  intern:          '11111111-0000-0000-0000-000000000008',
  other:           '11111111-0000-0000-0000-000000000009',
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('roles', [
      { id: roleIds.teamLead,        name: 'Team Lead',        createdAt: new Date(), updatedAt: new Date() },
      { id: roleIds.srDeveloper,     name: 'Sr. Developer',    createdAt: new Date(), updatedAt: new Date() },
      { id: roleIds.developer,       name: 'Developer',        createdAt: new Date(), updatedAt: new Date() },
      { id: roleIds.juniorDeveloper, name: 'Junior Developer', createdAt: new Date(), updatedAt: new Date() },
      { id: roleIds.qa,              name: 'QA',               createdAt: new Date(), updatedAt: new Date() },
      { id: roleIds.designer,        name: 'Designer',         createdAt: new Date(), updatedAt: new Date() },
      { id: roleIds.projectManager,  name: 'Project Manager',  createdAt: new Date(), updatedAt: new Date() },
      { id: roleIds.intern,          name: 'Intern',           createdAt: new Date(), updatedAt: new Date() },
      { id: roleIds.other,           name: 'Other',            createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};

module.exports.roleIds = roleIds;