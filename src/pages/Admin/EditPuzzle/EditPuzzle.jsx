import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import toast, { Toaster } from 'react-hot-toast';
import { FaChess, FaSave, FaTimes, FaLayerGroup, FaSignal, FaLightbulb } from 'react-icons/fa';
import { PageHeader, Button } from '../../../components/Admin';
import { adminAPI } from '../../../services/api';
import styles from './EditPuzzle.module.css';

function EditPuzzle() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: '',
    fen: '',
    correctMove: '',
    difficulty: 'Medium',
    category: 'Tactics',
    description: '',
    hints: '',
  });
  const [fenError, setFenError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

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

    setFormData({
      title: puzzle.title || '',
      fen: puzzle.fen || '',
      correctMove: Array.isArray(puzzle.solutionMoves)
        ? puzzle.solutionMoves.join(', ')
        : '',
      difficulty: difficultyLabelMap[difficultyNormalized] || 'Medium',
      category: puzzle.category || 'Tactics',
      description: mainDesc,
      hints,
    });
  };

  useEffect(() => {
    let isMounted = true;

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
      const chess = new Chess(fen);
      setFenError('');
      return true;
    } catch (error) {
      setFenError('Invalid FEN notation');
      return false;
    }
  };

  const handleFENChange = (value) => {
    setFormData({ ...formData, fen: value });
    validateFEN(value);
  };

  const parseSolutionMoves = (raw) =>
    raw
      .split(/[\n,]/)
      .map((m) => m.trim())
      .filter(Boolean);

  const difficultyMap = {
    Easy: 'easy',
    Medium: 'medium',
    Hard: 'hard',
    Expert: 'hard',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateFEN(formData.fen)) {
      const errorMsg = 'Please enter a valid FEN notation before saving.';
      setApiError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const solutionMoves = parseSolutionMoves(formData.correctMove);
    if (!solutionMoves.length) {
      const errorMsg = 'Add at least one solution move (comma separated).';
      setApiError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const payload = {
      title: formData.title.trim(),
      fen: formData.fen.trim(),
      difficulty: difficultyMap[formData.difficulty] || 'medium',
      category: formData.category,
      solutionMoves,
      description: [formData.description.trim(), formData.hints.trim()]
        .filter(Boolean)
        .join('\n\n'),
    };

    setIsSubmitting(true);
    try {
      await adminAPI.updatePuzzle(id, payload);
      toast.success('Puzzle updated successfully!');
      // Delay navigation to allow toast to be visible
      setTimeout(() => {
        navigate('/admin/puzzles');
      }, 1500);
    } catch (error) {
      const errorMsg = error.message || 'Failed to update puzzle. Try again.';
      setApiError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderChessBoard = () => {
    try {
      const chess = new Chess(formData.fen);
      const board = chess.board();
      
      return (
        <div className={styles.chessboard}>
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.row}>
              {row.map((square, colIndex) => {
                const isLight = (rowIndex + colIndex) % 2 === 0;
                
                return (
                  <div
                    key={colIndex}
                    className={`${styles.square} ${isLight ? styles.light : styles.dark}`}
                  >
                    {square && (
                      <span className={styles.piece}>
                        {getPieceSymbol(square.type, square.color)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    } catch (error) {
      return (
        <div className={styles.boardError}>
          <FaChess />
          <p>Invalid FEN - Board cannot be displayed</p>
        </div>
      );
    }
  };

  const getPieceSymbol = (type, color) => {
    const pieces = {
      p: { w: '♙', b: '♟' },
      n: { w: '♘', b: '♞' },
      b: { w: '♗', b: '♝' },
      r: { w: '♖', b: '♜' },
      q: { w: '♕', b: '♛' },
      k: { w: '♔', b: '♚' }
    };
    return pieces[type]?.[color] || '';
  };

  return (
    <div className={styles.editPuzzle}>
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
        title={`Edit Puzzle #${id}`}
        subtitle="Update puzzle details"
      />

      <div className={styles.content}>
        <div className={styles.formSection}>
          <form onSubmit={handleSubmit}>
            {isLoading && <p>Loading puzzle...</p>}
            {/* {apiError && <p className={styles.apiError}>{apiError}</p>} */}

            <div className={styles.formGroup}>
              <label><FaChess /> Puzzle Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label><FaLayerGroup /> Category *</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option>Tactics</option>
                  <option>Endgame</option>
                  <option>Opening</option>
                  <option>Middlegame</option>
                  <option>Strategy</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label><FaSignal /> Difficulty *</label>
                <select 
                  value={formData.difficulty}
                  onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                  <option>Expert</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>FEN Position *</label>
              <textarea
                rows="2"
                value={formData.fen}
                onChange={(e) => handleFENChange(e.target.value)}
                className={fenError ? styles.error : ''}
                required
              />
              {fenError && <span className={styles.errorText}>{fenError}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Correct Move(s) *</label>
              <input
                type="text"
                value={formData.correctMove}
                onChange={(e) => setFormData({...formData, correctMove: e.target.value})}
                placeholder="e.g., e2e4"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className={styles.formGroup}>
              <label><FaLightbulb /> Hints</label>
              <textarea
                rows="2"
                value={formData.hints}
                onChange={(e) => setFormData({...formData, hints: e.target.value})}
              />
            </div>

            <div className={styles.actions}>
              <Button
                type="button"
                variant="secondary"
                icon={FaTimes}
                onClick={() => navigate('/admin/puzzles')}
              >
                Cancel
              </Button>
              <Button type="submit" icon={FaSave} disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Puzzle'}
              </Button>
            </div>
          </form>
        </div>

        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h3>Live Preview</h3>
            <span className={styles.previewBadge}>{formData.difficulty}</span>
          </div>
          
          <div className={styles.boardContainer}>
            {renderChessBoard()}
          </div>

          <div className={styles.previewInfo}>
            <div className={styles.infoItem}>
              <strong>Category:</strong> {formData.category}
            </div>
            <div className={styles.infoItem}>
              <strong>Difficulty:</strong> {formData.difficulty}
            </div>
            {formData.correctMove && (
              <div className={styles.infoItem}>
                <strong>Solution:</strong> {formData.correctMove}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditPuzzle;
