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

const {transporter} = require("./utils/mailer");
const { scheduleEventNotifications } = require("./utils/scheduleEventNotifications");


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
  "backup.routes.js",
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
  "leave.routes.js",
  "leaveBalance.routes.js",
  "probation.routes.js",
  "intern.routes.js",
  "event.routes.js",
  "notifications.routes.js",  // new
  "report.routes.js",
  
  
  
];

// ── Middleware ────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
// Replace your current cors line
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:7015",
      "http://ewm.bbcspldev.in",
      "http://ewmapi.bbcspldev.in",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// app.options("*", cors());
app.use(express.json());
app.use(cookieParser());
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
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


// Your existing hand-written docs (keep as-is, no work wasted)
const apiDocsPath = path.join(__dirname, "api-docs");
const apiFiles = fs
  .readdirSync(apiDocsPath)
  .filter((f) => f.endsWith(".js"))
  .map((f) => path.join(apiDocsPath, f));

const manualSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "CRM API", version: "3.0.0", description: "API documentation" },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: apiFiles,
});

// Auto-generated spec (new routes going forward)
let autoSpec = { paths: {} };
const autoSpecPath = path.join(__dirname, "../swagger-output.json");
if (fs.existsSync(autoSpecPath)) {
  autoSpec = require(autoSpecPath);
}

// Merge: manual paths take priority over auto-generated
const mergedSpec = {
  ...autoSpec,
  paths: {
    ...autoSpec.paths,
    ...manualSpec.paths,   // hand-written overrides auto if same path
  },
  components: manualSpec.components,
  security: manualSpec.security,
};

// ── Fix CORS for Swagger UI ───────────────────────────────────
const swaggerUiOptions = {
  swaggerOptions: {
    url: null,                    // don't fetch from URL, use spec directly
    persistAuthorization: true,   // token stays after page refresh
    displayRequestDuration: true,
  },
};

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(mergedSpec, swaggerUiOptions)
);
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

  socket.on('join_intern', ({ intern_id }) => {
  socket.join(`intern:${intern_id}`);
});

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});


(async () => {
  try {
    await transporter.verify();
    console.log("✅ SMTP Server Ready");
  } catch (err) {
    console.error("❌ SMTP Verify Failed");
    console.error(err);
  }
})();

// ── Start ─────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();
    startDueDateCron(io);
    scheduleEventNotifications(io);

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