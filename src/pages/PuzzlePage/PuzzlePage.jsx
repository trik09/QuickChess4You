import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaClock, FaUndo, FaCheckCircle } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

import ChessBoard from "../../components/ChessBoard/ChessBoard";
import { puzzleAPI, competitionAPI } from "../../services/api";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import { useAuth } from "../../contexts/AuthContext";
import { useLiveCompetition } from "../../contexts/LiveCompetitionContext"; // Import Context
import CompetitionLeaderboard from "../../components/CompetitionLeaderboard/CompetitionLeaderboard";
import PuzzleRacer from "../../components/PuzzleRacer/PuzzleRacer"; // Import PuzzleRacer
import styles from "./PuzzlePage.module.css";

function PuzzlePage() {
  const { id: paramCompetitionId } = useParams();
  const navigate = useNavigate();
  const navigator = useNavigate();
  const { user } = useAuth();
  const { participateInCompetition, disconnectFromCompetition } =
    useLiveCompetition(); // Destructure disconnect

  // State
  const [competitionData, setCompetitionData] = useState(null);
  const [puzzles, setPuzzles] = useState([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [isLiveCompetition, setIsLiveCompetition] = useState(false);

  const [puzzleStatuses, setPuzzleStatuses] = useState({}); // { [puzzleId]: 'success' | 'failed' }
  const [puzzleBoardStates, setPuzzleBoardStates] = useState({}); // { [puzzleId]: { fen: string, moveHistory: string[] } }

  // Timer & Score
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [score, setScore] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [solvedPuzzles, setSolvedPuzzles] = useState([]); // Array of solved puzzle IDs
  const [startTime, setStartTime] = useState(Date.now());

  // Submission Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Refs for tracking without re-renders
  const timerRef = useRef(null);
  const isLoadedRef = useRef(false);

  // Listen for competition events from socket directly
  useEffect(() => {
    if (isLiveCompetition && paramCompetitionId) {
      const onCompetitionEnded = () => {
        toast.success("Competition Ended! Redirecting to lobby...");
        setTimeout(() => {
          navigate(`/competition/${paramCompetitionId}/lobby`);
        }, 1000);
      };

      // Attach
      import("../../services/socketService").then(module => {
        const socketService = module.default;
        socketService.on("competitionEnded", onCompetitionEnded);
      });

      return () => {
        import("../../services/socketService").then(module => {
          const socketService = module.default;
          socketService.off("competitionEnded", onCompetitionEnded);
        });
      }
    }
  }, [isLiveCompetition, paramCompetitionId, navigate]);

  // 1. Initial Data Fetch & Restore
  useEffect(() => {
    loadPuzzleContext();
    return () => {
      clearInterval(timerRef.current);
      // Clean up live competition connection on unmount/change
      if (paramCompetitionId) {
        disconnectFromCompetition();
      }
    };
  }, [paramCompetitionId]);

  // Persist State
  useEffect(() => {
    if (!loading && puzzles.length > 0 && isLoadedRef.current) {
      const stateKey = `puzzleState_${paramCompetitionId || "casual"}`;
      const stateToSave = {
        currentPuzzleIndex,
        timeLeft,
        score,
        solvedCount,
        puzzleStatuses,
        puzzleBoardStates,
      };
      localStorage.setItem(stateKey, JSON.stringify(stateToSave));
    }
  }, [
    currentPuzzleIndex,
    timeLeft,
    score,
    solvedCount,
    puzzleStatuses,
    puzzleBoardStates,
    loading,
    paramCompetitionId,
    puzzles,
  ]);

  const loadPuzzleContext = async () => {
    try {
      setLoading(true);

      // Check if this is a competition
      if (paramCompetitionId) {
        // Fetch competition data
        const response = await competitionAPI.getById(paramCompetitionId);

        if (!response.success || !response.data) {
          throw new Error("Failed to load competition data");
        }

        const comp = response.data;
        setCompetitionData(comp);

        // Check active status
        const now = new Date();
        const start = new Date(comp.startTime);
        const end = new Date(comp.endTime);

        const isLive = comp.status === "live" || comp.status === "LIVE";
        setIsLiveCompetition(isLive);

        if (!isLive) {
          navigate(`/competition/${paramCompetitionId}/lobby`);
          return;
        }

        // Calculate Time Remaining from Server (Source of Truth)
        const msUntilEnd = end - now;
        const secondsLeft = Math.floor(msUntilEnd / 1000);
        setTimeLeft(secondsLeft);

        // LIVE COMPETITION LOGIC
        if (isLive) {
          try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            // Ensure participation logic
            await participateInCompetition(paramCompetitionId, user.username || user.name);

            // Fetch DETAILED puzzles with user's solved status
            const puzzleRes = await liveCompetitionAPI.getPuzzles(paramCompetitionId);

            if (puzzleRes.success) {
              // Update Puzzles with IsSolved status
              const normalized = puzzleRes.puzzles.map((p, index) => ({
                id: p._id,
                _id: p._id,
                index: index + 1,
                fen: p.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                solution: p.solutionMoves || [],
                title: p.title || `Puzzle ${index + 1}`,
                type: p.type === "kids" ? "Kids" : (p.title || "Puzzle"),
                difficulty: p.difficulty || "medium",
                description: p.description || "",
                kidsConfig: p.kidsConfig,
                puzzleType: p.type || "normal",
                isSolved: p.isSolved
              }));
              setPuzzles(normalized);

              // Update Statuses map from server
              const statuses = {};
              normalized.forEach(p => {
                if (p.isSolved) statuses[p.id] = 'success';
              });

              // Restore from localStorage if available (for failed puzzles)
              const stateKey = `puzzleState_${paramCompetitionId}`;
              const savedState = localStorage.getItem(stateKey);
              if (savedState) {
                const parsed = JSON.parse(savedState);
                // Merge saved statuses (for failed puzzles) with server statuses
                Object.assign(statuses, parsed.puzzleStatuses || {});
                setPuzzleBoardStates(parsed.puzzleBoardStates || {});
              }

              setPuzzleStatuses(statuses);

              // Update Score and Solved Count form Backend
              if (puzzleRes.participant) {
                setScore(puzzleRes.participant.score);
                setSolvedCount(puzzleRes.participant.puzzlesSolved);
              }

              // Find first unsolved puzzle
              const firstUnsolved = normalized.findIndex(p => !p.isSolved);
              if (firstUnsolved !== -1) {
                setCurrentPuzzleIndex(firstUnsolved);
              }
            }

          } catch (err) {
            console.error("Error syncing live competition data", err);
            // Fallback to basic loading if detailed fetch fails
          }
        }

        // If Puzzles not loaded yet (fallback or non-live)
        if (puzzles.length === 0 && (!isLive || puzzles.length === 0)) {
          // Load Basic Puzzles
          if (comp.puzzles && comp.puzzles.length > 0) {
            const normalized = comp.puzzles.map((p, index) => ({
              id: p._id,
              _id: p._id,
              index: index + 1,
              fen: p.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
              solution: p.solutionMoves || [],
              title: p.title,
              type: p.type,
              difficulty: p.difficulty,
              kidsConfig: p.kidsConfig,
              puzzleType: p.type || "normal",
            }));
            setPuzzles(normalized);
          }
        }

        startTimer();

      } else {
        // Casual Mode (Dashboard link)
        const data = await puzzleAPI.getAll();
        const normalized = data
          .filter((p) => p.fen && (p.solutionMoves?.length || p.kidsConfig))
          .map((p, i) => ({
            id: p._id,
            index: i + 1,
            fen: p.fen,
            solution: p.solutionMoves,
            type: p.type,
            description: p.description,
            kidsConfig: p.kidsConfig,
            puzzleType: p.type,
          }));
        setPuzzles(normalized);

        // Restore Casual State
        const stateKey = `puzzleState_casual`;
        const savedState = localStorage.getItem(stateKey);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setScore(parsed.score);
          setSolvedCount(parsed.solvedCount);
          setPuzzleStatuses(parsed.puzzleStatuses || {});
          setPuzzleBoardStates(parsed.puzzleBoardStates || {});
          setCurrentPuzzleIndex(parsed.currentPuzzleIndex || 0);
        } else {
          setTimeLeft(300); // Default 5 mins for casual
        }
      }
    } catch (error) {
      console.error("Error loading puzzles:", error);
      toast.error("Failed to load puzzles");
    } finally {
      setLoading(false);
      isLoadedRef.current = true;
      setStartTime(Date.now());
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    toast.error("Time's up!");
    // Redirect to lobby for competition, or home for casual
    setTimeout(() => {
      if (paramCompetitionId) {
        navigate(`/competition/${paramCompetitionId}/lobby`); // Lobby will show as leaderboard
      } else {
        navigate("/");
      }
    }, 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handlePuzzleSolved = async () => {
    const currentPuzzle = puzzles[currentPuzzleIndex];
    if (!currentPuzzle) return;

    // Check if already solved
    if (puzzleStatuses[currentPuzzle.id] === "success") return;

    // Calculate time taken for this puzzle (simple approximation)
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    // Submit to Backend first (no optimistic update)
    if (competitionData) {
      try {
        setSolving(true);

        console.log("Submitting solution:", {
          puzzle: currentPuzzle.title,
          solution: currentPuzzle.solution,
          solutionType: typeof currentPuzzle.solution,
          isArray: Array.isArray(currentPuzzle.solution),
        });

        if (isLiveCompetition) {
          // Submit to live competition system
          const res = await liveCompetitionAPI.submitSolution(
            competitionData._id,
            currentPuzzle.id,
            currentPuzzle.solution,
            timeTaken
          );

          if (res && res.success && res.scoreEarned) {
            // Only update UI after successful backend response
            setSolvedCount((prev) => prev + 1);
            setPuzzleStatuses((prev) => ({
              ...prev,
              [currentPuzzle.id]: "success",
            }));
            setScore((prev) => prev + res.scoreEarned);
            toast.success(
              `Correct! +${res.scoreEarned} points! Leaderboard updated!`
            );
          } else {
            toast.error(res?.message || "Solution validation failed");
            return; // Don't proceed to next puzzle
          }
        } else {
          // Submit to regular competition system
          const res = await competitionAPI.submitSolution(
            competitionData._id,
            currentPuzzle.id,
            currentPuzzle.solution,
            timeTaken
          );

          if (res.points) {
            // Only update UI after successful backend response
            setSolvedCount((prev) => prev + 1);
            setPuzzleStatuses((prev) => ({
              ...prev,
              [currentPuzzle.id]: "success",
            }));
            setScore((prev) => prev + res.points);
            toast.success(`Correct! +${res.points} points!`);
          } else {
            toast.error("Solution validation failed");
            return; // Don't proceed to next puzzle
          }
        }
      } catch (error) {
        console.error("Submission failed:", error);
        toast.error(`Submission failed: ${error.message}`);
        return; // Don't proceed to next puzzle
      } finally {
        setSolving(false);
      }
    } else {
      // No competition, just mark as solved locally
      setSolvedCount((prev) => prev + 1);
      setPuzzleStatuses((prev) => ({ ...prev, [currentPuzzle.id]: "success" }));
      toast.success("Correct! +10 pts");
    }

    // Move to next puzzle only after successful submission
    setStartTime(Date.now()); // Reset puzzle timer
    setTimeout(() => {
      if (currentPuzzleIndex < puzzles.length - 1) {
        setCurrentPuzzleIndex((prev) => prev + 1);
      } else {
        toast.success("All puzzles ENDED!");
        // End flow
        if (paramCompetitionId && isLiveCompetition) {
          // Auto-submit for live competition
          // We can just call the submit handler
          handleSubmitCompetition();
        } else if (competitionData) {
          navigate("/");
        }
      }
    }, 1000);
  };

  const handleWrongMove = () => {
    const currentPuzzle = puzzles[currentPuzzleIndex];
    if (!currentPuzzle) return;

    const puzzleId = currentPuzzle.id || currentPuzzle._id;

    // Check if already marked as failed
    if (puzzleStatuses[puzzleId] === "failed") return;

    // Mark as failed and lock the puzzle
    setPuzzleStatuses((prev) => ({ ...prev, [puzzleId]: "failed" }));
    toast.error("Incorrect! This puzzle is now locked.");
  };

  // Handle early submission
  const handleSubmitCompetition = async () => {
    if (!competitionData || !isLiveCompetition) return;

    try {
      setSubmitting(true);

      const response = await liveCompetitionAPI.submitCompetition(
        competitionData._id
      );

      if (response.success) {
        toast.success("Submitted! Returning to lobby...");
        setShowSubmitModal(false);

        // Clear local storage
        const stateKey = `puzzleState_${paramCompetitionId}`;
        localStorage.removeItem(stateKey);

        // Navigate back to Lobby (player waits there with live scores)
        navigate(`/competition/${competitionData._id}/lobby`);
      } else {
        toast.error(response.message || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to submit competition");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if there are unsolved puzzles
  const getUnsolvedCount = () => {
    return puzzles.length - solvedCount;
  };

  const currentPuzzle = puzzles[currentPuzzleIndex];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading your chess training session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Toaster position="top-right" />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div className={styles.titleInfo}>
            <h1>{competitionData ? competitionData.name : "Daily Training"}</h1>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.puzzleProgress}>
            Puzzle {currentPuzzleIndex + 1} / {puzzles.length}
          </div>
          {isLiveCompetition && (
            <div className={styles.liveIndicator}>
              <span className={styles.liveStatus}>🟢 LIVE COMPETITION</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className={styles.mainContent}>
        {/* Left Panel - Stats (Only in Competition) */}
        {competitionData ? (
          <div className={styles.leftPanel}>
            <div className={styles.statCard}>
              <div className={styles.timerDisplay}>
                <FaClock className={styles.timerIcon} />
                <div className={styles.statLabel}>Time Left</div>
                <div className={styles.timerBadge}>{formatTime(timeLeft)}</div>
              </div>

              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Score</div>
                  <div className={`${styles.statValue} ${styles.highlight}`}>
                    {Math.round(score)}
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Solved</div>
                  <div className={styles.statValue}>{solvedCount}</div>
                </div>
              </div>
            </div>

            <div className={styles.statCard} style={{ textAlign: "center" }}>
              <div className={styles.statLabel}>Current Status</div>
              <div
                style={{ fontSize: "1.2rem", color: "#fff", marginTop: "10px" }}
              >
                Compete Mode
              </div>
            </div>

            {/* Submit Competition Button - Only for Live Competitions */}
            {isLiveCompetition && (
              <div className={styles.statCard} style={{ textAlign: "center" }}>
                <button
                  className={`${styles.actionBtn} ${styles.btnSubmit}`}
                  onClick={() => setShowSubmitModal(true)}
                  disabled={submitting}
                  style={{ width: "100%", fontSize: "1rem", padding: "12px" }}
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className={styles.leftPanel}
            style={{ visibility: "hidden", pointerEvents: "none" }}
          >
            {/* Placeholder to keep layout consistent if needed, or we can remove it */}
          </div>
        )}

        {/* Center Panel - Board */}
        <div className={styles.boardArea}>
          <div className={styles.puzzleInfoBar}>
            <div className={styles.topTitleArea}>
              <h2 className={styles.puzzleTitle}>
                {currentPuzzle?.title || "Chess Puzzle"}
              </h2>
              {currentPuzzle?.description && (
                <span className={styles.puzzleSubtitle}>
                  {currentPuzzle.description}
                </span>
              )}
            </div>
            {currentPuzzle && (
              <div className={styles.puzzleToMove}>
                <div
                  className={`${styles.colorIndicator} ${currentPuzzle.fen.split(" ")[1] === "w"
                    ? styles.white
                    : styles.black
                    }`}
                ></div>
                <span className={styles.moveText}>
                  {currentPuzzle.fen.split(" ")[1] === "w"
                    ? "White to Move"
                    : "Black to Move"}
                </span>
              </div>
            )}
          </div>

          <div className={styles.boardWrapper}>
            {puzzles.length > 0 && currentPuzzle ? (
              <ChessBoard
                key={`${currentPuzzle.id || currentPuzzle._id
                  }-${currentPuzzleIndex}`} // Force re-render on puzzle change
                fen={currentPuzzle.fen}
                solution={currentPuzzle.solution}
                puzzleType={currentPuzzle.puzzleType || currentPuzzle.type}
                kidsConfig={currentPuzzle.kidsConfig}
                onPuzzleSolved={handlePuzzleSolved}
                onWrongMove={handleWrongMove}
                onBoardStateChange={(fen, moveHistory) => {
                  const puzzleId = currentPuzzle.id || currentPuzzle._id;
                  setPuzzleBoardStates(prev => ({
                    ...prev,
                    [puzzleId]: { fen, moveHistory }
                  }));
                }}
                savedBoardState={puzzleBoardStates[currentPuzzle.id || currentPuzzle._id]}
                interactive={
                  !solving &&
                  puzzleStatuses[currentPuzzle.id || currentPuzzle._id] !== "success" &&
                  puzzleStatuses[currentPuzzle.id || currentPuzzle._id] !== "failed"
                }
              />
            ) : (
              <div className={styles.loading}>No Puzzles Available</div>
            )}
          </div>

          {/* Car Race Visualization */}
          {isLiveCompetition && <PuzzleRacer />}

          {/* Moved Title/Description to Top, kept here only if needed for extra info */}
        </div>

        {/* Right Panel - Navigation & Controls */}
        <div className={styles.rightPanel}>
          {/* Show Competition Leaderboard only if it's a competition */}

          {/* Regular Navigation Controls */}
          <div className={styles.controlCard}>
            <div className={styles.controlHeader}>Puzzle Navigation</div>

            <div className={styles.navGrid}>
              {puzzles.map((puzzle, index) => {
                const pid = puzzle.id || puzzle._id;
                const status = puzzleStatuses[pid];
                return (
                  <div
                    key={pid}
                    className={`
                        ${styles.navItem} 
                        ${currentPuzzleIndex === index ? styles.active : ""}
                        ${status === "success" ? styles.success : ""}
                        ${status === "failed" ? styles.danger : ""}
                      `}
                    onClick={() => {
                      if (!solving) {
                        setCurrentPuzzleIndex(index);
                      }
                    }}
                  >
                    {status === "success" ? <FaCheckCircle /> : index + 1}
                  </div>
                );
              })}
            </div>

            <div className={styles.navControls}>
              <button
                className={styles.navArrow}
                onClick={() =>
                  setCurrentPuzzleIndex(Math.max(0, currentPuzzleIndex - 1))
                }
                disabled={currentPuzzleIndex === 0}
              >
                ←
              </button>
              <button
                className={styles.navArrow}
                onClick={() =>
                  setCurrentPuzzleIndex(
                    Math.min(puzzles.length - 1, currentPuzzleIndex + 1)
                  )
                }
                disabled={currentPuzzleIndex === puzzles.length - 1}
              >
                →
              </button>
            </div>

            <div className={styles.controls}>
              <button
                className={styles.actionBtn}
                style={{ marginTop: "10px", fontSize: "0.8rem" }}
                onClick={() => navigate("/")}
              >
                Exit Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Submit Competition?</h3>

            {/* <div className={styles.modalStats}>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Puzzles Solved:</span>
                <span className={styles.modalStatValue}>{solvedCount} / {puzzles.length}</span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Current Score:</span>
                <span className={styles.modalStatValue}>{Math.round(score)} points</span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Time Remaining:</span>
                <span className={styles.modalStatValue}>{formatTime(timeLeft)}</span>
              </div>
            </div> */}

            {getUnsolvedCount() > 0 && (
              <div className={styles.modalWarning}>
                ⚠️ You still have {getUnsolvedCount()} unsolved puzzle
                {getUnsolvedCount() > 1 ? "s" : ""}. Are you sure you want to
                submit now?
              </div>
            )}

            <p className={styles.modalText}>
              Once you submit, you cannot make any more changes to your answers.
              Your final score will be calculated and you'll be taken to the
              leaderboard.
            </p>

            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className={styles.modalSubmit}
                onClick={handleSubmitCompetition}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Competition"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PuzzlePage;
