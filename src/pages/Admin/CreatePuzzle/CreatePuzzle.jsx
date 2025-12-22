import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Chess } from "chess.js";
import { FaChess, FaSave, FaTimes, FaLightbulb, FaUndo, FaTrash } from "react-icons/fa";
import { PageHeader, Button } from "../../../components/Admin";
import { adminAPI, categoryAPI } from "../../../services/api";
import styles from "./CreatePuzzle.module.css";
import { useAuth } from "../../../contexts/AuthContext";
import toast, { Toaster } from 'react-hot-toast';

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

function CreatePuzzle() {
  const navigate = useNavigate();
  const { isAdminAuthenticated } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // 'normal' or 'kids'
  const [puzzleType, setPuzzleType] = useState('normal');

  const [formData, setFormData] = useState({
    title: "",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    correctMove: "",
    difficulty: "medium",
    category: "",
    description: "",
    hints: "",
  });

  // Kids Mode State
  const [kidsState, setKidsState] = useState({
    pieceType: 'n', // Default Knight
    pieceColor: 'w',
    startSquare: null,
    targets: [], // { square: 'e5', item: 'pizza' }
    targetType: 'pizza' // Current target type to place
  });

  const [setupMode, setSetupMode] = useState('fen'); // 'fen' | 'manual'
  const [editorState, setEditorState] = useState({}); // { 'e4': { type: 'p', color: 'w' } }

  const [fenError, setFenError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Validate FEN using chess.js
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

  const handleFENChange = (value) => {
    setFormData((prev) => ({ ...prev, fen: value }));
    validateFEN(value);
  };

  // Generate FEN for Kids Mode
  useEffect(() => {
    if (puzzleType === 'kids') {
      const chess = new Chess();
      chess.clear();

      // Place the main piece
      if (kidsState.startSquare) {
        chess.put({ type: kidsState.pieceType, color: kidsState.pieceColor }, kidsState.startSquare);
      }

      // Place targets as opposite color pawns
      const targetColor = kidsState.pieceColor === 'w' ? 'b' : 'w';
      kidsState.targets.forEach(t => {
        chess.put({ type: 'p', color: targetColor }, t.square);
      });

      // ADD KINGS to make FEN valid for chess.js engine
      // Find safe squares for kings (corners usually safe, but check)
      const corners = ['h8', 'a1', 'h1', 'a8'];
      const usedSquares = [kidsState.startSquare, ...kidsState.targets.map(t => t.square)].filter(Boolean);

      let whiteKingPos = corners.find(c => !usedSquares.includes(c));
      if (!whiteKingPos) {
        // Fallback search if corners taken
        const ranks = ['1', '8'];
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        for (let r of ranks) {
          for (let f of files) {
            if (!usedSquares.includes(f + r)) { whiteKingPos = f + r; break; }
          }
          if (whiteKingPos) break;
        }
      }
      if (whiteKingPos) {
        chess.put({ type: 'k', color: 'w' }, whiteKingPos);
        usedSquares.push(whiteKingPos);
      }

      let blackKingPos = corners.find(c => !usedSquares.includes(c));
      if (!blackKingPos) {
        // Fallback search
        const ranks = ['8', '1'];
        const files = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
        for (let r of ranks) {
          for (let f of files) {
            if (!usedSquares.includes(f + r)) { blackKingPos = f + r; break; }
          }
          if (blackKingPos) break;
        }
      }
      if (blackKingPos) {
        chess.put({ type: 'k', color: 'b' }, blackKingPos);
      }

      // Set turn to player's color
      const fenParts = chess.fen().split(' ');
      fenParts[1] = kidsState.pieceColor;
      const newFen = fenParts.join(' ');

      setFormData(prev => ({ ...prev, fen: newFen }));
    }
  }, [kidsState, puzzleType]);

  const parseSolutionMoves = (raw) =>
    raw
      .split(/[\n,]/)
      .map((m) => m.trim())
      .filter(Boolean);

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

    // Specific Validation
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

      // Build Payload
      const payload = {
        title: formData.title.trim(),
        fen: formData.fen.trim(),
        difficulty: formData.difficulty.toLowerCase(),
        category: formData.category,
        solutionMoves,
        description: [formData.description.trim(), formData.hints.trim()].filter(Boolean).join("\n\n"),
        type: 'normal'
      };
      submitPayload(payload);

    } else {
      // Kids Validation
      if (!kidsState.startSquare) {
        setApiError("Please place the starting piece on the board.");
        return;
      }
      if (kidsState.targets.length === 0) {
        setApiError("Please place at least one target on the board.");
        return;
      }

      // Build Payload
      const payload = {
        title: formData.title.trim(),
        fen: formData.fen.trim(),
        difficulty: formData.difficulty.toLowerCase(),
        category: formData.category,
        description: [formData.description.trim(), formData.hints.trim()].filter(Boolean).join("\n\n"),
        type: 'kids',
        kidsConfig: {
          piece: kidsState.pieceType,
          startSquare: kidsState.startSquare,
          targets: kidsState.targets
        }
      };
      submitPayload(payload);
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
    if (puzzleType !== 'kids') {
      if (setupMode === 'manual') {
        const newEditorState = { ...editorState };
        if (newEditorState[square]) {
          delete newEditorState[square];
          setEditorState(newEditorState);
          updateFenFromEditor(newEditorState);
        }
      }
      return;
    }

    // Kids Mode Logic

    // 1. If clicking the main piece -> Remove it (to allow moving it)
    if (kidsState.startSquare === square) {
      setKidsState(prev => ({ ...prev, startSquare: null }));
      return;
    }

    // 2. If clicking an existing target -> Remove it
    const existingTargetIndex = kidsState.targets.findIndex(t => t.square === square);
    if (existingTargetIndex !== -1) {
      setKidsState(prev => ({
        ...prev,
        targets: prev.targets.filter((_, i) => i !== existingTargetIndex)
      }));
      return;
    }

    // 3. Placement Logic
    // If we have selected a 'piece' from palette (implicit state) or just defaulting?
    // The palette updates 'pieceType' or 'targetType'. Use that intent.

    // Actually, logic was: If piece not placed, place piece. If piece placed, place target.
    // User wants "1 main piece and rest all anything he can add freely".

    // Let's refine:
    // User selects what they want to place from palette (implicitly via last click/drag).
    // Current UI sets 'pieceType' or 'targetType' when clicking palette.
    // We should probably track "active tool" (Piece vs Target).
    // But currently we only have `pieceType` and `targetType` state, not "what is selected".

    // Default behavior for click:
    // If no main piece, assume placing main piece.
    // If main piece exists, assume placing target.
    if (!kidsState.startSquare) {
      setKidsState(prev => ({ ...prev, startSquare: square }));
    } else {
      // Allow unlimited targets
      setKidsState(prev => ({
        ...prev,
        targets: [...prev.targets, { square, item: prev.targetType }]
      }));
    }
  };

  const updateFenFromEditor = (state) => {
    const chess = new Chess();
    chess.clear();
    Object.entries(state).forEach(([sq, piece]) => {
      try {
        chess.put({ type: piece.type, color: piece.color }, sq);
      } catch (e) {
        // Ignore invalid placements (e.g. pawn on 1st/8th rank if engine strictly forbids, though chess.js might allow)
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
  const handlePaletteDragStart = (e, type, value, color) => {
    e.dataTransfer.setData('type', type);
    e.dataTransfer.setData('value', value);
    if (color) e.dataTransfer.setData('color', color);
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

    if (!type || !value) return;

    if (puzzleType === 'kids') {
      if (type === 'piece') {
        setKidsState(prev => ({ ...prev, pieceType: value, pieceColor: color || kidsState.pieceColor, startSquare: square }));
      } else if (type === 'target') {
        const existingIndex = kidsState.targets.findIndex(t => t.square === square);
        if (existingIndex === -1) {
          setKidsState(prev => ({ ...prev, targets: [...prev.targets, { square, item: value }] }));
        } else {
          const newTargets = [...kidsState.targets];
          newTargets[existingIndex].item = value;
          setKidsState(prev => ({ ...prev, targets: newTargets }));
        }
      }
    } else if (setupMode === 'manual') {
      // Normal Mode Manual Setup
      if (type === 'piece') {
        const newEditorState = { ...editorState, [square]: { type: value, color } };
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

    const rows = [8, 7, 6, 5, 4, 3, 2, 1];

    return (
      <div className={`${styles.chessboard} ${puzzleType === 'kids' || setupMode === 'manual' ? styles.interactiveBoard : ''}`}>
        {board.map((row, r) => (
          <div key={r} className={styles.row}>
            {rows[r] && row.map((sq, c) => {
              const squareName = `${String.fromCharCode(97 + c)}${8 - r}`;
              const isLight = (r + c) % 2 === 0;

              let content = null;

              if (puzzleType === 'kids') {
                const target = kidsState.targets.find(t => t.square === squareName);
                if (target) {
                  content = <span style={{ fontSize: '32px' }}>{target.item === 'pizza' ? '🍕' : '🍫'}</span>;
                }
                else if (kidsState.startSquare === squareName) {
                  content = <img src={getPieceImage(kidsState.pieceType, kidsState.pieceColor)} className={styles.piece} alt="piece" />;
                }
              } else if (setupMode === 'manual') {
                // Check editor state
                const piece = editorState[squareName];
                if (piece) {
                  content = <img src={getPieceImage(piece.type, piece.color)} className={styles.piece} alt={`${piece.color}${piece.type}`} />;
                } else if (sq) {
                  // Fallback to FEN-derived sq if editorState not populated (e.g. init from FEN)
                }
              } else if (sq) {
                content = <img src={getPieceImage(sq.type, sq.color)} className={styles.piece} alt={`${sq.color}${sq.type}`} />;
              }

              return (
                <div
                  key={c}
                  className={`${styles.square} ${isLight ? styles.light : styles.dark}`}
                  onClick={() => {
                    if (setupMode === 'manual' || puzzleType === 'kids') {
                      handleSquareClick(squareName);
                    }
                  }}
                  onDragOver={handleBoardDragOver}
                  onDrop={(e) => handleBoardDrop(e, squareName)}
                >
                  {content}

                  {/* Rank Label (Left side) */}
                  {c === 0 && (
                    <div
                      className={styles.rankLabel}
                      style={{ color: isLight ? '#b58863' : '#f0d9b5' }}
                    >
                      {8 - r}
                    </div>
                  )}

                  {/* File Label (Bottom side) */}
                  {r === 7 && (
                    <div
                      className={styles.fileLabel}
                      style={{ color: isLight ? '#b58863' : '#f0d9b5' }}
                    >
                      {String.fromCharCode(97 + c)}
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
              className={`${styles.modeBtn} ${puzzleType === 'kids' ? styles.active : ''}`}
              onClick={() => setPuzzleType('kids')}
            >
              Kids Puzzle 🍕
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

            {/* NORMAL vs KIDS Logic */}
            {puzzleType === 'kids' ? (
              // KIDS MODE CONTROLS
              <div className={styles.kidsControls}>
                <div className={styles.controlGroup}>
                  <label>1. Select Player Piece</label>
                  <div className={styles.colorToggle} style={{ marginBottom: '10px' }}>
                    <div
                      className={`${styles.colorBtn} ${styles.white} ${kidsState.pieceColor === 'w' ? styles.selected : ''}`}
                      onClick={() => setKidsState({ ...kidsState, pieceColor: 'w' })}
                    />
                    <div
                      className={`${styles.colorBtn} ${styles.black} ${kidsState.pieceColor === 'b' ? styles.selected : ''}`}
                      onClick={() => setKidsState({ ...kidsState, pieceColor: 'b' })}
                    />
                  </div>
                  <div className={styles.piecePalette}>
                    {['n', 'b', 'r', 'q', 'k', 'p'].map(p => (
                      <div
                        key={p}
                        className={`${styles.pieceOption} ${kidsState.pieceType === p ? styles.selected : ''}`}
                        onClick={() => setKidsState(prev => ({ ...prev, pieceType: p }))}
                        draggable
                        onDragStart={(e) => handlePaletteDragStart(e, 'piece', p)}
                      >
                        <img src={getPieceImage(p, kidsState.pieceColor)} alt={p} />
                      </div>
                    ))}
                  </div>
                  <p className={styles.instruction}>Select a piece and click on the board to place it, or drag and drop onto the board.</p>
                </div>

                <div className={styles.controlGroup}>
                  <label>2. Select Targets</label>
                  <div className={styles.targetPalette}>
                    <div
                      className={`${styles.targetOption} ${kidsState.targetType === 'pizza' ? styles.selected : ''}`}
                      onClick={() => setKidsState(prev => ({ ...prev, targetType: 'pizza' }))}
                      draggable
                      onDragStart={(e) => handlePaletteDragStart(e, 'target', 'pizza')}
                    >
                      🍕
                    </div>
                    <div
                      className={`${styles.targetOption} ${kidsState.targetType === 'chocolate' ? styles.selected : ''}`}
                      onClick={() => setKidsState(prev => ({ ...prev, targetType: 'chocolate' }))}
                      draggable
                      onDragStart={(e) => handlePaletteDragStart(e, 'target', 'chocolate')}
                    >
                      🍫
                    </div>
                  </div>
                  <p className={styles.instruction}>Select a target type and click on empty squares to place targets, or drag and drop.</p>
                </div>
              </div>
            ) : (
              // NORMAL MODE CONTROLS (FEN or Manual)
              <>
                <div className={styles.setupToggle}>
                  <label>Setup Method:</label>
                  <div className={styles.toggleBtns}>
                    <button type="button" className={setupMode === 'fen' ? styles.active : ''} onClick={() => setSetupMode('fen')}>FEN String</button>
                    <button type="button" className={setupMode === 'manual' ? styles.active : ''} onClick={() => { setSetupMode('manual'); setEditorState({}); setFormData(p => ({ ...p, fen: '' })); }}>Board Editor</button>
                  </div>
                </div>

                {setupMode === 'fen' && (
                  <div className={styles.formGroup}>
                    <label>FEN Position *</label>
                    <textarea
                      rows="2"
                      value={formData.fen}
                      onChange={(e) => handleFENChange(e.target.value)}
                      className={fenError ? styles.error : ""}
                      required={setupMode === 'fen'}
                    />
                    {fenError && <span className={styles.errorText}>{fenError}</span>}
                  </div>
                )}

                {setupMode === 'manual' && (
                  <div className={styles.editorPalette}>
                    <p className={styles.instruction}>Drag pieces to the board. Drag 'Trash' to remove.</p>
                    <div className={styles.paletteRow}>
                      {['k', 'q', 'r', 'b', 'n', 'p'].map(p => (
                        <div key={`w${p}`} className={styles.pieceOption} draggable onDragStart={(e) => handlePaletteDragStart(e, 'piece', p, 'w')}>
                          <img src={getPieceImage(p, 'w')} alt="" />
                        </div>
                      ))}
                    </div>
                    <div className={styles.paletteRow}>
                      {['k', 'q', 'r', 'b', 'n', 'p'].map(p => (
                        <div key={`b${p}`} className={styles.pieceOption} draggable onDragStart={(e) => handlePaletteDragStart(e, 'piece', p, 'b')}>
                          <img src={getPieceImage(p, 'b')} alt="" />
                        </div>
                      ))}
                      <div className={styles.trashOption} draggable onDragStart={(e) => handlePaletteDragStart(e, 'trash', 'trash', null)}>
                        <FaTrash />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                      <button type="button" onClick={clearEditor} className={styles.clearBtn}>Clear Board</button>
                    </div>
                    <div className={styles.generatedFen}>
                      <small>Generated FEN: {formData.fen || 'Empty'}</small>
                    </div>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label>Correct Move(s) *</label>
                  <input
                    type="text"
                    required
                    value={formData.correctMove}
                    onChange={(e) => setFormData((prev) => ({ ...prev, correctMove: e.target.value }))}
                    placeholder="e.g., Qh5, e2e4"
                  />
                </div>
              </>
            )}

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

            <div className={styles.formGroup}>
              <label>Difficulty *</label>
              <select
                required
                value={formData.difficulty}
                onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value }))}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

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

              <Button type="submit" icon={FaSave} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Puzzle"}
              </Button>
            </div>

            {apiError && <p className={styles.apiError}>{apiError}</p>}
          </form>
        </div>

        {/* RIGHT: LIVE PREVIEW */}
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h3>Live Preview</h3>
            <span className={styles.previewBadge}>
              {formData.difficulty.charAt(0).toUpperCase() + formData.difficulty.slice(1)}
            </span>
          </div>

          <div className={styles.boardContainer}>{renderChessBoard()}</div>

          <div className={styles.previewInfo}>
            <div><strong>Title:</strong> {formData.title || "Untitled"}</div>
            <div><strong>Type:</strong> {puzzleType === 'kids' ? 'Kids' : 'Normal'}</div>
            {puzzleType === 'normal' && formData.correctMove && (
              <div><strong>Solution:</strong> {formData.correctMove}</div>
            )}
            {puzzleType === 'kids' && (
              <div>
                <strong>Setup:</strong> {kidsState.startSquare ? 'Piece Placed' : 'No Piece'}, {kidsState.targets.length} Targets
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePuzzle;
