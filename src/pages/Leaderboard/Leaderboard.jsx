import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaTrophy,
  FaMedal,
  FaClock,
  FaSync,
  FaCrown,
  FaBolt,
  FaChartLine,
  FaUserCircle,
  FaArrowUp,
  FaFire,
  FaArrowLeft,
  FaChessKnight,
  FaBullseye,
  FaStopwatch
} from "react-icons/fa";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import { competitionAPI } from "../../services/api";
import socketService from "../../services/socketService";
import styles from "./Leaderboard.module.css";

function Leaderboard() {
  const { competitionId } = useParams();
  const navigate = useNavigate();

  const [leaderboard, setLeaderboard] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (competitionId) {
      loadCompetitionData();
      loadLeaderboard();
    }

    // Cleanup on unmount
    return () => {
      socketService.off('leaderboardUpdate', handleLeaderboardUpdate);
      socketService.off('participantJoined', handleParticipantJoined);
    };
  }, [competitionId]);

  // Polling fallback for live competitions (every 10 seconds)
  useEffect(() => {
    if (!isLive || !competitionId) return;

    const pollInterval = setInterval(() => {
      loadLeaderboard(false); // silent refresh
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [isLive, competitionId]);

  // Socket event handlers (stable references for cleanup)
  const handleLeaderboardUpdate = (newLeaderboard) => {
    console.log('[Leaderboard] Socket: leaderboardUpdate received', newLeaderboard?.length);
    setLeaderboard(newLeaderboard);
  };

  const handleParticipantJoined = (data) => {
    console.log('[Leaderboard] Socket: participantJoined', data);
    // Refresh leaderboard when someone joins
    loadLeaderboard(false);
  };

  const loadCompetitionData = async () => {
    try {
      const response = await competitionAPI.getById(competitionId);
      if (response.success) {
        setCompetition(response.data);
        const competitionIsLive = response.data.status === 'live' || response.data.status === 'LIVE';
        setIsLive(competitionIsLive);
        if (competitionIsLive) {
          setupLiveUpdates();
        }
      }
    } catch (error) {
      console.error('Failed to load competition:', error);
    }
  };

  const loadLeaderboard = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await liveCompetitionAPI.getLeaderboard(competitionId);
      if (response.success && response.leaderboard) {
        setLeaderboard(response.leaderboard);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const setupLiveUpdates = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      // Properly await the socket connection
      await socketService.connect({ competition: { id: competitionId } });
      console.log('[Leaderboard] Socket connected, setting up listeners');

      // Listen for real-time leaderboard updates
      socketService.on('leaderboardUpdate', handleLeaderboardUpdate);
      socketService.on('participantJoined', handleParticipantJoined);
    } catch (error) {
      console.error('[Leaderboard] Socket connection failed, using polling only:', error);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "-";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getCurrentUser = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  };

  const isCurrentUser = (userId) => {
    return userId === getCurrentUser();
  };

  const calculateAccuracy = (puzzlesSolved, totalPuzzles) => {
    if (!totalPuzzles || totalPuzzles === 0) return 0;
    return Math.round((puzzlesSolved / totalPuzzles) * 100);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  const totalPuzzles = competition?.totalPuzzles || competition?.puzzles?.length || 20;
  const top3 = [...leaderboard];
  while (top3.length < 3) top3.push(null);

  const averageAccuracy = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((acc, curr) => acc + (calculateAccuracy(curr.puzzlesSolved, totalPuzzles)), 0) / leaderboard.length)
    : 0;

  const fastestSolver = [...leaderboard].sort((a, b) => (a.timeSpent || 999999) - (b.timeSpent || 999999))[0];

  return (
    <div className={styles.leaderboardPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </button>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>{competition?.name || 'Competition Results'}</h1>
            <div className={styles.competitionMeta}>
              <span className={styles.metaItem}>
                <FaClock /> {competition?.duration || 15} MIN
              </span>
              <span className={styles.metaItem}>
                <FaUserCircle /> {leaderboard.length} PLAYERS
              </span>
              <span className={isLive ? styles.statusLive : styles.statusEnded}>
                {isLive ? '🔴 LIVE' : '✅ COMPLETED'}
              </span>
            </div>
          </div>
        </div>
        {isLive && (
          <button onClick={loadLeaderboard} className={styles.refreshBtn}>
            <FaSync /> REFRESH
          </button>
        )}
      </div>

      {leaderboard.length === 0 ? (
        <div className={styles.emptyState}>
          <FaTrophy className={styles.emptyIcon} />
          <h3>No Participants Yet</h3>
          <p>Be the first to join and compete!</p>
        </div>
      ) : (
        <div className={styles.mainContent}>
          {/* LEFT: Podium + Stats */}
          <div className={styles.leftPanel}>
            {/* Podium */}
            <div className={styles.podiumSection}>
              <h2 className={styles.sectionTitle}>
                <FaTrophy className={styles.sectionIcon} /> TOP CHAMPIONS
              </h2>

              <div className={styles.podium}>
                {/* 2nd Place */}
                <div className={`${styles.podiumPlace} ${styles.second}`}>
                  <div className={styles.podiumAvatar}>
                    <div className={styles.avatarCircle}>
                      {top3[1] ? top3[1].username?.[0]?.toUpperCase() : '?'}
                    </div>
                    <div className={`${styles.rankBadge} ${styles.badge2}`}>2</div>
                  </div>
                  <div className={styles.podiumName}>{top3[1]?.username || '—'}</div>
                  <div className={styles.podiumScore}>{top3[1]?.score || 0} PTS</div>
                  <div className={`${styles.podiumBar} ${styles.bar2}`}>
                    {top3[1] && (
                      <div className={styles.barStats}>
                        <span>{calculateAccuracy(top3[1].puzzlesSolved, totalPuzzles)}%</span>
                        <span>{formatTime(top3[1].timeSpent)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1st Place */}
                <div className={`${styles.podiumPlace} ${styles.first}`}>
                  <FaCrown className={styles.crownIcon} />
                  <div className={styles.podiumAvatar}>
                    <div className={styles.avatarCircle}>
                      {top3[0] ? top3[0].username?.[0]?.toUpperCase() : '?'}
                    </div>
                    <div className={`${styles.rankBadge} ${styles.badge1}`}>1</div>
                  </div>
                  <div className={styles.podiumName}>{top3[0]?.username || '—'}</div>
                  <div className={styles.podiumScore}>{top3[0]?.score || 0} PTS</div>
                  <div className={`${styles.podiumBar} ${styles.bar1}`}>
                    {top3[0] && (
                      <div className={styles.barStats}>
                        <span>{calculateAccuracy(top3[0].puzzlesSolved, totalPuzzles)}%</span>
                        <span>{formatTime(top3[0].timeSpent)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3rd Place */}
                <div className={`${styles.podiumPlace} ${styles.third}`}>
                  <div className={styles.podiumAvatar}>
                    <div className={styles.avatarCircle}>
                      {top3[2] ? top3[2].username?.[0]?.toUpperCase() : '?'}
                    </div>
                    <div className={`${styles.rankBadge} ${styles.badge3}`}>3</div>
                  </div>
                  <div className={styles.podiumName}>{top3[2]?.username || '—'}</div>
                  <div className={styles.podiumScore}>{top3[2]?.score || 0} PTS</div>
                  <div className={`${styles.podiumBar} ${styles.bar3}`}>
                    {top3[2] && (
                      <div className={styles.barStats}>
                        <span>{calculateAccuracy(top3[2].puzzlesSolved, totalPuzzles)}%</span>
                        <span>{formatTime(top3[2].timeSpent)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fastest Solver Banner */}
              {fastestSolver && (
                <div className={styles.fastestBanner}>
                  <FaBolt /> FASTEST SOLVER: {fastestSolver.username}
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.iconAccuracy}`}>
                  <FaBullseye />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Avg Accuracy</span>
                  <span className={styles.statValue}>{averageAccuracy}%</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.iconFastest}`}>
                  <FaBolt />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Fastest Solver</span>
                  <span className={styles.statValue}>{fastestSolver?.username || '—'}</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.iconStreak}`}>
                  <FaFire />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Top Score</span>
                  <span className={styles.statValue}>{top3[0]?.score || 0} pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Full Rankings */}
          <div className={styles.rankingsPanel}>
            <div className={styles.rankingsPanelHeader}>
              <div className={styles.rankingsTitle}>
                <FaChartLine /> Full Ranking
              </div>
              <div className={styles.rankingsCount}>
                {leaderboard.length} player{leaderboard.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className={styles.rankingsList}>
              {leaderboard.map((user, idx) => (
                <div
                  key={user.userId}
                  className={`${styles.rankRow} ${isCurrentUser(user.userId) ? styles.currentUser : ''}`}
                >
                  <div className={styles.rankNum}>
                    {idx === 0 && <FaTrophy className={styles.gold} />}
                    {idx === 1 && <FaMedal className={styles.silver} />}
                    {idx === 2 && <FaMedal className={styles.bronze} />}
                    {idx > 2 && <span className={styles.rankNumber}>#{idx + 1}</span>}
                  </div>

                  <div className={styles.rankAvatar}>
                    {user.username?.[0]?.toUpperCase()}
                  </div>

                  <div className={styles.rankInfo}>
                    <span className={styles.rankName}>
                      {user.username}
                      {isCurrentUser(user.userId) && <span className={styles.youTag}>YOU</span>}
                    </span>
                    <span className={styles.rankMeta}>
                      {calculateAccuracy(user.puzzlesSolved, totalPuzzles)}% acc · {formatTime(user.timeSpent)}
                    </span>
                  </div>

                  <div className={styles.rankScore}>
                    <span className={styles.scoreNumber}>{user.score}</span>
                    <span className={styles.scoreLabel}>pts</span>
                  </div>

                  <div className={styles.rankProgress}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${calculateAccuracy(user.puzzlesSolved, totalPuzzles)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;