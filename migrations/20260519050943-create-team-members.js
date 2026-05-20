'use strict';

const { v4: uuidv4 } = require('uuid');
const { userIds } = require('./02-users');
const { teamIds } = require('./04-teams');

// TeamMember model uses underscored: true
// so columns are: team_id, user_id, is_active, created_at, updated_at

// Team A: TechRetail Mobile
//   Harsh  → Project Manager
//   John   → Sr. Developer
//   Vaidik → Developer
//   Elena  → Designer
//   Tom    → QA

// Team B: WebShop Redesign
//   Harsh  → Project Manager (same person, different team)
//   Sarah  → Developer

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('team_members', [

      // ── Team A: TechRetail Mobile ──────────────────────────────────────
      {
        id:         uuidv4(),
        team_id:    teamIds.techRetail,
        user_id:    userIds.harsh,
        is_active:  true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id:         uuidv4(),
        team_id:    teamIds.techRetail,
        user_id:    userIds.john,
        is_active:  true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id:         uuidv4(),
        team_id:    teamIds.techRetail,
        user_id:    userIds.vaidik,
        is_active:  true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id:         uuidv4(),
        team_id:    teamIds.techRetail,
        user_id:    userIds.elena,
        is_active:  true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id:         uuidv4(),
        team_id:    teamIds.techRetail,
        user_id:    userIds.tom,
        is_active:  true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ── Team B: WebShop Redesign ───────────────────────────────────────
      {
        id:         uuidv4(),
        team_id:    teamIds.webShop,
        user_id:    userIds.harsh,   // Harsh is PM in both teams
        is_active:  true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id:         uuidv4(),
        team_id:    teamIds.webShop,
        user_id:    userIds.sarah,
        is_active:  true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('team_members', null, {});
  },
};