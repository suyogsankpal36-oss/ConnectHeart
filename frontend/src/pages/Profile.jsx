import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import MobileNav from "../components/MobileNav";
import { useAuth } from "../context/useAuth";
import api from "../services/api";
import { getPhotoUrl } from "../utils/photoUrl";
import { uploadPhotoToFirebase } from "../services/firebase";

const INTERESTS = [
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
];

const PROMPT_OPTIONS = [
  "A life goal of mine is...",
  "Dating me is like...",
  "My simple pleasures...",
  "Two truths and a lie...",
  "The best way to win me over is...",
  "My most controversial opinion is...",
  "Together, we could...",
  "I'll know it's time to delete ConnectHearts when...",
];

const ZODIAC_OPTIONS = [
  "Aries ♈",
  "Taurus ♉",
  "Gemini ♊",
  "Cancer ♋",
  "Leo ♌",
  "Virgo ♍",
  "Libra ♎",
  "Scorpio ♏",
  "Sagittarius ♐",
  "Capricorn ♑",
  "Aquarius ♒",
  "Pisces ♓",
];

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const previewUrlRef = useRef("");

  const [form, setForm] = useState({
    name: "",
    age: "",
    bio: "",
    city: "",
    interests: [],
    lookingFor: "relationship",
    lifestyle: {
      zodiac: "",
      workout: "",
      pets: "",
      drinking: "",
      height: "",
      education: "",
    },
    prompts: [],
    isVerified: false,
  });

  const [photos, setPhotos] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingInitial, setFetchingInitial] = useState(true);

  // Load current user profile details
  useEffect(() => {
    async function loadCurrentProfile() {
      try {
        const response = await api.get("/profile");
        const u = response.data.user;
        if (u) {
          setForm({
            name: u.name || "",
            age: u.age || "",
            bio: u.bio || "",
            city: u.city || "",
            interests: u.interests || [],
            lookingFor: u.lookingFor || "relationship",
            lifestyle: {
              zodiac: u.lifestyle?.zodiac || "",
              workout: u.lifestyle?.workout || "",
              pets: u.lifestyle?.pets || "",
              drinking: u.lifestyle?.drinking || "",
              height: u.lifestyle?.height || "",
              education: u.lifestyle?.education || "",
            },
            prompts: Array.isArray(u.prompts) ? u.prompts : [],
            isVerified: Boolean(u.isVerified),
          });

          const userPhotos = Array.isArray(u.photos) && u.photos.length > 0
            ? u.photos
            : [u.profilePhoto].filter(Boolean);
          setPhotos(userPhotos);

          if (userPhotos[0]) {
            setPreview(getPhotoUrl(userPhotos[0]));
          }
        }
      } catch {
        toast.error("Could not load profile details.");
      } finally {
        setFetchingInitial(false);
      }
    }

    loadCurrentProfile();
  }, []);

  // Camera stream handler
  useEffect(() => {
    if (!cameraOpen) return;

    let cancelled = false;
    let activeStream = null;

    async function startCamera() {
      setCameraLoading(true);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera access is unavailable. Use localhost or HTTPS.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        activeStream = stream;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        toast.error(err.message || "Could not open camera.");
        setCameraOpen(false);
      } finally {
        setCameraLoading(false);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOpen]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleLifestyleChange(field, value) {
    setForm((current) => ({
      ...current,
      lifestyle: {
        ...current.lifestyle,
        [field]: value,
      },
    }));
  }

  function handleAddPrompt() {
    if (form.prompts.length >= 3) {
      toast.error("You can add up to 3 prompts.");
      return;
    }
    const unusedPrompt =
      PROMPT_OPTIONS.find((p) => !form.prompts.some((fp) => fp.question === p)) ||
      PROMPT_OPTIONS[0];

    setForm((current) => ({
      ...current,
      prompts: [...current.prompts, { question: unusedPrompt, answer: "" }],
    }));
  }

  function handlePromptChange(index, field, value) {
    setForm((current) => {
      const updated = [...current.prompts];
      updated[index] = { ...updated[index], [field]: value };
      return { ...current, prompts: updated };
    });
  }

  function handleRemovePrompt(index) {
    setForm((current) => ({
      ...current,
      prompts: current.prompts.filter((_, idx) => idx !== index),
    }));
  }

  function toggleInterest(interest) {
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }));
  }

  function applyPhoto(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be smaller than 5 MB.");
      return;
    }

    const newUrl = URL.createObjectURL(file);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = newUrl;
    setPreview(newUrl);
    setPhoto(file);
  }

  function handleFileInputChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) applyPhoto(file);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      toast.error("Camera is not ready yet. Please wait a moment.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      toast.error("Unable to capture photo.");
      return;
    }

    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Photo capture failed.");
          return;
        }

        const capturedFile = new File(
          [blob],
          `connecthearts-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );

        applyPhoto(capturedFile);
        setCameraOpen(false);
        toast.success("Selfie captured!");
      },
      "image/jpeg",
      0.92
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.interests.length < 3) {
      toast.error("Please select at least 3 passions / interests.");
      return;
    }

    setLoading(true);

    try {
      // 1. Direct Firebase Cloud Storage upload if a new photo was selected
      let firebasePhotoUrl = null;
      if (photo) {
        try {
          toast.loading("Uploading photo to Firebase Cloud Storage...", { id: "firebase-upload" });
          firebasePhotoUrl = await uploadPhotoToFirebase(photo, user?.id || "user", "profiles");
          toast.success("Photo uploaded to cloud! ☁️", { id: "firebase-upload" });
        } catch (storageErr) {
          console.warn("Firebase Storage direct upload skipped/failed; falling back to server multer:", storageErr);
          toast.dismiss("firebase-upload");
        }
      }

      const profileData = new FormData();
      if (form.name) profileData.append("name", form.name);
      if (form.age) profileData.append("age", form.age);
      profileData.append("bio", form.bio);
      profileData.append("city", form.city);
      profileData.append("interests", JSON.stringify(form.interests));
      profileData.append("lookingFor", form.lookingFor);
      profileData.append("lifestyle", JSON.stringify(form.lifestyle));
      profileData.append("prompts", JSON.stringify(form.prompts));
      profileData.append("isVerified", form.isVerified);
      profileData.append("photos", JSON.stringify(photos));

      if (firebasePhotoUrl) {
        profileData.append("profilePhoto", firebasePhotoUrl);
      } else if (photo) {
        profileData.append("photo", photo);
      }

      const response = await api.put("/profile", profileData);

      toast.success("Profile saved successfully! ✨");
      await refreshUser();

      const updatedUser = response.data.user;
      if (updatedUser) {
        const uPhotos = updatedUser.photos || [];
        setPhotos(uPhotos);
        if (updatedUser.profilePhoto) {
          setPreview(getPhotoUrl(updatedUser.profilePhoto));
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not save profile changes."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePhoto(targetUrl = "") {
    try {
      await api.delete("/profile/photo", { data: { photoUrl: targetUrl } });
      if (targetUrl) {
        setPhotos((prev) => prev.filter((p) => p !== targetUrl));
        toast.success("Photo removed.");
      } else {
        setPreview("");
        setPhoto(null);
        setPhotos([]);
        toast.success("Primary photo removed.");
      }
      await refreshUser();
    } catch {
      toast.error("Could not remove photo.");
    }
  }

  function handleVerifyToggle() {
    setForm((current) => ({ ...current, isVerified: !current.isVerified }));
    toast.success(
      form.isVerified
        ? "Verification removed."
        : "✨ Verified profile checkmark active!"
    );
  }

  // Calculate profile completeness score
  let completeness = 20;
  if (preview) completeness += 25;
  if (form.bio.trim().length > 15) completeness += 15;
  if (form.city.trim()) completeness += 10;
  if (form.interests.length >= 3) completeness += 15;
  if (form.prompts.length >= 1) completeness += 10;
  if (form.lifestyle.zodiac || form.lifestyle.workout) completeness += 5;

  return (
    <div className="luxury-profile-page">
      <Navbar />

      <main className="luxury-profile-container">
        {fetchingInitial ? (
          <div className="luxury-loading-state">
            <span className="luxury-pulsing-heart">♥</span>
            <p>Polishing your profile studio...</p>
          </div>
        ) : (
          <div className="luxury-profile-grid">
            {/* Left: Studio Editor */}
            <div className="luxury-editor-column">
              {/* Studio Header Banner */}
              <div className="studio-hero-card">
                <div className="hero-text-block">
                  <span className="luxury-eyebrow">PROFILE STUDIO</span>
                  <h1 className="studio-title">Craft Your Romantic Story</h1>
                  <p className="studio-subtitle">
                    Profiles with rich photos, witty prompts, and clear intentions
                    spark 4x more meaningful matches.
                  </p>
                </div>

                {/* Profile Strength Meter */}
                <div className="strength-meter-box">
                  <div className="meter-label-row">
                    <span className="meter-title">Profile Magnetism</span>
                    <span className="meter-percent-badge">{completeness}% Complete</span>
                  </div>
                  <div className="meter-track-luxury">
                    <div
                      className="meter-fill-luxury"
                      style={{ width: `${Math.min(100, completeness)}%` }}
                    />
                  </div>
                  <p className="meter-hint">
                    {completeness < 70
                      ? "💡 Tip: Add 3 passions & a prompt to reach 90%+ chemistry strength!"
                      : "✨ Outstanding! Your profile is primed for high-affinity connections."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="luxury-form-flow">
                {/* 1. Photo Studio Card */}
                <section className="profile-section-card">
                  <div className="section-card-header">
                    <div className="section-header-icon">📸</div>
                    <div>
                      <h2 className="section-title">Photo Gallery & Portrait</h2>
                      <p className="section-desc">
                        Upload your best self portraits. The first photo will be your main discovery cover.
                      </p>
                    </div>
                  </div>

                  <div className="photo-studio-workspace">
                    {/* Primary Hero Portrait */}
                    <div className="primary-portrait-card">
                      {preview ? (
                        <div className="portrait-img-wrapper">
                          <img
                            src={preview}
                            alt="Primary Profile Portrait"
                            className="primary-portrait-img"
                          />
                          <div className="portrait-overlay-gradient" />
                          <span className="portrait-primary-tag">★ PRIMARY COVER</span>
                          {form.isVerified && (
                            <span className="portrait-verified-badge" title="Verified">✓</span>
                          )}
                        </div>
                      ) : (
                        <div
                          className="empty-portrait-slot"
                          onClick={() => fileInputRef.current?.click()}
                          role="button"
                          tabIndex={0}
                          title="Click to upload primary portrait"
                        >
                          <div className="empty-portrait-icon">♥</div>
                          <p className="empty-slot-text">No primary portrait yet</p>
                          <span className="empty-slot-sub">Click to browse or take a webcam selfie below</span>
                        </div>
                      )}

                      <div className="portrait-actions-toolbar">
                        <button
                          type="button"
                          className="luxury-btn-secondary"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          📁 Upload File
                        </button>

                        <button
                          type="button"
                          className="luxury-btn-secondary"
                          onClick={() => setCameraOpen(true)}
                        >
                          🎥 Webcam Selfie
                        </button>

                        {preview && (
                          <button
                            type="button"
                            className="luxury-btn-danger"
                            onClick={() => handleDeletePhoto("")}
                            title="Remove photo"
                          >
                            🗑️ Remove
                          </button>
                        )}

                        <button
                          type="button"
                          className={`luxury-btn-verified ${form.isVerified ? "is-active" : ""}`}
                          onClick={handleVerifyToggle}
                          title="Toggle verified checkmark"
                        >
                          {form.isVerified ? "✓ Verified Active" : "★ Get Verified"}
                        </button>

                        {/* Hidden native file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleFileInputChange}
                        />
                      </div>
                    </div>

                    {/* Secondary Gallery Grid */}
                    <div className="gallery-slots-wrapper">
                      <span className="gallery-section-label">Additional Photos (Up to 6)</span>
                      <div className="gallery-slots-grid">
                        {photos.slice(1).map((pUrl, idx) => (
                          <div key={idx} className="gallery-photo-slot filled">
                            <img src={getPhotoUrl(pUrl)} alt={`Gallery ${idx + 2}`} />
                            <button
                              type="button"
                              className="slot-delete-btn"
                              onClick={() => handleDeletePhoto(pUrl)}
                              title="Delete photo"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        {photos.length < 6 && (
                          <button
                            type="button"
                            className="gallery-photo-slot empty-slot-btn"
                            onClick={() => fileInputRef.current?.click()}
                            title="Add another photo"
                          >
                            <span className="slot-plus-icon">+</span>
                            <span className="slot-plus-text">Add Photo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Basic Identity Card */}
                <section className="profile-section-card">
                  <div className="section-card-header">
                    <div className="section-header-icon">👤</div>
                    <div>
                      <h2 className="section-title">Identity & Story</h2>
                      <p className="section-desc">
                        Essential information to introduce who you are to the ConnectHearts community.
                      </p>
                    </div>
                  </div>

                  <div className="fields-grid-duo">
                    <div className="luxury-input-group">
                      <label htmlFor="name" className="luxury-label">FULL NAME</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        className="luxury-text-input"
                        placeholder="Your full name"
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="luxury-input-group">
                      <label htmlFor="age" className="luxury-label">AGE</label>
                      <input
                        id="age"
                        name="age"
                        type="number"
                        min="18"
                        max="120"
                        className="luxury-text-input"
                        placeholder="18+"
                        value={form.age}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="fields-grid-duo">
                    <div className="luxury-input-group">
                      <label htmlFor="city" className="luxury-label">CURRENT CITY</label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        className="luxury-text-input"
                        placeholder="e.g. Mumbai, Bangalore, Pune..."
                        value={form.city}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="luxury-input-group">
                      <label htmlFor="lookingFor" className="luxury-label">DATING INTENTION</label>
                      <select
                        id="lookingFor"
                        name="lookingFor"
                        className="luxury-select-input"
                        value={form.lookingFor}
                        onChange={handleChange}
                      >
                        <option value="relationship">💍 Serious Long-term Romance</option>
                        <option value="friendship">🤝 Meaningful Friendship & Talks</option>
                        <option value="casual">☕ Casual Dating & Coffee Dates</option>
                      </select>
                    </div>
                  </div>

                  <div className="luxury-input-group">
                    <div className="label-with-counter">
                      <label htmlFor="bio" className="luxury-label">ABOUT YOU (BIO)</label>
                      <span className="char-counter-pill">{form.bio.length} / 500</span>
                    </div>
                    <textarea
                      id="bio"
                      name="bio"
                      rows="3"
                      className="luxury-textarea-input"
                      placeholder="Share what makes your eyes light up, your secret talents, or your ideal Sunday morning..."
                      value={form.bio}
                      onChange={handleChange}
                      maxLength={500}
                    />
                  </div>
                </section>

                {/* 3. Lifestyle Badges Card */}
                <section className="profile-section-card">
                  <div className="section-card-header">
                    <div className="section-header-icon">🌿</div>
                    <div>
                      <h2 className="section-title">Lifestyle & Chemistry Badges</h2>
                      <p className="section-desc">
                        Our matching algorithm uses these traits to compute real-time compatibility scores.
                      </p>
                    </div>
                  </div>

                  <div className="lifestyle-grid-luxury">
                    <div className="luxury-input-group">
                      <label className="luxury-label">ZODIAC SIGN</label>
                      <select
                        className="luxury-select-input"
                        value={form.lifestyle.zodiac}
                        onChange={(e) => handleLifestyleChange("zodiac", e.target.value)}
                      >
                        <option value="">Choose Zodiac</option>
                        {ZODIAC_OPTIONS.map((z) => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                    </div>

                    <div className="luxury-input-group">
                      <label className="luxury-label">WORKOUT HABIT</label>
                      <select
                        className="luxury-select-input"
                        value={form.lifestyle.workout}
                        onChange={(e) => handleLifestyleChange("workout", e.target.value)}
                      >
                        <option value="">Select Workout</option>
                        <option value="Every day">🏃 Every day</option>
                        <option value="Often">⚡ Often (3-4x/week)</option>
                        <option value="Sometimes">🧘 Sometimes</option>
                        <option value="Never">🛋️ Never</option>
                      </select>
                    </div>

                    <div className="luxury-input-group">
                      <label className="luxury-label">PETS</label>
                      <select
                        className="luxury-select-input"
                        value={form.lifestyle.pets}
                        onChange={(e) => handleLifestyleChange("pets", e.target.value)}
                      >
                        <option value="">Select Pets</option>
                        <option value="Dog lover 🐕">Dog lover 🐕</option>
                        <option value="Cat lover 🐈">Cat lover 🐈</option>
                        <option value="Both dogs & cats 🐾">Both dogs & cats 🐾</option>
                        <option value="Plant parent 🪴">Plant parent 🪴</option>
                        <option value="None">None</option>
                      </select>
                    </div>

                    <div className="luxury-input-group">
                      <label className="luxury-label">SOCIAL DRINKING</label>
                      <select
                        className="luxury-select-input"
                        value={form.lifestyle.drinking}
                        onChange={(e) => handleLifestyleChange("drinking", e.target.value)}
                      >
                        <option value="">Select Drinking</option>
                        <option value="Socially">🍷 Socially</option>
                        <option value="Frequently">🥂 Frequently</option>
                        <option value="Never">🚫 Never / Teetotaler</option>
                      </select>
                    </div>

                    <div className="luxury-input-group">
                      <label className="luxury-label">HEIGHT</label>
                      <input
                        type="text"
                        className="luxury-text-input"
                        placeholder="e.g. 5'10&quot; or 178 cm"
                        value={form.lifestyle.height}
                        onChange={(e) => handleLifestyleChange("height", e.target.value)}
                      />
                    </div>

                    <div className="luxury-input-group">
                      <label className="luxury-label">EDUCATION</label>
                      <input
                        type="text"
                        className="luxury-text-input"
                        placeholder="e.g. Master's in Design"
                        value={form.lifestyle.education}
                        onChange={(e) => handleLifestyleChange("education", e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                {/* 4. Hinge-Style Conversational Prompts Card */}
                <section className="profile-section-card">
                  <div className="section-card-header">
                    <div className="section-header-icon">💬</div>
                    <div>
                      <h2 className="section-title">Personal Prompts & Icebreakers</h2>
                      <p className="section-desc">
                        Give matches fun, romantic hooks to comment on when they like your profile!
                      </p>
                    </div>
                  </div>

                  <div className="prompts-luxury-stack">
                    {form.prompts.map((p, idx) => (
                      <div key={idx} className="luxury-prompt-box">
                        <div className="prompt-box-top">
                          <select
                            className="prompt-dropdown-luxury"
                            value={p.question}
                            onChange={(e) => handlePromptChange(idx, "question", e.target.value)}
                          >
                            {PROMPT_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="prompt-delete-btn"
                            onClick={() => handleRemovePrompt(idx)}
                            title="Remove Prompt"
                          >
                            ✕
                          </button>
                        </div>
                        <textarea
                          rows="2"
                          className="prompt-answer-input"
                          placeholder="Write your witty or heartfelt response..."
                          value={p.answer}
                          onChange={(e) => handlePromptChange(idx, "answer", e.target.value)}
                          maxLength={400}
                          required
                        />
                      </div>
                    ))}

                    {form.prompts.length < 3 && (
                      <button
                        type="button"
                        className="add-prompt-card-btn"
                        onClick={handleAddPrompt}
                      >
                        <span className="add-prompt-plus">+</span>
                        <span>Add a Dating Prompt ({form.prompts.length}/3)</span>
                      </button>
                    )}
                  </div>
                </section>

                {/* 5. Passions & Interests Card */}
                <section className="profile-section-card">
                  <div className="section-card-header">
                    <div className="section-header-icon">🎨</div>
                    <div>
                      <h2 className="section-title">Passions & Interests</h2>
                      <p className="section-desc">
                        Select at least 3 passions. Mutual passions appear as glowing gold badges during discovery!
                      </p>
                    </div>
                  </div>

                  <div className="passions-pill-grid">
                    {INTERESTS.map((interest) => {
                      const selected = form.interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          className={`passion-chip-luxury ${selected ? "is-selected" : ""}`}
                          onClick={() => toggleInterest(interest)}
                        >
                          <span className="chip-check-icon">{selected ? "✓" : "+"}</span>
                          <span className="chip-text">{interest}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Submit Action Button */}
                <div className="save-cta-wrapper">
                  <button
                    type="submit"
                    className="luxury-save-btn"
                    disabled={loading}
                  >
                    {loading ? "Saving Your Story..." : "Save Profile Changes ✨"}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Sticky Live Discover Preview */}
            <aside className="luxury-preview-column">
              <div className="preview-sticky-wrap">
                <div className="preview-heading-row">
                  <div className="live-indicator-dot" />
                  <span className="live-preview-title">Live Discover Preview</span>
                </div>

                <div className="discover-card-preview-model">
                  <div className="preview-media-frame">
                    {preview ? (
                      <>
                        <img
                          src={preview}
                          alt="Discover Preview"
                          className="preview-photo-img"
                        />
                        <div className="preview-photo-gradient" />
                      </>
                    ) : (
                      <div className="preview-photo-fallback">
                        <span className="fallback-heart-pulsing">♥</span>
                        <p>Upload a portrait to see your card shine</p>
                      </div>
                    )}

                    {/* Floating Badges */}
                    <div className="preview-badges-floating">
                      <span className="preview-badge-affinity">
                        ✨ {completeness}% Match Strength
                      </span>
                      <span className="preview-badge-intent">
                        {form.lookingFor === "relationship"
                          ? "💍 Long-term"
                          : form.lookingFor === "friendship"
                          ? "🤝 Friendship"
                          : "☕ Casual Dating"}
                      </span>
                    </div>

                    {/* Identity bar */}
                    <div className="preview-identity-bar">
                      <h3 className="preview-person-name">
                        {form.name || "Your Name"}, {form.age || "22"}
                        {form.isVerified && (
                          <span className="verified-badge-icon">✓</span>
                        )}
                      </h3>
                      <p className="preview-person-city">
                        📍 {form.city || "Your City"}
                      </p>
                    </div>
                  </div>

                  {/* Preview Bio & Prompts Body */}
                  <div className="preview-card-body">
                    {form.bio ? (
                      <div className="preview-bio-quote">
                        &ldquo;{form.bio}&rdquo;
                      </div>
                    ) : (
                      <p className="preview-empty-hint">Your bio will appear here.</p>
                    )}

                    {/* Lifestyle Badges */}
                    {(form.lifestyle.zodiac || form.lifestyle.workout || form.lifestyle.pets) && (
                      <div className="preview-lifestyle-chips">
                        {form.lifestyle.zodiac && (
                          <span className="preview-chip">{form.lifestyle.zodiac}</span>
                        )}
                        {form.lifestyle.workout && (
                          <span className="preview-chip">🏃 {form.lifestyle.workout}</span>
                        )}
                        {form.lifestyle.pets && (
                          <span className="preview-chip">{form.lifestyle.pets}</span>
                        )}
                      </div>
                    )}

                    {/* Prompts Preview */}
                    {form.prompts.length > 0 && (
                      <div className="preview-prompts-stack">
                        {form.prompts.map((p, idx) => (
                          <div key={idx} className="preview-prompt-item">
                            <span className="prompt-q-badge">{p.question}</span>
                            <p className="prompt-a-text">{p.answer || "Your witty answer..."}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Passions Preview */}
                    {form.interests.length > 0 && (
                      <div className="preview-passions-section">
                        <span className="preview-passions-label">PASSIONS</span>
                        <div className="preview-passions-tags">
                          {form.interests.map((tag) => (
                            <span key={tag} className="preview-tag-pill">
                              ★ {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <MobileNav />

      {/* Camera Capture Modal */}
      {cameraOpen && (
        <div className="camera-overlay">
          <div className="camera-dialog">
            <div className="camera-header">
              <h2>Take a Selfie Snapshot</h2>
              <button
                type="button"
                className="camera-close"
                onClick={() => setCameraOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="camera-viewfinder">
              {cameraLoading && (
                <div className="camera-loading">
                  <span className="pulsing-heart-loader">♥</span>
                  <p>Starting camera...</p>
                </div>
              )}
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="camera-video-feed"
              />
            </div>

            <div className="camera-actions">
              <button
                type="button"
                className="capture-btn"
                onClick={capturePhoto}
              >
                📸 Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
