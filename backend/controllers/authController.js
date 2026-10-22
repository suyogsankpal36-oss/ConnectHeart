
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { verifyGoogleOrFirebaseToken } = require("../services/googleAuthService");

function createToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, age, gender } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      age === undefined ||
      age === null ||
      !gender
    ) {
      return res.status(400).json({
        message: "Please provide valid registration details."
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      return res.status(400).json({
        message: "Name must be between 2 and 60 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail) || normalizedEmail.length > 100) {
      return res.status(400).json({
        message: "Please enter a valid email address."
      });
    }

    const parsedAge = Number(age);
    if (!Number.isInteger(parsedAge) || parsedAge < 18 || parsedAge > 120) {
      return res.status(400).json({
        message: "You must be at least 18 years old."
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must contain 8–72 characters."
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists."
      });
    }

    let normalizedGender = (gender || "").toString().toLowerCase().trim();
    if (normalizedGender === "man") normalizedGender = "male";
    if (normalizedGender === "woman") normalizedGender = "female";

    const validGenders = ["male", "female", "non-binary", "other"];
    if (!validGenders.includes(normalizedGender)) {
      return res.status(400).json({
        message: "Please select a valid gender: male, female, non-binary, or other."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password: passwordHash,
      age: parsedAge,
      gender: normalizedGender
    });

    return res.status(201).json({
      message: "Registration successful.",
      token: createToken(user._id.toString()),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        bio: user.bio || "",
        city: user.city || "",
        interests: user.interests || [],
        lookingFor: user.lookingFor || "relationship",
        profilePhoto: user.profilePhoto || "",
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists."
      });
    }

    console.error("Registration error:", error.message);
    return res.status(500).json({
      message: "Registration failed."
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "This account has been deactivated."
      });
    }

    return res.json({
      message: "Login successful.",
      token: createToken(user._id.toString()),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        bio: user.bio,
        city: user.city,
        interests: user.interests,
        lookingFor: user.lookingFor,
        profilePhoto: user.profilePhoto,
        photos: user.photos || [],
        discoveryPreferences: user.discoveryPreferences,
        notificationSettings: user.notificationSettings,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      message: "Login failed.",
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const Match = require("../models/Match");
    const Like = require("../models/Like");
    const Notification = require("../models/Notification");

    const [matchesCount, likesSentCount, likesReceivedCount, unreadNotificationsCount] =
      await Promise.all([
        Match.countDocuments({ users: req.userId }),
        Like.countDocuments({
          fromUser: req.userId,
          type: { $in: ["like", "superlike"] },
        }),
        Like.countDocuments({
          toUser: req.userId,
          type: { $in: ["like", "superlike"] },
        }),
        Notification.countDocuments({
          recipient: req.userId,
          read: false,
        }),
      ]);

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        bio: user.bio,
        city: user.city,
        interests: user.interests,
        lookingFor: user.lookingFor,
        profilePhoto: user.profilePhoto,
        photos: user.photos || [],
        prompts: user.prompts || [],
        lifestyle: user.lifestyle || {},
        isVerified: !!user.isVerified,
        discoveryPreferences: user.discoveryPreferences,
        notificationSettings: user.notificationSettings,
      },
      stats: {
        matchesCount,
        likesSentCount,
        likesReceivedCount,
        unreadNotificationsCount,
      },
    });
  } catch (error) {
    console.error("Get me error:", error.message);
    return res.status(500).json({ message: "Failed to fetch user data." });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required." });
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      return res.status(400).json({ message: "New password must contain 8–72 characters." });
    }

    const user = await User.findById(req.userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password does not match." });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Change password error:", error.message);
    return res.status(500).json({ message: "Failed to change password." });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please enter your email address." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      // Return identical generic message to prevent account enumeration
      return res.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been issued.",
      });
    }

    const crypto = require("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // In non-production environments without active SMTP, log the reset link to server console only
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[AUTH-DEV] Password reset link for ${user.email}:\n  Token: ${resetToken}\n  Link: http://localhost:5173/forgot-password?token=${resetToken}\n`);
    }

    // Security (OWASP CWE-640): NEVER expose the token in the HTTP response under ANY environment
    return res.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been issued.",
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    return res.status(500).json({ message: "Password reset request failed." });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      return res.status(400).json({ message: "Password must contain 8–72 characters." });
    }

    const crypto = require("crypto");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ success: true, message: "Password reset successful. Please log in." });
  } catch (error) {
    console.error("Reset password error:", error.message);
    return res.status(500).json({ message: "Failed to reset password." });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const confirmationPassword =
      req.body.confirmationPassword || req.body.password;
    const confirmDelete = req.body.confirmDelete;

    const user = await User.findById(req.userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (confirmationPassword) {
      const isMatch = await bcrypt.compare(confirmationPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect password. Account deletion canceled." });
      }
    } else if (confirmDelete === "DELETE MY ACCOUNT") {
      // Allow deletion without password for Google OAuth users who confirm explicitly
    } else {
      return res.status(400).json({
        message: "Password confirmation is required to delete your account."
      });
    }

    const Match = require("../models/Match");
    const Like = require("../models/Like");
    const Message = require("../models/Message");
    const Block = require("../models/Block");
    const Report = require("../models/Report");
    const Notification = require("../models/Notification");
    const fs = require("fs");
    const path = require("path");

    // Safely remove user's local photos from disk
    const allUserPhotos = [user.profilePhoto, ...(user.photos || [])].filter(Boolean);
    for (const photoUrl of allUserPhotos) {
      if (typeof photoUrl === "string" && photoUrl.startsWith("/uploads/profiles/")) {
        const filename = path.basename(photoUrl);
        if (filename && filename !== "." && filename !== "..") {
          const safePath = path.join(__dirname, "..", "uploads", "profiles", filename);
          if (fs.existsSync(safePath)) {
            try { fs.unlinkSync(safePath); } catch {}
          }
        }
      }
    }

    // Cascade delete related records
    await Promise.all([
      Like.deleteMany({ $or: [{ fromUser: req.userId }, { toUser: req.userId }] }),
      Match.deleteMany({ users: req.userId }),
      Message.deleteMany({ $or: [{ sender: req.userId }, { receiver: req.userId }] }),
      Block.deleteMany({ $or: [{ blocker: req.userId }, { blockedUser: req.userId }] }),
      Report.deleteMany({ $or: [{ reporter: req.userId }, { reportedUser: req.userId }] }),
      Notification.deleteMany({ $or: [{ recipient: req.userId }, { sender: req.userId }] }),
      User.findByIdAndDelete(req.userId),
    ]);

    return res.json({
      success: true,
      message: "Your account and all associated data have been permanently deleted.",
    });
  } catch (error) {
    console.error("Delete account error:", error.message);
    return res.status(500).json({ message: "Could not delete account." });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({ message: "Failed to logout." });
  }
};
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== "string" || !idToken.trim()) {
      return res.status(401).json({
        message: "Google authentication token (idToken) is required."
      });
    }

    // Cryptographically verify Google/Firebase ID token signature and claims
    let verified;
    try {
      verified = await verifyGoogleOrFirebaseToken(idToken.trim());
    } catch (verifyErr) {
      console.warn("Google token verification failed:", verifyErr.message);
      return res.status(401).json({
        message: `Google authentication failed: ${verifyErr.message}`
      });
    }

    // Always use verified identity claims extracted from cryptographically verified token
    const verifiedEmail = verified.email;
    const verifiedUid = verified.uid;
    const verifiedName = (verified.name || req.body.name || verifiedEmail.split("@")[0] || "ConnectHearts User").trim();
    const verifiedPhoto = verified.photoURL || req.body.photoURL || "";

    let user = await User.findOne({ email: verifiedEmail });

    if (user && user.isActive === false) {
      return res.status(403).json({
        message: "This account has been deactivated."
      });
    }

    if (!user) {
      // First-time sign up with Google
      const crypto = require("crypto");
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      user = await User.create({
        name: verifiedName,
        email: verifiedEmail,
        password: passwordHash,
        age: 24, // default age
        gender: "other",
        profilePhoto: verifiedPhoto,
        photos: verifiedPhoto ? [verifiedPhoto] : [],
        isVerified: true,
        googleId: verifiedUid || null,
        authProvider: "google",
      });
    } else {
      // Prevent Google ID mismatch if an account was already linked to a different Google UID
      if (user.googleId && verifiedUid && user.googleId !== verifiedUid) {
        return res.status(401).json({
          message: "Google account mismatch. Please sign in with your original linked Google account."
        });
      }

      if (!user.googleId && verifiedUid) {
        user.googleId = verifiedUid;
      }

      // If user exists and doesn't have a profile photo, update with Google avatar
      if (!user.profilePhoto && verifiedPhoto) {
        user.profilePhoto = verifiedPhoto;
        if (!Array.isArray(user.photos) || user.photos.length === 0) {
          user.photos = [verifiedPhoto];
        }
      }
      await user.save();
    }

    return res.json({
      message: "Google authentication successful.",
      token: createToken(user._id.toString()),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        bio: user.bio || "",
        city: user.city || "",
        interests: user.interests || [],
        lookingFor: user.lookingFor || "relationship",
        profilePhoto: user.profilePhoto || "",
        photos: user.photos || [],
        discoveryPreferences: user.discoveryPreferences,
        notificationSettings: user.notificationSettings,
      }
    });
  } catch (error) {
    console.error("Google auth controller error:", error.message);
    return res.status(500).json({
      message: error.message || "Google authentication failed on server.",
      error: error.message
    });
  }
};
