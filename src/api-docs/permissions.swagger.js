/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Permission management APIs (Admin only)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Permission:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         can_read:
 *           type: boolean
 *           description: Permission to read records
 *         can_write:
 *           type: boolean
 *           description: Permission to create records
 *         can_update:
 *           type: boolean
 *           description: Permission to update records
 *         can_delete:
 *           type: boolean
 *           description: Permission to delete records
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Get all user permissions
 *     description: Retrieve list of all users with their permissions (Admin only)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                       can_read:
 *                         type: boolean
 *                       can_write:
 *                         type: boolean
 *                       can_update:
 *                         type: boolean
 *                       can_delete:
 *                         type: boolean
 *                       User:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           employee_id:
 *                             type: string
 *                           email:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /permissions/{user_id}:
 *   get:
 *     summary: Get user permission by user ID
 *     description: Retrieve permission record for a specific user (Admin only)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Permission record found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 permission:
 *                   $ref: '#/components/schemas/Permission'
 *       404:
 *         description: Permission record not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /permissions/{user_id}:
 *   patch:
 *     summary: Update user permissions
 *     description: Update permission flags for a user (Admin only). Creates default permission record if not exists.
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
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
 *               can_read:
 *                 type: boolean
 *               can_write:
 *                 type: boolean
 *               can_update:
 *                 type: boolean
 *               can_delete:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 permission:
 *                   $ref: '#/components/schemas/Permission'
 *                 created:
 *                   type: boolean
 *                   description: Whether a new permission record was created
 *       400:
 *         description: Invalid input
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
 * /permissions/{user_id}/reset:
 *   patch:
 *     summary: Reset user permissions to default
 *     description: Reset permissions to default values (can_read=true, can_write=true, can_update=false, can_delete=false). Admin only.
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Permissions reset to default
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 permission:
 *                   $ref: '#/components/schemas/Permission'
 *       404:
 *         description: Permission record not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
