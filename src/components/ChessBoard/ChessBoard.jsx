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
  kidsConfig = null,
  interactive = true,
  showSolution = false,
}) {
  const { currentBoardColors, pieceSet } = useTheme();
  const [game, setGame] = useState(new Chess(fen));

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
  const [kidsTargets, setKidsTargets] = useState([]); // Initial targets from config

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
    const newGame = new Chess(fen);
    setGame(newGame);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setFeedback(null);
    setSolutionIndex(0);
    setInitialFen(fen);
    setPromotionPending(null);

    // For normal puzzles, computer ALWAYS plays first.
    // So the user always plays the OPPOSITE side of the FEN's turn-to-move.
    if (puzzleType === "normal") {
      const turn = newGame.turn();
      setUserColor(turn === "w" ? "b" : "w");
    }

    // Initialize Kids Mode stuff
    setCapturedTargets([]);
    if (puzzleType === "kids" && kidsConfig) {
      setKidsTargets(kidsConfig.targets || []);
    } else {
      setKidsTargets([]);
    }

    // Normalize solution moves to SAN (only for normal)
    if (puzzleType === "normal") {
      const normalizePath = (path) => {
        try {
          const tempGame = new Chess(fen);
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
  }, [fen, solution, alternativeSolutions, puzzleType, kidsConfig]);

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

          const gameCopy = new Chess(game.fen());
          const result = gameCopy.move(nextMove);

          if (result) {
            playSound(result.san.includes("x") ? "capture" : "move");
            const newHistory = [...moveHistory, result.san];

            setMoveHistory(newHistory);
            setLastMove({ from: result.from, to: result.to });
            const nextSolutionIndex = solutionIndex + 1;
            setSolutionIndex(nextSolutionIndex);
            setGame(new Chess(gameCopy.fen()));

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
      }, 250);

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
          const restoredGame = new Chess(savedBoardState.fen);
          setGame(restoredGame);
          if (savedBoardState.moveHistory) {
            setMoveHistory(savedBoardState.moveHistory);
            setSolutionIndex(savedBoardState.moveHistory.length);
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
          setGame(new Chess(game.fen()));
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
      kidsTargets.some((t) => t.square === squareSan) && !isCapturedTarget;

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
      const resetGame = new Chess(initialFen);
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

  const checkKidsWinCondition = (currentCaptured) => {
    const totalTargets = kidsTargets.length;
    if (currentCaptured.length >= totalTargets) {
      return true;
    }
    return false;
  };

  const handleKidsMove = (from, to) => {
    const moveAttempt = { from, to, promotion: "q" };
    let result = null;
    try {
      result = game.move(moveAttempt);
    } catch (e) {
      result = null;
    }

    if (!result) return;

    const targetHit = kidsTargets.find((t) => t.square === to);
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

    if (checkKidsWinCondition(newCaptured)) {
      setTimeout(() => {
        setFeedback("solved");
        playSound("solved");
        if (onPuzzleSolved) onPuzzleSolved(undefined, newHistory);
      }, 300);
    }

    if (onBoardStateChange) {
      onBoardStateChange(game.fen(), newHistory);
    }
  };

  const handleUserMove = (from, to, promotion = null) => {
    // ─── HARD GATE: never process moves when board is locked ─────────────────
    // This is the final safety net — all click and drag paths funnel here.
    // Using the ref ensures we always read the latest prop value even inside
    // stale closures (drag handlers registered via addEventListener).
    if (!interactiveRef.current) return;

    // Branch based on Puzzle Type
    if (puzzleType === "kids") {
      handleKidsMove(from, to);
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
      setGame(new Chess(game.fen()));
      setSolutionIndex(nextIndex);

      if (winningPathIndex !== undefined || isCheckmateNow) {
        setTimeout(() => {
          setFeedback("solved");
          playSound("solved");
          if (onPuzzleSolved) onPuzzleSolved(undefined, newHistory);
        }, 300);
      }
    } else {
      if (onWrongMove) onWrongMove(newHistory);
      resetToInitial();
    }

    if (onBoardStateChange) {
      setTimeout(() => {
        onBoardStateChange(game.fen(), newHistory);
      }, 100);
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
      // Switch selection
      const piece = getPiece(square);
      if (piece && piece.color === game.turn()) {
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
      if (piece.color !== game.turn()) return;

      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true }) || [];
      setPossibleMoves(moves.map((m) => m.to));
    }
  };

  // Keep a ref to the latest handleUserMove to avoid stale closures in event handlers
  const handleUserMoveRef = useRef(handleUserMove);
  useEffect(() => {
    handleUserMoveRef.current = handleUserMove;
  });

  const [floatingSize, setFloatingSize] = useState(60);

  // Custom Mouse Drag Handlers
  useEffect(() => {
    mouseHandlersRef.current.handleMouseMove = (e) => {
      if (!boardRef.current || !wrapperRef.current) return;

      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      setDragPosition({
        x: (e.clientX - wrapperRect.left) / scale,
        y: (e.clientY - wrapperRect.top) / scale,
      });

      const rect = boardRef.current.getBoundingClientRect();

      const squareSize = rect.width / 8;
      setFloatingSize(squareSize * 0.9);

      const fileIndex = Math.floor((e.clientX - rect.left) / squareSize);
      const rankIndex = Math.floor((e.clientY - rect.top) / squareSize);

      if (fileIndex >= 0 && fileIndex < 8 && rankIndex >= 0 && rankIndex < 8) {
        const currentFiles = userColor === "w" ? files : [...files].reverse();
        const currentRanks = userColor === "w" ? ranks : [...ranks].reverse();
        const targetSquare = getSquare(
          currentFiles[fileIndex],
          currentRanks[rankIndex],
        );

        setPossibleMoves((prevMoves) => {
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

  const startDrag = (square, e) => {
    // Use ref so this always reads the latest interactive value
    if (!interactiveRef.current) return;

    const piece = getPiece(square);
    const moves = game.moves({ square, verbose: true }) || [];
    const movesToSquares = moves.map((m) => m.to);

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

    const pieceRect = e.target.getBoundingClientRect();
    const offsetX = (e.clientX - pieceRect.left) / scale;
    const offsetY = (e.clientY - pieceRect.top) / scale;
    setDragOffset({ x: offsetX, y: offsetY });

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
    if (!piece || piece.color !== game.turn()) return;

    if (e.button !== 0) return;

    isMouseDownRef.current = true;

    dragTimeoutRef.current = setTimeout(() => {
      if (isMouseDownRef.current) {
        startDrag(square, e);
      }
    }, 150);

    const quickMouseUp = () => {
      clearTimeout(dragTimeoutRef.current);
      isMouseDownRef.current = false;
      document.removeEventListener("mouseup", quickMouseUp);
    };

    document.addEventListener("mouseup", quickMouseUp, { once: true });
  };

  const isLightSquare = (fileIndex, rankIndex) =>
    (fileIndex + rankIndex) % 2 === 0;
  const isSelected = (square) => selectedSquare === square;
  const isPossibleMove = (square) => possibleMoves.includes(square);
  const isLastMove = (square) =>
    lastMove && (lastMove.from === square || lastMove.to === square);

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
        style={{
          width: '100%',
          display: "flex",
          flexDirection: "column",
          border: "3px solid var(--border-gold)",
          borderRadius: "8px",
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {feedback && (
          <div className={`${styles.feedback} ${styles[feedback]}`}>
            {feedback === "correct" &&
              (puzzleType === "kids" ? "Yummy! 😋" : "✓ Correct!")}
            {feedback === "wrong" && "✗ Wrong Move!"}
            {feedback === "solved" && "🎉 Puzzle Solved!"}
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

        <div className={styles.board} ref={boardRef}>
          {(userColor === 'w' ? ranks : [...ranks].reverse()).flatMap((rank, rankIndex) =>
            (userColor === 'w' ? files : [...files].reverse()).map((file, fileIndex) => {

              const square = getSquare(file, rank);
              const piece = getPiece(square);
              const isLight = isLightSquare(fileIndex, rankIndex);
              const squareColor = isLight ? currentBoardColors.light : currentBoardColors.dark;

              let kidsContent = null;

              if (puzzleType === 'kids') {
                const target = kidsTargets.find(t => t.square === square);
                if (target && !capturedTargets.includes(square)) {
                  kidsContent = (
                    <div className={styles.piece} style={{ fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {target.item === 'pizza' ? '🍕' :
                        target.item === 'chocolate' ? '🍫' :
                          target.item === 'star' ? '⭐' : '🎯'}
                    </div>
                  );
                }
              }

              if (puzzleType === 'kids' && !kidsContent && piece && piece.type === 'k') {
              }
              else if (puzzleType === 'kids' && !kidsContent && piece) {
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

                  {kidsContent ? kidsContent : (
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
                            : 'default'
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
              left: dragPosition.x - dragOffset.x,
              top: dragPosition.y - dragOffset.y,
              width: floatingSize,
              height: floatingSize
            }}
          />
        )}
      </div>
    </div>
  );
}

export default ChessBoard;