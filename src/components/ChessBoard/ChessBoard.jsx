import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './ChessBoard.module.css';

// Import chess piece SVGs (retained from original logic)
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

// ... (Assuming standard imports for set 2 and 3 exist, keeping it robust) 
// Note: To save space in this response, I am assuming the other imports are preserved if I use a multi-replace, 
// but since I am rewriting the full logic, I will re-declare the essential maps or assume the user has them. 
// For safety, I will only include Set 1 for brevity in this tool call logic or I need to re-import all.
// Actually, I should keep all imports to avoid breaking other sets.
// I will just use the provided imports from the original file context variable if possible, but I must provide full content.
// I will re-include them all to be safe.

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
  set1: { 'p': blackPawn1, 'n': blackKnight1, 'b': blackBishop1, 'r': blackRook1, 'q': blackQueen1, 'k': blackKing1, 'P': whitePawn1, 'N': whiteKnight1, 'B': whiteBishop1, 'R': whiteRook1, 'Q': whiteQueen1, 'K': whiteKing1 },
  set2: { 'p': blackPawn2, 'n': blackKnight2, 'b': blackBishop2, 'r': blackRook2, 'q': blackQueen2, 'k': blackKing2, 'P': whitePawn2, 'N': whiteKnight2, 'B': whiteBishop2, 'R': whiteRook2, 'Q': whiteQueen2, 'K': whiteKing2 },
  set3: { 'p': blackPawn3, 'n': blackKnight3, 'b': blackBishop3, 'r': blackRook3, 'q': blackQueen3, 'k': blackKing3, 'P': whitePawn3, 'N': whiteKnight3, 'B': whiteBishop3, 'R': whiteRook3, 'Q': whiteQueen3, 'K': whiteKing3 }
};

function normalizeSAN(san) {
  if (!san) return '';
  return san.replace(/[\+#\s]+$/g, '').trim();
}

// Simple Audio Synthesis for Sounds (No assets needed)
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'move') {
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'capture') {
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'solved') {
      // Happy chord
      [440, 554, 659].forEach((freq, i) => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = freq;
        gain2.gain.setValueAtTime(0.2, now + i * 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc2.start(now + i * 0.05);
        osc2.stop(now + 0.5);
      });
    }
  } catch (e) {
    console.error("Audio error", e);
  }
}


function ChessBoard({ fen, solution = [], onPuzzleSolved, onWrongMove }) {
  const { currentBoardColors, pieceSet } = useTheme();
  const [game, setGame] = useState(new Chess(fen));

  const pieceImages = pieceSet === 'modern' ? pieceImageSets.set2 : pieceSet === 'elegant' ? pieceImageSets.set3 : pieceImageSets.set1;

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null); // { from, to }
  const [moveHistory, setMoveHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [initialFen, setInitialFen] = useState(fen);
  const [userColor, setUserColor] = useState('w'); // 'w' or 'b'

  const [normalizedSolution, setNormalizedSolution] = useState([]);

  // Re-initialize when FEN changes
  // Re-initialize when FEN changes
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

    // Determine user color based on FEN side to move
    const turn = newGame.turn();
    setUserColor(turn);

    // Normalize solution moves to SAN
    try {
      // Create a temp game to validate/normalize moves
      const tempGame = new Chess(fen);
      const sanMoves = [];

      if (Array.isArray(solution)) {
        for (const move of solution) {
          let result = null;

          // 1. Try passing the move directly (works for SAN and Move Objects)
          try {
            result = tempGame.move(move);
          } catch (e) {
            // 2. If it failed and looks like a UCI string (e.g. "e2e4" or "a7a8q"), try converting to object
            if (typeof move === 'string' && (move.length === 4 || move.length === 5)) {
              const from = move.substring(0, 2);
              const to = move.substring(2, 4);
              const promotion = move.length === 5 ? move[4] : undefined;

              try {
                result = tempGame.move({ from, to, promotion });
              } catch (e2) {
                // Still failed
                console.warn(`Failed to parse move: ${move}`, e2);
              }
            }
          }

          if (result) {
            sanMoves.push(result.san);
          } else {
            console.warn(`Invalid move in solution: ${move}`);
            // If we can't parse a move, the puzzle might be unplayable. 
            // Depending on strictness, we might break or continue. 
            // Continuing allows partial solving.
            break;
          }
        }
      }
      setNormalizedSolution(sanMoves);
    } catch (error) {
      console.error('Error normalizing solution:', error);
      // Fallback to empty to avoid crashing
      setNormalizedSolution([]);
    }
  }, [fen, solution]);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const getSquare = (file, rank) => file + rank;
  const getPiece = (square) => game.get(square);

  const resetToInitial = (delay = 600) => {
    setFeedback('wrong');
    playSound('wrong');
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

  const handleUserMove = (from, to) => {
    // Check against userColor instead of hardcoded 'w'
    if (game.turn() !== userColor) return;

    const moveAttempt = { from, to, promotion: 'q' };
    let result = null;
    try {
      result = game.move(moveAttempt);
    } catch (e) {
      result = null;
    }

    if (!result) return; // Invalid move

    // Move is valid on board, now check against puzzle solution
    const san = result.san;
    const isCapture = san.includes('x');
    playSound(isCapture ? 'capture' : 'move');

    const newHistory = [...moveHistory, san];
    setMoveHistory(newHistory);
    setLastMove({ from, to });

    const expected = normalizedSolution[solutionIndex] || null;
    if (expected && normalizeSAN(san) === normalizeSAN(expected)) {
      // Correct Move
      setFeedback('correct');

      let nextIndex = solutionIndex + 1;

      // Auto-play Black's response
      if (nextIndex < normalizedSolution.length) {
        setTimeout(() => {
          const expectedBlackMove = normalizedSolution[nextIndex];
          const blackResult = game.move(expectedBlackMove);
          if (blackResult) {
            playSound(blackResult.san.includes('x') ? 'capture' : 'move');
            setMoveHistory((prev) => [...prev, blackResult.san]);
            setLastMove({ from: blackResult.from, to: blackResult.to });
            setSolutionIndex(nextIndex + 1);
            setGame(new Chess(game.fen())); // Force update

            if ((nextIndex + 1) >= normalizedSolution.length || game.isCheckmate()) {
              setTimeout(() => {
                setFeedback('solved');
                playSound('solved');
                if (onPuzzleSolved) onPuzzleSolved();
              }, 300);
            } else {
              setFeedback(null);
            }
          }
        }, 300); // Small delay for black move to feel natural
        setSolutionIndex(nextIndex); // Update index immediately for safety
      } else {
        // Puzzle solved (no more black moves needed)
        setTimeout(() => {
          setFeedback('solved');
          playSound('solved');
          if (onPuzzleSolved) onPuzzleSolved();
        }, 300);
      }

      // Update game state for UI
      setGame(new Chess(game.fen()));

    } else {
      // Wrong Move
      if (onWrongMove) onWrongMove();
      resetToInitial();
    }
  };

  const handleSquareClick = (square) => {
    if (feedback === 'solved') return;

    // Move Logic
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }

      // Attempt move
      if (possibleMoves.includes(square)) {
        handleUserMove(selectedSquare, square);
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }

      // Switch selection to new piece if own color
      const piece = getPiece(square);
      if (piece && piece.color === userColor) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true }) || [];
        setPossibleMoves(moves.map((m) => m.to));
        return;
      }

      // Invalid click (empty square or enemy piece not capture)
      setSelectedSquare(null);
      setPossibleMoves([]);

    } else {
      // Select Logic
      const piece = getPiece(square);
      if (!piece) return;
      if (piece.color !== userColor || game.turn() !== userColor) return;

      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true }) || [];
      setPossibleMoves(moves.map((m) => m.to));
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, square) => {
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';

    // Optional: Set drag image or highlighting
    setSelectedSquare(square); // Auto-select on drag
    const moves = game.moves({ square, verbose: true }) || [];
    setPossibleMoves(moves.map((m) => m.to));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetSquare) => {
    e.preventDefault();
    const sourceSquare = e.dataTransfer.getData('text/plain');
    if (sourceSquare && sourceSquare !== targetSquare) {
      handleUserMove(sourceSquare, targetSquare);
    }
    setSelectedSquare(null);
    setPossibleMoves([]);
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
        {(userColor === 'w' ? ranks : [...ranks].reverse()).map((rank, rankIndex) => (
          <div key={rank} className={styles.row}>
            {(userColor === 'w' ? files : [...files].reverse()).map((file, fileIndex) => {
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
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, square)}
                >
                  {piece && (
                    <img
                      src={pieceImages[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                      alt={`${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}`}
                      className={styles.piece}
                      draggable={game.turn() === piece.color && feedback !== 'solved'} // Only allow dragging if turn matches
                      onDragStart={(e) => handleDragStart(e, square)}
                    />
                  )}
                  {/* Rank Labels (Numbers) - Show on first file for the user's view (whether 'a' or 'h') */}
                  {fileIndex === 0 && (
                    <div className={styles.rankLabel}>{rank}</div>
                  )}
                  {/* File Labels (Letters) - Show on last rank for the user's view (whether '1' or '8') */}
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
