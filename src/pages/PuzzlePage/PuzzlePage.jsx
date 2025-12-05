import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import ChessBoard from '../../components/ChessBoard/ChessBoard';
import styles from './PuzzlePage.module.css';

function PuzzlePage() {
  const [currentPuzzle, setCurrentPuzzle] = useState(1);
  const [timeLeft, setTimeLeft] = useState(299);
  const [solvedCount, setSolvedCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

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

  // ---------------------------------------------------------
  // UPDATED PUZZLE DATABASE (Total: 6)
  // Includes 3 Classic verified puzzles + 3 Custom User Puzzles
  // ---------------------------------------------------------
  const puzzles = [
    // --- KEEPING 3 CURRENT WORKING PUZZLES ---
    {
      id: 1,
      type: 'Mate in 1',
      fen: '6k1/3R1ppp/8/8/8/8/5PPP/6K1 w - - 0 1',
      solution: ['Rd8#'],
      description: 'White to move. The opponent\'s king is trapped behind their own pawns.'
    },
    {
      id: 2,
      type: 'Mate in 1',
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
      solution: ['Qxf7#'],
      description: 'White to move. Deliver the checkmate on the weak f7 square (Scholar\'s Mate).'
    },
{
      id: 3,
      type: 'Mate in 2',
      // FIXED: Changed last digit from 0 to 1
      fen: '4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 1 1',
      solution: ['Qb8+', 'Nxb8', 'Rd8#'],
      description: 'White to move. A famous Queen sacrifice leading to checkmate.'
    },

    // --- ADDING THE 3 NEW REQUESTED PUZZLES ---
    {
      id: 4,
      type: 'Find the best move',
      // Discovered Check / Windmill Theme
      fen: 'r5rk/5p1p/5R2/4B3/8/8/7P/7K w - - 0 1',
      solution: ['Rg6+', 'f6', 'Bxf6+', 'Rg7', 'Rxg7'], 
      // Note: Rxg7 is decisive. White can then mate with Rg5# or similar next, but this sequence wins.
      description: 'White to move. Use the discovered check from the Bishop to dismantle the defense.'
    },
    {
      id: 5,
      type: 'Mate in 2',
      // Absolute Pin Theme
      fen: '1R6/6pk/6np/p6Q/P2p4/3P4/K1P5/8 w - - 0 1',
      solution: ['Qf5', 'h5', 'Qxh5#'], 
      // Qf5 pins the Knight (g6) to the King (h7). Black is helpless.
      description: 'White to move. Pin the Knight to the King to force a checkmate.'
    },
    {
      id: 6,
      type: 'Pin to Win',
      // Long Diagonal Pin
      fen: '7k/8/8/4n3/4P3/8/8/6BK w - - 0 1',
      solution: ['Bd4', 'Kg8', 'Bxe5'],
      // Bd4 pins the Knight (e5) to the King (h8).
      description: 'White to move. Use the Bishop to pin the Knight to the King and win the piece.'
    }
  ];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePuzzleSelect = (puzzleNum) => {
    setCurrentPuzzle(puzzleNum);
  };

  const handlePrevPuzzle = () => {
    if (currentPuzzle > 1) {
      setCurrentPuzzle(currentPuzzle - 1);
    }
  };

  const handleNextPuzzle = () => {
    if (currentPuzzle < puzzles.length) {
      setCurrentPuzzle(currentPuzzle + 1);
    }
  };

  const handlePuzzleSolved = () => {
    setSolvedCount((s) => s + 1);
    setTimeout(() => {
      if (currentPuzzle < puzzles.length) {
        setCurrentPuzzle(currentPuzzle + 1);
      }
    }, 1200);
  };

  const handleWrongMove = () => {
    setWrongCount((w) => w + 1);
  };

  const handleHint = () => {
    const puzzle = puzzles.find(p => p.id === currentPuzzle);
    if (!puzzle) return;
    alert(`First move: ${puzzle.solution[0]}`);
  };

  const handleShowSolution = () => {
    const puzzle = puzzles.find(p => p.id === currentPuzzle);
    if (!puzzle) return;
    alert(`Complete solution:\n${puzzle.solution.join(' → ')}`);
  };

  const handleResetPuzzle = () => {
    const temp = currentPuzzle;
    setCurrentPuzzle(0);
    setTimeout(() => setCurrentPuzzle(temp), 50);
  };

  const puzzle = puzzles.find(p => p.id === currentPuzzle) || puzzles[0];

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
          <div className={styles.puzzleInfo}>
            <h2>{puzzle.type}</h2>
            <p>{puzzle.description}</p>
          </div>
          <ChessBoard
            key={`${puzzle.id}-${puzzle.fen}`} 
            fen={puzzle.fen}
            solution={puzzle.solution}
            onPuzzleSolved={handlePuzzleSolved}
            onWrongMove={handleWrongMove}
          />
        </div>

        {/* RIGHT PANEL - Puzzle Selector */}
        <div className={styles.rightPanel}>
          <div className={styles.puzzleSelector}>
            <h3 className={styles.selectorTitle}>PUZZLES</h3>
            <div className={styles.puzzleGrid}>
              {puzzles.map((p) => (
                <button
                  key={p.id}
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
                disabled={currentPuzzle === puzzles.length}
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