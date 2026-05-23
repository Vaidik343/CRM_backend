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
 *
 *     TaskUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         employee_id:
 *           type: string
 *
 *     TaskProject:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *
 *     TaskTeam:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *
 *         team_id:
 *           type: string
 *           format: uuid
 *
 *         project_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *
 *         call_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *
 *         task:
 *           type: string
 *           example: Update customer database
 *
 *         description:
 *           type: string
 *           nullable: true
 *           example: Update all customer contact records
 *
 *         assigned_to:
 *           type: string
 *           format: uuid
 *
 *         assigned_by:
 *           type: string
 *           format: uuid
 *
 *         start_date:
 *           type: string
 *           format: date-time
 *
 *         due_date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *         status:
 *           type: string
 *           enum: [open, ongoing, closed]
 *           example: open
 *
 *         assignee:
 *           $ref: '#/components/schemas/TaskUser'
 *
 *         project:
 *           $ref: '#/components/schemas/TaskProject'
 *
 *         team:
 *           $ref: '#/components/schemas/TaskTeam'
 *
 *         createdAt:
 *           type: string
 *           format: date-time
 *
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
 *       Create and assign a task.
 *
 *       Rules:
 *       - Admin can create tasks for anyone
 *       - Team Lead / Project Manager can assign tasks to team members
 *       - Developers can only create tasks for themselves
 *       - Assigned user must belong to the same team
 *       - If self-assigned → status becomes `ongoing`
 *       - If assigned to another user → status becomes `open`
 *
 *     tags: [Tasks]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - team_id
 *               - task
 *             properties:
 *
 *               team_id:
 *                 type: string
 *                 format: uuid
 *                 example: 11111111-1111-1111-1111-111111111111
 *
 *               project_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: 22222222-2222-2222-2222-222222222222
 *
 *               call_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: 33333333-3333-3333-3333-333333333333
 *
 *               task:
 *                 type: string
 *                 example: Follow up with enterprise client
 *
 *               description:
 *                 type: string
 *                 example: Schedule a follow-up call with the client
 *
 *               assigned_to:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Defaults to logged-in user if not provided
 *
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: 2025-09-01T10:00:00.000Z
 *
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
 *
 *       400:
 *         description: Validation error / Invalid team-project relation
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Forbidden
 *
 *       404:
 *         description: Team / Project / Assignee not found
 *
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     description: |
 *       Retrieve paginated tasks.
 *
 *       Access rules:
 *       - Admin → all tasks
 *       - Team Lead / Project Manager → all tasks inside their teams
 *       - Developer → only tasks assigned to themselves
 *
 *     tags: [Tasks]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         example: 10
 *
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: List of all Tasks
 *
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *
 *                 total:
 *                   type: integer
 *                   example: 45
 *
 *                 limit:
 *                   type: integer
 *                   example: 10
 *
 *                 page:
 *                   type: integer
 *                   example: 1
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get single task
 *     description: |
 *       Retrieve a single task by ID.
 *
 *       Access rules:
 *       - Admin → any task
 *       - Team Lead / PM → tasks inside their teams
 *       - Developer → only their own assigned tasks
 *
 *     tags: [Tasks]
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
 *         description: Task fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Forbidden
 *
 *       404:
 *         description: Task not found
 *
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     summary: Update task
 *     description: |
 *       Update an existing task.
 *
 *       Rules:
 *       - Admin can update any task
 *       - Team Lead / PM can update tasks inside their teams
 *       - Developers can update only their own tasks
 *       - Closed tasks cannot be updated by non-admin users
 *
 *     tags: [Tasks]
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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *
 *               task:
 *                 type: string
 *                 example: Update CRM workflow
 *
 *               description:
 *                 type: string
 *                 example: Improve lead tracking workflow
 *
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *
 *               status:
 *                 type: string
 *                 enum: [open, ongoing, closed]
 *
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *
 *       400:
 *         description: Cannot update closed task
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Forbidden
 *
 *       404:
 *         description: Task not found
 *
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     description: |
 *       Delete a task.
 *
 *       Access rules:
 *       - Admin can delete any task
 *       - Task creator (assigned_by) can delete their own created tasks
 *
 *     tags: [Tasks]
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
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task deleted
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Forbidden
 *
 *       404:
 *         description: Task not found
 *
 *       500:
 *         description: Internal server error
 */