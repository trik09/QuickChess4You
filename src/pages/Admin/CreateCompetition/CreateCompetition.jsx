import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTrophy,
  FaClock,
  FaUsers,
  FaCalendar,
  FaChess,
  FaPuzzlePiece,
  FaTimes,
  FaCheck,
  FaSearch,
  FaTrash,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import styles from "./CreateCompetition.module.css";
import { adminAPI, competitionAPI } from "../../../services/api";

function CreateCompetition() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    duration: "",
    maxPlayers: "",
    description: "",
  });

  // Puzzle selection state
  const [showPuzzleModal, setShowPuzzleModal] = useState(false);
  const [puzzles, setPuzzles] = useState([]);
  const [selectedPuzzles, setSelectedPuzzles] = useState([]);
  const [loadingPuzzles, setLoadingPuzzles] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch puzzles when modal opens
  useEffect(() => {
    if (showPuzzleModal) {
      fetchPuzzles();
    }
  }, [showPuzzleModal]);

  const fetchPuzzles = async () => {
    setLoadingPuzzles(true);
    try {
      const data = await adminAPI.getPuzzles();
      if (Array.isArray(data)) {
        setPuzzles(data);
      }
    } catch (error) {
      console.error("Failed to fetch puzzles:", error);
      toast.error("Failed to load puzzles");
    } finally {
      setLoadingPuzzles(false);
    }
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

  const handleRemovePuzzle = (puzzleId) => {
    setSelectedPuzzles((prev) => prev.filter((p) => p._id !== puzzleId));
  };

  const handleSelectAll = () => {
    const filteredPuzzlesList = filteredPuzzles;
    const allFilteredIds = filteredPuzzlesList.map((p) => p._id);
    const allSelected = allFilteredIds.every((id) =>
      selectedPuzzles.some((p) => p._id === id)
    );

    if (allSelected) {
      // Deselect all filtered puzzles
      setSelectedPuzzles((prev) =>
        prev.filter((p) => !allFilteredIds.includes(p._id))
      );
    } else {
      // Add all filtered puzzles that aren't already selected
      const newPuzzles = filteredPuzzlesList.filter(
        (puzzle) => !selectedPuzzles.some((p) => p._id === puzzle._id)
      );
      setSelectedPuzzles((prev) => [...prev, ...newPuzzles]);
    }
  };

  const filteredPuzzles = puzzles.filter(
    (puzzle) =>
      puzzle.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      puzzle.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      puzzle.difficulty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a competition name");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare competition data with selected puzzle IDs
      const competitionData = {
        name: formData.name,
        description: formData.description,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: parseInt(formData.duration) || 2,
        maxParticipants: parseInt(formData.maxPlayers) || 100,
        puzzles: selectedPuzzles.map((p) => p._id),
      };

      await competitionAPI.createCompetition(competitionData);
      console.log(competitionData);
      toast.success("Competition created successfully!");

      setTimeout(() => {
        navigate("/admin/competitions");
      }, 1500);
    } catch (error) {
      console.error("Failed to create competition:", error);
      toast.error(error.message || "Failed to create competition");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.createCompetition}>
      <Toaster position="top-right" />
      <div className={styles.header}>
        <h2>
          <FaTrophy /> Create New Competition
        </h2>
        <p>Set up a new chess competition</p>
      </div>

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>
              <FaTrophy /> Competition Name
            </label>
            <input
              type="text"
              placeholder="Enter competition name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>
                <FaCalendar /> Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <FaClock /> End Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <FaClock /> Duration (hours)
              </label>
              <input
                type="number"
                placeholder="2"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <FaUsers /> Maximum Players
              </label>
              <input
                type="number"
                placeholder="100"
                value={formData.maxPlayers}
                onChange={(e) =>
                  setFormData({ ...formData, maxPlayers: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>
              <FaChess /> Description
            </label>
            <textarea
              rows="4"
              placeholder="Enter competition description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Selected Puzzles Section */}
          <div className={styles.puzzlesSection}>
            <div className={styles.puzzlesSectionHeader}>
              <label>
                <FaPuzzlePiece /> Puzzles for this Competition
              </label>
              <button
                type="button"
                className={styles.addPuzzleBtn}
                onClick={() => setShowPuzzleModal(true)}
              >
                <FaPuzzlePiece /> Add Puzzles
              </button>
            </div>

            {selectedPuzzles.length === 0 ? (
              <div className={styles.noPuzzles}>
                <FaPuzzlePiece className={styles.noPuzzlesIcon} />
                <p>
                  No puzzles added yet. Click "Add Puzzles" to select puzzles
                  for this competition.
                </p>
              </div>
            ) : (
              <div className={styles.selectedPuzzlesList}>
                {selectedPuzzles.map((puzzle, index) => (
                  <div key={puzzle._id} className={styles.selectedPuzzleItem}>
                    <span className={styles.puzzleNumber}>{index + 1}</span>
                    <div className={styles.puzzleDetails}>
                      <span className={styles.puzzleName}>
                        {puzzle.title || "Untitled Puzzle"}
                      </span>
                      <div className={styles.puzzleTags}>
                        {puzzle.difficulty && (
                          <span
                            className={`${styles.difficultyTag} ${
                              styles[puzzle.difficulty]
                            }`}
                          >
                            {puzzle.difficulty}
                          </span>
                        )}
                        {puzzle.category && (
                          <span className={styles.categoryTag}>
                            {puzzle.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.removePuzzleBtn}
                      onClick={() => handleRemovePuzzle(puzzle._id)}
                      title="Remove puzzle"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate("/admin/competitions")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Competition"}
            </button>
          </div>
        </form>
      </div>

      {/* Puzzle Selection Modal */}
      {showPuzzleModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>
                <FaPuzzlePiece /> Select Puzzles for this Competition
              </h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowPuzzleModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Search and select all */}
              <div className={styles.searchBar}>
                <div className={styles.searchInputWrapper}>
                  <FaSearch className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search puzzles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className={styles.selectAllBtn}
                  onClick={handleSelectAll}
                >
                  {filteredPuzzles.every((p) =>
                    selectedPuzzles.some((sp) => sp._id === p._id)
                  )
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              {/* Puzzles list */}
              <div className={styles.puzzlesList}>
                {loadingPuzzles ? (
                  <div className={styles.loading}>Loading puzzles...</div>
                ) : filteredPuzzles.length === 0 ? (
                  <div className={styles.empty}>No puzzles found</div>
                ) : (
                  filteredPuzzles.map((puzzle) => (
                    <div
                      key={puzzle._id}
                      className={`${styles.puzzleItem} ${
                        selectedPuzzles.some((p) => p._id === puzzle._id)
                          ? styles.selected
                          : ""
                      }`}
                      onClick={() => handlePuzzleToggle(puzzle)}
                    >
                      <div className={styles.puzzleCheckbox}>
                        {selectedPuzzles.some((p) => p._id === puzzle._id) && (
                          <FaCheck />
                        )}
                      </div>
                      <div className={styles.puzzleInfo}>
                        <span className={styles.puzzleTitle}>
                          {puzzle.title || "Untitled Puzzle"}
                        </span>
                        <span className={styles.puzzleMeta}>
                          {puzzle.difficulty && (
                            <span
                              className={`${styles.difficulty} ${
                                styles[puzzle.difficulty]
                              }`}
                            >
                              {puzzle.difficulty}
                            </span>
                          )}
                          {puzzle.category && (
                            <span className={styles.category}>
                              {puzzle.category}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Selected count */}
              <div className={styles.selectedCount}>
                {selectedPuzzles.length} puzzle(s) selected for this competition
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelModalBtn}
                onClick={() => setShowPuzzleModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={() => setShowPuzzleModal(false)}
              >
                <FaCheck /> Confirm Selection ({selectedPuzzles.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateCompetition;
