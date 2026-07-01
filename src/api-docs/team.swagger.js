/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: Team management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     TeamProject:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *
 *     TeamCreator:
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
 *
 *     TeamMember:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         team_id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         is_active:
 *           type: boolean
 *         user:
 *           $ref: '#/components/schemas/TeamMemberUser'
 *
 *     Team:
 *       type: object
 *       properties:
 *
 *         id:
 *           type: string
 *           format: uuid
 *
 *         project_id:
 *           type: string
 *           format: uuid
 *
 *         name:
 *           type: string
 *           example: Frontend Team
 *
 *         description:
 *           type: string
 *           nullable: true
 *           example: Handles frontend development
 *
 *         is_active:
 *           type: boolean
 *           example: true
 *
 *         created_by:
 *           type: string
 *           format: uuid
 *
 *         project:
 *           $ref: '#/components/schemas/TeamProject'
 *
 *         creator:
 *           $ref: '#/components/schemas/TeamCreator'
 *
 *         team_memberships:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TeamMember'
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
 * /api/teams:
 *   post:
 *     summary: Create a new team
 *     description: |
 *       Create a new team linked to a project.
 *
 *       Rules:
 *       - `project_id` and `name` are required
 *       - Team name must be unique
 *       - The referenced project must exist
 *
 *     tags: [Teams]
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
 *               - name
 *               - project_id
 *             properties:
 *
 *               project_id:
 *                 type: string
 *                 format: uuid
 *                 example: 11111111-1111-1111-1111-111111111111
 *
 *               name:
 *                 type: string
 *                 example: Frontend Team
 *
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Handles frontend development
 *
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: Team created successfully
 *
 *                 team:
 *                   $ref: '#/components/schemas/Team'
 *
 *       400:
 *         description: Team already exists / validation error
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Project ID missing or invalid
 *
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Get all teams
 *     description: |
 *       Retrieve all teams with:
 *       - Project details
 *       - Team creator
 *       - Active team members
 *
 *     tags: [Teams]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: List of all teams
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: List of all teams
 *
 *                 teams:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Team'
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     summary: Get single team
 *     description: |
 *       Retrieve a single team by ID including:
 *       - Project details
 *       - Creator details
 *       - Active team members
 *
 *     tags: [Teams]
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
 *         description: Team fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 team:
 *                   $ref: '#/components/schemas/Team'
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
 * /api/teams/{id}:
 *   put:
 *     summary: Update team
 *     description: |
 *       Update team details.
 *
 *       Allowed fields:
 *       - name
 *       - description
 *       - is_active
 *
 *     tags: [Teams]
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
 *               name:
 *                 type: string
 *                 example: Backend Team
 *
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Handles backend APIs
 *
 *               is_active:
 *                 type: boolean
 *                 example: true
 *
 *     responses:
 *       200:
 *         description: Team updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: Team updated successfully
 *
 *                 team:
 *                   $ref: '#/components/schemas/Team'
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
 * /api/teams/{id}:
 *   delete:
 *     summary: Delete team
 *     description: Delete a team permanently.
 *
 *     tags: [Teams]
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
 *         description: Team deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: Team deleted successfully
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