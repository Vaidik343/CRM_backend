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
 *         name:
 *           type: string
 *           description: Project name (required)
 *         description:
 *           type: string
 *           description: Detailed project description
 *         remarks:
 *           type: string
 *           description: Additional remarks
 *         created_by:
 *           type: string
 *           format: uuid
 *           description: ID of the user who created the project
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
 *         is_active:
 *           type: boolean
 *           description: Whether the project is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     description: Create a new project (Authenticated, Admin required for creation)
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
 *               name:
 *                 type: string
 *                 example: "Customer Portal"
 *               description:
 *                 type: string
 *                 description: Optional project description
 *                 example: "A portal for customer interactions"
 *               remarks:
 *                 type: string
 *                 description: Optional remarks
 *                 example: "High priority project"
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation error - name is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     description: Retrieve list of projects. Non-admin users only see active projects, admins see all.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     description: Retrieve a specific project by ID (Authenticated users only)
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
 *         description: Project found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/projects/{id}:
 *   patch:
 *     summary: Update project
 *     description: Update project details. Only creator or admin can update. Admin required for creation.
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               remarks:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - only creator or admin can update
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     description: Delete a project. Only creator or admin can delete. Admin required for creation/deletion.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden - only creator or admin can delete
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
