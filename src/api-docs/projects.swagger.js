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
 *     RemarkEntry:
 *       type: object
 *       properties:
 *         text:
 *           type: string
 *           example: "Initial project setup"
 *         user_id:
 *           type: string
 *           format: uuid
 *         user_name:
 *           type: string
 *           example: "John Doe"
 *         created_at:
 *           type: string
 *           format: date-time
 *
 *     ProjectTypes:
 *       type: object
 *       description: |
 *         A map of project type keys to arrays of subtype strings.
 *         Keys and subtypes must be valid entries defined in the PROJECT_TYPES constant.
 *       additionalProperties:
 *         type: array
 *         items:
 *           type: string
 *       example:
 *         web: ["dynamic", "static"]
 *         app: ["android"]
 *
 *     MemberInput:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           format: uuid
 *         role_id:
 *           type: string
 *           format: uuid
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
 *           example: "CRM Backend"
 *         description:
 *           type: string
 *           nullable: true
 *         project_types:
 *           $ref: '#/components/schemas/ProjectTypes'
 *         tech_details:
 *           description: Technical details / stack description for the project
 *           nullable: true
 *         development_status:
 *           type: string
 *           enum: [planning, active, on_hold, testing, completed]
 *           nullable: true
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
 *       Admin only. `code` is auto-generated from the project name (first 3 letters + 3-digit increment).
 *       Members can optionally be added at creation time.
 *       If members are passed but none can be added, the entire request is rolled back.
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
 *               - project_types
 *               - tech_details
 *             properties:
 *               name:
 *                 type: string
 *                 example: "CRM Backend"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "Backend services for the CRM platform"
 *               project_types:
 *                 $ref: '#/components/schemas/ProjectTypes'
 *               tech_details:
 *                 description: Technical details or stack description
 *                 example: ".NET Core 8, MSSQL 2019, Redis"
 *               development_status:
 *                 type: string
 *                 enum: [planning, active, on_hold, testing, completed]
 *                 nullable: true
 *               remark:
 *                 type: string
 *                 nullable: true
 *                 description: Optional initial remark. Appended to the remarks log on creation.
 *                 example: "Project kicked off after client approval"
 *               members:
 *                 type: array
 *                 description: Optional list of members to add at creation time
 *                 items:
 *                   $ref: '#/components/schemas/MemberInput'
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
 *         description: Validation error or no members could be added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid project types/subtypes"
 *                 skipped_members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         nullable: true
 *                       reason:
 *                         type: string
 *       409:
 *         description: A project with the same name already exists (case-insensitive)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: List projects (paginated)
 *     description: |
 *       Admins see all active projects.
 *       Employees see only active projects they are a member of.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Paginated list of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "List of Projects"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 total:
 *                   type: integer
 *                   example: 42
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get a single project by ID
 *     description: Employees can only access projects they are active members of.
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
 *         description: Project UUID
 *     responses:
 *       200:
 *         description: Project fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       403:
 *         description: Access denied — user is not a member of this project
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
 *     summary: Update a project
 *     description: |
 *       All fields are optional. Passing `remark` (singular string) appends a new
 *       entry to the `remarks` log — it does not replace the array.
 *       Passing `project_types` replaces the entire types map and is validated
 *       against the PROJECT_TYPES constant.
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
 *         description: Project UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "CRM Backend v2"
 *               description:
 *                 type: string
 *                 nullable: true
 *               project_types:
 *                 $ref: '#/components/schemas/ProjectTypes'
 *               tech_details:
 *                 nullable: true
 *                 description: Technical details or stack description
 *               development_status:
 *                 type: string
 *                 enum: [planning, active, on_hold, testing, completed]
 *                 nullable: true
 *               is_active:
 *                 type: boolean
 *                 description: Set to false to soft-deactivate the project
 *               remark:
 *                 type: string
 *                 nullable: true
 *                 description: Appends a new entry to the remarks log
 *                 example: "Moved to testing phase"
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Project updated successfully"
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid project types/subtypes
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
 *     summary: Soft-delete a project
 *     description: Sets `is_active` to false. The project record is retained in the database.
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
 *         description: Project UUID
 *     responses:
 *       200:
 *         description: Project soft-deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Project deleted successfully"
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
 *     summary: Add members to an existing project
 *     description: |
 *       Adds one or more members to an active project.
 *       - If a user was previously removed (`is_active: false`), they are reactivated.
 *       - Already-active members are skipped and reported in `skipped_members`.
 *       - If no members can be added at all, the request is rolled back with 400.
 *       - Each successfully added member receives a PROJECT_ADDED notification.
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
 *         description: Project UUID
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
 *                 minItems: 1
 *                 items:
 *                   $ref: '#/components/schemas/MemberInput'
 *     responses:
 *       200:
 *         description: Members added (partial success is possible — check skipped_members)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Members added successfully"
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *                 created_members:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProjectMember'
 *                 skipped_members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         nullable: true
 *                       reason:
 *                         type: string
 *                         example: "User already exists in this project"
 *       400:
 *         description: Validation error or no members could be added
 *       404:
 *         description: Project not found or inactive
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
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ProjectMember UUID
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
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "role updated"
 *                 member:
 *                   $ref: '#/components/schemas/ProjectMember'
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
 *     summary: Remove a member from a project (soft delete)
 *     description: Sets the ProjectMember's `is_active` to false. The record is retained.
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
 *         description: ProjectMember UUID
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Project member removed successfully"
 *       404:
 *         description: Member not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */