/**
 * @swagger
 * tags:
 *   name: Work Logs
 *   description: Work log management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "09f40bca-0bbb-4599-8d8f-8f9079c4a9e1"
 *         user_id:
 *           type: string
 *           format: uuid
 *           example: "cd45cbfc-43fd-4a0f-95c8-713ebfaab08c"
 *         description:
 *           type: string
 *           example: "Fixed bug in authentication module"
 *         date:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         User:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *               example: "John Doe"
 *             employee_id:
 *               type: string
 *               example: "EMP002"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/work-logs:
 *   post:
 *     summary: Create a work log
 *     description: Log work completed on a specific date. Any authenticated employee can create their own log, optionally linking it to a project and appending an initial remark.
 *     tags: [Work Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - date
 *             properties:
 *               description:
 *                 type: string
 *                 example: "Fixed bug in authentication module and tested login functionality"
 *               project_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               remark:
 *                 type: string
 *                 nullable: true
 *                 description: Optional initial remark appended to the remarks log.
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *     responses:
 *       201:
 *         description: Work log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workLog:
 *                   $ref: '#/components/schemas/WorkLog'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/work-logs:
 *   get:
 *     summary: Get all work logs
 *     description: Paginated list of work logs. Admins see all work logs; employees only see their own, with a default date filter of today unless a range is supplied.
 *     tags: [Work Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         example: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by user name, employee ID, or project name.
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional start date for filtering.
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional end date for filtering.
 *     responses:
 *       200:
 *         description: List of work logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "List of All Work logs"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkLog'
 *                 total:
 *                   type: integer
 *                   example: 5
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 20
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/work-logs/{id}:
 *   get:
 *     summary: Get work log by ID
 *     description: Get a specific work log. Employees can only view their own logs.
 *     tags: [Work Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "09f40bca-0bbb-4599-8d8f-8f9079c4a9e1"
 *     responses:
 *       200:
 *         description: Work log found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workLog:
 *                   $ref: '#/components/schemas/WorkLog'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Work log not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/work-logs/{id}:
 *   patch:
 *     summary: Update work log
 *     description: Update a work log. Employees can only update their own logs.
 *     tags: [Work Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "09f40bca-0bbb-4599-8d8f-8f9079c4a9e1"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 example: "Updated description of work done"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-16"
 *     responses:
 *       200:
 *         description: Work log updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workLog:
 *                   $ref: '#/components/schemas/WorkLog'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Work log not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/work-logs/{id}:
 *   delete:
 *     summary: Delete work log
 *     description: Delete a work log. Employees can only delete their own logs.
 *     tags: [Work Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "09f40bca-0bbb-4599-8d8f-8f9079c4a9e1"
 *     responses:
 *       200:
 *         description: Work log deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Work log deleted"
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Work log not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */