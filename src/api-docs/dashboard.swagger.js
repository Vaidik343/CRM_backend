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
 *           example: 12
 *         calls:
 *           type: integer
 *           example: 245
 *         tasks:
 *           type: integer
 *           example: 58
 *         work_logs:
 *           type: integer
 *           example: 102
 *
 *     DashboardActivity:
 *       type: object
 *       properties:
 *         calls:
 *           type: integer
 *           example: 25
 *         tasks:
 *           type: integer
 *           example: 12
 *         work_logs:
 *           type: integer
 *           example: 18
 *
 *     DashboardTaskStatusBreakdown:
 *       type: object
 *       properties:
 *         open:
 *           type: integer
 *           example: 20
 *         ongoing:
 *           type: integer
 *           example: 15
 *         closed:
 *           type: integer
 *           example: 23
 *
 *     DashboardCallTypeBreakdown:
 *       type: object
 *       properties:
 *         inquiry:
 *           type: integer
 *           example: 120
 *         request:
 *           type: integer
 *           example: 80
 *         complaint:
 *           type: integer
 *           example: 45
 *
 *     DashboardEmployeeItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: John Doe
 *         employee_id:
 *           type: string
 *           example: EMP-001
 *         role:
 *           type: string
 *           nullable: true
 *           example: Support Executive
 *         calls:
 *           type: integer
 *           example: 35
 *         tasks:
 *           type: integer
 *           example: 12
 *         work_logs:
 *           type: integer
 *           example: 18
 *
 *     DashboardResponse:
 *       type: object
 *       properties:
 *         totals:
 *           $ref: '#/components/schemas/DashboardTotals'
 *         last_7_days:
 *           $ref: '#/components/schemas/DashboardActivity'
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
 *     description: |
 *       Retrieve dashboard analytics including:
 *       - Total employees, calls, tasks, and work logs
 *       - Activity counts
 *       - Task status breakdown
 *       - Call type breakdown
 *       - Employee performance breakdown
 *
 *       Admin only endpoint.
 *
 *     tags: [Dashboard]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: from
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for totals filter
 *         example: 2025-08-01
 *
 *       - in: query
 *         name: to
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for totals filter
 *         example: 2025-08-31
 *
 *       - in: query
 *         name: actFrom
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for activity section filter
 *         example: 2025-08-10
 *
 *       - in: query
 *         name: actTo
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for activity section filter
 *         example: 2025-08-17
 *
 *     responses:
 *       200:
 *         description: Dashboard data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Admin access required
 *
 *       500:
 *         description: Internal server error
 */