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
 *         task:
 *           type: string
 *           description: Task title (required)
 *         description:
 *           type: string
 *           description: Detailed task description
 *         assigned_to:
 *           type: string
 *           format: uuid
 *           description: ID of the user assigned to this task
 *         assigned_by:
 *           type: string
 *           format: uuid
 *           description: ID of the user who assigned the task
 *         call_id:
 *           type: string
 *           format: uuid
 *           description: Optional associated call ID
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
 *         start_date:
 *           type: string
 *           format: date-time
 *         due_date:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [open, ongoing, closed]
 *           description: Task status (auto-set on creation)
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
 *     description: Create and assign a new task (Requires can_write permission)
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
 *               - assigned_to
 *             properties:
 *               task:
 *                 type: string
 *                 description: Task title
 *                 example: "Update customer database"
 *               description:
 *                 type: string
 *                 description: Optional detailed description
 *                 example: "Update all customer records with new contact info"
 *               assigned_to:
 *                 type: string
 *                 format: uuid
 *                 description: ID of user to assign task to
 *               call_id:
 *                 type: string
 *                 format: uuid
 *                 description: Optional associated call ID
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 description: Optional due date (ISO 8601 format)
 *     responses:
 *       201:
 *         description: Task created successfully. Status auto-set to "ongoing" if self-assigned, "open" otherwise.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Assignee not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Requires write permission
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     description: Retrieve list of tasks. Non-admin users only see tasks assigned to them.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tasks (sorted by status, due date, creation date)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     description: Retrieve a specific task. Non-admin users can only see tasks assigned to them.
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
 *         description: Task found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       403:
 *         description: Forbidden - can only view own assigned tasks
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     summary: Update task
 *     description: Update task details (Requires can_update permission). Non-admin users can only update their assigned tasks and cannot reopen closed tasks.
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
 *               call_id:
 *                 type: string
 *                 format: uuid
 *               due_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [open, ongoing, closed]
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
 *       400:
 *         description: Cannot update a closed task (non-admin only)
 *       403:
 *         description: Forbidden or requires update permission
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     description: Delete a task (Requires can_delete permission). Only creator (assigned_by) or admin can delete.
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
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden or requires delete permission
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
