/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get admin dashboard analytics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: actFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: actTo
 *         schema:
 *           type: string
 *           format: date
 *
 *     responses:
 *       200:
 *         description: Dashboard analytics
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
 * components:
 *   schemas:
 *
 *     DashboardTaskStatusBreakdown:
 *       type: object
 *       properties:
 *         open:
 *           type: integer
 *         ongoing:
 *           type: integer
 *         closed:
 *           type: integer
 *         due:
 *           type: integer
 *         overdue:
 *           type: integer
 *
 *     DashboardTotals:
 *       type: object
 *       properties:
 *         employees:
 *           type: integer
 *         teams:
 *           type: integer
 *         projects:
 *           type: integer
 *         calls:
 *           type: integer
 *         tasks:
 *           type: integer
 *         work_logs:
 *           type: integer
 *
 *     DashboardActivity:
 *       type: object
 *       properties:
 *         calls:
 *           type: integer
 *         tasks:
 *           type: integer
 *         work_logs:
 *           type: integer
 *
 *     DashboardCallTypeBreakdown:
 *       type: object
 *       properties:
 *         inquiry:
 *           type: integer
 *         request:
 *           type: integer
 *         complaint:
 *           type: integer
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
 *     DashboardCallsSection:
 *       type: object
 *       properties:
 *         total_calls:
 *           type: integer
 *         today_count:
 *           type: integer
 *         task_call_count:
 *           type: integer
 *         today_calls:
 *           type: array
 *           items:
 *             type: object
 *         task_calls:
 *           type: array
 *           items:
 *             type: object
 *
 *     DashboardTasksSection:
 *       type: object
 *       properties:
 *         today_count:
 *           type: integer
 *         today_tasks:
 *           type: array
 *           items:
 *             type: object
 *
 *     DashboardWorklogsSection:
 *       type: object
 *       properties:
 *         today_count:
 *           type: integer
 *         today_logs:
 *           type: array
 *           items:
 *             type: object
 *
 *     DashboardResponse:
 *       type: object
 *       properties:
 *         totals:
 *           $ref: '#/components/schemas/DashboardTotals'
 *
 *         last_7_days:
 *           $ref: '#/components/schemas/DashboardActivity'
 *
 *         task_status_breakdown:
 *           $ref: '#/components/schemas/DashboardTaskStatusBreakdown'
 *
 *         task_status_breakdown_all_time:
 *           $ref: '#/components/schemas/DashboardTaskStatusBreakdown'
 *
 *         call_type_breakdown:
 *           $ref: '#/components/schemas/DashboardCallTypeBreakdown'
 *
 *         employee_breakdown:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DashboardEmployeeItem'
 *
 *         calls_section:
 *           $ref: '#/components/schemas/DashboardCallsSection'
 *
 *         tasks_section:
 *           $ref: '#/components/schemas/DashboardTasksSection'
 *
 *         worklogs_section:
 *           $ref: '#/components/schemas/DashboardWorklogsSection'
 */
/**
 * @swagger
 * components:
 *   schemas:
 *
 *     ProjectDashboard:
 *       type: object
 *       properties:
 *         project:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             code:
 *               type: string
 *             description:
 *               type: string
 *             project_types:
 *               type: string
 *             tech_details:
 *               type: string
 *             development_status:
 *               type: string
 *             is_active:
 *               type: boolean
 *             creator:
 *               type: object
 *             createdAt:
 *               type: string
 *               format: date-time
 *
 *         summary:
 *           type: object
 *           properties:
 *             total_members:
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