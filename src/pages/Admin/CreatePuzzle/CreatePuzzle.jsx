import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chess } from "chess.js";
import { FaChess, FaSave, FaTimes, FaLightbulb } from "react-icons/fa";
import { PageHeader, Button } from "../../../components/Admin";
import { adminAPI } from "../../../services/api";
import styles from "./CreatePuzzle.module.css";
import {useAuth} from "../../../contexts/AuthContext";
import toast, { Toaster } from 'react-hot-toast';

function CreatePuzzle() {
  const navigate = useNavigate();
  const { isAdminAuthenticated } = useAuth();
  //console.log(admin);
  const [formData, setFormData] = useState({
    title: "",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    correctMove: "",
    difficulty: "medium", // Backend expects: easy, medium, hard
    description: "",
    hints: "",
  });

  const [fenError, setFenError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Convert "Qh5, e2e4" → ["Qh5", "e2e4"]
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

    // Validate FEN
    if (!validateFEN(formData.fen)) {
      setApiError("Please enter a valid FEN notation before saving.");
      return;
    }

    // Validate moves
    const solutionMoves = parseSolutionMoves(formData.correctMove);
    if (!solutionMoves.length) {
      setApiError("Add at least one solution move (comma separated).");
      return;
    }

    // Build final payload matching backend API requirements
    const payload = {
      title: formData.title.trim(),
      fen: formData.fen.trim(),
      difficulty: formData.difficulty.toLowerCase(), // Backend expects: easy, medium, hard
      solutionMoves, // Array of moves
      description: [formData.description.trim(), formData.hints.trim()]
        .filter(Boolean)
        .join("\n\n"),
    };

    setIsSubmitting(true);
    try {
      // Your CORRECT API call
      await adminAPI.createPuzzle(payload);

      toast.success("Puzzle created successfully!");
      // Delay navigation to allow toast to be visible
      setTimeout(() => {
        navigate("/admin/puzzles");
      }, 1500);
    } catch (error) {
      console.error("Failed to create puzzle:", error);
      toast.error(error?.response?.data?.message || "Failed to create puzzle. Try again.");
      setApiError(
        error?.response?.data?.message || "Failed to create puzzle. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render board preview
  const renderChessBoard = () => {
    try {
      const chess = new Chess(formData.fen);
      const board = chess.board();

      return (
        <div className={styles.chessboard}>
          {board.map((row, r) => (
            <div key={r} className={styles.row}>
              {row.map((sq, c) => {
                const isLight = (r + c) % 2 === 0;
                return (
                  <div
                    key={c}
                    className={`${styles.square} ${
                      isLight ? styles.light : styles.dark
                    }`}
                  >
                    {sq && (
                      <span className={styles.piece}>
                        {getPieceSymbol(sq.type, sq.color)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    } catch {
      return (
        <div className={styles.boardError}>
          <FaChess />
          <p>Invalid FEN - Board cannot be displayed</p>
        </div>
      );
    }
  };

  const getPieceSymbol = (type, color) => {
    const map = {
      p: { w: "♙", b: "♟" },
      n: { w: "♘", b: "♞" },
      b: { w: "♗", b: "♝" },
      r: { w: "♖", b: "♜" },
      q: { w: "♕", b: "♛" },
      k: { w: "♔", b: "♚" },
    };
    return map[type]?.[color] || "";
  };

  const presetPositions = [
    { name: "Starting Position", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" },
    { name: "Scholar's Mate", fen: "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4" },
    { name: "Back Rank Mate", fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1" },
    { name: "Empty Board", fen: "8/8/8/8/8/8/8/8 w - - 0 1" },
  ];

  return (
    <div className={styles.createPuzzle}>
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        toastOptions={{ 
          duration: 5000,
          style: {
            background: '#333',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 9999,
          },
          success: {
            style: {
              background: '#10b981',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
        }} 
      />

      <PageHeader
        icon={FaChess}
        title="Create New Puzzle"
        subtitle="Design a new chess puzzle"
      />

      <div className={styles.content}>
        {/* LEFT: FORM */}
        <div className={styles.formSection}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Puzzle Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Mate in 2"
              />
            </div>

            <div className={styles.formGroup}>
              <label>FEN Position *</label>
              <textarea
                rows="2"
                required
                className={fenError ? styles.error : ""}
                value={formData.fen}
                onChange={(e) => handleFENChange(e.target.value)}
              />
              {fenError && <span className={styles.errorText}>{fenError}</span>}

              <div className={styles.presets}>
                <span>Quick presets:</span>
                {presetPositions.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    className={styles.presetBtn}
                    onClick={() => handleFENChange(p.fen)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Correct Move(s) *</label>
              <input
                type="text"
                required
                value={formData.correctMove}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, correctMove: e.target.value }))
                }
                placeholder="e.g., Qh5, e2e4"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Difficulty *</label>
              <select
                required
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, difficulty: e.target.value }))
                }
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label><FaLightbulb /> Hints (optional)</label>
              <textarea
                rows="2"
                value={formData.hints}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, hints: e.target.value }))
                }
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
            <div>
              <strong>Difficulty:</strong>{" "}
              {formData.difficulty.charAt(0).toUpperCase() + formData.difficulty.slice(1)}
            </div>
            {formData.correctMove && (
              <div><strong>Solution:</strong> {formData.correctMove}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePuzzle;
