/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         display_id:
 *           type: string
 *           example: "T001260526AB12"
 *           description: 14-char unique display ID. T=self-assign, TA=assign to other
 *         project_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         call_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         task:
 *           type: string
 *           example: "Update customer database"
 *         description:
 *           type: string
 *           nullable: true
 *         assigned_to:
 *           type: string
 *           format: uuid
 *         assigned_by:
 *           type: string
 *           format: uuid
 *         start_date:
 *           type: string
 *           format: date
 *         due_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         task_id:
 *           type: string
 *           format: uuid
 *         old_status:
 *           type: string
 *           nullable: true
 *           enum: [open, ongoing, hold, closed]
 *         new_status:
 *           type: string
 *           enum: [open, ongoing, hold, closed]
 *         changed_at:
 *           type: string
 *           format: date-time
 *         changedBy:
 *           type: object
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [open, ongoing, closed]
 *         remarks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RemarkEntry'
 *         assignee:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             employee_id:
 *               type: string
 *         assigner:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             employee_id:
 *               type: string
 *         project:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     description: |
 *       Create and assign a task. Any employee can assign to anyone.
 *       - Self-assign → status becomes `ongoing`, prefix `T`
 *       - Assign to other → status becomes `open`, prefix `TA`
 *       - display_id is auto-generated
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - task
 *             properties:
 *               project_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               call_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               task:
 *                 type: string
 *                 example: "Follow up with enterprise client"
 *               description:
 *                 type: string
 *                 nullable: true
 *               assigned_to:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Defaults to logged-in user if not provided
 *               due_date:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               remark:
 *                 type: string
 *                 nullable: true
 *                 description: Optional initial remark added to remarks log
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Assignee / Project / Call not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     description: |
 *       Admins see all tasks. Employees only see tasks they created or were assigned to.
 *       For regular users, the default window is the last 7 days unless `all_dates=true`
 *       or an explicit `from`/`to` range is provided.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by task name, display ID, project name, project code, or assignee name/employee ID.
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD). Used for date filtering.
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD). Used for date filtering.
 *       - in: query
 *         name: due_filter
 *         schema:
 *           type: string
 *           enum: [overdue, due_soon]
 *         description: Filter tasks by due-date urgency.
 *       - in: query
 *         name: status_filter
 *         schema:
 *           type: string
 *           enum: [open, ongoing, hold]
 *         description: Filter tasks by status.
 *       - in: query
 *         name: all_dates
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: For employees, set to true to disable the default 7-day window.
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 page:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get single task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     summary: Update task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               task:
 *                 type: string
 *               description:
 *                 type: string
 *               due_date:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: [open, ongoing, closed]
 *               remark:
 *                 type: string
 *                 description: Appends a new entry to remarks log
 *     responses:
 *       200:
 *         description: Task updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     description: Only admin or task creator (assigned_by) can delete.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/tasks/{id}/status-logs:
 *   get:
 *     summary: Get task status history
 *     description: Returns the chronological history of all status changes for a task.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Task ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Status history retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TaskStatusLog'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */