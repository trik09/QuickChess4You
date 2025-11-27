import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import styles from './ChessBoard.module.css';

const pieceSymbols = {
  'p': '♟︎', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
  'P': '♟︎', 'N': '♞', 'B': '♝', 'R': '♜', 'Q': '♛', 'K': '♚'
};

function normalizeSAN(san) {
  if (!san) return '';
  // Remove trailing check or mate symbols and whitespace for comparison
  return san.replace(/[\+#\s]+$/g, '').trim();
}

function ChessBoard({ fen, solution = [], onPuzzleSolved, onWrongMove }) {
  const [game, setGame] = useState(new Chess(fen));
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [initialFen, setInitialFen] = useState(fen);

  useEffect(() => {
    const newGame = new Chess(fen);
    setGame(newGame);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setFeedback(null);
    setSolutionIndex(0);
    setInitialFen(fen);
  }, [fen]);

  // helper arrays for rendering board
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const getSquare = (file, rank) => file + rank;
  const getPiece = (square) => game.get(square);

  const resetToInitial = (delay = 300) => {
    setFeedback('wrong');
    setTimeout(() => {
      const resetGame = new Chess(initialFen);
      setGame(resetGame);
      setMoveHistory([]);
      setSolutionIndex(0);
      setLastMove(null);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setFeedback(null);
    }, delay);
  };

  // When a white move is made and matches solution, apply black auto-reply (if present)
  const handleUserMove = (from, to) => {
    if (game.turn() !== 'w') {
      // not white's turn — ignore
      return;
    }

    const moveAttempt = { from, to, promotion: 'q' }; 
    let result = null;
    try {
      result = game.move(moveAttempt);
    } catch (e) {
      result = null;
    }
    if (!result) {
      // invalid move
      return;
    }

    const san = result.san;
    const newHistory = [...moveHistory, san];
    setMoveHistory(newHistory);
    setLastMove({ from, to });

    // Check against solution array
    // solution array is expected as: [W1, B1, W2, B2, ...] (SAN strings)
    const expected = solution[solutionIndex] || null;
    // Normalize both for robust matching (+/#)
    if (expected && normalizeSAN(san) === normalizeSAN(expected)) {
      // correct white move
      setFeedback('correct');

      // advance solution index past this white move
      let nextIndex = solutionIndex + 1;

      // If next index exists and is a black reply, apply it instantly
      if (nextIndex < solution.length) {
        const expectedBlackMove = solution[nextIndex];
        // Attempt to play black's reply SAN on the current game state
        // Note: chess.js accepts SAN strings in game.move(san)
        const beforeFen = game.fen();
        const blackResult = game.move(expectedBlackMove);

        if (!blackResult) {
          // Black move in solution was invalid for current position -> treat as wrong puzzle data
          // Revert and treat as wrong (safest for training environment)
          setTimeout(() => {
            resetToInitial();
            if (typeof onWrongMove === 'function') onWrongMove();
          }, 200);
          return;
        }

        // update history and lastMove for black move
        setMoveHistory((prev) => [...prev, blackResult.san]);
        setLastMove({ from: blackResult.from, to: blackResult.to });
        nextIndex = nextIndex + 1;
      }

      // update the solution index to nextIndex
      setSolutionIndex(nextIndex);

      // update game state (clone to trigger re-render)
      setGame(new Chess(game.fen()));

      // check for solved: if we've exhausted solution array OR position is checkmate
      if (nextIndex >= solution.length || game.isCheckmate()) {
        // Slight delay so UI shows final state then solved feedback
        setTimeout(() => {
          setFeedback('solved');
          if (typeof onPuzzleSolved === 'function') onPuzzleSolved();
        }, 50);
      } else {
        // briefly show 'correct' then remove feedback
        setTimeout(() => {
          setFeedback(null);
        }, 600);
      }
    } else {
      // wrong white move: call wrong callback and reset board after short delay
      if (typeof onWrongMove === 'function') onWrongMove();
      resetToInitial(600);
    }
  };

  const handleSquareClick = (square) => {
    // If currently showing solved feedback, ignore clicks
    if (feedback === 'solved') return;

    // If there's a selected square, attempt to move
    if (selectedSquare) {
      // If selectedSquare === clicked square, deselect
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }

      // Attempt to move from selectedSquare -> square (only if it's white's turn)
      // Ensure it's white's turn (puzzles designed for white to move)
      if (game.turn() !== 'w') {
        // not white's turn; deselect
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }

      handleUserMove(selectedSquare, square);
      // clear selection
      setSelectedSquare(null);
      setPossibleMoves([]);
    } else {
      // No selection yet: pick a piece only if it belongs to the side to move (white)
      const piece = getPiece(square);
      if (!piece) return;
      if (piece.color !== 'w' || game.turn() !== 'w') return;

      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true }) || [];
      setPossibleMoves(moves.map((m) => m.to));
    }
  };

  const isLightSquare = (fileIndex, rankIndex) => (fileIndex + rankIndex) % 2 === 0;
  const isSelected = (square) => selectedSquare === square;
  const isPossibleMove = (square) => possibleMoves.includes(square);
  const isLastMove = (square) => lastMove && (lastMove.from === square || lastMove.to === square);

  return (
    <div className={styles.boardContainer}>
      {feedback && (
        <div className={`${styles.feedback} ${styles[feedback]}`}>
          {feedback === 'correct' && '✓ Correct!'}
          {feedback === 'wrong' && '✗ Wrong Move!'}
          {feedback === 'solved' && '🎉 Puzzle Solved!'}
        </div>
      )}
      <div className={styles.board}>
        {ranks.map((rank, rankIndex) => (
          <div key={rank} className={styles.row}>
            {files.map((file, fileIndex) => {
              const square = getSquare(file, rank);
              const piece = getPiece(square);
              const isLight = isLightSquare(fileIndex, rankIndex);

              return (
                <div
                  key={square}
                  className={`
                    ${styles.square}
                    ${isLight ? styles.lightSquare : styles.darkSquare}
                    ${isSelected(square) ? styles.selected : ''}
                    ${isPossibleMove(square) ? styles.possibleMove : ''}
                    ${isLastMove(square) ? styles.lastMove : ''}
                  `}
                  onClick={() => handleSquareClick(square)}
                >
                  {piece && (
                    <div className={`${styles.piece} ${piece.color === 'w' ? styles.whitePiece : styles.blackPiece}`}>
                      {pieceSymbols[piece.type.toUpperCase()]}
                    </div>
                  )}
                  {fileIndex === 0 && (
                    <div className={styles.rankLabel}>{rank}</div>
                  )}
                  {rankIndex === 7 && (
                    <div className={styles.fileLabel}>{file}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChessBoard;
