import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './ChessBoard.module.css';

// Import chess piece SVGs - Set 1 (pieces folder)
import whitePawn1 from '../../assets/pieces/whitepawn.svg';
import whiteKnight1 from '../../assets/pieces/whiteknight.svg';
import whiteBishop1 from '../../assets/pieces/whitebishop.svg';
import whiteRook1 from '../../assets/pieces/whiterook.svg';
import whiteQueen1 from '../../assets/pieces/whitequeen.svg';
import whiteKing1 from '../../assets/pieces/whiteking.svg';
import blackPawn1 from '../../assets/pieces/blackpawn.svg';
import blackKnight1 from '../../assets/pieces/blackknight.svg';
import blackBishop1 from '../../assets/pieces/blackbishop.svg';
import blackRook1 from '../../assets/pieces/blackrook.svg';
import blackQueen1 from '../../assets/pieces/blackqueen.svg';
import blackKing1 from '../../assets/pieces/blackking.svg';

// Import chess piece SVGs - Set 2 (pieces2 folder)
import whitePawn2 from '../../assets/pieces2/whitepawn.svg';
import whiteKnight2 from '../../assets/pieces2/whiteknight.svg';
import whiteBishop2 from '../../assets/pieces2/whitebishop.svg';
import whiteRook2 from '../../assets/pieces2/whiterook.svg';
import whiteQueen2 from '../../assets/pieces2/whitequeen.svg';
import whiteKing2 from '../../assets/pieces2/whiteking.svg';
import blackPawn2 from '../../assets/pieces2/blackpawn.svg';
import blackKnight2 from '../../assets/pieces2/blackknight.svg';
import blackBishop2 from '../../assets/pieces2/blackbishop.svg';
import blackRook2 from '../../assets/pieces2/blackrook.svg';
import blackQueen2 from '../../assets/pieces2/blackqueen.svg';
import blackKing2 from '../../assets/pieces2/blackking.svg';

// Import chess piece SVGs - Set 3 (pieces3 folder)
import whitePawn3 from '../../assets/pieces3/whitepawn.svg';
import whiteKnight3 from '../../assets/pieces3/whiteknight.svg';
import whiteBishop3 from '../../assets/pieces3/whitebishop.svg';
import whiteRook3 from '../../assets/pieces3/whiterook.svg';
import whiteQueen3 from '../../assets/pieces3/whitequeen.svg';
import whiteKing3 from '../../assets/pieces3/whiteking.svg';
import blackPawn3 from '../../assets/pieces3/blackpawn.svg';
import blackKnight3 from '../../assets/pieces3/blackknight.svg';
import blackBishop3 from '../../assets/pieces3/blackbishop.svg';
import blackRook3 from '../../assets/pieces3/blackrook.svg';
import blackQueen3 from '../../assets/pieces3/blackqueen.svg';
import blackKing3 from '../../assets/pieces3/blackking.svg';

const pieceImageSets = {
  set1: {
    'p': blackPawn1,
    'n': blackKnight1,
    'b': blackBishop1,
    'r': blackRook1,
    'q': blackQueen1,
    'k': blackKing1,
    'P': whitePawn1,
    'N': whiteKnight1,
    'B': whiteBishop1,
    'R': whiteRook1,
    'Q': whiteQueen1,
    'K': whiteKing1
  },
  set2: {
    'p': blackPawn2,
    'n': blackKnight2,
    'b': blackBishop2,
    'r': blackRook2,
    'q': blackQueen2,
    'k': blackKing2,
    'P': whitePawn2,
    'N': whiteKnight2,
    'B': whiteBishop2,
    'R': whiteRook2,
    'Q': whiteQueen2,
    'K': whiteKing2
  },
  set3: {
    'p': blackPawn3,
    'n': blackKnight3,
    'b': blackBishop3,
    'r': blackRook3,
    'q': blackQueen3,
    'k': blackKing3,
    'P': whitePawn3,
    'N': whiteKnight3,
    'B': whiteBishop3,
    'R': whiteRook3,
    'Q': whiteQueen3,
    'K': whiteKing3
  }
};

function normalizeSAN(san) {
  if (!san) return '';
  // Remove trailing check or mate symbols and whitespace for comparison
  return san.replace(/[\+#\s]+$/g, '').trim();
}

function ChessBoard({ fen, solution = [], onPuzzleSolved, onWrongMove }) {
  const { currentBoardColors, pieceSet } = useTheme();
  const [game, setGame] = useState(new Chess(fen));
  
  // Select piece images based on current piece set
  const pieceImages = pieceSet === 'modern' 
    ? pieceImageSets.set2 
    : pieceSet === 'elegant'
    ? pieceImageSets.set3
    : pieceImageSets.set1;
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

              const squareColor = isLight ? currentBoardColors.light : currentBoardColors.dark;

              return (
                <div
                  key={square}
                  className={`
                    ${styles.square}
                    ${isSelected(square) ? styles.selected : ''}
                    ${isPossibleMove(square) ? styles.possibleMove : ''}
                    ${isLastMove(square) ? styles.lastMove : ''}
                  `}
                  style={{ backgroundColor: squareColor }}
                  onClick={() => handleSquareClick(square)}
                >
                  {piece && (
                    <img 
                      src={pieceImages[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]} 
                      alt={`${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}`}
                      className={styles.piece}
                      draggable="false"
                    />
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
