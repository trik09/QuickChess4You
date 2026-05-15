import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Chess } from "chess.js";
import { FaChess, FaSave, FaTimes, FaLightbulb, FaUndo, FaTrash } from "react-icons/fa";
import { PageHeader, Button } from "../../../components/Admin";
import { adminAPI, categoryAPI } from "../../../services/api";
import styles from "./CreatePuzzle.module.css";
import { useAuth } from "../../../contexts/AuthContext";
import toast, { Toaster } from 'react-hot-toast';
import ChessBoard from "../../../components/ChessBoard/ChessBoard";

// Import chess pieces
import whitePawn from '../../../assets/pieces/whitepawn.svg';
import whiteKnight from '../../../assets/pieces/whiteknight.svg';
import whiteBishop from '../../../assets/pieces/whitebishop.svg';
import whiteRook from '../../../assets/pieces/whiterook.svg';
import whiteQueen from '../../../assets/pieces/whitequeen.svg';
import whiteKing from '../../../assets/pieces/whiteking.svg';
import blackPawn from '../../../assets/pieces/blackpawn.svg';
import blackKnight from '../../../assets/pieces/blackknight.svg';
import blackBishop from '../../../assets/pieces/blackbishop.svg';
import blackRook from '../../../assets/pieces/blackrook.svg';
import blackQueen from '../../../assets/pieces/blackqueen.svg';
import blackKing from '../../../assets/pieces/blackking.svg';

const LEVEL_RANGES = {
  1: { easy: [300, 450], medium: [450, 600], hard: [600, 750] },
  2: { easy: [750, 900], medium: [900, 1050], hard: [1050, 1200] },
  3: { easy: [1200, 1350], medium: [1350, 1500], hard: [1500, 1650] },
  4: { easy: [1650, 1800], medium: [1800, 1950], hard: [1950, 2100] },
  5: { easy: [2100, 2250], medium: [2250, 2400], hard: [2400, 2550] },
  6: { easy: [2550, 2700], medium: [2700, 2850], hard: [2850, 3000] },
  7: { easy: [3000, 3160], medium: [3160, 3330], hard: [3330, 3500] }
};

function CreatePuzzle() {
  const navigate = useNavigate();
  const { isAdminAuthenticated } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // 'normal', 'capture', or 'illegal'
  const [puzzleType, setPuzzleType] = useState('normal');

  const [formData, setFormData] = useState({
    title: "",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    correctMove: "",
    alternativeSolutions: [],
    difficulty: "medium",
    category: "",
    description: "",
    hints: "",
    level: 1,
    rating: 300,
    firstMoveBy: 'w'
  });

  const [possibleSolutions, setPossibleSolutions] = useState([]);
  const [isCalculatingSolutions, setIsCalculatingSolutions] = useState(false);

  // Capture Mode State (Unified Object/Piece Capture)
  const [captureState, setCaptureState] = useState({
    pieceType: 'n', // Default Knight
    pieceColor: 'w',
    playerPieces: [], // [{ square: 'e4', type: 'n', color: 'w' }]
    targets: [], // { square: 'e5', item: 'pizza' or 'p' }
    targetType: 'pizza', // Current target type to place
    maximumNoOfMoves: 5 // Default maximum moves allowed
  });

  const [setupMode, setSetupMode] = useState('fen'); // 'fen' | 'manual'
  const [editorState, setEditorState] = useState({}); // { 'e4': { type: 'p', color: 'w' } }

  const [fenError, setFenError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [testStatus, setTestStatus] = useState('playing'); // 'playing', 'solved', 'failed'
  const [testBoardKey, setTestBoardKey] = useState(0);

  // First Move control: 'human' (default) or 'computer'
  const [firstMoveBy, setFirstMoveBy] = useState('human');

  // Illegal Move Mode State
  const [illegalPlayerSide, setIllegalPlayerSide] = useState('w'); // 'w' or 'b'
  const [illegalSubType, setIllegalSubType] = useState('normal'); // 'normal' | 'source_destination'
  const [sourceSquare, setSourceSquare] = useState('');
  const [destinationSquare, setDestinationSquare] = useState('');

  // Active Palette Item for Click-To-Place Editor
  const [activePaletteItem, setActivePaletteItem] = useState(null); // e.g. { type: 'piece', pieceType: 'r', pieceColor: 'w' } | { type: 'trash' }

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await categoryAPI.getAll(false);
      setCategories(data);

      if (data.length > 0) {
        setFormData(prev => ({ ...prev, category: data[0].name }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  // ── FEN validation ─────────────────────────────────────────────────────────────
  // Strict validation (requires kings) — used for normal puzzles
  const validateFEN = (fen) => {
    try {
      new Chess(fen);
      setFenError("");
      return true;
    } catch {
      setFenError("Invalid FEN notation");
      return false;
    }
  };

  // Lenient validation for illegal move puzzles (no kings required).
  // Just checks the FEN string has the right number of parts and the
  // piece placement part contains only valid characters.
  const validateIllegalFEN = (fen) => {
    if (!fen || !fen.trim()) {
      setFenError("FEN is required");
      return false;
    }
    const parts = fen.trim().split(' ');
    if (parts.length < 1) {
      setFenError("Invalid FEN notation");
      return false;
    }
    // Basic character check on piece placement
    const piecePart = parts[0];
    if (!/^[pnbrqkPNBRQK1-8/]+$/.test(piecePart)) {
      setFenError("Invalid FEN notation");
      return false;
    }
    setFenError("");
    return true;
  };

  // ── Helper: inject phantom kings at safe corner squares ──────────────────
  // chess.js needs kings for legal move generation during gameplay.
  // We place them in corners that aren't already occupied.
  const injectKingsForIllegal = (state, playerSide) => {
    const chess = new Chess();
    chess.clear();
    // Place all user-defined pieces first
    const usedSquares = [];
    let whiteKingExists = false;
    let blackKingExists = false;

    Object.entries(state).forEach(([sq, piece]) => {
      try { 
        chess.put({ type: piece.type, color: piece.color }, sq); 
        usedSquares.push(sq); 
        if (piece.type === 'k') {
          if (piece.color === 'w') whiteKingExists = true;
          else blackKingExists = true;
        }
      } catch (e) {}
    });

    // Add phantom kings to free corners ONLY if they don't exist
    const corners = ['a1', 'h1', 'a8', 'h8'];
    for (const corner of corners) {
      if (whiteKingExists && blackKingExists) break;
      if (!usedSquares.includes(corner)) {
        if (!whiteKingExists) {
          try { chess.put({ type: 'k', color: 'w' }, corner); usedSquares.push(corner); whiteKingExists = true; } catch(e){}
        } else if (!blackKingExists) {
          try { chess.put({ type: 'k', color: 'b' }, corner); usedSquares.push(corner); blackKingExists = true; } catch(e){}
        }
      }
    }
    // Set turn to player's side
    const fenParts = chess.fen().split(' ');
    fenParts[1] = playerSide || 'w';
    return fenParts.join(' ');
  };

  const handleFENChange = (value) => {
    setFormData((prev) => ({ ...prev, fen: value }));
    if (puzzleType === 'illegal' || puzzleType === 'capture') {
      validateIllegalFEN(value);
    } else {
      validateFEN(value);
    }
  };

  // Logic to determine Level and Difficulty from Rating
  const determineLevelAndDifficulty = (rating) => {
    const r = Number(rating);
    for (const [lvl, ranges] of Object.entries(LEVEL_RANGES)) {
      if (r >= ranges.easy[0] && r <= ranges.hard[1]) {
        if (r <= ranges.easy[1]) return { level: Number(lvl), difficulty: 'easy' };
        if (r <= ranges.medium[1]) return { level: Number(lvl), difficulty: 'medium' };
        return { level: Number(lvl), difficulty: 'hard' };
      }
    }
    // Fallback if out of bounds
    if (r < 300) return { level: 1, difficulty: 'easy' };
    if (r > 3500) return { level: 7, difficulty: 'hard' };
    return { level: 1, difficulty: 'medium' };
  };

  const handleRatingChange = (newRating) => {
    const { level, difficulty } = determineLevelAndDifficulty(newRating);
    setFormData(prev => ({
      ...prev,
      rating: newRating,
      level: level,
      difficulty: difficulty
    }));
  };

  // Generate FEN for Capture Mode
  useEffect(() => {
    if (puzzleType === 'capture') {
      const chess = new Chess();
      chess.clear();
      
      // Put player pieces
      captureState.playerPieces.forEach(p => {
        try {
          chess.put({ type: p.type, color: p.color }, p.square);
        } catch (e) {}
      });
      
      const enemyColor = captureState.pieceColor === 'w' ? 'b' : 'w';
      captureState.targets.forEach(t => {
        // If item is a chess piece type, use it; otherwise use pawn 'p' as placeholder for objects
        const pieceType = ['p', 'n', 'b', 'r', 'q', 'k'].includes(t.item) ? t.item : 'p';
        chess.put({ type: pieceType, color: enemyColor }, t.square);
      });

      // Add phantom kings to make chess.js happy (ensure they don't block moves)
      const usedSquares = [
        ...captureState.playerPieces.map(p => p.square),
        ...captureState.targets.map(t => t.square)
      ].filter(Boolean);
      
      const corners = ['a1', 'h1', 'a8', 'h8'];
      let wKPos = corners.find(c => !usedSquares.includes(c));
      if (wKPos) { chess.put({ type: 'k', color: 'w' }, wKPos); usedSquares.push(wKPos); }
      let bKPos = corners.find(c => !usedSquares.includes(c));
      if (bKPos) { chess.put({ type: 'k', color: 'b' }, bKPos); }

      const fenParts = chess.fen().split(' ');
      fenParts[1] = captureState.pieceColor;
      setFormData(prev => ({ ...prev, fen: fenParts.join(' ') }));
    }
  }, [captureState, puzzleType]);

  const parseSolutionMoves = (raw) =>
    raw
      .split(/[\n,]/)
      .map((m) => m.trim())
      .filter(Boolean);

  const handleAddAlternative = () => {
    setFormData(prev => ({
      ...prev,
      alternativeSolutions: [...prev.alternativeSolutions, ""]
    }));
  };

  const handleRemoveAlternative = (index) => {
    setFormData(prev => ({
      ...prev,
      alternativeSolutions: prev.alternativeSolutions.filter((_, i) => i !== index)
    }));
  };

  const handleAlternativeChange = (index, value) => {
    const newAlts = [...formData.alternativeSolutions];
    newAlts[index] = value;
    setFormData(prev => ({ ...prev, alternativeSolutions: newAlts }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdminAuthenticated) {
      setApiError("You are not authorized to create puzzles.");
      return;
    }

    setApiError("");

    // Common Valdiation
    if (!formData.category) {
      setApiError("Please select a category.");
      return;
    }

    if (puzzleType === 'normal') {
      if (!validateFEN(formData.fen)) {
        setApiError("Please enter a valid FEN notation.");
        return;
      }
      const solutionMoves = parseSolutionMoves(formData.correctMove);
      if (!solutionMoves.length) {
        setApiError("Add at least one solution move.");
        return;
      }

      const alternativeSolutions = formData.alternativeSolutions
        .map(sol => parseSolutionMoves(sol))
        .filter(sol => sol.length > 0);

      // Build Payload
      const payload = {
        title: formData.title.trim(),
        fen: formData.fen.trim(),
        difficulty: formData.difficulty.toLowerCase(),
        category: formData.category,
        solutionMoves,
        alternativeSolutions,
        description: [formData.description.trim(), formData.hints.trim()].filter(Boolean).join("\n\n"),
        type: puzzleType,
        level: Number(formData.level),
        initialMove: undefined,
        firstMoveBy
      };
      submitPayload(payload);

    } else if (puzzleType === 'capture') {
      if (captureState.playerPieces.length === 0 || captureState.targets.length === 0) {
        setApiError('Please configure the board properly.'); return;
      }
      if (!captureState.maximumNoOfMoves || captureState.maximumNoOfMoves < 1) {
        setApiError('Please specify the maximum number of moves (must be at least 1).'); return;
      }
      const payload = {
        title: formData.title.trim(),
        fen: formData.fen.trim(),
        difficulty: formData.difficulty.toLowerCase(),
        category: formData.category,
        description: [formData.description.trim(), formData.hints.trim()].filter(Boolean).join('\n\n'),
        type: 'capture',
        captureConfig: {
          mode: 'objects',
          piece: captureState.pieceType, // Maintain for compatibility if needed
          playerSide: captureState.pieceColor,
          startSquare: captureState.playerPieces[0]?.square || '', // Maintain for compatibility
          playerPieces: captureState.playerPieces,
          targets: captureState.targets,
          enemyPieces: [],
          maximumNoOfMoves: Number(captureState.maximumNoOfMoves)
        },
        level: Number(formData.level),
        rating: Number(formData.rating)
      };
      submitPayload(payload);

    } else if (puzzleType === 'illegal') {
      if (!formData.fen.trim()) {
        setApiError("Please set up a board position.");
        return;
      }

      let finalFen = formData.fen.trim();
      
      if (setupMode === 'manual') {
        finalFen = injectKingsForIllegal(editorState, formData.firstMoveBy);
      } else {
        // FEN mode: ensure turn matches firstMoveBy if possible
        const fenParts = finalFen.split(' ');
        if (fenParts.length < 2) finalFen += ` ${formData.firstMoveBy} - - 0 1`;
        else {
          fenParts[1] = formData.firstMoveBy;
          finalFen = fenParts.join(' ');
        }
      }

      const payload = {
        title: formData.title.trim(),
        fen: finalFen,
        difficulty: formData.difficulty.toLowerCase(),
        category: formData.category,
        description: [formData.description.trim(), formData.hints.trim()].filter(Boolean).join("\n\n"),
        type: 'illegal',
        level: Number(formData.level),
        rating: Number(formData.rating),
        firstMoveBy: formData.firstMoveBy,
        illegalConfig: {
          subType: illegalSubType,
          sourceSquare: illegalSubType === 'source_destination' ? sourceSquare : undefined,
          destinationSquare: illegalSubType === 'source_destination' ? destinationSquare : undefined,
          playerSide: formData.firstMoveBy
        }
      };
      submitPayload(payload);
    }
  };

  const calculatePossibleSolutions = () => {
    setIsCalculatingSolutions(true);
    setPossibleSolutions([]);

    try {
      let fenToVerify = formData.fen.trim();
      if (setupMode === 'manual') {
        fenToVerify = injectKingsForIllegal(editorState, formData.firstMoveBy);
      } else {
        const fenParts = fenToVerify.split(' ');
        if (fenParts.length < 2) fenToVerify += ` ${formData.firstMoveBy} - - 0 1`;
        else {
          fenParts[1] = formData.firstMoveBy;
          fenToVerify = fenParts.join(' ');
        }
      }

      const chess = new Chess(fenToVerify);
      if (chess.turn() !== formData.firstMoveBy) {
        // Force the turn to match firstMoveBy if it doesn't
        const parts = chess.fen().split(' ');
        parts[1] = formData.firstMoveBy;
        chess.load(parts.join(' '));
      }
      
      const moves = chess.moves({ verbose: true });
      const solutions = moves.map(m => m.san);
      setPossibleSolutions(solutions);
      
      if (solutions.length === 0) {
        toast.error("No legal moves found! Is the king in checkmate or stalemate?");
      }
    } catch (e) {
      console.error(e);
      toast.error("Invalid board position for calculating solutions.");
    } finally {
      setIsCalculatingSolutions(false);
    }
  };

  const submitPayload = async (payload) => {
    setIsSubmitting(true);
    try {
      await adminAPI.createPuzzle(payload);
      toast.success("Puzzle created successfully!");
      setTimeout(() => {
        navigate("/admin/puzzles");
      }, 1500);
    } catch (error) {
      console.error("Failed to create puzzle:", error);
      const msg = error?.response?.data?.message || "Failed to create puzzle.";
      toast.error(msg);
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSquareClick = (square) => {
    if (puzzleType === 'capture') {
      // Toggle logic for player pieces vs targets
      const existingPlayerIndex = captureState.playerPieces.findIndex(p => p.square === square);
      if (existingPlayerIndex !== -1) {
        setCaptureState(prev => ({
          ...prev,
          playerPieces: prev.playerPieces.filter((_, i) => i !== existingPlayerIndex)
        }));
        return;
      }

      const existingTargetIndex = captureState.targets.findIndex(t => t.square === square);
      if (existingTargetIndex !== -1) {
        setCaptureState(prev => ({
          ...prev,
          targets: prev.targets.filter((_, i) => i !== existingTargetIndex)
        }));
        return;
      }

      // Default behavior: toggle placement of currently active piece/target
      // If we clicked an empty square, we place either a player piece or a target
      // based on which tab was last interacted with or just toggle placement.
      // But for better UX, let's just allow placement.
      setCaptureState(prev => ({
        ...prev,
        playerPieces: [...prev.playerPieces, { square, type: prev.pieceType, color: prev.pieceColor }]
      }));
    } else if (setupMode === 'manual') {
      const newEditorState = { ...editorState };
      
      if (activePaletteItem) {
        if (activePaletteItem.type === 'trash') {
          // Delete piece
          if (newEditorState[square]) {
            delete newEditorState[square];
            setEditorState(newEditorState);
            updateFenFromEditor(newEditorState);
          }
        } else if (activePaletteItem.type === 'piece') {
          // Place piece
          newEditorState[square] = { type: activePaletteItem.pieceType, color: activePaletteItem.pieceColor };
          setEditorState(newEditorState);
          updateFenFromEditor(newEditorState);
        }
      } else {
        // Fallback: original toggle-delete behavior if nothing is actively selected in palette
        if (newEditorState[square]) {
          delete newEditorState[square];
          setEditorState(newEditorState);
          updateFenFromEditor(newEditorState);
        }
      }
    }
  };

  const updateFenFromEditor = (state) => {
    // For illegal puzzles: auto-inject kings so chess.js can compute moves during gameplay
    if (puzzleType === 'illegal') {
      const fen = injectKingsForIllegal(state, formData.firstMoveBy);
      setFormData(prev => ({ ...prev, fen }));
      return;
    }
    // Normal / other: build FEN directly (requires kings to be placed manually)
    const chess = new Chess();
    chess.clear();
    Object.entries(state).forEach(([sq, piece]) => {
      try {
        chess.put({ type: piece.type, color: piece.color }, sq);
      } catch (e) {
        // Ignore invalid placements
      }
    });
    setFormData(prev => ({ ...prev, fen: chess.fen() }));
  };

  const clearEditor = () => {
    setEditorState({});
    updateFenFromEditor({});
  };

  const getPieceImage = (type, color) => {
    const pieceMap = {
      p: { w: whitePawn, b: blackPawn },
      n: { w: whiteKnight, b: blackKnight },
      b: { w: whiteBishop, b: blackBishop },
      r: { w: whiteRook, b: blackRook },
      q: { w: whiteQueen, b: blackQueen },
      k: { w: whiteKing, b: blackKing },
    };
    return pieceMap[type]?.[color] || null;
  };

  // Drag and Drop Logic for Kids Mode & Manual Editor
  const handlePaletteDragStart = (e, type, value, color, sourceSquare = null) => {
    e.dataTransfer.setData('type', type);
    e.dataTransfer.setData('value', value);
    if (color) e.dataTransfer.setData('color', color);
    if (sourceSquare) e.dataTransfer.setData('sourceSquare', sourceSquare);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleBoardDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleBoardDrop = (e, square) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const value = e.dataTransfer.getData('value');
    const color = e.dataTransfer.getData('color');
    const sourceSquare = e.dataTransfer.getData('sourceSquare');

    if (!type || !value) return;

    if (puzzleType === 'capture') {
      if (type === 'piece') {
        const isPlayerPiece = color === captureState.pieceColor;
        if (isPlayerPiece) {
          setCaptureState(prev => {
            let playerPieces = [...prev.playerPieces];
            if (sourceSquare && sourceSquare !== square) playerPieces = playerPieces.filter(p => p.square !== sourceSquare);
            const existingIndex = playerPieces.findIndex(p => p.square === square);
            if (existingIndex === -1) {
              return { ...prev, playerPieces: [...playerPieces, { square, type: value, color }] };
            } else {
              const newPieces = [...playerPieces];
              newPieces[existingIndex] = { square, type: value, color };
              return { ...prev, playerPieces: newPieces };
            }
          });
        } else {
          // Treat enemy piece as a target object
          setCaptureState(prev => {
            let targets = prev.targets;
            if (sourceSquare && sourceSquare !== square) targets = targets.filter(t => t.square !== sourceSquare);
            const existingIndex = targets.findIndex(t => t.square === square);
            if (existingIndex === -1) {
              return { ...prev, targets: [...targets, { square, item: value }] };
            } else {
              const newTargets = [...targets];
              newTargets[existingIndex].item = value;
              return { ...prev, targets: newTargets };
            }
          });
        }
      } else if (type === 'target') {
        setCaptureState(prev => {
          let targets = prev.targets;
          if (sourceSquare && sourceSquare !== square) targets = targets.filter(t => t.square !== sourceSquare);
          const existingIndex = targets.findIndex(t => t.square === square);
          if (existingIndex === -1) {
            return { ...prev, targets: [...targets, { square, item: value }] };
          } else {
            const newTargets = [...targets];
            newTargets[existingIndex].item = value;
            return { ...prev, targets: newTargets };
          }
        });
      } else if (type === 'trash') {
        setCaptureState(prev => ({
          ...prev,
          targets: prev.targets.filter(t => t.square !== square),
          playerPieces: prev.playerPieces.filter(p => p.square !== square)
        }));
      }
    } else if (setupMode === 'manual') {
      // Normal Mode Manual Setup
      if (type === 'piece') {
        const newEditorState = { ...editorState };
        if (sourceSquare && sourceSquare !== square) {
          delete newEditorState[sourceSquare];
        }
        newEditorState[square] = { type: value, color };
        setEditorState(newEditorState);
        updateFenFromEditor(newEditorState);
      } else if (type === 'trash') {
        const newEditorState = { ...editorState };
        delete newEditorState[square];
        setEditorState(newEditorState);
        updateFenFromEditor(newEditorState);
      }
    }
  };

  // Render board preview
  const renderChessBoard = () => {
    let board = [];
    if (setupMode === 'manual' && (puzzleType === 'normal' || puzzleType === 'illegal')) {
      board = Array(8).fill(null).map(() => Array(8).fill(null));
    } else {
      try {
        const chess = new Chess(formData.fen);
        board = chess.board();
      } catch (e) {
        if (puzzleType === 'capture' || ((puzzleType === 'normal' || puzzleType === 'illegal') && setupMode === 'manual')) {
          board = Array(8).fill(null).map(() => Array(8).fill(null));
        } else {
          return (
            <div className={styles.boardError}>
              <FaChess />
              <p>Invalid FEN - Board cannot be displayed</p>
            </div>
          );
        }
      }
    }

    const previewUserColor = (() => {
      if (puzzleType === 'illegal') return formData.firstMoveBy;
      if (puzzleType === 'capture') return captureState.pieceColor;
      
      try {
        const chess = new Chess(formData.fen);
        const turn = chess.turn();
        // Computer always plays first - user plays the OPPOSITE side
        return turn === 'w' ? 'b' : 'w';
      } catch (e) { return 'w'; }
    })();

    const ranks = previewUserColor === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
    const files = previewUserColor === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

    return (
      <div className={`${styles.chessboard} ${puzzleType === 'capture' || (setupMode === 'manual' && (puzzleType === 'normal' || puzzleType === 'illegal')) ? styles.interactiveBoard : ''}`}>
        {ranks.map((rank, rankIndex) => (
          <div key={rank} className={styles.row}>
            {files.map((file, fileIndex) => {
              const squareName = `${file}${rank}`;
              const r = 8 - parseInt(rank);
              const c = file.charCodeAt(0) - 97;

              const sq = board[r] ? board[r][c] : null;
              const isLight = (r + c) % 2 === 0;

              let content = null;
              if (puzzleType === 'capture') {
                  const playerPiece = captureState.playerPieces.find(p => p.square === squareName);
                  if (playerPiece) {
                    content = <img src={getPieceImage(playerPiece.type, playerPiece.color)} className={styles.piece} alt="piece" draggable onDragStart={(e) => handlePaletteDragStart(e, 'piece', playerPiece.type, playerPiece.color, squareName)} style={{ cursor: 'grab' }} />;
                  } else {
                    const target = captureState.targets.find(t => t.square === squareName);
                    if (target) {
                      const icons = { pizza: '🍕', chocolate: '🍫', star: '⭐', burger: '🍔' };
                      const icon = icons[target.item];
                      if (icon) {
                        content = <span style={{ fontSize: '32px', cursor: 'grab' }} draggable onDragStart={(e) => handlePaletteDragStart(e, 'target', target.item, null, squareName)}>{icon}</span>;
                      } else {
                        // Piece target
                        const enemyColor = captureState.pieceColor === 'w' ? 'b' : 'w';
                        content = <img src={getPieceImage(target.item, enemyColor)} className={styles.piece} alt="target" draggable onDragStart={(e) => handlePaletteDragStart(e, 'piece', target.item, enemyColor, squareName)} style={{ cursor: 'grab' }} />;
                      }
                    }
                  }
              } else if (setupMode === 'manual') {
                // Check editor state
                const piece = editorState[squareName];
                if (piece) {
                  content = <img src={getPieceImage(piece.type, piece.color)} className={styles.piece} alt={`${piece.color}${piece.type}`} draggable onDragStart={(e) => handlePaletteDragStart(e, 'piece', piece.type, piece.color, squareName)} style={{ cursor: 'grab' }} />;
                } else if (sq) {
                  // Fallback to FEN-derived sq if editorState not populated (e.g. init from FEN)
                }
              } else if (sq) {
                content = <img src={getPieceImage(sq.type, sq.color)} className={styles.piece} alt={`${sq.color}${sq.type}`} draggable onDragStart={(e) => handlePaletteDragStart(e, 'piece', sq.type, sq.color, squareName)} style={{ cursor: 'grab' }} />;
              }

              return (
                <div
                  key={c}
                  className={`${styles.square} ${isLight ? styles.light : styles.dark}`}
                  onClick={() => {
                    if (setupMode === 'manual' || puzzleType === 'capture') {
                      handleSquareClick(squareName);
                    }
                  }}
                  onDragOver={handleBoardDragOver}
                  onDrop={(e) => handleBoardDrop(e, squareName)}
                >
                  {content}

                  {/* Rank Label (Left side) */}
                  {fileIndex === 0 && (
                    <div
                      className={styles.rankLabel}
                      style={{ color: isLight ? '#b58863' : '#f0d9b5' }}
                    >
                      {rank}
                    </div>
                  )}

                  {/* File Label (Bottom side) */}
                  {rankIndex === 7 && (
                    <div
                      className={styles.fileLabel}
                      style={{ color: isLight ? '#b58863' : '#f0d9b5' }}
                    >
                      {file}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.createPuzzle}>
      <Toaster position="top-center" />

      <PageHeader
        icon={FaChess}
        title="Create New Puzzle"
        subtitle="Design a new chess puzzle"
      />

      <div className={styles.content}>
        {/* LEFT: FORM */}
        <div className={styles.formSection}>
          <div className={styles.modeSelector}>
            <button
              type="button"
              className={`${styles.modeBtn} ${puzzleType === 'normal' ? styles.active : ''}`}
              onClick={() => setPuzzleType('normal')}
            >
              Normal Puzzle
            </button>
            <button
              type="button"
              className={`${styles.modeBtn} ${puzzleType === 'capture' ? styles.active : ''}`}
              onClick={() => setPuzzleType('capture')}
            >
              Capture Puzzle 🎯
            </button>
            <button
              type="button"
              className={`${styles.modeBtn} ${puzzleType === 'illegal' ? styles.active : ''}`}
              onClick={() => setPuzzleType('illegal')}
            >
              Illegal Move
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Puzzle Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Mate in 2"
              />
            </div>

            {/* CONTROLS */}
            {puzzleType === 'capture' ? (
              <div className={styles.captureControls}>
                <div className={styles.horizontalGroup}>
                  {/* STEP 1: PLAYER PIECE */}
                  <div className={styles.selectionStep}>
                    <h4 className={styles.stepTitle}><span>1</span> Select Player Piece</h4>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Choose Color:</span>
                      <div className={styles.colorToggle}>
                        <div className={`${styles.colorBtn} ${styles.white} ${captureState.pieceColor === 'w' ? styles.selected : ''}`} 
                          onClick={() => setCaptureState({ ...captureState, pieceColor: 'w' })} title="White Piece" />
                        <div className={`${styles.colorBtn} ${styles.black} ${captureState.pieceColor === 'b' ? styles.selected : ''}`} 
                          onClick={() => setCaptureState({ ...captureState, pieceColor: 'b' })} title="Black Piece" />
                      </div>
                    </div>

                    <div className={styles.pieceGrid}>
                      {['n', 'b', 'r', 'q', 'k', 'p'].map(p => (
                        <div key={p} draggable onDragStart={(e) => handlePaletteDragStart(e, 'piece', p, captureState.pieceColor)}
                          className={`${styles.pieceOption} ${captureState.pieceType === p ? styles.selected : ''}`}
                          onClick={() => setCaptureState(prev => ({ ...prev, pieceType: p }))}>
                          <img src={getPieceImage(p, captureState.pieceColor)} alt={p} />
                        </div>
                      ))}
                    </div>
                    <p className={styles.instruction} style={{ marginTop: '12px' }}><small>Drag player piece to board or click board to place/move.</small></p>
                  </div>

                  {/* STEP 2: TARGETS */}
                  <div className={styles.selectionStep}>
                    <h4 className={styles.stepTitle}><span>2</span> Select Targets (Objects or Pieces)</h4>
                    
                    <div className={styles.targetGrid}>
                      {[
                        { id: 'pizza', icon: '🍕' },
                        { id: 'chocolate', icon: '🍫' },
                        { id: 'star', icon: '⭐' },
                        { id: 'burger', icon: '🍔' }
                      ].map(item => (
                        <div key={item.id} draggable onDragStart={(e) => handlePaletteDragStart(e, 'target', item.id)}
                          className={`${styles.targetOption} ${captureState.targetType === item.id ? styles.selected : ''}`}
                          onClick={() => setCaptureState(prev => ({ ...prev, targetType: item.id }))}>{item.icon}</div>
                      ))}
                    </div>

                    <div className={styles.pieceGrid} style={{ marginTop: '10px' }}>
                      {['p', 'n', 'b', 'r', 'q'].map(p => {
                        const enemyColor = captureState.pieceColor === 'w' ? 'b' : 'w';
                        return (
                          <div key={`enemy${p}`} className={styles.pieceOption} draggable 
                            onDragStart={(e) => handlePaletteDragStart(e, 'piece', p, enemyColor)}>
                            <img src={getPieceImage(p, enemyColor)} alt="" />
                          </div>
                        );
                      })}
                      <div className={styles.trashOption} draggable onDragStart={(e) => handlePaletteDragStart(e, 'trash', 'trash', null)}><FaTrash /></div>
                    </div>
                    <p className={styles.instruction} style={{ marginTop: '12px' }}><small>Drag objects or enemy pieces to board.</small></p>
                  </div>
                </div>

                {/* STEP 3: MAXIMUM MOVES */}
                <div className={styles.formGroup} style={{ 
                  marginTop: '20px',
                  backgroundColor: '#fff3cd', 
                  padding: '20px', 
                  borderRadius: '12px',
                  border: '2px solid #ffc107'
                }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: 'bold', 
                    fontSize: '16px',
                    color: '#333'
                  }}>
                    Maximum Number of Moves * 🎯
                  </label>
                  
                  <p style={{ 
                    margin: '0 0 15px', 
                    fontSize: '14px', 
                    color: '#666',
                    lineHeight: '1.5'
                  }}>
                    Specify how many moves the player has to reach the destination and capture all targets.
                    This creates a move constraint challenge for the puzzle.
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <input
                      type="text"
                      
                      value={captureState.maximumNoOfMoves}
                      onChange={(e) => setCaptureState(prev => ({ 
                        ...prev, 
                        maximumNoOfMoves: e.target.value
                      }))}
                      placeholder="Enter number of moves"
                      style={{ 
                        width: '150px', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        border: '2px solid #ffc107',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                      required
                    />
                    <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                      moves
                    </span>
                    
                    {/* Visual indicator */}
                    <div style={{ 
                      marginLeft: 'auto',
                      padding: '10px 16px',
                      backgroundColor: captureState.maximumNoOfMoves ? '#4CAF50' : '#ccc',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'background-color 0.3s'
                    }}>
                      {captureState.maximumNoOfMoves ? `${captureState.maximumNoOfMoves} Move${captureState.maximumNoOfMoves !== 1 ? 's' : ''}` : 'Not Set'}
                    </div>
                  </div>
                  
                  {/* Helper text */}
                 { /*<div style={{ 
                    marginTop: '12px', 
                    padding: '10px', 
                    backgroundColor: '#e3f2fd', 
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1976d2'
                  }}>
                    💡 <strong>Tip:</strong> Lower values create harder puzzles. Consider the distance and obstacles when setting this value.
                  </div> */ }
                </div>
              </div>
            ) : puzzleType === 'illegal' ? (
              <div className={styles.illegalControls}>
                 <div className={styles.setupToggle} style={{ marginBottom: '15px' }}>
                  <label>Puzzle Sub-Type:</label>
                  <div className={styles.toggleBtns}>
                    <button type="button" className={illegalSubType === 'normal' ? styles.active : ''} onClick={() => setIllegalSubType('normal')}>Normal Illegal</button>
                    <button type="button" className={illegalSubType === 'source_destination' ? styles.active : ''} onClick={() => setIllegalSubType('source_destination')}>Source & Destination</button>
                  </div>
                </div>

                {illegalSubType === 'source_destination' && (
                  <div className={styles.formGrid} style={{ marginBottom: '15px' }}>
                    <div className={styles.formGroup}>
                      <label>Source Square *</label>
                      <input type="text" value={sourceSquare} onChange={e => setSourceSquare(e.target.value)} placeholder="e.g. a5" required={illegalSubType === 'source_destination'} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Destination Square *</label>
                      <input type="text" value={destinationSquare} onChange={e => setDestinationSquare(e.target.value)} placeholder="e.g. e6" required={illegalSubType === 'source_destination'} />
                    </div>
                  </div>
                )}

                 <div className={styles.setupToggle}>
                  <label>Setup Method:</label>
                  <div className={styles.toggleBtns}>
                    <button type="button" className={setupMode === 'fen' ? styles.active : ''} onClick={() => setSetupMode('fen')}>FEN String</button>
                    <button type="button" className={setupMode === 'manual' ? styles.active : ''} onClick={() => { setSetupMode('manual'); setEditorState({}); setFormData(p => ({ ...p, fen: '' })); }}>Board Editor</button>
                    <button type="button" onClick={() => window.open('https://lichess.org/editor', '_blank')} className={styles.lichessBtn}>
                      <img src="https://lichess1.org/assets/_H8963X/logo/lichess-favicon-32.png" alt="" style={{ width: '16px', marginRight: '6px' }} />
                      Lichess Editor
                    </button>
                  </div>
                </div>

                {setupMode === 'fen' && (
                  <div className={styles.formGroup}>
                    <label>FEN Position (e.g., King in Check) *</label>
                    <textarea
                      disabled={isTestMode}
                      rows="2"
                      value={formData.fen}
                      onChange={(e) => handleFENChange(e.target.value)}
                      className={fenError ? styles.error : ""}
                      required={setupMode === 'fen'}
                      placeholder="Paste FEN here..."
                    />
                    {fenError && <span className={styles.errorText}>{fenError}</span>}
                  </div>
                )}

                  {/* Palette moved to right preview section */}

                <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: '20px' }}>
                  <button 
                    type="button" 
                    onClick={calculatePossibleSolutions}
                    className={styles.viewSolutionsBtn}
                    disabled={isCalculatingSolutions}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      background: '#4a5568', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '10px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(74, 85, 104, 0.2)'
                    }}
                  >
                    <FaLightbulb /> {isCalculatingSolutions ? 'Calculating...' : 'View Possible Solutions (Legal Moves)'}
                  </button>
                  
                  {possibleSolutions.length > 0 && (
                    <div className={styles.solutionsList} style={{ 
                      marginTop: '15px', 
                      padding: '16px', 
                      background: '#f8f9fa', 
                      borderRadius: '10px', 
                      border: '1px solid #eaeaea' 
                    }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#4a5568', display: 'block', marginBottom: '10px' }}>
                        Legal Moves ({possibleSolutions.length}):
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {possibleSolutions.map((sol, idx) => (
                          <span key={idx} style={{ 
                            padding: '4px 10px', 
                            background: '#f0f4f8', 
                            color: '#2b6cb0', 
                            borderRadius: '6px', 
                            fontSize: '0.9rem',
                            border: '1px solid #bee3f8'
                          }}>{sol}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // NORMAL MODE CONTROLS (FEN or Manual)
              <>
                {/* Board Setup Toggle */}
                <div className={styles.setupToggle}>
                  <label>Setup Method:</label>
                  <div className={styles.toggleBtns}>
                    <button type="button" className={setupMode === 'fen' ? styles.active : ''} onClick={() => setSetupMode('fen')}>FEN String</button>
                    <button type="button" className={setupMode === 'manual' ? styles.active : ''} onClick={() => { setSetupMode('manual'); setEditorState({}); setFormData(p => ({ ...p, fen: '' })); }}>Board Editor</button>
                    <button type="button" onClick={() => window.open('https://lichess.org/editor', '_blank')} className={styles.lichessBtn}>
                      <img src="https://lichess1.org/assets/_H8963X/logo/lichess-favicon-32.png" alt="" style={{ width: '16px', marginRight: '6px' }} />
                      Lichess Editor
                    </button>
                  </div>
                </div>

                {setupMode === 'fen' && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>FEN Position *</label>
                    <textarea
                      disabled={isTestMode}
                      rows="2"
                      value={formData.fen}
                      onChange={(e) => handleFENChange(e.target.value)}
                      className={fenError ? styles.error : ""}
                      required={setupMode === 'fen'}
                    />
                    {fenError && <span className={styles.errorText}>{fenError}</span>}
                  </div>
                )}

                  {/* Palette moved to right preview section */}

                {/* SOLUTION MOVES — only for Normal puzzles */}
                {puzzleType === 'normal' && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Correct Move(s) *</label>
                    <input
                      type="text"
                      required
                      value={formData.correctMove}
                      onChange={(e) => setFormData((prev) => ({ ...prev, correctMove: e.target.value }))}
                      placeholder="e.g., Qh5, e2e4"
                    />
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.9em', color: '#666', fontWeight: '600' }}>Alternative Solutions (Optional)</label>
                        <button
                          type="button"
                          onClick={handleAddAlternative}
                          style={{ fontSize: '0.85em', background: '#f0f4f8', border: '1px solid #bee3f8', color: '#2b6cb0', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', fontWeight: '600' }}
                        >
                          + Add Alternative
                        </button>
                      </div>
                      {formData.alternativeSolutions.map((sol, index) => (
                        <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                          <input
                            type="text"
                            value={sol}
                            onChange={(e) => handleAlternativeChange(index, e.target.value)}
                            placeholder="e.g., Qf7#"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveAlternative(index)}
                            style={{ background: '#fff0f0', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: '8px', padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* COMMON FORM FIELDS WRAPPED IN RESPONSIVE GRID */}
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Category *</label>
                {loadingCategories ? (
                  <p>Loading categories...</p>
                ) : (
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>{cat.title}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Who should play to solve? (Only for Illegal Move) */}
              {puzzleType === 'illegal' && (
                <div className={styles.formGroup}>
                  <label>Who should play to solve? *</label>
                  <div className={styles.toggleBtns}>
                    <button type="button" className={formData.firstMoveBy === 'w' ? styles.active : ''} onClick={() => setFormData(p => ({ ...p, firstMoveBy: 'w' }))}>White</button>
                    <button type="button" className={formData.firstMoveBy === 'b' ? styles.active : ''} onClick={() => setFormData(p => ({ ...p, firstMoveBy: 'b' }))}>Black</button>
                  </div>
                  <p className={styles.instruction}><small>In 'Avoid Illegal Move' puzzles, the side to move (White or Black) must make any legal move to solve.</small></p>
                </div>
              )}

              {/* Difficulty selector — manual for Illegal Move puzzles */}
              {puzzleType === 'illegal' && (
                <div className={styles.formGroup}>
                  <label>Difficulty *</label>
                  <div className={styles.toggleBtns}>
                    {['easy', 'medium', 'hard'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={formData.difficulty === d ? styles.active : ''}
                        onClick={() => setFormData(p => ({ ...p, difficulty: d }))}
                        style={{
                          textTransform: 'capitalize',
                          ...(formData.difficulty === d && d === 'easy'   ? { background: '#d1fae5', color: '#065f46', borderColor: '#6ee7b7' } : {}),
                          ...(formData.difficulty === d && d === 'medium' ? { background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' } : {}),
                          ...(formData.difficulty === d && d === 'hard'   ? { background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' } : {}),
                        }}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating (Hidden for Illegal Move) */}
              {puzzleType !== 'illegal' && (
                <div className={styles.formGroup}>
                  <label>Rating (300 - 3500) *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input
                      type="number"
                      min="300"
                      max="3500"
                      required
                      value={formData.rating}
                      onChange={(e) => handleRatingChange(e.target.value)}
                    />
                    <small className={styles.instruction}>
                      Entering rating automatically selects the appropriate Level and Difficulty.
                    </small>
                  </div>
                </div>
              )}
            </div>

            {/* Level and Difficulty side-by-side (Hidden for Illegal Move) */}
            {puzzleType !== 'illegal' && (
              <div className={styles.formGrid} style={{ background: '#f8f9fa', padding: '15px 20px', borderRadius: '10px', border: '1px solid #eaeaea', marginBottom: '25px' }}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem' }}>Level (Auto)</label>
                  <select
                    required
                    value={formData.level}
                    disabled // Auto-selected
                    style={{ background: '#edf2f7', cursor: 'not-allowed', color: '#718096' }}
                  >
                    {[
                      { value: 1, label: "Level 1 (Beginner)" },
                      { value: 2, label: "Level 2 (Beginner +)" },
                      { value: 3, label: "Level 3 (Intermediate)" },
                      { value: 4, label: "Level 4 (Advanced)" },
                      { value: 5, label: "Level 5 (Expert)" },
                      { value: 6, label: "Level 6 (Master)" },
                      { value: 7, label: "Level 7 (Elite)" }
                    ].map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem' }}>Difficulty (Auto)</label>
                  <select
                    required
                    value={formData.difficulty}
                    disabled // Auto-selected
                    style={{ background: '#edf2f7', cursor: 'not-allowed', color: '#718096' }}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className={styles.fullWidth} style={{ marginTop: '5px', fontSize: '0.85em', color: '#718096', fontStyle: 'italic' }}>
                  Current Range: {LEVEL_RANGES[formData.level]?.[formData.difficulty]
                    ? `${LEVEL_RANGES[formData.level][formData.difficulty][0]} - ${LEVEL_RANGES[formData.level][formData.difficulty][1]}`
                    : 'N/A'}
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className={styles.actions}>
              <Button
                type="button"
                variant="secondary"
                icon={FaTimes}
                onClick={() => navigate("/admin/puzzles")}
              >
                Cancel
              </Button>

              <Button type="submit" icon={FaSave} disabled={isSubmitting || isTestMode}>
                {isSubmitting ? "Creating..." : "Create Puzzle"}
              </Button>
            </div>

            {apiError && <p className={styles.apiError}>{apiError}</p>}
          </form>
        </div>

        {/* RIGHT: LIVE PREVIEW */}
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h3>Live Preview {isTestMode && <span style={{ color: '#e53e3e', fontSize: '0.9em', marginLeft: '10px' }}>[TEST MODE]</span>}</h3>
            <span className={styles.previewBadge}>
              {formData.difficulty.charAt(0).toUpperCase() + formData.difficulty.slice(1)} | Lvl {formData.level} ({formData.rating})
            </span>
          </div>

          {!isTestMode && setupMode === 'manual' && (
            <div className={`${styles.editorPalette} ${styles.fullWidth}`} style={{ marginBottom: '15px' }}>
              <p className={styles.instruction} style={{ marginBottom: '10px' }}>
                <strong>Click</strong> a piece below to select it, then <strong>click</strong> squares on the board to place it. <br/>
                Or freely drag and drop items.
              </p>
              <div className={styles.paletteRow} style={{ justifyContent: 'center' }}>
                {['k', 'q', 'r', 'b', 'n', 'p'].map(p => {
                  const isActive = activePaletteItem?.pieceType === p && activePaletteItem?.pieceColor === 'w';
                  return (
                    <div 
                      key={`w${p}`} 
                      className={styles.pieceOption} 
                      style={{ 
                        border: isActive ? '2px solid #3182ce' : '2px solid transparent', 
                        background: isActive ? '#ebf8ff' : 'transparent',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      draggable 
                      onDragStart={(e) => handlePaletteDragStart(e, 'piece', p, 'w')}
                      onClick={() => setActivePaletteItem({ type: 'piece', pieceType: p, pieceColor: 'w' })}
                    >
                      <img src={getPieceImage(p, 'w')} alt="" />
                    </div>
                  )
                })}
              </div>
              <div className={styles.paletteRow} style={{ justifyContent: 'center' }}>
                {['k', 'q', 'r', 'b', 'n', 'p'].map(p => {
                  const isActive = activePaletteItem?.pieceType === p && activePaletteItem?.pieceColor === 'b';
                  return (
                    <div 
                      key={`b${p}`} 
                      className={styles.pieceOption} 
                      style={{ 
                        border: isActive ? '2px solid #3182ce' : '2px solid transparent', 
                        background: isActive ? '#ebf8ff' : 'transparent',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      draggable 
                      onDragStart={(e) => handlePaletteDragStart(e, 'piece', p, 'b')}
                      onClick={() => setActivePaletteItem({ type: 'piece', pieceType: p, pieceColor: 'b' })}
                    >
                      <img src={getPieceImage(p, 'b')} alt="" />
                    </div>
                  )
                })}
                <div 
                  className={styles.trashOption} 
                  style={{
                    border: activePaletteItem?.type === 'trash' ? '2px solid #e53e3e' : '2px solid transparent',
                    background: activePaletteItem?.type === 'trash' ? '#fff5f5' : 'transparent',
                    cursor: 'pointer'
                  }}
                  draggable 
                  onDragStart={(e) => handlePaletteDragStart(e, 'trash', 'trash', null)}
                  onClick={() => setActivePaletteItem({ type: 'trash' })}
                >
                  <FaTrash />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px', justifyContent: 'center' }}>
                <button type="button" onClick={clearEditor} className={styles.clearBtn} style={{ borderRadius: '8px' }}>Clear Board</button>
              </div>
              <div className={styles.generatedFen} style={{ textAlign: 'center', marginTop: '8px' }}>
                <small>Generated FEN: {formData.fen || 'Empty'}</small>
              </div>
            </div>
          )}

          <div className={styles.boardContainer}>
             {isTestMode ? (
               <ChessBoard
                 key={`test-board-${testBoardKey}`}
                 fen={formData.fen}
                 solution={formData.correctMove ? formData.correctMove.split(',').map(m => m.trim()).filter(Boolean) : []}
                 alternativeSolutions={[]}
                 isSolved={testStatus === 'solved'}
                 isFailed={testStatus === 'failed'}
                 onPuzzleSolved={() => setTestStatus('solved')}
                 onWrongMove={() => setTestStatus('failed')}
                 onMoveMade={() => {}}
                 type={puzzleType}
                 puzzleType={puzzleType}
                 captureConfig={puzzleType === 'capture' ? {
                   mode: 'objects',
                   piece: captureState.pieceType,
                   playerSide: captureState.pieceColor,
                   startSquare: captureState.startSquare,
                   targets: captureState.targets,
                   enemyPieces: []
                 } : null}
                 illegalConfig={puzzleType === 'illegal' ? {
                    subType: illegalSubType,
                    sourceSquare: sourceSquare,
                    destinationSquare: destinationSquare
                 } : {}}
                 firstMoveBy={formData.firstMoveBy}
                 interactive={true}
                 reviewMode={false}
                 testSolveMode={true}
               />
             ) : (
               renderChessBoard()
             )}
          </div>
          
          {isTestMode && (
             <div style={{ marginTop: '15px', padding: '12px', borderRadius: '8px', textAlign: 'center', transition: 'all 0.3s', backgroundColor: testStatus === 'playing' ? '#f0f4f8' : testStatus === 'solved' ? '#c6f6d5' : '#fed7d7', color: testStatus === 'playing' ? '#2b6cb0' : testStatus === 'solved' ? '#276749' : '#c53030' }}>
               <div style={{ fontWeight: '600', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                 {testStatus === 'playing' && "Play any legal move to test..."}
                 {testStatus === 'solved' && "✔️ Valid Move!"}
                 {testStatus === 'failed' && "❌ Illegal Move!"}
               </div>

               {/* Exit / Reset Buttons */}
               <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                 <button type="button" title="Reset Test" onClick={() => { setTestBoardKey(k => k + 1); setTestStatus('playing'); }} style={{ padding: '6px 12px', background: '#fff', color: '#4a5568', border: '1px solid #cbd5e0', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' }}><FaUndo style={{ marginRight: '6px', fontSize: '0.85em' }}/> Reset Test</button>
                 <button type="button" title="Exit Test" onClick={() => { setIsTestMode(false); setTestStatus('playing'); }} style={{ padding: '6px 12px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' }}><FaTimes style={{ marginRight: '6px', fontSize: '0.85em' }}/> Exit Test</button>
               </div>
             </div>
          )}

          {!isTestMode && (
             <div style={{ marginTop: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
               <Button
                 type="button"
                 variant="secondary"
                 icon={FaLightbulb}
                 onClick={() => {
                     const fenToTest = formData.fen.trim();
                     if (!fenToTest) return toast.error("Please enter a FEN position first.");
                     if (puzzleType !== 'illegal' && !validateFEN(fenToTest)) return toast.error("Invalid FEN position.");
                     setIsTestMode(true); 
                     setTestStatus('playing'); 
                     setTestBoardKey(k => k + 1); 
                 }}
               >
                 Test Solve
               </Button>
             </div>
          )}

          <div className={styles.previewInfo}>
            <div><strong>Title:</strong> {formData.title || "Untitled"}</div>
            <div><strong>Type:</strong> {puzzleType === 'capture' ? 'Capture' : puzzleType === 'illegal' ? 'Illegal Move' : 'Normal'}</div>
            {puzzleType === 'normal' && formData.correctMove && (
              <div><strong>Solution:</strong> {formData.correctMove}</div>
            )}
            {puzzleType === 'capture' && (
              <div>
                <strong>Setup:</strong> {captureState.startSquare ? 'Piece Placed' : 'No Piece'}, {captureState.targets.length} Targets
              </div>
            )}
            {puzzleType === 'illegal' && illegalSubType === 'source_destination' && (
              <div>
                <strong>Source:</strong> {sourceSquare || 'None'} <strong>Dest:</strong> {destinationSquare || 'None'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePuzzle;
