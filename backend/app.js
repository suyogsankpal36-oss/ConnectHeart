/**
 * app.js
 * 
 * Express Application Configuration for ConnectHearts.
 * Separates route definitions, security middleware, and error handlers from the HTTP server listener,
 * enabling clean architectural separation, scalability, and modular integration.
 */

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

// Route imports
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const discoverRoutes = require("./routes/discoverRoutes");
const likeRoutes = require("./routes/likeRoutes");
const matchRoutes = require("./routes/matchRoutes");
const messageRoutes = require("./routes/messageRoutes");
const blockRoutes = require("./routes/blockRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const seedRoutes = require("./routes/seedRoutes");
const { getUserProfileById } = require("./controllers/profileController");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

// Trust first proxy (Render, Railway, etc.) for accurate rate limiting
app.set("trust proxy", 1);

// Allowed CORS origins resolution
const rawOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : []),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]
  .filter(Boolean)
  .map((o) => o.trim().replace(/\/+$/, ""));

const allowedOrigins = Array.from(new Set(rawOrigins));

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, "");
      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        (process.env.NODE_ENV !== "production" &&
          (normalizedOrigin.includes("localhost") ||
            normalizedOrigin.includes("127.0.0.1")));

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy violation: origin ${origin} is not allowed.`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: "Too many authentication requests. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordRecoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: "Too many recovery attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/forgot-password", passwordRecoveryLimiter);
app.use("/api/auth/reset-password", passwordRecoveryLimiter);
app.use("/api/auth", authLimiter);
app.use("/api", generalLimiter);

// Serve local profile uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health & Liveness Check Endpoints
function getHealthStatus(req, res) {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? "ok" : "degraded",
    database: isConnected ? "connected" : "disconnected",
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    service: "ConnectHearts API",
  });
}

app.get("/health", getHealthStatus);
app.get("/api/health", getHealthStatus);
app.get("/api/live", (req, res) => res.status(200).json({ status: "alive", timestamp: new Date().toISOString() }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/discover", discoverRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
if (process.env.NODE_ENV !== "production") {
  app.use("/api/seed", seedRoutes);
}

// Public user profile alias requested in spec
app.get("/api/users/:userId", authMiddleware, (req, res, next) => {
  req.params.id = req.params.userId;
  return getUserProfileById(req, res, next);
});

// Root API welcome
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to ConnectHearts API ❤️",
    version: "1.0.0",
    docs: "/api/health",
  });
});

// 404 handler for unmatched API routes
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

// Centralized production error handler
app.use((err, req, res, next) => {
  console.error("[SERVER ERROR]", err.message);
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "An internal server error occurred."
      : err.message || "An unexpected error occurred.";

  return res.status(status).json({ message });
});

module.exports = { app, allowedOrigins };
