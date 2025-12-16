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

// Simple Audio Synthesis for Sounds
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


function ChessBoard({ fen, solution = [], onPuzzleSolved, onWrongMove, puzzleType = 'normal', kidsConfig = null }) {
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

  // Kids Mode State
  const [capturedTargets, setCapturedTargets] = useState([]); // Array of captured squares
  const [kidsTargets, setKidsTargets] = useState([]); // Initial targets from config

  // Custom Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [dragOverSquare, setDragOverSquare] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [draggedPieceImage, setDraggedPieceImage] = useState(null);
  const boardRef = useRef(null);
  const mouseHandlersRef = useRef({});
  const dragStateRef = useRef({ draggedPiece: null, possibleMoves: [] });
  const dragTimeoutRef = useRef(null);
  const isMouseDownRef = useRef(false);

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

    // Initialize Kids Mode stuff
    setCapturedTargets([]);
    if (puzzleType === 'kids' && kidsConfig) {
      setKidsTargets(kidsConfig.targets || []);
    } else {
      setKidsTargets([]);
    }

    // Normalize solution moves to SAN (only for normal)
    if (puzzleType === 'normal') {
      try {
        const tempGame = new Chess(fen);
        const sanMoves = [];

        if (Array.isArray(solution)) {
          for (const move of solution) {
            let result = null;
            try {
              result = tempGame.move(move);
            } catch (e) {
              if (typeof move === 'string' && (move.length === 4 || move.length === 5)) {
                const from = move.substring(0, 2);
                const to = move.substring(2, 4);
                const promotion = move.length === 5 ? move[4] : undefined;
                try { result = tempGame.move({ from, to, promotion }); } catch (e2) { }
              }
            }
            if (result) sanMoves.push(result.san);
            else break;
          }
        }
        setNormalizedSolution(sanMoves);
      } catch (error) {
        setNormalizedSolution([]);
      }
    }
  }, [fen, solution, puzzleType, kidsConfig]);

  // Cleanup effect for mouse event listeners
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
      if (mouseHandlersRef.current.handleMouseMove) {
        document.removeEventListener('mousemove', mouseHandlersRef.current.handleMouseMove);
      }
      if (mouseHandlersRef.current.handleMouseUp) {
        document.removeEventListener('mouseup', mouseHandlersRef.current.handleMouseUp);
      }
    };
  }, []);

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
      setCapturedTargets([]); // Reset targets
    }, delay);
  };

  const checkKidsWinCondition = (currentCaptured) => {
    // Check if all targets are captured
    // We need to know how many targets were there
    const totalTargets = kidsTargets.length;
    if (currentCaptured.length >= totalTargets) {
      return true;
    }
    return false;
  };

  const handleKidsMove = (from, to) => {
    // Allow any legal move
    // No turn check needed as we force user color usually, but game.turn() handles it

    const moveAttempt = { from, to, promotion: 'q' };
    let result = null;
    try { result = game.move(moveAttempt); } catch (e) { result = null; }

    if (!result) return;

    // STARTING NEW LOGIC FOR KIDS:
    // Check if 'to' square had a target
    // Targets are logically pieces (pawns) of opposite color so they are 'captured' by engine move
    // But we need to track them visually as Pizza/Chocolate
    const targetHit = kidsTargets.find(t => t.square === to);
    const isCapture = !!targetHit; // Physically it is a capture in engine if we put enemy pieces there

    playSound(isCapture ? 'capture' : 'move');

    const newHistory = [...moveHistory, result.san];
    setMoveHistory(newHistory);
    setLastMove({ from, to });

    // Update visually captured targets
    let newCaptured = capturedTargets;
    if (targetHit) {
      // If we haven't already captured it (should be impossible if piece is there but safe check)
      if (!capturedTargets.includes(targetHit.square)) {
        newCaptured = [...capturedTargets, targetHit.square];
        setCapturedTargets(newCaptured);
      }
    }

    // Force update board state AND keep turn on player logic
    // We want the player to keep moving until all targets captured
    // So we must hack the FEN to set turn back to userColor
    const currentFen = game.fen();
    const fenParts = currentFen.split(' ');
    fenParts[1] = userColor; // Force turn back to user
    const newFen = fenParts.join(' ');

    setGame(new Chess(newFen));
    setFeedback(null); // Clear feedback? Or keep it briefly?

    // Check win
    if (checkKidsWinCondition(newCaptured)) {
      setTimeout(() => {
        setFeedback('solved');
        playSound('solved');
        if (onPuzzleSolved) onPuzzleSolved();
      }, 300);
    }

    // No computer response in Kids Mode
  };

  const handleUserMove = (from, to) => {
    // Branch based on Puzzle Type
    if (puzzleType === 'kids') {
      handleKidsMove(from, to);
      return;
    }

    // Normal Puzzle Logic
    if (game.turn() !== userColor) return;

    const moveAttempt = { from, to, promotion: 'q' };
    let result = null;
    try {
      result = game.move(moveAttempt);
    } catch (e) {
      result = null;
    }

    if (!result) return; // Invalid move

    const san = result.san;
    const isCapture = san.includes('x');
    playSound(isCapture ? 'capture' : 'move');

    const newHistory = [...moveHistory, san];
    setMoveHistory(newHistory);
    setLastMove({ from, to });

    const expected = normalizedSolution[solutionIndex] || null;
    if (expected && normalizeSAN(san) === normalizeSAN(expected)) {
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
            setGame(new Chess(game.fen()));

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
        }, 300);
        setSolutionIndex(nextIndex);
      } else {
        setTimeout(() => {
          setFeedback('solved');
          playSound('solved');
          if (onPuzzleSolved) onPuzzleSolved();
        }, 300);
      }
      setGame(new Chess(game.fen()));
    } else {
      if (onWrongMove) onWrongMove();
      resetToInitial();
    }
  };

  const handleSquareClick = (square) => {
    if (feedback === 'solved' || isDragging) return;

    // Move Logic
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }
      if (possibleMoves.includes(square)) {
        handleUserMove(selectedSquare, square);
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }
      // Switch selection logic
      const piece = getPiece(square);
      if (piece && piece.color === game.turn()) { // Allow switching if valid turn
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true }) || [];
        setPossibleMoves(moves.map((m) => m.to));
        return;
      }
      setSelectedSquare(null);
      setPossibleMoves([]);

    } else {
      const piece = getPiece(square);
      if (!piece) return;
      if (piece.color !== game.turn()) return; // Must be moving side

      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true }) || [];
      setPossibleMoves(moves.map((m) => m.to));
    }
  };

  // Custom Mouse Drag Handlers using useRef to avoid circular dependency
  useEffect(() => {
    mouseHandlersRef.current.handleMouseMove = (e) => {
      if (!boardRef.current) return;

      const rect = boardRef.current.getBoundingClientRect();
      setDragPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });

      // Determine which square we're over
      const squareSize = rect.width / 8;
      const fileIndex = Math.floor((e.clientX - rect.left) / squareSize);
      const rankIndex = Math.floor((e.clientY - rect.top) / squareSize);
      
      if (fileIndex >= 0 && fileIndex < 8 && rankIndex >= 0 && rankIndex < 8) {
        const files = userColor === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
        const ranks = userColor === 'w' ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8'];
        const targetSquare = files[fileIndex] + ranks[rankIndex];
        
        setPossibleMoves(prevMoves => {
          if (prevMoves.includes(targetSquare)) {
            setDragOverSquare(targetSquare);
          } else {
            setDragOverSquare(null);
          }
          return prevMoves;
        });
      } else {
        setDragOverSquare(null);
      }
    };

    mouseHandlersRef.current.handleMouseUp = (e) => {
      // Clear the mouse down flag
      isMouseDownRef.current = false;
      
      // Remove global event listeners
      document.removeEventListener('mousemove', mouseHandlersRef.current.handleMouseMove);
      document.removeEventListener('mouseup', mouseHandlersRef.current.handleMouseUp);

      // Get current drag state from ref
      const currentDraggedPiece = dragStateRef.current.draggedPiece;
      const currentPossibleMoves = dragStateRef.current.possibleMoves;

      // Determine drop target
      let targetSquare = null;
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        const squareSize = rect.width / 8;
        const fileIndex = Math.floor((e.clientX - rect.left) / squareSize);
        const rankIndex = Math.floor((e.clientY - rect.top) / squareSize);
        
        if (fileIndex >= 0 && fileIndex < 8 && rankIndex >= 0 && rankIndex < 8) {
          const files = userColor === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
          const ranks = userColor === 'w' ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8'];
          targetSquare = files[fileIndex] + ranks[rankIndex];
        }
      }

      // Reset drag state first
      setIsDragging(false);
      setDraggedPiece(null);
      setDragOverSquare(null);
      setDraggedPieceImage(null);
      
      // Clear ref
      dragStateRef.current = { draggedPiece: null, possibleMoves: [] };

      // Then handle the move if valid
      if (currentDraggedPiece && targetSquare && targetSquare !== currentDraggedPiece && currentPossibleMoves.includes(targetSquare)) {
        handleUserMove(currentDraggedPiece, targetSquare);
        // Clear selection after successful drag move
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    };
  }, [userColor, handleUserMove]);

  const startDrag = (square, e) => {
    const piece = getPiece(square);
    const moves = game.moves({ square, verbose: true }) || [];
    const movesToSquares = moves.map((m) => m.to);
    
    // Update ref with current drag state
    dragStateRef.current = {
      draggedPiece: square,
      possibleMoves: movesToSquares
    };
    
    // Start drag
    setIsDragging(true);
    setDraggedPiece(square);
    setDraggedPieceImage(pieceImages[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]);
    setPossibleMoves(movesToSquares);

    // Get mouse position relative to board
    const rect = boardRef.current.getBoundingClientRect();
    setDragPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    // Add global mouse event listeners
    document.addEventListener('mousemove', mouseHandlersRef.current.handleMouseMove, { passive: false });
    document.addEventListener('mouseup', mouseHandlersRef.current.handleMouseUp, { passive: false });
  };

  const handleMouseDown = (e, square) => {
    if (feedback === 'solved') return;

    const piece = getPiece(square);
    if (!piece || piece.color !== game.turn()) return;

    // Only handle left mouse button
    if (e.button !== 0) return;

    isMouseDownRef.current = true;

    // Start drag after a short delay to allow for clicks
    dragTimeoutRef.current = setTimeout(() => {
      if (isMouseDownRef.current) {
        startDrag(square, e);
      }
    }, 150); // 150ms delay to distinguish click from drag

    // Add temporary mouseup listener to cancel drag if mouse is released quickly
    const quickMouseUp = () => {
      clearTimeout(dragTimeoutRef.current);
      isMouseDownRef.current = false;
      document.removeEventListener('mouseup', quickMouseUp);
    };

    document.addEventListener('mouseup', quickMouseUp, { once: true });
  };

  const isLightSquare = (fileIndex, rankIndex) => (fileIndex + rankIndex) % 2 === 0;
  const isSelected = (square) => selectedSquare === square;
  const isPossibleMove = (square) => possibleMoves.includes(square);
  const isLastMove = (square) => lastMove && (lastMove.from === square || lastMove.to === square);

  return (
    <div className={styles.boardContainer}>
      {feedback && (
        <div className={`${styles.feedback} ${styles[feedback]}`}>
          {feedback === 'correct' && (puzzleType === 'kids' ? 'Yummy! 😋' : '✓ Correct!')}
          {feedback === 'wrong' && '✗ Wrong Move!'}
          {feedback === 'solved' && '🎉 Puzzle Solved!'}
        </div>
      )}
      <div className={styles.board} ref={boardRef}>
        {(userColor === 'w' ? ranks : [...ranks].reverse()).map((rank, rankIndex) => (
          <div key={rank} className={styles.row}>
            {(userColor === 'w' ? files : [...files].reverse()).map((file, fileIndex) => {
              const square = getSquare(file, rank);
              const piece = getPiece(square);
              const isLight = isLightSquare(fileIndex, rankIndex);
              const squareColor = isLight ? currentBoardColors.light : currentBoardColors.dark;

              // Check for Kids Target -> Override rendering
              // If square is in kidsTargets AND NOT captured
              let kidsContent = null;
              if (puzzleType === 'kids') {
                const target = kidsTargets.find(t => t.square === square);
                if (target && !capturedTargets.includes(square)) {
                  // It might have a piece on it (e.g. enemy pawn from FEN), but we render Pizza/Chocolate
                  kidsContent = (
                    <div
                      className={styles.piece}
                      style={{ fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {target.item === 'pizza' ? '🍕' : '🍫'}
                    </div>
                  );
                }
              }

              // Hide Kings in Kids Mode if not covered by kidsContent
              if (puzzleType === 'kids' && !kidsContent && piece && piece.type === 'k') {
                // Do not render anything for kings
              } else if (puzzleType === 'kids' && !kidsContent && piece) {
                // Explicitly render pieces for Kids mode if not king/target (e.g. the main piece)
                kidsContent = <img src={pieceImages[piece.color + piece.type]} alt="" className={styles.piece} />;
              }

              return (
              <div
  key={square}
  className={`
    ${styles.square}
    ${isSelected(square) ? styles.selected : ''}
    ${isPossibleMove(square) ? styles.possibleMove : ''}
    ${isLastMove(square) ? styles.lastMove : ''}
    ${dragOverSquare === square ? styles.dragOver : ''}
    ${isDragging && draggedPiece === square ? styles.dragSource : ''}
  `}


                  style={{ backgroundColor: squareColor }}
                  onClick={() => handleSquareClick(square)}
                >
                  {/* Render Kids Content OR Standard Piece */}
                  {kidsContent ? kidsContent : (
                    piece && (
                      <img
                        src={pieceImages[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                        alt={`${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}`}
                        className={`${styles.piece} ${isDragging && draggedPiece === square ? styles.dragSourcePiece : ''}`}
                        draggable={false}
                        onMouseDown={(e) => handleMouseDown(e, square)}
                        style={{ cursor: game.turn() === piece.color && feedback !== 'solved' ? 'grab' : 'default' }}
                      />
                    )
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
      
      {/* Floating dragged piece */}
      {isDragging && draggedPieceImage && (
        <img
          src={draggedPieceImage}
          alt="Dragged piece"
          className={styles.floatingPiece}
          style={{
            left: dragPosition.x - 35, // Center the piece on cursor
            top: dragPosition.y - 35,
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
}

export default ChessBoard;
