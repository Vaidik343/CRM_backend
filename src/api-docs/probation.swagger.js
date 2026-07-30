/**
 * @swagger
 * tags:
 *   name: Probation
 *   description: Employee probation management APIs (Admin only)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProbationEmployee:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         employee_id:
 *           type: string
 *         email:
 *           type: string
 *         is_active:
 *           type: boolean
 *         is_probation:
 *           type: boolean
 *         probation_start:
 *           type: string
 *           format: date
 *         probation_end:
 *           type: string
 *           format: date
 *         probation_status:
 *           type: string
 *           enum: [active, passed, terminated]
 *         saturday_group:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/probation:
 *   get:
 *     summary: Get all probation employees (Admin only)
 *     tags: [Probation]
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
 *         name: probation_status
 *         schema:
 *           type: string
 *           enum: [active, passed, terminated, all]
 *           default: active
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of probation employees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 employees:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProbationEmployee'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/probation/{id}:
 *   get:
 *     summary: Get details of a single probation employee (Admin only)
 *     tags: [Probation]
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
 *         description: Probation employee details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employee:
 *                   $ref: '#/components/schemas/ProbationEmployee'
 *       400:
 *         description: Employee has no probation record
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/probation/{id}/start:
 *   post:
 *     summary: Start probation for an employee (Admin only)
 *     tags: [Probation]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [probation_start, probation_end]
 *             properties:
 *               probation_start:
 *                 type: string
 *                 format: date
 *                 example: "2026-08-01"
 *               probation_end:
 *                 type: string
 *                 format: date
 *                 example: "2026-11-01"
 *     responses:
 *       200:
 *         description: Employee placed on probation successfully
 *       400:
 *         description: Validation error or employee already on probation / is admin
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/probation/{id}/pass:
 *   patch:
 *     summary: Pass probation for an employee (Admin only)
 *     tags: [Probation]
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
 *         description: Probation passed successfully
 *       400:
 *         description: Employee not on probation or status is not active
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/probation/{id}/terminate:
 *   patch:
 *     summary: Terminate probation for an employee and deactivate account (Admin only)
 *     tags: [Probation]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Performance below expectations"
 *     responses:
 *       200:
 *         description: Employee terminated and account deactivated
 *       400:
 *         description: Validation error or employee not on active probation
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/probation/{id}/dates:
 *   patch:
 *     summary: Update probation start/end dates (Admin only)
 *     tags: [Probation]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               probation_start:
 *                 type: string
 *                 format: date
 *               probation_end:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Probation dates updated successfully
 *       400:
 *         description: Validation error or employee not on active probation
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
