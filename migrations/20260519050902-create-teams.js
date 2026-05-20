'use strict';

const teamIds = {
  techRetail: '44444444-0000-0000-0000-000000000001',
  webShop:    '44444444-0000-0000-0000-000000000002',
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('teams', [
      {
        id:          teamIds.techRetail,
        name:        'TechRetail Mobile',
        description: 'Cross-functional team for TechRetail mobile app redesign project',
        is_active:   true,
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
      {
        id:          teamIds.webShop,
        name:        'WebShop Redesign',
        description: 'Team handling full e-commerce website redesign for WebShop client',
        is_active:   true,
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('teams', null, {});
  },
};

module.exports.teamIds = teamIds;