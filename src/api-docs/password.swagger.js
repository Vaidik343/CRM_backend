/**
 * @swagger
 * tags:
 *   name: Password
 *   description: Password management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PasswordChangeRequest:
 *       type: object
 *       required:
 *         - current_password
 *         - new_password
 *       properties:
 *         current_password:
 *           type: string
 *           description: Current password of the logged-in user
 *         new_password:
 *           type: string
 *           description: New password, minimum 6 characters
 *     PasswordResetResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         credentials:
 *           type: object
 *           properties:
 *             employee_id:
 *               type: string
 *             password:
 *               type: string
 *               description: Newly generated temporary password
 */

/**
 * @swagger
 * /api/password/change:
 *   patch:
 *     summary: Change own password
 *     description: Logged-in users can change their own password by providing the current password and a new password.
 *     tags: [Password]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordChangeRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error - invalid or missing password fields
 *       401:
 *         description: Unauthorized or current password incorrect
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/password/reset/{id}:
 *   patch:
 *     summary: Reset user password
 *     description: Admins can reset any employee password and receive a temporary password in the response payload.
 *     tags: [Password]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user whose password will be reset
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PasswordResetResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
