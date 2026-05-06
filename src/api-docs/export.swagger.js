/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Data export APIs
 */

/**
 * @swagger
 * /export:
 *   get:
 *     summary: Export data to Excel
 *     description: Export calls, tasks, or work logs to Excel file format (Admin only)
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [calls, tasks, work-logs]
 *         description: Type of data to export
 *         example: "calls"
 *     responses:
 *       200:
 *         description: Excel file generated successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *               description: Excel file download
 *       400:
 *         description: Invalid type parameter. Must be one of - calls, tasks, work-logs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 *     x-codeSamples:
 *       - lang: bash
 *         source: |
 *           curl -X GET "http://localhost:3000/export?type=calls" \
 *             -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
 *             -o calls.xlsx
 */
