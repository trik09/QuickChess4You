import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FaClock,
  FaCheckCircle,
  FaArrowLeft,
  FaExclamationTriangle
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { useLiveEvent } from "../../contexts/LiveEventContext";
import ChessBoard from "../../components/ChessBoard/ChessBoard";
import EventTimer from "../../components/LiveCompetition/EventTimer";
import LiveEventLeaderboard from "../../components/LiveCompetition/LiveEventLeaderboard";
import EventPuzzleRacer from "../../components/PuzzleRacer/EventPuzzleRacer";
import PremiumLoader from "../../components/PremiumLoader/PremiumLoader";
import styles from "../PuzzlePage/PuzzlePage.module.css";

function LiveEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const {
    event,
    puzzles,
    participant,
    isConnected,
    spectator,
    participateInEvent,
    submitSolution,
    getLeaderboard,
  } = useLiveEvent();

  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0); 
  const ITEMS_PER_PAGE = 10;
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [showGalaxy, setShowGalaxy] = useState(true);
  const chapterScrollRef = useRef(null);

  const [solving, setSolving] = useState(false);
  const [puzzleStatuses, setPuzzleStatuses] = useState({});

  useEffect(() => {
    if (id && user) {
      participateInEvent(id, user.username || user.name).catch((err) => {
        console.error("Failed to participate in event", err);
      });
    }
  }, [id, user]);

  useEffect(() => {
    if (event?.chapters && puzzles.length > 0) {
      const currentPuzzleId = (
        puzzles[currentPuzzleIndex]?._id || puzzles[currentPuzzleIndex]?.id
      )?.toString();
      if (!currentPuzzleId) return;

      const chapterIdx = event.chapters.findIndex((ch) =>
        (ch.puzzleIds || [])
          .map((id) => id.toString())
          .includes(currentPuzzleId)
      );

      if (chapterIdx !== -1 && chapterIdx !== activeChapterIndex) {
        setActiveChapterIndex(chapterIdx);
        const chPuzzleIds = (event.chapters[chapterIdx].puzzleIds || []).map((id) => id.toString());
        const navPuzzles = puzzles.filter((p) => chPuzzleIds.includes((p._id || p.id).toString()));
        const localIdx = navPuzzles.findIndex((p) => (p._id || p.id).toString() === currentPuzzleId);
        if (localIdx !== -1) {
          setCurrentFrame(Math.floor(localIdx / ITEMS_PER_PAGE));
        }
      }
    }
  }, [currentPuzzleIndex, event?.chapters, puzzles]);

  const handlePuzzleSolved = async (winningMoves, boardMoveHistory) => {
    const currentPuzzle = puzzles[currentPuzzleIndex];
    if (!currentPuzzle || spectator) return;

    setSolving(true);
    try {
      const timeSpent = 10;
      const puzzleId = currentPuzzle._id || currentPuzzle.id;

      await submitSolution(
        puzzleId,
        winningMoves || currentPuzzle.solutionMoves || "solved",
        timeSpent,
        null,
        boardMoveHistory || []
      );

      setPuzzleStatuses(prev => ({ ...prev, [puzzleId]: "success" }));
      toast.success("Puzzle solved!");

      if (currentPuzzleIndex < puzzles.length - 1) {
        setTimeout(() => {
          setCurrentPuzzleIndex(prev => prev + 1);
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting solution", error);
    } finally {
      setSolving(false);
    }
  };

  const handleWrongMove = async () => {
    const currentPuzzle = puzzles[currentPuzzleIndex];
    if (!currentPuzzle || spectator) return;
    
    const puzzleId = currentPuzzle._id || currentPuzzle.id;
    setPuzzleStatuses(prev => ({ ...prev, [puzzleId]: "failed" }));
    toast.error("Incorrect move!");
  };

  if (!event) {
    return (
      <div className={styles.container}>
        <PremiumLoader text="ENTERING EVENT..." />
      </div>
    );
  }

  const chapterData = event.chapters;
  let navPuzzles = puzzles;
  if (chapterData && chapterData.length > 0) {
    const chPuzzleIds = (chapterData[activeChapterIndex]?.puzzleIds || []).map(
      (id) => id.toString()
    );
    navPuzzles = puzzles.filter((p) =>
      chPuzzleIds.includes((p._id || p.id).toString())
    );
  }
  const totalPages = Math.ceil(navPuzzles.length / ITEMS_PER_PAGE);
  const currentPuzzleId = (
    puzzles[currentPuzzleIndex]?._id || puzzles[currentPuzzleIndex]?.id
  )?.toString();
  const chapterCurrentIndex = navPuzzles.findIndex(
    (p) => (p._id || p.id).toString() === currentPuzzleId
  );

  const currentPuzzle = puzzles[currentPuzzleIndex];
  const currentPuzzleStatus = currentPuzzle
    ? (puzzleStatuses[currentPuzzle._id || currentPuzzle.id] || currentPuzzle.status)
    : null;

  const isBoardInteractive = (() => {
    if (solving) return false;
    if (spectator) return false;
    if (currentPuzzleStatus === "success" || currentPuzzleStatus === "failed" || currentPuzzle?.isSolved || currentPuzzle?.isFailed) {
      return false;
    }
    return true;
  })();

  return (
    <div className={`${styles.container} ${styles.competitionPage}`}>
      <Toaster position="top-right" />
      
      <div className={styles.titleHeader}>
        <div className={styles.titleHeaderLeft}>
          <button className={styles.backBtnHeader} onClick={() => navigate(`/event/${id}/lobby`)} title="Go back">
            <FaArrowLeft />
          </button>
          <h2 className={styles.mainTitle}>{event.name}</h2>
          {spectator && (
            <span className={styles.liveBadge} style={{ background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", borderColor: "rgba(239, 68, 68, 0.3)" }}>
              Spectator View
            </span>
          )}
        </div>

        <div className={styles.titleHeaderRight}>
          <button
            className={`${styles.galaxyToggle} ${!showGalaxy ? styles.galaxyToggleOff : ""}`}
            onClick={() => setShowGalaxy(!showGalaxy)}
            title={showGalaxy ? "Hide Galaxy" : "Show Galaxy"}
          >
            <span className={styles.toggleIcon}>🪐</span>
            <span className={styles.toggleText}>{showGalaxy ? "Galaxy On" : "Galaxy Off"}</span>
            <div className={styles.toggleSwitch}>
              <div className={styles.toggleKnob} />
            </div>
          </button>
        </div>
      </div>

      {showGalaxy && (
        <div className={styles.galaxySection}>
          <EventPuzzleRacer />
        </div>
      )}

      {!isConnected && (
        <div className={styles.connectionBanner}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FaExclamationTriangle /> Connection dropped. Reconnecting...
          </span>
        </div>
      )}

      <div className={styles.gameplayLayout}>
        {/* LEFT COLUMN: Stats */}
        <div className={styles.leftColumn}>
          <div className={styles.rankCard}>
            <div className={styles.rankRow}>
              <div className={styles.rankLabel}><span>🏆</span> YOUR SCORE</div>
              <div className={styles.rankNumber}>{participant?.score || 0} pts</div>
            </div>
            <div className={styles.rankProgressBar}>
              <div 
                className={styles.rankProgressFill} 
                style={{ width: `${puzzles.length > 0 ? ((participant?.puzzlesSolved || 0) / puzzles.length) * 100 : 0}%` }} 
              />
            </div>
            <div className={styles.rankParticipants}>
              Solved: {participant?.puzzlesSolved || 0} / {puzzles.length}
            </div>
          </div>

          <div className={styles.timerCard}>
            <EventTimer />
          </div>
        </div>

        {/* CENTER: Board */}
        <div className={styles.boardArea}>
          {currentPuzzle && (
            <div className={styles.boardTitleHeader}>
              <span className={styles.puzzleTitleText}>
                {currentPuzzle.title || `Challenge #${currentPuzzleIndex + 1}`}
              </span>
            </div>
          )}
          
          <div className={styles.boardWrapper}>
            {puzzles.length > 0 && currentPuzzle ? (
              <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "start", justifyContent: "center" }}>
                <ChessBoard
                  key={`${currentPuzzle._id || currentPuzzle.id}-${currentPuzzleIndex}`}
                  fen={currentPuzzle.fen}
                  solution={currentPuzzle.solutionMoves || currentPuzzle.solution || []}
                  alternativeSolutions={currentPuzzle.alternativeSolutions || []}
                  puzzleType={currentPuzzle.puzzleType || currentPuzzle.type}
                  captureConfig={currentPuzzle.captureConfig}
                  illegalConfig={currentPuzzle.illegalConfig}
                  firstMoveBy={currentPuzzle.firstMoveBy}
                  isSolved={currentPuzzleStatus === "success" || currentPuzzle?.isSolved}
                  interactive={isBoardInteractive}
                  onPuzzleSolved={handlePuzzleSolved}
                  onWrongMove={handleWrongMove}
                />
              </div>
            ) : (
              <div className={styles.loading}>No Puzzles Available</div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Chapters & Leaderboards */}
        <div className={styles.rightColumn}>
          {chapterData?.length > 0 && (
            <div className={styles.chaptersBox}>
              <div className={styles.chaptersBoxTitle}>CHAPTERS</div>
              <div className={styles.chaptersWrap} ref={chapterScrollRef}>
                {chapterData.map((chapter, idx) => {
                  const ids = (chapter.puzzleIds || []).map(id => id.toString());
                  const chPs = puzzles.filter(p => ids.includes((p._id || p.id).toString()));
                  const solved = chPs.filter(p => p.isSolved || p.status === "solved").length;
                  return (
                    <button 
                      key={idx} 
                      type="button"
                      className={`${styles.chapterPill} ${activeChapterIndex === idx ? styles.chapterPillActive : ""}`}
                      onClick={() => {
                        setActiveChapterIndex(idx); 
                        setCurrentFrame(0);
                        const gPs = puzzles.filter(p => ids.includes((p._id || p.id).toString()));
                        if (gPs.length > 0) { 
                          const gi = puzzles.findIndex(p => (p._id || p.id).toString() === (gPs[0]._id || gPs[0].id).toString()); 
                          if (gi !== -1) setCurrentPuzzleIndex(gi); 
                        }
                      }}
                    >
                      <div className={styles.chapterPillContent}>
                        <span className={styles.chapterPillName}>{chapter.name}</span>
                        <span className={styles.chapterPillBadge}>{solved}/{chPs.length}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.navCard}>
            <div className={styles.navCardTitle}>PUZZLES</div>
            {totalPages > 1 && <div className={styles.paginationInfo}>Page {currentFrame + 1} of {totalPages}</div>}

            <div className={styles.navGrid}>
              {navPuzzles.slice(currentFrame * ITEMS_PER_PAGE, (currentFrame + 1) * ITEMS_PER_PAGE).map((puzzle, li) => {
                const gi = puzzles.findIndex(p => (p._id || p.id) === (puzzle._id || puzzle.id));
                const ci = currentFrame * ITEMS_PER_PAGE + li;
                const status = puzzleStatuses[puzzle._id || puzzle.id] || puzzle.status;
                return (
                  <div 
                    key={`nav-${puzzle._id || puzzle.id}`}
                    className={`${styles.navItem} ${chapterCurrentIndex === ci ? styles.active : ""} ${status === "solved" || puzzle.isSolved ? styles.success : ""} ${status === "failed" || puzzle.isFailed ? styles.danger : ""}`}
                    onClick={() => {
                      if (!solving) {
                        setCurrentPuzzleIndex(gi);
                      }
                    }}
                  >
                    {status === "solved" || puzzle.isSolved ? <FaCheckCircle /> : gi + 1}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.navCard} style={{ marginTop: "1.5rem" }}>
            <div className={styles.navCardTitle}>LEADERBOARD</div>
            <div style={{ padding: "10px" }}>
              <LiveEventLeaderboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveEventPage;
