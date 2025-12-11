import { useState, useEffect } from 'react';
import { FaChess, FaArrowRight, FaLightbulb, FaCheckCircle, FaTimesCircle, FaRedo } from 'react-icons/fa';
import ChessBoard from '../../components/ChessBoard/ChessBoard';
import { puzzleAPI } from '../../services/api';
import styles from './CasualPuzzlePage.module.css';

function CasualPuzzlePage() {
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNextPuzzle();
  }, []);

  const fetchNextPuzzle = async () => {
    setIsLoading(true);
    setError(null);
    setShowHint(false);
    setFeedback(null);
    
    try {
      // Fetch puzzle from backend (which proxies Lichess API)
      const puzzle = await puzzleAPI.getRandomPuzzle();
      setCurrentPuzzle(puzzle);
    } catch (error) {
      console.error('Failed to fetch puzzle:', error);
      setError(error.message || 'Failed to load puzzle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePuzzleSolved = () => {
    setFeedback('correct');
    setSolvedCount(prev => prev + 1);
    
    // Auto-advance after 2 seconds
    setTimeout(() => {
      fetchNextPuzzle();
    }, 2000);
  };

  const handleWrongMove = () => {
    setFeedback('wrong');
    setTimeout(() => {
      setFeedback(null);
    }, 2000);
  };

  const handleSkip = () => {
    fetchNextPuzzle();
  };

  const handleRetry = () => {
    setFeedback(null);
    setShowHint(false);
    // Force re-render of chessboard
    const temp = currentPuzzle;
    setCurrentPuzzle(null);
    setTimeout(() => setCurrentPuzzle(temp), 50);
  };

  if (isLoading && !currentPuzzle) {
    return (
      <div className={styles.loading}>
        <FaChess className={styles.loadingIcon} />
        <p>Loading puzzle from Lichess...</p>
      </div>
    );
  }

  if (error && !currentPuzzle) {
    return (
      <div className={styles.empty}>
        <FaChess className={styles.emptyIcon} />
        <h2>Failed to Load Puzzle</h2>
        <p>{error}</p>
        <button className={styles.retryBtn} onClick={fetchNextPuzzle}>
          <FaRedo /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.casualPuzzlePage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <FaChess className={styles.headerIcon} />
          <div>
            <h1>Chess Puzzles</h1>
            <p>Solve puzzles at your own pace</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Solved Today</span>
            <span className={styles.statValue}>{solvedCount}</span>
          </div>
          {currentPuzzle && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Rating</span>
              <span className={styles.statValue}>{currentPuzzle.rating}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Left Side - Puzzle Info */}
        <div className={styles.puzzleInfo}>
          <div className={styles.puzzleHeader}>
            <h2>{currentPuzzle?.title || 'Puzzle'}</h2>
            <div className={styles.badges}>
              <span className={`${styles.badge} ${styles[currentPuzzle?.difficulty]}`}>
                {currentPuzzle?.difficulty}
              </span>
              {currentPuzzle?.themes && currentPuzzle.themes.length > 0 && (
                <span className={styles.categoryBadge}>
                  {currentPuzzle.themes[0]}
                </span>
              )}
              <span className={styles.lichessBadge}>
                ♞ Lichess
              </span>
            </div>
          </div>

          {currentPuzzle?.description && (
            <div className={styles.description}>
              <p>{currentPuzzle.description}</p>
            </div>
          )}

          {/* Hint Section */}
          <div className={styles.hintSection}>
            <button
              className={styles.hintBtn}
              onClick={() => setShowHint(!showHint)}
            >
              <FaLightbulb />
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
            {showHint && currentPuzzle?.description && (
              <div className={styles.hint}>
                <p>{currentPuzzle.description}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button className={styles.retryBtn} onClick={handleRetry}>
              <FaRedo /> Retry
            </button>
            
            <button className={styles.skipBtn} onClick={handleSkip}>
              <FaArrowRight /> Next Puzzle
            </button>
          </div>

          {/* Puzzle Info */}
          {currentPuzzle && (
            <div className={styles.puzzleStats}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Puzzle ID:</span>
                <span className={styles.statText}>{currentPuzzle.id}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Played:</span>
                <span className={styles.statText}>{currentPuzzle.plays.toLocaleString()} times</span>
              </div>
              {currentPuzzle.themes && currentPuzzle.themes.length > 0 && (
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Themes:</span>
                  <div className={styles.themeTags}>
                    {currentPuzzle.themes.slice(0, 3).map((theme, idx) => (
                      <span key={idx} className={styles.themeTag}>{theme}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Chess Board */}
        <div className={styles.boardSection}>
          {feedback && (
            <div className={`${styles.feedback} ${styles[feedback]}`}>
              {feedback === 'correct' ? (
                <>
                  <FaCheckCircle /> Correct! Well done!
                </>
              ) : (
                <>
                  <FaTimesCircle /> Try again!
                </>
              )}
            </div>
          )}
          
          {currentPuzzle && (
            <ChessBoard
              fen={currentPuzzle.fen}
              solution={currentPuzzle.solutionMoves}
              onPuzzleSolved={handlePuzzleSolved}
              onWrongMove={handleWrongMove}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default CasualPuzzlePage;
