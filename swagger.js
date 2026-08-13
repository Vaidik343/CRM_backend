const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "CRM API",
    version: "3.0.0",
    description: "API documentation",
  },
  servers: [
    { url: "http://localhost:7015", description: "Local Development" },
    { url: "http://ewmapi.bbcspldev.in", description: "Production" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  security: [{ bearerAuth: [] }],
};

const outputFile = "./swagger-output.json";

const routes = [
  "./src/routes/auth.routes.js",
  "./src/routes/calls.routes.js",
  "./src/routes/client.routes.js",
  "./src/routes/dashboard.routes.js",
  "./src/routes/export.routes.js",
  "./src/routes/password.routes.js",
  "./src/routes/projects.routes.js",
  "./src/routes/tasks.routes.js",
  "./src/routes/teams.routes.js",
  "./src/routes/teamMembers.routes.js",
  "./src/routes/workLogs.routes.js",
  "./src/routes/permissions.routes.js",
  "./src/routes/users.routes.js",
  "./src/routes/roles.routes.js",
  "./src/routes/leave.routes.js",
  "./src/routes/leaveBalance.routes.js",
  "./src/routes/probation.routes.js",
  "./src/routes/intern.routes.js",
  "./src/routes/notifications.routes.js",
  "./src/routes/report.routes.js",
];
console.log("🚀 ~ routes:", routes)

swaggerAutogen(outputFile, routes, doc);