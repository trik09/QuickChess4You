import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { FaChess, FaSave, FaTimes, FaLayerGroup, FaSignal, FaLightbulb } from 'react-icons/fa';
import { PageHeader, Button } from '../../../components/Admin';
import styles from './CreatePuzzle.module.css';

function CreatePuzzle() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    correctMove: '',
    difficulty: 'Medium',
    category: 'Tactics',
    description: '',
    hints: ''
  });
  const [fenError, setFenError] = useState('');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateFEN(formData.fen)) {
      alert('Please enter a valid FEN notation');
      return;
    }
    
    // Simulate save
    console.log('Creating puzzle:', formData);
    alert('Puzzle created successfully!');
    navigate('/admin/puzzles');
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
                const piece = square ? square.type + square.color : null;
                
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

  const presetPositions = [
    { name: 'Starting Position', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
    { name: 'Scholar\'s Mate', fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4' },
    { name: 'Back Rank Mate', fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1' },
    { name: 'Empty Board', fen: '8/8/8/8/8/8/8/8 w - - 0 1' }
  ];

  return (
    <div className={styles.createPuzzle}>
      <PageHeader
        icon={FaChess}
        title="Create New Puzzle"
        subtitle="Design a new chess puzzle for players"
      />

      <div className={styles.content}>
        <div className={styles.formSection}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>
                <FaChess /> Puzzle Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Checkmate in 3 moves"
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>
                  <FaLayerGroup /> Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Tactics">Tactics</option>
                  <option value="Endgame">Endgame</option>
                  <option value="Opening">Opening</option>
                  <option value="Middlegame">Middlegame</option>
                  <option value="Strategy">Strategy</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>
                  <FaSignal /> Difficulty *
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>
                FEN Position *
                <span className={styles.labelHint}>
                  (Forsyth-Edwards Notation)
                </span>
              </label>
              <textarea
                rows="2"
                value={formData.fen}
                onChange={(e) => handleFENChange(e.target.value)}
                placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                className={fenError ? styles.error : ''}
                required
              />
              {fenError && <span className={styles.errorText}>{fenError}</span>}
              
              <div className={styles.presets}>
                <span>Quick presets:</span>
                {presetPositions.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    className={styles.presetBtn}
                    onClick={() => handleFENChange(preset.fen)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>
                Correct Move(s) *
                <span className={styles.labelHint}>
                  (e.g., e2e4, Nf3, O-O)
                </span>
              </label>
              <input
                type="text"
                value={formData.correctMove}
                onChange={(e) => setFormData({ ...formData, correctMove: e.target.value })}
                placeholder="e.g., Qh5, e2e4"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                Description
              </label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the puzzle objective..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <FaLightbulb /> Hints (Optional)
              </label>
              <textarea
                rows="2"
                value={formData.hints}
                onChange={(e) => setFormData({ ...formData, hints: e.target.value })}
                placeholder="Provide hints for players..."
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
              <Button type="submit" icon={FaSave}>
                Create Puzzle
              </Button>
            </div>
          </form>
        </div>

        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h3>Live Preview</h3>
            <span className={styles.previewBadge}>
              {formData.difficulty}
            </span>
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

export default CreatePuzzle;
