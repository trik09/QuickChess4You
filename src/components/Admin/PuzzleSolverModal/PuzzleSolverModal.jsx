import React, { useState, useEffect } from 'react';
import { FaTimes, FaRedo, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import ChessBoard from '../../ChessBoard/ChessBoard';
import styles from './PuzzleSolverModal.module.css';

const PuzzleSolverModal = ({ onClose, puzzleData }) => {
  const [boardKey, setBoardKey] = useState(0); // Used to reset the board
  const [status, setStatus] = useState('playing'); // 'playing', 'solved', 'failed'
  
  // Format the solution moves from the comma-separated string provided by admin
  const formattedSolution = puzzleData.correctMove 
    ? puzzleData.correctMove.split(',').map(m => m.trim()).filter(Boolean)
    : [];

  const handlePuzzleSolved = () => {
    setStatus('solved');
  };

  const handleWrongMove = () => {
    setStatus('failed');
  };

  const handleReset = () => {
    setStatus('playing');
    setBoardKey(prev => prev + 1);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h2>Test Solve: {puzzleData.title || 'Untitled Puzzle'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.statusBanner}>
          {status === 'playing' && <span>Make your move to test the puzzle...</span>}
          {status === 'solved' && <span className={styles.success}><FaCheckCircle /> Puzzle Solved Correctly!</span>}
          {status === 'failed' && <span className={styles.error}><FaTimesCircle /> Incorrect Move</span>}
        </div>

        <div className={styles.boardContainer}>
          <ChessBoard
            key={`test-board-${boardKey}`}
            fen={puzzleData.fen}
            solution={formattedSolution}
            alternativeSolutions={[]} // Admin preview doesn't parse alternatives yet, we can add it later if needed
            isSolved={status === 'solved'}
            isFailed={status === 'failed'}
            onPuzzleSolved={handlePuzzleSolved}
            onWrongMove={handleWrongMove}
            onMoveMade={() => {}} // Used in puzzle page for sound/tracking, we don't need it here
            type={puzzleData.type}
            puzzleType={puzzleData.type}
            captureConfig={puzzleData.captureConfig}
            illegalConfig={{}} // We can use default illegal config. The board handles it.
            firstMoveBy={puzzleData.firstMoveBy}
            reviewMode={false} // Make it act like a real test
            testSolveMode={true} // Enable test solve validation logic
          />
        </div>

        <div className={styles.footer}>
          <div className={styles.info}>
            <span className={styles.badge}>Type: {puzzleData.type}</span>
            {puzzleData.firstMoveBy && <span className={styles.badge}>First Move: {puzzleData.firstMoveBy}</span>}
          </div>
          <button className={styles.resetBtn} onClick={handleReset}>
            <FaRedo /> Reset Board
          </button>
        </div>
      </div>
    </div>
  );
};

export default PuzzleSolverModal;
