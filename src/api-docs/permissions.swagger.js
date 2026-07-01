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
 *         can_write:
 *           type: boolean
 *         can_update:
 *           type: boolean
 *         can_delete:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     summary: List all permissions
 *     description: Lists every permission record and the linked user details. This route is admin-only.
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions returned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/permissions/{user_id}:
 *   get:
 *     summary: Get a single user permission record
 *     description: Returns the permission flags for one user.
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
 *         description: Permission record returned
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
 * /api/permissions/{user_id}:
 *   patch:
 *     summary: Update permissions for a user
 *     description: Updates the provided permission flags for a target user. If no permission row exists, the controller creates one with defaults.
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
 *         description: Permission updated
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
 * /api/permissions/{user_id}/reset:
 *   patch:
 *     summary: Reset permissions to defaults
 *     description: Resets the permissions for the target user to can_read=true, can_write=true, can_update=false, and can_delete=false.
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
 *         description: Permissions reset
 *       404:
 *         description: Permission record not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
