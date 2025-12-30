import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { competitionAPI } from "../../services/api";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import { useAuth } from "../../contexts/AuthContext";
import { useLiveCompetition } from "../../contexts/LiveCompetitionContext"; // Import Context
import {
  FaClock,
  FaTrophy,
  FaUserCircle,
  FaCheckCircle,
  FaHourglassStart,
  FaPlayCircle,
} from "react-icons/fa";

// We will inline the styles for now or create a CSS file.
// Since Leaderboard.css is imported, we can reuse classes.
// But let's create a CompetitionLobby.css if needed.
// For now, I'll assume we can reuse standard styles or define a new css file.

const CompetitionLobby = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use Context for Real-time updates
  const {
    leaderboard: liveLeaderboard,
    competitionEnded,
    isConnected,
    participateInCompetition // Ensure we can connect if not already
  } = useLiveCompetition();

  const [competition, setCompetition] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  // Access Code Modal State
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  // Handle Competition Ended Event from Socket
  useEffect(() => {
    if (competitionEnded) {
      navigate(`/leaderboard/${id}`);
    }
  }, [competitionEnded, id, navigate]);

  // Sync Participants with Live Leaderboard
  useEffect(() => {
    if (isConnected && liveLeaderboard && liveLeaderboard.length > 0) {
      setParticipants(liveLeaderboard);
    }
  }, [liveLeaderboard, isConnected]);

  useEffect(() => {
    fetchCompetitionData();
    const interval = setInterval(fetchCompetitionData, 10000); // Keep polling as backup/for status
    return () => clearInterval(interval);
  }, [id, user]);

  useEffect(() => {
    if (competition && competition.startTime) {
      const timer = setInterval(() => {
        calculateTimeLeft();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [competition, hasJoined]);

  const calculateTimeLeft = () => {
    if (!competition) return;

    const now = new Date();
    const start = new Date(competition.startTime);
    // If status is technically "Live" but we are just showing "Ends in", we calculate diff to endTime
    // But user specifically asked for "Start in" logic for lobby waiting.

    // Let's determine if we are waiting for start or waiting for end
    const isUpcoming = competition.status?.toLowerCase() === 'upcoming';
    const isLive = competition.status?.toLowerCase() === 'live';

    let targetDate = start;
    let label = "Starts in:";

    if (isLive) {
      targetDate = new Date(competition.endTime);
      label = "Ends in:";
    }

    const diff = targetDate - now;

    if (diff <= 0) {
      if (isUpcoming) {
        // Transition from Upcoming to Live
        setTimeLeft("Starting...");
        // Trigger refresh or auto-join
        fetchCompetitionData();
        // If user is joined, we can auto-navigate
        if (hasJoined) {
          navigate(`/competition/${id}/puzzle`, {
            state: {
              competitionId: competition._id,
              competitionTitle: competition.title || competition.name,
              puzzles: competition.puzzles,
              time: competition.duration,
            },
          });
        }
      } else {
        setTimeLeft("Competition Ended!");
      }
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    setTimeLeft(`${days > 0 ? days + 'd ' : ''}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  const fetchCompetitionData = async () => {
    try {
      // Fetch competition details
      const compRes = await competitionAPI.getById(id);
      if (compRes.success) {
        setCompetition(compRes.data);

        // Check active status for connecting socket if needed
        // If we are already connected via PuzzlePage, good. If not, we might want to "participate" implicitly to listen
        // But participate usually requires action. Lobby is for waiting. 
        // We can just rely on polling if user hasn't joined, or if joined, we can try to connect.

        const parts = compRes.data.participants || [];

        // For Participants:
        // Use liveLeaderboard if available, otherwise fetch from API
        if (!isConnected || liveLeaderboard.length === 0) {
          // Standard fetch logic
          try {
            const lbRes = await liveCompetitionAPI.getLeaderboard(id);
            if (lbRes.success) {
              setParticipants(lbRes.leaderboard);
            } else {
              // Fallback
              const normalizedParticipants = parts.map((p) => {
                if (typeof p === "object") return { ...p, userId: p._id };
                return { userId: p, username: "Unknown User" };
              });
              setParticipants(normalizedParticipants);
            }
          } catch (e) {
            const normalizedParticipants = parts.map((p) => {
              if (typeof p === "object") return { ...p, userId: p._id };
              return { userId: p, username: "Unknown User" };
            });
            setParticipants(normalizedParticipants);
          }
        }

        // Check if current user is in participants
        if (user) {
          let isJoined = false;

          // Check in static list (might be stale or just IDs)
          if (parts && parts.length > 0) {
            isJoined = parts.some(p =>
              (p._id === user.id) ||
              (p === user.id) ||
              (p.userId && (p.userId === user.id || p.userId._id === user.id))
            );
          }

          // Check in Live Leaderboard (if fetched)
          if (!isJoined && liveLeaderboard && liveLeaderboard.length > 0) {
            isJoined = liveLeaderboard.some(p =>
              (p.userId === user.id) ||
              (p.userId && p.userId._id === user.id) ||
              (p.username === user.username)
            );
          }

          // Check in API fetched participants (if different from static parts)
          // logic currently sets setParticipants(fetchedLeaderboard)
          // so we can check against state 'participants' but that state is set async?
          // No, we are inside valid scope.

          setHasJoined(isJoined);
        }
      } else {
        setError("Failed to load competition details.");
      }
    } catch (err) {
      console.error(err);
      setError("Error loading competition.");
    } finally {
      setLoading(false);
    }
  };

  const joinCompetitionWithCode = async (code = null) => {
    setJoinLoading(true);
    try {
      // Use Context if possible to ensure socket connection immediately
      if (user) {
        await participateInCompetition(id, user.username || user.name);
        setHasJoined(true);
        setShowCodeModal(false);
        fetchCompetitionData(); // Refresh state

        // Navigate
        const isLive = competition && (competition.status?.toLowerCase() === 'live' || new Date() >= new Date(competition.startTime));

        if (code || isLive) {
          navigate(`/competition/${id}/puzzle`, {
            state: {
              competitionId: competition._id
            }
          });
        }
      } else {
        // Fallback if no user? (Should not happen due to ProtectedRoute)
        await competitionAPI.joinCompetition(id, code);
      }

    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Failed to join";
      // If already joined/participating, we should treat it as success and redirect if live
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("participating")) {
        setHasJoined(true);
        setShowCodeModal(false);
        fetchCompetitionData();

        const isLive = competition && (competition.status?.toLowerCase() === 'live' || new Date() >= new Date(competition.startTime));

        if (code || isLive) {
          navigate(`/competition/${id}/puzzle`, {
            state: {
              competitionId: competition._id
            }
          });
        }
      } else {
        if (code) {
          setCodeError(msg);
        } else {
          // Check if it's just a "competition started" sync issue
          alert(msg);
        }
      }
    } finally {
      setJoinLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      navigate("/", { state: { openLogin: true } });
      return;
    }

    // Since we are in lobby, we want to see live updates.
    // If user has already submitted, they stay here.
    if (isUserSubmitted()) {
      // Just toast
      // alert("You have submitted! Watch the leaderboard.");
      return;
    }

    if (competition && competition.accessCode) {
      setShowCodeModal(true);
      setAccessCodeInput("");
      setCodeError("");
      return;
    }

    joinCompetitionWithCode(null);
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (competition && accessCodeInput === competition.accessCode) {
      joinCompetitionWithCode(accessCodeInput);
    } else if (
      competition &&
      competition.accessCode &&
      accessCodeInput !== competition.accessCode
    ) {
      setCodeError("Incorrect access code.");
    } else {
      joinCompetitionWithCode(accessCodeInput);
    }
  };

  const isUserSubmitted = () => {
    if (!user || !participants) return false;
    const currentParticipant = participants.find(
      (p) =>
        p.userId === user._id ||
        (p.userId && p.userId._id === user._id) ||
        p.userId === user.id ||
        p.username === user.username
    );
    return (
      currentParticipant &&
      (currentParticipant.submitted ||
        currentParticipant.isSubmitted ||
        currentParticipant.status === "Submitted")
    );
  };

  const handleEnterCompetition = () => {
    if (isUserSubmitted()) {
      // Do NOT navigate to leaderboard. Just show message.
      // Or maybe just show a toast?
      // Users might be confused if nothing happens.
      alert("You have already submitted your score. Waiting for other players to finish...");
      return;
    }

    // Navigate to puzzle page
    navigate(`/competition/${id}/puzzle`, {
      state: {
        competitionId: competition._id,
        competitionTitle: competition.title || competition.name,
        puzzles: competition.puzzles,
        time: competition.duration,
      },
    });
  };

  const getStatus = (participant) => {
    if (participant.isSubmitted) return "Submitted";
    if (
      (participant.score > 0 || participant.puzzlesSolved > 0) &&
      !participant.isSubmitted
    )
      return "Playing";
    return "Waiting";
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Submitted":
        return (
          <span className="status-badge submitted">
            <FaCheckCircle /> Submitted
          </span>
        );
      case "Playing":
        return (
          <span className="status-badge playing">
            <FaPlayCircle /> Playing
          </span>
        );
      default:
        return (
          <span className="status-badge waiting">
            <FaHourglassStart /> Waiting
          </span>
        );
    }
  };

  if (loading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="competition-lobby">
      {/* Modal for Access Code */}
      {showCodeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Enter Access Code</h3>
            <p>This competition is password protected.</p>
            <form onSubmit={handleCodeSubmit}>
              <input
                type="text"
                placeholder="Enter Code"
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value)}
                className="code-input"
                autoFocus
              />
              {codeError && <p className="error-msg">{codeError}</p>}
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="lobby-card header-card">
        <div className="header-left">
          <h1 className="comp-title">
            {competition?.title || competition?.name}
            <span className="comp-date">
              {competition?.startTime &&
                ` – ${new Date(competition.startTime).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}`}
            </span>
          </h1>
          <div className="status-badge-container">
            <span
              className={`status-pill ${competition?.status?.toLowerCase() || "upcoming"
                }`}
            >
              {competition?.status || "UPCOMING"}
            </span>
          </div>
        </div>

        <div className="header-right">
          {competition?.status?.toLowerCase() === "completed" ? (
            <h2 className="ended-text">ENDED</h2>
          ) : (
            <div className="timer-section">
              {/* Show countdown timer for live/upcoming */}
              {(competition?.status?.toLowerCase() === "upcoming" ||
                competition?.status?.toLowerCase() === "live") && (
                  <div className="countdown-display">
                    <span className="timer-label">
                      {competition?.status?.toLowerCase() === "live" ? "Ends in:" : "Starts in:"}
                    </span>
                    <div className="timer-value">
                      <FaClock className="timer-icon" /> {timeLeft || "--:--:--"}
                    </div>
                  </div>
                )}

              <div className="action-buttons">
                {!hasJoined ? (
                  <button
                    className="action-btn join-btn"
                    onClick={handleJoin}
                    disabled={joinLoading}
                  >
                    {joinLoading ? "Joining..." : "Join Competition"}
                  </button>
                ) : (
                  <>
                    {(competition?.status?.toLowerCase() === "live" || timeLeft === "Starting..." || timeLeft === "Competition Started!" || new Date() >= new Date(competition?.startTime)) ? (
                      <button
                        className="action-btn enter-btn"
                        onClick={handleEnterCompetition}
                      >
                        Enter Competition
                      </button>
                    ) : (
                      <span className="joined-text">
                        <FaCheckCircle /> Joined
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Participants Card */}
      <div className="lobby-card participants-card">
        <h2 className="section-title">Participants ({participants.length})</h2>
        <div className="table-responsive">
          <table className="participants-table">
            <thead>
              <tr>
                <th className="th-rank">Rank</th>
                <th className="th-player">Player</th>
                <th className="th-status">Status</th>
                <th className="th-score">Score</th>
                <th className="th-time">Time Used</th>
              </tr>
            </thead>
            <tbody>
              {participants.length > 0 ? (
                participants.map((p, idx) => (
                  <tr
                    key={idx}
                    className={p.userId === user?.id ? "row-highlight" : ""}
                  >
                    <td className="td-rank">#{idx + 1}</td>
                    <td className="td-player">
                      <div className="player-info">
                        {p.userId === user?.id ? (
                          <span className="player-avatar self">You</span>
                        ) : (
                          <span className="player-avatar">
                            <FaUserCircle />
                          </span>
                        )}
                        <span className="player-name">
                          {p.username || p.name || "User"}
                        </span>
                      </div>
                    </td>
                    <td className="td-status">{p.status || getStatus(p)}</td>
                    <td className="td-score">
                      {p.score !== undefined ? p.score : "--"}
                    </td>
                    <td className="td-time">
                      {p.timeSpent ? formatTime(p.timeSpent) : "--"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-row">
                    No participants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .competition-lobby {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          color: #e0e0e0;
          font-family: 'Inter', sans-serif;
        }
        
        /* General Card Style */
        .lobby-card {
           background-color: #1e1e1e; /* Dark Card Background */
           border-radius: 8px;
           padding: 1.5rem 2rem;
           margin-bottom: 2rem;
           box-shadow: 0 4px 6px rgba(0,0,0,0.3);
           border: 1px solid #333;
        }

        /* HEADER CARD */
        .header-card {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 20px;
        }
        .header-left {
            flex: 1;
        }
        .comp-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #fff;
            margin: 0 0 1rem 0;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
        }
        .comp-date {
            font-weight: 400;
            color: #a0a0a0;
        }
        .status-badge-container {
            margin-top: 5px;
        }
        .status-pill {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #444;
            color: #bbb;
            background: #2a2a2a;
        }
        .status-pill.upcoming { color: #facc15; border-color: #634d04; background: rgba(250, 204, 21, 0.1); }
        .status-pill.live { color: #ef4444; border-color: #7f1d1d; background: rgba(239, 68, 68, 0.1); }
        .status-pill.completed { color: #9ca3af; border-color: #374151; background: rgba(107, 114, 128, 0.1); }

        .header-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
        }
        .ended-text {
            font-size: 1.8rem;
            font-weight: 800;
            color: #fff;
            letter-spacing: 1px;
            margin: 0;
        }
        .timer-section {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        .countdown-display {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            margin-bottom: 12px;
        }
        .timer-label {
            font-size: 0.85rem;
            color: #9ca3af;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 4px;
        }
        .timer-value {
            font-size: 1.8rem;
            font-weight: 800;
            color: #ffd700;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'Roboto Mono', monospace; /* Monospace for steady numbers */
        }
        .timer-value .timer-icon {
            font-size: 1.4rem;
            color: #eab308;
        }
        .action-buttons {
            display: flex;
            gap: 10px;
        }
        .action-btn {
            padding: 10px 24px;
            border-radius: 4px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
        }
        .join-btn {
            background-color: #3b82f6; 
            color: white;
        }
        .join-btn:hover { background-color: #2563eb; }
        .enter-btn {
            background-color: #10b981;
            color: white;
        }
        .enter-btn:hover { background-color: #059669; }
        .joined-text {
            color: #10b981;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 5px;
        }

        /* PARTICIPANTS CARD */
        .section-title {
            font-size: 1.1rem;
            font-weight: 500;
            color: #fff;
            margin: 0 0 1.5rem 0;
        }
        .table-responsive {
            overflow-x: auto;
        }
        .participants-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.95rem;
        }
        .participants-table th {
            text-align: left;
            padding: 10px;
            color: #888;
            font-weight: 500;
            border-bottom: 1px solid #333;
        }
        .participants-table td {
            padding: 14px 10px;
            color: #ccc;
            border-bottom: 1px solid #2a2a2a;
        }
        
        .th-rank, .td-rank { width: 60px; color: #666; font-weight: bold; }
        .th-player, .td-player { width: 40%; }
        .th-status, .td-status { width: 20%; color: #888; }
        .th-score, .td-score { width: 15%; color: #888; }
        .th-time, .td-time { width: 15%; color: #888; }

        .player-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .player-avatar {
            font-size: 1.2rem;
            color: #666;
            display: flex;
        }
        .player-avatar.self {
             background: #3b82f6;
             color: white;
             font-size: 0.7rem;
             padding: 2px 6px;
             border-radius: 4px;
             font-weight: bold;
             text-transform: uppercase;
        }
        .player-name {
            font-weight: 500;
            color: #eee;
        }
        
        .row-highlight {
            background-color: rgba(59, 130, 246, 0.08);
        }
        .empty-row {
            text-align: center;
            padding: 2rem;
            color: #555;
            font-style: italic;
        }
        
        /* MODAL STYLES */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal-content {
            background: #1f2937;
            padding: 2rem;
            border-radius: 12px;
            width: 100%;
            max-width: 400px;
            text-align: center;
            border: 1px solid #374151;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .modal-content h3 {
            margin-top: 0;
            color: #fff;
            margin-bottom: 0.5rem;
        }
        .modal-content p {
            color: #9ca3af;
            margin-bottom: 1.5rem;
        }
        .code-input {
            width: 100%;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #4b5563;
            background: #374151;
            color: #fff;
            margin-bottom: 1rem;
            font-size: 1rem;
            outline: none;
        }
        .code-input:focus {
            border-color: #3b82f6;
            ring: 2px solid rgba(59, 130, 246, 0.5);
        }
        .error-msg {
            color: #ef4444 !important;
            font-size: 0.9rem;
            margin-bottom: 1rem !important;
            text-align: left;
        }
        .modal-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .cancel-btn {
            background: transparent;
            border: 1px solid #4b5563;
            color: #9ca3af;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
        }
        .cancel-btn:hover {
            background: #374151;
            color: #fff;
        }
        .submit-btn {
            background: #3b82f6;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
        }
        .submit-btn:hover {
            background: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default CompetitionLobby;
