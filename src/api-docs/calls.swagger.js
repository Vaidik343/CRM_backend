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
 *     Call:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: ID of the user who logged the call
 *         caller_name:
 *           type: string
 *           description: Name of the caller
 *         caller_number:
 *           type: string
 *           description: Phone number of the caller
 *         project_id:
 *           type: string
 *           format: uuid
 *           description: ID of the associated project
 *         call_type:
 *           type: string
 *           enum: [inquiry, request, complaint]
 *           description: Type of call
 *         call_subtype:
 *           type: string
 *           description: Subtype of call (specific to call_type)
 *         call_summary:
 *           type: string
 *           description: Summary of the call
 *         remarks:
 *           type: string
 *           description: Additional remarks
 *         receive_type:
 *           type: string
 *           enum: [call, msg, email, meeting]
 *           description: How the communication was received
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
 *     description: Log a new call (Requires can_write permission)
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
 *               - project_id
 *               - call_type
 *               - call_subtype
 *               - receive_type
 *             properties:
 *               caller_name:
 *                 type: string
 *                 example: "John Smith"
 *               caller_number:
 *                 type: string
 *                 description: Optional phone number
 *                 example: "+1-555-0123"
 *               project_id:
 *                 type: string
 *                 format: uuid
 *               call_type:
 *                 type: string
 *                 enum: [inquiry, request, complaint]
 *               call_subtype:
 *                 type: string
 *                 example: "Product Question"
 *               call_summary:
 *                 type: string
 *                 description: Optional summary
 *                 example: "Customer asked about pricing"
 *               remarks:
 *                 type: string
 *                 description: Optional remarks
 *               receive_type:
 *                 type: string
 *                 enum: [call, msg, email, meeting]
 *     responses:
 *       201:
 *         description: Call record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 call:
 *                   $ref: '#/components/schemas/Call'
 *       400:
 *         description: Validation error or invalid call_subtype for the call_type
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Requires write permission
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/calls:
 *   get:
 *     summary: Get all call records
 *     description: Retrieve paginated list of calls. Non-admin users only see their own calls.
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Paginated list of call records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: List of All calls
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Call'
 *                 total:
 *                   type: integer
 *                   example: 120
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 20
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/calls/{id}:
 *   get:
 *     summary: Get call record by ID
 *     description: Retrieve a specific call record. Non-admin users can only see their own calls.
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
 *         description: Call record found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 call:
 *                   $ref: '#/components/schemas/Call'
 *       403:
 *         description: Forbidden - can only view own calls
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
 *     description: Update call details (Requires can_update permission). Non-admin users can only update own calls.
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
 *               call_type:
 *                 type: string
 *                 enum: [inquiry, request, complaint]
 *               call_subtype:
 *                 type: string
 *               call_summary:
 *                 type: string
 *               remarks:
 *                 type: string
 *               receive_type:
 *                 type: string
 *                 enum: [call, msg, email, meeting]
 *     responses:
 *       200:
 *         description: Call updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 call:
 *                   $ref: '#/components/schemas/Call'
 *       400:
 *         description: Invalid input or invalid call_subtype
 *       403:
 *         description: Forbidden or requires update permission
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
 *     description: Delete a call record (Requires can_delete permission). Non-admin users can only delete own calls.
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
 *         description: Call deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden or requires delete permission
 *       404:
 *         description: Call not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
