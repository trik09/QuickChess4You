import { useState, useEffect, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import { useTheme } from "../../contexts/ThemeContext";
import styles from "./ChessBoard.module.css";

// Import chess piece SVGs (retained from original logic)
import whitePawn1 from "../../assets/pieces/whitepawn.svg";
import whiteKnight1 from "../../assets/pieces/whiteknight.svg";
import whiteBishop1 from "../../assets/pieces/whitebishop.svg";
import whiteRook1 from "../../assets/pieces/whiterook.svg";
import whiteQueen1 from "../../assets/pieces/whitequeen.svg";
import whiteKing1 from "../../assets/pieces/whiteking.svg";
import blackPawn1 from "../../assets/pieces/blackpawn.svg";
import blackKnight1 from "../../assets/pieces/blackknight.svg";
import blackBishop1 from "../../assets/pieces/blackbishop.svg";
import blackRook1 from "../../assets/pieces/blackrook.svg";
import blackQueen1 from "../../assets/pieces/blackqueen.svg";
import blackKing1 from "../../assets/pieces/blackking.svg";

import whitePawn2 from "../../assets/pieces2/whitepawn.svg";
import whiteKnight2 from "../../assets/pieces2/whiteknight.svg";
import whiteBishop2 from "../../assets/pieces2/whitebishop.svg";
import whiteRook2 from "../../assets/pieces2/whiterook.svg";
import whiteQueen2 from "../../assets/pieces2/whitequeen.svg";
import whiteKing2 from "../../assets/pieces2/whiteking.svg";
import blackPawn2 from "../../assets/pieces2/blackpawn.svg";
import blackKnight2 from "../../assets/pieces2/blackknight.svg";
import blackBishop2 from "../../assets/pieces2/blackbishop.svg";
import blackRook2 from "../../assets/pieces2/blackrook.svg";
import blackQueen2 from "../../assets/pieces2/blackqueen.svg";
import blackKing2 from "../../assets/pieces2/blackking.svg";

import whitePawn3 from "../../assets/pieces3/whitepawn.svg";
import whiteKnight3 from "../../assets/pieces3/whiteknight.svg";
import whiteBishop3 from "../../assets/pieces3/whitebishop.svg";
import whiteRook3 from "../../assets/pieces3/whiterook.svg";
import whiteQueen3 from "../../assets/pieces3/whitequeen.svg";
import whiteKing3 from "../../assets/pieces3/whiteking.svg";
import blackPawn3 from "../../assets/pieces3/blackpawn.svg";
import blackKnight3 from "../../assets/pieces3/blackknight.svg";
import blackBishop3 from "../../assets/pieces3/blackbishop.svg";
import blackRook3 from "../../assets/pieces3/blackrook.svg";
import blackQueen3 from "../../assets/pieces3/blackqueen.svg";
import blackKing3 from "../../assets/pieces3/blackking.svg";
import updatedStar from "../../assets/updated-star.svg";

const pieceImageSets = {
  set1: {
    p: blackPawn1,
    n: blackKnight1,
    b: blackBishop1,
    r: blackRook1,
    q: blackQueen1,
    k: blackKing1,
    P: whitePawn1,
    N: whiteKnight1,
    B: whiteBishop1,
    R: whiteRook1,
    Q: whiteQueen1,
    K: whiteKing1,
  },
  set2: {
    p: blackPawn2,
    n: blackKnight2,
    b: blackBishop2,
    r: blackRook2,
    q: blackQueen2,
    k: blackKing2,
    P: whitePawn2,
    N: whiteKnight2,
    B: whiteBishop2,
    R: whiteRook2,
    Q: whiteQueen2,
    K: whiteKing2,
  },
  set3: {
    p: blackPawn3,
    n: blackKnight3,
    b: blackBishop3,
    r: blackRook3,
    q: blackQueen3,
    k: blackKing3,
    P: whitePawn3,
    N: whiteKnight3,
    B: whiteBishop3,
    R: whiteRook3,
    Q: whiteQueen3,
    K: whiteKing3,
  },
};

function normalizeSAN(san) {
  if (!san) return "";
  return san.replace(/[\+#\s]+$/g, "").trim();
}

function isValidFen(fen) {
  if (!fen || typeof fen !== 'string') return false;
  try {
    const chess = new Chess(fen);
    return true;
  } catch (e) {
    return false;
  }
}

function safeNewChess(fen) {
  try {
    if (!fen || typeof fen !== 'string') return new Chess();
    return new Chess(fen);
  } catch (e) {
    console.error("Invalid FEN encountered:", fen, e);
    return new Chess(); // Fallback to start position
  }
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

    if (type === "move") {
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "capture") {
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "wrong") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "solved") {
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
};

function ChessBoard({
  fen,
  solution = [],
  alternativeSolutions = [],
  onPuzzleSolved,
  onWrongMove,
  onBoardStateChange,
  savedBoardState,
  isSolved = false,
  puzzleType = "normal",
  captureConfig = null,
  illegalConfig = null,
  interactive = true,
  showSolution = false,
  firstMoveBy = "w", // Default to white
  testSolveMode = false, // Added for Test Solve popup validation
}) {
  const { currentBoardColors, pieceSet } = useTheme();
  const [game, setGame] = useState(safeNewChess(fen));

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

  const pieceImages =
    pieceSet === "modern"
      ? pieceImageSets.set2
      : pieceSet === "elegant"
        ? pieceImageSets.set3
        : pieceImageSets.set1;

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null); // { from, to }
  const [moveHistory, setMoveHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [initialFen, setInitialFen] = useState(fen);
  const [userColor, setUserColor] = useState("w");

  const [normalizedSolution, setNormalizedSolution] = useState([]);
  const [allNormalizedPaths, setAllNormalizedPaths] = useState([]);
  const [validPathIndices, setValidPathIndices] = useState([]);

  // Promotion State
  const [promotionPending, setPromotionPending] = useState(null); // { from, to, color }
  const [capturedTargets, setCapturedTargets] = useState([]); // Array of captured squares
  const [captureTargets, setCaptureTargets] = useState([]);

  // Tracked piece square for Source-Destination puzzles
  const [trackedSquare, setTrackedSquare] = useState(null); // Initial targets/pieces from config

  // Custom Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [dragOverSquare, setDragOverSquare] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedPieceImage, setDraggedPieceImage] = useState(null);
  const boardRef = useRef(null);
  const wrapperRef = useRef(null);
  const mouseHandlersRef = useRef({});
  const dragStateRef = useRef({ draggedPiece: null, possibleMoves: [] });
  const dragTimeoutRef = useRef(null);
  const isMouseDownRef = useRef(false);

  // Arrow and Circle Annotation State
  const [arrows, setArrows] = useState([]);
  const [circles, setCircles] = useState([]);
  const arrowDragStateRef = useRef({ isDrawing: false, startSquare: null, startX: 0, startY: 0, rafId: null });
  const arrowColorRef = useRef("#43732F");

  // ─── Keep a ref to the latest `interactive` prop ─────────────────────────────
  // This ensures drag/click handlers always read the current value even if they
  // were registered before the prop changed (stale closure prevention).
  const interactiveRef = useRef(interactive);
  useEffect(() => {
    interactiveRef.current = interactive;
    // When the board becomes non-interactive (e.g. puzzle locked after wrong move),
    // immediately clear any selection/possible-move highlights so it looks locked.
    if (!interactive) {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  }, [interactive]);

  // Re-initialize when FEN or solution changes
  useEffect(() => {
    const newGame = safeNewChess(fen);
    setGame(newGame);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setFeedback(null);
    setSolutionIndex(0);
    setInitialFen(fen);
    setPromotionPending(null);
    setArrows([]);

    // For illegal mode, the player controls the configured side (which MUST match the FEN turn)
    if (puzzleType === "illegal" || puzzleType === "avoid_illegal") {
      const configuredColor = illegalConfig?.playerSide || ((firstMoveBy === 'w' || firstMoveBy === 'b') ? firstMoveBy : newGame.turn());
      if (newGame.turn() !== configuredColor) {
        const fenParts = fen.split(' ');
        fenParts[1] = configuredColor;
        const syncedFen = fenParts.join(' ');
        setGame(safeNewChess(syncedFen));
        setUserColor(configuredColor);
      } else {
        setUserColor(newGame.turn());
      }
    } else if (puzzleType === "capture" && captureConfig) {
      setUserColor(captureConfig.playerSide || "w");
    } else {
      // Normal puzzles or unknown types: computer moves first if a solution exists.
      // We set userColor to the opposite of the current FEN turn.
      const turn = newGame.turn();
      setUserColor(turn === "w" ? "b" : "w");
    }

    // Initialize Capture Mode stuff
    setCapturedTargets([]);
    if (puzzleType === "capture" && captureConfig) {
      if (captureConfig.mode === 'objects') {
        setCaptureTargets(captureConfig.targets || []);
      } else {
        setCaptureTargets(captureConfig.enemyPieces || []);
      }
    } else {
      setCaptureTargets([]);
    }

    if (puzzleType === 'illegal' && illegalConfig?.subType === 'source_destination') {
      setTrackedSquare(illegalConfig.sourceSquare);
    } else {
      setTrackedSquare(null);
    }

    // Normalize solution moves to SAN (only for normal)
    if (puzzleType === "normal") {
      const normalizePath = (path) => {
        try {
          const tempGame = safeNewChess(fen);
          const sanMoves = [];
          if (Array.isArray(path)) {
            for (const move of path) {
              let result = null;
              try {
                result = tempGame.move(move);
              } catch (e) {
                // Try sloppy parsing for coordinates (e2e4)
                if (
                  typeof move === "string" &&
                  (move.length === 4 || move.length === 5)
                ) {
                  const from = move.substring(0, 2);
                  const to = move.substring(2, 4);
                  const promotion = move.length === 5 ? move[4] : undefined;
                  try {
                    result = tempGame.move({ from, to, promotion });
                  } catch (e2) { }
                }
              }
              if (result) sanMoves.push(result.san);
              else break;
            }
          }
          return sanMoves;
        } catch (error) {
          return [];
        }
      };

      const mainPath = normalizePath(solution);
      const altPaths = (alternativeSolutions || [])
        .map(normalizePath)
        .filter((p) => p.length > 0);
      const allPaths = [mainPath, ...altPaths].filter((p) => p.length > 0);

      setNormalizedSolution(mainPath);
      setAllNormalizedPaths(allPaths);
      setValidPathIndices(allPaths.map((_, i) => i));
    }
  }, [fen, solution, alternativeSolutions, puzzleType, captureConfig, illegalConfig, firstMoveBy]);

  const onBoardStateChangeRef = useRef(onBoardStateChange);
  useEffect(() => {
    onBoardStateChangeRef.current = onBoardStateChange;
  }, [onBoardStateChange]);

  // Unified Computer Response Logic (Declarative)
  useEffect(() => {
    const isGameSolved = isSolved || feedback === "solved";
    const isComputerTurn = game.turn() !== userColor;
    const hasMoveToPlay = solutionIndex < normalizedSolution.length;

    if (
      puzzleType === "normal" &&
      !showSolution &&
      !isGameSolved &&
      !promotionPending &&
      isComputerTurn &&
      hasMoveToPlay
    ) {
      const timer = setTimeout(() => {
        try {
          const nextMove = normalizedSolution[solutionIndex];
          if (!nextMove) return;

          const gameCopy = safeNewChess(game.fen());
          const result = gameCopy.move(nextMove);

          if (result) {
            playSound(result.san.includes("x") ? "capture" : "move");
            const newHistory = [...moveHistory, result.san];

            setMoveHistory(newHistory);
            setLastMove({ from: result.from, to: result.to });
            const nextSolutionIndex = solutionIndex + 1;
            setSolutionIndex(nextSolutionIndex);
            setGame(safeNewChess(gameCopy.fen()));

            const isEndOfPath = nextSolutionIndex >= normalizedSolution.length;
            if (isEndOfPath || gameCopy.isCheckmate()) {
              setTimeout(() => {
                setFeedback("solved");
                playSound("solved");
                if (onPuzzleSolved) onPuzzleSolved(undefined, newHistory);
              }, 300);
            } else {
              setFeedback(null);
            }

            if (onBoardStateChangeRef.current) {
              onBoardStateChangeRef.current(gameCopy.fen(), newHistory);
            }
          }
        } catch (e) {
          console.error("Auto-move execution failed:", e);
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [
    game,
    userColor,
    solutionIndex,
    normalizedSolution,
    puzzleType,
    isSolved,
    feedback,
    promotionPending,
    showSolution,
    moveHistory,
    onPuzzleSolved
  ]);

  // Restore saved board state if available
  useEffect(() => {
    if (savedBoardState && savedBoardState.fen) {
      const hasHumanMoved =
        savedBoardState.moveHistory && savedBoardState.moveHistory.length > 1;

      if (hasHumanMoved && !isSolved) {
        try {
          const restoredGame = safeNewChess(savedBoardState.fen);
          setGame(restoredGame);
          if (savedBoardState.moveHistory) {
            setMoveHistory(savedBoardState.moveHistory);
            setSolutionIndex(savedBoardState.moveHistory.length);
          }
          if (savedBoardState.trackedSquare) {
            setTrackedSquare(savedBoardState.trackedSquare);
          }
        } catch (error) {
          console.error("Failed to restore board state:", error);
        }
      }
    }
  }, [savedBoardState, isSolved]);

  // Auto-play solution logic
  useEffect(() => {
    if (showSolution && puzzleType === "normal") {
      const playNext = () => {
        if (solutionIndex >= normalizedSolution.length) {
          if (onPuzzleSolved && feedback !== "solved") {
            setFeedback("solved");
            if (onPuzzleSolved) onPuzzleSolved();
          }
          return;
        }

        const nextMove = normalizedSolution[solutionIndex];
        let result = null;
        try {
          result = game.move(nextMove);
        } catch (e) {
          console.error(e);
        }

        if (result) {
          playSound(result.san.includes("x") ? "capture" : "move");
          setMoveHistory((prev) => [...prev, result.san]);
          setLastMove({ from: result.from, to: result.to });
          setGame(safeNewChess(game.fen()));
          setSolutionIndex((prev) => prev + 1);
        }
      };

      const timer = setTimeout(playNext, 800);
      return () => clearTimeout(timer);
    }
  }, [
    showSolution,
    solutionIndex,
    normalizedSolution,
    game,
    puzzleType,
    feedback,
  ]);

  // Keyboard listener for arrow colors
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!arrowDragStateRef.current.isDrawing) return;

      const key = e.key.toLowerCase();
      let newColor = null;
      let markerId = "arrowhead";

      if (e.shiftKey) {
        if (key === 'g') { newColor = "#43732F"; markerId = "arrowhead"; }
        else if (key === 'r') { newColor = "#F44336"; markerId = "arrowhead-red"; }
        else if (key === 'y') { newColor = "#FFEB3B"; markerId = "arrowhead-yellow"; }
        else if (key === 'b') { newColor = "#2196F3"; markerId = "arrowhead-blue"; }
      }

      if (newColor) {
        arrowColorRef.current = newColor;
        const lineNode = document.getElementById("current-arrow-line");
        if (lineNode) {
          lineNode.setAttribute("stroke", newColor);
          lineNode.setAttribute("marker-end", `url(#${markerId})`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Cleanup effect for mouse event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", mouseHandlersRef.current.move);
      document.removeEventListener("mouseup", mouseHandlersRef.current.up);
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    };
  }, []);

  // Board scaling logic
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Board sizing is now fully CSS-driven (width: 100%, aspect-ratio: 1/1).
  // The scale transform is no longer applied; scale stays at 1.0 so that drag
  // coordinate calculations (which divide by `scale`) remain correct (÷1 = no-op).
  useEffect(() => {
    setScale(1);
  }, []);


  const getFileRank = (row, col) => {
    return `${files[col]}${ranks[row]}`;
  };

  const getSquare = (file, rank) => {
    return `${file}${rank}`;
  };

  const getSquareCenter = (square) => {
    if (!square) return { x: 0, y: 0 };
    const file = square.charCodeAt(0) - 97; // 0-7
    const rank = parseInt(square[1]) - 1; // 0-7

    const displayFile = userColor === "w" ? file : 7 - file;
    const displayRank = userColor === "w" ? 7 - rank : rank;

    const x = (displayFile + 0.5) * 12.5;
    const y = (displayRank + 0.5) * 12.5;
    return { x, y };
  };

  const getPiece = (square) => {
    return game.get(square);
  };

  const getPieceImage = (piece) => {
    if (!piece) return null;
    return pieceImages[
      piece.color === "w" ? piece.type.toUpperCase() : piece.type
    ];
  };

  const getSquareStyle = (row, col) => {
    const isDark = (row + col) % 2 === 1;
    const backgroundColor = isDark
      ? currentBoardColors?.dark || "#B58863"
      : currentBoardColors?.light || "#F0D9B5";

    const isSelected =
      selectedSquare &&
      selectedSquare.row === row &&
      selectedSquare.col === col;
    const isLastMove =
      lastMove &&
      ((lastMove.from.row === row && lastMove.from.col === col) ||
        (lastMove.to.row === row && lastMove.to.col === col));
    const isPossibleMove = possibleMoves.some(
      (m) => m.row === row && m.col === col,
    );
    const inCheck =
      game.inCheck() &&
      game.turn() === game.get(getFileRank(row, col))?.color &&
      game.get(getFileRank(row, col))?.type === "k";
    const isDragOver =
      dragOverSquare &&
      dragOverSquare.row === row &&
      dragOverSquare.col === col;

    const squareSan = getFileRank(row, col);
    const isCapturedTarget = capturedTargets.includes(squareSan);
    const isTarget =
      captureTargets.some((t) => t.square === squareSan) && !isCapturedTarget;

    const style = {
      backgroundColor: isSelected ? "rgba(255, 255, 0, 0.5)" : backgroundColor,
      ...((isSelected || isLastMove) && {
        boxShadow: `inset 0 0 0 0px ${isDark ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.1)"}`,
      }),
    };

    if (isLastMove) {
      style.backgroundColor = isDark ? "#aaa23a" : "#cdcw68";
    }

    if (inCheck) {
      style.background = `radial-gradient(circle at center, #ff4d4d 0%, ${backgroundColor} 70%)`;
    }

    return style;
  };

  const resetToInitial = (delay = 600) => {
    setFeedback("wrong");
    playSound("wrong");
    setTimeout(() => {
      const resetGame = safeNewChess(initialFen);
      setGame(resetGame);
      setMoveHistory([]);
      setSolutionIndex(0);
      setLastMove(null);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setFeedback(null);
      setCapturedTargets([]);
    }, delay);
  };

  // --- CAPTURE PUZZLE HANDLERS ───────────────────────────────────────────────

  // ─── ILLEGAL MOVE PUZZLE HANDLER (Placeholder logic for future) ──────────────
  // Manages piece positions manually (no reliance on game.move() chess rules)
  // so that phantom kings never block moves due to being "in check".

  // Helper: is a square attacked by pieces of `attackerColor` in `piecesMap`?
  // Uses simple geometric checks for each piece type.
  const isSquareAttackedBy = (targetSq, attackerColor, piecesMap) => {
    const tFile = targetSq.charCodeAt(0) - 97; // 0-7
    const tRank = parseInt(targetSq[1]) - 1;    // 0-7
    for (const [sq, p] of Object.entries(piecesMap)) {
      if (p.color !== attackerColor) continue;
      const aFile = sq.charCodeAt(0) - 97;
      const aRank = parseInt(sq[1]) - 1;
      const fd = Math.abs(tFile - aFile), rd = Math.abs(tRank - aRank);
      if (p.type === 'n') { if ((fd === 1 && rd === 2) || (fd === 2 && rd === 1)) return true; }
      else if (p.type === 'k') { if (fd <= 1 && rd <= 1) return true; }
      else if (p.type === 'p') {
        const dir = p.color === 'w' ? 1 : -1;
        if (aRank + dir === tRank && fd === 1) return true;
      }
      else if (p.type === 'r' || p.type === 'q') {
        // Same rank or file — check for blockers
        if (tFile === aFile || tRank === aRank) {
          const df = tFile === aFile ? 0 : (tFile > aFile ? 1 : -1);
          const dr = tRank === aRank ? 0 : (tRank > aRank ? 1 : -1);
          let cf = aFile + df, cr = aRank + dr;
          let blocked = false;
          while (cf !== tFile || cr !== tRank) {
            const csq = String.fromCharCode(97 + cf) + (cr + 1);
            if (piecesMap[csq]) { blocked = true; break; }
            cf += df; cr += dr;
          }
          if (!blocked) return true;
        }
      }
      if (p.type === 'b' || p.type === 'q') {
        // Diagonals — check for blockers
        if (fd === rd && fd > 0) {
          const df = tFile > aFile ? 1 : -1;
          const dr = tRank > aRank ? 1 : -1;
          let cf = aFile + df, cr = aRank + dr;
          let blocked = false;
          while (cf !== tFile || cr !== tRank) {
            const csq = String.fromCharCode(97 + cf) + (cr + 1);
            if (piecesMap[csq]) { blocked = true; break; }
            cf += df; cr += dr;
          }
          if (!blocked) return true;
        }
      }
    }
    return false;
  };

  // ── ILLEGAL MOVE PUZZLE LOGIC ──────────────────────────────────────

  // Calculate moves for a piece ignoring king safety (pseudo-legal)
  const getPseudoLegalMoves = (sq) => {
    const piece = game.get(sq);
    if (!piece) return [];

    const file = sq.charCodeAt(0) - 97;
    const rank = parseInt(sq[1]) - 1;
    const currentPieces = {};
    game.board().forEach((row, ri) => row.forEach((p, fi) => {
      if (p) currentPieces[String.fromCharCode(97 + fi) + (8 - ri)] = p;
    }));

    const possibleSquares = [];

    if (piece.type === 'p') {
      const dir = piece.color === 'w' ? 1 : -1;
      const startRank = piece.color === 'w' ? 1 : 6;
      // Forward
      const f1 = String.fromCharCode(97 + file) + (rank + dir + 1);
      if (rank + dir >= 0 && rank + dir < 8 && !game.get(f1)) {
        possibleSquares.push(f1);
        const f2 = String.fromCharCode(97 + file) + (rank + 2 * dir + 1);
        if (rank === startRank && !game.get(f2)) possibleSquares.push(f2);
      }
      // Captures
      [file - 1, file + 1].forEach(f => {
        if (f >= 0 && f < 8) {
          const target = String.fromCharCode(97 + f) + (rank + dir + 1);
          if (game.get(target)) possibleSquares.push(target);
        }
      });
    } else if (piece.type === 'n') {
      const offsets = [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]];
      offsets.forEach(([df, dr]) => {
        const nf = file + df, nr = rank + dr;
        if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) possibleSquares.push(String.fromCharCode(97 + nf) + (nr + 1));
      });
    } else if (piece.type === 'k') {
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df === 0 && dr === 0) continue;
          const nf = file + df, nr = rank + dr;
          if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) possibleSquares.push(String.fromCharCode(97 + nf) + (nr + 1));
        }
      }
    } else if (piece.type === 'r' || piece.type === 'b' || piece.type === 'q') {
      const dirs = [];
      if (piece.type !== 'b') dirs.push([0, 1], [0, -1], [1, 0], [-1, 0]);
      if (piece.type !== 'r') dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
      dirs.forEach(([df, dr]) => {
        let nf = file + df, nr = rank + dr;
        while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
          const target = String.fromCharCode(97 + nf) + (nr + 1);
          possibleSquares.push(target);
          if (game.get(target)) break; // Blocked
          nf += df; nr += dr;
        }
      });
    }

    return possibleSquares.filter(targetSq => {
      const targetPiece = game.get(targetSq);
      if (targetPiece && targetPiece.color === piece.color) return false;
      return true;
    });
  };

  const handleIllegalMoveAttempt = (from, to) => {
    const playerColor = getIllegalActiveColor();
    const opponentColor = playerColor === 'w' ? 'b' : 'w';

    // Build current "real" pieces map for safety checks
    const rawBoard = game.board();
    const piecesMap = {};
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = rawBoard[r][c];
        if (p) {
          const sq = String.fromCharCode(97 + c) + (8 - r);
          piecesMap[sq] = { type: p.type, color: p.color };
        }
      }
    }

    // 1. Check if source piece is under attack (Resolve attacker first)
    const isSourceAttacked = isSquareAttackedBy(from, opponentColor, piecesMap);

    // 2. Check if destination is unsafe after move (Do NOT allow capture on unsafe destination)
    const nextPiecesMap = { ...piecesMap };
    const movingPiece = nextPiecesMap[from];
    delete nextPiecesMap[from];
    nextPiecesMap[to] = movingPiece;
    const isDestAttacked = isSquareAttackedBy(to, opponentColor, nextPiecesMap);

    if (isSourceAttacked || isDestAttacked) {
      playSound('wrong');
      setFeedback('wrong');
      if (onWrongMove) onWrongMove([...moveHistory, from + to]);
      // Return early to block the move completely
      return;
    }

    // --- Proceed with Move Validation ---
    // 1. Check if the move is actually LEGAL in standard chess
    const gameCopy = safeNewChess(game.fen());
    let result = null;
    try {
      result = gameCopy.move({ from, to, promotion: 'q' });
    } catch (e) {
      result = null;
    }

    const isSourceDestMode = illegalConfig?.subType === 'source_destination';

    if (result) {
      // LEGAL MOVE
      playSound(result.san.includes('x') ? 'capture' : 'move');
      setMoveHistory([...moveHistory, result.san]);
      setLastMove({ from, to });

      // In Avoid Illegal puzzles, we want consecutive moves without the opponent taking a turn.
      // So we force the the turn to remain the same as before the move.
      const fenParts = gameCopy.fen().split(' ');
      fenParts[1] = game.turn(); // Revert turn flag to the original active color
      fenParts[3] = '-';         // Clear en-passant target to prevent FEN loading errors
      const newFen = fenParts.join(' ');
      setGame(safeNewChess(newFen));

      if (isSourceDestMode) {
        let currentTrackedSquare = trackedSquare;
        if (!illegalConfig?.sourceSquare || from === currentTrackedSquare) {
          currentTrackedSquare = to;
          setTrackedSquare(to);
        }

        if (onBoardStateChangeRef.current) {
          onBoardStateChangeRef.current(newFen, [...moveHistory, result.san], currentTrackedSquare);
        }

        if (currentTrackedSquare?.toLowerCase() === illegalConfig?.destinationSquare?.toLowerCase()) {
          setTimeout(() => {
            setFeedback('solved');
            playSound('solved');
            if (onPuzzleSolved) onPuzzleSolved(undefined, [...moveHistory, result.san]);
          }, 300);
        }
      } else {
        // Normal Avoid Illegal Move: Any legal move Solves it immediately
        setTimeout(() => {
          setFeedback('solved');
          playSound('solved');
          if (onPuzzleSolved) onPuzzleSolved(undefined, [...moveHistory, result.san]);
        }, 300);
      }
      return;
    }

    // 2. Not legal. Is it pseudo-legal?
    const pseudoMoves = getPseudoLegalMoves(from);
    if (pseudoMoves.includes(to)) {
      // VISUAL MOVE for illegal attempt
      const playerColor = (() => {
        if (firstMoveBy === 'w' || firstMoveBy === 'b') return firstMoveBy;
        return game.turn();
      })();
      const rawBoard = game.board();
      const piecesMap = {};
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = rawBoard[r][c];
          if (p) {
            const sq = String.fromCharCode(97 + c) + (8 - r);
            piecesMap[sq] = { type: p.type, color: p.color };
          }
        }
      }

      const movingPiece = piecesMap[from];
      delete piecesMap[from];
      piecesMap[to] = movingPiece;

      let currentTrackedSquare = trackedSquare;
      if (isSourceDestMode && (!illegalConfig?.sourceSquare || from === trackedSquare)) {
        currentTrackedSquare = to;
        setTrackedSquare(to);
      }

      const wrongFen = buildIllegalGame(piecesMap, playerColor);
      setGame(safeNewChess(wrongFen));
      setLastMove({ from, to });
      playSound('move');

      if (onBoardStateChangeRef.current) {
        onBoardStateChangeRef.current(wrongFen, [...moveHistory, from + to], currentTrackedSquare);
      }

      // Check if this pseudo-legal move actually completes a source_destination puzzle
      if (isSourceDestMode && to?.toLowerCase() === illegalConfig?.destinationSquare?.toLowerCase()) {
        if (!illegalConfig?.sourceSquare || from === trackedSquare) {
          setTimeout(() => {
            setFeedback('solved');
            playSound('solved');
            if (onPuzzleSolved) onPuzzleSolved(undefined, [...moveHistory, from + to]);
          }, 50);
          return;
        }
      }

      // DELAYED FEEDBACK (only if not solved)
      setTimeout(() => {
        setFeedback("wrong");
        playSound('wrong');
        if (onWrongMove) onWrongMove([...moveHistory, from + to]);
      }, 200);
    }
  };

  // Helper: build a chess.js game from a pieces map, adding phantom kings
  // at squares that are NOT attacked by the opponent, ensuring no check.
  const buildIllegalGame = (piecesMap, activeColor) => {
    const opponentColor = activeColor === 'w' ? 'b' : 'w';
    const usedSquares = new Set(Object.keys(piecesMap));

    // Find a safe square for the ACTIVE king (not attacked by opponent)
    const candidateSquares = ['a1', 'h1', 'a8', 'h8', 'a2', 'h2', 'a7', 'h7',
      'b1', 'g1', 'b8', 'g8', 'c1', 'f1', 'c8', 'f8'];

    let activeKingSq = null, opponentKingSq = null;
    for (const sq of candidateSquares) {
      if (!usedSquares.has(sq) && !isSquareAttackedBy(sq, opponentColor, piecesMap)) {
        activeKingSq = sq; break;
      }
    }
    if (!activeKingSq) {
      for (const sq of candidateSquares) { if (!usedSquares.has(sq)) { activeKingSq = sq; break; } }
    }
    if (activeKingSq) usedSquares.add(activeKingSq);

    // Opponent king: safe from active color's pieces (so it's not in check either)
    const piecesWithActiveKing = { ...piecesMap };
    if (activeKingSq) piecesWithActiveKing[activeKingSq] = { type: 'k', color: activeColor };
    for (const sq of candidateSquares) {
      if (!usedSquares.has(sq) && !isSquareAttackedBy(sq, activeColor, piecesWithActiveKing)) {
        opponentKingSq = sq; break;
      }
    }
    if (!opponentKingSq) {
      for (const sq of candidateSquares) { if (!usedSquares.has(sq)) { opponentKingSq = sq; break; } }
    }

    // Build chess.js instance
    const chess = new Chess();
    chess.clear();
    Object.entries(piecesMap).forEach(([sq, p]) => { try { chess.put({ type: p.type, color: p.color }, sq); } catch (e) { } });
    if (activeKingSq) { try { chess.put({ type: 'k', color: activeColor }, activeKingSq); } catch (e) { } }
    if (opponentKingSq) { try { chess.put({ type: 'k', color: opponentColor }, opponentKingSq); } catch (e) { } }
    const fenParts = chess.fen().split(' ');
    fenParts[1] = activeColor;
    return fenParts.join(' ');
  };

  const handleIllegalMove = (from, to) => {
    const playerColor = (() => {
      if (firstMoveBy === 'w' || firstMoveBy === 'b') return firstMoveBy;
      return game.turn();
    })();
    const opponentColor = playerColor === 'w' ? 'b' : 'w';

    // Build current "real" pieces map — no kings (they're phantom)
    const rawBoard = game.board();
    const piecesMap = {};
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = rawBoard[r][c];
        if (p) {
          const sq = String.fromCharCode(97 + c) + (8 - r);
          piecesMap[sq] = { type: p.type, color: p.color };
        }
      }
    }

    const movingPiece = piecesMap[from];
    if (!movingPiece || movingPiece.color !== playerColor) return;

    // ── Validate move physically using chess.js with safe king positions ──────
    const validationFen = buildIllegalGame(piecesMap, playerColor);
    let moveResult = null;
    try {
      const tempGame = safeNewChess(validationFen);
      moveResult = tempGame.move({ from, to, promotion: 'q' });
    } catch (e) { return; }
    if (!moveResult) return;

    // ── Apply move to our pieces map ─────────────────────────────────────────
    const newPieces = { ...piecesMap };
    delete newPieces[from];
    newPieces[to] = movingPiece;

    const newHistory = [...moveHistory, moveResult.san];

    const isAttacked = isSquareAttackedBy(to, opponentColor, newPieces);
    const isSourceDestMode = illegalConfig?.subType === 'source_destination';

    if (isAttacked) {
      // ── ILLEGAL! Moved into an attacked square ────────────────────────────
      // Rebuild game state so board reflects the move immediately
      const wrongFen = buildIllegalGame(newPieces, playerColor);
      try { setGame(safeNewChess(wrongFen)); } catch (e) { }
      setLastMove({ from, to });
      playSound('wrong');

      setTimeout(() => {
        setFeedback('wrong');
        setMoveHistory(newHistory);
        if (onWrongMove) onWrongMove(newHistory);
        if (onBoardStateChangeRef.current) onBoardStateChangeRef.current(wrongFen, newHistory);
      }, 200);
      return;
    }

    // ── Safe move ─────────────────────────────────────────────────────────────
    playSound(moveResult.san.includes('x') ? 'capture' : 'move');
    setMoveHistory(newHistory);
    setLastMove({ from, to });
    setFeedback(null);

    // Rebuild game with new piece positions
    const nextFen = buildIllegalGame(newPieces, playerColor);
    try { setGame(safeNewChess(nextFen)); } catch (e) { }

    if (isSourceDestMode) {
      // Update the tracked piece if it was the one that moved
      let currentTrackedSquare = trackedSquare;
      if (from === currentTrackedSquare) {
        currentTrackedSquare = to;
        setTrackedSquare(to);
      }

      // Check if tracked piece reached destination
      if (currentTrackedSquare?.toLowerCase() === illegalConfig?.destinationSquare?.toLowerCase()) {
        setTimeout(() => {
          setFeedback('solved');
          playSound('solved');
          if (onPuzzleSolved) onPuzzleSolved(undefined, newHistory);
        }, 50);
      }
    } else {
      // Normal Illegal Puzzle: Check win by no opponent pieces remaining
      const opponentPiecesRemain = Object.values(newPieces).some(p => p.color === opponentColor);

      if (!opponentPiecesRemain) {
        // ── ALL OPPONENT PIECES CAPTURED → SOLVED! ────────────────────────────
        setTimeout(() => {
          setFeedback('solved');
          playSound('solved');
          if (onPuzzleSolved) onPuzzleSolved(undefined, newHistory);
        }, 50);
      }
    }

    if (onBoardStateChangeRef.current) onBoardStateChangeRef.current(nextFen, newHistory);
  };

  // Helper to get normalized active color for illegal puzzles
  const getIllegalActiveColor = () => {
    if (illegalConfig?.playerSide) return illegalConfig.playerSide;
    if (firstMoveBy === 'w' || firstMoveBy === 'b') return firstMoveBy;
    return game.turn();
  };

  const checkCaptureWinCondition = (currentCaptured) => {
    // In unified capture mode, ANY captured target (emoji or piece) counts towards solving.
    return currentCaptured.length >= captureTargets.length;
  };

  const handleCaptureMove = (from, to) => {
    const playerColor = captureConfig?.playerSide || userColor;
    const mode = captureConfig?.mode || 'objects';

    // For Pieces mode, we use the "illegal" logic where moves into attacked squares are rejected
    if (mode === 'pieces') {
      const opponentColor = playerColor === 'w' ? 'b' : 'w';

      // Build current "real" pieces map — no kings (they're phantom)
      const rawBoard = game.board();
      const piecesMap = {};
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = rawBoard[r][c];
          if (p) {
            const sq = String.fromCharCode(97 + c) + (8 - r);
            piecesMap[sq] = { type: p.type, color: p.color };
          }
        }
      }

      const movingPiece = piecesMap[from];
      if (!movingPiece || movingPiece.color !== playerColor) return;

      // Validate move physically
      const validationFen = buildIllegalGame(piecesMap, playerColor);
      let moveResult = null;
      try {
        const tempGame = safeNewChess(validationFen);
        moveResult = tempGame.move({ from, to, promotion: 'q' });
      } catch (e) { return; }
      if (!moveResult) return;

      // NEW: Rule 1 - Resolve attacker first. Check if source square is under attack before the move.
      const isSourceAttacked = isSquareAttackedBy(from, opponentColor, piecesMap);

      // Apply move to our pieces map
      const newPieces = { ...piecesMap };
      delete newPieces[from];
      newPieces[to] = movingPiece;

      const newHistory = [...moveHistory, moveResult.san];

      // Rule 2 - Unsafe destination. Check if 'to' is attacked by any opponent piece after the move
      const isAttacked = isSquareAttackedBy(to, opponentColor, newPieces);

      if (isSourceAttacked || isAttacked) {
        playSound('wrong');
        setFeedback('wrong');
        if (onWrongMove) onWrongMove(newHistory);
        return;
      }

      playSound(moveResult.san.includes('x') ? 'capture' : 'move');
      setMoveHistory(newHistory);
      setLastMove({ from, to });
      setFeedback(null);

      const nextFen = buildIllegalGame(newPieces, playerColor);
      const nextGame = safeNewChess(nextFen);
      setGame(nextGame);

      // Check win condition using the NEW Pieces logic
      // No opponent pieces remaining
      const opponentPiecesRemain = Object.values(newPieces).some(p => p.color === opponentColor);
      if (!opponentPiecesRemain) {
        setTimeout(() => {
          setFeedback('solved');
          playSound('solved');
          if (onPuzzleSolved) onPuzzleSolved(undefined, newHistory);
        }, 300);
      }

      if (onBoardStateChangeRef.current) onBoardStateChangeRef.current(nextFen, newHistory);
      return;
    }

    // --- Objects Mode (formerly Kids) ---
    const moveAttempt = { from, to, promotion: "q" };
    let result = null;
    try {
      result = game.move(moveAttempt);
    } catch (e) {
      result = null;
    }

    if (!result) return;

    const targetHit = captureTargets.find((t) => t.square === to);
    const isCapture = !!targetHit;

    playSound(isCapture ? "capture" : "move");

    const newHistory = [...moveHistory, result.san];
    setMoveHistory(newHistory);
    setLastMove({ from, to });

    let newCaptured = capturedTargets;
    if (targetHit) {
      if (!capturedTargets.includes(targetHit.square)) {
        newCaptured = [...capturedTargets, targetHit.square];
        setCapturedTargets(newCaptured);
      }
    }

    const currentFen = game.fen();
    const fenParts = currentFen.split(" ");
    fenParts[1] = userColor;
    const newFen = fenParts.join(" ");

    setGame(new Chess(newFen));
    setFeedback(null);

    if (checkCaptureWinCondition(newCaptured)) {
      setTimeout(() => {
        setFeedback("solved");
        playSound("solved");
        if (onPuzzleSolved) onPuzzleSolved(undefined, newHistory);
      }, 300);
    }

    if (onBoardStateChange) {
      onBoardStateChange(newFen, newHistory);
    }
  };

  const handleUserMove = (from, to, promotion = null) => {
    // ─── HARD GATE: never process moves when board is locked ─────────────────
    if (!interactiveRef.current) return;

    // Branch based on Puzzle Type
    if (puzzleType === "capture") {
      handleCaptureMove(from, to);
      return;
    }

    // ── TEST SOLVE MODE VALIDATION ──────────────────────────────────────────
    if (testSolveMode && puzzleType !== "illegal") {
      // Construct a board with the correct active color to test the move
      let validationGame = safeNewChess(game.fen());
      const activeColor = userColor;

      if (validationGame.turn() !== activeColor) {
        const fenParts = validationGame.fen().split(' ');
        fenParts[1] = activeColor;
        try {
          validationGame = safeNewChess(fenParts.join(' '));
        } catch (e) {
          // Fallback if forced turn fails
          validationGame = safeNewChess(game.fen());
        }
      }

      // 1 & 4. Use chess.move(move) for validation
      const moveAttempt = { from, to, promotion: promotion || "q" };
      let moveResult = null;
      try {
        moveResult = validationGame.move(moveAttempt);
      } catch (e) {
        try {
          moveResult = validationGame.move({ from, to });
        } catch (err) {
          moveResult = null;
        }
      }

      if (!moveResult) {
        // Illegal move -> mark as wrong (Reject only illegal moves)
        playSound("wrong");
        setFeedback("wrong");
        if (onWrongMove) onWrongMove([...moveHistory, from + to]);
        return;
      }

      // Move is accepted (not null)
      const playedMoveFormatted = moveResult.san; // Normalized played move (SAN)
      let isCorrect = false;

      // 2 & 3. Normalize expected legal moves (solution array) into SAME format (SAN)
      const expectedMovesSAN = [];
      const baseGame = safeNewChess(validationGame.fen()); // fen before move

      // Reverse applying the move because validationGame already has it applied
      baseGame.undo(); // Undo the move so we can test the expected moves from the original state

      solution.forEach(expectedMove => {
        const tempGame = safeNewChess(baseGame.fen());
        try {
          const res = tempGame.move(expectedMove);
          if (res) expectedMovesSAN.push(res.san);
        } catch (e) {
          // Try sloppy parsing (e.g. e2e4)
          if (typeof expectedMove === "string" && (expectedMove.length === 4 || expectedMove.length === 5)) {
            const f = expectedMove.substring(0, 2);
            const t = expectedMove.substring(2, 4);
            const p = expectedMove.length === 5 ? expectedMove[4] : undefined;
            try {
              const res = tempGame.move({ from: f, to: t, promotion: p });
              if (res) expectedMovesSAN.push(res.san);
            } catch (err) { }
          }
        }
      });

      // 1. Validation must ONLY check whether the played move exists in the list of legal moves
      isCorrect = expectedMovesSAN.some(m => m.toLowerCase() === playedMoveFormatted.toLowerCase());

      // 5. Fix popup logic: show "Correct" or "Wrong"
      const newHistory = [...moveHistory, playedMoveFormatted];
      setGame(safeNewChess(validationGame.fen()));
      setMoveHistory(newHistory);
      setLastMove({ from, to });

      if (isCorrect) {
        playSound(playedMoveFormatted.includes("x") ? "capture" : "move");
        setTimeout(() => {
          setFeedback("solved");
          playSound("solved");
          if (onPuzzleSolved) onPuzzleSolved(undefined, newHistory);
        }, 50);
      } else {
        playSound("wrong");
        setFeedback("wrong");
        if (onWrongMove) onWrongMove(newHistory);
      }

      if (onBoardStateChange) {
        onBoardStateChange(validationGame.fen(), newHistory);
      }
      return;
    }

    // ── ILLEGAL MOVE PUZZLE (Avoid Illegal Move) ────────────────────────────
    if (puzzleType === "illegal") {
      handleIllegalMoveAttempt(from, to);
      return;
    }

    // Normal Puzzle Logic
    if (game.turn() !== userColor) return;

    // Check for promotion requirement if not supplied
    if (!promotion) {
      const piece = game.get(from);
      if (
        piece?.type === "p" &&
        ((piece.color === "w" && to[1] === "8") ||
          (piece.color === "b" && to[1] === "1"))
      ) {
        setPromotionPending({ from, to, color: piece.color });
        return;
      }
    }

    const moveAttempt = { from, to, promotion: promotion || "q" };
    let result = null;
    try {
      try {
        result = game.move(moveAttempt);
      } catch (e) {
        try {
          result = game.move({ from, to });
        } catch (e2) {
          result = null;
        }
      }
    } catch (e) {
      result = null;
    }

    if (!result) return;

    const san = result.san;
    const isCapture = san.includes("x");
    playSound(isCapture ? "capture" : "move");

    const newHistory = [...moveHistory, san];
    setMoveHistory(newHistory);
    setLastMove({ from, to });
    const isCheckmateNow = game.isCheckmate();

    const userMoveSan = normalizeSAN(san);

    const nextValidIndices = validPathIndices.filter((idx) => {
      const path = allNormalizedPaths[idx];
      return (
        path &&
        path[solutionIndex] &&
        normalizeSAN(path[solutionIndex]) === userMoveSan
      );
    });

    if (nextValidIndices.length > 0) {
      setFeedback("correct");
      setValidPathIndices(nextValidIndices);

      let nextIndex = solutionIndex + 1;

      const winningPathIndex = nextValidIndices.find(
        (idx) => nextIndex >= allNormalizedPaths[idx].length,
      );
      setGame(safeNewChess(game.fen()));
      setSolutionIndex(nextIndex);

      if (winningPathIndex !== undefined || isCheckmateNow) {
        setTimeout(() => {
          setFeedback("solved");
          playSound("solved");
          if (onPuzzleSolved) onPuzzleSolved(undefined, newHistory);
        }, 50);
      }
    } else {
      if (onWrongMove) onWrongMove(newHistory);
      resetToInitial();
    }

    if (onBoardStateChange) {
      // Immediate sync for smoother competitive feel
      onBoardStateChange(game.fen(), newHistory);
    }
  };

  const handlePromotionSelect = (pieceChar) => {
    if (!promotionPending) return;
    const { from, to } = promotionPending;
    setPromotionPending(null);
    handleUserMove(from, to, pieceChar);
  };

  const handleSquareClick = (square) => {
    // ─── HARD GATE: block all clicks when board is not interactive ────────────
    if (!interactiveRef.current) return;
    if (feedback === "solved" || isDragging) return;

    // Clear annotations on any left click
    clearAnnotations();

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
      const activeColor = puzzleType === 'illegal' ? getIllegalActiveColor() : game.turn();
      const piece = getPiece(square);
      // Phantom kings are at corners in illegal mode; don't allow selecting them.
      const isPhantom = puzzleType === 'illegal' && piece?.type === 'k' && ['a1', 'h1', 'a8', 'h8'].includes(square) && square !== illegalConfig?.sourceSquare && square !== trackedSquare;
      if (piece && piece.color === activeColor && !isPhantom) {
        setSelectedSquare(square);
        const moves = puzzleType === 'illegal' ? getPseudoLegalMoves(square) : game.moves({ square, verbose: true }).map(m => m.to);

        // For illegal mode, filter move targets to exclude king-hiding corners
        const cornerSquares = ['a1', 'h1', 'a8', 'h8'];
        const filteredMoves = puzzleType === 'illegal'
          ? moves.filter(m => !cornerSquares.includes(m) || m?.toLowerCase() === illegalConfig?.destinationSquare?.toLowerCase())
          : moves;
        setPossibleMoves(filteredMoves);
        return;
      }
      setSelectedSquare(null);
      setPossibleMoves([]);
    } else {
      const piece = getPiece(square);
      if (!piece) return;
      const activeColor = puzzleType === 'illegal' ? getIllegalActiveColor() : game.turn();
      if (piece.color !== activeColor) return;
      // Don't allow selecting phantom kings in illegal mode
      if (puzzleType === 'illegal' && piece.type === 'k' && ['a1', 'h1', 'a8', 'h8'].includes(square) && square !== illegalConfig?.sourceSquare && square !== trackedSquare) return;

      setSelectedSquare(square);
      const moves = puzzleType === 'illegal' ? getPseudoLegalMoves(square) : game.moves({ square, verbose: true }).map(m => m.to);
      const cornerSquares = ['a1', 'h1', 'a8', 'h8'];
      const filteredMoves = puzzleType === 'illegal'
        ? moves.filter(m => !cornerSquares.includes(m) || m?.toLowerCase() === illegalConfig?.destinationSquare?.toLowerCase())
        : moves;
      setPossibleMoves(filteredMoves);
    }
  };

  // Keep a ref to the latest handleUserMove to avoid stale closures in event handlers
  const handleUserMoveRef = useRef(handleUserMove);
  useEffect(() => {
    handleUserMoveRef.current = handleUserMove;
  });

  const clearAnnotations = useCallback(() => {
    setArrows([]);
    setCircles([]);
  }, []);

  const [floatingSize, setFloatingSize] = useState(60);


  // Custom Mouse Drag Handlers
  useEffect(() => {
    mouseHandlersRef.current.arrowMove = (e) => {
      if (!arrowDragStateRef.current.isDrawing || !boardRef.current) return;

      if (arrowDragStateRef.current.rafId) {
        cancelAnimationFrame(arrowDragStateRef.current.rafId);
      }

      arrowDragStateRef.current.rafId = requestAnimationFrame(() => {
        const rect = boardRef.current.getBoundingClientRect();
        const rawX = ((e.clientX - rect.left) / rect.width) * 100;
        const rawY = ((e.clientY - rect.top) / rect.height) * 100;

        const startX = arrowDragStateRef.current.startX;
        const startY = arrowDragStateRef.current.startY;

        const dx = rawX - startX;
        const dy = rawY - startY;
        const length = Math.sqrt(dx * dx + dy * dy);

        // Determine current hover square to decide if we show the arrow
        const squareSize = rect.width / 8;
        const fileIndex = Math.floor((e.clientX - rect.left) / squareSize);
        const rankIndex = Math.floor((e.clientY - rect.top) / squareSize);
        let hoverSquare = null;
        if (fileIndex >= 0 && fileIndex < 8 && rankIndex >= 0 && rankIndex < 8) {
          const currentFiles = userColor === "w" ? files : [...files].reverse();
          const currentRanks = userColor === "w" ? ranks : [...ranks].reverse();
          hoverSquare = getSquare(currentFiles[fileIndex], currentRanks[rankIndex]);
        }

        const isSameSquare = hoverSquare === arrowDragStateRef.current.startSquare;
        const lineNode = document.getElementById("current-arrow-line");

        if (lineNode) {
          if (isSameSquare || length === 0) {
            lineNode.setAttribute("opacity", "0");
          } else {
            const ratio = Math.max(0, (length - 4.5)) / length;
            const endX = startX + dx * ratio;
            const endY = startY + dy * ratio;

            lineNode.setAttribute("x2", endX);
            lineNode.setAttribute("y2", endY);
            lineNode.setAttribute("opacity", "0.7");
          }
        }
      });
    };

    mouseHandlersRef.current.arrowUp = (e) => {
      if (!arrowDragStateRef.current.isDrawing) return;
      arrowDragStateRef.current.isDrawing = false;
      if (arrowDragStateRef.current.rafId) {
        cancelAnimationFrame(arrowDragStateRef.current.rafId);
      }
      document.removeEventListener("mousemove", mouseHandlersRef.current.arrowMove);
      document.removeEventListener("mouseup", mouseHandlersRef.current.arrowUp);

      const lineNode = document.getElementById("current-arrow-line");
      if (lineNode) {
        lineNode.setAttribute("opacity", "0");
      }

      let targetSquare = null;
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        const squareSize = rect.width / 8;
        const fileIndex = Math.floor((e.clientX - rect.left) / squareSize);
        const rankIndex = Math.floor((e.clientY - rect.top) / squareSize);

        if (fileIndex >= 0 && fileIndex < 8 && rankIndex >= 0 && rankIndex < 8) {
          const currentFiles = userColor === "w" ? files : [...files].reverse();
          const currentRanks = userColor === "w" ? ranks : [...ranks].reverse();
          targetSquare = getSquare(currentFiles[fileIndex], currentRanks[rankIndex]);
        }
      }

      if (targetSquare && targetSquare !== arrowDragStateRef.current.startSquare) {
        setArrows(prev => {
          const exists = prev.some(a => a.from === arrowDragStateRef.current.startSquare && a.to === targetSquare);
          if (exists) {
            return prev.filter(a => !(a.from === arrowDragStateRef.current.startSquare && a.to === targetSquare));
          }
          return [...prev, { 
            from: arrowDragStateRef.current.startSquare, 
            to: targetSquare, 
            color: arrowColorRef.current 
          }];
        });
      } else if (targetSquare === arrowDragStateRef.current.startSquare) {
        // Single right click on a square, toggle circle
        setCircles(prev => {
          if (prev.includes(targetSquare)) {
            return prev.filter(s => s !== targetSquare);
          }
          return [...prev, targetSquare];
        });
      } else {
        // Single right click on empty area or clicked outside board squares
        clearAnnotations();
      }
    };

    mouseHandlersRef.current.handleMouseMove = (e) => {
      if (!boardRef.current || !wrapperRef.current) return;

      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      const currentLogicalX = (e.clientX - wrapperRect.left) / scale;
      const currentLogicalY = (e.clientY - wrapperRect.top) / scale;

      setDragPosition({
        x: currentLogicalX,
        y: currentLogicalY,
      });

      const rect = boardRef.current.getBoundingClientRect();
      const squareSize = rect.width / 8;

      const fileIndex = Math.floor((e.clientX - rect.left) / squareSize);
      const rankIndex = Math.floor((e.clientY - rect.top) / squareSize);

      if (fileIndex >= 0 && fileIndex < 8 && rankIndex >= 0 && rankIndex < 8) {
        const currentFiles = userColor === "w" ? files : [...files].reverse();
        const currentRanks = userColor === "w" ? ranks : [...ranks].reverse();
        const targetSquare = getSquare(
          currentFiles[fileIndex],
          currentRanks[rankIndex],
        );

        const possible = dragStateRef.current.possibleMoves;
        if (possible.includes(targetSquare)) {
          setDragOverSquare(targetSquare);
        } else {
          setDragOverSquare(null);
        }
      } else {
        setDragOverSquare(null);
      }
    };

    mouseHandlersRef.current.handleMouseUp = (e) => {
      isMouseDownRef.current = false;

      document.removeEventListener(
        "mousemove",
        mouseHandlersRef.current.handleMouseMove,
      );
      document.removeEventListener(
        "mouseup",
        mouseHandlersRef.current.handleMouseUp,
      );

      const currentDraggedPiece = dragStateRef.current.draggedPiece;
      const currentPossibleMoves = dragStateRef.current.possibleMoves;

      let targetSquare = null;
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        const squareSize = rect.width / 8;
        const fileIndex = Math.floor((e.clientX - rect.left) / squareSize);
        const rankIndex = Math.floor((e.clientY - rect.top) / squareSize);

        if (
          fileIndex >= 0 &&
          fileIndex < 8 &&
          rankIndex >= 0 &&
          rankIndex < 8
        ) {
          const currentFiles = userColor === "w" ? files : [...files].reverse();
          const currentRanks = userColor === "w" ? ranks : [...ranks].reverse();
          targetSquare = getSquare(
            currentFiles[fileIndex],
            currentRanks[rankIndex],
          );
        }
      }

      setIsDragging(false);
      setDraggedPiece(null);
      setDragOverSquare(null);
      setDraggedPieceImage(null);

      dragStateRef.current = { draggedPiece: null, possibleMoves: [] };

      // handleUserMove itself checks interactiveRef, so this is safe
      if (
        currentDraggedPiece &&
        targetSquare &&
        targetSquare !== currentDraggedPiece &&
        currentPossibleMoves.includes(targetSquare)
      ) {
        if (handleUserMoveRef.current) {
          handleUserMoveRef.current(currentDraggedPiece, targetSquare);
        }
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    };
  }, [userColor, scale]);

  const startArrowDrag = (square, e) => {
    const center = getSquareCenter(square);
    arrowDragStateRef.current = {
      isDrawing: true,
      startSquare: square,
      startX: center.x,
      startY: center.y,
      rafId: null
    };

    // Reset to default green for new drag
    arrowColorRef.current = "#43732F";

    const lineNode = document.getElementById("current-arrow-line");
    if (lineNode) {
      lineNode.setAttribute("x1", center.x);
      lineNode.setAttribute("y1", center.y);
      lineNode.setAttribute("x2", center.x);
      lineNode.setAttribute("y2", center.y);
      lineNode.setAttribute("stroke", "#43732F");
      lineNode.setAttribute("marker-end", "url(#arrowhead)");
      lineNode.setAttribute("opacity", "0"); // Hide initially until we move to another square
    }

    document.addEventListener("mousemove", mouseHandlersRef.current.arrowMove, { passive: false });
    document.addEventListener("mouseup", mouseHandlersRef.current.arrowUp, { passive: false });
  };

  const startDrag = (square, e) => {
    // Use ref so this always reads the latest interactive value
    if (!interactiveRef.current) return;

    const piece = getPiece(square);
    const moves = puzzleType === "illegal"
      ? getPseudoLegalMoves(square)
      : (game.moves({ square, verbose: true }) || []).map((m) => m.to);

    // For illegal mode, filter move targets to exclude king-hiding corners
    const cornerSquares = ['a1', 'h1', 'a8', 'h8'];
    const movesToSquares = puzzleType === 'illegal'
      ? moves.filter(m => !cornerSquares.includes(m) || m?.toLowerCase() === illegalConfig?.destinationSquare?.toLowerCase())
      : moves;

    dragStateRef.current = {
      draggedPiece: square,
      possibleMoves: movesToSquares,
    };

    setIsDragging(true);
    setDraggedPiece(square);
    setDraggedPieceImage(
      pieceImages[piece.color === "w" ? piece.type.toUpperCase() : piece.type],
    );
    setPossibleMoves(movesToSquares);

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const logicalX = (e.clientX - wrapperRect.left) / scale;
    const logicalY = (e.clientY - wrapperRect.top) / scale;
    setDragPosition({
      x: logicalX,
      y: logicalY,
    });

    // SNAPPING TO CENTER: Calculate offset as half of the floating piece size
    const boardRect = boardRef.current.getBoundingClientRect();
    const squareSize = boardRect.width / 8;
    const size = squareSize * 0.9; // Keep size same as original
    setFloatingSize(size);

    // Offset is half the size to center it on cursor
    const offsetValue = (size / 2) / scale;
    setDragOffset({ x: offsetValue, y: offsetValue });

    document.addEventListener(
      "mousemove",
      mouseHandlersRef.current.handleMouseMove,
      { passive: false },
    );
    document.addEventListener(
      "mouseup",
      mouseHandlersRef.current.handleMouseUp,
      { passive: false },
    );
  };

  const handleMouseDown = (e, square) => {
    // Use ref so this always reads the latest interactive value
    if (!interactiveRef.current) return;
    if (feedback === "solved") return;

    const piece = getPiece(square);
    const activeColor = puzzleType === 'illegal' ? getIllegalActiveColor() : game.turn();
    // Only clear annotations and start moves on left click (button 0)
    if (e.button === 0) {
      if (!piece || piece.color !== activeColor) {
        // Clicked on empty square or opponent piece
        clearAnnotations();
        return;
      }
      // Clear annotations when starting a move with own piece
      clearAnnotations();
    } else {
      // For right clicks on pieces, don't clear anything and let the square's mousedown handle it
      return;
    }

    // Don't allow dragging phantom kings in illegal mode
    if (puzzleType === 'illegal' && piece.type === 'k' && ['a1', 'h1', 'a8', 'h8'].includes(square) && square !== illegalConfig?.sourceSquare && square !== trackedSquare) return;

    if (e.button !== 0) return;
    isMouseDownRef.current = true;
    startDrag(square, e);
  };

  const isLightSquare = (fileIndex, rankIndex) =>
    (fileIndex + rankIndex) % 2 === 0;
  const isSelected = (square) => selectedSquare === square;
  const isPossibleMove = (square) => possibleMoves.includes(square);
  const isLastMove = (square) =>
    lastMove && (lastMove.from === square || lastMove.to === square);

  // SVG Annotation Rendering (Arrows and Circles)
  const renderAnnotations = () => {
    return (
      <svg
        viewBox="0 0 100 100"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 50,
        }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="2.5" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 z" fill="#43732F" />
          </marker>
          <marker id="arrowhead-red" markerWidth="4" markerHeight="4" refX="2.5" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 z" fill="#F44336" />
          </marker>
          <marker id="arrowhead-yellow" markerWidth="4" markerHeight="4" refX="2.5" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 z" fill="#FFEB3B" />
          </marker>
          <marker id="arrowhead-blue" markerWidth="4" markerHeight="4" refX="2.5" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 z" fill="#2196F3" />
          </marker>
        </defs>

        {/* Render Circles */}
        {circles.map((square, i) => {
          const center = getSquareCenter(square);
          return (
            <circle
              key={`circle-${i}`}
              cx={center.x}
              cy={center.y}
              r="5.5"
              fill="none"
              stroke="#43732F"
              strokeWidth="0.8"
              opacity="0.7"
            />
          );
        })}

        {/* Permanent line for active drawing (avoids React re-renders during drag) */}
        <line
          id="current-arrow-line"
          x1="0"
          y1="0"
          x2="0"
          y2="0"
          stroke="#43732F"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0"
          markerEnd="url(#arrowhead)"
        />

        {arrows.map((arrow, i) => {
          const start = getSquareCenter(arrow.from);
          const end = getSquareCenter(arrow.to);

          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const length = Math.sqrt(dx * dx + dy * dy);

          if (length === 0) return null;

          const ratio = Math.max(0, (length - 3.5)) / length;
          const endX = start.x + dx * ratio;
          const endY = start.y + dy * ratio;

          const color = arrow.color || "#43732F";
          let markerId = "arrowhead";
          if (color === "#F44336") markerId = "arrowhead-red";
          else if (color === "#FFEB3B") markerId = "arrowhead-yellow";
          else if (color === "#2196F3") markerId = "arrowhead-blue";

          return (
            <line
              key={`arrow-${i}`}
              x1={start.x}
              y1={start.y}
              x2={endX}
              y2={endY}
              stroke={color}
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.7"
              markerEnd={`url(#${markerId})`}
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div
      ref={containerRef}
      className={styles.boardContainer}
      style={{
        width: '100%',
        height: 'auto',
        padding: '0',
        overflow: 'hidden',
        border: 'none',
        boxShadow: 'none'
      }}
    >
      <div
        ref={wrapperRef}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          width: '100%',
          display: "flex",
          flexDirection: "column",
          border: "3px solid var(--border-gold)",

          boxSizing: 'border-box',
          overflow: 'hidden',
          position: 'relative'
        }}
        className={styles.boardWrapper}
      >
        {feedback && (
          <div className={`${styles.feedback} ${styles[feedback]}`}>
            {feedback === "correct" &&
              (puzzleType === "kids" ? "Great job!" : "✓ Correct!")}
            {feedback === "wrong" && "✗ Wrong Move!"}
            {feedback === "solved" && "Puzzle Solved!"}
          </div>
        )}

        {/* Promotion Modal Overlay */}
        {promotionPending && (
          <div className={styles.promotionOverlay}>
            <div className={styles.promotionModal}>
              <div className={styles.promotionHeader}>Choose Promotion</div>
              <div className={styles.promotionOptions}>
                {["q", "r", "b", "n"].map((p) => (
                  <div
                    key={p}
                    className={styles.promotionOption}
                    onClick={() => handlePromotionSelect(p)}
                  >
                    <img
                      src={
                        pieceImages[
                        promotionPending.color === "w" ? p.toUpperCase() : p
                        ]
                      }
                      alt={p}
                    />
                  </div>
                ))}
              </div>
              <div
                className={styles.promotionCancel}
                onClick={() => setPromotionPending(null)}
              >
                ✕
              </div>
            </div>
          </div>
        )}

        <div className={styles.board} ref={boardRef} style={{ position: 'relative' }}>
          {renderAnnotations()}
          {(userColor === 'w' ? ranks : [...ranks].reverse()).flatMap((rank, rankIndex) =>
            (userColor === 'w' ? files : [...files].reverse()).map((file, fileIndex) => {

              const square = getSquare(file, rank);
              const piece = getPiece(square);
              const isLight = isLightSquare(fileIndex, rankIndex);
              const squareColor = isLight ? currentBoardColors.light : currentBoardColors.dark;

              let captureContent = null;

              if (puzzleType === 'capture' && (captureConfig?.mode === 'objects' || captureConfig?.targets?.length > 0)) {
                const target = captureTargets.find(t => t.square === square);
                if (target && !capturedTargets.includes(square)) {
                  const isEmoji = ['pizza', 'chocolate', 'star', '⭐', 'burger'].includes(target.item);
                  if (isEmoji) {
                    captureContent = (
                      <div className={styles.piece} style={{ fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        {(() => {
                          const starIcon = <img src={updatedStar} alt="star" style={{ width: '40px', height: '40px' }} />;
                          const icons = { pizza: '🍕', chocolate: '🍫', star: starIcon, '⭐': starIcon, burger: '🍔' };
                          return icons[target.item] || '🍔';
                        })()}
                      </div>
                    );
                  } else {
                    // It's a chess piece object
                    const objectColor = captureConfig?.playerSide === 'w' ? 'b' : 'w';
                    captureContent = (
                      <img
                        src={pieceImages[objectColor === 'w' ? target.item.toUpperCase() : target.item]}
                        alt=""
                        className={styles.piece}
                        style={{ zIndex: 10, pointerEvents: 'none' }}
                      />
                    );
                  }
                }
              }

              // Illegal and Capture mode: hide phantom kings at corners (injected for chess.js)
              if ((puzzleType === 'illegal' || puzzleType === 'capture') && piece && piece.type === 'k') {
                const cornerSquares = ['a1', 'h1', 'a8', 'h8'];
                // Only hide if it's NOT a square we care about (source, destination, tracked, or capture target)
                const isImportantSquare =
                  square?.toLowerCase() === illegalConfig?.destinationSquare?.toLowerCase() ||
                  square?.toLowerCase() === illegalConfig?.sourceSquare?.toLowerCase() ||
                  square === trackedSquare ||
                  (puzzleType === 'capture' && captureTargets.some(t => t.square === square));

                if (cornerSquares.includes(square) && !isImportantSquare) {
                  // Override: render an empty square
                  return (
                    <div
                      key={square}
                      className={`
                        ${styles.square}
                        ${isSelected(square) ? styles.selected : ''}
                        ${isPossibleMove(square) ? styles.possibleMove : ''}
                        ${isLastMove(square) ? styles.lastMove : ''}
                        ${dragOverSquare === square ? styles.dragOver : ''}
                      `}
                      style={{ backgroundColor: squareColor }}
                      onClick={() => handleSquareClick(square)}
                    />
                  );
                }
              }

              let destinationContent = null;
              if (
                (puzzleType === 'illegal' || (puzzleType === 'normal' && illegalConfig?.destinationSquare)) &&
                illegalConfig?.subType === 'source_destination' &&
                square?.toLowerCase() === illegalConfig?.destinationSquare?.toLowerCase()
              ) {
                destinationContent = (
                  <div style={{ position: 'absolute', opacity: piece ? 0.3 : 0.8, fontSize: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', pointerEvents: 'none' }}>
                    🎯
                  </div>
                );
              }

              return (
                <div
                  key={square}
                  onContextMenu={(e) => e.preventDefault()}
                  onMouseDown={(e) => {
                    if (e.button === 2) {
                      e.preventDefault();
                      startArrowDrag(square, e);
                    } else if (e.button === 0) {
                      setArrows([]);
                    }
                  }}
                  className={`
                    ${styles.square}
                    ${isSelected(square) ? styles.selected : ''}
                    ${isPossibleMove(square) ? styles.possibleMove : ''}
                    ${isLastMove(square) ? styles.lastMove : ''}
                    ${dragOverSquare === square ? styles.dragOver : ''}
                    ${isDragging && draggedPiece === square ? styles.dragSource : ''}
                  `}
                  style={{ backgroundColor: squareColor, position: 'relative' }}
                  onClick={() => handleSquareClick(square)}
                >

                  {destinationContent}

                  {captureContent ? captureContent : (
                    piece && (
                      <img
                        src={pieceImages[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                        alt=""
                        className={`${styles.piece} ${isDragging && draggedPiece === square ? styles.dragSourcePiece : ''}`}
                        draggable={false}
                        onMouseDown={(e) => handleMouseDown(e, square)}
                        style={{
                          cursor: interactiveRef.current && game.turn() === piece.color && feedback !== 'solved'
                            ? 'grab'
                            : 'default',
                          position: 'relative',
                          zIndex: 2
                        }}
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
            }))}
        </div>

        {/* Floating dragged piece */}
        {isDragging && draggedPieceImage && (
          <img
            src={draggedPieceImage}
            alt="Dragged piece"
            className={styles.floatingPiece}
            style={{
              width: floatingSize,
              height: floatingSize,
              transform: `translate3d(${dragPosition.x - dragOffset.x}px, ${dragPosition.y - dragOffset.y}px, 0)`,
              willChange: 'transform'
            }}
          />
        )}
      </div>
    </div>
  );
}

export default ChessBoard;