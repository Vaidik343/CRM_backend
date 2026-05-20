/**
 * @swagger
 * tags:
 *   name: Team Members
 *   description: Team member management APIs
 */

/**
 * @swagger
 * /api/team-members:
 *   post:
 *     summary: Add multiple members to a team
 *     tags: [Team Members]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - team_id
 *               - members
 *             properties:
 *               team_id:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *
 *               members:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - user_id
 *                     - role_id
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       example: 550e8400-e29b-41d4-a716-446655440001
 *
 *                     role_id:
 *                       type: string
 *                       format: uuid
 *                       example: 550e8400-e29b-41d4-a716-446655440002
 *
 *     responses:
 *       201:
 *         description: Members processed successfully
 *
 *       400:
 *         description: Validation error
 *
 *       404:
 *         description: Team not found
 *
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/team-members:
 *   get:
 *     summary: Get all team members
 *     tags: [Team Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 10
 *     responses:
 *       200:
 *         description: List of team members
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/team-members/{id}:
 *   get:
 *     summary: Get single team member
 *     tags: [Team Members]
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
 *         description: Team member details
 *       404:
 *         description: Team member not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/team-members/{id}:
 *   put:
 *     summary: Update team member
 *     tags: [Team Members]
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_id:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440002
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Team member updated successfully
 *       404:
 *         description: Team member not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/team-members/{id}:
 *   delete:
 *     summary: Soft delete team member
 *     tags: [Team Members]
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
 *         description: Team member deactivated successfully
 *       404:
 *         description: Team member not found
 *       500:
 *         description: Internal server error
 */