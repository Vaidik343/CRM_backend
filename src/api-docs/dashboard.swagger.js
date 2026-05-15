/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard analytics APIs (Admin only)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardTotals:
 *       type: object
 *       properties:
 *         employees:
 *           type: integer
 *         calls:
 *           type: integer
 *         tasks:
 *           type: integer
 *         work_logs:
 *           type: integer
 *     DashboardLast7Days:
 *       type: object
 *       properties:
 *         calls:
 *           type: integer
 *         tasks:
 *           type: integer
 *         work_logs:
 *           type: integer
 *     DashboardTaskStatusBreakdown:
 *       type: object
 *       properties:
 *         open:
 *           type: integer
 *         ongoing:
 *           type: integer
 *         closed:
 *           type: integer
 *     DashboardCallTypeBreakdown:
 *       type: object
 *       properties:
 *         inquiry:
 *           type: integer
 *         request:
 *           type: integer
 *         complaint:
 *           type: integer
 *     DashboardEmployeeItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         employee_id:
 *           type: string
 *         role:
 *           type: string
 *           nullable: true
 *         calls:
 *           type: integer
 *         tasks:
 *           type: integer
 *         work_logs:
 *           type: integer
 *     DashboardResponse:
 *       type: object
 *       properties:
 *         totals:
 *           $ref: '#/components/schemas/DashboardTotals'
 *         last_7_days:
 *           $ref: '#/components/schemas/DashboardLast7Days'
 *         task_status_breakdown:
 *           $ref: '#/components/schemas/DashboardTaskStatusBreakdown'
 *         call_type_breakdown:
 *           $ref: '#/components/schemas/DashboardCallTypeBreakdown'
 *         employee_breakdown:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DashboardEmployeeItem'
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     description: Retrieve dashboard summary data including totals, recent activity, task status breakdown, call type breakdown, and per-employee counts. Admin only.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
