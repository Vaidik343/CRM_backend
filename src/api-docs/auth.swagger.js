/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with employee ID and password to get access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *               - password
 *             properties:
 *               employee_id:
 *                 type: string
 *                 description: Employee ID of the user
 *                 example: "EMP001"
 *               password:
 *                 type: string
 *                 description: Password of the user
 *                 example: "Admin@123"
 *     responses:
 *       200:
 *         description: Login successful, returns access token and user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token for authentication
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     employee_id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     is_admin:
 *                       type: boolean
 *                     role:
 *                       type: string
 *                     permissions:
 *                       type: object
 *                       properties:
 *                         can_read:
 *                           type: boolean
 *                         can_write:
 *                           type: boolean
 *                         can_update:
 *                           type: boolean
 *                         can_delete:
 *                           type: boolean
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation error - missing required fields
 *       500:
 *         description: Server error
 */
