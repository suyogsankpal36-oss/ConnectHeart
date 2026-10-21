import { useEffect, useState, useCallback, useRef } from "react";
import Navbar from "../components/Navbar";
import MobileNav from "../components/MobileNav";
import MatchModal from "../components/MatchModal";
import { useAuth } from "../context/useAuth";
import api from "../services/api";
import { getPhotoUrl } from "../utils/photoUrl";
import toast from "react-hot-toast";

export default function Discover() {
  const { user: currentUser, refreshUser } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({
    gender: "all",
    lookingFor: "all",
    city: "",
    verifiedOnly: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Like with comment modal state
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentLikeType, setCommentLikeType] = useState("like");

  // Drag physics state
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        gender: filters.gender || "all",
      };
      if (filters.lookingFor && filters.lookingFor !== "all") params.lookingFor = filters.lookingFor;
      if (filters.city?.trim()) params.city = filters.city.trim();
      if (filters.verifiedOnly) params.verifiedOnly = "true";

      const response = await api.get("/discover", { params });
      setProfiles(response.data.profiles || []);
      setCurrentPhotoIndex(0);
    } catch {
      toast.error("Failed to load profiles.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    if (currentUser?.discoveryPreferences?.genderPreference) {
      setFilters((prev) => {
        if (
          prev.gender === "all" &&
          currentUser.discoveryPreferences.genderPreference !== "all"
        ) {
          return {
            ...prev,
            gender: currentUser.discoveryPreferences.genderPreference,
          };
        }
        return prev;
      });
    }
  }, [currentUser?.discoveryPreferences?.genderPreference]);

  useEffect(() => {
    function handleExternalRefresh() {
      fetchProfiles();
    }
    window.addEventListener("refreshDiscoveryFeed", handleExternalRefresh);
    return () => {
      window.removeEventListener("refreshDiscoveryFeed", handleExternalRefresh);
    };
  }, [fetchProfiles]);

  const currentProfile = profiles[0] || null;

  // Reset photo index when current profile changes
  useEffect(() => {
    setCurrentPhotoIndex(0);
    setShowDetails(false);
    setDragOffset({ x: 0, y: 0 });
  }, [currentProfile?.id]);

  const handleLike = useCallback(
    async (type = "like", comment = "") => {
      if (!currentProfile || actionLoading) return;
      setActionLoading(true);

      try {
        const response = await api.post("/discover/like", {
          targetUserId: currentProfile.id,
          type,
          comment,
        });

        // Pop top card
        setProfiles((prev) => prev.slice(1));
        setShowDetails(false);
        setCommentModalOpen(false);
        setCommentText("");

        if (response.data.isMatch) {
          setMatchData({
            matchedUser: response.data.matchedUser,
            matchId: response.data.matchId,
          });
          refreshUser();
        } else {
          toast.success(
            type === "superlike"
              ? `Super Liked ${currentProfile.name}! ⭐`
              : `Liked ${currentProfile.name} ❤️`
          );
        }
      } catch {
        toast.error("Could not record like.");
      } finally {
        setActionLoading(false);
        setDragOffset({ x: 0, y: 0 });
      }
    },
    [currentProfile, actionLoading, refreshUser]
  );

  const handlePass = useCallback(async () => {
    if (!currentProfile || actionLoading) return;
    setActionLoading(true);

    try {
      await api.post("/discover/pass", {
        targetUserId: currentProfile.id,
      });

      setProfiles((prev) => prev.slice(1));
      setShowDetails(false);
    } catch {
      toast.error("Could not record pass.");
    } finally {
      setActionLoading(false);
      setDragOffset({ x: 0, y: 0 });
    }
  }, [currentProfile, actionLoading]);

  // Rewind last passed profile (Tinder / Bumble Rewind)
  const handleRewind = useCallback(async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await api.post("/discover/rewind");
      if (res.data.profile) {
        setProfiles((prev) => [res.data.profile, ...prev]);
        toast.success(`Rewound ${res.data.profile.name}! ⏪`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "No recent passes to rewind.");
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (matchData || commentModalOpen) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePass();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleLike("like");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleLike("superlike");
      } else if (e.key === "Backspace" || e.key === "z") {
        e.preventDefault();
        handleRewind();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePass, handleLike, matchData, commentModalOpen, handleRewind]);

  // Drag physics handlers
  const handleDragStart = (clientX, clientY) => {
    if (actionLoading) return;
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handleDragMove = (clientX, clientY) => {
    if (!isDragging) return;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 120;
    if (dragOffset.x > threshold) {
      handleLike("like");
    } else if (dragOffset.x < -threshold) {
      handlePass();
    } else if (dragOffset.y < -110) {
      handleLike("superlike");
    } else {
      // Snap back to center
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Photo gallery tap handlers
  const photos = currentProfile?.photos && currentProfile.photos.length > 0
    ? currentProfile.photos
    : [currentProfile?.profilePhoto].filter(Boolean);

  const currentPhotoSrc = photos[currentPhotoIndex]
    ? getPhotoUrl(photos[currentPhotoIndex])
    : "";

  const handlePhotoNav = (e, direction) => {
    e.stopPropagation();
    if (direction === "prev") {
      setCurrentPhotoIndex((prev) => Math.max(0, prev - 1));
    } else {
      setCurrentPhotoIndex((prev) => Math.min(photos.length - 1, prev + 1));
    }
  };

  async function handleResetPasses() {
    try {
      const response = await api.post("/discover/reset");
      toast.success(response.data.message || "Passed profiles reset!");
      fetchProfiles();
    } catch {
      toast.error("Failed to reset passed profiles.");
    }
  }

  async function handleSeedMore() {
    try {
      const res = await api.post("/seed");
      toast.success(res.data.message || "Demo profiles loaded!");
      fetchProfiles();
      refreshUser();
    } catch {
      toast.error("Failed to load demo profiles.");
    }
  }

  function handleFilterChange(e) {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // Calculate rotation and stamp opacities from dragOffset
  const rotationDeg = dragOffset.x * 0.07;
  const likeOpacity = Math.min(1, Math.max(0, dragOffset.x / 100));
  const passOpacity = Math.min(1, Math.max(0, -dragOffset.x / 100));
  const superlikeOpacity = Math.min(1, Math.max(0, -dragOffset.y / 90));

  return (
    <div className="discover-layout">
      <Navbar />

      <main className="discover-content">
        {/* Discover Filter Bar */}
        <section className="discover-filter-bar">
          <div className="filter-summary">
            <div>
              <h2>Find Your Chemistry</h2>
              <p className="filter-subtitle">
                Curated profiles matched by personality, lifestyle & passions.
              </p>
            </div>
            <button
              type="button"
              className="toggle-filters-btn"
              onClick={() => setShowFilters((prev) => !prev)}
            >
              {showFilters ? "✕ Close Filters" : "⚙️ Filters"}
            </button>
          </div>

          {showFilters && (
            <div className="filters-grid">
              <div className="filter-group">
                <label htmlFor="filter-gender">Gender</label>
                <select
                  id="filter-gender"
                  name="gender"
                  value={filters.gender}
                  onChange={handleFilterChange}
                >
                  <option value="all">Everyone</option>
                  <option value="female">Women</option>
                  <option value="male">Men</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="filter-lookingFor">Looking for</label>
                <select
                  id="filter-lookingFor"
                  name="lookingFor"
                  value={filters.lookingFor}
                  onChange={handleFilterChange}
                >
                  <option value="all">Any Intent</option>
                  <option value="relationship">Relationship</option>
                  <option value="friendship">Friendship</option>
                  <option value="casual">Casual Dating</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="filter-city">City</label>
                <input
                  id="filter-city"
                  name="city"
                  placeholder="e.g. Mumbai, Pune..."
                  value={filters.city}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="filter-group filter-checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="verifiedOnly"
                    checked={filters.verifiedOnly}
                    onChange={handleFilterChange}
                  />
                  <span>Verified Profiles Only ✨</span>
                </label>
              </div>

              <div className="filter-actions">
                <button
                  type="button"
                  className="reset-filters-btn"
                  onClick={() =>
                    setFilters({
                      gender: "all",
                      lookingFor: "all",
                      city: "",
                      verifiedOnly: false,
                    })
                  }
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Discovery Feed Card Deck with Swipe Physics */}
        <section className="dating-card-container">
          {loading ? (
            <div className="deck-loading-state">
              <div className="pulsing-heart-loader">♥</div>
              <p>Finding compatible hearts near you...</p>
            </div>
          ) : currentProfile ? (
            <div
              ref={cardRef}
              className={`dating-card ${isDragging ? "is-dragging" : ""}`}
              style={{
                transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotationDeg}deg)`,
                transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              }}
              onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
              onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={(e) =>
                handleDragStart(e.touches[0].clientX, e.touches[0].clientY)
              }
              onTouchMove={(e) =>
                handleDragMove(e.touches[0].clientX, e.touches[0].clientY)
              }
              onTouchEnd={handleDragEnd}
            >
              {/* Dynamic Stamp Overlays for Swipe Feedback */}
              <div
                className="swipe-stamp stamp-like"
                style={{ opacity: likeOpacity }}
              >
                LIKE
              </div>
              <div
                className="swipe-stamp stamp-pass"
                style={{ opacity: passOpacity }}
              >
                PASS
              </div>
              <div
                className="swipe-stamp stamp-superlike"
                style={{ opacity: superlikeOpacity }}
              >
                SUPER LIKE
              </div>

              <div className="card-media-wrapper">
                {/* Multi-Photo Progress Segments */}
                {photos.length > 1 && (
                  <div className="photo-segments-bar">
                    {photos.map((_, idx) => (
                      <div
                        key={idx}
                        className={`photo-segment-pill ${
                          idx === currentPhotoIndex ? "active" : ""
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Left/Right Tap Zones for Photo Navigation */}
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="photo-tap-zone zone-left"
                      onClick={(e) => handlePhotoNav(e, "prev")}
                      aria-label="Previous photo"
                    />
                    <button
                      type="button"
                      className="photo-tap-zone zone-right"
                      onClick={(e) => handlePhotoNav(e, "next")}
                      aria-label="Next photo"
                    />
                  </>
                )}

                {currentPhotoSrc ? (
                  <img
                    src={currentPhotoSrc}
                    alt={currentProfile.name}
                    className="card-photo"
                    draggable="false"
                  />
                ) : (
                  <div className="card-photo-placeholder">
                    <span className="placeholder-heart">♥</span>
                    <span className="placeholder-text">
                      {currentProfile.name[0]}
                    </span>
                  </div>
                )}

                <div className="card-gradient-overlay" />

                {/* Floating Badges */}
                <div className="card-badges-floating">
                  {currentProfile.compatibilityScore && (
                    <span className="badge-compatibility">
                      ✨ {currentProfile.compatibilityScore}% Match
                    </span>
                  )}

                  {currentProfile.mutualInterests &&
                    currentProfile.mutualInterests.length > 0 && (
                      <span className="badge-mutual">
                        ★ {currentProfile.mutualInterests.length} Mutual
                      </span>
                    )}

                  <span className="badge-intent">
                    {currentProfile.lookingFor === "relationship"
                      ? "💍 Long-term"
                      : currentProfile.lookingFor === "friendship"
                      ? "🤝 Friends"
                      : "☕ Casual"}
                  </span>
                </div>

                {/* Identity Header */}
                <div className="card-identity-header">
                  <div className="identity-left">
                    <h1 className="person-name">
                      {currentProfile.name},{" "}
                      <span className="person-age">{currentProfile.age}</span>
                      {currentProfile.isVerified && (
                        <span className="verified-badge-icon" title="Verified Profile">
                          ✓
                        </span>
                      )}
                    </h1>
                    {currentProfile.city && (
                      <p className="person-location">
                        📍 {currentProfile.city}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="info-toggle-btn"
                    onClick={() => setShowDetails((d) => !d)}
                    aria-label="Toggle details"
                  >
                    {showDetails ? "▲ Hide" : "▼ Prompts & Bio"}
                  </button>
                </div>
              </div>

              {/* Bio, Lifestyle Badges & Prompts Drawer */}
              <div
                className={`card-details-section ${
                  showDetails ? "expanded" : ""
                }`}
              >
                {/* Bio text */}
                {currentProfile.bio && (
                  <div className="bio-container">
                    <p className="bio-text">
                      &ldquo;{currentProfile.bio}&rdquo;
                    </p>
                  </div>
                )}

                {/* Lifestyle Badges (Bumble-style) */}
                {currentProfile.lifestyle && (
                  <div className="lifestyle-badges-row">
                    {currentProfile.lifestyle.zodiac && (
                      <span className="lifestyle-chip">
                        {currentProfile.lifestyle.zodiac}
                      </span>
                    )}
                    {currentProfile.lifestyle.workout && (
                      <span className="lifestyle-chip">
                        🏃 {currentProfile.lifestyle.workout}
                      </span>
                    )}
                    {currentProfile.lifestyle.pets && (
                      <span className="lifestyle-chip">
                        {currentProfile.lifestyle.pets}
                      </span>
                    )}
                    {currentProfile.lifestyle.drinking && (
                      <span className="lifestyle-chip">
                        🍷 {currentProfile.lifestyle.drinking}
                      </span>
                    )}
                    {currentProfile.lifestyle.height && (
                      <span className="lifestyle-chip">
                        📏 {currentProfile.lifestyle.height}
                      </span>
                    )}
                    {currentProfile.lifestyle.education && (
                      <span className="lifestyle-chip">
                        🎓 {currentProfile.lifestyle.education}
                      </span>
                    )}
                  </div>
                )}

                {/* Hinge-style Prompts & Answers */}
                {currentProfile.prompts && currentProfile.prompts.length > 0 && (
                  <div className="prompts-list">
                    {currentProfile.prompts.map((p, idx) => (
                      <div key={idx} className="hinge-prompt-card">
                        <span className="prompt-question">{p.question}</span>
                        <p className="prompt-answer">{p.answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Passions & Interests */}
                <div className="interests-showcase">
                  <span className="section-label">Passions & Interests</span>
                  <div className="card-interest-chips">
                    {currentProfile.interests?.map((interest) => {
                      const isMutual =
                        currentProfile.mutualInterests?.includes(interest);
                      return (
                        <span
                          key={interest}
                          className={`interest-tag ${
                            isMutual ? "mutual-tag" : ""
                          }`}
                        >
                          {isMutual ? "★ " : ""}
                          {interest}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Swipe Action Buttons Row */}
              <div className="card-actions-row">
                {/* Rewind Button */}
                <button
                  type="button"
                  className="action-circle rewind-circle"
                  onClick={handleRewind}
                  disabled={actionLoading}
                  title="Rewind Last Pass (Z / Backspace)"
                  aria-label="Rewind"
                >
                  <span className="action-emoji">↺</span>
                  <span className="action-caption">Rewind</span>
                </button>

                {/* Pass Button */}
                <button
                  type="button"
                  className="action-circle pass-circle"
                  onClick={handlePass}
                  disabled={actionLoading}
                  title="Pass (Left Arrow)"
                  aria-label="Pass"
                >
                  <span className="action-emoji">✕</span>
                  <span className="action-caption">Pass</span>
                </button>

                {/* Like with Opening Note Button */}
                <button
                  type="button"
                  className="action-circle comment-circle"
                  onClick={() => {
                    setCommentLikeType("like");
                    setCommentModalOpen(true);
                  }}
                  disabled={actionLoading}
                  title="Send with Opening Note"
                  aria-label="Add Note"
                >
                  <span className="action-emoji">💬</span>
                  <span className="action-caption">Note</span>
                </button>

                {/* Super Like Button */}
                <button
                  type="button"
                  className="action-circle superlike-circle"
                  onClick={() => handleLike("superlike")}
                  disabled={actionLoading}
                  title="Super Like (Up Arrow)"
                  aria-label="Super Like"
                >
                  <span className="action-emoji">⭐</span>
                  <span className="action-caption">Super Like</span>
                </button>

                {/* Like Button */}
                <button
                  type="button"
                  className="action-circle like-circle"
                  onClick={() => handleLike("like")}
                  disabled={actionLoading}
                  title="Like (Right Arrow)"
                  aria-label="Like"
                >
                  <span className="action-emoji">💖</span>
                  <span className="action-caption">Like</span>
                </button>
              </div>

              <div className="keyboard-hints">
                <span>← Pass</span>
                <span>•</span>
                <span>↑ Super Like</span>
                <span>•</span>
                <span>→ Like</span>
                <span>•</span>
                <span>↺ Rewind</span>
              </div>
            </div>
          ) : (
            <div className="empty-deck-state">
              <div className="empty-radar-icon">💫</div>
              <h2>You&apos;re All Caught Up!</h2>
              <p className="muted">
                There are no more new profiles matching your current filters.
                Try resetting your passed profiles or loading sample profiles to
                keep discovering!
              </p>

              <div className="empty-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleResetPasses}
                >
                  🔄 Reset Deck & Explore Again
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleSeedMore}
                >
                  🪄 Load More Profiles
                </button>

                {(filters.gender !== "all" || filters.lookingFor !== "all" || Boolean(filters.city?.trim()) || filters.verifiedOnly) && (
                  <button
                    type="button"
                    className="clear-filters-link"
                    onClick={() =>
                      setFilters({
                        gender: "all",
                        lookingFor: "all",
                        city: "",
                        verifiedOnly: false,
                      })
                    }
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-primary)",
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontSize: "13px",
                      marginTop: "4px",
                    }}
                  >
                    Clear active filters
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Like with Opening Note Modal (Hinge feature) */}
      {commentModalOpen && currentProfile && (
        <div className="modal-backdrop" onClick={() => setCommentModalOpen(false)}>
          <div
            className="comment-note-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="note-modal-header">
              <h3>Send an Opening Note to {currentProfile.name} ✨</h3>
              <p className="muted">
                Profiles with an opening message are 3x more likely to match!
              </p>
            </div>

            <textarea
              className="note-input"
              rows="3"
              placeholder={`Say something friendly or mention one of their passions (${currentProfile.interests?.slice(0, 2).join(", ")})...`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={280}
              autoFocus
            />

            <div className="note-modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setCommentModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => handleLike(commentLikeType, commentText)}
                disabled={actionLoading}
              >
                Send Like & Message ❤️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Match Celebration Dialog */}
      {matchData && (
        <MatchModal
          currentUser={currentUser}
          matchedUser={matchData.matchedUser}
          matchId={matchData.matchId}
          onClose={() => setMatchData(null)}
        />
      )}
    </div>
  );
}
