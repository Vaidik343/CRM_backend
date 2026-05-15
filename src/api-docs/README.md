# API Documentation - Swagger JSDoc

This folder contains Swagger/OpenAPI documentation for all CRM APIs using JSDoc comments format.

## Files Structure

- **auth.swagger.js** - Authentication APIs (login)
- **roles.swagger.js** - Role management APIs (Admin only)
- **users.swagger.js** - User management APIs (Admin only)
- **permissions.swagger.js** - Permission management APIs (Admin only)
- **projects.swagger.js** - Project management APIs
- **calls.swagger.js** - Call logging and management APIs
- **tasks.swagger.js** - Task assignment and management APIs
- **password.swagger.js** - Password change and reset APIs
- **dashboard.swagger.js** - Dashboard analytics APIs (Admin only)
- **workLogs.swagger.js** - Work log tracking APIs
- **export.swagger.js** - Data export APIs (Admin only)

## Setup Instructions

### 1. Install Required Packages

```bash
npm install swagger-jsdoc swagger-ui-express
```

### 2. Configure Swagger in Your Main App File (index.js or server.js)

Since you already have Swagger configured in your `index.js`, you just need to ensure all the swagger documentation files are being loaded. Your current setup automatically loads all `.js` files from the `api-docs` folder, so no additional imports are needed.

Your current `index.js` configuration already handles this:

```javascript
// Load all Swagger doc files from api-doc folder
const apiDocsPath = path.join(__dirname, 'api-docs');
const apiFiles = fs
  .readdirSync(apiDocsPath)
  .filter((file) => file.endsWith('.js'))
  .map((file) => path.join(apiDocsPath, file));

// Your swagger options...
const options = {
  definition: {
    // your existing config
  },
  apis: apiFiles, // This loads all our swagger files
};
```
      description: 'Complete REST API documentation for the CRM system'
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/api-docs/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

### 3. Access Swagger UI

Once configured, access the Swagger documentation at:
```
http://localhost:3000/api-docs
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### To Get a Token:
1. Login using the `/auth/login` endpoint
2. Provide `employee_id` and `password`
3. Receive `accessToken` in response
4. Use this token in all subsequent requests

## API Endpoints Summary

### Public
- `POST /auth/login` - User login

### User Management (Admin only)
- `POST /roles` - Create role
- `GET /roles` - List roles
- `GET /roles/{id}` - Get role by ID
- `PATCH /roles/{id}` - Update role
- `DELETE /roles/{id}` - Delete role

- `POST /users` - Create user
- `GET /users` - List users
- `GET /users/{id}` - Get user by ID
- `PATCH /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

- `GET /permissions` - List all permissions
- `GET /permissions/{user_id}` - Get user permissions
- `PATCH /permissions/{user_id}` - Update user permissions
- `PATCH /permissions/{user_id}/reset` - Reset permissions to default

### Projects
- `POST /projects` - Create project (Admin)
- `GET /projects` - List projects (Authenticated)
- `GET /projects/{id}` - Get project by ID
- `PATCH /projects/{id}` - Update project (Admin or creator)
- `DELETE /projects/{id}` - Delete project (Admin or creator)

### Calls
- `POST /calls` - Create call record (Requires can_write)
- `GET /calls` - List calls
- `GET /calls/{id}` - Get call by ID
- `PATCH /calls/{id}` - Update call (Requires can_update)
- `DELETE /calls/{id}` - Delete call (Requires can_delete)

### Tasks
- `POST /tasks` - Create task (Requires can_write)
- `GET /tasks` - List tasks
- `GET /tasks/{id}` - Get task by ID
- `PATCH /tasks/{id}` - Update task (Requires can_update)
- `DELETE /tasks/{id}` - Delete task (Requires can_delete)

### Work Logs
- `POST /work-logs` - Create work log (Requires can_write)
- `GET /work-logs` - List work logs
- `GET /work-logs/{id}` - Get work log by ID
- `PATCH /work-logs/{id}` - Update work log (Requires can_update)
- `DELETE /work-logs/{id}` - Delete work log (Requires can_delete)

### Export
- `GET /export?type={calls|tasks|work-logs}` - Export data to Excel (Admin only)

## Response Format

All responses follow a consistent JSON format:

### Success Response
```json
{
  "data": { /* response data */ },
  "message": "Success message"
}
```

### Error Response
```json
{
  "message": "Error description"
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

## Permission Flags

Users have the following permission flags:
- `can_read` - Can read/retrieve records (default: true)
- `can_write` - Can create new records (default: true)
- `can_update` - Can update existing records (default: false)
- `can_delete` - Can delete records (default: false)

## Notes

- All timestamps are in ISO 8601 format
- UUIDs are used for all ID fields
- Non-admin users can only see/manage their own records (except projects and roles)
- Admin users have access to all records and management functions
- Task status is auto-set: "ongoing" if self-assigned, "open" if assigned to others
- Closed tasks cannot be updated by non-admin users
