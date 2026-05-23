/**
 * @swagger
 * tags:
 *   name: Team Members
 *   description: Team member management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     TeamMemberUser:
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
 *           format: email
 *
 *     TeamMemberTeam:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *
 *     TeamMember:
 *       type: object
 *       properties:
 *
 *         id:
 *           type: string
 *           format: uuid
 *
 *         team_id:
 *           type: string
 *           format: uuid
 *
 *         user_id:
 *           type: string
 *           format: uuid
 *
 *         is_active:
 *           type: boolean
 *           example: true
 *
 *         team:
 *           $ref: '#/components/schemas/TeamMemberTeam'
 *
 *         user:
 *           $ref: '#/components/schemas/TeamMemberUser'
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
 * /api/team-members:
 *   post:
 *     summary: Add multiple members to a team
 *     description: |
 *       Add multiple users into a team.
 *
 *       Rules:
 *       - `team_id` is required
 *       - `members` array is required
 *       - Duplicate users are skipped
 *       - Invalid users are skipped
 *
 *     tags: [Team Members]
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
 *               - members
 *             properties:
 *
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
 *                   properties:
 *
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       example: 550e8400-e29b-41d4-a716-446655440001
 *
 *     responses:
 *       201:
 *         description: Members processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: Members processed successfully
 *
 *                 added_count:
 *                   type: integer
 *                   example: 2
 *
 *                 skipped_count:
 *                   type: integer
 *                   example: 1
 *
 *                 added_members:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TeamMember'
 *
 *                 skipped_members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *
 *                       reason:
 *                         type: string
 *                         example: User already exists in this team
 *
 *       400:
 *         description: Validation error / no members added
 *
 *       401:
 *         description: Unauthorized
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
 *     description: |
 *       Retrieve paginated list of all team members with:
 *       - Team details
 *       - User details
 *
 *     tags: [Team Members]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         example: 10
 *
 *     responses:
 *       200:
 *         description: List of all team members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: List of all Team Members
 *
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TeamMember'
 *
 *                 total:
 *                   type: integer
 *                   example: 20
 *
 *                 page:
 *                   type: integer
 *                   example: 1
 *
 *                 limit:
 *                   type: integer
 *                   example: 10
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/team-members/{id}:
 *   get:
 *     summary: Get single team member
 *     description: Retrieve a specific team member by ID
 *
 *     tags: [Team Members]
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
 *         description: Team member details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 member:
 *                   $ref: '#/components/schemas/TeamMember'
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: Team member not found
 *
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/team-members/{id}:
 *   put:
 *     summary: Update team member
 *     description: |
 *       Update team member status.
 *
 *       Allowed fields:
 *       - is_active
 *
 *     tags: [Team Members]
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
 *               is_active:
 *                 type: boolean
 *                 example: true
 *
 *     responses:
 *       200:
 *         description: Team member updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: Team member updated successfully
 *
 *                 teamMember:
 *                   $ref: '#/components/schemas/TeamMember'
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: Team member not found
 *
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/team-members/{id}:
 *   delete:
 *     summary: Soft delete team member
 *     description: |
 *       Soft delete a team member by setting:
 *       - `is_active = false`
 *
 *     tags: [Team Members]
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
 *         description: Team member deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: Team member deactivated successfully
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: Team member not found
 *
 *       500:
 *         description: Internal server error
 */