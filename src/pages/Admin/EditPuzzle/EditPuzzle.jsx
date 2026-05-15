import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Chess } from 'chess.js';
import toast, { Toaster } from 'react-hot-toast';
import { FaChess, FaSave, FaTimes, FaLightbulb, FaTrash, FaUndo } from 'react-icons/fa';
import { PageHeader, Button } from '../../../components/Admin';
import { adminAPI, categoryAPI } from '../../../services/api';
import styles from '../CreatePuzzle/CreatePuzzle.module.css';
import ChessBoard from '../../../components/ChessBoard/ChessBoard';

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

function EditPuzzle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // 'normal', 'kids', or 'illegal'
  const [puzzleType, setPuzzleType] = useState('normal');

  const [formData, setFormData] = useState({
    title: '',
    fen: '',
    correctMove: '',
    alternativeSolutions: [],
    difficulty: 'Medium',
    category: 'Tactics',
    description: '',
    hints: '',
    level: 1,
    rating: 400
  });

  // Capture Mode State (Unified)
  const [captureState, setCaptureState] = useState({
    pieceType: 'n', // Default Knight
    pieceColor: 'w',
    playerPieces: [], // [{ square: 'e4', type: 'n', color: 'w' }]
    targets: [], // { square: 'e5', item: 'pizza' or 'p' }
    targetType: 'pizza', // Current target item to place
    maximumNoOfMoves: 5 // Default maximum moves allowed
  });

  // Manual Board Editor State (Normal Mode)
  const [setupMode, setSetupMode] = useState('fen'); // 'fen' | 'manual'
  const [editorState, setEditorState] = useState({}); // { 'e4': { type: 'p', color: 'w' } }

  const [fenError, setFenError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // Inline test solve state (mirrors CreatePuzzle exactly)
  const [isTestMode, setIsTestMode] = useState(false);
  const [testStatus, setTestStatus] = useState('playing'); // 'playing' | 'solved' | 'failed'
  const [testBoardKey, setTestBoardKey] = useState(0);

  // First Move control: 'w' (default) or 'b'
  const [firstMoveBy, setFirstMoveBy] = useState('w');

  const [possibleSolutions, setPossibleSolutions] = useState([]);
  const [isCalculatingSolutions, setIsCalculatingSolutions] = useState(false);

  // Illegal Move Mode State
  const [illegalSubType, setIllegalSubType] = useState('normal'); // 'normal' | 'source_destination'
  const [sourceSquare, setSourceSquare] = useState('');
  const [destinationSquare, setDestinationSquare] = useState('');

  // Convert description/hints from backend into our form shape
  const hydrateFormFromPuzzle = (puzzle) => {
    const description = puzzle.description || '';
    let mainDesc = description;
    let hints = '';

    // Simple split: if description contains double newline, treat last part as hints
    const parts = description.split('\n\n');
    if (parts.length > 1) {
      mainDesc = parts.slice(0, -1).join('\n\n');
      hints = parts[parts.length - 1];
    }

    const difficultyNormalized = (puzzle.difficulty || 'medium').toLowerCase();
    const difficultyLabelMap = {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
    };

    setPuzzleType(puzzle.type === 'kids' ? 'capture' : (puzzle.type || 'normal'));
    if (puzzle.type === 'kids' || puzzle.type === 'capture') {
      const config = puzzle.captureConfig || puzzle.kidsConfig || {};
      const allTargets = config.targets || [];
      // If legacy puzzle has enemyPieces, migrate them to targets
      if (config.enemyPieces && config.enemyPieces.length > 0) {
        config.enemyPieces.forEach(p => {
          if (!allTargets.find(t => t.square === p.square)) {
            allTargets.push({ square: p.square, item: p.type });
          }
        });
      }

      setCaptureState({
        pieceType: config.piece || 'n',
        pieceColor: config.playerSide || puzzle.fen.split(' ')[1] || 'w',
        playerPieces: config.playerPieces && config.playerPieces.length > 0 
          ? config.playerPieces 
          : (config.startSquare ? [{ square: config.startSquare, type: config.piece || 'n', color: config.playerSide || 'w' }] : []),
        targets: allTargets,
        targetType: 'pizza',
        maximumNoOfMoves: config.maximumNoOfMoves || 5
      });
    }
    
    if (puzzle.type === 'illegal') {
      const conf = puzzle.illegalConfig || {};
      const side = conf.playerSide || puzzle.firstMoveBy || (puzzle.fen.split(' ')[1]) || 'w';
      setFirstMoveBy(side);
      setIllegalSubType(conf.subType || 'normal');
      setSourceSquare(conf.sourceSquare || '');
      setDestinationSquare(conf.destinationSquare || '');
    }

    setFormData({
      title: puzzle.title || '',
      fen: puzzle.fen || '',
      correctMove: Array.isArray(puzzle.solutionMoves)
        ? puzzle.solutionMoves.join(', ')
        : '',
      alternativeSolutions: Array.isArray(puzzle.alternativeSolutions)
        ? puzzle.alternativeSolutions.map(sol => sol.join(', '))
        : [],
      difficulty: difficultyLabelMap[difficultyNormalized] || 'Medium',
      category: puzzle.category || 'Tactics',
      description: mainDesc,
      hints,
      level: puzzle.level || 1,
      rating: puzzle.rating || 400
    });

    // Populate editorState from FEN if possible, in case user switches to manual
    try {
      const chess = new Chess(puzzle.fen);
      const newEditorState = {};
      chess.board().forEach((row, r) => {
        row.forEach((sq, c) => {
          if (sq) {
            const squareName = `${String.fromCharCode(97 + c)}${8 - r}`;
            newEditorState[squareName] = { type: sq.type, color: sq.color };
          }
        });
      });
      setEditorState(newEditorState);
    } catch (e) { console.warn("Could not hydrate editor from FEN", e); }

    // Hydrate first move settings
    if (puzzle.type !== 'illegal') {
      setFirstMoveBy(puzzle.firstMoveBy === 'computer' ? 'computer' : 'human');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const data = await categoryAPI.getAll(false);
        if (isMounted) {
          setCategories(data);
          setLoadingCategories(false);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        if (isMounted) {
          setLoadingCategories(false);
        }
      }
    };

    const fetchPuzzle = async () => {
      setIsLoading(true);
      setApiError('');
      try {
        const puzzle = await adminAPI.getPuzzleById(id);
        if (!isMounted) return;
        hydrateFormFromPuzzle(puzzle);
      } catch (error) {
        const errorMsg = error.message || 'Unable to load puzzle details';
        if (isMounted) {
          setApiError(errorMsg);
          toast.error(errorMsg);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (id) {
      fetchCategories();
      fetchPuzzle();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const validateFEN = (fen) => {
    try {
      new Chess(fen);
      setFenError('');
      return true;
    } catch (error) {
      setFenError('Invalid FEN notation');
      return false;
    }
  };

  // Lenient validation for illegal move puzzles (no kings required)
  const validateIllegalFEN = (fen) => {
    if (!fen || !fen.trim()) { setFenError('FEN is required'); return false; }
    const piecePart = fen.trim().split(' ')[0];
    if (!/^[pnbrqkPNBRQK1-8/]+$/.test(piecePart)) { setFenError('Invalid FEN notation'); return false; }
    setFenError('');
    return true;
  };

  // Inject phantom kings at safe corners ONLY if they don't exist
  const injectKingsForIllegal = (state, playerSide) => {
    const chess = new Chess();
    chess.clear();
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
    const fenParts = chess.fen().split(' ');
    fenParts[1] = playerSide || 'w';
    return fenParts.join(' ');
  };

  const handleFENChange = (value) => {
    setFormData({ ...formData, fen: value });
    if (puzzleType === 'illegal') { validateIllegalFEN(value); } else { validateFEN(value); }
  };

  // Logic to determine Level and Difficulty from Rating
  const determineLevelAndDifficulty = (rating) => {
    const r = Number(rating);
    for (const [lvl, ranges] of Object.entries(LEVEL_RANGES)) {
      if (r >= ranges.easy[0] && r <= ranges.hard[1]) {
        // EditPuzzle uses Capitalized difficulty in state
        if (r <= ranges.easy[1]) return { level: Number(lvl), difficulty: 'Easy' };
        if (r <= ranges.medium[1]) return { level: Number(lvl), difficulty: 'Medium' };
        return { level: Number(lvl), difficulty: 'Hard' };
      }
    }
    // Fallback if out of bounds
    if (r < 300) return { level: 1, difficulty: 'Easy' };
    if (r > 3500) return { level: 7, difficulty: 'Hard' };
    return { level: 1, difficulty: 'Medium' };
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
        const sideColor = color || captureState.pieceColor;
        if (sideColor === captureState.pieceColor) {
          // Placing player piece
          setCaptureState(prev => {
            let playerPieces = [...prev.playerPieces];
            if (sourceSquare && sourceSquare !== square) playerPieces = playerPieces.filter(p => p.square !== sourceSquare);
            const existingIndex = playerPieces.findIndex(p => p.square === square);
            if (existingIndex === -1) {
              return { ...prev, playerPieces: [...playerPieces, { square, type: value, color: sideColor }] };
            } else {
              const newPieces = [...playerPieces];
              newPieces[existingIndex] = { square, type: value, color: sideColor };
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
      } else if (type === 'trash') {
        setCaptureState(prev => ({
          ...prev,
          targets: prev.targets.filter(t => t.square !== square),
          playerPieces: prev.playerPieces.filter(p => p.square !== square)
        }));
      }
    }
 else if (setupMode === 'manual') {
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

  const handleSquareClick = (square) => {
    if (puzzleType === 'capture') {
      // Toggle logic for capture
      const existingTargetIndex = captureState.targets.findIndex(t => t.square === square);
      if (existingTargetIndex !== -1) {
        setCaptureState(prev => ({
          ...prev,
          targets: prev.targets.filter((_, i) => i !== existingTargetIndex)
        }));
        return;
      }

      // Check for player pieces to remove
      const existingPieceIndex = captureState.playerPieces.findIndex(p => p.square === square);
      if (existingPieceIndex !== -1) {
        setCaptureState(prev => ({
          ...prev,
          playerPieces: prev.playerPieces.filter((_, i) => i !== existingPieceIndex)
        }));
        return;
      }

      // Place player piece (primary action)
      setCaptureState(prev => ({
        ...prev,
        playerPieces: [...prev.playerPieces, { square, type: prev.pieceType, color: prev.pieceColor }]
      }));
    }
 else if (setupMode === 'manual') {
      // Click to remove or select? For now simple click removal if piece exists?
      // Or specific behavior. Lichess allows click to select/place.
      // Let's implement click-to-delete for now if something is there, or handled by trash.
      // Actually, just leaving it as drag-drop is safer.
      const newEditorState = { ...editorState };
      if (newEditorState[square]) {
        delete newEditorState[square];
        setEditorState(newEditorState);
        updateFenFromEditor(newEditorState);
      }
    }
  };

  const updateFenFromEditor = (state) => {
    if (puzzleType === 'illegal') {
      const fen = injectKingsForIllegal(state, firstMoveBy);
      setFormData(prev => ({ ...prev, fen }));
      return;
    }
    const chess = new Chess();
    chess.clear();
    Object.entries(state).forEach(([sq, piece]) => {
      try {
        chess.put({ type: piece.type, color: piece.color }, sq);
      } catch (e) { }
    });
    setFormData(prev => ({ ...prev, fen: chess.fen() }));
  };

  const clearEditor = () => {
    setEditorState({});
    updateFenFromEditor({});
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

      const targetColor = captureState.pieceColor === 'w' ? 'b' : 'w';
      captureState.targets.forEach(t => {
        const isEmoji = ['pizza', 'chocolate', 'star', 'burger'].includes(t.item);
        chess.put({ type: isEmoji ? 'p' : t.item, color: targetColor }, t.square);
      });

      // Add phantom kings to valid FEN
      const boardSquares = [];
      for (let r = 1; r <= 8; r++) for (let f = 0; f < 8; f++) boardSquares.push(String.fromCharCode(97 + f) + r);
      
      const occupied = [
        ...captureState.playerPieces.map(p => p.square),
        ...captureState.targets.map(t => t.square)
      ].filter(Boolean);
      
      const corners = ['h8', 'a1', 'h1', 'a8', 'e1', 'e8'];
      
      let whiteKingPos = corners.find(c => !occupied.includes(c));
      if (whiteKingPos) {
        chess.put({ type: 'k', color: 'w' }, whiteKingPos);
        occupied.push(whiteKingPos);
      }
      
      let blackKingPos = corners.find(c => !occupied.includes(c));
      if (blackKingPos) chess.put({ type: 'k', color: 'b' }, blackKingPos);

      const fenParts = chess.fen().split(' ');
      fenParts[1] = captureState.pieceColor;
      setFormData(prev => ({ ...prev, fen: fenParts.join(' ') }));
    }
  }, [captureState, puzzleType]);

  const difficultyMap = {
    Easy: 'easy',
    Medium: 'medium',
    Hard: 'hard',
    Expert: 'hard',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (puzzleType === 'normal') {
      if (!validateFEN(formData.fen)) {
        setApiError('Please enter a valid FEN notation before saving.'); return;
      }
      const solutionMoves = parseSolutionMoves(formData.correctMove);
      if (!solutionMoves.length) {
        setApiError('Add at least one solution move (comma separated).'); return;
      }

      const alternativeSolutions = formData.alternativeSolutions
        .map(sol => parseSolutionMoves(sol))
        .filter(sol => sol.length > 0);

      const payload = {
        title: formData.title.trim(),
        fen: formData.fen.trim(),
        difficulty: difficultyMap[formData.difficulty] || 'medium',
        category: formData.category,
        solutionMoves,
        alternativeSolutions,
        description: [formData.description.trim(), formData.hints.trim()].filter(Boolean).join('\n\n'),
        type: 'normal',
        level: Number(formData.level),
        rating: Number(formData.rating),
        initialMove: undefined,
        firstMoveBy
      };
      submitPayload(payload);

    } else if (puzzleType === 'illegal') {
      if (!validateIllegalFEN(formData.fen)) {
        setApiError('Please enter a valid position (FEN or Board Editor).'); return;
      }

      let finalFen = formData.fen.trim();
      if (setupMode === 'manual') {
        finalFen = injectKingsForIllegal(editorState, firstMoveBy);
      } else {
        // FEN mode: ensure turn matches firstMoveBy if possible
        const fenParts = finalFen.split(' ');
        if (fenParts.length < 2) finalFen += ` ${firstMoveBy} - - 0 1`;
        else {
          fenParts[1] = firstMoveBy;
          finalFen = fenParts.join(' ');
        }
      }
      const payload = {
        title: formData.title.trim(),
        fen: finalFen,
        difficulty: 'medium',
        category: formData.category,
        description: formData.description.trim(),
        type: 'illegal',
        level: 1,
        rating: 400,
        firstMoveBy: firstMoveBy,
        illegalConfig: {
          subType: illegalSubType,
          sourceSquare: illegalSubType === 'source_destination' ? sourceSquare : undefined,
          destinationSquare: illegalSubType === 'source_destination' ? destinationSquare : undefined,
          playerSide: firstMoveBy
        }
      };
      submitPayload(payload);

    } else if (puzzleType === 'capture') {
      if (captureState.playerPieces.length === 0 || captureState.targets.length === 0) {
        setApiError('Please configure the board properly (Piece + Targets).'); return;
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
          piece: captureState.pieceType,
          playerSide: captureState.pieceColor,
          startSquare: captureState.playerPieces[0]?.square || '',
          playerPieces: captureState.playerPieces,
          targets: captureState.targets,
          enemyPieces: [],
          maximumNoOfMoves: Number(captureState.maximumNoOfMoves)
        },
        level: Number(formData.level),
        rating: Number(formData.rating)
      };
      submitPayload(payload);
    } else {
      // Illegal placeholder
      setApiError('Illegal Move puzzle modification is not yet available.');
    }
  };

  const calculatePossibleSolutions = () => {
    setIsCalculatingSolutions(true);
    setPossibleSolutions([]);

    try {
      let fenToVerify = formData.fen.trim();
      if (setupMode === 'manual') {
        fenToVerify = injectKingsForIllegal(editorState, firstMoveBy);
      } else {
        const fenParts = fenToVerify.split(' ');
        if (fenParts.length < 2) fenToVerify += ` ${firstMoveBy} - - 0 1`;
        else {
          fenParts[1] = firstMoveBy;
          fenToVerify = fenParts.join(' ');
        }
      }

      const chess = new Chess(fenToVerify);
      if (chess.turn() !== firstMoveBy) {
        const parts = chess.fen().split(' ');
        parts[1] = firstMoveBy;
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
      await adminAPI.updatePuzzle(id, payload);
      toast.success('Puzzle updated successfully!');
      setTimeout(() => navigate({ pathname: '/admin/puzzles', search: location.search }), 1500);
    } catch (error) {
      setApiError(error.message || 'Failed to update puzzle.');
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderChessBoard = () => {
    let board = [];
    if (setupMode === 'manual' && puzzleType === 'normal') {
      board = Array(8).fill(null).map(() => Array(8).fill(null));
    } else {
      try {
        const chess = new Chess(formData.fen);
        board = chess.board();
      } catch (e) {
        if (puzzleType === 'kids' || (puzzleType === 'normal' && setupMode === 'manual')) {
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
      if (puzzleType === 'illegal') return firstMoveBy;
      if (puzzleType === 'capture') return captureState.pieceColor;

      try {
        const chess = new Chess(formData.fen);
        const turn = chess.turn();
        // Computer always plays first - user plays the OPPOSITE side
        return puzzleType === 'normal' ? (turn === 'w' ? 'b' : 'w') : turn;
      } catch (e) { return 'w'; }
    })();

    const ranks = previewUserColor === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
    const files = previewUserColor === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

    return (
      <div className={`${styles.chessboard} ${puzzleType === 'kids' || setupMode === 'manual' ? styles.interactiveBoard : ''}`}>
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
                const piece = editorState[squareName];
                if (piece) content = <img src={getPieceImage(piece.type, piece.color)} className={styles.piece} alt={`${piece.color}${piece.type}`} draggable onDragStart={(e) => handlePaletteDragStart(e, 'piece', piece.type, piece.color, squareName)} style={{ cursor: 'grab' }} />;
                else if (sq) content = <img src={getPieceImage(sq.type, sq.color)} className={styles.piece} alt={`${sq.color}${sq.type}`} draggable onDragStart={(e) => handlePaletteDragStart(e, 'piece', sq.type, sq.color, squareName)} style={{ cursor: 'grab' }} />; // Fallback if switching modes
              } else if (sq) {
                content = <img src={getPieceImage(sq.type, sq.color)} className={styles.piece} alt={`${sq.color}${sq.type}`} draggable onDragStart={(e) => handlePaletteDragStart(e, 'piece', sq.type, sq.color, squareName)} style={{ cursor: 'grab' }} />;
              }
              return (
                <div
                  key={c}
                  className={`${styles.square} ${isLight ? styles.light : styles.dark}`}
                  onClick={() => { if (setupMode === 'manual' || puzzleType === 'kids') handleSquareClick(squareName); }}
                  onDragOver={handleBoardDragOver}
                  onDrop={(e) => handleBoardDrop(e, squareName)}
                >
                  {content}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
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

  return (
    <div className={styles.createPuzzle}>
      <Toaster position="top-center" />
      <PageHeader icon={FaChess} title={`Edit Puzzle #${id}`} subtitle="Update puzzle details" />

      <div className={styles.content}>
        <div className={styles.formSection}>
          <div className={styles.modeSelector}>
            <button type="button" className={`${styles.modeBtn} ${puzzleType === 'normal' ? styles.active : ''}`} onClick={() => setPuzzleType('normal')}>Normal Puzzle</button>
            <button type="button" className={`${styles.modeBtn} ${puzzleType === 'capture' ? styles.active : ''}`} onClick={() => setPuzzleType('capture')}>Capture Puzzle 🎯</button>
            <button type="button" className={`${styles.modeBtn} ${puzzleType === 'illegal' ? styles.active : ''}`} onClick={() => setPuzzleType('illegal')}>Illegal Move</button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className={styles.formGroup}>
              <label>Puzzle Title *</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
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
                    Maximum Number of Moves * 
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
                  
                  {/* Helper text 
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '10px', 
                    backgroundColor: '#e3f2fd', 
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1976d2'
                  }}>
                    💡 <strong>Tip:</strong> Lower values create harder puzzles. Consider the distance and obstacles when setting this value.
                  </div> */}
                </div>
              </div>
            ) : (
              <>
                {puzzleType === 'illegal' && (
                  <>
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
                  </>
                )}

                <div className={styles.setupToggle}>
                  <label>Setup Method:</label>
                  <div className={styles.toggleBtns}>
                    <button type="button" className={setupMode === 'fen' ? styles.active : ''} onClick={() => setSetupMode('fen')}>FEN String</button>
                    <button type="button" className={setupMode === 'manual' ? styles.active : ''} onClick={() => { setSetupMode('manual'); if (!Object.keys(editorState).length) setEditorState({}); }}>Board Editor</button>
                    <button type="button" onClick={() => window.open('https://lichess.org/editor', '_blank')} className={styles.lichessBtn}>
                      <img src="https://lichess1.org/assets/_H8963X/logo/lichess-favicon-32.png" alt="" style={{ width: '16px', marginRight: '6px' }} />
                      Lichess Editor
                    </button>
                  </div>
                </div>
                {setupMode === 'fen' && (
                  <div className={styles.formGroup}>
                    <label>FEN Position *</label>
                    <textarea rows="2" value={formData.fen} onChange={(e) => handleFENChange(e.target.value)} required={setupMode === 'fen'} />
                  </div>
                )}
                  {/* Palette moved to right preview section */}

                {/* Illegal Move Controls */}
                {puzzleType === 'illegal' && (
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
                )}

                {/* Solution Moves only for normal type */}
                {puzzleType === 'normal' && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Correct Move(s) *</label>
                    <input type="text" value={formData.correctMove} onChange={(e) => setFormData((prev) => ({ ...prev, correctMove: e.target.value }))} required />
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.9em', color: '#666', fontWeight: '600' }}>Alternative Solutions (Optional)</label>
                        <button type="button" onClick={handleAddAlternative} style={{ fontSize: '0.85em', background: '#f0f4f8', border: '1px solid #bee3f8', color: '#2b6cb0', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', fontWeight: '600' }}>+ Add Alternative</button>
                      </div>
                      {formData.alternativeSolutions.map((sol, index) => (
                        <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                          <input type="text" value={sol} onChange={(e) => handleAlternativeChange(index, e.target.value)} placeholder="e.g., Qf7#" style={{ flex: 1 }} />
                          <button type="button" onClick={() => handleRemoveAlternative(index)} style={{ background: '#fff0f0', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: '8px', padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
                  {categories.map((cat) => <option key={cat._id} value={cat.name}>{cat.title}</option>)}
                </select>
              </div>

              {/* Who should play to solve? (Only for Illegal Move) */}
              {puzzleType === 'illegal' && (
                <div className={styles.formGroup}>
                  <label>Who should play to solve? *</label>
                  <div className={styles.toggleBtns}>
                    <button type="button" className={firstMoveBy === 'w' ? styles.active : ''} onClick={() => setFirstMoveBy('w')}>White</button>
                    <button type="button" className={firstMoveBy === 'b' ? styles.active : ''} onClick={() => setFirstMoveBy('b')}>Black</button>
                  </div>
                  <p className={styles.instruction}><small>In 'Avoid Illegal Move' puzzles, the side to move (White or Black) must make any legal move to solve.</small></p>
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

            {/* Level and Difficulty side-by-side */}
            {puzzleType !== 'illegal' && (
              <div className={styles.formGrid} style={{ background: '#f8f9fa', padding: '15px 20px', borderRadius: '10px', border: '1px solid #eaeaea', marginBottom: '25px' }}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem' }}>Level (Auto)</label>
                  <select
                    required
                    value={formData.level}
                    disabled
                    style={{ background: '#edf2f7', cursor: 'not-allowed', color: '#718096' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(l => (
                      <option key={l} value={l}>Level {l}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem' }}>Difficulty (Auto)</label>
                  <select
                    required
                    value={formData.difficulty}
                    disabled
                    style={{ background: '#edf2f7', cursor: 'not-allowed', color: '#718096' }}
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>

                <div className={styles.fullWidth} style={{ marginTop: '5px', fontSize: '0.85em', color: '#718096', fontStyle: 'italic' }}>
                  Current Range: {LEVEL_RANGES[formData.level]?.[formData.difficulty.toLowerCase()]
                    ? `${LEVEL_RANGES[formData.level][formData.difficulty.toLowerCase()][0]} - ${LEVEL_RANGES[formData.level][formData.difficulty.toLowerCase()][1]}`
                    : 'N/A'}
                </div>
              </div>
            )}
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>

            <div className={styles.actions}>
              <Button type="button" variant="secondary" icon={FaTimes} onClick={() => navigate({ pathname: '/admin/puzzles', search: location.search })}>Cancel</Button>
              <Button type="submit" icon={FaSave} disabled={isSubmitting || isTestMode}>
                {isSubmitting ? 'Updating...' : 'Update Puzzle'}
              </Button>
            </div>
          </form>
        </div>

        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h3>Live Preview {isTestMode && <span style={{ color: '#e53e3e', fontSize: '0.9em', marginLeft: '10px' }}>[TEST MODE]</span>}</h3>
            <span className={styles.previewBadge}>
              {String(formData.difficulty).charAt(0).toUpperCase() + String(formData.difficulty).slice(1)} | Lvl {formData.level} ({formData.rating})
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
                firstMoveBy={firstMoveBy}
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
                {testStatus === 'playing' && 'Play any legal move to test...'}
                {testStatus === 'solved' && '✔️ Valid Move!'}
                {testStatus === 'failed' && '❌ Illegal Move!'}
              </div>
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
                  if (!fenToTest) return toast.error('Please enter a FEN position first.');
                  if (puzzleType !== 'illegal' && !validateFEN(fenToTest)) return toast.error('Invalid FEN position.');
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
            <div><strong>Title:</strong> {formData.title || 'Untitled'}</div>
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
      </div >
    </div >
  );
}

export default EditPuzzle;
