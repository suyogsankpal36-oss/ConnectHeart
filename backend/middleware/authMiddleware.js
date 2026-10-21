
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required. Please log in.",
      });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Authentication token is missing.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    const user = await User.findById(decoded.userId).select("isActive");
    if (!user || user.isActive === false) {
      return res.status(401).json({
        message: "User session invalid or account deactivated. Please log in again.",
      });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      message:
        error.name === "TokenExpiredError"
          ? "Your session has expired. Please log in again."
          : "Invalid authentication token. Please log in again.",
    });
  }
};
