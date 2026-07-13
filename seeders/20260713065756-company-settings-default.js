'use strict';

const { v4: uuid } = require('uuid');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('company_settings', [
      {
        id: uuid(),
        office_start_time: '09:00:00',
        full_day_notice_hours: 36,
        half_day_notice_hours: 16,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('company_settings', null, {});
  },
};