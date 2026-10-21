const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const primaryUri = process.env.MONGODB_URI;
  const fallbackUri =
    process.env.LOCAL_MONGODB_URI || "mongodb://127.0.0.1:27017/connecthearts";

  // Production requires valid MONGODB_URI
  if (isProduction && !primaryUri) {
    console.error("FATAL: MONGODB_URI environment variable is missing in production environment.");
    process.exit(1);
  }

  const mongooseOpts = {
    dbName: "connecthearts",
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
  };

  if (primaryUri) {
    try {
      const connection = await mongoose.connect(primaryUri, mongooseOpts);
      isConnected = true;
      console.log(`[DATABASE] MongoDB Atlas connected successfully to host: ${connection.connection.host}`);
      return connection;
    } catch (primaryError) {
      if (isProduction) {
        console.error(`[DATABASE] Critical: MongoDB Atlas connection failed in production: ${primaryError.message}`);
        process.exit(1);
      }
      console.warn(
        `[DATABASE] Primary MongoDB Atlas unreachable (${primaryError.message}). Falling back to local MongoDB development instance...`
      );
    }
  }

  // Non-production fallback
  try {
    const fallbackConnection = await mongoose.connect(fallbackUri, mongooseOpts);
    isConnected = true;
    console.log(
      `[DATABASE] MongoDB connected to local fallback instance: ${fallbackConnection.connection.host}`
    );
    return fallbackConnection;
  } catch (error) {
    console.error("[DATABASE] Fatal: Unable to connect to any MongoDB instance:", error.message);
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("[DATABASE] MongoDB connection lost. Awaiting reconnect...");
});

mongoose.connection.on("reconnected", () => {
  isConnected = true;
  console.log("[DATABASE] MongoDB connection re-established.");
});

module.exports = connectDB;

