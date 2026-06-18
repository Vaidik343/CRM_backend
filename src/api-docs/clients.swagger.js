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
 *           description: JSONB array of names associated with this phone number. First element is treated as the primary display name. New names are merged in automatically when a call/registration reuses the same phone number.
 *           example: ["Jay Shah", "Jay's Assistant"]
 *         phone:
 *           type: string
 *           description: Unique key for the client record (not the primary key — UUID id is kept as PK for FK stability).
 *           example: "+91-9999999999"
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *         company:
 *           type: string
 *           nullable: true
 *         is_active:
 *           type: boolean
 *           description: Soft-delete flag. Set to false by DELETE; inactive clients are excluded from listClients.
 *           default: true
 *         created_by:
 *           type: string
 *           format: uuid
 *         creator:
 *           type: object
 *           nullable: true
 *           description: Populated only in listClients response.
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
 * /api/clients:
 *   get:
 *     summary: Get all active clients
 *     description: |
 *       Returns all clients where is_active is true. Supports optional search across
 *       phone, company, and names (JSONB array, matched via ILIKE on its text representation).
 *       Note: the search query param is currently parsed but not applied to the final
 *       query in the controller — the where clause used in findAll is always { is_active: true }.
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Matches against phone, company, or any entry in names.
 *     responses:
 *       200:
 *         description: List of clients
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
 *                     $ref: '#/components/schemas/Client'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client
 *     description: |
 *       Creates a client keyed by phone number. If a client with this phone already
 *       exists, this does NOT error — it merges the new name into the existing
 *       client's names array (if not already present) and updates company if changed,
 *       then returns 200 with the existing (updated) client instead of creating a duplicate.
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
 *                 example: "Jay Shah"
 *                 description: Becomes the first/only entry in the names array on first creation.
 *               phone:
 *                 type: string
 *                 example: "+91-9999999999"
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 client:
 *                   $ref: '#/components/schemas/Client'
 *       200:
 *         description: Existing client updated instead of creating a duplicate (same phone number)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 client:
 *                   $ref: '#/components/schemas/Client'
 *       400:
 *         description: Name and phone are required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/clients/{id}:
 *   patch:
 *     summary: Update client record
 *     description: |
 *       Directly overwrites whichever of names, phone, email, company are provided.
 *       Unlike createClient, this does NOT merge into the existing names array —
 *       sending names will replace the array entirely.
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
 *                 description: Replaces the entire names array if provided.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 client:
 *                   $ref: '#/components/schemas/Client'
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
 *     summary: Soft-delete client record
 *     description: Sets is_active to false. The client row is not actually removed from the database.
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
 *         description: Client deleted (soft)
 *       404:
 *         description: Client not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */