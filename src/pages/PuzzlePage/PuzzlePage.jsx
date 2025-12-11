import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ChessBoard from "../../components/ChessBoard/ChessBoard";
import { puzzleAPI, competitionAPI } from "../../services/api";
import styles from "./PuzzlePage.module.css";

function PuzzlePage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get competition data from navigation state (if coming from Dashboard)
  const competitionData = location.state || {};
  const competitionId = competitionData.competitionId;
  const competitionTitle = competitionData.competitionTitle;
  const competitionPuzzles = competitionData.puzzles;

  const [currentPuzzle, setCurrentPuzzle] = useState(1);
  const [timeLeft, setTimeLeft] = useState(299);
  const [solvedCount, setSolvedCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [puzzles, setPuzzles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Timer functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchPuzzles = async () => {
      setIsLoading(true);
      setFetchError("");

      try {
        let puzzlesData = [];

        // If we have competition-specific puzzles from navigation state
        if (
          competitionId &&
          competitionPuzzles &&
          competitionPuzzles.length > 0
        ) {
          // Use puzzles passed from the competition
          puzzlesData = competitionPuzzles;
        } else if (competitionId) {
          // Fetch competition details to get its puzzles
          try {
            const response = await competitionAPI.getById(competitionId);
            if (response.success && response.data && response.data.puzzles) {
              puzzlesData = response.data.puzzles;
            }
          } catch (err) {
            console.error("Failed to fetch competition puzzles:", err);
          }
        }

        // If no competition puzzles, fall back to all puzzles
        if (puzzlesData.length === 0) {
          const data = await puzzleAPI.getAll();
          if (Array.isArray(data)) {
            puzzlesData = data;
          }
        }

        // Normalize puzzle data
        const normalized = puzzlesData
          .filter(
            (p) =>
              p?.fen &&
              Array.isArray(p?.solutionMoves) &&
              p.solutionMoves.length
          )
          .map((puzzle, index) => ({
            id: index + 1,
            dbId: puzzle._id,
            type:
              puzzle.title ||
              (puzzle.difficulty
                ? `${puzzle.difficulty} puzzle`
                : `Puzzle ${index + 1}`),
            fen: puzzle.fen,
            solution: puzzle.solutionMoves,
            description: puzzle.description || "Solve the puzzle.",
          }));

        if (!normalized.length) {
          throw new Error("No puzzles available for this competition.");
        }

        if (isMounted) {
          setPuzzles(normalized);
          setCurrentPuzzle(1);
          setFetchError("");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to load puzzles:", error);
          setFetchError(error.message || "Unable to load puzzles.");
          setPuzzles([]);
          setCurrentPuzzle(1);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPuzzles();

    return () => {
      isMounted = false;
    };
  }, [competitionId, competitionPuzzles]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const totalPuzzles = puzzles.length;

  const handlePuzzleSelect = (puzzleNum) => {
    if (puzzleNum >= 1 && puzzleNum <= totalPuzzles) {
      setCurrentPuzzle(puzzleNum);
    }
  };

  const handlePrevPuzzle = () => {
    if (currentPuzzle > 1) {
      setCurrentPuzzle((prev) => prev - 1);
    }
  };

  const handleNextPuzzle = () => {
    if (totalPuzzles && currentPuzzle < totalPuzzles) {
      setCurrentPuzzle((prev) => prev + 1);
    }
  };

  const handlePuzzleSolved = () => {
    setSolvedCount((s) => s + 1);
    setTimeout(() => {
      setCurrentPuzzle((prev) => {
        if (totalPuzzles && prev < totalPuzzles) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);
  };

  const handleWrongMove = () => {
    setWrongCount((w) => w + 1);
  };

  const handleHint = () => {
    const puzzle = puzzles[currentPuzzle - 1] || puzzles[0];
    if (!puzzle || !puzzle.solution?.length) return;
    alert(`First move: ${puzzle.solution[0]}`);
  };

  const handleShowSolution = () => {
    const puzzle = puzzles[currentPuzzle - 1] || puzzles[0];
    if (!puzzle || !puzzle.solution?.length) return;
    alert(`Complete solution:\n${puzzle.solution.join(" → ")}`);
  };

  const handleResetPuzzle = () => {
    const temp = currentPuzzle;
    setCurrentPuzzle(0);
    setTimeout(() => setCurrentPuzzle(temp), 50);
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const puzzleIndex = totalPuzzles
    ? Math.min(Math.max(currentPuzzle - 1, 0), totalPuzzles - 1)
    : 0;
  const puzzle = totalPuzzles ? puzzles[puzzleIndex] : null;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Competition Header */}
        {competitionTitle && (
          <div className={styles.competitionHeader}>
            <button className={styles.backBtn} onClick={handleBackToDashboard}>
              ← Back
            </button>
            <h1 className={styles.competitionTitle}>{competitionTitle}</h1>
            <div className={styles.puzzleProgress}>
              {currentPuzzle} / {totalPuzzles} Puzzles
            </div>
          </div>
        )}

        {/* LEFT PANEL - Timer and Actions */}
        <div className={styles.leftPanel}>
          <div className={styles.timerCard}>
            <div className={styles.timerLabel}>Time Left</div>
            <div className={styles.timer}>{formatTime(timeLeft)}</div>
          </div>

          <div className={styles.statsCard}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Solved</span>
              <span className={styles.statValue}>{solvedCount}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Mistakes</span>
              <span
                className={styles.statValue}
                style={{ color: "var(--error)" }}
              >
                {wrongCount}
              </span>
            </div>
          </div>

          <div className={styles.actionsCard}>
            <button
              className={styles.actionBtn}
              onClick={handleHint}
              title="Get hint"
            >
              <span>💡</span> Hint
            </button>
            <button
              className={styles.actionBtn}
              onClick={handleResetPuzzle}
              title="Reset board"
            >
              <span>🔄</span> Reset
            </button>
            <button
              className={styles.submitBtn}
              onClick={handleShowSolution}
              title="Show solution"
            >
              <span>✓</span> Solution
            </button>
          </div>
        </div>

        {/* CENTER PANEL - Chessboard */}
        <div className={styles.centerPanel}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading puzzles...</p>
            </div>
          ) : fetchError ? (
            <div className={styles.errorState}>
              <p>{fetchError}</p>
              <button
                onClick={handleBackToDashboard}
                className={styles.retryBtn}
              >
                Back to Dashboard
              </button>
            </div>
          ) : puzzle ? (
            <>
              <div className={styles.puzzleInfo}>
                <h2>{puzzle.type}</h2>
                <p>{puzzle.description}</p>
              </div>
              <ChessBoard
                key={`${
                  puzzle.dbId || puzzle.id || "puzzle"
                }-${currentPuzzle}-${puzzle.fen}`}
                fen={puzzle.fen}
                solution={puzzle.solution || []}
                onPuzzleSolved={handlePuzzleSolved}
                onWrongMove={handleWrongMove}
              />
            </>
          ) : (
            <div className={styles.errorState}>
              <p>No puzzles available.</p>
              <button
                onClick={handleBackToDashboard}
                className={styles.retryBtn}
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL - Puzzle Selector */}
        <div className={styles.rightPanel}>
          <div className={styles.puzzleSelector}>
            <h3 className={styles.selectorTitle}>PUZZLES</h3>
            {puzzles.length > 0 ? (
              <>
                <div className={styles.puzzleGrid}>
                  {puzzles.map((p) => (
                    <button
                      key={p.dbId || p.id}
                      className={`${styles.puzzleBtn} ${
                        currentPuzzle === p.id ? styles.active : ""
                      }`}
                      onClick={() => handlePuzzleSelect(p.id)}
                      title={`${p.type}`}
                    >
                      {p.id}
                    </button>
                  ))}
                </div>
                <div className={styles.navigation}>
                  <button
                    className={styles.navBtn}
                    onClick={handlePrevPuzzle}
                    disabled={currentPuzzle === 1}
                  >
                    ◀
                  </button>
                  <button
                    className={styles.navBtn}
                    onClick={handleNextPuzzle}
                    disabled={!totalPuzzles || currentPuzzle === totalPuzzles}
                  >
                    ▶
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.noPuzzles}>
                <p>No puzzles loaded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PuzzlePage;
