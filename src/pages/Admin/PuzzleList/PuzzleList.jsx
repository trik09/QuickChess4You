import { useState } from 'react';
import { FaEye, FaEdit, FaTrash, FaChess, FaFilter, FaLayerGroup } from 'react-icons/fa';
import { PageHeader, SearchBar, FilterSelect, Button, DataTable, Badge, IconButton } from '../../../components/Admin';
import styles from './PuzzleList.module.css';

function PuzzleList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);

  const puzzles = [
    { id: 1, title: 'Checkmate in 3', difficulty: 'Hard', category: 'Tactics', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR', created: '2024-11-20' },
    { id: 2, title: 'Fork the Queen', difficulty: 'Medium', category: 'Tactics', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR', created: '2024-11-21' },
    { id: 3, title: 'Endgame Study', difficulty: 'Expert', category: 'Endgame', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR', created: '2024-11-22' },
    { id: 4, title: 'Pin and Win', difficulty: 'Easy', category: 'Tactics', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR', created: '2024-11-23' },
    { id: 5, title: 'Rook Endgame', difficulty: 'Hard', category: 'Endgame', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR', created: '2024-11-24' },
  ];

  const handlePreview = (puzzle) => {
    setSelectedPuzzle(puzzle);
    setShowPreview(true);
  };

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDelete = (puzzle) => {
    setDeleteConfirm(puzzle);
  };

  const confirmDelete = () => {
    console.log('Deleting puzzle:', deleteConfirm.id);
    // Simulate delete - in real app, call API here
    alert(`Puzzle "${deleteConfirm.title}" deleted successfully!`);
    setDeleteConfirm(null);
  };

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'tactics', label: 'Tactics' },
    { value: 'endgame', label: 'Endgame' },
    { value: 'opening', label: 'Opening' },
    { value: 'middlegame', label: 'Middlegame' },
  ];

  const difficultyOptions = [
    { value: 'all', label: 'All Difficulties' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'expert', label: 'Expert' },
  ];

  const columns = [
    { key: 'id', label: 'ID', width: '80px', render: (id) => `#${id}` },
    { key: 'title', label: 'Title' },
    { 
      key: 'difficulty', 
      label: 'Difficulty',
      render: (difficulty) => {
        const variantMap = {
          Easy: 'success',
          Medium: 'warning',
          Hard: 'danger',
          Expert: 'info'
        };
        return <Badge variant={variantMap[difficulty]}>{difficulty}</Badge>;
      }
    },
    { key: 'category', label: 'Category' },
    { key: 'created', label: 'Created At' },
  ];

  return (
    <div className={styles.puzzleList}>
      <PageHeader
        icon={FaChess}
        title="Puzzle Management"
        subtitle="Manage all chess puzzles"
        action={
          <Button to="/admin/puzzles/create" icon={FaChess}>
            Create Puzzle
          </Button>
        }
      />

      <div className={styles.filters}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search puzzles by title..."
        />
        <FilterSelect
          value={filterCategory}
          onChange={setFilterCategory}
          options={categoryOptions}
          icon={FaLayerGroup}
          label="Category"
        />
        <FilterSelect
          value={filterDifficulty}
          onChange={setFilterDifficulty}
          options={difficultyOptions}
          icon={FaFilter}
          label="Difficulty"
        />
      </div>

      <DataTable
        columns={columns}
        data={puzzles}
        actions={(puzzle) => (
          <>
            <IconButton
              icon={FaEye}
              onClick={() => handlePreview(puzzle)}
              title="Preview"
              variant="primary"
            />
            <IconButton
              icon={FaEdit}
              to={`/admin/puzzles/edit/${puzzle.id}`}
              title="Edit"
              variant="primary"
            />
            <IconButton
              icon={FaTrash}
              onClick={() => handleDelete(puzzle)}
              title="Delete"
              variant="danger"
            />
          </>
        )}
        emptyMessage="No puzzles found"
      />

      {showPreview && selectedPuzzle && (
        <div className={styles.modal} onClick={() => setShowPreview(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{selectedPuzzle.title}</h3>
              <button onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.chessboardPreview}>
                <p>Chessboard Preview (FEN: {selectedPuzzle.fen})</p>
                <div className={styles.boardPlaceholder}><FaChess /> Board Preview</div>
              </div>
              <div className={styles.puzzleDetails}>
                <p><strong>Difficulty:</strong> {selectedPuzzle.difficulty}</p>
                <p><strong>Category:</strong> {selectedPuzzle.category}</p>
                <p><strong>Created:</strong> {selectedPuzzle.created}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className={styles.modal} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmHeader}>
              <FaTrash className={styles.dangerIcon} />
              <h3>Delete Puzzle</h3>
            </div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>?</p>
              <p className={styles.warningText}>This action cannot be undone.</p>
            </div>
            <div className={styles.confirmActions}>
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="danger" icon={FaTrash} onClick={confirmDelete}>
                Delete Puzzle
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PuzzleList;
