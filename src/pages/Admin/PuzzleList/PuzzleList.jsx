import { useEffect, useState } from 'react';
import { FaEye, FaEdit, FaTrash, FaChess, FaFilter, FaLayerGroup } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, SearchBar, FilterSelect, Button, DataTable, Badge, IconButton } from '../../../components/Admin';
import { adminAPI } from '../../../services/api';
import styles from './PuzzleList.module.css';

function PuzzleList() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState(initialCategory);
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [puzzles, setPuzzles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const handlePreview = (puzzle) => {
    setSelectedPuzzle(puzzle);
    setShowPreview(true);
  };

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDelete = (puzzle) => {
    setDeleteConfirm(puzzle);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm?._id) return;
    try {
      await adminAPI.deletePuzzle(deleteConfirm._id);
      setPuzzles((prev) => prev.filter((p) => p._id !== deleteConfirm._id));
      alert(`Puzzle "${deleteConfirm.title}" deleted successfully!`);
    } catch (err) {
      console.error('Failed to delete puzzle:', err);
      alert(err.message || 'Failed to delete puzzle');
    } finally {
      setDeleteConfirm(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchPuzzles = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await adminAPI.getPuzzles();
        if (!Array.isArray(data)) {
          throw new Error('Unexpected response format from server');
        }

        if (!isMounted) return;

        const normalized = data.map((puzzle, index) => ({
          ...puzzle,
          // fallback values to keep table stable
          id: index + 1,
          title: puzzle.title || `Puzzle #${index + 1}`,
          difficulty: puzzle.difficulty || 'Unknown',
          category: puzzle.category || 'General',
          createdAt: puzzle.createdAt || puzzle.updatedAt || '',
        }));

        setPuzzles(normalized);
      } catch (err) {
        console.error('Failed to load puzzles:', err);
        if (isMounted) {
          setError(err.message || 'Unable to load puzzles');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPuzzles();

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Filter puzzles based on search term, category, and difficulty
  const filteredPuzzles = puzzles.filter((puzzle) => {
    // Search filter (by title)
    const matchesSearch = puzzle.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Category filter
    const matchesCategory =
      filterCategory === 'all' ||
      (puzzle.category || '').toLowerCase() === filterCategory.toLowerCase();

    // Difficulty filter
    const matchesDifficulty =
      filterDifficulty === 'all' ||
      (puzzle.difficulty || '').toLowerCase() === filterDifficulty.toLowerCase();

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const columns = [
    { key: 'id', label: 'ID', width: '80px', render: (id) => `#${id}` },
    { key: 'title', label: 'Title' },
    {
      key: 'difficulty',
      label: 'Difficulty',
      render: (difficulty) => {
        const normalized = (difficulty || '').toString();
        const label =
          normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
        const variantMap = {
          easy: 'success',
          Easy: 'success',
          medium: 'warning',
          Medium: 'warning',
          hard: 'danger',
          Hard: 'danger',
          expert: 'info',
          Expert: 'info',
        };
        const variant = variantMap[normalized] || 'secondary';
        return <Badge variant={variant}>{label || 'Unknown'}</Badge>;
      },
    },
    { key: 'category', label: 'Category' },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (createdAt) =>
        createdAt ? new Date(createdAt).toLocaleString() : '—',
    },
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

      {isLoading && <p>Loading puzzles...</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      <DataTable
        columns={columns}
        data={filteredPuzzles}
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
              to={`/admin/puzzles/edit/${puzzle._id}`}
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
