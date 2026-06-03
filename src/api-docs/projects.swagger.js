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
 *     ProjectMember:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         role_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         is_active:
 *           type: boolean
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             employee_id:
 *               type: string
 *         role:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *
 *     TechEntry:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: ".NET Core"
 *         version:
 *           type: string
 *           example: "8.0"
 *           nullable: true
 *
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *           example: "CRM001"
 *           description: Auto-generated — first 3 letters of name + 3-digit increment
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         project_type:
 *           type: string
 *           enum: [web, app, desktop]
 *         project_subtype:
 *           type: string
 *           example: "dynamic"
 *         tech:
 *           type: array
 *           description: Unified tech stack — each entry has name and optional version
 *           items:
 *             $ref: '#/components/schemas/TechEntry'
 *         development_status:
 *           type: string
 *           enum: [planning, active, on_hold, testing, completed]
 *         is_active:
 *           type: boolean
 *         created_by:
 *           type: string
 *           format: uuid
 *         remarks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RemarkEntry'
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
 *         members:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectMember'
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
 *     description: |
 *       Admin only. code is auto-generated from the project name.
 *       Members can optionally be added at creation time.
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
 *               - project_type
 *               - project_subtype
 *               - tech
 *               - development_status
 *             properties:
 *               name:
 *                 type: string
 *                 example: "CRM Backend"
 *               description:
 *                 type: string
 *                 nullable: true
 *               project_type:
 *                 type: string
 *                 enum: [web, app, desktop]
 *               project_subtype:
 *                 type: string
 *                 example: "dynamic"
 *               tech:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TechEntry'
 *                 example: [{ "name": ".NET Core", "version": "8.0" }, { "name": "MSSQL", "version": "2019" }]
 *               development_status:
 *                 type: string
 *                 enum: [planning, active, on_hold, testing, completed]
 *               remark:
 *                 type: string
 *                 nullable: true
 *               members:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     role_id:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Project already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     description: Admin sees all. Employees see only projects they are members of.
 *     tags: [Projects]
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
 *     responses:
 *       200:
 *         description: List of projects
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get single project
 *     description: Employees can only access projects they are members of.
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
 *         description: Project fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/projects/{id}:
 *   patch:
 *     summary: Update project
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
 *               project_type:
 *                 type: string
 *                 enum: [web, app, desktop]
 *               project_subtype:
 *                 type: string
 *               tech:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TechEntry'
 *               development_status:
 *                 type: string
 *                 enum: [planning, active, on_hold, testing, completed]
 *               is_active:
 *                 type: boolean
 *               remark:
 *                 type: string
 *                 description: Appends a new entry to remarks log
 *     responses:
 *       200:
 *         description: Project updated
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project (soft delete)
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
 *         description: Project deleted
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/projects/{id}/members:
 *   post:
 *     summary: Add members to project
 *     description: Add one or more members to an existing project. Notifies each added member.
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - members
 *             properties:
 *               members:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     role_id:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *     responses:
 *       200:
 *         description: Members added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *                 created_members:
 *                   type: array
 *                 skipped_members:
 *                   type: array
 *       400:
 *         description: No members added
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/projects/members/{id}:
 *   patch:
 *     summary: Update a project member's role
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ProjectMember ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_id
 *             properties:
 *               role_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Role updated
 *       404:
 *         description: Member or role not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/projects/members/{id}:
 *   delete:
 *     summary: Remove a member from project (soft delete)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ProjectMember ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Member removed
 *       404:
 *         description: Member not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */