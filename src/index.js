require("dotenv").config(); // Load env FIRST

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/connectDB");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 7015;
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');


const routeFiles = [
  'auth.routes.js',
  'calls.routes.js',
  'dashboard.routes.js',
  'export.routes.js',
  'password.routes.js',
  'projects.routes.js',
  'tasks.routes.js',
  'workLogs.routes.js',
  'permissions.routes.js',
  'roles.routes.js',
  'users.routes.js',
];


app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(cors());
// app.options('*', cors());
app.use(express.json());
app.use(cookieParser());

app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("home page12");
});
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Ensure upload temp directory exists (important for production)
// const tempDir = path.join(__dirname, "public", "temp");

// if (!fs.existsSync(tempDir)) {
//   fs.mkdirSync(tempDir, { recursive: true });
//   console.log("📁 Created upload temp directory:", tempDir);
// }

// routes
routeFiles.forEach((file) => {
  const route = require(`./routes/${file}`);
  app.use('/api', route);
  console.log(`Loaded route: ${file}`);
});


// Load all Swagger doc files from api-doc folder
const apiDocsPath = path.join(__dirname, 'api-docs');
const apiFiles = fs
  .readdirSync(apiDocsPath)
  .filter((file) => file.endsWith('.js'))
  .map((file) => path.join(apiDocsPath, file));

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRM API',
      version: '1.0.0',
      description: 'API documentation ',
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === 'production'
            ? `http://localhost:${PORT}`
            : `http://localhost:${PORT}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: apiFiles,
};


const swaggerSpec = swaggerJsdoc(options);

// 🧾 Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// console.log('✅ Swagger docs loaded from:', apiFiles);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT,  () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
  }
};

startServer();
