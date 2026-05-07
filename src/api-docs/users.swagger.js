/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs (Admin only)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         employee_id:
 *           type: string
 *           description: Unique employee ID (auto-generated)
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role_id:
 *           type: string
 *           format: uuid
 *         role:
 *           type: string
 *           description: Role name
 *         is_admin:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *     UserWithCredentials:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *         credentials:
 *           type: object
 *           properties:
 *             employee_id:
 *               type: string
 *             password:
 *               type: string
 *               description: Auto-generated temporary password
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user with auto-generated employee ID and temporary password (Admin only)
 *     tags: [Users]
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
 *               - role_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 description: Optional email address
 *                 example: "john@example.com"
 *               role_id:
 *                 type: string
 *                 format: uuid
 *               is_admin:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: User created successfully with temporary credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserWithCredentials'
 *       400:
 *         description: Validation error - missing required fields
 *       404:
 *         description: Role not found
 *       409:
 *         description: Email already in use
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve list of all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by ID (Admin only)
 *     tags: [Users]
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
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update user
 *     description: Update user details (Admin only)
 *     tags: [Users]
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
 *               email:
 *                 type: string
 *               role_id:
 *                 type: string
 *                 format: uuid
 *               is_admin:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already in use
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Delete a user (Admin only)
 *     tags: [Users]
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
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
