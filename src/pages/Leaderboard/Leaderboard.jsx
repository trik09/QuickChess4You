import React, { useState, useEffect } from "react";
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
  FaStopwatch,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaEye
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import { liveEventAPI } from "../../services/liveEventAPI";
import { competitionAPI, eventAPI } from "../../services/api";
import socketService from "../../services/socketService";
import { deduplicateLeaderboard } from "../../features/liveCompetition/leaderboardUtils";
import PremiumLoader from "../../components/PremiumLoader/PremiumLoader";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Leaderboard.module.css";

import silver from "../../assets/Trophy/silver-trophy.svg"
import gold from "../../assets/Trophy/gold-trophy.svg"
import bronze from "../../assets/Trophy/bronze-trophy.svg"
import bar1Svg from "../../assets/Trophy/1st bar.svg"
import bar2Svg from "../../assets/Trophy/2nd bar.svg"
import bar3Svg from "../../assets/Trophy/3rd bar.svg"

function Leaderboard({ isEvent }) {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const { isUserAuthenticated } = useAuth();

  const [leaderboard, setLeaderboard] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;
  const hasAutoPaginatedRef = React.useRef(false);
  const hasFiredConfettiRef = React.useRef(false);

  useEffect(() => {
    if (competitionId) {
      loadCompetitionData();
      loadLeaderboard();
    }

    // Immediate "Congrats" burst on mount
    triggerCelebration(true);

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
    setLeaderboard(deduplicateLeaderboard(newLeaderboard));
  };

  const handleParticipantJoined = (data) => {
    console.log('[Leaderboard] Socket: participantJoined', data);
    // Refresh leaderboard when someone joins
    loadLeaderboard(false);
  };

  const loadCompetitionData = async () => {
    try {
      const response = isEvent
        ? await eventAPI.getById(competitionId)
        : await competitionAPI.getById(competitionId);
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
      const response = isEvent
        ? await liveEventAPI.getLeaderboard(competitionId)
        : await liveCompetitionAPI.getLeaderboard(competitionId);
      if (response.success && response.leaderboard) {
        const dedupedList = deduplicateLeaderboard(response.leaderboard);
        setLeaderboard(dedupedList);

        // Auto-paginate to the user's page on initial load
        if (!hasAutoPaginatedRef.current) {
          const currentId = getCurrentUser();
          if (currentId) {
            const userIndex = dedupedList.findIndex(u => {
              const targetId = typeof u.userId === 'object' ? (u.userId?._id || u.userId?.id) : u.userId;
              return String(targetId) === String(currentId);
            });
            if (userIndex !== -1) {
              const expectedPage = Math.floor(userIndex / itemsPerPage) + 1;
              setCurrentPage(expectedPage);
              hasAutoPaginatedRef.current = true;
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      if (showLoader) setLoading(false);
      
      // Trigger refined celebration once data is loaded
      if (response?.success && response?.leaderboard?.length > 0 && !hasFiredConfettiRef.current) {
        triggerCelebration();
        hasFiredConfettiRef.current = true;
      }
    }
  };

  const triggerCelebration = (isInitial = false) => {
    const duration = isInitial ? 1.5 * 1000 : 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 10000 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    // Initial big burst
    confetti({
      ...defaults,
      particleCount: 150,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FFFFFF']
    });

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 40 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FFFFFF']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FFFFFF']
      });
    }, 250);
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
    return user.id || user._id;
  };

  const handleReview = () => {
    if (!isUserAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent(isEvent ? `/live-event/${competitionId}` : `/competition/${competitionId}/puzzle`)}`);
      return;
    }
    navigate(isEvent ? `/live-event/${competitionId}` : `/competition/${competitionId}/puzzle`, { state: { reviewMode: true } });
  };

  const isCurrentUser = (userId) => {
    const currentId = getCurrentUser();
    if (!currentId || !userId) return false;
    const targetId = typeof userId === 'object' ? (userId._id || userId.id) : userId;
    return String(targetId) === String(currentId);
  };

  const calculateAccuracy = (puzzlesSolved, totalPuzzles) => {
    if (!totalPuzzles || totalPuzzles === 0) return 0;
    return Math.round((puzzlesSolved / totalPuzzles) * 100);
  };

  if (loading) {
    return <PremiumLoader text="LOADING LEADERBOARD..." />;
  }

  const totalPuzzles = competition?.totalPuzzles || competition?.puzzles?.length || 20;
  const top3 = [...leaderboard];
  while (top3.length < 3) top3.push(null);

  const averageAccuracy = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((acc, curr) => acc + (calculateAccuracy(curr.puzzlesSolved, totalPuzzles)), 0) / leaderboard.length)
    : 0;

  // The user explicitly requested to base the 50% criteria on the TOTAL puzzles possible, not the max score achieved by others.
  const requiredPuzzlesSolved = Math.ceil(totalPuzzles * 0.5);
  const eligibleSolvers = leaderboard.filter(u => (u.puzzlesSolved || 0) >= requiredPuzzlesSolved && (u.puzzlesSolved || 0) > 0);

  const fastestSolver = eligibleSolvers.length > 0
    ? [...eligibleSolvers].sort((a, b) => (a.timeSpent || 999999) - (b.timeSpent || 999999))[0]
    : null;

  // Pagination & Search Logic
  const getProcessedLeaderboard = () => {
    // 1. Deduplicate by UserId (keeping highest score)
    const uniqueUsers = new Map();
    leaderboard.forEach(entry => {
      const uid = typeof entry.userId === 'object' ? (entry.userId?._id || entry.userId?.id) : entry.userId;
      if (!uid) return;

      const existing = uniqueUsers.get(String(uid));
      if (!existing || (entry.score || 0) > (existing.score || 0)) {
        uniqueUsers.set(String(uid), entry);
      }
    });

    // 2. Removed early term filtering so ranks compute globally first
    let items = Array.from(uniqueUsers.values());

    // 3. Sort ALL users globally to determine ranks
    const sortedItems = items.sort((a, b) => {
      if (b.score !== a.score) {
        return (b.score || 0) - (a.score || 0);
      }
      return (a.timeSpent || 0) - (b.timeSpent || 0);
    });

    // 4. Assign global ranks
    const rankedItems = sortedItems.map((item, index) => ({
      ...item,
      globalRank: index + 1
    }));

    // 5. Filter the ranked list by search term
    if (searchTerm) {
      return rankedItems.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return rankedItems;
  };

  const processedLeaderboard = getProcessedLeaderboard();
  const totalPages = Math.ceil(processedLeaderboard.length / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeaderboard = processedLeaderboard.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      // Scroll to top of rankings panel smoothly when page changes
      const panel = document.querySelector(`.${styles.rankingsPanel}`);
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Animation Variants
  const barVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: (i) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.2,
        duration: 0.6,
        ease: "easeOut"
      }
    })
  };

  const trophyVariants = {
    hidden: { scale: 0, opacity: 0, x: "-50%", y: 12 },
    visible: (i) => ({
      scale: 1,
      opacity: 1,
      x: "-50%",
      y: 12,
      transition: {
        delay: 0.5 + (i * 0.2),
        type: "spring",
        stiffness: 120,
        damping: 12
      }
    })
  };

  const glowPulseVariants = {
    animate: {
      filter: [
        "drop-shadow(0 0 10px rgba(255, 191, 20, 0.4)) drop-shadow(0 0 18px rgba(255, 191, 20, 0.2))",
        "drop-shadow(0 0 16px rgba(255, 191, 20, 0.7)) drop-shadow(0 0 30px rgba(255, 191, 20, 0.35))",
        "drop-shadow(0 0 10px rgba(255, 191, 20, 0.4)) drop-shadow(0 0 18px rgba(255, 191, 20, 0.2))"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className={styles.leaderboardPage}>
      {/* Background Animation Layer */}
      <div className={styles.bgAnimationLayer}>
        <div className={`${styles.blob} ${styles.blob1}`}></div>
        <div className={`${styles.blob} ${styles.blob2}`}></div>
        <div className={`${styles.blob} ${styles.blob3}`}></div>
        <div className={styles.particlesContainer}>
          {[...Array(20)].map((_, i) => (
            <div key={i} className={styles.particle} style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.5 + 0.2
            }}></div>
          ))}
        </div>
      </div>

      {/* Remove generic page header layout from here, moving elements individually */}

      <div className={styles.mainContent}>
          {/* LEFT: Podium */}
          <div className={styles.leftPanel}>
            <div className={styles.podiumSection}>
              {/* Solid header block matching figma */}
              <div className={styles.topChampionsHeader}>
                <FaTrophy className={styles.headerTrophyIcon} />
                <h2>WINNERS</h2>
              </div>

              <div className={styles.podium}>
                {/* 2nd Place */}
                <motion.div 
                  className={`${styles.podiumPlace} ${styles.second}`}
                  custom={1}
                  initial="hidden"
                  animate="visible"
                  variants={barVariants}
                >
                  {/* SVG Bar with trophy sitting on top */}
                  <div className={styles.barWrapper}>
                    <motion.div 
                      className={styles.trophyOnBar}
                      custom={1}
                      initial="hidden"
                      animate="visible"
                      variants={trophyVariants}
                    >
                      <img src={silver} alt="2nd Place" className={`${styles.trophyImg} ${styles.silverTrophy}`} />
                    </motion.div>
                    <img src={bar2Svg} alt="2nd place bar" className={styles.barSvgImg} />
                  </div>
                  {/* White info card: Score + Username */}
                  <motion.div 
                    className={styles.playerInfoCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                  >
                    <div className={styles.podiumScore}>{top3[1] ? `${top3[1].score || 0} pts` : "N/A"}</div>
                    <div className={styles.podiumName}>{top3[1]?.username || "N/A"}</div>
                  </motion.div>
                  {/* Accuracy + Time pills */}
                  <motion.div 
                    className={styles.statsPills}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                  >
                    <span className={styles.accBadge}>
                      {top3[1] ? `${calculateAccuracy(top3[1].puzzlesSolved, totalPuzzles)}% Acc` : "N/A"}
                    </span>
                    <span className={styles.timeBadge}>
                      {top3[1] ? formatTime(top3[1].timeSpent) : "N/A"}
                    </span>
                  </motion.div>
                </motion.div>

                {/* 1st Place */}
                <motion.div 
                  className={`${styles.podiumPlace} ${styles.first}`}
                  custom={0}
                  initial="hidden"
                  animate="visible"
                  variants={barVariants}
                >
                  {/* SVG Bar with trophy sitting on top */}
                  <div className={styles.barWrapper}>
                    <motion.div 
                      className={`${styles.trophyOnBar} ${styles.trophyOnBar1}`}
                      custom={0}
                      initial="hidden"
                      animate="visible"
                      variants={trophyVariants}
                    >
                      <motion.img 
                        src={gold} 
                        alt="1st Place" 
                        className={`${styles.trophyImg} ${styles.goldTrophy}`}
                        animate="animate"
                        variants={glowPulseVariants}
                      />
                    </motion.div>
                    <img src={bar1Svg} alt="1st place bar" className={`${styles.barSvgImg} ${styles.barSvg1}`} />
                  </div>
                  {/* White info card: Score + Username */}
                  <motion.div 
                    className={`${styles.playerInfoCard} ${styles.playerInfoCard1}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    <div className={`${styles.podiumScore} ${styles.firstScore}`}>{top3[0] ? `${top3[0].score || 0} pts` : "N/A"}</div>
                    <div className={`${styles.podiumName} ${styles.firstName}`}>{top3[0]?.username || "N/A"}</div>
                  </motion.div>
                  {/* Accuracy + Time pills */}
                  <motion.div 
                    className={styles.statsPills}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    <span className={styles.accBadge}>
                      {top3[0] ? `${calculateAccuracy(top3[0].puzzlesSolved, totalPuzzles)}% Acc` : "N/A"}
                    </span>
                    <span className={styles.timeBadge}>
                      {top3[0] ? formatTime(top3[0].timeSpent) : "N/A"}
                    </span>
                  </motion.div>
                </motion.div>

                {/* 3rd Place */}
                <motion.div 
                  className={`${styles.podiumPlace} ${styles.third}`}
                  custom={2}
                  initial="hidden"
                  animate="visible"
                  variants={barVariants}
                >
                  {/* SVG Bar with trophy sitting on top */}
                  <div className={styles.barWrapper}>
                    <motion.div 
                      className={styles.trophyOnBar}
                      custom={2}
                      initial="hidden"
                      animate="visible"
                      variants={trophyVariants}
                    >
                      <img src={bronze} alt="3rd Place" className={`${styles.trophyImg} ${styles.bronzeTrophy}`} />
                    </motion.div>
                    <img src={bar3Svg} alt="3rd place bar" className={styles.barSvgImg} />
                  </div>
                  {/* White info card: Score + Username */}
                  <motion.div 
                    className={styles.playerInfoCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                  >
                    <div className={styles.podiumScore}>{top3[2] ? `${top3[2].score || 0} pts` : "N/A"}</div>
                    <div className={styles.podiumName}>{top3[2]?.username || "N/A"}</div>
                  </motion.div>
                  {/* Accuracy + Time pills */}
                  <motion.div 
                    className={styles.statsPills}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                  >
                    <span className={styles.accBadge}>
                      {top3[2] ? `${calculateAccuracy(top3[2].puzzlesSolved, totalPuzzles)}% Acc` : "N/A"}
                    </span>
                    <span className={styles.timeBadge}>
                      {top3[2] ? formatTime(top3[2].timeSpent) : "N/A"}
                    </span>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Fastest Solver section - Header type with data box */}
            <div className={styles.fastestSolverSection}>
              <div className={styles.fastestSolverLeft}>
                <FaBolt className={styles.headerBoltIcon} />
                <h2>FASTEST SOLVER</h2>
              </div>

              <div className={styles.fastestSolverRight}>
                <div className={styles.footerName}>{fastestSolver?.username || "N/A"}</div>
                <div className={styles.footerAcc}>
                  {fastestSolver ? (
                    <>
                      Avg Accuracy {calculateAccuracy(fastestSolver.puzzlesSolved, totalPuzzles)}%
                      <FaArrowUp style={{ color: "#10b981", marginLeft: "4px", marginRight: "4px" }} />
                      <span>{`+${Math.max(1, calculateAccuracy(fastestSolver.puzzlesSolved, totalPuzzles) - averageAccuracy)}% Vs Avg`}</span>
                    </>
                  ) : (
                    "Avg Accuracy N/A"
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Competition Info + Full Rankings */}
          <div className={styles.rightPanel}>
            {/* Top Right Competition Details Block - Compact Single Row */}
            <div className={styles.competitionInfoCard}>
              <div className={styles.compHeaderRow}>
                <div className={styles.compTitleWrapper}>
                  <button onClick={() => navigate('/dashboard')} className={styles.backBtnWrapper}>
                    <FaArrowLeft />
                  </button>
                  <h2 className={styles.compTitle}>{competition?.name || 'Test Competition'}</h2>

                  <div className={styles.competitionMeta}>
                    <div className={styles.metaPill}>
                      <FaClock /> {competition?.duration || 15} MIN
                    </div>
                    <div className={styles.metaPill}>
                      <FaUserCircle /> {processedLeaderboard.length} PLAYERS
                    </div>
                    {/* <div className={styles.metaPill}>
                      {isLive ? '🔴 LIVE' : '✅ COMPLETED'}
                    </div> */}
                    {!isLive && (
                      <button onClick={handleReview} className={styles.reviewBtn}>
                        <FaEye /> Analyze
                      </button>
                    )}
                  </div>
                </div>

                {isLive && (
                  <button onClick={loadLeaderboard} className={styles.refreshBtn}>
                    <FaSync />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Right: Full Rankings List */}
            <div className={styles.rankingsPanel}>
              <div className={styles.rankingsPanelHeader}>
                <div className={styles.rankingsTitle}>
                  <FaChartLine /> Full Ranking
                </div>

                <div className={styles.headerControls}>
                  <div className={styles.searchWrapper}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                      type="text"
                      placeholder="Search player..."
                      className={styles.searchInput}
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>

                  {totalPages > 1 && (
                    <div className={styles.paginationArrowContainer}>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={styles.pageArrowBtn}
                        title="Previous"
                      >
                        <FaChevronLeft />
                      </button>
                      <span className={styles.pageIndicator}>
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={styles.pageArrowBtn}
                        title="Next"
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.headerDivider} />

              <div className={styles.rankingsList}>
                {currentLeaderboard.map((user, idx) => {
                  const actualRank = indexOfFirstItem + idx + 1;
                  const uid = typeof user.userId === 'object' ? (user.userId?._id || user.userId?.id) : user.userId;
                  return (
                    <div
                      key={`${uid}-${actualRank}`}
                      className={`${styles.rankRow} ${isCurrentUser(user.userId) ? styles.currentUser : ''}`}
                    >
                      <div className={styles.rankNum}>
                        <span className={styles.rankNumber}>{user.globalRank}</span>
                      </div>

                      <div className={styles.rankAvatar}>
                        {user.username?.[0]?.toUpperCase()}
                      </div>

                      <div className={styles.rankInfo}>
                        <span className={styles.rankName}>
                          {isCurrentUser(user.userId) ? 'You' : user.username}
                        </span>
                      </div>

                      <div className={styles.rankScore}>
                        <span className={styles.scoreNumber}>{Math.round(user.score || 0)}</span>
                        <span className={styles.scoreLabel}>pts</span>
                      </div>

                      <div className={styles.rankTime} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '10px', minWidth: '55px', justifyContent: 'flex-end', color: 'var(--text-muted)' }}>
                        <span className={styles.timeNumber} style={{ fontSize: '0.9rem', fontWeight: '600', fontFamily: 'monospace' }}>
                          {formatTime(user.timeSpent)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;