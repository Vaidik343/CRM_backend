'use strict';

const { v4: uuidv4 } = require('uuid');
const { userIds } = require('./02-users');
const { projectIds } = require('./06-projects');

const callIds = {
  checkoutRedesign:   '77777777-0000-0000-0000-000000000001',
  paymentIssue:       '77777777-0000-0000-0000-000000000002',
  searchBug:          '77777777-0000-0000-0000-000000000003',
  dashboardRequest:   '77777777-0000-0000-0000-000000000004',
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('calls', [
      {
        // Vaidik logged this call for TechRetail project
        id:           callIds.checkoutRedesign,
        user_id:      userIds.vaidik,
        caller_name:  'TechRetail Product Manager',
        caller_number:'9876543210',
        project_id:   projectIds.mobileApp,
        call_type:    'request',
        call_subtype: 'new development',
        call_summary: 'Client wants checkout flow redesigned from 5 steps to 2 steps. Add Apple Pay, Google Pay, and PayPal as payment options. Timeline: 2 weeks.',
        remarks:      'High priority. Client is unhappy with current checkout abandonment rate.',
        receive_type: 'call',
        createdAt:    new Date(),
        updatedAt:    new Date(),
      },
      {
        // Tom logged this as a complaint call
        id:           callIds.paymentIssue,
        user_id:      userIds.tom,
        caller_name:  'TechRetail QA Lead',
        caller_number:'9876543211',
        project_id:   projectIds.mobileApp,
        call_type:    'complaint',
        call_subtype: 'bug',
        call_summary: 'PayPal integration returning timeout errors on staging. Reproducible with amounts over 1000. Needs urgent fix before go-live.',
        remarks:      'Attached error logs via email.',
        receive_type: 'email',
        createdAt:    new Date(),
        updatedAt:    new Date(),
      },
      {
        // Sarah logged this for WebShop project
        id:           callIds.searchBug,
        user_id:      userIds.sarah,
        caller_name:  'WebShop CTO',
        caller_number:'9123456789',
        project_id:   projectIds.ecommerce,
        call_type:    'complaint',
        call_subtype: 'error solve',
        call_summary: 'Search results not filtering by category correctly. Products from other categories appearing in filtered results. Needs fix ASAP.',
        remarks:      null,
        receive_type: 'msg',
        createdAt:    new Date(),
        updatedAt:    new Date(),
      },
      {
        // Harsh logged this for Internal Tool project
        id:           callIds.dashboardRequest,
        user_id:      userIds.harsh,
        caller_name:  'TechRetail CEO',
        caller_number:'9000000001',
        project_id:   projectIds.internalTool,
        call_type:    'request',
        call_subtype: 'update',
        call_summary: 'Need to add weekly sales comparison chart to the dashboard. Should compare current week vs previous week. Also add export to PDF option.',
        remarks:      'Nice to have by end of sprint.',
        receive_type: 'meeting',
        createdAt:    new Date(),
        updatedAt:    new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('calls', null, {});
  },
};

module.exports.callIds = callIds;