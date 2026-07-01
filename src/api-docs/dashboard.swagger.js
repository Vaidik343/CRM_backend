/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Admin dashboard analytics
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get admin dashboard analytics
 *     description: Returns dashboard totals, task breakdowns, call-type breakdowns, and employee activity. The controller defaults to today's data unless from/to or actFrom/actTo are supplied.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional date filter for totals and task breakdowns.
 *       - in: query
 *         name: actFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional activity start date.
 *       - in: query
 *         name: actTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional activity end date.
 *     responses:
 *       200:
 *         description: Dashboard analytics returned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
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
 *
 *         recent_calls:
 *           type: array
 *           items:
 *             type: object
 *
 *         recent_tasks:
 *           type: array
 *           items:
 *             type: object
 */
/**
 * @swagger
 * /api/projects/{id}/dashboard:
 *   get:
 *     summary: Get project dashboard
 *     description: |
 *       Retrieve analytics and activity for a specific project.
 *
 *       Includes:
 *       - Project details
 *       - Project members
 *       - Task statistics
 *       - Call statistics
 *       - Overdue tasks
 *       - Due soon tasks
 *       - Member productivity
 *       - Recent calls
 *       - Recent tasks
 *
 *       Access:
 *       - Admin can access any project
 *       - Active project members can access their project dashboard
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
 *         description: Project dashboard fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectDashboard'
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Access denied
 *
 *       404:
 *         description: Project not found
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/me/dashboard:
 *   get:
 *     summary: Get employee dashboard
 *     tags: [Dashboard]
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
/**
 * @swagger
 * components:
 *   schemas:
 *
 *     EmployeeDashboard:
 *       type: object
 *       properties:
 *
 *         summary:
 *           type: object
 *           properties:
 *             total_projects:
 *               type: integer
 *
 *             today_logs:
 *               type: integer
 *
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
 *             call_stats:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 inquiry:
 *                   type: integer
 *                 request:
 *                   type: integer
 *                 complaint:
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