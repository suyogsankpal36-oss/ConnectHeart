import { useEffect, useRef, useState } from "react";
import { getPhotoUrl } from "../utils/photoUrl";
import toast from "react-hot-toast";

const ROMANTIC_PROMPTS = [
  "✨ If we could teleport anywhere in the world right now, where would we go?",
  "☕ What does your ideal slow Sunday look like?",
  "🎵 What song instantly puts you in an amazing mood?",
  "🍝 What's a dish you love cooking or want to learn to make together?",
  "🌟 What's something on your bucket list you're determined to do this year?",
  "😂 What's the funniest or most spontaneous decision you've ever made?",
];

export default function VideoDateModal({ match, callType = "video", onClose, socket, matchId }) {
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(callType === "audio");
  const [romanticFilter, setRomanticFilter] = useState("rose"); // "rose", "candlelight", "none"
  const [callDuration, setCallDuration] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);

  const localVideoRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize camera and mic
  useEffect(() => {
    let mounted = true;

    async function startMedia() {
      if (callType === "audio") {
        return;
      }

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera/Microphone access not available.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          await localVideoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn("Media stream init error:", err.message);
        toast("Camera preview not available in this environment, using audio date mode.", {
          icon: "🎙️",
        });
        setVideoOff(true);
      }
    }

    startMedia();

    if (socket && matchId) {
      socket.emit("start_call", { matchId, callType });
    }

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (socket && matchId) {
        socket.emit("end_call", { matchId });
      }
    };
  }, [callType, socket, matchId]);

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function toggleMic() {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setMicMuted((prev) => !prev);
  }

  function toggleVideo() {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setVideoOff((prev) => !prev);
  }

  function handleEndCall() {
    toast.success("Date ended. Spark something more in chat! ❤️");
    onClose();
  }

  function nextPrompt() {
    setPromptIndex((prev) => (prev + 1) % ROMANTIC_PROMPTS.length);
  }

  const matchPhoto = match?.profilePhoto ? getPhotoUrl(match.profilePhoto) : "";

  return (
    <div className="video-date-overlay" role="dialog" aria-modal="true">
      <div className="video-date-container">
        {/* Top Floating Bar */}
        <div className="video-call-topbar">
          <div className="call-partner-info">
            <span className="live-badge-glow">● LIVE</span>
            <span className="call-partner-name">
              {callType === "video" ? "📹 Video Date with" : "📞 Audio Date with"} {match?.name}
            </span>
            <span className="call-timer-chip">⏱️ {formatTime(callDuration)}</span>
          </div>

          <div className="topbar-actions">
            {callType === "video" && (
              <button
                type="button"
                className="filter-toggle-pill"
                onClick={() =>
                  setRomanticFilter((f) =>
                    f === "rose" ? "candlelight" : f === "candlelight" ? "none" : "rose"
                  )
                }
                title="Toggle Romantic Atmosphere Filter"
              >
                🕯️ Filter: {romanticFilter}
              </button>
            )}

            <button
              type="button"
              className="call-close-cross"
              onClick={handleEndCall}
              title="Close Date"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Stage */}
        <div className="video-call-stage">
          {/* Partner Stage (Main) */}
          <div className={`partner-stage-view filter-${romanticFilter}`}>
            {matchPhoto ? (
              <img
                src={matchPhoto}
                alt={match?.name || "Match"}
                className="partner-stage-img"
              />
            ) : (
              <div className="partner-fallback-avatar">
                <span>{match?.name?.[0] || "♥"}</span>
              </div>
            )}

            {/* Atmosphere overlay */}
            <div className="partner-stage-gradient" />

            {/* Partner Floating Tag */}
            <div className="partner-stage-tag">
              <span className="partner-tag-name">{match?.name}</span>
              <span className="partner-tag-audio-wave">
                <span className="audio-bar b1" />
                <span className="audio-bar b2" />
                <span className="audio-bar b3" />
                <span className="audio-bar b4" />
              </span>
            </div>
          </div>

          {/* Self Picture-In-Picture View */}
          {callType === "video" && (
            <div className={`self-pip-view ${videoOff ? "is-off" : ""}`}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`self-video-stream filter-${romanticFilter}`}
              />
              {videoOff && (
                <div className="camera-off-placeholder">
                  <span>📷 Video Paused</span>
                </div>
              )}
              <span className="self-pip-label">You</span>
            </div>
          )}

          {/* Romantic Icebreaker Prompt Card */}
          <div className="call-icebreaker-card" onClick={nextPrompt} title="Click for next prompt">
            <div className="prompt-sparkle-label">💬 ICEBREAKER TOPIC</div>
            <p className="prompt-sparkle-text">{ROMANTIC_PROMPTS[promptIndex]}</p>
            <span className="prompt-tap-hint">Tap card for next question ➔</span>
          </div>
        </div>

        {/* Bottom Floating Control Dock */}
        <div className="video-call-dock">
          <button
            type="button"
            className={`dock-btn ${micMuted ? "is-active-danger" : ""}`}
            onClick={toggleMic}
            title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            <span className="dock-icon">{micMuted ? "🔇" : "🎙️"}</span>
            <span className="dock-label">{micMuted ? "Unmute" : "Mute"}</span>
          </button>

          {callType === "video" && (
            <button
              type="button"
              className={`dock-btn ${videoOff ? "is-active-danger" : ""}`}
              onClick={toggleVideo}
              title={videoOff ? "Turn Camera On" : "Turn Camera Off"}
            >
              <span className="dock-icon">{videoOff ? "🚫" : "📹"}</span>
              <span className="dock-label">{videoOff ? "Camera On" : "Camera Off"}</span>
            </button>
          )}

          <button
            type="button"
            className="dock-btn dock-btn-end"
            onClick={handleEndCall}
            title="End Date"
          >
            <span className="dock-icon">📞</span>
            <span className="dock-label">End Date</span>
          </button>
        </div>
      </div>
    </div>
  );
}
