/**
 * @swagger
 * tags:
 *   name: Calls
 *   description: Call management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *  Client:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         names:
 *           type: array
 *           items:
 *             type: string
 *           description: JSONB array of names associated with this phone number. First element is the display name.
 *           example: ["Jay Shah", "Jay's Assistant"]
 *         phone:
 *           type: string
 *           description: Unique key for the client record
 *         company:
 *           type: string
 *           nullable: true
 *     RemarkEntry:
 *       type: object
 *       properties:
 *         text:
 *           type: string
 *         added_by:
 *           type: string
 *           format: uuid
 *         added_by_name:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *
 *     Call:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         display_id:
 *           type: string
 *           example: "C001260526AB"
 *           description: 14-char unique display ID shown in UI
 *         user_id:
 *           type: string
 *           format: uuid
 *         caller_name:
 *           type: string
 *         caller_number:
 *           type: string
 *           nullable: true
 *         client_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Resolved/linked client record. Auto-resolved from caller_number via findOrCreateClientForCall if not provided.
 *         project_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         call_type:
 *           type: string
 *           enum: [inquiry, request, complaint]
 *         call_subtype:
 *           type: string
 *         call_summary:
 *           type: string
 *           nullable: true
 *         receive_type:
 *           type: string
 *           enum: [call, msg, email, meeting]
 *         is_task:
 *           type: boolean
 *           default: false
 *         transfer_to:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: User ID to transfer this call to (prefix CTR)
 *         task_assigned_to:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: When is_task=true, assign generated task to this user (prefix CTA)
 *         follow_up_date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Scheduled callback date-time for follow-up calls (prefix CFB)
 *         parent_call_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Links follow-up call back to the original call
 *         remarks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RemarkEntry'
 *         User:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             employee_id:
 *               type: string
 *         Project:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/calls:
 *   post:
 *     summary: Create a new call record
 *     description: |
 *       Log a new call. Display ID is auto-generated based on prefix rules:
 *       - `C`   — plain call
 *       - `CT`  — call with auto-task (self)
 *       - `CTA` — call with auto-task assigned to another employee
 *       - `CTR` — call transferred to another employee
 *       - `CFB` — call follow-up (requires parent_call_id)
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - caller_name
 *               - call_type
 *               - call_subtype
 *               - receive_type
 *             properties:
 *               caller_name:
 *                 type: string
 *                 example: "Jay Shah"
 *               caller_number:
 *                 type: string
 *                 example: "+91-9999999999"
 *               project_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               client_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Link call to an existing client. If omitted and caller_number is provided, a client is auto-resolved or created via findOrCreateClientForCall.
 *               call_type:
 *                 type: string
 *                 enum: [inquiry, request, complaint]
 *               call_subtype:
 *                 type: string
 *                 example: "Product Question"
 *               call_summary:
 *                 type: string
 *                 nullable: true
 *               receive_type:
 *                 type: string
 *                 enum: [call, msg, email, meeting]
 *               is_task:
 *                 type: boolean
 *                 default: false
 *                 description: Auto-create task from this call. Requires project_id.
 *               transfer_to:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Transfer call to this employee. Cannot be yourself.
 *               task_assigned_to:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Assign auto-created task to this employee. Requires is_task=true.
 *               follow_up_date:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Scheduled callback date-time.
 *               parent_call_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Required when follow_up_date is set. Links to original call.
 *               remark:
 *                 type: string
 *                 nullable: true
 *                 description: Optional initial remark added to remarks log.
 *     responses:
 *       201:
 *         description: Call created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 call:
 *                   $ref: '#/components/schemas/Call'
 *                 task:
 *                   nullable: true
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error or invalid subtype
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/calls:
 *   get:
 *     summary: Get all call records
 *     description: Paginated list of calls. Non-admin users only see calls they created, were transferred to, or were added as meeting attendees to; admins can see all records.
 *     tags: [Calls]
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
 *           default: 20
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter calls by project.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by caller name, caller number, display ID, or project name/code.
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional start date for filtering.
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional end date for filtering.
 *       - in: query
 *         name: all_dates
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: For employees, set to true to disable the default 7-day window.
 *     responses:
 *       200:
 *         description: Paginated list of calls
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Call'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/calls/{id}:
 *   get:
 *     summary: Get call by ID
 *     tags: [Calls]
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
 *         description: Call found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 call:
 *                   $ref: '#/components/schemas/Call'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Call not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/calls/{id}:
 *   patch:
 *     summary: Update call record
 *     tags: [Calls]
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
 *               caller_name:
 *                 type: string
 *               caller_number:
 *                 type: string
 *               project_id:
 *                 type: string
 *                 format: uuid
 *              client_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               call_type:
 *                 type: string
 *                 enum: [inquiry, request, complaint]
 *               call_subtype:
 *                 type: string
 *               call_summary:
 *                 type: string
 *               receive_type:
 *                 type: string
 *                 enum: [call, msg, email, meeting]
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Optional attendee user IDs for meetings.
 *               remark:
 *                 type: string
 *                 description: Appends a new entry to remarks log
 *     responses:
 *       200:
 *         description: Call updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 call:
 *                   $ref: '#/components/schemas/Call'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Call not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/calls/{id}:
 *   delete:
 *     summary: Delete call record
 *     tags: [Calls]
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
 *         description: Call deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Call not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */