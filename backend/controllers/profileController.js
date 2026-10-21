const User = require("../models/User");
const fs = require("fs");
const path = require("path");

function safeDeleteUpload(photoUrl) {
  if (!photoUrl || !photoUrl.startsWith("/uploads/profiles/")) return;
  // Extract just the filename, rejecting any path traversal
  const filename = path.basename(photoUrl);
  if (!filename || filename === "." || filename === "..") return;
  const safePath = path.join(__dirname, "..", "uploads", "profiles", filename);
  if (fs.existsSync(safePath)) {
    fs.unlink(safePath, () => {});
  }
}

const allowedInterests = new Set([
  "Music",
  "Travel",
  "Movies",
  "Reading",
  "Fitness",
  "Cooking",
  "Photography",
  "Gaming",
  "Nature",
  "Technology",
  "Art",
  "Dancing",
]);

const allowedLookingFor = ["relationship", "friendship", "casual"];

function publicProfile(user) {
  const photos =
    Array.isArray(user.photos) && user.photos.length > 0
      ? user.photos
      : [user.profilePhoto].filter(Boolean);

  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    age: user.age,
    gender: user.gender,
    bio: user.bio,
    city: user.city,
    interests: user.interests,
    lookingFor: user.lookingFor,
    profilePhoto: user.profilePhoto || (photos[0] || ""),
    photos,
    prompts: user.prompts || [],
    lifestyle: user.lifestyle || {},
    isVerified: !!user.isVerified,
    discoveryPreferences: user.discoveryPreferences || {
      genderPreference: "all",
      minAge: 18,
      maxAge: 50,
      distance: 50,
    },
    notificationSettings: user.notificationSettings || {
      newMatches: true,
      messages: true,
      likes: true,
      sounds: true,
    },
  };
}

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ user: publicProfile(user) });
  } catch (error) {
    console.error("Get profile error:", error.message);
    return res.status(500).json({ message: "Could not load profile." });
  }
};

exports.updateProfile = async (req, res) => {
  let uploadedFile = req.file;

  try {
    const {
      name,
      age,
      bio,
      city,
      interests,
      lookingFor,
      prompts,
      lifestyle,
      photos,
      discoveryPreferences,
      notificationSettings,
    } = req.body;

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return res
        .status(400)
        .json({ message: "Name must be a valid non-empty string." });
    }

    if (age !== undefined) {
      const numericAge = Number(age);
      if (isNaN(numericAge) || numericAge < 18 || numericAge > 120) {
        return res
          .status(400)
          .json({ message: "Age must be between 18 and 120." });
      }
    }

    if (bio !== undefined && typeof bio !== "string") {
      return res.status(400).json({ message: "Bio must be text." });
    }

    if (bio !== undefined && bio.length > 500) {
      return res
        .status(400)
        .json({ message: "Bio cannot exceed 500 characters." });
    }

    if (city !== undefined && typeof city !== "string") {
      return res.status(400).json({ message: "City must be text." });
    }

    if (city !== undefined && city.length > 100) {
      return res
        .status(400)
        .json({ message: "City cannot exceed 100 characters." });
    }

    let parsedInterests;
    if (interests !== undefined) {
      try {
        parsedInterests =
          typeof interests === "string" ? JSON.parse(interests) : interests;
      } catch {
        return res.status(400).json({ message: "Interests must be valid JSON." });
      }

      if (
        !Array.isArray(parsedInterests) ||
        parsedInterests.length > allowedInterests.size ||
        parsedInterests.some(
          (item) => typeof item !== "string" || !allowedInterests.has(item)
        ) ||
        new Set(parsedInterests).size !== parsedInterests.length
      ) {
        return res
          .status(400)
          .json({ message: "Please provide valid interests." });
      }
    }

    if (lookingFor !== undefined && !allowedLookingFor.includes(lookingFor)) {
      return res.status(400).json({ message: "Invalid dating preference." });
    }

    let parsedPrompts;
    if (prompts !== undefined) {
      try {
        parsedPrompts =
          typeof prompts === "string" ? JSON.parse(prompts) : prompts;
      } catch {
        return res.status(400).json({ message: "Prompts must be valid JSON." });
      }

      if (Array.isArray(parsedPrompts)) {
        parsedPrompts = parsedPrompts
          .filter((p) => p && p.question && p.answer)
          .slice(0, 5)
          .map((p) => ({
            question: String(p.question).trim().slice(0, 150),
            answer: String(p.answer).trim().slice(0, 400),
          }));
      }
    }

    let parsedLifestyle;
    if (lifestyle !== undefined) {
      try {
        parsedLifestyle =
          typeof lifestyle === "string" ? JSON.parse(lifestyle) : lifestyle;
      } catch {
        return res
          .status(400)
          .json({ message: "Lifestyle must be valid JSON." });
      }
    }

    let parsedPhotos;
    if (photos !== undefined) {
      try {
        parsedPhotos =
          typeof photos === "string" ? JSON.parse(photos) : photos;
      } catch {
        parsedPhotos = undefined;
      }
    }

    let parsedDiscoveryPrefs;
    if (discoveryPreferences !== undefined) {
      try {
        parsedDiscoveryPrefs =
          typeof discoveryPreferences === "string"
            ? JSON.parse(discoveryPreferences)
            : discoveryPreferences;
      } catch {
        parsedDiscoveryPrefs = undefined;
      }
    }

    let parsedNotificationSettings;
    if (notificationSettings !== undefined) {
      try {
        parsedNotificationSettings =
          typeof notificationSettings === "string"
            ? JSON.parse(notificationSettings)
            : notificationSettings;
      } catch {
        parsedNotificationSettings = undefined;
      }
    }

    const user = await User.findById(req.userId);

    if (!user) {
      if (uploadedFile) {
        fs.unlink(uploadedFile.path, () => {});
      }
      return res.status(404).json({ message: "User not found." });
    }

    if (name !== undefined) user.name = name.trim();
    if (age !== undefined) user.age = Number(age);
    if (bio !== undefined) user.bio = bio.trim();
    if (city !== undefined) user.city = city.trim();
    if (parsedInterests !== undefined) user.interests = parsedInterests;
    if (lookingFor !== undefined) user.lookingFor = lookingFor;
    if (parsedPrompts !== undefined) user.prompts = parsedPrompts;

    if (parsedLifestyle && typeof parsedLifestyle === "object") {
      user.lifestyle = {
        zodiac: parsedLifestyle.zodiac || user.lifestyle?.zodiac || "",
        drinking: parsedLifestyle.drinking || user.lifestyle?.drinking || "",
        smoking: parsedLifestyle.smoking || user.lifestyle?.smoking || "",
        workout: parsedLifestyle.workout || user.lifestyle?.workout || "",
        pets: parsedLifestyle.pets || user.lifestyle?.pets || "",
        education: parsedLifestyle.education || user.lifestyle?.education || "",
        height: parsedLifestyle.height || user.lifestyle?.height || "",
      };
    }

    if (parsedDiscoveryPrefs && typeof parsedDiscoveryPrefs === "object") {
      const allowedGenders = ["all", "female", "male", "non-binary"];
      const gp = allowedGenders.includes(parsedDiscoveryPrefs.genderPreference)
        ? parsedDiscoveryPrefs.genderPreference
        : user.discoveryPreferences?.genderPreference || "all";
      const minA = Math.max(18, Math.min(120, Number(parsedDiscoveryPrefs.minAge) || 18));
      const maxA = Math.max(minA, Math.min(120, Number(parsedDiscoveryPrefs.maxAge) || 50));
      const dist = Math.max(1, Math.min(500, Number(parsedDiscoveryPrefs.distance) || 50));

      user.discoveryPreferences = {
        genderPreference: gp,
        minAge: minA,
        maxAge: maxA,
        distance: dist,
      };
    }

    if (parsedNotificationSettings && typeof parsedNotificationSettings === "object") {
      user.notificationSettings = {
        newMatches:
          parsedNotificationSettings.newMatches !== undefined
            ? Boolean(parsedNotificationSettings.newMatches)
            : user.notificationSettings?.newMatches ?? true,
        messages:
          parsedNotificationSettings.messages !== undefined
            ? Boolean(parsedNotificationSettings.messages)
            : user.notificationSettings?.messages ?? true,
        likes:
          parsedNotificationSettings.likes !== undefined
            ? Boolean(parsedNotificationSettings.likes)
            : user.notificationSettings?.likes ?? true,
        sounds:
          parsedNotificationSettings.sounds !== undefined
            ? Boolean(parsedNotificationSettings.sounds)
            : user.notificationSettings?.sounds ?? true,
      };
    }

    // Update photos gallery
    if (Array.isArray(parsedPhotos)) {
      user.photos = parsedPhotos
        .filter((p) => typeof p === "string" && /^(https?:\/\/|\/uploads\/)/i.test(p.trim()))
        .slice(0, 6);
      if (user.photos.length > 0) {
        user.profilePhoto = user.photos[0];
      }
    }

    // Direct Cloud Storage (Firebase) URL assignment
    if (req.body.profilePhoto && typeof req.body.profilePhoto === "string" && req.body.profilePhoto.trim()) {
      const cloudUrl = req.body.profilePhoto.trim();
      if (/^(https?:\/\/|\/uploads\/)/i.test(cloudUrl)) {
        const currentPhotos = Array.isArray(user.photos) ? [...user.photos] : [];
        if (!currentPhotos.includes(cloudUrl)) {
          currentPhotos.unshift(cloudUrl);
        }
        user.photos = currentPhotos.slice(0, 6);
        user.profilePhoto = cloudUrl;
      }
    }

    if (uploadedFile) {
      const newPhotoUrl = `/uploads/profiles/${uploadedFile.filename}`;
      const currentPhotos = Array.isArray(user.photos) ? [...user.photos] : [];
      if (!currentPhotos.includes(newPhotoUrl)) {
        currentPhotos.push(newPhotoUrl);
      }
      user.photos = currentPhotos.slice(0, 6);
      user.profilePhoto = user.photos[0] || newPhotoUrl;
    }

    await user.save();

    return res.json({
      message: "Profile updated successfully.",
      user: publicProfile(user),
    });
  } catch (error) {
    if (uploadedFile) {
      fs.unlink(uploadedFile.path, () => {});
    }
    console.error("Update profile error:", error.message);
    return res.status(500).json({ message: "Failed to update profile." });
  }
};

exports.deleteProfilePhoto = async (req, res) => {
  try {
    const { photoUrl } = req.body || {};
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (photoUrl && Array.isArray(user.photos)) {
      user.photos = user.photos.filter((p) => p !== photoUrl);
      user.profilePhoto = user.photos[0] || "";

      safeDeleteUpload(photoUrl);
    } else {
      const oldPhoto = user.profilePhoto;
      user.profilePhoto = "";
      user.photos = [];

      safeDeleteUpload(oldPhoto);
    }

    await user.save();

    return res.json({
      message: "Photo deleted successfully.",
      user: publicProfile(user),
    });
  } catch (error) {
    console.error("Delete photo error:", error.message);
    return res.status(500).json({ message: "Failed to delete photo." });
  }
};

exports.getUserProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require("mongoose");
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const Block = require("../models/Block");
    const [user, isBlocked] = await Promise.all([
      User.findById(id),
      Block.findOne({
        $or: [
          { blocker: req.userId, blockedUser: id },
          { blocker: id, blockedUser: req.userId },
        ],
      }),
    ]);

    if (
      !user ||
      user.isActive === false ||
      isBlocked ||
      user.isIncognito === true ||
      user.discoveryPreferences?.hideProfile === true
    ) {
      return res.status(404).json({ message: "User profile not found or unavailable." });
    }

    const currentUser = await User.findById(req.userId);
    const profile = publicProfile(user);

    if (currentUser) {
      const calculateCompatibility = (u1, u2) => {
        let score = 65;
        const i1 = u1.interests || [];
        const i2 = u2.interests || [];
        const mutual = i2.filter((x) => i1.includes(x));
        score += Math.min(24, mutual.length * 8);
        if (u1.lookingFor === u2.lookingFor) score += 8;
        return Math.min(99, score);
      };
      profile.compatibilityScore = calculateCompatibility(currentUser, user);
      profile.mutualInterests = (user.interests || []).filter((i) =>
        (currentUser.interests || []).includes(i)
      );
    }

    return res.json({ profile, user: profile });
  } catch (error) {
    console.error("Get user profile by ID error:", error.message);
    return res.status(500).json({ message: "Could not load user profile." });
  }
};
