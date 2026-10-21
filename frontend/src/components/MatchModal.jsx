import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPhotoUrl } from "../utils/photoUrl";

function playMatchCelebrationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);
      gain.gain.setValueAtTime(0.09, ctx.currentTime + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.11 + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.11);
      osc.stop(ctx.currentTime + idx * 0.11 + 0.4);
    });
  } catch {
    // Audio context may require prior user interaction
  }
}

export default function MatchModal({ currentUser, matchedUser, matchId, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    playMatchCelebrationSound();
  }, []);

  if (!matchedUser) return null;

  const currentPhoto = currentUser?.profilePhoto
    ? getPhotoUrl(currentUser.profilePhoto)
    : "";
  const targetPhoto = matchedUser?.profilePhoto
    ? getPhotoUrl(matchedUser.profilePhoto)
    : "";

  function handleStartChat() {
    onClose();
    navigate(`/matches?matchId=${matchId}`);
  }

  return (
    <div className="match-overlay" role="dialog" aria-modal="true">
      {/* Floating Confetti Particles */}
      <div className="match-confetti-stage" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className={`match-confetti-piece piece-${i % 6}`}
            style={{
              left: `${(i * 4.2 + 2) % 100}%`,
              animationDelay: `${(i * 0.15) % 2.5}s`,
              animationDuration: `${2.4 + (i % 4) * 0.4}s`,
            }}
          >
            {i % 3 === 0 ? "💖" : i % 3 === 1 ? "✨" : "🌸"}
          </span>
        ))}
      </div>

      <div className="match-modal">
        <div className="match-sparkles">✨ 💖 ✨</div>

        <h2 className="match-title">It&apos;s a Match!</h2>
        <p className="match-subtitle">
          You and <strong>{matchedUser.name}</strong> both liked each other!
        </p>

        <div className="match-avatars">
          <div className="avatar-match-ring user-ring">
            {currentPhoto ? (
              <img src={currentPhoto} alt={currentUser?.name || "You"} />
            ) : (
              <span className="avatar-fallback">♥</span>
            )}
            <span className="avatar-label">You</span>
          </div>

          <div className="match-heart-pulse">
            <span className="heart-icon">💖</span>
          </div>

          <div className="avatar-match-ring target-ring">
            {targetPhoto ? (
              <img src={targetPhoto} alt={matchedUser.name} />
            ) : (
              <span className="avatar-fallback">♥</span>
            )}
            <span className="avatar-label">{matchedUser.name}</span>
          </div>
        </div>

        {matchedUser.mutualInterests && matchedUser.mutualInterests.length > 0 && (
          <div className="match-mutuals">
            <small>Shared Passions:</small>
            <div className="mutual-chips">
              {matchedUser.mutualInterests.map((interest) => (
                <span key={interest} className="mutual-chip">
                  ✨ {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="match-modal-actions">
          <button
            type="button"
            className="primary-btn match-chat-btn"
            onClick={handleStartChat}
          >
            💬 Send a Message
          </button>

          <button
            type="button"
            className="match-keep-swiping-btn"
            onClick={onClose}
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
}
