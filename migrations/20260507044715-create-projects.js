'use strict';

const { userIds } = require('./02-users');
const { teamIds } = require('./04-teams');

const projectIds = {
  mobileApp:   '66666666-0000-0000-0000-000000000001',
  ecommerce:   '66666666-0000-0000-0000-000000000002',
  internalTool:'66666666-0000-0000-0000-000000000003',
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('projects', [
      {
        id:          projectIds.mobileApp,
        team_id:     teamIds.techRetail,
        name:        'Mobile App UI/UX Redesign',
        description: 'Complete redesign of TechRetail mobile shopping app focusing on checkout flow and payment integration',
        remarks:     'Client wants 2-step checkout. Add Apple Pay, Google Pay, PayPal.',
        created_by:  userIds.admin,
        is_active:   true,
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
      {
        id:          projectIds.ecommerce,
        team_id:     teamIds.webShop,
        name:        'E-Commerce Website Redesign',
        description: 'Full redesign of WebShop e-commerce platform with modern UI and improved performance',
        remarks:     'Focus on product pages and search functionality.',
        created_by:  userIds.admin,
        is_active:   true,
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
      {
        id:          projectIds.internalTool,
        team_id:     teamIds.techRetail,
        name:        'Internal Dashboard Tool',
        description: 'Build an internal analytics dashboard for TechRetail team to track sales KPIs',
        remarks:     null,
        created_by:  userIds.harsh,
        is_active:   true,
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('projects', null, {});
  },
};

module.exports.projectIds = projectIds;