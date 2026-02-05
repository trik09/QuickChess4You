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
  FaBolt,
  FaChartLine,
  FaHistory,
  FaArrowUp,
  FaMedal,
  FaCrown,
  FaFire
} from "react-icons/fa";
import { useRef } from "react";
import toast from "react-hot-toast";
import styles from "./CompetitionLobby.module.css";

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
  const hasAutoRedirectedRef = useRef(false); // Track if we've already auto-redirected

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

          // Auto-navigate to puzzle page ONLY if user is JOINED and we haven't auto-redirected yet
          if (!hasAutoRedirectedRef.current && (res.participantState === "JOINED" || res.participantState === "PLAYING")) {
            hasAutoRedirectedRef.current = true; // Mark that we've redirected
            toast.success("Competition Started! Redirecting...");
            setTimeout(() => {
              navigate(`/competition/${id}/puzzle`);
            }, 1500);
          }
        }
      });
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

          // Auto-redirect if user is joined and we haven't already redirected
          if (!hasAutoRedirectedRef.current && (res.participantState === "JOINED" || res.participantState === "PLAYING")) {
            hasAutoRedirectedRef.current = true; // Mark that we've redirected
            toast.success("Competition Started! Redirecting...");
            setTimeout(() => {
              navigate(`/competition/${id}/puzzle`);
            }, 1500);
          }
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

  // Helper function to calculate accuracy
  const calculateAccuracy = (puzzlesSolved, totalPuzzles) => {
    if (!totalPuzzles || totalPuzzles === 0) return 0;
    return Math.round((puzzlesSolved / totalPuzzles) * 100);
  };

  if (loading) return <div className={styles.loadingContainer}>Loading...</div>;
  if (error) return <div className={styles.errorContainer}>{error}</div>;

  // ENHANCED LEADERBOARD VIEW FOR ENDED COMPETITIONS
  if (competitionState === "ENDED") {
    const top3 = participants.slice(0, 3);
    const totalPuzzles = competition?.totalPuzzles || competition?.puzzles?.length || 20;

    // Stats for static display
    const averageAccuracy = participants.length > 0
      ? Math.round(participants.reduce((acc, curr) => acc + (calculateAccuracy(curr.puzzlesSolved, totalPuzzles)), 0) / participants.length)
      : 0;

    return (
      <div className={styles.leaderboardPage}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>{competition?.title || competition?.name}</h1>
            <div className={styles.competitionMeta}>
              <span className={styles.metaItem}>
                <FaClock /> {competition?.duration} MIN
              </span>
              <span className={styles.metaItem}>
                <FaUserCircle /> {participants.length} PLAYERS
              </span>
              <span className={styles.statusEnded}>
                ✅ COMPLETED
              </span>
            </div>
          </div>
        </div>

        {/* Main Content: Podium + Leaderboard */}
        <div className={styles.mainContent}>
          {/* Left Side: Podium Display */}
          <div className={styles.podiumSection}>
            <h2 className={styles.sectionTitle}>
              <FaTrophy /> TOP CHAMPIONS
            </h2>

            <div className={styles.podium}>
              {/* 2nd Place */}
              <div className={`${styles.podiumPlace} ${styles.second}`}>
                <div className={styles.podiumAvatarContainer}>
                  <div className={styles.avatarCircle}>
                    {top3[1] ? top3[1].username?.[0]?.toUpperCase() : '?'}
                  </div>
                  {top3[1] && <div className={`${styles.medalIcon} ${styles.medal2}`}><FaMedal /></div>}
                </div>
                <div className={styles.podiumName}>{top3[1]?.username || 'Empty'}</div>
                <div className={styles.podiumScore}>{top3[1]?.score || 0} PTS</div>
                <div className={styles.podiumBar}>
                  {top3[1] && (
                    <div className={styles.barDetails}>
                      <span>{calculateAccuracy(top3[1].puzzlesSolved, totalPuzzles)}% ACC</span>
                      <span>{formatTime(top3[1].timeSpent)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 1st Place */}
              <div className={`${styles.podiumPlace} ${styles.first}`}>
                <div className={styles.podiumAvatarContainer}>
                  <FaCrown className={styles.crownIcon} />
                  <div className={styles.avatarCircle}>
                    {top3[0] ? top3[0].username?.[0]?.toUpperCase() : '?'}
                  </div>
                  {top3[0] && <div className={`${styles.medalIcon} ${styles.medal1}`}><FaMedal /></div>}
                </div>
                <div className={styles.podiumName}>{top3[0]?.username || 'Winner'}</div>
                <div className={styles.podiumScore}>{top3[0]?.score || 0} PTS</div>
                <div className={styles.podiumBar}>
                  {top3[0] && (
                    <div className={styles.barDetails}>
                      <span>{calculateAccuracy(top3[0].puzzlesSolved, totalPuzzles)}% ACC</span>
                      <span>{formatTime(top3[0].timeSpent)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3rd Place */}
              <div className={`${styles.podiumPlace} ${styles.third}`}>
                <div className={styles.podiumAvatarContainer}>
                  <div className={styles.avatarCircle}>
                    {top3[2] ? top3[2].username?.[0]?.toUpperCase() : '?'}
                  </div>
                  {top3[2] && <div className={`${styles.medalIcon} ${styles.medal3}`}><FaMedal /></div>}
                </div>
                <div className={styles.podiumName}>{top3[2]?.username || 'Empty'}</div>
                <div className={styles.podiumScore}>{top3[2]?.score || 0} PTS</div>
                <div className={styles.podiumBar}>
                  {top3[2] && (
                    <div className={styles.barDetails}>
                      <span>{calculateAccuracy(top3[2].puzzlesSolved, totalPuzzles)}% ACC</span>
                      <span>{formatTime(top3[2].timeSpent)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Highlights (Info Cards) */}
            <div className={styles.infoCards}>
              <div className={styles.infoCard}>
                <div className={styles.cardIcon}>
                  <FaBolt />
                </div>
                <div className={styles.cardContent}>
                  <h4>Fastest Solver</h4>
                  <p>
                    {participants.sort((a, b) => (a.timeSpent || 999999) - (b.timeSpent || 999999))[0]?.username || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Extra Static Stats Section */}
            <div className={styles.staticStatsGrid}>
              <div className={styles.staticStatCard}>
                <span className={styles.staticStatLabel}>Avg Accuracy</span>
                <span className={styles.staticStatValue}>{averageAccuracy}%</span>
                <span className={styles.staticStatTrend}><FaArrowUp /> +2.4% vs Avg</span>
              </div>
            </div>
          </div>

          {/* Right Side: Full Leaderboard Table */}
          <div className={styles.tableContainer}>
            <div className={styles.tableContainerHeader}>
              <div className={styles.tableTitle}>
                <FaChartLine /> FULL RANKINGS
              </div>
              <div className={styles.tableSubTitle}>
                Showing 1-{participants.length} of {participants.length}
              </div>
            </div>

            <div className={styles.tableHeader}>
              <span>Rank</span>
              <span>Player</span>
              <span>Score</span>
              <span>Acc</span>
              <span className={styles.alignRight}>Time</span>
              <span className={styles.alignRight}>Progress</span>
            </div>

            <div className={styles.tableBody}>
              {participants.map((p, idx) => (
                <div
                  key={idx}
                  className={`${styles.tableRow} ${p.userId === user?.id ? styles.currentUser : ''}`}
                >
                  <div className={styles.rankCol}>
                    {idx === 0 && <FaTrophy className={styles.medal1} />}
                    {idx === 1 && <FaMedal className={styles.medal2} />}
                    {idx === 2 && <FaMedal className={styles.medal3} />}
                    {idx > 2 && `#${idx + 1}`}
                  </div>

                  <div className={styles.playerCol}>
                    <div className={styles.playerAvatarSmall}>
                      {p.username?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ lineHeight: 1 }}>{p.username || p.name}</span>
                      {p.userId === user?.id && <span className={styles.youTag}>YOU</span>}
                    </div>
                  </div>

                  <div className={styles.scoreCol}>
                    {p.score || 0}
                  </div>

                  <div className={styles.accuracyVal}>
                    {calculateAccuracy(p.puzzlesSolved, totalPuzzles)}%
                  </div>

                  <div className={`${styles.timeCol} ${styles.alignRight}`}>
                    {formatTime(p.timeSpent)}
                  </div>

                  <div className={styles.alignRight} style={{ paddingLeft: '1rem' }}>
                    {/* Accuracy Bar as Progress */}
                    <div className={styles.accuracyWrapper}>
                      <div className={styles.accuracyBg}>
                        <div
                          className={styles.accuracyFill}
                          style={{ width: `${calculateAccuracy(p.puzzlesSolved, totalPuzzles)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ORIGINAL LOBBY VIEW FOR UPCOMING/LIVE COMPETITIONS
  return (
    <div className={styles.competitionLobby}>
      {/* Modal for Access Code */}
      {showCodeModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Enter Access Code</h3>
            <p>This competition is password protected.</p>
            <form onSubmit={handleCodeSubmit}>
              <input
                type="text"
                placeholder="Enter Code"
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value)}
                className={styles.codeInput}
                autoFocus
              />
              {codeError && <p className={styles.errorMsg}>{codeError}</p>}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className={`${styles.lobbyCard} ${styles.headerCard}`}>
        <div className={styles.headerLeft}>
          <h1 className={styles.compTitle}>
            {competition?.title || competition?.name}
            <span className={styles.compDate}>
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
          <div className={styles.statusBadgeContainer}>
            <span
              className={`${styles.statusPill} ${styles[competitionState?.toLowerCase() || "upcoming"]}`}
            >
              {competitionState || "UPCOMING"}
            </span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.timerSection}>
            {/* Show countdown timer for live/upcoming */}
            {(competitionState === "UPCOMING" || competitionState === "LIVE") && (
              <div className={styles.countdownDisplay}>
                <span className={styles.timerLabel}>
                  {competitionState === "LIVE" ? "Ends in:" : "Starts in:"}
                </span>
                <div className={styles.timerValue}>
                  <FaClock className={styles.timerIcon} /> {timeLeft || "--:--:--"}
                </div>
              </div>
            )}

            <div className={styles.actionButtons}>
              {participantState === "NOT_JOINED" ? (
                <button
                  className={`${styles.actionBtn} ${styles.joinBtn}`}
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
                      className={`${styles.actionBtn} ${styles.enterBtn}`}
                      onClick={handleEnterCompetition}
                    >
                      Enter Competition
                    </button>
                  ) : (
                    <span className={styles.joinedText}>
                      <FaCheckCircle /> Joined
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Participants Card */}
      <div className={`${styles.lobbyCard} ${styles.participantsCard}`}>
        <h2 className={styles.sectionTitle}>
          Participants ({participants.length})
        </h2>
        <div className={styles.tableResponsive}>
          <table className={styles.participantsTable}>
            <thead>
              <tr>
                <th className={styles.thRank}>Rank</th>
                <th className={styles.thPlayer}>Player</th>
                <th className={styles.thStatus}>Status</th>
                <th className={styles.thPuzzles}>Score</th>
                <th className={styles.thTime}>Time</th>
              </tr>
            </thead>
            <tbody>
              {participants.length > 0 ? (
                participants.map((p, idx) => (
                  <tr
                    key={idx}
                    className={`${p.userId === user?.id ? styles.rowHighlight : ""}`}
                  >
                    <td className={styles.tdRank}>#{idx + 1}</td>
                    <td className={styles.tdPlayer}>
                      <div className={styles.playerInfo}>
                        {p.userId === user?.id ? (
                          <span className={`${styles.playerAvatar} ${styles.self}`}>You</span>
                        ) : (
                          <span className={styles.playerAvatar}>
                            <FaUserCircle />
                          </span>
                        )}
                        <span className={styles.playerName}>
                          {p.username || p.name || "User"}
                        </span>
                      </div>
                    </td>
                    <td className={styles.tdStatus}>{getStatus(p)}</td>
                    <td className={styles.tdPuzzles}>
                      <strong>{p.puzzlesSolved || 0}</strong> / {competition?.totalPuzzles || competition?.puzzles?.length || 0}
                    </td>
                    <td className={styles.tdTime}>
                      {p.timeSpent ? formatTime(p.timeSpent) : "--"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className={styles.emptyRow}>
                    No participants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
};

export default CompetitionLobby;
