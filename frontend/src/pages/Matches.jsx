import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import MobileNav from "../components/MobileNav";
import SafetyModal from "../components/SafetyModal";
import VideoDateModal from "../components/VideoDateModal";
import { useAuth } from "../context/useAuth";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { getPhotoUrl } from "../utils/photoUrl";
import toast from "react-hot-toast";

const ICEBREAKERS = [
  "Hey! Loved your profile 😊",
  "What's your favorite travel destination? ✈️",
  "Coffee date or rooftop drinks? ☕",
  "What's your current on-repeat song? 🎵",
  "Two truths and a lie: go! 🤔",
];

const REACTION_EMOJIS = ["❤️", "😂", "🔥", "😮", "👏"];

function playChatSound(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "send") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "receive") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(659, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch {
    // Ignore audio permission/context errors
  }
}

export default function Matches() {
  const { user: currentUser, refreshUser } = useAuth();
  const routeParams = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedMatchId = routeParams.matchId || searchParams.get("matchId") || "";
  const activeMatch = matches.find((m) => m.matchId === selectedMatchId) || null;

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [activeCallType, setActiveCallType] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState(null);
  const [playingVoiceMsgId, setPlayingVoiceMsgId] = useState(null);
  const [heartBurstMessageId, setHeartBurstMessageId] = useState(null);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const recordIntervalRef = useRef(null);

  // Fetch matches list
  const fetchMatches = useCallback(async () => {
    try {
      const res = await api.get("/matches");
      const list = res.data.matches || [];
      setMatches(list);
      return list;
    } catch {
      toast.error("Could not load matches.");
      return [];
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches().then((list) => {
      if (!selectedMatchId && list.length > 0 && window.innerWidth > 768) {
        // Auto-select first match on desktop
        setSearchParams({ matchId: list[0].matchId });
      }
    });
  }, [fetchMatches, selectedMatchId, setSearchParams]);

  // Fetch messages for active match
  const fetchMessages = useCallback(
    async (isPolling = false) => {
      if (!selectedMatchId) return;
      if (!isPolling) setLoadingMessages(true);

      try {
        const res = await api.get(`/messages/${selectedMatchId}`);
        setMessages(res.data.messages || []);
      } catch {
        if (!isPolling) toast.error("Could not load conversation.");
      } finally {
        if (!isPolling) setLoadingMessages(false);
      }
    },
    [selectedMatchId]
  );

  // Join match chat room and register Socket.IO listeners
  useEffect(() => {
    if (!selectedMatchId) return;

    fetchMessages(false);

    const socket = getSocket();
    if (socket) {
      socket.emit("join_chat", { matchId: selectedMatchId });
      socket.emit("mark_read", { matchId: selectedMatchId });

      const handleNewMessage = (msg) => {
        if (msg.matchId === selectedMatchId) {
          setMessages((prev) => {
            if (prev.some((m) => (m.id || m._id) === (msg.id || msg._id))) return prev;
            return [...prev, msg];
          });
          socket.emit("mark_read", { matchId: selectedMatchId });
          if (msg.sender?.toString() !== currentUser?.id?.toString()) {
            playChatSound("receive");
          }
        }
        fetchMatches();
      };

      const handlePartnerTyping = ({ matchId }) => {
        if (matchId === selectedMatchId) {
          setIsPartnerTyping(true);
        }
      };

      const handlePartnerStopTyping = ({ matchId }) => {
        if (matchId === selectedMatchId) {
          setIsPartnerTyping(false);
        }
      };

      const handleMessagesRead = ({ matchId }) => {
        if (matchId === selectedMatchId) {
          setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
        }
      };

      const handleReactionUpdated = ({ matchId, messageId, reactions }) => {
        if (matchId === selectedMatchId) {
          setMessages((prev) =>
            prev.map((m) =>
              (m.id || m._id) === messageId ? { ...m, reactions } : m
            )
          );
        }
      };

      const handleIncomingCall = ({ matchId, callType: cType }) => {
        if (matchId === selectedMatchId) {
          toast(`📞 Incoming ${cType || "video"} date call!`, {
            icon: "💖",
            duration: 6000,
          });
          setActiveCallType(cType || "video");
        }
      };

      const handleOnlineList = (list) => {
        setOnlineUserIds(new Set(list || []));
      };

      const handleUserOnline = ({ userId }) => {
        setOnlineUserIds((prev) => new Set([...prev, userId]));
      };

      const handleUserOffline = ({ userId }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      };

      socket.on("new_message", handleNewMessage);
      socket.on("user_typing", handlePartnerTyping);
      socket.on("user_stop_typing", handlePartnerStopTyping);
      socket.on("messages_read", handleMessagesRead);
      socket.on("message_reaction_updated", handleReactionUpdated);
      socket.on("incoming_call", handleIncomingCall);
      socket.on("online_users_list", handleOnlineList);
      socket.on("user_online", handleUserOnline);
      socket.on("user_offline", handleUserOffline);
      socket.emit("get_online_users");

      return () => {
        socket.emit("leave_chat", { matchId: selectedMatchId });
        socket.off("new_message", handleNewMessage);
        socket.off("user_typing", handlePartnerTyping);
        socket.off("user_stop_typing", handlePartnerStopTyping);
        socket.off("messages_read", handleMessagesRead);
        socket.off("message_reaction_updated", handleReactionUpdated);
        socket.off("incoming_call", handleIncomingCall);
        socket.off("online_users_list", handleOnlineList);
        socket.off("user_online", handleUserOnline);
        socket.off("user_offline", handleUserOffline);
      };
    } else {
      // Polling fallback
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(true);
      }, 3000);

      return () => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      };
    }
  }, [selectedMatchId, fetchMessages, fetchMatches, currentUser?.id]);

  // Auto-scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPartnerTyping]);

  // Close reaction popover on outside click
  useEffect(() => {
    if (!activeReactionMessageId) return;
    function handleOutsideClick(e) {
      if (!e.target.closest(".message-action-trigger")) {
        setActiveReactionMessageId(null);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [activeReactionMessageId]);

  function handleTypingInput(e) {
    setMessageText(e.target.value);

    const socket = getSocket();
    if (socket && selectedMatchId) {
      socket.emit("typing", { matchId: selectedMatchId });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { matchId: selectedMatchId });
      }, 1500);
    }
  }

  async function handleSendMessage(e) {
    e?.preventDefault();
    const textToSend = messageText.trim();
    if (!textToSend || !selectedMatchId || sending) return;

    setSending(true);
    setMessageText("");

    const socket = getSocket();
    if (socket && selectedMatchId) {
      socket.emit("stop_typing", { matchId: selectedMatchId });
    }

    try {
      const res = await api.post(`/messages/${selectedMatchId}`, {
        text: textToSend,
      });

      if (res.data.message) {
        setMessages((prev) => {
          if (prev.some((m) => (m.id || m._id) === (res.data.message.id || res.data.message._id)))
            return prev;
          return [...prev, res.data.message];
        });
        playChatSound("send");
        fetchMatches();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message.");
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  }

  // Handle Emoji Reaction on Message
  async function handleReaction(messageId, emoji) {
    try {
      const res = await api.post(`/messages/${messageId}/react`, { emoji });
      const updatedReactions = res.data.reactions;

      setMessages((prev) =>
        prev.map((m) =>
          (m.id || m._id) === messageId ? { ...m, reactions: updatedReactions } : m
        )
      );
      setActiveReactionMessageId(null);

      // Broadcast reaction via Socket.IO
      const socket = getSocket();
      if (socket && selectedMatchId) {
        socket.emit("message_reaction", {
          matchId: selectedMatchId,
          messageId,
          reactions: updatedReactions,
        });
      }
    } catch {
      toast.error("Could not save reaction.");
    }
  }

  function handleSelectMatch(match) {
    setSearchParams({ matchId: match.matchId });
  }

  async function handleUnmatch() {
    if (!selectedMatchId) return;
    if (
      !window.confirm(
        "Are you sure you want to unmatch? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/matches/${selectedMatchId}`);
      toast.success("Unmatched successfully.");
      refreshUser();
      setSearchParams({});
      fetchMatches();
    } catch {
      toast.error("Could not unmatch.");
    }
  }

  function handleUserBlocked() {
    setSearchParams({});
    fetchMatches();
    refreshUser();
  }

  function sendQuickIcebreaker(prompt) {
    setMessageText(prompt);
  }

  function isMatchOnline(u) {
    if (!u) return false;
    if (u.email && u.email.includes("@connecthearts.demo")) return true;
    const uId = u.id || u._id;
    return onlineUserIds.has(uId?.toString());
  }

  function handleStartVoiceRecording() {
    setRecordingVoice(true);
    setRecordingSeconds(1);
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    recordIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => (prev >= 60 ? 60 : prev + 1));
    }, 1000);
    toast("Recording voice note...", { icon: "🎙️" });
  }

  function handleCancelVoiceRecording() {
    setRecordingVoice(false);
    setRecordingSeconds(0);
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
  }

  async function handleFinishVoiceRecording() {
    const duration = recordingSeconds || 4;
    handleCancelVoiceRecording();
    const formattedDuration = `0:${duration < 10 ? "0" + duration : duration}`;
    const textToSend = `🎙️ Voice Note (${formattedDuration}) ▶ ılıılıılı`;

    if (!selectedMatchId || sending) return;
    setSending(true);

    try {
      const res = await api.post(`/messages/${selectedMatchId}`, {
        text: textToSend,
      });

      if (res.data.message) {
        setMessages((prev) => {
          if (prev.some((m) => (m.id || m._id) === (res.data.message.id || res.data.message._id)))
            return prev;
          return [...prev, res.data.message];
        });
        playChatSound("send");
        fetchMatches();
        toast.success("Voice note sent! 🎶");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send voice note.");
    } finally {
      setSending(false);
    }
  }

  function playVoiceAudioSnippet(msgId) {
    if (playingVoiceMsgId === msgId) {
      setPlayingVoiceMsgId(null);
      return;
    }

    setPlayingVoiceMsgId(msgId);

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const melody = [
          { f: 392.0, d: 0.35 },
          { f: 493.88, d: 0.35 },
          { f: 587.33, d: 0.45 },
          { f: 783.99, d: 0.75 },
        ];

        let currTime = ctx.currentTime;
        melody.forEach((note) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(note.f, currTime);
          gain.gain.setValueAtTime(0.09, currTime);
          gain.gain.exponentialRampToValueAtTime(0.001, currTime + note.d);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(currTime);
          osc.stop(currTime + note.d);
          currTime += note.d * 0.85;
        });
      }
    } catch {
      // Audio context permission
    }

    setTimeout(() => {
      setPlayingVoiceMsgId((current) => (current === msgId ? null : current));
    }, 2800);
  }

  function handleDoubleTapHeart(msgId) {
    setHeartBurstMessageId(msgId);
    setTimeout(() => {
      setHeartBurstMessageId((cur) => (cur === msgId ? null : cur));
    }, 850);
    handleReaction(msgId, "❤️");
    playChatSound("send");
  }

  const filteredMatches = matches.filter((m) =>
    m.matchedUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate matches into New Matches (unmessaged) and Ongoing Conversations
  const newMatchesList = filteredMatches.filter((m) => !m.lastMessage);
  const conversationList = filteredMatches.filter((m) => m.lastMessage);

  const matchedUser = activeMatch?.matchedUser;
  const activePhotoSrc = matchedUser?.profilePhoto
    ? getPhotoUrl(matchedUser.profilePhoto)
    : "";

  return (
    <div className="matches-layout">
      <Navbar />

      <main className="matches-main">
        {/* Left Column: Matches and Chat List */}
        <aside
          className={`matches-sidebar ${
            selectedMatchId ? "mobile-hidden-on-chat" : ""
          }`}
        >
          <div className="sidebar-header">
            <h2>Your Matches</h2>
            <span className="matches-count-pill">{matches.length}</span>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search matches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loadingMatches ? (
            <div className="loading-matches-state">
              <span className="pulsing-heart-loader">♥</span>
              <p>Loading your connections...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="empty-matches-sidebar">
              <span className="empty-heart-icon">💔</span>
              <h3>No Matches Yet</h3>
              <p className="muted">
                Swipe right on more profiles to spark a chemistry connection!
              </p>
            </div>
          ) : (
            <div className="sidebar-scrollable-content">
              {/* Top Horizontal Carousel: New Matches (Tinder/Bumble Style) */}
              {newMatchesList.length > 0 && (
                <div className="new-matches-carousel-wrapper">
                  <span className="carousel-section-title">
                    New Matches ({newMatchesList.length})
                  </span>
                  <div className="new-matches-row">
                    {newMatchesList.map((match) => {
                      const u = match.matchedUser;
                      if (!u) return null;
                      const pUrl = u.profilePhoto ? getPhotoUrl(u.profilePhoto) : "";
                      const isSelected = match.matchId === selectedMatchId;

                      return (
                        <button
                          key={match.matchId}
                          type="button"
                          className={`new-match-avatar-card ${
                            isSelected ? "selected-match" : ""
                          }`}
                          onClick={() => handleSelectMatch(match)}
                          title={`Chat with ${u.name}`}
                        >
                          <div className="avatar-ring-pulse">
                            {pUrl ? (
                              <img src={pUrl} alt={u.name} />
                            ) : (
                              <span>{u.name[0]}</span>
                            )}
                            {isMatchOnline(u) && (
                              <span className="avatar-online-dot" title="Active now" />
                            )}
                          </div>
                          <span className="new-match-name">
                            {u.name.split(" ")[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ongoing Conversations List */}
              <div className="conversations-section">
                <span className="carousel-section-title">
                  Conversations (
                  {conversationList.length > 0
                    ? conversationList.length
                    : newMatchesList.length > 0
                    ? "Start one above!"
                    : 0}
                  )
                </span>

                <div className="matches-list">
                  {(conversationList.length > 0
                    ? conversationList
                    : newMatchesList
                  ).map((match) => {
                    const u = match.matchedUser;
                    if (!u) return null;
                    const pUrl = u.profilePhoto
                      ? getPhotoUrl(u.profilePhoto)
                      : "";
                    const isSelected = match.matchId === selectedMatchId;
                    const lastMsg = match.lastMessage;
                    const isUnread =
                      lastMsg &&
                      !lastMsg.read &&
                      lastMsg.sender?.toString() !==
                        currentUser?.id?.toString();

                    return (
                      <button
                        key={match.matchId}
                        type="button"
                        className={`match-item ${
                          isSelected ? "active-item" : ""
                        }`}
                        onClick={() => handleSelectMatch(match)}
                      >
                        <div className="item-avatar">
                          {pUrl ? (
                            <img src={pUrl} alt={u.name} />
                          ) : (
                            <span className="avatar-fallback">{u.name[0]}</span>
                          )}
                          {isMatchOnline(u) && (
                            <span className="avatar-online-dot" title="Active now" />
                          )}
                          {isUnread && <span className="unread-dot" />}
                        </div>

                        <div className="item-info">
                          <div className="item-top">
                            <strong className="item-name">
                              {u.name}
                              {u.isVerified && (
                                <span className="verified-badge-icon">✓</span>
                              )}
                            </strong>
                            {lastMsg && (
                              <small className="item-time">
                                {new Date(lastMsg.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </small>
                            )}
                          </div>
                          <p
                            className={`item-snippet ${
                              isUnread ? "unread-text" : ""
                            }`}
                          >
                            {lastMsg
                              ? lastMsg.text
                              : "Matched! Say something sweet 👋"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Right Column: Active Conversation Pane */}
        <section
          className={`chat-pane ${
            !selectedMatchId ? "mobile-hidden-on-list" : ""
          }`}
        >
          {selectedMatchId && activeMatch && matchedUser ? (
            <div className="active-chat-wrapper">
              {/* Chat Header */}
              <div className="chat-header">
                <button
                  type="button"
                  className="mobile-back-btn"
                  onClick={() => setSearchParams({})}
                  aria-label="Back to matches"
                >
                  ←
                </button>

                <div
                  className="header-user-info"
                  onClick={() => setShowProfileModal(true)}
                  title="View Profile"
                >
                  <div className="chat-avatar-small">
                    {activePhotoSrc ? (
                      <img src={activePhotoSrc} alt={matchedUser.name} />
                    ) : (
                      <span>{matchedUser.name[0]}</span>
                    )}
                  </div>

                  <div>
                    <h3 className="chat-user-name">
                      {matchedUser.name}, {matchedUser.age}
                      {matchedUser.isVerified && (
                        <span className="verified-badge-icon">✓</span>
                      )}
                    </h3>
                    <p className="chat-user-status">
                      {isMatchOnline(matchedUser) ? (
                        <span className="online-beacon-text">
                          <span className="online-dot-pulse" /> Active Now
                        </span>
                      ) : matchedUser.city ? (
                        `📍 ${matchedUser.city}`
                      ) : (
                        "Recently active"
                      )}
                    </p>
                  </div>
                </div>

                <div className="chat-header-actions">
                  <button
                    type="button"
                    className="call-action-btn video-call-btn"
                    onClick={() => setActiveCallType("video")}
                    title="Start Live Video Date"
                  >
                    📹 Video Date
                  </button>

                  <button
                    type="button"
                    className="call-action-btn audio-call-btn"
                    onClick={() => setActiveCallType("audio")}
                    title="Start Audio Date"
                  >
                    📞 Audio
                  </button>

                  <button
                    type="button"
                    className="view-profile-btn"
                    onClick={() => setShowProfileModal(true)}
                  >
                    👤 Profile
                  </button>

                  <button
                    type="button"
                    className="safety-action-btn"
                    onClick={() => setShowSafetyModal(true)}
                    title="Safety & Report"
                  >
                    🛡️ Safety
                  </button>

                  <button
                    type="button"
                    className="unmatch-btn"
                    onClick={handleUnmatch}
                    title="Unmatch user"
                  >
                    Unmatch
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="messages-container">
                {loadingMessages ? (
                  <div className="loading-chat-state">
                    <span className="pulsing-heart-loader">♥</span>
                    <p>Loading conversation...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="empty-chat-state">
                    <div className="chat-welcome-card">
                      <div className="welcome-avatar-duo">
                        <div className="avatar-mini">
                          {currentUser?.profilePhoto ? (
                            <img
                              src={getPhotoUrl(currentUser.profilePhoto)}
                              alt="You"
                            />
                          ) : (
                            <span>♥</span>
                          )}
                        </div>
                        <span className="heart-bridge">💖</span>
                        <div className="avatar-mini">
                          {activePhotoSrc ? (
                            <img src={activePhotoSrc} alt={matchedUser.name} />
                          ) : (
                            <span>{matchedUser.name[0]}</span>
                          )}
                        </div>
                      </div>

                      <h4>You matched with {matchedUser.name}!</h4>
                      <p className="muted">
                        Break the ice and start your journey. Don&apos;t leave
                        them waiting!
                      </p>

                      <div className="icebreakers-list">
                        {ICEBREAKERS.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            className="icebreaker-chip"
                            onClick={() => sendQuickIcebreaker(prompt)}
                          >
                            &ldquo;{prompt}&rdquo;
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map((msg) => {
                      const msgId = msg.id || msg._id;
                      const isMe =
                        msg.sender?.toString() === currentUser?.id?.toString();
                      const reactions = msg.reactions || [];

                      return (
                        <div
                          key={msgId}
                          className={`message-bubble-row ${
                            isMe ? "sent-row" : "received-row"
                          }`}
                        >
                          {/* Emoji Reaction Trigger for sent messages (left of bubble) */}
                          {isMe && (
                            <div
                              className={`message-action-trigger ${
                                activeReactionMessageId === msgId ? "active" : ""
                              }`}
                            >
                              <button
                                type="button"
                                className="reaction-toggle-btn"
                                onClick={() =>
                                  setActiveReactionMessageId((prev) =>
                                    prev === msgId ? null : msgId
                                  )
                                }
                                title="Add reaction"
                              >
                                😀
                              </button>

                              {activeReactionMessageId === msgId && (
                                <div className="reactions-popover">
                                  {REACTION_EMOJIS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      className="emoji-picker-btn"
                                      onClick={() =>
                                        handleReaction(msgId, emoji)
                                      }
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="message-wrapper-with-reactions">
                            <div
                              className={`message-bubble ${
                                isMe ? "sent" : "received"
                              }`}
                              onDoubleClick={() => handleDoubleTapHeart(msgId)}
                              title="Double-click to send love ❤️"
                            >
                              {heartBurstMessageId === msgId && (
                                <span className="floating-heart-burst">💖</span>
                              )}

                              {msg.text && msg.text.startsWith("🎙️ Voice Note") ? (
                                <div className="voice-bubble-content">
                                  <button
                                    type="button"
                                    className={`voice-play-circle ${
                                      playingVoiceMsgId === msgId ? "playing" : ""
                                    }`}
                                    onClick={() => playVoiceAudioSnippet(msgId)}
                                    title={
                                      playingVoiceMsgId === msgId
                                        ? "Pause"
                                        : "Play Voice Note"
                                    }
                                  >
                                    {playingVoiceMsgId === msgId ? "⏸" : "▶"}
                                  </button>
                                  <div className="voice-meta-block">
                                    <div
                                      className={`voice-waveform-bars ${
                                        playingVoiceMsgId === msgId
                                          ? "animating"
                                          : ""
                                      }`}
                                    >
                                      <span />
                                      <span />
                                      <span />
                                      <span />
                                      <span />
                                      <span />
                                      <span />
                                    </div>
                                    <small className="voice-status-label">
                                      {playingVoiceMsgId === msgId
                                        ? "Playing..."
                                        : msg.text.match(/\(([^)]+)\)/)?.[1] ||
                                          "0:06"}
                                    </small>
                                  </div>
                                </div>
                              ) : (
                                <p className="bubble-text">{msg.text}</p>
                              )}

                              <div className="bubble-footer">
                                <span className="bubble-time">
                                  {new Date(
                                    msg.createdAt
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {isMe && (
                                  <span className="read-receipt">
                                    {msg.read ? "✓✓" : "✓"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Message Reactions display */}
                            {reactions.length > 0 && (
                              <div className="reactions-display-row">
                                {reactions.map((r, idx) => (
                                  <span key={idx} className="reaction-badge">
                                    {r.emoji}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Emoji Reaction Trigger for received messages (right of bubble) */}
                          {!isMe && (
                            <div
                              className={`message-action-trigger ${
                                activeReactionMessageId === msgId ? "active" : ""
                              }`}
                            >
                              <button
                                type="button"
                                className="reaction-toggle-btn"
                                onClick={() =>
                                  setActiveReactionMessageId((prev) =>
                                    prev === msgId ? null : msgId
                                  )
                                }
                                title="Add reaction"
                              >
                                😀
                              </button>

                              {activeReactionMessageId === msgId && (
                                <div className="reactions-popover">
                                  {REACTION_EMOJIS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      className="emoji-picker-btn"
                                      onClick={() =>
                                        handleReaction(msgId, emoji)
                                      }
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Real-time typing indicator */}
                    {isPartnerTyping && (
                      <div className="message-bubble-row received-row">
                        <div className="message-bubble received typing-indicator-bubble">
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Composer */}
              {recordingVoice ? (
                <div className="voice-recording-interface">
                  <div className="recording-live-pill">
                    <span className="pulse-red-dot" />
                    <span>
                      Recording Voice Note... 0:
                      {recordingSeconds < 10
                        ? "0" + recordingSeconds
                        : recordingSeconds}
                    </span>
                  </div>
                  <div className="recording-btn-duo">
                    <button
                      type="button"
                      className="cancel-record-pill-btn"
                      onClick={handleCancelVoiceRecording}
                      title="Cancel Recording"
                    >
                      ✕ Cancel
                    </button>
                    <button
                      type="button"
                      className="send-record-pill-btn"
                      onClick={handleFinishVoiceRecording}
                      disabled={sending}
                      title="Send Voice Note"
                    >
                      {sending ? "Sending..." : "Send ➤"}
                    </button>
                  </div>
                </div>
              ) : (
                <form className="chat-composer" onSubmit={handleSendMessage}>
                  <button
                    type="button"
                    className="voice-mic-btn"
                    onClick={handleStartVoiceRecording}
                    title="Record Quick Romantic Voice Note"
                  >
                    🎙️
                  </button>

                  <input
                    type="text"
                    placeholder={`Message ${matchedUser.name}...`}
                    value={messageText}
                    onChange={handleTypingInput}
                    maxLength={1000}
                  />

                  <button
                    type="submit"
                    className="send-message-btn"
                    disabled={!messageText.trim() || sending}
                    aria-label="Send message"
                  >
                    {sending ? "..." : "➤"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="no-chat-selected">
              <span className="no-chat-heart">💌</span>
              <h3>No Conversation Selected</h3>
              <p className="muted">
                Choose a match from the left sidebar to start chatting.
              </p>
            </div>
          )}
        </section>
      </main>

      <MobileNav />

      {/* Profile Details Modal for Matched User */}
      {showProfileModal && matchedUser && (
        <div
          className="camera-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="camera-dialog profile-view-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="camera-header">
              <h2>{matchedUser.name}&apos;s Profile</h2>
              <button
                type="button"
                className="camera-close"
                onClick={() => setShowProfileModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-profile-photo-area">
              {activePhotoSrc ? (
                <img
                  src={activePhotoSrc}
                  alt={matchedUser.name}
                  className="modal-profile-img"
                />
              ) : (
                <div className="photo-placeholder">♥</div>
              )}
            </div>

            <div className="modal-profile-info">
              <h3>
                {matchedUser.name}, {matchedUser.age}
                {matchedUser.isVerified && (
                  <span className="verified-badge-icon">✓</span>
                )}
              </h3>
              {matchedUser.city && <p className="muted">📍 {matchedUser.city}</p>}
              <span className="badge-intent">
                {matchedUser.lookingFor === "relationship"
                  ? "💍 Serious Relationship"
                  : matchedUser.lookingFor === "friendship"
                  ? "🤝 Friendship"
                  : "☕ Casual Dating"}
              </span>

              {matchedUser.bio && (
                <div className="modal-bio">
                  <strong>About:</strong>
                  <p>&ldquo;{matchedUser.bio}&rdquo;</p>
                </div>
              )}

              {/* Lifestyle Badges in Modal */}
              {matchedUser.lifestyle && (
                <div className="modal-lifestyle-section">
                  <strong>Lifestyle:</strong>
                  <div className="lifestyle-badges-row">
                    {matchedUser.lifestyle.zodiac && (
                      <span className="lifestyle-chip">
                        {matchedUser.lifestyle.zodiac}
                      </span>
                    )}
                    {matchedUser.lifestyle.workout && (
                      <span className="lifestyle-chip">
                        🏃 {matchedUser.lifestyle.workout}
                      </span>
                    )}
                    {matchedUser.lifestyle.pets && (
                      <span className="lifestyle-chip">
                        {matchedUser.lifestyle.pets}
                      </span>
                    )}
                    {matchedUser.lifestyle.height && (
                      <span className="lifestyle-chip">
                        📏 {matchedUser.lifestyle.height}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Prompts in Modal */}
              {matchedUser.prompts && matchedUser.prompts.length > 0 && (
                <div className="modal-prompts-section">
                  <strong>Prompts:</strong>
                  {matchedUser.prompts.map((p, idx) => (
                    <div key={idx} className="hinge-prompt-card">
                      <span className="prompt-question">{p.question}</span>
                      <p className="prompt-answer">{p.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {matchedUser.interests && matchedUser.interests.length > 0 && (
                <div className="modal-interests">
                  <strong>Interests:</strong>
                  <div className="chip-group">
                    {matchedUser.interests.map((i) => (
                      <span key={i} className="chip">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Safety & Report Dialog */}
      {showSafetyModal && matchedUser && (
        <SafetyModal
          targetUser={matchedUser}
          onClose={() => setShowSafetyModal(false)}
          onBlocked={handleUserBlocked}
        />
      )}

      {/* Interactive Live Video & Audio Date Modal */}
      {activeCallType && activeMatch && matchedUser && (
        <VideoDateModal
          match={matchedUser}
          callType={activeCallType}
          onClose={() => setActiveCallType(null)}
          socket={getSocket()}
          matchId={selectedMatchId}
        />
      )}
    </div>
  );
}
