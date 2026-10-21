/**
 * server.js
 * 
 * Main Server Entry Point for ConnectHearts.
 * Integrates the Express application from app.js with the HTTP server,
 * sets up the Socket.IO real-time engine via socketService,
 * connects to MongoDB Atlas, and listens on the configured PORT.
 */

require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const { app, allowedOrigins } = require("./app");
const socketService = require("./services/socketService");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO with dynamic CORS matching Express configuration
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, "");
      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        (process.env.NODE_ENV !== "production" &&
          (normalizedOrigin.includes("localhost") ||
            normalizedOrigin.includes("127.0.0.1")));
      if (isAllowed) return callback(null, true);
      return callback(new Error(`Socket CORS: origin ${origin} not allowed.`));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Expose io instance to Express routes and controllers
app.set("io", io);

// Attach Socket.IO presence, messaging, typing, and WebRTC signaling
socketService.initSocket(io);

function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === "production";
  if (!process.env.JWT_SECRET) {
    if (isProduction) {
      console.error("FATAL: JWT_SECRET environment variable is missing.");
      process.exit(1);
    } else {
      process.env.JWT_SECRET = "connecthearts_dev_jwt_secret_key_32chars_min";
      console.warn("[SECURITY] WARNING: JWT_SECRET not set. Using local fallback for development.");
    }
  }

  if (isProduction && process.env.JWT_SECRET.length < 32) {
    console.error("FATAL: JWT_SECRET must be at least 32 characters in production.");
    process.exit(1);
  }
}

async function startServer() {
  try {
    validateEnvironment();
    await connectDB();

    server.listen(PORT, () => {
      console.log(`ConnectHearts server running at http://localhost:${PORT}`);
      console.log(`Socket.IO real-time engine ready.`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer, io };
