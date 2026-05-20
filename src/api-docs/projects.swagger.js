/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         team_id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           description: Project name
 *         description:
 *           type: string
 *         remarks:
 *           type: string
 *         is_active:
 *           type: boolean
 *         created_by:
 *           type: string
 *           format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         creator:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             employee_id:
 *               type: string
 *         team:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 */

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create project
 *     description: |
 *       Create a new project.
 *
 *       - Admin can create any project
 *       - Team Lead and Project Manager can create projects for their teams
 *       - team_id is optional
 *       - Small companies can create project first and create teams later
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               team_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               name:
 *                 type: string
 *                 example: CRM System
 *               description:
 *                 type: string
 *                 example: CRM backend and dashboard
 *               remarks:
 *                 type: string
 *                 example: High priority project
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Team not found
 *       409:
 *         description: Project already exists
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     description: |
 *       Retrieve paginated list of projects.
 *
 *       - Admin can see all projects
 *       - Employees can only see projects related to their teams
 *     tags: [Projects]
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
 *           default: 10
 *         example: 10
 *     responses:
 *       200:
 *         description: List of projects
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get single project
 *     description: |
 *       Get single project details.
 *
 *       Employees can only access projects assigned to their teams.
 *     tags: [Projects]
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
 *         description: Project fetched successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/projects/{id}:
 *   patch:
 *     summary: Update project
 *     description: |
 *       Update project details.
 *
 *       Only Admin, Team Lead, or Project Manager can update projects.
 *     tags: [Projects]
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
 *               name:
 *                 type: string
 *                 example: CRM Dashboard
 *               description:
 *                 type: string
 *                 example: Updated CRM module
 *               remarks:
 *                 type: string
 *                 example: Updated remarks
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     description: |
 *       Delete a project.
 *
 *       Only Admin, Team Lead, or Project Manager can delete projects.
 *     tags: [Projects]
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
 *         description: Project deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */