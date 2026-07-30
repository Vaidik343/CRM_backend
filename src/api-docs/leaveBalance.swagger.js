/**
 * @swagger
 * tags:
 *   name: Leave Balance
 *   description: Leave Balance and Public Holiday APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LeaveBalance:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         month:
 *           type: integer
 *           example: 7
 *         year:
 *           type: integer
 *           example: 2026
 *         entitled_paid:
 *           type: number
 *           example: 2
 *         used_paid:
 *           type: number
 *           example: 0
 *         used_unpaid:
 *           type: number
 *           example: 0
 *         used_exchange:
 *           type: number
 *           example: 0
 *         remaining_paid:
 *           type: number
 *           example: 2
 *     PublicHoliday:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "Independence Day"
 *         date:
 *           type: string
 *           format: date
 *           example: "2026-08-15"
 *         year:
 *           type: integer
 *           example: 2026
 *         created_by:
 *           type: string
 *           format: uuid
 */

/**
 * @swagger
 * /api/leaves/balance/my:
 *   get:
 *     summary: Get logged-in user's leave balance for current month
 *     tags: [Leave Balance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave balance object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   $ref: '#/components/schemas/LeaveBalance'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/leaves/balance/{user_id}:
 *   get:
 *     summary: Get an employee's leave balance for a specific month/year (Admin only)
 *     tags: [Leave Balance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee leave balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   $ref: '#/components/schemas/LeaveBalance'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/leaves/balance/{user_id}/history:
 *   get:
 *     summary: Get leave balance history for an employee (Admin only)
 *     tags: [Leave Balance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Employee leave balance history list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaveBalance'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/leaves/holidays:
 *   get:
 *     summary: Get public holidays for a given year
 *     tags: [Leave Balance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of public holidays
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 holidays:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicHoliday'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Add a public holiday (Admin only)
 *     tags: [Leave Balance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, date]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Diwali"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-11-01"
 *     responses:
 *       201:
 *         description: Holiday added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       409:
 *         description: Holiday already exists on date
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/leaves/holidays/{id}:
 *   delete:
 *     summary: Delete a public holiday (Admin only)
 *     tags: [Leave Balance]
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
 *         description: Holiday deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Holiday not found
 *       500:
 *         description: Internal server error
 */
