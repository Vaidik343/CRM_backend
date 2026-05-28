require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/connectDB");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const http = require("http");
const { Server } = require("socket.io");
const { startDueDateCron } = require("./utils/dueDateCron");
const app = express();
const server = http.createServer(app);  // wrap express in http server for socket.io

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 7015;

const routeFiles = [
  "auth.routes.js",
  "calls.routes.js",
  "dashboard.routes.js",
  "export.routes.js",
  "password.routes.js",
  "projects.routes.js",
  "tasks.routes.js",
  "teams.routes.js",
  "teamMembers.routes.js",
  "workLogs.routes.js",
  "permissions.routes.js",
  "roles.routes.js",
  "users.routes.js",
  "notifications.routes.js",  // new
];

// ── Middleware ────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(cookieParser());
app.use("/public", express.static(path.join(__dirname, "public")));

// ── Make io accessible in all controllers via req.app.get("io") ──
app.set("io", io);

// ── Basic routes ──────────────────────────────────────────────
app.get("/", (req, res) => res.send("home page12"));
app.get("/health", (req, res) => res.json({ ok: true }));

// ── API routes ────────────────────────────────────────────────
routeFiles.forEach((file) => {
  const route = require(`./routes/${file}`);
  app.use("/api", route);
  console.log(`Loaded route: ${file}`);
});

// ── Swagger ───────────────────────────────────────────────────
const apiDocsPath = path.join(__dirname, "api-docs");
const apiFiles = fs
  .readdirSync(apiDocsPath)
  .filter((f) => f.endsWith(".js"))
  .map((f) => path.join(apiDocsPath, f));

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "CRM API", version: "3.0.0", description: "API documentation" },
    servers: [{ url: `http://localhost:${PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: apiFiles,
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
console.log("✅ Swagger docs loaded from:", apiFiles);

// ── Socket.io ─────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Frontend emits "join" with the logged-in user's id
  // e.g. socket.emit("join", user.id)
  socket.on("join", (userId) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} joined room user:${userId}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// ── Start ─────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();
      startDueDateCron(io);
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on 0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
  }
};

startServer();