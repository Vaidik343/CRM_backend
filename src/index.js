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
const cron = require("node-cron");
const { cleanupOldNotifications } = require("./utils/notificationCleanup");


const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
  allowEIO3: true,  
});
const PORT = process.env.PORT || 7015;

const routeFiles = [
  "auth.routes.js",
  "calls.routes.js",
  "client.routes.js",
  "dashboard.routes.js",
  "export.routes.js",
  "password.routes.js",
  "projects.routes.js",
  "tasks.routes.js",
  "teams.routes.js",
  "teamMembers.routes.js",
  "workLogs.routes.js",
  "permissions.routes.js",
  "users.routes.js",
  "roles.routes.js",
  "notifications.routes.js",  // new
  "report.routes.js"
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
app.get("/", (req, res) => res.send("home page"));
app.get("/health", (req, res) => res.json({ ok: true }));


app.use((req, res, next) => {
  // console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// ── API routes ────────────────────────────────────────────────
routeFiles.forEach((file) => {
  const route = require(`./routes/${file}`);
  app.use("/api", route);
  console.log(`Loaded route: ${file}`);
});

// ← add this after all routes are loaded
app.get("/api/users", (req, res) => {
  console.log("⚠️ FALLTHROUGH — /api/users not caught by any route file");
  res.json({ debug: "fallthrough" });
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
    servers: [
  {
    url: `http://localhost:${PORT}`,
    description: "Local Development",
  },
  {
    url: 'http://ewmapi.bbcspldev.in/',
    description: "Production",
  },
],
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

    cron.schedule("0 2 * * *", () => {
      cleanupOldNotifications();
    });

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on 0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
  }
};
// const startServer = async () => {
//   try {
//     await connectDB();
//       startDueDateCron(io);
//     server.listen(PORT,  () => {
//       console.log(`🚀 Server running http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     console.error("❌ Server startup failed:", error.message);
//   }
// };

startServer();