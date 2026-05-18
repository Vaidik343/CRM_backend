/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Data export APIs
 */

/**
 * @swagger
 * /api/export:
 *   get:
 *     summary: Export data to Excel
 *     description: |
 *       Export calls, tasks, or work logs into Excel (.xlsx) format.
 *       
 *       Supports:
 *       - Single date export
 *       - Date range export
 *       - Default today's data export
 *       
 *       Admin only endpoint.
 *
 *     tags: [Export]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - calls
 *             - tasks
 *             - work-logs
 *         description: Type of data to export
 *         example: calls
 *
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Export data for a single date (YYYY-MM-DD)
 *         example: 2025-05-14
 *
 *       - in: query
 *         name: from
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range export (YYYY-MM-DD)
 *         example: 2025-05-01
 *
 *       - in: query
 *         name: to
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range export (YYYY-MM-DD)
 *         example: 2025-05-14
 *
 *     responses:
 *       200:
 *         description: Excel file generated successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *
 *       400:
 *         description: |
 *           Invalid request.
 *           
 *           Possible reasons:
 *           - Invalid type parameter
 *           - Missing required type query
 *           - Invalid date format
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Admin access required
 *
 *       500:
 *         description: Internal server error
 *
 *     x-codeSamples:
 *       - lang: bash
 *         label: Export today's calls
 *         source: |
 *           curl -X GET "http://localhost:3000/api/export?type=calls" \
 *             -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
 *             -o calls_today.xlsx
 *
 *       - lang: bash
 *         label: Export single date tasks
 *         source: |
 *           curl -X GET "http://localhost:3000/api/export?type=tasks&date=2025-05-14" \
 *             -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
 *             -o tasks_2025_05_14.xlsx
 *
 *       - lang: bash
 *         label: Export work logs by date range
 *         source: |
 *           curl -X GET "http://localhost:3000/api/export?type=work-logs&from=2025-05-01&to=2025-05-14" \
 *             -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
 *             -o worklogs_may.xlsx
 */