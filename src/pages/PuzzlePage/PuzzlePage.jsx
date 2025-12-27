import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaClock, FaUndo, FaCheckCircle } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

import ChessBoard from "../../components/ChessBoard/ChessBoard";
import { puzzleAPI, competitionAPI } from "../../services/api";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import { useAuth } from "../../contexts/AuthContext";
import CompetitionLeaderboard from "../../components/CompetitionLeaderboard/CompetitionLeaderboard";
import styles from "./PuzzlePage.module.css";

function PuzzlePage() {
  const { id: paramCompetitionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [competitionData, setCompetitionData] = useState(null);
  const [puzzles, setPuzzles] = useState([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [isLiveCompetition, setIsLiveCompetition] = useState(false);

  const [puzzleStatuses, setPuzzleStatuses] = useState({}); // { [puzzleId]: 'success' | 'failed' }

  // Timer & Score
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [score, setScore] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  // Refs for tracking without re-renders
  const timerRef = useRef(null);
  const isLoadedRef = useRef(false);

  // 1. Initial Data Fetch & Restore
  useEffect(() => {
    loadPuzzleContext();
    return () => clearInterval(timerRef.current);
  }, [paramCompetitionId]);

  // Persist State
  useEffect(() => {
    if (!loading && puzzles.length > 0 && isLoadedRef.current) {
      const stateKey = `puzzleState_${paramCompetitionId || 'casual'}`;
      const stateToSave = {
        currentPuzzleIndex,
        timeLeft,
        score,
        solvedCount,
        puzzleStatuses
      };
      localStorage.setItem(stateKey, JSON.stringify(stateToSave));
    }
  }, [currentPuzzleIndex, timeLeft, score, solvedCount, puzzleStatuses, loading, paramCompetitionId, puzzles]);

  const loadPuzzleContext = async () => {
    try {
      setLoading(true);

      // Check if this is a competition
      if (paramCompetitionId) {
        // Fetch competition data to ensure we have fresh state (start time, duration, puzzles)
        const response = await competitionAPI.getById(paramCompetitionId);

        if (!response.success || !response.data) {
          throw new Error("Failed to load competition data");
        }

        const comp = response.data;
        setCompetitionData(comp);

        // Check if this is a live competition (status is 'live')
        const isLive = comp.status === 'live';
        setIsLiveCompetition(isLive);

        // If it's a live competition, ensure user is registered as participant
        if (isLive) {
          try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            await liveCompetitionAPI.participate(paramCompetitionId, user.username || user.name);
            console.log('Successfully registered for live competition');
          } catch (error) {
            console.log('Participation registration failed (might already be registered):', error.message);
            // This is expected if user is already participating
          }
        }

        // Check if competition is active
        const now = new Date();
        const start = new Date(comp.startTime);
        const end = new Date(comp.endTime);

        if (now < start) {
          toast.error("Competition has not started yet!");
          navigate('/profile');
          return;
        }

        if (now > end) {
          toast.error("Competition has ended!");
          navigate(`/profile`); // Redirect to competitions list instead of admin
          return;
        }

        // Restore State if exists
        const stateKey = `puzzleState_${paramCompetitionId}`;
        const savedState = localStorage.getItem(stateKey);
        let restoredIndex = 0;

        if (savedState) {
          const parsed = JSON.parse(savedState);
          setTimeLeft(parsed.timeLeft);
          setScore(parsed.score);
          setSolvedCount(parsed.solvedCount);
          setPuzzleStatuses(parsed.puzzleStatuses || {});
          restoredIndex = parsed.currentPuzzleIndex || 0;
          setCurrentPuzzleIndex(restoredIndex);
        } else {
          // Calculate Time Remaining for User Default
          const msUntilEnd = end - now;
          const secondsLeft = Math.floor(msUntilEnd / 1000);
          setTimeLeft(secondsLeft);
        }

        startTimer();

        // Load Puzzles
        if (comp.puzzles && comp.puzzles.length > 0) {
          // Normalize puzzles - ensure we have proper FEN and solution data
          const normalized = comp.puzzles.map((p, index) => ({
            id: p._id,
            _id: p._id, // Keep both for compatibility
            index: index + 1,
            fen: p.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Default starting position if no FEN
            solution: p.solutionMoves || [],
            title: p.title || `Puzzle ${index + 1}`,
            type: p.type === 'kids' ? 'Kids' : (p.title || `${p.difficulty || 'Medium'} Puzzle`),
            difficulty: p.difficulty || 'medium',
            description: p.description || '',
            kidsConfig: p.kidsConfig,
            puzzleType: p.type || 'normal'
          }));
          setPuzzles(normalized);
        } else {
          toast.error("No puzzles found in this competition!");
          navigate('/competitions');
          return;
        }

      } else {
        // Casual Mode (Dashboard link)
        const data = await puzzleAPI.getAll();
        const normalized = data
          .filter(p => p.fen && (p.solutionMoves?.length || p.kidsConfig))
          .map((p, i) => ({
            id: p._id,
            index: i + 1,
            fen: p.fen,
            solution: p.solutionMoves,
            type: p.type,
            description: p.description,
            kidsConfig: p.kidsConfig,
            puzzleType: p.type
          }));
        setPuzzles(normalized);

        // Restore Casual State
        const stateKey = `puzzleState_casual`;
        const savedState = localStorage.getItem(stateKey);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setTimeLeft(parsed.timeLeft); // Or reset for casual? Usually keep persistence
          setScore(parsed.score);
          setSolvedCount(parsed.solvedCount);
          setPuzzleStatuses(parsed.puzzleStatuses || {});
          setCurrentPuzzleIndex(parsed.currentPuzzleIndex || 0);
        } else {
          setTimeLeft(300); // Default 5 mins for casual
        }
        startTimer();
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
      setTimeLeft(prev => {
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
    // Clear storage on timeout? Maybe not, to show results.
    // Wait a bit then redirect
    setTimeout(() => {
      if (paramCompetitionId) {
        navigate(`/`); // Redirect to competitions list instead of admin
      } else {
        navigate('/dashboard');
      }
    }, 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePuzzleSolved = async () => {
    const currentPuzzle = puzzles[currentPuzzleIndex];
    if (!currentPuzzle) return;

    // Check if already solved
    if (puzzleStatuses[currentPuzzle.id] === 'success') return;

    // Calculate time taken for this puzzle (simple approximation)
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    // Submit to Backend first (no optimistic update)
    if (competitionData) {
      try {
        setSolving(true);
        
        console.log('Submitting solution:', {
          puzzle: currentPuzzle.title,
          solution: currentPuzzle.solution,
          solutionType: typeof currentPuzzle.solution,
          isArray: Array.isArray(currentPuzzle.solution)
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
            setSolvedCount(prev => prev + 1);
            setPuzzleStatuses(prev => ({ ...prev, [currentPuzzle.id]: 'success' }));
            setScore(prev => prev + res.scoreEarned);
            toast.success(`Correct! +${res.scoreEarned} points! Leaderboard updated!`);
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
            setSolvedCount(prev => prev + 1);
            setPuzzleStatuses(prev => ({ ...prev, [currentPuzzle.id]: 'success' }));
            setScore(prev => prev + res.points);
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
      setSolvedCount(prev => prev + 1);
      setPuzzleStatuses(prev => ({ ...prev, [currentPuzzle.id]: 'success' }));
      toast.success("Correct! +10 pts");
    }

    // Move to next puzzle only after successful submission
    setStartTime(Date.now()); // Reset puzzle timer
    setTimeout(() => {
      if (currentPuzzleIndex < puzzles.length - 1) {
        setCurrentPuzzleIndex(prev => prev + 1);
      } else {
        toast.success("All puzzles completed!");
        // End flow
        if (competitionData) {
          navigate('/dashboard'); // Redirect to competitions list instead of admin
        }
      }
    }, 1000);
  };

  const handleWrongMove = () => {
    const currentPuzzle = puzzles[currentPuzzleIndex];
    if (currentPuzzle) {
      setPuzzleStatuses(prev => ({ ...prev, [currentPuzzle.id]: 'failed' }));
    }
    toast.error("Incorrect move, try again!");
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
            <h1>{competitionData ? competitionData.name : 'Daily Training'}</h1>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.puzzleProgress}>
            Puzzle {currentPuzzleIndex + 1} / {puzzles.length}
          </div>
          {isLiveCompetition && (
            <div className={styles.liveIndicator}>
              <span className={styles.liveStatus}>
                🟢 LIVE COMPETITION
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className={styles.mainContent}>

        {/* Left Panel - Stats */}
        <div className={styles.leftPanel}>
          <div className={styles.statCard}>
            <div className={styles.timerDisplay}>
              <FaClock className={styles.timerIcon} />
              <div className={styles.statLabel}>Time Left</div>
              <div className={styles.timerBadge}>
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Score</div>
                <div className={`${styles.statValue} ${styles.highlight}`}>{Math.round(score)}</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Solved</div>
                <div className={styles.statValue}>{solvedCount}</div>
              </div>
            </div>
          </div>

          <div className={styles.statCard} style={{ textAlign: 'center' }}>
            <div className={styles.statLabel}>Current Status</div>
            <div style={{ fontSize: '1.2rem', color: '#fff', marginTop: '10px' }}>
              {competitionData ? 'Compete Mode' : 'Practice Mode'}
            </div>
          </div>
        </div>

        {/* Center Panel - Board */}
        <div className={styles.boardArea}>
          <div className={styles.puzzleInfoBar}>
            {currentPuzzle && (
              <div className={styles.puzzleToMove}>
                <div className={`${styles.colorIndicator} ${currentPuzzle.fen.split(' ')[1] === 'w' ? styles.white : styles.black}`}></div>
                <span className={styles.moveText}>
                  {currentPuzzle.fen.split(' ')[1] === 'w' ? "White to Move" : "Black to Move"}
                </span>
              </div>
            )}
          </div>

          <div className={styles.boardWrapper}>
            {puzzles.length > 0 && currentPuzzle ? (
              <ChessBoard
                key={`${currentPuzzle.id || currentPuzzle._id}-${currentPuzzleIndex}`} // Force re-render on puzzle change
                fen={currentPuzzle.fen}
                solution={currentPuzzle.solution}
                puzzleType={currentPuzzle.puzzleType || currentPuzzle.type}
                kidsConfig={currentPuzzle.kidsConfig}
                onPuzzleSolved={handlePuzzleSolved}
                onWrongMove={handleWrongMove}
                interactive={!solving && puzzleStatuses[currentPuzzle.id || currentPuzzle._id] !== 'success'}
              />
            ) : (
              <div className={styles.loading}>No Puzzles Available</div>
            )}
          </div>

          <div className={styles.puzzleInstructions} style={{ marginTop: '20px' }}>
            <h3>{currentPuzzle?.title || currentPuzzle?.type || 'Chess Puzzle'}</h3>
            {currentPuzzle?.description && (
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
                {currentPuzzle.description}
              </p>
            )}
          </div>
        </div>

        {/* Right Panel - Navigation & Controls */}
        <div className={styles.rightPanel}>
          {/* Show Competition Leaderboard if it's a competition */}
          {competitionData && (
            <div className={styles.leaderboardSection}>
              <CompetitionLeaderboard 
                competitionId={competitionData._id} 
                isLive={isLiveCompetition}
              />
            </div>
          )}

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
                        ${currentPuzzleIndex === index ? styles.active : ''}
                        ${status === 'success' ? styles.success : ''}
                        ${status === 'failed' ? styles.danger : ''}
                      `}
                    onClick={() => {
                      if (!solving) {
                        setCurrentPuzzleIndex(index);
                      }
                    }}
                  >
                    {status === 'success' ? <FaCheckCircle /> : (index + 1)}
                  </div>
                );
              })}
            </div>

            <div className={styles.navControls}>
              <button
                className={styles.navArrow}
                onClick={() => setCurrentPuzzleIndex(Math.max(0, currentPuzzleIndex - 1))}
                disabled={currentPuzzleIndex === 0}
              >
                ←
              </button>
              <button
                className={styles.navArrow}
                onClick={() => setCurrentPuzzleIndex(Math.min(puzzles.length - 1, currentPuzzleIndex + 1))}
                disabled={currentPuzzleIndex === puzzles.length - 1}
              >
                →
              </button>
            </div>

            <div className={styles.controls}>
              <button className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={() => {
                // Reset current puzzle to initial position
                if (currentPuzzle) {
                  const puzzleId = currentPuzzle.id || currentPuzzle._id;
                  setPuzzleStatuses(prev => {
                    const newStatuses = { ...prev };
                    delete newStatuses[puzzleId]; // Remove any previous status
                    return newStatuses;
                  });
                  // Force board reset by updating the key
                  setCurrentPuzzleIndex(prev => prev); // Trigger re-render
                  toast.success('Board reset!');
                }
              }}>
                <FaUndo /> Reset Board
              </button>

              <button className={styles.actionBtn} style={{ marginTop: '10px', fontSize: '0.8rem' }} onClick={() => navigate('/dashboard')}>
                Exit Session
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default PuzzlePage;

