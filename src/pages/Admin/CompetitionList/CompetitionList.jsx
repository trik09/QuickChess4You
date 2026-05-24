import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  FaLayerGroup,
  FaLock,
  FaCalendarAlt,
  FaHourglassHalf,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaMagic,
  FaCalendarPlus
} from "react-icons/fa";
import { LuFilter } from "react-icons/lu";
import toast, { Toaster } from "react-hot-toast";
import {
  Button,
  DataTable,
  Badge,
  IconButton,
  SearchBar,
  FilterSelect,
} from "../../../components/Admin";
import CompetitionLeaderboard from "../../../components/CompetitionLeaderboard/CompetitionLeaderboard";
import { competitionAPI } from "../../../services/api";
import { liveCompetitionAPI } from "../../../services/liveCompetitionAPI";
import styles from "./CompetitionList.module.css";

// Constants for Auto Variation
const VARIATIONS = {
  1: ["Mate in One", "Fork", "Mate in Two", "Skewer", "Pin"],
  2: ["Mate in One", "Pawn Endgame", "Discover Attack", "Overloading", "Rook Endgame"],
  3: ["Mate in One", "Mate in Two", "Fork", "Pin", "Pawn Endgame", "Skewer", "Overloading", "Opening Traps", "Discover Attack"]
};

// Puzzle distribution per sequence level
const DISTRIBUTION = {
  1: 3,
  2: 3,
  3: 2,
  4: 2
};

const genId = () => Math.random().toString(36).slice(2, 9);

function CompetitionList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || "all");
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Puzzles Modal State
  const [showPuzzlesModal, setShowPuzzlesModal] = useState(false);
  const [selectedCompetitionPuzzles, setSelectedCompetitionPuzzles] = useState(
    []
  );
  const [selectedCompetitionName, setSelectedCompetitionName] = useState("");
  const [loadingPuzzles, setLoadingPuzzles] = useState(false);

  // Puzzle filters
  const [puzzleSearchTerm, setPuzzleSearchTerm] = useState("");
  const [puzzleFilterCategory, setPuzzleFilterCategory] = useState("all");
  const [puzzleFilterDifficulty, setPuzzleFilterDifficulty] = useState("all");

  // Preview and Delete modals
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // View and Edit Competition Modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false); // New state for Result Modal
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const itemsPerPage = 10;

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
  const [filterDate, setFilterDate] = useState(searchParams.get('date') || "");
  const [filterTime, setFilterTime] = useState(searchParams.get('time') || "");

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "live", label: "Live" },
    { value: "upcoming", label: "Upcoming" },
    { value: "ENDED", label: "Ended" },
  ];

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "N/A";

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = (minutes / 60).toFixed(1); // 1 decimal, like 1.5 hrs
    return `${hours} hrs`;
  };

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    try {
      // console.log("🔍 Fetching competitions...");
      const response = await competitionAPI.getAll({ limit: 1000 });
      // console.log("📦 API Response:", response);
      // console.log("✅ Response success:", response.success);
      // console.log("📊 Response data:", response.data);
      // console.log("📝 Is Array?", Array.isArray(response.data));

      if (response.success && Array.isArray(response.data)) {
        // console.log("✔️ Mapping competitions, count:", response.data.length);
        const mappedCompetitions = response.data.map((comp) => ({
          id: comp._id,
          _id: comp._id,
          name: comp.title || comp.name,
          status: getCompetitionStatus(comp),
          // Store raw values so the periodic status ticker can re-evaluate
          _startTimeRaw: comp.startTime,
          _durationMinutes: comp.duration,
          _endTime: comp.endTime,
          startTime: comp.startTime
            ? new Date(comp.startTime).toLocaleString([], {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "N/A",
          startTimeFull: comp.startTime
            ? new Date(comp.startTime).toLocaleString()
            : "N/A",
          startDate: comp.startTime
            ? new Date(comp.startTime).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
            : "N/A",
          startTimeOnly: comp.startTime
            ? new Date(comp.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : "N/A",
          startTimeRaw: comp.startTime ? new Date(comp.startTime) : new Date(0),
          duration: comp.duration ? formatDuration(comp.duration) : "N/A",
          maxPlayers: comp.maxPlayers || 100,
          puzzles: comp.puzzles || [],
          accessCode: comp.accessCode,
          players: comp.participantCount || 0,
        })).sort((a, b) => b.startTimeRaw - a.startTimeRaw);
        setCompetitions(mappedCompetitions);
      } else {
        // console.warn("⚠️ Response structure unexpected or not successful");
        // console.warn("Response:", response);
      }
    } catch (error) {
      console.error("❌ Failed to fetch competitions:", error);
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
  }, []);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  // Re-evaluate competition statuses every 30 seconds so the UI
  // automatically transitions Upcoming → Live → ENDED without a manual refresh.
  useEffect(() => {
    const ticker = setInterval(() => {
      setCompetitions(prev =>
        prev.map(comp => ({
          ...comp,
          status: getCompetitionStatus({
            startTime: comp._startTimeRaw,
            duration: comp._durationMinutes,
            endTime: comp._endTime
          })
        }))
      );
    }, 10_000); // every 10 seconds

    return () => clearInterval(ticker);
  }, []);

  // Sync filters to URL search params
  useEffect(() => {
    const params = {};
    if (activeTab !== 'all') params.status = activeTab;
    if (searchTerm) params.search = searchTerm;
    if (filterDate) params.date = filterDate;
    if (filterTime) params.time = filterTime;
    if (currentPage > 1) params.page = currentPage;
    setSearchParams(params, { replace: true });
  }, [activeTab, searchTerm, filterDate, filterTime, currentPage, setSearchParams]);

  const getCompetitionStatus = (competition) => {
    const now = new Date();
    const startDate = new Date(competition.startTime);

    // endTime may not exist — derive it from startTime + duration (in minutes)
    let endDate;
    if (competition.endTime) {
      endDate = new Date(competition.endTime);
    } else if (competition.duration) {
      endDate = new Date(startDate.getTime() + competition.duration * 60 * 1000);
    } else {
      // No duration info — treat as 1 hour default
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    }

    if (now < startDate) return "Upcoming";
    if (now > endDate) return "ENDED";
    return "Live";
  };

  const handleViewPuzzles = async (competition) => {
    setSelectedCompetitionName(competition.name);
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

  const handleView = (competition) => {
    setSelectedCompetition(competition);
    setShowViewModal(true);
  };

  const handleDelete = (competition) => {
    setDeleteConfirm(competition);
  };

  const handleShowResult = (competition) => {
    setSelectedCompetition(competition);
    setShowResultModal(true);
  };

  const handleStartLiveCompetition = async (competition) => {
    try {
      const result = await liveCompetitionAPI.startCompetition(competition._id);

      if (result.success) {
        toast.success(`${competition.name} started as live competition!`);
        // Refresh the competitions list
        fetchCompetitions();
      }
    } catch (error) {
      console.error('Failed to start live competition:', error);
      toast.error(error.message || 'Failed to start live competition');
    }
  };

  const handleCreate5DaySeries = async () => {
    const loadingToast = toast.loading("Creating 5-Day Series...");
    try {
      let createdCount = 0;
      for (let i = 1; i <= 5; i++) {
        const variationNum = ((i - 1) % 3) + 1; // 1, 2, 3, 1, 2
        const categories = VARIATIONS[variationNum];
        const newChapters = [];
        const usedIds = new Set();
        const selectedPuzzles = [];

        for (const category of categories) {
          const response = await competitionAPI.getPuzzlesForCompetition({ category, limit: 1000 });
          if (!response.success) continue;
          
          const categoryPuzzles = response.data || [];
          const chapterPuzzles = [];

          Object.entries(DISTRIBUTION).forEach(([levelStr, count]) => {
            const level = parseInt(levelStr);
            const availablePuzzles = categoryPuzzles.filter(
              p => p.level === level && !usedIds.has(p._id)
            );

            const shuffled = availablePuzzles.sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, count);

            selected.forEach(p => {
              chapterPuzzles.push(p._id);
              selectedPuzzles.push(p._id);
              usedIds.add(p._id);
            });
          });

          newChapters.push({
            name: category,
            puzzleIds: chapterPuzzles
          });
        }

        const startTime = new Date();
        startTime.setDate(startTime.getDate() + (i - 1)); // today, tomorrow, etc.
        startTime.setHours(19, 0, 0, 0); // Default to 19:00

        const compData = {
          name: `Auto Series - Day ${i} (Var ${variationNum})`,
          startTime: startTime.toISOString(),
          duration: 15,
          maxParticipants: 100,
          description: "Automated 5-day series competition.",
          puzzles: selectedPuzzles,
          chapters: newChapters
        };

        const createRes = await competitionAPI.createCompetition(compData);
        if (createRes.success) createdCount++;
      }
      
      if (createdCount > 0) {
        toast.success(`${createdCount} competitions created successfully!`, { id: loadingToast });
        fetchCompetitions();
      } else {
        toast.error("Failed to create competitions (No puzzles found)", { id: loadingToast });
      }
    } catch (error) {
      console.error("Series creation failed:", error);
      toast.error(error.message || "Series creation failed", { id: loadingToast });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm?._id) return;
    try {
      await competitionAPI.deleteCompetition(deleteConfirm._id);
      setCompetitions((prev) =>
        prev.filter((p) => p._id !== deleteConfirm._id)
      );
      toast.success(
        `Competition "${deleteConfirm.name}" deleted successfully!`
      );
    } catch (err) {
      console.error("Failed to delete competition:", err);
      toast.error(err.message || "Failed to delete competition");
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

  const filteredCompetitions = competitions.filter((c) => {
    // Tab Filter
    const matchesTab = activeTab === "all" || c.status.toLowerCase() === activeTab.toLowerCase();
    
    // Search Filter
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date & Time Filter
    let matchesDate = true;
    let matchesTime = true;
    
    if (filterDate || filterTime) {
      const compDate = new Date(c.startTimeRaw);
      
      if (filterDate) {
        const targetDate = new Date(filterDate);
        matchesDate = compDate.toDateString() === targetDate.toDateString();
      }
      
      if (filterTime) {
        const [hours, minutes] = filterTime.split(':').map(Number);
        matchesTime = compDate.getHours() === hours && compDate.getMinutes() === minutes;
      }
    }

    return matchesTab && matchesSearch && matchesDate && matchesTime;
  });

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "status",
      label: "Status",
      render: (status) => {
        const variantMap = {
          Live: "live",
          Upcoming: "warning",
          ENDED: "info",
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
      key: "accessCode",
      label: "Passcode",
      render: (code) => (
        code ? <Badge variant="secondary"><FaLock style={{ fontSize: '10px', marginRight: '4px' }} /> {code}</Badge> : <span style={{ color: '#ccc' }}>Public</span>
      ),
    },
    {
      key: "players",
      label: "Players",
      render: (players, row) => (
        <Button
          size="small"
          variant="secondary"
          icon={FaUsers}
          onClick={() =>
            navigate(`/admin/competitions/${row._id || row.id}/participants`)
          }
        >
          View ({players}/{row.maxPlayers})
        </Button>
      ),
    },
  ];

  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCompetitions = filteredCompetitions.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className={styles.competitionList}>
      <Toaster position="top-right" />
      <div className={styles.compactHeader}>
        <div className={styles.titleArea}>
          <div className={styles.titleWithIcon}>
            <FaTrophy className={styles.headerIcon} />
            <h2>Competition Management</h2>
          </div>
          <p className={styles.subtitle}>Manage all competitions and tournaments</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.tabsCompact}>
            <button
              className={`${styles.tab} ${activeTab === "all" ? styles.active : ""}`}
              onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
            >
              All
            </button>
            <button
              className={`${styles.tab} ${activeTab === "upcoming" ? styles.active : ""}`}
              onClick={() => { setActiveTab("upcoming"); setCurrentPage(1); }}
            >
              Upcoming
            </button>
            <button
              className={`${styles.tab} ${activeTab === "live" ? styles.active : ""}`}
              onClick={() => { setActiveTab("live"); setCurrentPage(1); }}
            >
              Live
            </button>
            <button
              className={`${styles.tab} ${activeTab === "ENDED" ? styles.active : ""}`}
              onClick={() => { setActiveTab("ENDED"); setCurrentPage(1); }}
            >
              ENDED
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              onClick={handleCreate5DaySeries}
              icon={FaCalendarPlus}
              variant="secondary"
              size="small"
            >
              Create 5-Day Series
            </Button>
            <Button
              onClick={() => navigate("/admin/competitions/create")}
              icon={FaPlus}
              size="small"
            >
              Create
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.filterSectionCompact}>
        <div className={styles.searchBarWrapperCompact}>
          <div className={styles.searchIconInside}>
            <FaSearch />
          </div>
          <input
            type="text"
            className={styles.compactInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search competitions..."
          />
        </div>

        <FilterSelect
          value={activeTab}
          onChange={(val) => { setActiveTab(val); setCurrentPage(1); }}
          options={statusOptions}
          icon={LuFilter}
          label="Status"
          className={styles.statusFilterDropdown}
        />
        
        <div className={styles.dateInputGroupCompact}>
          <FaCalendarAlt />
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className={styles.compactDateInput}
          />
          {filterDate && (
            <button className={styles.clearDateCompact} onClick={() => setFilterDate("")}>
              <FaTimes />
            </button>
          )}
        </div>

        {/* <div className={styles.dateInputGroupCompact}>
          <FaClock />
          <input 
            type="time" 
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value)}
            className={styles.compactDateInput}
          />
          {filterTime && (
            <button className={styles.clearDateCompact} onClick={() => setFilterTime("")}>
              <FaTimes />
            </button>
          )}
        </div> */}
      </div>

      {loading ? (
        <div className={styles.loading}>Loading competitions...</div>
      ) : (
        <>
          <div className={styles.tableSection}>
            <DataTable
              columns={columns}
              data={currentCompetitions}
              actions={(comp) => (
                <div className={styles.actionButtons}>
                  <IconButton
                    icon={FaEye}
                    onClick={() => handleView(comp)}
                    title="View Details"
                    variant="primary"
                  />
                  <IconButton
                    icon={FaEdit}
                    onClick={() => navigate(`/admin/competitions/edit/${comp._id || comp.id}${window.location.search}`)}
                    title="Edit"
                    variant="primary"
                  />
                  {comp.status === 'Upcoming' && (
                    <IconButton
                      icon={FaTrophy}
                      onClick={() => handleStartLiveCompetition(comp)}
                      title="Start Live"
                      variant="success"
                    />
                  )}
                  {comp.status === 'ENDED' && (
                    <IconButton
                      icon={FaTrophy}
                      onClick={() => handleShowResult(comp)}
                      title="View Result"
                      variant="info"
                    />
                  )}
                  <IconButton
                    icon={FaTrash}
                    onClick={() => handleDelete(comp)}
                    title="Delete"
                    variant="danger"
                  />
                </div>
              )}
              emptyMessage="No competitions found match your search/filters."
            />
          </div>

          {filteredCompetitions.length > itemsPerPage && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <FaChevronLeft/>
              </button>
              
              <span className={styles.pageInfo}>
                Page <strong>{currentPage}</strong> of {Math.ceil(filteredCompetitions.length / itemsPerPage)}
              </span>

              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredCompetitions.length / itemsPerPage), prev + 1))}
                disabled={currentPage === Math.ceil(filteredCompetitions.length / itemsPerPage)}
              >
                <FaChevronRight/>
              </button>
            </div>
          )}

          {filteredCompetitions.length === 0 && (
            <div className={styles.loading}>No competitions found</div>
          )}
        </>
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
              <h3>Delete Competition</h3>
            </div>
            <div className={styles.confirmBody}>
              <p>
                Are you sure you want to delete{" "}
                <strong>"{deleteConfirm.name}"</strong>?
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
                Delete Competition
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result/Leaderboard Modal */}
      {showResultModal && selectedCompetition && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowResultModal(false)}
        >
          <div
            className={styles.puzzleModal} // Reusing puzzle modal style for consistency
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px' }}
          >
            <div className={styles.modalHeader}>
              <h3>
                <FaTrophy /> Results for "{selectedCompetition.name}"
              </h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowResultModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className={styles.modalBody} style={{ padding: '20px' }}>
              <CompetitionLeaderboard
                competitionId={selectedCompetition._id || selectedCompetition.id}
                isLive={false} // It's a result view, not live updates
                theme="light"
              />
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.closeModalBtn}
                onClick={() => setShowResultModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Competition Modal */}
      {showViewModal && selectedCompetition && (
        <div
          className={styles.previewOverlay}
          onClick={() => setShowViewModal(false)}
        >
          <div
            className={styles.viewModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>
                <FaEye /> Competition Details
              </h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowViewModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.viewDetailsGrid}>
                {/* Name */}
                <div className={`${styles.detailCard} ${styles.fullWidth}`}>
                  <div className={styles.detailLabel}>
                    <FaTrophy /> Competition Name
                  </div>
                  <div className={styles.detailValue}>{selectedCompetition.name}</div>
                </div>

                {/* Status */}
                <div className={styles.detailCard}>
                  <div className={styles.detailLabel}>
                    <FaLayerGroup /> Status
                  </div>
                  <div className={styles.detailValue}>
                    <Badge
                      variant={
                        selectedCompetition.status === "Live"
                          ? "live"
                          : selectedCompetition.status === "Upcoming"
                            ? "warning"
                            : "info"
                      }
                    >
                      {selectedCompetition.status}
                    </Badge>
                  </div>
                </div>

                {/* Players */}
                <div className={styles.detailCard}>
                  <div className={styles.detailLabel}>
                    <FaUsers /> Participation
                  </div>
                  <div className={styles.detailValue}>
                    {selectedCompetition.players} / {selectedCompetition.maxPlayers}
                    <span style={{ fontSize: '14px', color: '#868e96', marginLeft: '6px', fontWeight: '400' }}>
                      ({Math.round((selectedCompetition.players / selectedCompetition.maxPlayers) * 100)}%)
                    </span>
                  </div>
                </div>

                {/* Start Time */}
                <div className={styles.detailCard}>
                  <div className={styles.detailLabel}>
                    <FaClock /> Start Time
                  </div>
                  <div className={styles.detailValue}>
                    {selectedCompetition.startTime}
                  </div>
                </div>

                {/* Duration */}
                <div className={styles.detailCard}>
                  <div className={styles.detailLabel}>
                    <FaClock /> Duration
                  </div>
                  <div className={styles.detailValue}>
                    {selectedCompetition.duration}
                  </div>
                </div>

                {/* Puzzles Count */}
                <div className={`${styles.detailCard} ${styles.fullWidth}`}>
                  <div className={styles.detailLabel}>
                    <FaPuzzlePiece /> Content
                  </div>
                  <div className={styles.detailValue}>
                    {selectedCompetition.puzzles?.length || 0} Puzzles Assigned
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <Button
                variant="secondary"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </Button>
              <Button
                variant="success"
                icon={FaPuzzlePiece}
                onClick={() => {
                  setShowViewModal(false);
                  handleViewPuzzles(selectedCompetition);
                }}
              >
                View Puzzles
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Competition Modal */}
      {showEditModal && selectedCompetition && (
        <div
          className={styles.previewOverlay}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className={styles.confirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>
                <FaEdit /> Edit Competition
              </h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowEditModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Edit functionality will be implemented here.</p>
              <p>
                You can navigate to the edit page or implement inline editing.
              </p>
              <div className={styles.modalFooter}>
                <Button
                  variant="secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    navigate(
                      `/admin/competitions/edit/${selectedCompetition._id || selectedCompetition.id
                      }`
                    )
                  }
                >
                  Go to Edit Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompetitionList;
