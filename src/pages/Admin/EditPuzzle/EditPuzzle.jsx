import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { FaChess, FaSave, FaTimes, FaLayerGroup, FaSignal, FaLightbulb } from 'react-icons/fa';
import { PageHeader, Button } from '../../../components/Admin';
import styles from './EditPuzzle.module.css';

function EditPuzzle() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    title: 'Checkmate in 3',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    correctMove: 'e2e4',
    difficulty: 'Hard',
    category: 'Tactics',
    description: 'Find the winning combination',
    hints: 'Look for a forcing move'
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
    console.log('Updating puzzle:', formData);
    alert('Puzzle updated successfully!');
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
      <PageHeader
        icon={FaChess}
        title={`Edit Puzzle #${id}`}
        subtitle="Update puzzle details"
      />

      <div className={styles.content}>
        <div className={styles.formSection}>
          <form onSubmit={handleSubmit}>
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
              <Button type="submit" icon={FaSave}>
                Update Puzzle
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
