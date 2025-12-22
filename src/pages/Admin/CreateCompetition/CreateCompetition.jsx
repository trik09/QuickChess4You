import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTrophy,
  FaClock,
  FaUsers,
  FaCalendar,
  FaChess,
  FaSearch,
  FaFilter,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaSortAmountDown,
  FaLock
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import styles from "./CreateCompetition.module.css";
import ChessBoard from "../../../components/ChessBoard/ChessBoard";
import { competitionAPI } from "../../../services/api";

function CreateCompetition() {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    duration: "60",
    maxParticipants: "",
    description: "",
  });

  // Puzzle State
  const [puzzles, setPuzzles] = useState([]);
  const [selectedPuzzles, setSelectedPuzzles] = useState([]);
  const [loadingPuzzles, setLoadingPuzzles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPuzzle, setPreviewPuzzle] = useState(null);

  // View State (Toggle between All Library and Just Selected)
  const [viewMode, setViewMode] = useState("library"); // 'library' or 'selected'

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    difficulty: "all",
    type: "all",
  });

  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    limit: 20, // Reduced limit for table view to fit screen better
    totalRecords: 0,
  });

  // Options for Dropdowns
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    difficulties: [],
    types: [],
  });

  // Fetch puzzles on load and filter change
  useEffect(() => {
    if (viewMode === 'library') {
      fetchPuzzles();
    }
  }, [filters, pagination.current, viewMode]);

  const fetchPuzzles = async () => {
    setLoadingPuzzles(true);
    try {
      const params = {
        ...filters,
        page: pagination.current,
        limit: pagination.limit,
      };

      const response = await competitionAPI.getPuzzlesForCompetition(params);

      if (response.success) {
        setPuzzles(response.data);
        setPagination((prev) => ({
          ...prev,
          ...response.pagination,
        }));

        if (response.filters) {
          setFilterOptions(response.filters);
        }
      }
    } catch (error) {
      console.error("Failed to fetch puzzles:", error);
      toast.error("Failed to load puzzles");
    } finally {
      setLoadingPuzzles(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handlePuzzleToggle = (puzzle) => {
    setSelectedPuzzles((prev) => {
      const isSelected = prev.some((p) => p._id === puzzle._id);
      if (isSelected) {
        return prev.filter((p) => p._id !== puzzle._id);
      } else {
        return [...prev, puzzle];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) return toast.error("Enter competition name");
    if (!formData.startTime) return toast.error("Select start time");
    if (selectedPuzzles.length === 0) return toast.error("Select at least one puzzle");

    setIsSubmitting(true);
    try {
      const competitionData = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        duration: parseInt(formData.duration),
        maxParticipants: parseInt(formData.maxParticipants) || 0,
        puzzles: selectedPuzzles.map((p) => p._id),
      };

      await competitionAPI.createCompetition(competitionData);
      toast.success("Competition created!");
      setTimeout(() => navigate("/admin/competitions"), 1500);
    } catch (error) {
      toast.error(error.message || "Creation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Decide what data to show in table
  const tableData = viewMode === 'selected' ? selectedPuzzles : puzzles;

  return (
    <div className={styles.container}>
      <Toaster position="top-center" />

      {/* --- Top Header --- */}
      <div className={styles.header}>
        <div>
          <h1>Create Competition</h1>
          <p>Configure details and select puzzles</p>
        </div>
        <button className={styles.cancelBtn} onClick={() => navigate("/admin/competitions")}>
          <FaTimesCircle /> Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.mainLayout}>

        {/* --- Section 1: Competition Details (Compact Grid) --- */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FaTrophy className={styles.iconGold} />
            <h3>Basic Details</h3>
          </div>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>Competition Name</label>
              <input
                type="text"
                placeholder="e.g. Winter Blitz 2024"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Start Date & Time</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Duration (mins)</label>
              <div className={styles.inputIconWrapper}>
                <FaClock className={styles.inputIcon} />
                <input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Max Players (Optional)</label>
              <div className={styles.inputIconWrapper}>
                <FaUsers className={styles.inputIcon} />
                <input
                  type="number"
                  placeholder="Unlimited"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Access Code (Optional)</label>
              <div className={styles.inputIconWrapper}>
                <FaLock className={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="e.g. 1234 (Leave empty for public)"
                  value={formData.accessCode || ''}
                  onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                />
              </div>
            </div>

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label>Description</label>
              <textarea
                rows="2"
                placeholder="Rules and details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* --- Section 2: Puzzle Management (Table View) --- */}
        <div className={`${styles.card} ${styles.tableCard}`}>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <div className={styles.searchBox}>
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search puzzles..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>

              <div className={styles.filters}>
                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange("difficulty", e.target.value)}
                >
                  <option value="all">Difficulty: All</option>
                  {filterOptions.difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                >
                  <option value="all">Category: All</option>
                  {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.toolbarRight}>
              {/* Toggle between Library and Selected */}
              <div className={styles.viewToggle}>
                <button
                  type="button"
                  className={viewMode === 'library' ? styles.activeView : ''}
                  onClick={() => setViewMode('library')}
                >
                  Library
                </button>
                <button
                  type="button"
                  className={viewMode === 'selected' ? styles.activeView : ''}
                  onClick={() => setViewMode('selected')}
                >
                  Selected ({selectedPuzzles.length})
                </button>
              </div>

              <button
                type="button"
                className={styles.createBtn}
                onClick={() => navigate("/admin/puzzles/create?returnTo=/admin/competitions/create")}
              >
                <FaPlus /> New Puzzle
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th width="50">Select</th>
                  <th>Puzzle Title / ID</th>
                  <th>Category</th>
                  <th>Difficulty</th>
                  <th>Type</th>
                  <th width="80">Preview</th>
                </tr>
              </thead>
              <tbody>
                {loadingPuzzles ? (
                  <tr>
                    <td colSpan="6" className={styles.loadingCell}>
                      <div className={styles.spinner}></div> Loading library...
                    </td>
                  </tr>
                ) : tableData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.emptyCell}>
                      {viewMode === 'selected'
                        ? "No puzzles selected yet."
                        : "No puzzles found matching filters."}
                    </td>
                  </tr>
                ) : (
                  tableData.map((puzzle) => {
                    const isSelected = selectedPuzzles.some(p => p._id === puzzle._id);
                    return (
                      <tr
                        key={puzzle._id}
                        className={isSelected ? styles.selectedRow : ''}
                        onClick={() => handlePuzzleToggle(puzzle)}
                      >
                        <td className={styles.checkCell}>
                          <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                            {isSelected && <FaCheckCircle />}
                          </div>
                        </td>
                        <td>
                          <div className={styles.puzzleTitle}>
                            {puzzle.title || "Untitled Puzzle"}
                          </div>
                          <div className={styles.puzzleId}>ID: {puzzle._id.slice(-6)}</div>
                        </td>
                        <td><span className={styles.tag}>{puzzle.category}</span></td>
                        <td>
                          <span className={`${styles.difficultyBadge} ${styles[puzzle.difficulty]}`}>
                            {puzzle.difficulty}
                          </span>
                        </td>
                        <td><span className={styles.typeText}>{puzzle.type}</span></td>
                        <td>
                          <button
                            type="button"
                            className={styles.previewIconBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewPuzzle(puzzle);
                            }}
                          >
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination (Only show if in library view) */}
          {viewMode === 'library' && !loadingPuzzles && (
            <div className={styles.pagination}>
              <span>Showing {tableData.length} of {pagination.totalRecords}</span>
              <div className={styles.pageControls}>
                <button
                  type="button"
                  disabled={pagination.current === 1}
                  onClick={() => setPagination(p => ({ ...p, current: p.current - 1 }))}
                >
                  <FaChevronLeft />
                </button>
                <span className={styles.pageNumber}>{pagination.current}</span>
                <button
                  type="button"
                  disabled={pagination.current >= Math.ceil(pagination.totalRecords / pagination.limit)}
                  onClick={() => setPagination(p => ({ ...p, current: p.current + 1 }))}
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- Footer Sticky Action Bar --- */}
        <div className={styles.stickyFooter}>
          <div className={styles.footerInfo}>
            <span className={styles.selectionCount}>
              {selectedPuzzles.length} Puzzles Selected
            </span>
            <small>Make sure to cover different difficulty levels</small>
          </div>
          <div className={styles.footerActions}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || selectedPuzzles.length === 0}
            >
              {isSubmitting ? "Creating..." : "Create Competition"}
            </button>
          </div>
        </div>

      </form>

      {/* Preview Modal */}
      {previewPuzzle && (
        <div className={styles.modalOverlay} onClick={() => setPreviewPuzzle(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4>{previewPuzzle.title}</h4>
              <button onClick={() => setPreviewPuzzle(null)}><FaTimesCircle /></button>
            </div>
            <div className={styles.boardContainer}>
              {/* Use pointer-events none to make board read-only */}
              <div style={{ pointerEvents: 'none' }}>
                <ChessBoard
                  fen={previewPuzzle.fen}
                  puzzleType={previewPuzzle.type}
                  interactive={false}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <span className={`${styles.difficultyBadge} ${styles[previewPuzzle.difficulty]}`}>
                {previewPuzzle.difficulty}
              </span>
              <button
                className={styles.modalSelectBtn}
                onClick={() => {
                  handlePuzzleToggle(previewPuzzle);
                  setPreviewPuzzle(null);
                }}
              >
                {selectedPuzzles.some(p => p._id === previewPuzzle._id) ? "Remove" : "Select Puzzle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateCompetition;