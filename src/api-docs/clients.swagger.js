/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Client management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         names:
 *           type: array
 *           items:
 *             type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *         company:
 *           type: string
 *           nullable: true
 *         is_active:
 *           type: boolean
 *         created_by:
 *           type: string
 *           format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: List active clients
 *     description: Returns all active clients and supports an optional search term across phone, company, and names.
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of clients
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create or merge a client
 *     description: Creates a client by phone. If the phone already exists, the controller merges the new name into the existing client and returns 200 instead of creating a duplicate.
 *     tags: [Clients]
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
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *               company:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Client created
 *       200:
 *         description: Existing client updated and returned
 *       400:
 *         description: name and phone are required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/clients/{id}:
 *   patch:
 *     summary: Update client
 *     description: Updates the client fields provided in the request body. The controller supports names, phone, email, and company.
 *     tags: [Clients]
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
 *               names:
 *                 type: array
 *                 items:
 *                   type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *               company:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Client updated
 *       404:
 *         description: Client not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Soft-delete client
 *     description: Marks the client as inactive instead of deleting it from the database.
 *     tags: [Clients]
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
 *         description: Client deleted
 *       404:
 *         description: Client not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
 */