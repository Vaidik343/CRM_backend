'use strict';

const { v4: uuidv4 } = require('uuid');
const { userIds } = require('./02-users');

// Permission rules per role:
// Admin     → is_admin=true so permission row not strictly needed, but added for consistency
// PM        → can_read, can_write, can_update (assigns tasks)
// Sr.Dev    → can_read, can_write, can_update
// Developer → can_read, can_write only
// Designer  → can_read, can_write only
// QA        → can_read, can_write, can_update (can close bugs)
// Sarah     → Developer → can_read, can_write only

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('permissions', [
      {
        id:         uuidv4(),
        user_id:    userIds.admin,
        can_read:   true,
        can_write:  true,
        can_update: true,
        can_delete: true,
        createdAt:  new Date(),
        updatedAt:  new Date(),
      },
      {
        // Harsh — Project Manager
        id:         uuidv4(),
        user_id:    userIds.harsh,
        can_read:   true,
        can_write:  true,
        can_update: true,
        can_delete: false,
        createdAt:  new Date(),
        updatedAt:  new Date(),
      },
      {
        // John — Sr. Developer
        id:         uuidv4(),
        user_id:    userIds.john,
        can_read:   true,
        can_write:  true,
        can_update: true,
        can_delete: false,
        createdAt:  new Date(),
        updatedAt:  new Date(),
      },
      {
        // Vaidik — Developer
        id:         uuidv4(),
        user_id:    userIds.vaidik,
        can_read:   true,
        can_write:  true,
        can_update: false,
        can_delete: false,
        createdAt:  new Date(),
        updatedAt:  new Date(),
      },
      {
        // Elena — Designer
        id:         uuidv4(),
        user_id:    userIds.elena,
        can_read:   true,
        can_write:  true,
        can_update: false,
        can_delete: false,
        createdAt:  new Date(),
        updatedAt:  new Date(),
      },
      {
        // Tom — QA (can update tasks to close bugs)
        id:         uuidv4(),
        user_id:    userIds.tom,
        can_read:   true,
        can_write:  true,
        can_update: true,
        can_delete: false,
        createdAt:  new Date(),
        updatedAt:  new Date(),
      },
      {
        // Sarah — Developer
        id:         uuidv4(),
        user_id:    userIds.sarah,
        can_read:   true,
        can_write:  true,
        can_update: false,
        can_delete: false,
        createdAt:  new Date(),
        updatedAt:  new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('permissions', null, {});
  },
};