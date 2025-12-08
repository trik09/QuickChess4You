import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import ChessBoard from '../../components/ChessBoard/ChessBoard';
import { puzzleAPI } from '../../services/api';
import styles from './PuzzlePage.module.css';

// Real chess puzzles with verified solutions (solution arrays expected as [W1, B1, W2, B2, ...])
// const samplePuzzles = [
//   {
//     id: 1,
//     type: 'Fork',
//     fen: '2q3k1/8/8/5N2/6P1/7K/8/8 w - - 0 1',
//     solution: ['Ne7+', 'Kf7', 'Nxc8'],
//     description: 'White to move. Play the winning tactic and win the queen.'
//   },

//   {
//     id: 2,
//     type: 'Mate in 2',
//     fen: 'r4r1k/ppn1NBpp/4b3/4P3/3p1R2/1P6/P1P3PP/R5K1 w - - 0 1',
//     solution: ['Ng6+', 'hxg6', 'Rh4#'],
//     description: 'White to move. Force checkmate in 2 moves.'
//   },

//   {
//     id: 3,
//     type: 'Mate in 2',
//     fen: '1R4rk/6bp/8/4B3/8/1K6/7Q/8 w - - 0 1',
//     solution: ['Qxh7#'],
//     description: 'White to move. Find the checkmate in 1 move.'
//   },
//   {
//     id: 4,
//     type: 'Mate in 1',
//     fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
//     solution: ['Re8#'],
//     description: 'White to move. Find the checkmate in 1 move.'
//   },
//   {
//     id: 5,
//     type: 'Mate in 2',
//     fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1',
//     // this solution is given as W,B,W ... ensure moves are SAN strings accurate for the position
//     solution: ['Bxf7+', 'Kxf7', 'Ng5#'],
//     description: 'White to move. Find checkmate in 2 moves.'
//   },
//   {
//     id: 6,
//     type: 'Mate in 2',
//     fen: 'r1bqkb1r/pppp1ppp/2n5/4p2Q/2BnP3/5N2/PPPP1PPP/RNB1K2R w KQkq - 0 1',
//     solution: ['Qxf7+', 'Kd7', 'Qe7#'],
//     description: 'White to move. Find checkmate in 2 moves.'
//   },
//   {
//     id: 7,
//     type: 'Mate in 2',
//     fen: 'r2qkb1r/pp2nppp/3p4/2pNN1B1/2BnP3/3P4/PPP2PPP/R2bK2R w KQkq - 0 1',
//     solution: ['Nf6+', 'gxf6', 'Bxf7#'],
//     description: 'White to move. Find checkmate in 2 moves.'
//   },
//   {
//     id: 8,
//     type: 'Mate in 2',
//     fen: '5rk1/pp3ppp/2p5/2b5/4PQ2/2P3P1/P4P1P/5RK1 w - - 0 1',
//     solution: ['Qf7+', 'Kh8', 'Qg7#'],
//     description: 'White to move. Find checkmate in 2 moves.'
//   },
//   {
//     id: 9,
//     type: 'Mate in 3',
//     fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 1',
//     solution: ['Bxf7+', 'Kxf7', 'Ng5+', 'Kg8', 'Qh5', 'h6', 'Qh7#'],
//     description: 'White to move. Find checkmate in 3 moves.'
//   },
//   {
//     id: 10,
//     type: 'Mate in 3',
//     fen: 'r2qkb1r/ppp2ppp/2n5/3Pp3/2B5/8/PPP2PPP/RNBQK2R w KQkq - 0 1',
//     solution: ['Qh5+', 'g6', 'Qxg6+', 'hxg6', 'Bxf7#'],
//     description: 'White to move. Find checkmate in 3 moves.'
//   }
// ];

function PuzzlePage() {
  const [currentPuzzle, setCurrentPuzzle] = useState(1);
  const [timeLeft, setTimeLeft] = useState(299);
  const [solvedCount, setSolvedCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [puzzles, setPuzzles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

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
      try {
        const data = await puzzleAPI.getAll();
        console.log(data.data);

        if (!Array.isArray(data)) {
          throw new Error('Unexpected puzzle response');
        }

        const normalized = data
          .filter((p) => p?.fen && Array.isArray(p?.solutionMoves) && p.solutionMoves.length)
          .map((puzzle, index) => ({
            id: index + 1,
            dbId: puzzle._id,
            type: puzzle.title || (puzzle.difficulty ? `${puzzle.difficulty} puzzle` : `Puzzle ${index + 1}`),
            fen: puzzle.fen,
            solution: puzzle.solutionMoves,
            description: puzzle.description || 'Solve the puzzle.',
          }));

        if (!normalized.length) {
          throw new Error('No ready puzzles returned. Showing sample set.');
        }

        if (isMounted) {
          setPuzzles(normalized);
          setCurrentPuzzle(1);
          setFetchError('');
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load puzzles:', error);
          setFetchError(error.message || 'Unable to load live puzzles. Showing sample set.');
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
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalPuzzles = puzzles.length;

  const handlePuzzleSelect = (puzzleNum) => {
    if (puzzleNum >= 1 && puzzleNum <= totalPuzzles) {
      setCurrentPuzzle(puzzleNum);
      // reset timer or other state if you want when switching
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
    // Auto-advance to next puzzle after a short delay so user sees "solved"
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
    alert(`Complete solution:\n${puzzle.solution.join(' → ')}`);
  };

  const handleResetPuzzle = () => {
    // Reset by re-mounting chessboard: change key by toggling currentPuzzle briefly
    const temp = currentPuzzle;
    setCurrentPuzzle(0);
    setTimeout(() => setCurrentPuzzle(temp), 50);
  };

  const puzzleIndex = totalPuzzles ? Math.min(Math.max(currentPuzzle - 1, 0), totalPuzzles - 1) : 0;
  const puzzle = totalPuzzles ? puzzles[puzzleIndex] : null;

  return (
    <div className={styles.container}>
      <Navbar isLoggedIn={true} />

      <div className={styles.content}>
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
              <span className={styles.statValue}>{wrongCount}</span>
            </div>
          </div>

          <div className={styles.actionsCard}>
            <button className={styles.actionBtn} onClick={handleHint} title="Get hint">
              <span>💡</span> Hint
            </button>
            <button className={styles.actionBtn} onClick={handleResetPuzzle} title="Reset board">
              <span>🔄</span> Reset
            </button>
            <button className={styles.submitBtn} onClick={handleShowSolution} title="Show solution">
              <span>✓</span> Solution
            </button>
          </div>
        </div>

        {/* CENTER PANEL - Chessboard */}
        <div className={styles.centerPanel}>
          {puzzle && (
            <div className={styles.puzzleInfo}>
              <h2>{puzzle.type}</h2>
              <p>{puzzle.description}</p>
              {(isLoading || fetchError) && (
                <p className={styles.statusMessage}>
                  {isLoading ? 'Loading puzzles…' : fetchError}
                </p>
              )}
            </div>
          )}
          {puzzle && (
            <ChessBoard
              key={`${puzzle.dbId || puzzle.id || 'puzzle'}-${currentPuzzle}-${puzzle.fen}`}
              fen={puzzle.fen}
              solution={puzzle.solution || []}
              onPuzzleSolved={handlePuzzleSolved}
              onWrongMove={handleWrongMove}
            />
          )}
        </div>

        {/* RIGHT PANEL - Puzzle Selector */}
        <div className={styles.rightPanel}>
          <div className={styles.puzzleSelector}>
            <h3 className={styles.selectorTitle}>PUZZLES</h3>
            <div className={styles.puzzleGrid}>
              {puzzles.map((p) => (
                <button
                  key={p.dbId || p.id}
                  className={`${styles.puzzleBtn} ${currentPuzzle === p.id ? styles.active : ''}`}
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default PuzzlePage;
