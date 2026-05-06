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
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: ID of the user who created the work log
 *         description:
 *           type: string
 *           description: Description of work done
 *         date:
 *           type: string
 *           format: date
 *           description: Date of the work (YYYY-MM-DD format)
 *         User:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             employee_id:
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
 * /work-logs:
 *   post:
 *     summary: Create a new work log
 *     description: Log work completed on a specific date (Requires can_write permission)
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
 *                 description: Description of work completed
 *                 example: "Fixed bug in authentication module and tested login functionality"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Date of work (ISO 8601 format)
 *                 example: "2024-01-15T10:00:00Z"
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
 *         description: Validation error - missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Requires write permission
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /work-logs:
 *   get:
 *     summary: Get all work logs
 *     description: Retrieve list of work logs. Non-admin users only see their own logs.
 *     tags: [Work Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of work logs (sorted by date descending, then by creation date)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workLogs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkLog'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /work-logs/{id}:
 *   get:
 *     summary: Get work log by ID
 *     description: Retrieve a specific work log. Non-admin users can only see their own logs.
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
 *         description: Forbidden - can only view own work logs
 *       404:
 *         description: Work log not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /work-logs/{id}:
 *   patch:
 *     summary: Update work log
 *     description: Update work log details (Requires can_update permission). Non-admin users can only update own logs.
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: Updated description
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Updated date (ISO 8601 format)
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
 *         description: Forbidden or requires update permission
 *       404:
 *         description: Work log not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /work-logs/{id}:
 *   delete:
 *     summary: Delete work log
 *     description: Delete a work log (Requires can_delete permission). Non-admin users can only delete own logs.
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
 *     responses:
 *       200:
 *         description: Work log deleted successfully
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
 *         description: Work log not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
