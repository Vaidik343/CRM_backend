/**
 * @swagger
 * tags:
 *   name: Leave
 *   description: Leave management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LeaveRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         display_id:
 *           type: string
 *           example: "LR26130726AB12"
 *           description: 14-char unique display ID. Prefix LR.
 *         user_id:
 *           type: string
 *           format: uuid
 *         leave_type:
 *           type: string
 *           enum: [paid, unpaid, exchange]
 *         reason_type:
 *           type: string
 *           enum: [normal, emergency]
 *           description: Emergency bypasses all notice period rules
 *         start_date:
 *           type: string
 *           format: date
 *         end_date:
 *           type: string
 *           format: date
 *         duration:
 *           type: string
 *           enum: [full_day, first_half, second_half]
 *           description: Half day leave requires start_date and end_date to be the same
 *         worked_saturday_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Required only when leave_type is exchange
 *         reason:
 *           type: string
 *           example: "Family function"
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled]
 *           default: pending
 *         approved_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         approved_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         rejection_reason:
 *           type: string
 *           nullable: true
 *           maxLength: 700
 *         employee:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             employee_id:
 *               type: string
 *         approver:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             employee_id:
 *               type: string
 *         logs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LeaveLog'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     LeaveLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         leave_request_id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         action:
 *           type: string
 *           enum: [created, approved, rejected, cancelled]
 *           example: "approved"
 *         remarks:
 *           type: object
 *           description: JSONB — varies by action
 *           example: { "rejection_reason": "Insufficient notice period" }
 *         created_at:
 *           type: string
 *           format: date-time
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
 *
 *     WorkedSaturday:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         saturday_date:
 *           type: string
 *           format: date
 *           example: "2026-07-12"
 *         is_exchanged:
 *           type: boolean
 *           default: false
 *           description: True if this Saturday has already been used in an exchange leave
 *         marked_by:
 *           type: string
 *           format: uuid
 *           description: Admin who marked this Saturday as worked
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// ─────────────────────────────────────────────
// EMPLOYEE ROUTES
// ─────────────────────────────────────────────

/**
 * @swagger
 * /api/leaves/request:
 *   post:
 *     summary: Submit a leave request
 *     description: |
 *       Employee submits a leave request.
 *       - **Full day** → must be submitted at least 36 hours before 9 AM of leave date
 *       - **Half day** → must be submitted at least 16 hours before 9 AM of leave date. start_date and end_date must be the same.
 *       - **Emergency** → no notice period rules apply. Can be submitted retroactively.
 *       - **Exchange** → worked_saturday_id is required. Selected Saturday must be unexchanged and belong to the employee.
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leave_type
 *               - reason_type
 *               - start_date
 *               - end_date
 *               - duration
 *               - reason
 *             properties:
 *               leave_type:
 *                 type: string
 *                 enum: [paid, unpaid, exchange]
 *               reason_type:
 *                 type: string
 *                 enum: [normal, emergency]
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-20"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-20"
 *               duration:
 *                 type: string
 *                 enum: [full_day, first_half, second_half]
 *               reason:
 *                 type: string
 *                 example: "Medical appointment"
 *               worked_saturday_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Required only when leave_type is exchange
 *     responses:
 *       201:
 *         description: Leave request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Leave request submitted successfully.
 *                 leave:
 *                   $ref: '#/components/schemas/LeaveRequest'
 *       400:
 *         description: Validation error or business rule violation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Leave request must be submitted at least 36 hours before office start time.
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/leaves/my:
 *   get:
 *     summary: Get my leave requests
 *     description: Returns paginated leave requests for the logged-in employee.
 *     tags: [Leave]
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
 *           enum: [pending, approved, rejected, cancelled]
 *         description: Filter by leave status
 *       - in: query
 *         name: leave_type
 *         schema:
 *           type: string
 *           enum: [paid, unpaid, exchange]
 *         description: Filter by leave type
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter leaves starting on or after this date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter leaves starting on or before this date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by display_id
 *     responses:
 *       200:
 *         description: List of leave requests
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
 *                 leaves:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaveRequest'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/leaves/cancel/{id}:
 *   patch:
 *     summary: Cancel a leave request
 *     description: Employee can only cancel their own pending leave requests.
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leave request ID
 *     responses:
 *       200:
 *         description: Leave request cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Leave request cancelled.
 *       400:
 *         description: Leave is not in pending status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/leaves/{id}/logs:
 *   get:
 *     summary: Get leave activity logs
 *     description: |
 *       Returns chronological activity logs for a leave request.
 *       - Admin can view logs for any leave request.
 *       - Employee can only view logs for their own leave requests.
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leave request ID
 *     responses:
 *       200:
 *         description: Leave logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaveLog'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Internal server error
 */

// ─────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────

/**
 * @swagger
 * /api/leaves/all:
 *   get:
 *     summary: Get all leave requests (Admin)
 *     description: Returns paginated leave requests for all employees. Supports search by employee name or employee ID.
 *     tags: [Leave]
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
 *           enum: [pending, approved, rejected, cancelled]
 *         description: Filter by leave status
 *       - in: query
 *         name: leave_type
 *         schema:
 *           type: string
 *           enum: [paid, unpaid, exchange]
 *         description: Filter by leave type
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter leaves starting on or after this date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter leaves starting on or before this date
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific employee
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by employee name or employee ID
 *     responses:
 *       200:
 *         description: List of all leave requests
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
 *                 leaves:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaveRequest'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin only
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/leaves/approve/{id}:
 *   patch:
 *     summary: Approve a leave request (Admin)
 *     description: Admin approves a pending leave request. No body required.
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leave request ID
 *     responses:
 *       200:
 *         description: Leave request approved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Leave request approved.
 *       400:
 *         description: Leave is not in pending status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin only
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/leaves/reject/{id}:
 *   patch:
 *     summary: Reject a leave request (Admin)
 *     description: Admin rejects a pending leave request. rejection_reason is mandatory. If leave was exchange type, the worked Saturday is freed up automatically.
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leave request ID
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
 *                 minLength: 5
 *                 maxLength: 700
 *                 example: "Insufficient team coverage during this period."
 *     responses:
 *       200:
 *         description: Leave request rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Leave request rejected.
 *       400:
 *         description: Validation error or leave is not in pending status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin only
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/leaves/saturday/mark:
 *   post:
 *     summary: Mark a Saturday as worked (Admin)
 *     description: |
 *       Admin marks a specific Saturday as worked for an employee.
 *       This makes it available for the employee to use as an exchange leave.
 *       - saturday_date must be a Saturday
 *       - Cannot mark the same Saturday twice for the same employee
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - saturday_date
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: Employee whose Saturday is being marked
 *               saturday_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-11"
 *                 description: Must be a Saturday
 *     responses:
 *       201:
 *         description: Saturday marked as worked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Saturday marked as worked.
 *                 record:
 *                   $ref: '#/components/schemas/WorkedSaturday'
 *       400:
 *         description: Validation error — invalid date or not a Saturday
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin only
 *       409:
 *         description: Saturday already marked for this employee
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/leaves/saturday/{user_id}:
 *   get:
 *     summary: Get available worked Saturdays for an employee
 *     description: |
 *       Returns all unexchanged worked Saturdays for the given employee.
 *       Used by employees when submitting an exchange leave to pick which Saturday to trade.
 *       Both admin and employee can access this endpoint.
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee UUID
 *     responses:
 *       200:
 *         description: List of available worked Saturdays
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 saturdays:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkedSaturday'
 *       400:
 *         description: Invalid user_id format
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */