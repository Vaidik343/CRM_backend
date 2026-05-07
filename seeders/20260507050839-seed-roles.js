'use strict';

const { v4: uuidv4 } = require('uuid');

const roles = [
  { id: uuidv4(), name: 'Admin',          created_at: new Date(), updated_at: new Date() },
  { id: uuidv4(), name: 'Project Manager',created_at: new Date(), updated_at: new Date() },
  { id: uuidv4(), name: 'Sr. Developer',  created_at: new Date(), updated_at: new Date() },
  { id: uuidv4(), name: 'Jr. Developer',  created_at: new Date(), updated_at: new Date() },
  { id: uuidv4(), name: 'Intern',         created_at: new Date(), updated_at: new Date() },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('roles', roles);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};