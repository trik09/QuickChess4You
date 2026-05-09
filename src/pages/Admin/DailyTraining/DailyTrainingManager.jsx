import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, DataTable, Badge, IconButton } from '../../../components/Admin';
import { FaEye, FaTrash, FaChess, FaPlus, FaCalendarCheck, FaChartLine, FaTrophy } from 'react-icons/fa';
import { adminAPI } from '../../../services/api';
import ChessBoard from '../../../components/ChessBoard/ChessBoard';
import styles from './DailyTrainingManager.module.css';

function DailyTrainingManager() {
  const navigate = useNavigate();
  const [puzzles, setPuzzles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [removeConfirm, setRemoveConfirm] = useState(null);

  const fetchDailyPuzzles = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch all puzzles with isDailyTraining = true
      const response = await adminAPI.getPuzzles({ isDailyTraining: true, limit: 100 });
      const raw = response.puzzles || [];
      setPuzzles(raw);
    } catch (err) {
      console.error('Failed to load daily puzzles:', err);
      setError(err.message || 'Unable to load daily puzzles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyPuzzles();
  }, [fetchDailyPuzzles]);

  const handlePreview = (puzzle) => {
    setSelectedPuzzle(puzzle);
    setShowPreview(true);
  };

  const handleRemove = (puzzle) => {
    setRemoveConfirm(puzzle);
  };

  const confirmRemove = async () => {
    if (!removeConfirm?._id) return;
    try {
      await adminAPI.toggleDailyTraining(removeConfirm._id, false);
      setPuzzles(prev => prev.filter(p => p._id !== removeConfirm._id));
    } catch (err) {
      alert(err.message || 'Failed to remove from daily training');
    } finally {
      setRemoveConfirm(null);
    }
  };

  const columns = [
    { key: 'title', label: 'Title' },
    {
      key: 'difficulty', label: 'Difficulty',
      render: (difficulty) => {
        const n = (difficulty || '').toString();
        const label = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
        const variantMap = { easy: 'success', medium: 'warning', hard: 'danger' };
        return <Badge variant={variantMap[n.toLowerCase()] || 'secondary'}>{label || 'Unknown'}</Badge>;
      },
    },
    { key: 'category', label: 'Category' },
    { key: 'level', label: 'Level', render: (lvl) => lvl ? `Lvl ${lvl}` : '—' },
    { key: 'rating', label: 'Rating', render: (r) => r || '—' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.titleWithIcon}>
            <FaCalendarCheck className={styles.headerIcon} />
            <h2>Daily Training Management</h2>
          </div>
          <p className={styles.subtitle}>Currently showing {puzzles.length} active puzzles in the daily rotation</p>
        </div>

        <div className={styles.actions}>
          <Button
            onClick={() => navigate('/admin/puzzles')}
            icon={FaPlus}
          >
            Add New Puzzle
          </Button>
        </div>
      </div>

      {/* <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaChess /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Puzzles</span>
            <span className={styles.statValue}>{puzzles.length}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaChartLine /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Avg. Difficulty</span>
            <span className={styles.statValue}>
              {puzzles.length > 0 
                ? (puzzles.reduce((acc, p) => acc + (p.level || 1), 0) / puzzles.length).toFixed(1)
                : '0.0'}
            </span>
          </div>
        </div>
      </div> */}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrapper}>
        <DataTable
          columns={columns}
          data={puzzles}
          isLoading={isLoading}
          actions={(puzzle) => (
            <>
              <IconButton icon={FaEye} onClick={() => handlePreview(puzzle)} title="Preview" variant="primary" />
              <IconButton icon={FaTrash} onClick={() => handleRemove(puzzle)} title="Remove from Daily" variant="danger" />
            </>
          )}
          emptyMessage="No daily training puzzles selected yet. Go to the Puzzle List to add some!"
        />
      </div>

      {/* Preview Modal */}
      {showPreview && selectedPuzzle && (
        <div className={styles.modal} onClick={() => setShowPreview(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{selectedPuzzle.title}</h3>
              <button className={styles.closeBtn} onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.boardPreview}>
                <ChessBoard
                  fen={selectedPuzzle.fen}
                  interactive={false}
                  puzzleType={selectedPuzzle.type}
                  captureConfig={selectedPuzzle.captureConfig}
                />
              </div>
              <div className={styles.details}>
                <div className={styles.detailItem}>
                  <strong>Category:</strong> <span>{selectedPuzzle.category}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Difficulty:</strong> <span>{selectedPuzzle.difficulty}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Rating:</strong> <span>{selectedPuzzle.rating}</span>
                </div>
                <p className={styles.description}>{selectedPuzzle.description || "No description provided."}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation */}
      {removeConfirm && (
        <div className={styles.modal} onClick={() => setRemoveConfirm(null)}>
          <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmHeader}>
              <FaTrash className={styles.dangerIcon} />
              <h3>Remove from Daily Training?</h3>
            </div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to remove <strong>"{removeConfirm.title}"</strong> from the daily training rotation?</p>
            </div>
            <div className={styles.confirmActions}>
              <Button variant="secondary" onClick={() => setRemoveConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmRemove}>Remove</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyTrainingManager;
