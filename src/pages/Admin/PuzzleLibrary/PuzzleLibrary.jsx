import { useState, useEffect } from 'react';
import { FaBook, FaPlus, FaTrophy, FaSearch } from 'react-icons/fa';
import { PageHeader, Button } from '../../../components/Admin';
import { adminAPI } from '../../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import styles from './PuzzleLibrary.module.css';

function PuzzleLibrary() {
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    type: '', // 'normal' or 'kids'
    search: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});
  const [selectedPuzzles, setSelectedPuzzles] = useState([]);

  useEffect(() => {
    fetchPuzzles();
  }, [filters]);

  const fetchPuzzles = async () => {
    setLoading(true);
    try {
      // filters now include 'type' directly
      const response = await adminAPI.getPuzzlesFiltered(filters);
      setPuzzles(response.puzzles || []);
      setPagination(response.pagination || {});
    } catch (error) {
      toast.error('Failed to fetch puzzles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPuzzle = (puzzleId) => {
    setSelectedPuzzles(prev => {
      if (prev.includes(puzzleId)) {
        return prev.filter(id => id !== puzzleId);
      } else {
        return [...prev, puzzleId];
      }
    });
  };

  const handleAddToCompetition = () => {
    if (selectedPuzzles.length === 0) {
      toast.error('Please select at least one puzzle');
      return;
    }

    // Store selected puzzles in localStorage for competition creation
    localStorage.setItem('selectedPuzzles', JSON.stringify(selectedPuzzles));
    toast.success(`${selectedPuzzles.length} puzzles selected for competition`);

    // Navigate to create competition page
    window.location.href = '/admin/competitions/create';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#2e7d32';
      case 'medium': return '#8b7332';
      case 'hard': return '#c62828';
      default: return '#666';
    }
  };

  return (
    <div className={styles.puzzleLibrary}>
      <Toaster position="top-center" />

      <PageHeader
        icon={FaBook}
        title="Puzzle Library"
        subtitle="Manage puzzles"
      />

      {/* Actions Bar */}
      <div className={styles.actionsBar}>
        <div className={styles.leftActions}>
          <Button
            icon={FaPlus}
            onClick={() => window.location.href = '/admin/puzzles/create'}
          >
            Create New Puzzle
          </Button>
        </div>

        <div className={styles.rightActions}>
          {selectedPuzzles.length > 0 && (
            <Button
              icon={FaTrophy}
              variant="success"
              onClick={handleAddToCompetition}
            >
              Add {selectedPuzzles.length} to Competition
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by title..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            className={styles.searchInput}
          />
        </div>

        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
          className={styles.filterSelect}
        >
          <option value="">All Categories</option>
          <option value="Tactics">Tactics</option>
          <option value="Endgame">Endgame</option>
          <option value="Opening">Opening</option>
          <option value="Middlegame">Middlegame</option>
          <option value="Strategy">Strategy</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
          className={styles.filterSelect}
        >
          <option value="">All Types</option>
          <option value="normal">Normal</option>
          <option value="kids">Kids</option>
        </select>
      </div>

      {/* Puzzles Table */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>Loading puzzles...</div>
        ) : puzzles.length === 0 ? (
          <div className={styles.empty}>
            <FaBook />
            <p>No puzzles found</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPuzzles(puzzles.map(p => p._id));
                      } else {
                        setSelectedPuzzles([]);
                      }
                    }}
                    checked={selectedPuzzles.length === puzzles.length && puzzles.length > 0}
                  />
                </th>
                <th>Preview</th>
                <th>Title</th>
                <th>Type</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {puzzles.map((puzzle) => (
                <tr key={puzzle._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedPuzzles.includes(puzzle._id)}
                      onChange={() => handleSelectPuzzle(puzzle._id)}
                    />
                  </td>
                  <td>
                    <div className={styles.preview}>
                      <div className={styles.miniBoard}>
                        {/* Simplified board preview */}
                        <span>
                          {puzzle.type === 'kids' ? (puzzle.kidsConfig?.piece?.toUpperCase() || '♚') : '♔'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.titleCell}>
                      <strong>{puzzle.title}</strong>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.sourceBadge} ${styles[puzzle.type || 'normal']}`}>
                      {puzzle.type === 'kids' ? 'Kids' : 'Normal'}
                    </span>
                  </td>
                  <td>
                    <span className={styles.categoryBadge}>
                      {puzzle.category || 'Tactics'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={styles.difficultyBadge}
                      style={{ backgroundColor: getDifficultyColor(puzzle.difficulty) }}
                    >
                      {puzzle.difficulty}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => window.location.href = `/admin/puzzles/edit/${puzzle._id}`}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.addBtn}`}
                        onClick={() => {
                          handleSelectPuzzle(puzzle._id);
                          toast.success('Puzzle selected for competition');
                        }}
                        title="Add to Competition"
                      >
                        <FaTrophy />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            className={styles.pageBtn}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            disabled={filters.page === pagination.pages}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            className={styles.pageBtn}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default PuzzleLibrary;
