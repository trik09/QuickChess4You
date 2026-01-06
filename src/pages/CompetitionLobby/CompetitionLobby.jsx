import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { competitionAPI } from "../../services/api";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import socketService from "../../services/socketService";
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
import { useRef } from "react";
import toast from "react-hot-toast";

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

  // New simplified state
  const [competitionState, setCompetitionState] = useState("");
  const [participantState, setParticipantState] = useState("NOT_JOINED");
  // serverTime state removed to prevent re-renders
  const [isJoinProcessing, setIsJoinProcessing] = useState(false);
  const timeOffsetRef = useRef(0);

  // Access Code Modal State
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  // Handle Competition Events from Socket
  useEffect(() => {
    // We can use socketService directly to listen for events
    // This allows us to navigate even if state hasn't propagated yet

    // Define handlers
    const onCompetitionStarted = () => {
      // Update state
      setCompetitionState("LIVE");
      // Refresh lobby state to get updated data
      liveCompetitionAPI.getLobbyState(id).then(res => {
        if (res.success) {
          setCompetitionState(res.competitionState);
          setParticipants(res.leaderboard);
        }
      });

      // Auto-navigate to puzzle page ONLY if user is JOINED
      if (participantState === "JOINED" || participantState === "PLAYING") {
        toast.success("Competition Started! Redirecting...");
        setTimeout(() => {
          navigate(`/competition/${id}/puzzle`);
        }, 1500);
      }
    };

    const onCompetitionEnded = (data) => {
      setCompetitionState("ENDED");
      // Update leaderboard with final results
      if (data && data.leaderboard) {
        setParticipants(data.leaderboard);
      }
      // DON'T navigate - lobby will convert to leaderboard view
      toast.success("Competition Ended! Calculating final rankings...");
    };

    const onLeaderboardUpdate = (leaderboard) => {
      setParticipants(leaderboard);
    };

    const onLiveScoreUpdate = (data) => {
      // Real-time score update for individual player
      setParticipants(prev => {
        const updated = prev.map(p =>
          p.userId === data.userId
            ? { ...p, score: data.score, puzzlesSolved: data.puzzlesSolved, timeSpent: data.timeSpent, status: data.status }
            : p
        );
        // Re-sort by puzzles solved, then time
        return updated.sort((a, b) => {
          if (b.puzzlesSolved !== a.puzzlesSolved) return b.puzzlesSolved - a.puzzlesSolved;
          return a.timeSpent - b.timeSpent;
        });
      });
    };

    const onParticipantSubmitted = (data) => {
      // Refresh leaderboard when someone submits
      liveCompetitionAPI.getLobbyState(id).then(res => {
        if (res.success) {
          setParticipants(res.leaderboard);
          // Update participant state if it's the current user
          if (participantState === "PLAYING") {
            setParticipantState("SUBMITTED");
          }
        }
      });
    };

    // Attach listeners
    socketService.on("competitionStarted", onCompetitionStarted);
    socketService.on("competitionEnded", onCompetitionEnded);
    socketService.on("leaderboardUpdate", onLeaderboardUpdate);
    socketService.on("liveScoreUpdate", onLiveScoreUpdate);
    socketService.on("participantSubmitted", onParticipantSubmitted);

    // Cleanup
    return () => {
      socketService.off("competitionStarted", onCompetitionStarted);
      socketService.off("competitionEnded", onCompetitionEnded);
      socketService.off("leaderboardUpdate", onLeaderboardUpdate);
      socketService.off("liveScoreUpdate", onLiveScoreUpdate);
      socketService.off("participantSubmitted", onParticipantSubmitted);
    };
  }, [id, navigate, participantState]);

  // Sync Participants with Live Leaderboard if available
  useEffect(() => {
    if (isConnected && liveLeaderboard && liveLeaderboard.length > 0) {
      setParticipants(liveLeaderboard);
    }
  }, [liveLeaderboard, isConnected]);

  // NO auto-redirect when competition ends - lobby converts to leaderboard view

  // Main Load Effect
  useEffect(() => {
    async function loadLobby() {
      try {
        const res = await liveCompetitionAPI.getLobbyState(id);

        if (res.success) {
          setCompetition(res.competition);
          // Always update participants from server (server is source of truth)
          setParticipants(res.leaderboard);

          setCompetitionState(res.competitionState);
          setParticipantState(res.participantState);

          if (res.serverTime) {
            timeOffsetRef.current = res.serverTime - Date.now();
          }
        } else {
          setError(res.message || "Failed to load lobby.");
        }
      } catch (err) {
        console.error(err);
        setError("Error loading competition.");
      } finally {
        setLoading(false);
      }
    }

    loadLobby();

    // Poll occasionally to sync server time/state if socket fails
    const interval = setInterval(loadLobby, 15000);
    return () => clearInterval(interval);
  }, [id]);

  // Timer Logic simplified
  useEffect(() => {
    if (competition) {
      const timer = setInterval(() => {
        calculateTimeLeft();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [competition, competitionState]);

  const calculateTimeLeft = () => {
    if (!competition) return;

    const start = new Date(competition.startTime).getTime();
    const end = new Date(competition.endTime).getTime();
    const now = Date.now() + timeOffsetRef.current;

    // Check if competition should have started
    if (competitionState === "UPCOMING" && now >= start) {
      // Refresh state to get LIVE status
      liveCompetitionAPI.getLobbyState(id).then(res => {
        // silently update
        if (res.success && res.competitionState === "LIVE") {
          setCompetitionState("LIVE");
        }
      }).catch(err => console.error(err));
    }

    // Determine target based on state
    let target = start;

    if (competitionState === "LIVE" || (competitionState === "UPCOMING" && now >= start)) {
      target = end;
    } else if (competitionState === "ENDED") {
      setTimeLeft("Competition Ended!");
      return;
    }

    const diff = target - now;

    if (diff <= 0) {
      if (competitionState === "UPCOMING") {
        setTimeLeft("Starting...");
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


  const joinCompetitionWithCode = async (code = null) => {
    if (!user) {
      navigate("/", { state: { openLogin: true } });
      return;
    }

    setIsJoinProcessing(true);
    setCodeError("");
    try {
      // Join competition with access code if provided
      const response = await liveCompetitionAPI.participate(id, user.username || user.name, code);

      if (response.success) {
        // Refresh state to update participantState
        const res = await liveCompetitionAPI.getLobbyState(id);
        if (res.success) {
          setParticipantState(res.participantState);
          setCompetitionState(res.competitionState);
          setParticipants(res.leaderboard);
        }

        setShowCodeModal(false);
        setAccessCodeInput("");

        // Join socket room for real-time updates - connect via socketService
        // The socket connection should be established when user enters the lobby
        // We'll join the competition room when socket is ready
        socketService.connect({ competition: { id } }).then(() => {
          socketService.socket?.emit('joinCompetition', { competitionId: id });
        }).catch(err => {
          console.error('Socket connection failed:', err);
        });
      }

    } catch (err) {
      const errorData = err?.response?.data || {};
      const msg = errorData.error || errorData.message || err.message || "Failed to join";

      // If already joined, just update state
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("participating")) {
        const res = await liveCompetitionAPI.getLobbyState(id);
        setParticipantState(res.success ? res.participantState : "JOINED");
        setShowCodeModal(false);
        setAccessCodeInput("");
      } else {
        if (code !== null) {
          setCodeError(msg);
        } else {
          alert(msg);
        }
      }
    } finally {
      setIsJoinProcessing(false);
    }
  };

  const handleJoin = () => {
    if (!user) {
      navigate("/", { state: { openLogin: true } });
      return;
    }

    // Check if access code is required (from competition data)
    if (competition && competition.requiresAccessCode) {
      setShowCodeModal(true);
      setAccessCodeInput("");
      setCodeError("");
      return;
    }

    joinCompetitionWithCode(null);
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    // Server will validate the code, just send it
    if (accessCodeInput.trim()) {
      await joinCompetitionWithCode(accessCodeInput.trim());
    } else {
      setCodeError("Please enter an access code");
    }
  };

  const handleEnterCompetition = () => {
    if (participantState === "SUBMITTED" || participantState === "ENDED") {
      alert("You have already submitted your score. Waiting for other players to finish...");
      return;
    }

    navigate(`/competition/${id}/puzzle`, {
      state: {
        competitionId: competition._id,
        competitionTitle: competition.title || competition.name,
        puzzles: competition.puzzles,
        time: competition.duration,
      },
    });
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatus = (participant) => {
    // Just fallback if participant.status isn't populated for some reason
    if (participant.status) return participant.status;
    if (participant.isSubmitted) return "Submitted";
    return "Waiting";
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
              className={`status-pill ${competitionState?.toLowerCase() || "upcoming"}`}
            >
              {competitionState || "UPCOMING"}
            </span>
          </div>
        </div>

        <div className="header-right">
          {competitionState === "ENDED" ? (
            <div className="ended-section">
              <FaTrophy className="trophy-large" />
              <h2 className="ended-text">Final Results</h2>
            </div>
          ) : (
            <div className="timer-section">
              {/* Show countdown timer for live/upcoming */}
              {(competitionState === "UPCOMING" || competitionState === "LIVE") && (
                <div className="countdown-display">
                  <span className="timer-label">
                    {competitionState === "LIVE" ? "Ends in:" : "Starts in:"}
                  </span>
                  <div className="timer-value">
                    <FaClock className="timer-icon" /> {timeLeft || "--:--:--"}
                  </div>
                </div>
              )}

              <div className="action-buttons">
                {participantState === "NOT_JOINED" ? (
                  <button
                    className="action-btn join-btn"
                    onClick={handleJoin}
                    disabled={isJoinProcessing}
                  >
                    {isJoinProcessing ? "Joining..." : "Join Competition"}
                  </button>
                ) : (
                  <>
                    {/* If joined, we show 'Joined' status OR 'Enter' if it's Live/Playing */}
                    {/* Logic: If competition is live, show Enter. If upcoming, show Joined. */}

                    {(competitionState === "LIVE" || competitionState === "PLAYING") ? (
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
        <h2 className="section-title">
          {competitionState === "ENDED" ? "🏆 Final Rankings" : `Participants (${participants.length})`}
        </h2>
        <div className="table-responsive">
          <table className="participants-table">
            <thead>
              <tr>
                <th className="th-rank">Rank</th>
                <th className="th-player">Player</th>
                <th className="th-status">Status</th>
                <th className="th-puzzles">Score</th>
                <th className="th-time">Time</th>
              </tr>
            </thead>
            <tbody>
              {participants.length > 0 ? (
                participants.map((p, idx) => (
                  <tr
                    key={idx}
                    className={`${p.userId === user?.id ? "row-highlight" : ""} ${competitionState === "ENDED" && idx < 3 ? "winner-row" : ""
                      }`}
                  >
                    <td className="td-rank">
                      {competitionState === "ENDED" && idx === 0 && <span className="medal gold">🥇</span>}
                      {competitionState === "ENDED" && idx === 1 && <span className="medal silver">🥈</span>}
                      {competitionState === "ENDED" && idx === 2 && <span className="medal bronze">🥉</span>}
                      {(competitionState !== "ENDED" || idx > 2) && `#${idx + 1}`}
                    </td>
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
                    <td className="td-status">{getStatus(p)}</td>
                    <td className="td-puzzles">
                      <strong>{p.puzzlesSolved || 0}</strong> / {competition?.totalPuzzles || competition?.puzzles?.length || 0}
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
        .status-pill.ENDED { color: #9ca3af; border-color: #374151; background: rgba(107, 114, 128, 0.1); }

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
        .ended-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }
        .trophy-large {
            font-size: 3rem;
            color: #ffd700;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
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
        
        .th-rank, .td-rank { width: 80px; color: #666; font-weight: bold; text-align: center; }
        .th-player, .td-player { width: 35%; }
        .th-status, .td-status { width: 15%; color: #888; }
        .th-puzzles, .td-puzzles { width: 20%; color: #888; font-weight: 600; }
        .th-time, .td-time { width: 15%; color: #888; }

        .medal {
            font-size: 1.5rem;
            display: inline-block;
            animation: bounce 1s ease-in-out;
        }
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        .winner-row {
            background: linear-gradient(90deg, rgba(255, 215, 0, 0.1), transparent);
            border-left: 3px solid #ffd700;
        }

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
        }
        .error-msg {
            color: #ef4444;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        .modal-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .modal-actions button {
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: background 0.2s;
        }
        .cancel-btn {
            background: #374151;
            color: #d1d5db;
        }
        .cancel-btn:hover {
            background: #4b5563;
        }
        .submit-btn {
            background: #3b82f6;
            color: white;
        }
        .submit-btn:hover {
            background: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default CompetitionLobby;
