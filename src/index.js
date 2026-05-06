require("dotenv").config(); // Load env FIRST

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/connectDB");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 7012;
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');


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
const routesPath = path.join(__dirname, 'routes');

// Load auth routes FIRST to avoid global authenticate middleware from other routes blocking it
const authRoute = require("./routes/auth.routes");
app.use('/api', authRoute);
console.log(`Loaded route: auth.routes.js`);

fs.readdirSync(routesPath).forEach((file) => {
  if (file.endsWith('.routes.js') && file !== 'auth.routes.js') {
    const route = require(path.join(routesPath, file));

    //Validate that the file exports a router
    if (route && typeof route === 'function') {
      app.use('/api', route);
      // console.log(`Loaded route: ${file}`);
    } else {
      console.warn(`skipped ${file}: not a valid router export`);
    }
  }
});

// app.use(require("./middleware/errorHandler"));



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

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
  }
};

startServer();
