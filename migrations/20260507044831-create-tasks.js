'use strict';

const { v4: uuidv4 } = require('uuid');
const { userIds } = require('./02-users');
const { teamIds } = require('./04-teams');
const { projectIds } = require('./06-projects');
const { callIds } = require('./07-calls');

module.exports = {
  async up(queryInterface) {
    const today = new Date();
    const inDays = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d.toISOString().split('T')[0]; // DATEONLY format
    };

    await queryInterface.bulkInsert('tasks', [

      // ── Project: Mobile App UI/UX Redesign (Team A) ───────────────────

      {
        // Harsh assigned to Elena — open (assigned to someone else)
        id:          uuidv4(),
        call_id:     callIds.checkoutRedesign,
        project_id:  projectIds.mobileApp,
        team_id:     teamIds.techRetail,
        task:        'Design 2-step checkout flow with new payment options',
        description: 'Create wireframes and mockups for: Step 1 (cart review + shipping), Step 2 (payment + confirmation). Include Apple Pay, Google Pay, PayPal buttons.',
        assigned_to: userIds.elena,
        assigned_by: userIds.harsh,
        start_date:  inDays(0),
        due_date:    inDays(7),
        status:      'open',
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
      {
        // Vaidik self-assigned — ongoing (self-assign auto sets ongoing)
        id:          uuidv4(),
        call_id:     callIds.checkoutRedesign,
        project_id:  projectIds.mobileApp,
        team_id:     teamIds.techRetail,
        task:        'Implement 2-step checkout UI in React',
        description: 'Build React components for the new 2-step checkout based on Elena\'s approved designs. Mobile responsive.',
        assigned_to: userIds.vaidik,
        assigned_by: userIds.vaidik,
        start_date:  inDays(0),
        due_date:    inDays(10),
        status:      'ongoing',
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
      {
        // Harsh assigned to John — open
        id:          uuidv4(),
        call_id:     callIds.checkoutRedesign,
        project_id:  projectIds.mobileApp,
        team_id:     teamIds.techRetail,
        task:        'Integrate Apple Pay, Google Pay, and PayPal',
        description: 'Backend integration of all 3 payment providers. Handle callbacks, error states, and success flow. Test with test cards in staging.',
        assigned_to: userIds.john,
        assigned_by: userIds.harsh,
        start_date:  inDays(0),
        due_date:    inDays(12),
        status:      'open',
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
      {
        // Harsh assigned to Tom — open (depends on above 2 tasks)
        id:          uuidv4(),
        call_id:     callIds.paymentIssue,
        project_id:  projectIds.mobileApp,
        team_id:     teamIds.techRetail,
        task:        'Fix PayPal timeout error on amounts over 1000',
        description: 'Investigate and fix PayPal timeout issue reported on staging. Reproduce with amounts > 1000. Check API timeout settings and retry logic.',
        assigned_to: userIds.john,
        assigned_by: userIds.harsh,
        start_date:  inDays(0),
        due_date:    inDays(3),   // Urgent — due sooner
        status:      'open',
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
      {
        // Tom assigned to himself — QA testing
        id:          uuidv4(),
        call_id:     null,
        project_id:  projectIds.mobileApp,
        team_id:     teamIds.techRetail,
        task:        'QA testing: Full checkout flow and payment methods',
        description: 'Test entire 2-step checkout flow. Test all 3 payment methods (Apple Pay, Google Pay, PayPal). Test on mobile and desktop. Document any issues found.',
        assigned_to: userIds.tom,
        assigned_by: userIds.tom,
        start_date:  inDays(0),
        due_date:    inDays(14),
        status:      'ongoing',
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
      {
        // Completed task example
        id:          uuidv4(),
        call_id:     null,
        project_id:  projectIds.mobileApp,
        team_id:     teamIds.techRetail,
        task:        'Setup project repo and branch structure',
        description: 'Create GitHub repo, set up main/develop/feature branch strategy. Add CI pipeline. Share access with all team members.',
        assigned_to: userIds.john,
        assigned_by: userIds.harsh,
        start_date:  inDays(-10),
        due_date:    inDays(-8),
        status:      'closed',
        createdAt:   new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        updatedAt:   new Date(),
      },

      // ── Project: E-Commerce Website Redesign (Team B) ─────────────────

      {
        // Harsh assigned to Sarah — open
        id:          uuidv4(),
        call_id:     callIds.searchBug,
        project_id:  projectIds.ecommerce,
        team_id:     teamIds.webShop,
        task:        'Fix category filter bug in product search',
        description: 'Search results showing products from wrong categories. Debug the filter query and fix. Reproduce with category filter on /products page.',
        assigned_to: userIds.sarah,
        assigned_by: userIds.harsh,
        start_date:  inDays(0),
        due_date:    inDays(3),   // Urgent fix
        status:      'open',
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
      {
        // Sarah self-assigned — ongoing
        id:          uuidv4(),
        call_id:     null,
        project_id:  projectIds.ecommerce,
        team_id:     teamIds.webShop,
        task:        'Redesign product listing page UI',
        description: 'Build new product listing page with grid/list toggle, filters sidebar, sorting options, and pagination. Follow new design system.',
        assigned_to: userIds.sarah,
        assigned_by: userIds.sarah,
        start_date:  inDays(0),
        due_date:    inDays(15),
        status:      'ongoing',
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },

      // ── Project: Internal Dashboard Tool (Team A) ─────────────────────

      {
        // Harsh assigned to Vaidik — open
        id:          uuidv4(),
        call_id:     callIds.dashboardRequest,
        project_id:  projectIds.internalTool,
        team_id:     teamIds.techRetail,
        task:        'Build weekly sales comparison chart',
        description: 'Add chart component comparing current week vs previous week sales. Use recharts or chart.js. Data comes from /api/analytics/weekly endpoint.',
        assigned_to: userIds.vaidik,
        assigned_by: userIds.harsh,
        start_date:  inDays(0),
        due_date:    inDays(5),
        status:      'open',
        createdAt:   new Date(),
        updatedAt:   new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('tasks', null, {});
  },
};