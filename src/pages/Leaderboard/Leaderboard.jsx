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
  FaHistory,
  FaChessKing,
  FaUserCircle,
  FaArrowUp,
  FaFire
} from "react-icons/fa";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import { competitionAPI } from "../../services/api";
import socketService from "../../services/socketService";
import styles from "./Leaderboard.module.css";
import toast from "react-hot-toast";

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
  }, [competitionId]);

  const loadCompetitionData = async () => {
    try {
      const response = await competitionAPI.getById(competitionId);
      if (response.success) {
        setCompetition(response.data);
        setIsLive(response.data.status === 'live');
        if (response.data.status === 'live') {
          setupLiveUpdates();
        }
      }
    } catch (error) {
      console.error('Failed to load competition:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await liveCompetitionAPI.getLeaderboard(competitionId);
      if (response.success && response.leaderboard) {
        setLeaderboard(response.leaderboard);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupLiveUpdates = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      socketService.connect({ competition: { id: competitionId } });
      socketService.on('leaderboardUpdate', (newLeaderboard) => {
        setLeaderboard(newLeaderboard);
      });
    } catch (error) {
      console.error(error);
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
  // Pad leaderboard with placeholders if fewer than 3 players for podium
  const top3 = [...leaderboard];
  while (top3.length < 3) top3.push(null);

  // Stats for static display
  const averageAccuracy = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((acc, curr) => acc + (calculateAccuracy(curr.puzzlesSolved, totalPuzzles)), 0) / leaderboard.length)
    : 0;

  const totalParticipants = leaderboard.length;

  return (
    <div className={styles.leaderboardPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>{competition?.name || 'Competition Results'}</h1>
          <div className={styles.competitionMeta}>
            <span className={styles.metaItem}>
              <FaClock /> {competition?.duration || 15} MIN
            </span>
            <span className={styles.metaItem}>
              <FaUserCircle /> {totalParticipants} PLAYERS
            </span>
            <span className={isLive ? styles.statusLive : styles.statusEnded}>
              {isLive ? '🔴 LIVE NOW' : '✅ COMPLETED'}
            </span>
          </div>
        </div>
        {isLive && (
          <div className={styles.headerAction}>
            <button onClick={loadLeaderboard} className={styles.refreshBtn}>
              <FaSync /> REFRESH
            </button>
          </div>
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
          {/* LEFT SIDE: Podium & Stats */}
          <div className={styles.leftPanel}>

            {/* Podium Section */}
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
                      {[...leaderboard].sort((a, b) => (a.timeSpent || 999999) - (b.timeSpent || 999999))[0]?.username || 'N/A'}
                    </p>
                  </div>
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
              <div className={styles.staticStatCard}>
                <span className={styles.staticStatLabel}>Top Streak</span>
                <span className={styles.staticStatValue}>🔥 8</span>
                <span className={styles.staticStatTrend}>By {top3[0]?.username || 'You'}</span>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE: Full Leaderboard Table */}
          <div className={styles.tableContainer}>
            <div className={styles.tableContainerHeader}>
              <div className={styles.tableTitle}>
                <FaChartLine /> FULL RANKINGS
              </div>
              <div className={styles.tableSubTitle}>
                Showing 1-{leaderboard.length} of {leaderboard.length}
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
              {leaderboard.map((user, idx) => (
                <div
                  key={user.userId}
                  className={`${styles.tableRow} ${isCurrentUser(user.userId) ? styles.currentUser : ''}`}
                >
                  <div className={styles.rankCol}>
                    {idx === 0 && <FaTrophy className={styles.medal1} />}
                    {idx === 1 && <FaMedal className={styles.medal2} />}
                    {idx === 2 && <FaMedal className={styles.medal3} />}
                    {idx > 2 && `#${idx + 1}`}
                  </div>

                  <div className={styles.playerCol}>
                    <div className={styles.playerAvatarSmall}>
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ lineHeight: 1 }}>{user.username}</span>
                      {isCurrentUser(user.userId) && <span className={styles.youTag}>YOU</span>}
                    </div>
                  </div>

                  <div className={styles.scoreCol}>
                    {user.score}
                  </div>

                  <div className={styles.accuracyVal}>
                    {calculateAccuracy(user.puzzlesSolved, totalPuzzles)}%
                  </div>

                  <div className={`${styles.timeCol} ${styles.alignRight}`}>
                    {formatTime(user.timeSpent)}
                  </div>

                  <div className={styles.alignRight} style={{ paddingLeft: '1rem' }}>
                    {/* Accuracy Bar as Progress */}
                    <div className={styles.accuracyWrapper}>
                      <div className={styles.accuracyBg}>
                        <div
                          className={styles.accuracyFill}
                          style={{ width: `${calculateAccuracy(user.puzzlesSolved, totalPuzzles)}%` }}
                        ></div>
                      </div>
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