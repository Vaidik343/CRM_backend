/**
 * @swagger
 * tags:
 *   - name: Interns
 *     description: Intern registration, onboarding, and self-service management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Validation failed.
 *     Intern:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         display_id:
 *           type: string
 *           example: IN-GTU-2021001
 *         intern_type:
 *           type: string
 *           enum: [intern, trainee]
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, active, completed]
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         mobile:
 *           type: string
 *         enrollment_no:
 *           type: string
 *         college_name:
 *           type: string
 *         degree_type:
 *           type: string
 *           enum: [bachelor, master]
 *         start_date:
 *           type: string
 *           format: date
 *         end_date:
 *           type: string
 *           format: date
 *         mentor_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         approved_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         approved_at:
 *           type: string
 *           format: date-time
 *         rejection_reason:
 *           type: string
 *           nullable: true
 *         setup_token:
 *           type: string
 *           nullable: true
 *         setup_token_expires_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         password_hash:
 *           type: string
 *           nullable: true
 *         last_login:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     InternDocument:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         intern_id:
 *           type: string
 *           format: uuid
 *         document_type:
 *           type: string
 *           enum: [aadhaar, voter_card, passport, driving_licence]
 *         id_proof:
 *           type: string
 *         photo:
 *           type: string
 *         college_detail:
 *           type: object
 *           nullable: true
 *         resume:
 *           type: string
 *           nullable: true
 *         last_sem_marksheet:
 *           type: string
 *           nullable: true
 *     InternProject:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         display_id:
 *           type: string
 *         intern_id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         tech_details:
 *           type: object
 *           nullable: true
 *         description:
 *           type: string
 *           nullable: true
 *         mentor_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *     InternTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         display_id:
 *           type: string
 *         intern_id:
 *           type: string
 *           format: uuid
 *         intern_project_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         task:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         assigned_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [open, ongoing, hold, closed]
 *         due_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         remarks:
 *           type: array
 *           items:
 *             type: object
 *         completed_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     InternWorkLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         display_id:
 *           type: string
 *         intern_id:
 *           type: string
 *           format: uuid
 *         intern_project_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         intern_task_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         description:
 *           type: string
 *         hours:
 *           type: number
 *         log_date:
 *           type: string
 *           format: date
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         page:
 *           type: integer
 *         totalPages:
 *           type: integer
 */

/**
 * @swagger
 * /api/intern/register:
 *   post:
 *     summary: Register a new intern
 *     description: Creates a new intern application with uploaded identity and profile documents. The application stays in pending state until an admin approves it.
 *     tags: [Interns]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - mobile
 *               - enrollment_no
 *               - college_name
 *               - degree_type
 *               - intern_type
 *               - document_type
 *               - id_proof
 *               - photo
 *             properties:
 *               name:
 *                 type: string
 *                 example: Asha Patel
 *               email:
 *                 type: string
 *                 format: email
 *                 example: asha@example.com
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               enrollment_no:
 *                 type: string
 *                 example: GTU-2024-001
 *               college_name:
 *                 type: string
 *                 example: Example College
 *               degree_type:
 *                 type: string
 *                 enum: [bachelor, master]
 *                 example: bachelor
 *               intern_type:
 *                 type: string
 *                 enum: [intern, trainee]
 *                 example: intern
 *               document_type:
 *                 type: string
 *                 enum: [aadhaar, voter_card, passport, driving_licence]
 *                 example: aadhaar
 *               college_detail:
 *                 type: string
 *                 description: Optional JSON string with additional college details.
 *                 example: '{"year": "3", "branch": "CSE"}'
 *               id_proof:
 *                 type: string
 *                 format: binary
 *               photo:
 *                 type: string
 *                 format: binary
 *               resume:
 *                 type: string
 *                 format: binary
 *               last_sem_marksheet:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Registration submitted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 intern_id:
 *                   type: string
 *                   format: uuid
 *       400:
 *         description: Validation error or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Duplicate email or enrollment number
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/intern/status/{intern_id}:
 *   get:
 *     summary: Check intern application status
 *     description: Used by the public waiting screen to poll the status of an intern application.
 *     tags: [Interns]
 *     parameters:
 *       - in: path
 *         name: intern_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Status information returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 setup_token:
 *                   type: string
 *                   nullable: true
 *                 rejection_reason:
 *                   type: string
 *                   nullable: true
 *                 token_expired:
 *                   type: boolean
 *       404:
 *         description: Intern not found
 */

/**
 * @swagger
 * /api/intern/setup-password:
 *   post:
 *     summary: Set password for an approved intern
 *     description: Completes the one-time setup using the setup token sent to the intern.
 *     tags: [Interns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - setup_token
 *               - password
 *               - confirm_password
 *             properties:
 *               setup_token:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               confirm_password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password set successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid/expired token or password mismatch
 *       404:
 *         description: Invalid or expired setup link
 */

/**
 * @swagger
 * /api/intern/login:
 *   post:
 *     summary: Login an intern
 *     description: Authenticates an intern using email and password and returns a JWT access token.
 *     tags: [Interns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 intern:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     display_id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     intern_type:
 *                       type: string
 *                     degree_type:
 *                       type: string
 *                     college_name:
 *                       type: string
 *                     start_date:
 *                       type: string
 *                       format: date
 *                     end_date:
 *                       type: string
 *                       format: date
 *                     mentor:
 *                       type: object
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Application not yet active or rejected
 */

/**
 * @swagger
 * /api/intern/me:
 *   get:
 *     summary: Get current intern profile
 *     description: Returns the authenticated intern's own profile.
 *     tags: [Interns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 intern:
 *                   $ref: '#/components/schemas/Intern'
 *       401:
 *         description: Unauthorized
 *   patch:
 *     summary: Update current intern profile
 *     description: Updates the authenticated intern's name, mobile, or college name.
 *     tags: [Interns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               college_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 intern:
 *                   $ref: '#/components/schemas/Intern'
 *       400:
 *         description: Invalid mobile number
 *       404:
 *         description: Intern not found
 */

/**
 * @swagger
 * /api/admin/interns:
 *   get:
 *     summary: List all interns
 *     description: Returns a paginated list of interns for admin use.
 *     tags: [Interns]
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
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: intern_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Interns fetched successfully.
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
 *                 interns:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Intern'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/admin/interns/{id}:
 *   get:
 *     summary: Get intern by ID
 *     description: Returns detailed intern information including linked documents.
 *     tags: [Interns]
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
 *         description: Intern fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 intern:
 *                   $ref: '#/components/schemas/Intern'
 *       404:
 *         description: Intern not found
 */

/**
 * @swagger
 * /api/admin/interns/{id}/approve:
 *   patch:
 *     summary: Approve an intern application
 *     description: Approves a pending intern and generates a setup token for password creation.
 *     tags: [Interns]
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
 *               - start_date
 *               - end_date
 *             properties:
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               mentor_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Intern approved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 setup_token:
 *                   type: string
 *       400:
 *         description: Invalid date range or intern already processed
 *       404:
 *         description: Intern not found
 */

/**
 * @swagger
 * /api/admin/interns/{id}/reject:
 *   patch:
 *     summary: Reject an intern application
 *     description: Rejects a pending intern application and stores the rejection reason.
 *     tags: [Interns]
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
 *               - rejection_reason
 *             properties:
 *               rejection_reason:
 *                 type: string
 *                 example: Documents were incomplete.
 *     responses:
 *       200:
 *         description: Intern rejected successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid rejection reason or intern already processed
 */

/**
 * @swagger
 * /api/admin/interns/{id}/extend:
 *   patch:
 *     summary: Extend an intern's internship end date
 *     description: Updates the internship end date for an approved or active intern.
 *     tags: [Interns]
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
 *               - end_date
 *             properties:
 *               end_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Internship extended successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 end_date:
 *                   type: string
 *                   format: date
 *       400:
 *         description: Invalid date or invalid intern state
 */

/**
 * @swagger
 * /api/admin/interns/{id}/deactivate:
 *   patch:
 *     summary: Deactivate an intern
 *     description: Marks an intern as completed/deactivated.
 *     tags: [Interns]
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
 *         description: Intern deactivated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Intern already deactivated
 */

/**
 * @swagger
 * /api/admin/interns/{id}/regenerate-token:
 *   post:
 *     summary: Regenerate setup token
 *     description: Generates a new setup token for an approved intern who has not yet set a password.
 *     tags: [Interns]
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
 *         description: Setup token regenerated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 setup_url:
 *                   type: string
 *                 setup_token:
 *                   type: string
 */

/**
 * @swagger
 * /api/intern/project:
 *   post:
 *     summary: Create an intern project
 *     description: Creates a project for the authenticated intern. Only one project is allowed per intern.
 *     tags: [Interns]
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
 *               description:
 *                 type: string
 *               tech_details:
 *                 type: object
 *               mentor_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Project created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 project:
 *                   $ref: '#/components/schemas/InternProject'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Project already exists
 *   get:
 *     summary: Get current intern project
 *     description: Returns the authenticated intern's project.
 *     tags: [Interns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/InternProject'
 *       404:
 *         description: No project found
 *   patch:
 *     summary: Update current intern project
 *     description: Updates the authenticated intern's project details.
 *     tags: [Interns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               tech_details:
 *                 type: object
 *     responses:
 *       200:
 *         description: Project updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 project:
 *                   $ref: '#/components/schemas/InternProject'
 */

/**
 * @swagger
 * /api/intern/tasks:
 *   post:
 *     summary: Create a task for the current intern
 *     description: Creates a self-assigned task for the authenticated intern.
 *     tags: [Interns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - task
 *             properties:
 *               task:
 *                 type: string
 *               description:
 *                 type: string
 *               intern_project_id:
 *                 type: string
 *                 format: uuid
 *               due_date:
 *                 type: string
 *                 format: date
 *               remark:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 task:
 *                   $ref: '#/components/schemas/InternTask'
 *   get:
 *     summary: List current intern tasks
 *     description: Returns paginated tasks for the authenticated intern.
 *     tags: [Interns]
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
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Tasks fetched successfully.
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
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InternTask'
 */

/**
 * @swagger
 * /api/intern/tasks/{id}:
 *   patch:
 *     summary: Update a current intern task
 *     description: Updates a task owned by the authenticated intern.
 *     tags: [Interns]
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
 *               task:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [open, ongoing, hold, closed]
 *               due_date:
 *                 type: string
 *                 format: date
 *               remark:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 task:
 *                   $ref: '#/components/schemas/InternTask'
 *       404:
 *         description: Task not found
 */

/**
 * @swagger
 * /api/intern/worklogs:
 *   post:
 *     summary: Create a work log for the current intern
 *     description: Creates a work log entry linked optionally to a project or task.
 *     tags: [Interns]
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
 *               - hours
 *               - log_date
 *             properties:
 *               description:
 *                 type: string
 *               hours:
 *                 type: number
 *                 example: 2.5
 *               log_date:
 *                 type: string
 *                 format: date
 *               intern_project_id:
 *                 type: string
 *                 format: uuid
 *               intern_task_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Work log created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 worklog:
 *                   $ref: '#/components/schemas/InternWorkLog'
 *   get:
 *     summary: List current intern work logs
 *     description: Returns paginated work logs for the authenticated intern.
 *     tags: [Interns]
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
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work logs fetched successfully.
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
 *                 worklogs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InternWorkLog'
 */

/**
 * @swagger
 * /api/intern/worklogs/{id}:
 *   patch:
 *     summary: Update a current intern work log
 *     description: Updates a work log owned by the authenticated intern.
 *     tags: [Interns]
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
 *               description:
 *                 type: string
 *               hours:
 *                 type: number
 *               log_date:
 *                 type: string
 *                 format: date
 *               intern_project_id:
 *                 type: string
 *                 format: uuid
 *               intern_task_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Work log updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 worklog:
 *                   $ref: '#/components/schemas/InternWorkLog'
 *       404:
 *         description: Work log not found
 */

/**
 * @swagger
 * /api/admin/interns/{intern_id}/project:
 *   get:
 *     summary: Get an intern's project as admin
 *     description: Returns the project linked to a specific intern.
 *     tags: [Interns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: intern_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Project fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/InternProject'
 *   patch:
 *     summary: Update an intern's project mentor as admin
 *     description: Allows an admin to update the mentor linked to an intern project.
 *     tags: [Interns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: intern_id
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
 *               mentor_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Project updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 project:
 *                   $ref: '#/components/schemas/InternProject'
 */

/**
 * @swagger
 * /api/admin/intern/tasks:
 *   post:
 *     summary: Assign a task to an intern
 *     description: Creates a task for an active intern, assigned by an admin.
 *     tags: [Interns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - intern_id
 *               - task
 *             properties:
 *               intern_id:
 *                 type: string
 *                 format: uuid
 *               task:
 *                 type: string
 *               description:
 *                 type: string
 *               intern_project_id:
 *                 type: string
 *                 format: uuid
 *               due_date:
 *                 type: string
 *                 format: date
 *               remark:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task assigned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 task:
 *                   $ref: '#/components/schemas/InternTask'
 */

/**
 * @swagger
 * /api/admin/interns/{intern_id}/tasks:
 *   get:
 *     summary: List tasks for a specific intern
 *     description: Returns tasks for an intern for admin review.
 *     tags: [Interns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: intern_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tasks fetched successfully.
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
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InternTask'
 */

/**
 * @swagger
 * /api/admin/intern/tasks/{id}:
 *   patch:
 *     summary: Update any intern task as admin
 *     description: Allows an admin to update the status or other fields of an intern task.
 *     tags: [Interns]
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
 *               status:
 *                 type: string
 *                 enum: [open, ongoing, hold, closed]
 *               due_date:
 *                 type: string
 *                 format: date
 *               remark:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 task:
 *                   $ref: '#/components/schemas/InternTask'
 */

/**
 * @swagger
 * /api/admin/interns/{intern_id}/worklogs:
 *   get:
 *     summary: List work logs for a specific intern
 *     description: Returns work logs for an intern for admin review.
 *     tags: [Interns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: intern_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Work logs fetched successfully.
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
 *                 worklogs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InternWorkLog'
 */
