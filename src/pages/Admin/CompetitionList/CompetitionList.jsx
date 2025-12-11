import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTrophy,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaUsers,
  FaClock,
  FaPuzzlePiece,
  FaTimes,
  FaChess,
  FaSearch,
  FaFilter,
  FaLayerGroup,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import {
  PageHeader,
  Button,
  DataTable,
  Badge,
  IconButton,
  SearchBar,
  FilterSelect,
} from "../../../components/Admin";
import { competitionAPI, adminAPI } from "../../../services/api";
import styles from "./CompetitionList.module.css";

function CompetitionList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Puzzles Modal State
  const [showPuzzlesModal, setShowPuzzlesModal] = useState(false);
  const [selectedCompetitionPuzzles, setSelectedCompetitionPuzzles] = useState(
    []
  );
  const [selectedCompetitionName, setSelectedCompetitionName] = useState("");
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);
  const [loadingPuzzles, setLoadingPuzzles] = useState(false);

  // Puzzle filters
  const [puzzleSearchTerm, setPuzzleSearchTerm] = useState("");
  const [puzzleFilterCategory, setPuzzleFilterCategory] = useState("all");
  const [puzzleFilterDifficulty, setPuzzleFilterDifficulty] = useState("all");

  // Preview and Delete modals
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchCompetitions();
  }, []);
  const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return "N/A";

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = (minutes / 60).toFixed(1); // 1 decimal, like 1.5 hrs
  return `${hours} hrs`;
};


  const fetchCompetitions = async () => {
    setLoading(true);
    try {
      const response = await competitionAPI.getAll();
      if (response.success && Array.isArray(response.data)) {
        const mappedCompetitions = response.data.map((comp) => ({
          id: comp._id,
          _id: comp._id,
          name: comp.title || comp.name,
          status: getCompetitionStatus(comp),
          startTime: comp.startDate
            ? new Date(comp.startDate).toLocaleString()
            : "N/A",
duration: comp.duration ? formatDuration(comp.duration) : "N/A",
          players: comp.participants?.length || 0,
          maxPlayers: comp.maxPlayers || 100,
          puzzles: comp.puzzles || [],
        }));
        setCompetitions(mappedCompetitions);
      }
    } catch (error) {
      console.error("Failed to fetch competitions:", error);
      setCompetitions([
        {
          id: 1,
          name: "Spring Championship",
          status: "Live",
          startTime: "2024-11-27 10:00",
          duration: "2 hours",
          players: 128,
          maxPlayers: 150,
          puzzles: [],
        },
        {
          id: 2,
          name: "Rapid Blitz",
          status: "Upcoming",
          startTime: "2024-11-28 14:00",
          duration: "1 hour",
          players: 64,
          maxPlayers: 100,
          puzzles: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getCompetitionStatus = (competition) => {
    const now = new Date();
    const startDate = new Date(competition.startDate);
    const endDate = new Date(competition.endDate);

    if (now < startDate) return "Upcoming";
    if (now > endDate) return "Completed";
    return "Live";
  };

  const handleViewPuzzles = async (competition) => {
    setSelectedCompetitionName(competition.name);
    setSelectedCompetitionId(competition._id || competition.id);
    setShowPuzzlesModal(true);
    setLoadingPuzzles(true);
    setPuzzleSearchTerm("");
    setPuzzleFilterCategory("all");
    setPuzzleFilterDifficulty("all");

    try {
      const response = await competitionAPI.getById(
        competition._id || competition.id
      );
      if (response.success && response.data) {
        let puzzles = response.data.puzzles || [];
        puzzles = puzzles
          .filter((p) => p && typeof p === "object")
          .map((puzzle, index) => ({
            ...puzzle,
            id: index + 1,
            title: puzzle.title || `Puzzle #${index + 1}`,
            difficulty: puzzle.difficulty || "Unknown",
            category: puzzle.category || "General",
            createdAt: puzzle.createdAt || "",
          }))
          .sort((a, b) =>
            a.title.toLowerCase().localeCompare(b.title.toLowerCase())
          );
        setSelectedCompetitionPuzzles(puzzles);
      } else {
        setSelectedCompetitionPuzzles([]);
      }
    } catch (error) {
      console.error("Failed to fetch competition puzzles:", error);
      toast.error("Failed to load puzzles");
      setSelectedCompetitionPuzzles([]);
    } finally {
      setLoadingPuzzles(false);
    }
  };

  // Puzzle actions
  const handlePreview = (puzzle) => {
    setSelectedPuzzle(puzzle);
    setShowPreview(true);
  };

  const handleDelete = (puzzle) => {
    setDeleteConfirm(puzzle);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm?._id) return;
    try {
      await adminAPI.deletePuzzle(deleteConfirm._id);
      setSelectedCompetitionPuzzles((prev) =>
        prev.filter((p) => p._id !== deleteConfirm._id)
      );
      toast.success(`Puzzle "${deleteConfirm.title}" deleted successfully!`);
    } catch (err) {
      console.error("Failed to delete puzzle:", err);
      toast.error(err.message || "Failed to delete puzzle");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Filter puzzles
  const filteredPuzzles = selectedCompetitionPuzzles.filter((puzzle) => {
    const matchesSearch = puzzle.title
      .toLowerCase()
      .includes(puzzleSearchTerm.toLowerCase());
    const matchesCategory =
      puzzleFilterCategory === "all" ||
      (puzzle.category || "").toLowerCase() ===
        puzzleFilterCategory.toLowerCase();
    const matchesDifficulty =
      puzzleFilterDifficulty === "all" ||
      (puzzle.difficulty || "").toLowerCase() ===
        puzzleFilterDifficulty.toLowerCase();

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "tactics", label: "Tactics" },
    { value: "endgame", label: "Endgame" },
    { value: "opening", label: "Opening" },
    { value: "middlegame", label: "Middlegame" },
  ];

  const difficultyOptions = [
    { value: "all", label: "All Difficulties" },
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
    { value: "expert", label: "Expert" },
  ];

  const puzzleColumns = [
    { key: "id", label: "ID", width: "60px", render: (id) => `#${id}` },
    { key: "title", label: "Title" },
    {
      key: "difficulty",
      label: "Difficulty",
      render: (difficulty) => {
        const normalized = (difficulty || "").toString();
        const label =
          normalized.charAt(0).toUpperCase() +
          normalized.slice(1).toLowerCase();
        const variantMap = {
          easy: "success",
          Easy: "success",
          medium: "warning",
          Medium: "warning",
          hard: "danger",
          Hard: "danger",
          expert: "info",
          Expert: "info",
        };
        const variant = variantMap[normalized] || "secondary";
        return <Badge variant={variant}>{label || "Unknown"}</Badge>;
      },
    },
    { key: "category", label: "Category" },
    {
      key: "createdAt",
      label: "Created At",
      render: (createdAt) =>
        createdAt ? new Date(createdAt).toLocaleString() : "—",
    },
  ];

  const filteredCompetitions =
    activeTab === "all"
      ? competitions
      : competitions.filter((c) => c.status.toLowerCase() === activeTab);

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "status",
      label: "Status",
      render: (status) => {
        const variantMap = {
          Live: "live",
          Upcoming: "warning",
          Completed: "info",
        };
        return <Badge variant={variantMap[status]}>{status}</Badge>;
      },
    },
    { key: "startTime", label: "Start Time" },
    {
      key: "duration",
      label: "Duration",
      render: (duration) => (
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <FaClock /> {duration}
        </span>
      ),
    },
    {
      key: "players",
      label: "Players",
      render: (players, row) => (
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <FaUsers /> {players}/{row.maxPlayers}
        </span>
      ),
    },
  ];

  return (
    <div className={styles.competitionList}>
      <Toaster position="top-right" />
      <PageHeader
        icon={FaTrophy}
        title="Competition Management"
        subtitle="Manage all competitions and tournaments"
        action={
          <Button to="/admin/competitions/create" icon={FaPlus}>
            Create Competition
          </Button>
        }
      />

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "all" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "upcoming" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "live" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("live")}
        >
          Live
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "completed" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading competitions...</div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCompetitions}
          actions={(comp) => (
            <>
              <IconButton
                icon={FaPuzzlePiece}
                onClick={() => handleViewPuzzles(comp)}
                title="View Puzzles"
                variant="success"
              />
              <IconButton
                icon={FaEye}
                to={`/admin/competitions/${comp.id}`}
                title="View Details"
                variant="primary"
              />
              <IconButton
                icon={FaEdit}
                to={`/admin/competitions/edit/${comp.id}`}
                title="Edit"
                variant="primary"
              />
              <IconButton
                icon={FaTrash}
                onClick={() => confirm("Delete this competition?")}
                title="Delete"
                variant="danger"
              />
            </>
          )}
          emptyMessage="No competitions found"
        />
      )}

      {/* View Puzzles Modal - Full Featured like PuzzleList */}
      {showPuzzlesModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.puzzleModal}>
            <div className={styles.modalHeader}>
              <h3>
                <FaPuzzlePiece /> Puzzles in "{selectedCompetitionName}"
              </h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowPuzzlesModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className={styles.modalBody}>
              {loadingPuzzles ? (
                <div className={styles.loadingState}>Loading puzzles...</div>
              ) : selectedCompetitionPuzzles.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaChess className={styles.emptyIcon} />
                  <p>No puzzles assigned to this competition yet.</p>
                  {/* <p className={styles.emptyHint}>
                    Go to "Create Competition" page to add puzzles.
                  </p> */}
                </div>
              ) : (
                <>
                  {/* Filters */}
                  <div className={styles.puzzleFilters}>
                    <SearchBar
                      value={puzzleSearchTerm}
                      onChange={setPuzzleSearchTerm}
                      placeholder="Search puzzles by title..."
                    />
                    <FilterSelect
                      value={puzzleFilterCategory}
                      onChange={setPuzzleFilterCategory}
                      options={categoryOptions}
                      icon={FaLayerGroup}
                      label="Category"
                    />
                    <FilterSelect
                      value={puzzleFilterDifficulty}
                      onChange={setPuzzleFilterDifficulty}
                      options={difficultyOptions}
                      icon={FaFilter}
                      label="Difficulty"
                    />
                  </div>

                  {/* Puzzle count */}
                  <div className={styles.puzzleCount}>
                    Showing {filteredPuzzles.length} of{" "}
                    {selectedCompetitionPuzzles.length} puzzles
                  </div>

                  {/* Puzzle DataTable */}
                  <DataTable
                    columns={puzzleColumns}
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
                    emptyMessage="No puzzles match your filters"
                  />
                </>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.closeModalBtn}
                onClick={() => setShowPuzzlesModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Puzzle Preview Modal */}
      {showPreview && selectedPuzzle && (
        <div
          className={styles.previewOverlay}
          onClick={() => setShowPreview(false)}
        >
          <div
            className={styles.previewModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.previewHeader}>
              <h3>{selectedPuzzle.title}</h3>
              <button onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <div className={styles.previewBody}>
              <div className={styles.chessboardPreview}>
                <p>Chessboard Preview (FEN: {selectedPuzzle.fen})</p>
                <div className={styles.boardPlaceholder}>
                  <FaChess /> Board Preview
                </div>
              </div>
              <div className={styles.puzzleDetails}>
                <p>
                  <strong>Difficulty:</strong> {selectedPuzzle.difficulty}
                </p>
                <p>
                  <strong>Category:</strong> {selectedPuzzle.category}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {selectedPuzzle.createdAt
                    ? new Date(selectedPuzzle.createdAt).toLocaleString()
                    : "—"}
                </p>
                {selectedPuzzle.description && (
                  <p>
                    <strong>Description:</strong> {selectedPuzzle.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className={styles.previewOverlay}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className={styles.confirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.confirmHeader}>
              <FaTrash className={styles.dangerIcon} />
              <h3>Delete Puzzle</h3>
            </div>
            <div className={styles.confirmBody}>
              <p>
                Are you sure you want to delete{" "}
                <strong>"{deleteConfirm.title}"</strong>?
              </p>
              <p className={styles.warningText}>
                This action cannot be undone.
              </p>
            </div>
            <div className={styles.confirmActions}>
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirm(null)}
              >
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

export default CompetitionList;
