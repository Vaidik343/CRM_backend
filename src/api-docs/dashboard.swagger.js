/**
 * @swagger
 * tags:
 *     name: Dashboard
 *     description: Dashboard analytics APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
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
 *
 *     TeamDashboard:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Team Dashboard
 *
 *         team:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             description:
 *               type: string
 *             is_active:
 *               type: boolean
 *
 *         summary:
 *           type: object
 *           properties:
 *             total_members:
 *               type: integer
 *             total_projects:
 *               type: integer
 *             task_stats:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 open:
 *                   type: integer
 *                 ongoing:
 *                   type: integer
 *                 closed:
 *                   type: integer
 *
 *         alerts:
 *           type: object
 *           properties:
 *             overdue_count:
 *               type: integer
 *             due_soon_count:
 *               type: integer
 *             overdue_tasks:
 *               type: array
 *               items:
 *                 type: object
 *             due_soon_tasks:
 *               type: array
 *               items:
 *                 type: object
 *
 *         members:
 *           type: array
 *           items:
 *             type: object
 *
 *         member_stats:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               employee_id:
 *                 type: string
 *               role:
 *                 type: string
 *               tasks_total:
 *                 type: integer
 *               tasks_open:
 *                 type: integer
 *               tasks_ongoing:
 *                 type: integer
 *               tasks_closed:
 *                 type: integer
 *
 *         project_stats:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: string
 *                 format: uuid
 *               project_name:
 *                 type: string
 *               total:
 *                 type: integer
 *               open:
 *                 type: integer
 *               ongoing:
 *                 type: integer
 *               closed:
 *                 type: integer
 *
 *         recent_calls:
 *           type: array
 *           items:
 *             type: object
 *
 *         recent_activity:
 *           type: array
 *           items:
 *             type: object
 *
 *     EmployeeDashboard:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Employee Dashboard
 *
 *         summary:
 *           type: object
 *           properties:
 *             total_teams:
 *               type: integer
 *             total_projects:
 *               type: integer
 *             task_stats:
 *               type: object
 *             call_stats:
 *               type: object
 *
 *         alerts:
 *           type: object
 *           properties:
 *             overdue_count:
 *               type: integer
 *             due_soon_count:
 *               type: integer
 *             overdue_tasks:
 *               type: array
 *               items:
 *                 type: object
 *             due_soon_tasks:
 *               type: array
 *               items:
 *                 type: object
 *
 *         my_teams:
 *           type: array
 *           items:
 *             type: object
 *
 *         my_projects:
 *           type: array
 *           items:
 *             type: object
 *
 *         my_tasks:
 *           type: array
 *           items:
 *             type: object
 *
 *         tasks_by_project:
 *           type: array
 *           items:
 *             type: object
 *
 *         my_calls:
 *           type: array
 *           items:
 *             type: object
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get admin dashboard analytics
 *     description: |
 *       Retrieve system-wide dashboard analytics.
 *
 *       Includes:
 *       - Total employees
 *       - Total calls
 *       - Total tasks
 *       - Total work logs
 *       - Activity counts
 *       - Task status breakdown
 *       - Call type breakdown
 *       - Employee productivity breakdown
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
 *         schema:
 *           type: string
 *           format: date
 *         example: 2025-08-01
 *
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         example: 2025-08-31
 *
 *       - in: query
 *         name: actFrom
 *         schema:
 *           type: string
 *           format: date
 *         example: 2025-08-10
 *
 *       - in: query
 *         name: actTo
 *         schema:
 *           type: string
 *           format: date
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

/**
 * @swagger
 * /api/teams/{id}/dashboard:
 *   get:
 *     summary: Get team dashboard
 *     description: |
 *       Retrieve dashboard analytics for a specific team.
 *
 *       Includes:
 *       - Team details
 *       - Team members
 *       - Project stats
 *       - Task stats
 *       - Overdue tasks
 *       - Due soon tasks
 *       - Member productivity
 *       - Recent calls
 *       - Recent activity
 *
 *       Access:
 *       - Admin can access any team
 *       - Team members can access their own team dashboard
 *
 *     tags: [Dashboard]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *
 *     responses:
 *       200:
 *         description: Team dashboard fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamDashboard'
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Access denied
 *
 *       404:
 *         description: Team not found
 *
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/me/dashboard:
 *   get:
 *     summary: Get employee dashboard
 *     description: |
 *       Retrieve dashboard data for logged-in employee.
 *
 *       Includes:
 *       - Assigned teams
 *       - Assigned projects
 *       - My tasks
 *       - Task statistics
 *       - Urgent tasks
 *       - Call statistics
 *       - Tasks grouped by project
 *
 *     tags: [Dashboard]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Employee dashboard fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployeeDashboard'
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Internal server error
 */