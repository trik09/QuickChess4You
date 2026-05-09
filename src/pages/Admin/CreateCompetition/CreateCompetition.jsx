import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTrophy,
  FaClock,
  FaUsers,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaBookOpen,
  FaTrash,
  FaSearch,
  FaPencilAlt,
  FaCalendarAlt
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import styles from "./CreateCompetition.module.css";
import ChessBoard from "../../../components/ChessBoard/ChessBoard";
import { competitionAPI } from "../../../services/api";

// Generate unique id
const genId = () => Math.random().toString(36).slice(2, 9);

// Chapter accent colors (cycles through these)
const CHAPTER_COLORS = [
  "#d97706", // gold
  "#7c3aed", // purple
  "#0891b2", // cyan
  "#16a34a", // green
  "#db2777", // pink
  "#ea580c", // orange
];

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

function CreateCompetition() {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    startTime: "",
    duration: "15",
    maxParticipants: "",
    description: "",
  });

  // Time picker state (for Safari compatibility) — default to current local time
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerState, setTimePickerState] = useState(() => {
    const now = new Date();
    const hour24 = now.getHours();
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    return {
      hour: hour12.toString(),
      minute: now.getMinutes().toString().padStart(2, '0'),
      period: hour24 >= 12 ? 'PM' : 'AM',
    };
  });
  const timePickerRef = useRef(null);
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);

  // Close time picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target)) {
        setShowTimePicker(false);
      }
    };
    if (showTimePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-scroll to selected hour and minute
      setTimeout(() => {
        if (hourScrollRef.current) {
          const activeBtn = hourScrollRef.current.querySelector('[data-active="true"]');
          if (activeBtn) activeBtn.scrollIntoView({ block: 'center' });
        }
        if (minuteScrollRef.current) {
          const activeBtn = minuteScrollRef.current.querySelector('[data-active="true"]');
          if (activeBtn) activeBtn.scrollIntoView({ block: 'center' });
        }
      }, 30);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTimePicker]);

  // Update formData.startTime whenever time picker changes
  useEffect(() => {
    let hour24 = parseInt(timePickerState.hour);
    if (timePickerState.period === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (timePickerState.period === "AM" && hour24 === 12) {
      hour24 = 0;
    }
    const timeString = `${hour24.toString().padStart(2, '0')}:${timePickerState.minute}`;
    setFormData(prev => ({ ...prev, startTime: timeString }));
  }, [timePickerState]);

  // Format display time
  const getDisplayTime = () => {
    if (!formData.startTime) return "Select time";
    const [hours, minutes] = formData.startTime.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`;
  };

  const handleTimeSelect = () => {
    setShowTimePicker(false);
  };

  // Custom date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);
  const [calendarView, setCalendarView] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    };
    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker]);

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const getDisplayDate = () => {
    if (!formData.startDate) return "dd / mm / yyyy";
    const [y, m, d] = formData.startDate.split('-');
    return `${d} / ${m} / ${y}`;
  };

  const handleDateSelect = (dateStr) => {
    setFormData(prev => ({ ...prev, startDate: dateStr }));
    setShowDatePicker(false);
  };

  const buildCalendarDays = () => {
    const { month, year } = calendarView;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const cells = [];
    // prev month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: daysInPrev - i, month: month - 1, year: month === 0 ? year - 1 : year, outside: true });
    }
    // current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month, year, outside: false });
    }
    // next month padding to fill grid
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, month: month + 1, year: month === 11 ? year + 1 : year, outside: true });
    }
    return cells;
  };

  // Puzzle State
  const [puzzles, setPuzzles] = useState([]);
  const [loadingPuzzles, setLoadingPuzzles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [previewPuzzle, setPreviewPuzzle] = useState(null);

  // Chapter State
  const [chapters, setChapters] = useState([]); // [{ id, name, puzzleIds: [] }]
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [newChapterName, setNewChapterName] = useState("");
  const chapterInputRef = useRef(null);

  // Chapter rename state
  const [editingChapter, setEditingChapter] = useState(null); // { id, name }
  const editChapterInputRef = useRef(null);

  // Cache of all puzzles ever fetched (across pages) — needed for Assigned view
  const allPuzzlesCacheRef = useRef({});

  // View State
  const [viewMode, setViewMode] = useState("library"); // 'library' or 'selected'

  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    difficulty: "all",
    type: "all",
    level: "all",
    rating: "all",
  });

  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    limit: 10,
    totalRecords: 0,
  });

  const [goToPage, setGoToPage] = useState("");

  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    difficulties: [],
    types: [],
    levels: [],
    ratings: [],
  });

  useEffect(() => {
    if (viewMode === 'library') {
      fetchPuzzles();
    } else if (viewMode === 'selected') {
      // Fetch assigned puzzles for the active chapter
      const activeChapterPuzzleIds = chapters.find(ch => ch.id === activeChapterId)?.puzzleIds || [];
      if (activeChapterPuzzleIds.length > 0) {
        fetchAssignedPuzzles(activeChapterPuzzleIds);
      }
    }
  }, [filters, pagination.current, viewMode, chapters, activeChapterId]);

  // Focus chapter name input when modal opens
  useEffect(() => {
    if (showChapterModal && chapterInputRef.current) {
      setTimeout(() => chapterInputRef.current?.focus(), 50);
    }
  }, [showChapterModal]);

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
        // Merge into cache so Assigned view can find puzzles from any page
        response.data.forEach(p => { allPuzzlesCacheRef.current[p._id] = p; });
        setPagination((prev) => ({ ...prev, ...response.pagination }));
        if (response.filters) setFilterOptions(response.filters);
      }
    } catch (error) {
      toast.error("Failed to load puzzles");
    } finally {
      setLoadingPuzzles(false);
    }
  };

  const fetchAssignedPuzzles = async (puzzleIds) => {
    if (!puzzleIds || puzzleIds.length === 0) {
      setLoadingPuzzles(false);
      return;
    }

    setLoadingPuzzles(true);
    try {
      // Fetch puzzles by IDs for the active chapter
      const response = await competitionAPI.getPuzzlesByIds(puzzleIds);
      if (response.success) {
        // Update cache with fetched puzzles
        response.data.forEach(p => { allPuzzlesCacheRef.current[p._id] = p; });
      }
    } catch (error) {
      console.error("Failed to load assigned puzzles:", error);
      toast.error("Failed to load assigned puzzles");
    } finally {
      setLoadingPuzzles(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleGoToPage = (e) => {
    e.preventDefault();
    const pageNum = parseInt(goToPage);
    const totalPages = Math.ceil(pagination.totalRecords / pagination.limit);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setPagination(p => ({ ...p, current: pageNum }));
      setGoToPage("");
    } else {
      toast.error(`Please enter a valid page number between 1 and ${totalPages}`);
    }
  };

  // --- Chapter helpers ---
  const getChapterForPuzzle = (puzzleId) => {
    return chapters.find(ch => ch.puzzleIds.includes(puzzleId)) || null;
  };

  const getChapterColor = (chapterId) => {
    const idx = chapters.findIndex(ch => ch.id === chapterId);
    return CHAPTER_COLORS[idx % CHAPTER_COLORS.length];
  };

  // All puzzles that are assigned to any chapter (flat)
  const allAssignedPuzzleIds = chapters.flatMap(ch => ch.puzzleIds);

  // Puzzles assigned to the currently active chapter only — pulled from cache
  const activeChapterPuzzleIds = chapters.find(ch => ch.id === activeChapterId)?.puzzleIds || [];
  const selectedPuzzles = activeChapterPuzzleIds
    .map(id => allPuzzlesCacheRef.current[id])
    .filter(Boolean);

  // --- Chapter CRUD ---
  const handleAddChapter = () => {
    const name = newChapterName.trim();
    if (!name) {
      toast.error("Please enter a chapter name");
      return;
    }
    const newChapter = { id: genId(), name, puzzleIds: [] };
    setChapters(prev => [...prev, newChapter]);
    setActiveChapterId(newChapter.id);
    setNewChapterName("");
    setShowChapterModal(false);
    toast.success(`Chapter "${name}" created!`);
  };

  const handleDeleteChapter = (chapterId, e) => {
    e.stopPropagation();
    setChapters(prev => prev.filter(ch => ch.id !== chapterId));
    if (activeChapterId === chapterId) {
      const remaining = chapters.filter(ch => ch.id !== chapterId);
      setActiveChapterId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleOpenRenameChapter = (ch, e) => {
    e.stopPropagation();
    setEditingChapter({ id: ch.id, name: ch.name });
    setTimeout(() => editChapterInputRef.current?.focus(), 50);
  };

  const handleRenameChapter = () => {
    const name = editingChapter?.name?.trim();
    if (!name) { toast.error("Chapter name cannot be empty"); return; }
    setChapters(prev => prev.map(ch => ch.id === editingChapter.id ? { ...ch, name } : ch));
    toast.success(`Renamed to "${name}"`);
    setEditingChapter(null);
  };

  // --- Auto Variation Logic ---
  const handleAutoVariation = async (variationNum) => {
    setIsAutoGenerating(true);
    toast.loading(`Generating Variation ${variationNum}...`, { id: "auto-gen" });

    try {
      const categories = VARIATIONS[variationNum];
      const newChapters = [];
      const usedIds = new Set();
      let hasError = false;

      for (const category of categories) {
        // Fetch up to 1000 puzzles for this category to ensure a large pool for sampling
        const response = await competitionAPI.getPuzzlesForCompetition({ category, limit: 1000 });
        if (!response.success) {
          hasError = true;
          continue;
        }

        const categoryPuzzles = response.data || [];

        // Add to global cache so assigned view correctly displays data
        categoryPuzzles.forEach(p => { allPuzzlesCacheRef.current[p._id] = p; });

        const selectedPuzzleIds = [];

        Object.entries(DISTRIBUTION).forEach(([levelStr, count]) => {
          const level = parseInt(levelStr);
          // Find available puzzles for this level, excluding already assigned ones
          const availablePuzzles = categoryPuzzles.filter(
            p => p.level === level && !usedIds.has(p._id)
          );

          // Shuffle array for random selection
          const shuffled = availablePuzzles.sort(() => Math.random() - 0.5);

          // Pick the required count or whatever is available
          const selected = shuffled.slice(0, count);

          selected.forEach(p => {
            selectedPuzzleIds.push(p._id);
            usedIds.add(p._id);
          });
        });

        // Always create a chapter even if no puzzles match (maintain variation structure)
        // Add chapter number prefix (1-indexed)
        const chapterNumber = newChapters.length + 1;
        newChapters.push({
          id: genId(),
          name: `${chapterNumber}. ${category}`,
          puzzleIds: selectedPuzzleIds
        });
      }

      // Replace existing chapters with new selection
      setChapters(newChapters);

      if (newChapters.length > 0) {
        setActiveChapterId(newChapters[0].id);
      } else {
        setActiveChapterId(null);
      }

      if (hasError) {
        toast.error("Variation generated with errors fetching some categories.", { id: "auto-gen" });
      } else {
        toast.success(`Variation ${variationNum} generated successfully!`, { id: "auto-gen" });
      }
    } catch (err) {
      console.error("Auto Generation Error:", err);
      toast.error("Failed to generate variation.", { id: "auto-gen" });
    } finally {
      setIsAutoGenerating(false);
    }
  };

  // --- Puzzle toggle in active chapter ---
  const handlePuzzleToggle = (puzzle) => {
    if (chapters.length === 0) {
      toast.error("Please create a chapter first before selecting puzzles!");
      return;
    }
    if (!activeChapterId) {
      toast.error("Please select a chapter first!");
      return;
    }

    const puzzleId = puzzle._id;
    const ownerChapter = getChapterForPuzzle(puzzleId);

    if (ownerChapter && ownerChapter.id !== activeChapterId) {
      // Already in another chapter – do nothing (it's disabled)
      return;
    }

    setChapters(prev => prev.map(ch => {
      if (ch.id !== activeChapterId) return ch;
      const alreadyIn = ch.puzzleIds.includes(puzzleId);
      return {
        ...ch,
        puzzleIds: alreadyIn
          ? ch.puzzleIds.filter(id => id !== puzzleId)
          : [...ch.puzzleIds, puzzleId]
      };
    }));
  };

  const handleSelectAllPage = () => {
    if (chapters.length === 0 || !activeChapterId) {
      toast.error("Please create / select a chapter first!");
      return;
    }
    const currentPagePuzzles = viewMode === 'library' ? puzzles : selectedPuzzles;
    // Only consider puzzles that are free or in the active chapter
    const eligible = currentPagePuzzles.filter(p => {
      const owner = getChapterForPuzzle(p._id);
      return !owner || owner.id === activeChapterId;
    });

    const activeChapter = chapters.find(ch => ch.id === activeChapterId);
    const allSelected = eligible.length > 0 && eligible.every(p => activeChapter.puzzleIds.includes(p._id));

    setChapters(prev => prev.map(ch => {
      if (ch.id !== activeChapterId) return ch;
      if (allSelected) {
        return { ...ch, puzzleIds: ch.puzzleIds.filter(id => !eligible.some(p => p._id === id)) };
      } else {
        const toAdd = eligible.filter(p => !ch.puzzleIds.includes(p._id)).map(p => p._id);
        return { ...ch, puzzleIds: [...ch.puzzleIds, ...toAdd] };
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) return toast.error("Enter competition name");
    if (!formData.startDate) return toast.error("Select a start date");
    if (!formData.startTime) return toast.error("Select a start time");

    const totalPuzzles = chapters.flatMap(ch => ch.puzzleIds);

    if (chapters.length === 0) {
      return toast.error("Please create at least one chapter and add puzzles to it");
    }
    if (totalPuzzles.length === 0) {
      return toast.error("Please add at least one puzzle to a chapter");
    }

    setIsSubmitting(true);
    try {
      const competitionData = {
        ...formData,
        startTime: new Date(`${formData.startDate}T${formData.startTime}`).toISOString(),
        duration: parseInt(formData.duration),
        maxParticipants: parseInt(formData.maxParticipants) || 0,
        puzzles: totalPuzzles,
        chapters: chapters.map(ch => ({ name: ch.name, puzzleIds: ch.puzzleIds })),
      };
      // Remove the split fields before sending
      delete competitionData.startDate;

      await competitionAPI.createCompetition(competitionData);
      toast.success("Competition created!");
      setTimeout(() => navigate("/admin/competitions"), 1500);
    } catch (error) {
      toast.error(error.message || "Creation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableData = viewMode === 'selected' ? selectedPuzzles : puzzles;

  // Check select-all state
  const getSelectAllState = () => {
    const currentPagePuzzles = viewMode === 'library' ? puzzles : selectedPuzzles;
    const eligible = currentPagePuzzles.filter(p => {
      const owner = getChapterForPuzzle(p._id);
      return !owner || owner.id === activeChapterId;
    });
    const activeChapter = chapters.find(ch => ch.id === activeChapterId);
    if (!activeChapter || eligible.length === 0) return false;
    return eligible.every(p => activeChapter.puzzleIds.includes(p._id));
  };

  return (
    <div className={styles.container}>
      <Toaster position="top-center" />

      {/* --- Top Header --- */}
      <div className={styles.header}>
        <div>
          <h1>Create Competition</h1>
          <p>Configure details and organize puzzles into chapters</p>
        </div>
        <button className={styles.cancelBtn} onClick={() => navigate("/admin/competitions")}>
          <FaTimesCircle /> Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.mainLayout}>

        {/* --- Section 1: Basic Details --- */}
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
              <div className={styles.dateTimeRow}>
                {/* Custom date picker — same style as time picker, no browser chrome */}
                <div className={styles.inputIconWrapper} ref={datePickerRef} style={{ position: 'relative' }}>
                  <FaCalendarAlt className={styles.inputIcon} />
                  <div
                    className={`${styles.timeDisplayInput} ${showDatePicker ? styles.open : ''}`}
                    onClick={() => setShowDatePicker(prev => !prev)}
                  >
                    <span className={formData.startDate ? styles.timeDisplayValue : styles.timeDisplayPlaceholder}>
                      {getDisplayDate()}
                    </span>
                  </div>

                  {showDatePicker && (
                    <div className={styles.datePickerPopup}>
                      {/* Month / Year header */}
                      <div className={styles.datePickerHeader}>
                        <button
                          type="button"
                          className={styles.dateNavBtn}
                          onClick={() => setCalendarView(v => {
                            const d = new Date(v.year, v.month - 1, 1);
                            return { month: d.getMonth(), year: d.getFullYear() };
                          })}
                        >‹</button>
                        <span className={styles.datePickerMonthYear}>
                          {MONTHS[calendarView.month]} {calendarView.year}
                        </span>
                        <button
                          type="button"
                          className={styles.dateNavBtn}
                          onClick={() => setCalendarView(v => {
                            const d = new Date(v.year, v.month + 1, 1);
                            return { month: d.getMonth(), year: d.getFullYear() };
                          })}
                        >›</button>
                      </div>

                      {/* Day labels */}
                      <div className={styles.datePickerGrid}>
                        {DAYS.map(d => (
                          <div key={d} className={styles.datePickerDayLabel}>{d}</div>
                        ))}
                        {/* Calendar cells */}
                        {buildCalendarDays().map((cell, idx) => {
                          const cellMonth = ((cell.month % 12) + 12) % 12;
                          const cellYear = cell.month < 0 ? cell.year - 1 : cell.month > 11 ? cell.year + 1 : cell.year;
                          const dateStr = `${cellYear}-${String(cellMonth + 1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`;
                          const isSelected = formData.startDate === dateStr;
                          const isToday = dateStr === new Date().toISOString().slice(0,10);
                          return (
                            <button
                              key={idx}
                              type="button"
                              className={`
                                ${styles.datePickerCell}
                                ${cell.outside ? styles.datePickerCellOutside : ''}
                                ${isSelected ? styles.datePickerCellSelected : ''}
                                ${isToday && !isSelected ? styles.datePickerCellToday : ''}
                              `}
                              onClick={() => handleDateSelect(dateStr)}
                            >
                              {cell.day}
                            </button>
                          );
                        })}
                      </div>

                      {/* Today shortcut */}
                      <div className={styles.datePickerFooter}>
                        <button
                          type="button"
                          className={styles.datePickerTodayBtn}
                          onClick={() => {
                            const today = new Date();
                            const todayStr = today.toISOString().slice(0,10);
                            setCalendarView({ month: today.getMonth(), year: today.getFullYear() });
                            handleDateSelect(todayStr);
                          }}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          className={styles.datePickerClearBtn}
                          onClick={() => { setFormData(prev => ({ ...prev, startDate: '' })); setShowDatePicker(false); }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.inputIconWrapper} ref={timePickerRef} style={{ position: 'relative' }}>
                  <FaClock className={styles.inputIcon} />
                  {/* Single-click time picker — works on all browsers including Safari */}
                  <div
                    className={`${styles.timeDisplayInput} ${showTimePicker ? styles.open : ''}`}
                    onClick={() => setShowTimePicker(prev => !prev)}
                  >
                    <span className={formData.startTime ? styles.timeDisplayValue : styles.timeDisplayPlaceholder}>
                      {getDisplayTime()}
                    </span>
                  </div>

                  {showTimePicker && (
                    <div className={styles.timePickerPopup}>
                      <div className={styles.timePickerCols}>
                        {/* Hours */}
                        <div className={styles.timePickerCol}>
                          <div className={styles.timePickerColLabel}>Hour</div>
                          <div className={styles.timePickerScroll} ref={hourScrollRef}>
                            {Array.from({ length: 12 }, (_, i) => {
                              const h = (i + 1).toString();
                              const isActive = timePickerState.hour === h;
                              return (
                                <button
                                  key={h}
                                  type="button"
                                  data-active={isActive}
                                  className={`${styles.timePickerItem} ${isActive ? styles.timePickerItemActive : ''}`}
                                  onClick={() => setTimePickerState(prev => ({ ...prev, hour: h }))}
                                >
                                  {h.padStart(2, '0')}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className={styles.timePickerDivider} />

                        {/* Minutes — every minute 00–59 */}
                        <div className={styles.timePickerCol}>
                          <div className={styles.timePickerColLabel}>Min</div>
                          <div className={styles.timePickerScroll} ref={minuteScrollRef}>
                            {Array.from({ length: 60 }, (_, i) => {
                              const m = i.toString().padStart(2, '0');
                              const isActive = timePickerState.minute === m;
                              return (
                                <button
                                  key={m}
                                  type="button"
                                  data-active={isActive}
                                  className={`${styles.timePickerItem} ${isActive ? styles.timePickerItemActive : ''}`}
                                  onClick={() => setTimePickerState(prev => ({ ...prev, minute: m }))}
                                >
                                  {m}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className={styles.timePickerDivider} />

                        {/* AM / PM */}
                        <div className={styles.timePickerCol}>
                          <div className={styles.timePickerColLabel}>Period</div>
                          <div className={styles.timePickerScroll}>
                            {["AM", "PM"].map(p => (
                              <button
                                key={p}
                                type="button"
                                className={`${styles.timePickerItem} ${timePickerState.period === p ? styles.timePickerItemActive : ''}`}
                                onClick={() => setTimePickerState(prev => ({ ...prev, period: p }))}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Done button */}
                      <button
                        type="button"
                        className={styles.timePickerDoneBtn}
                        onClick={handleTimeSelect}
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              </div>
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

        {/* --- Section 2: Chapters + Puzzle Management --- */}
        <div className={`${styles.card} ${styles.tableCard}`}>

          {/* Chapter Bar */}
          <div className={styles.chapterSection}>
            <div className={styles.chapterSectionHeader}>
              <div className={styles.chapterSectionLeft}>
                <FaBookOpen className={styles.chapterSectionIcon} />
                <span className={styles.chapterSectionTitle}>Chapters</span>
                <span className={styles.chapterSectionHint}>
                  {chapters.length === 0
                    ? "Create chapters to organize your puzzles"
                    : `${chapters.length} chapter${chapters.length !== 1 ? 's' : ''} · ${allAssignedPuzzleIds.length} puzzle${allAssignedPuzzleIds.length !== 1 ? 's' : ''} assigned`}
                </span>
              </div>
              <div className={styles.chapterActions}>
                <div className={styles.variationButtons}>
                  <button type="button" className={styles.varBtn} onClick={() => handleAutoVariation(1)} disabled={isAutoGenerating}>Var 1</button>
                  <button type="button" className={styles.varBtn} onClick={() => handleAutoVariation(2)} disabled={isAutoGenerating}>Var 2</button>
                  <button type="button" className={styles.varBtn} onClick={() => handleAutoVariation(3)} disabled={isAutoGenerating}>Var 3</button>
                </div>
                <button
                  type="button"
                  className={styles.addChapterBtn}
                  onClick={() => setShowChapterModal(true)}
                  disabled={isAutoGenerating}
                >
                  <FaPlus /> Add Chapter
                </button>
              </div>
            </div>

            {/* Chapter Bubbles */}
            {chapters.length > 0 && (
              <div className={styles.chapterBubbleBar}>
                {chapters.map((ch, idx) => {
                  const color = CHAPTER_COLORS[idx % CHAPTER_COLORS.length];
                  const isActive = activeChapterId === ch.id;
                  return (
                    <div
                      key={ch.id}
                      className={`${styles.chapterBubble} ${isActive ? styles.chapterBubbleActive : ''}`}
                      style={isActive ? { '--ch-color': color, borderColor: color } : { '--ch-color': color }}
                      onClick={() => setActiveChapterId(ch.id)}
                    >
                      <span
                        className={styles.chapterDotIndicator}
                        style={{ background: color }}
                      />
                      <span className={styles.chapterBubbleName}>{ch.name}</span>
                      <span
                        className={styles.chapterBubbleCount}
                        style={isActive ? { background: color } : {}}
                      >
                        {ch.puzzleIds.length}
                      </span>
                      <button
                        type="button"
                        className={styles.chapterEditBtn}
                        onClick={(e) => handleOpenRenameChapter(ch, e)}
                        title="Rename chapter"
                      >
                        <FaPencilAlt />
                      </button>
                      <button
                        type="button"
                        className={styles.chapterDeleteBtn}
                        onClick={(e) => handleDeleteChapter(ch.id, e)}
                        title="Delete chapter"
                      >
                        <FaTimesCircle />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Instruction banner when no chapter selected */}
            {chapters.length > 0 && !activeChapterId && (
              <div className={styles.chapterInstruction}>
                👆 Click a chapter bubble above to select it, then pick puzzles below
              </div>
            )}
          </div>

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

                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                >
                  <option value="all">Type: All</option>
                  <option value="normal">Normal</option>
                  <option value="kids">Kids</option>
                  <option value="illegal">Illegal Move</option>
                </select>

                <select
                  value={filters.level}
                  onChange={(e) => handleFilterChange("level", e.target.value)}
                >
                  <option value="all">Level: All</option>
                  {filterOptions.levels?.map(l => <option key={l} value={l}>{l}</option>)}
                </select>

                {/* <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange("rating", e.target.value)}
                >
                  <option value="all">Rating: All</option>
                  {filterOptions.ratings?.map(r => <option key={r} value={r}>{r}</option>)}
                </select> */}
              </div>
            </div>

            <div className={styles.toolbarRight}>
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
                  Assigned ({activeChapterPuzzleIds.length})
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

          {/* Active chapter indicator strip */}
          {activeChapterId && (() => {
            const ch = chapters.find(c => c.id === activeChapterId);
            const color = getChapterColor(activeChapterId);
            return (
              <div className={styles.activeChapterStrip} style={{ borderLeftColor: color }}>
                <span className={styles.activeChapterDot} style={{ background: color }} />
                <span>Adding puzzles to: <strong>{ch?.name}</strong></span>
              </div>
            );
          })()}

          {/* Data Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th width="50">
                    {viewMode === 'library' && (
                      <button
                        type="button"
                        className={styles.selectAllBtn}
                        onClick={handleSelectAllPage}
                        title="Select all eligible puzzles on this page"
                        disabled={!activeChapterId}
                      >
                        {getSelectAllState() ? <FaCheckCircle /> : <div className={styles.emptyCheckbox} />}
                      </button>
                    )}
                  </th>
                  <th>Puzzle Title / ID</th>
                  <th>Category</th>
                  <th>Difficulty</th>
                  <th>Type</th>
                  <th width="80">Used In</th>
                  <th width="100">Chapter</th>
                  <th width="80">Preview</th>
                </tr>
              </thead>
              <tbody>
                {loadingPuzzles ? (
                  <tr>
                    <td colSpan="8" className={styles.loadingCell}>
                      <div className={styles.spinner} /> Loading library...
                    </td>
                  </tr>
                ) : tableData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className={styles.emptyCell}>
                      {viewMode === 'selected'
                        ? "No puzzles assigned to any chapter yet."
                        : "No puzzles found matching filters."}
                    </td>
                  </tr>
                ) : (
                  tableData.map((puzzle) => {
                    const ownerChapter = getChapterForPuzzle(puzzle._id);
                    const isInActiveChapter = ownerChapter && ownerChapter.id === activeChapterId;
                    const isInOtherChapter = ownerChapter && ownerChapter.id !== activeChapterId;
                    const isSelected = !!ownerChapter;
                    const chapterColor = ownerChapter ? getChapterColor(ownerChapter.id) : null;

                    return (
                      <tr
                        key={puzzle._id}
                        className={`
                          ${isInActiveChapter ? styles.selectedRow : ''}
                          ${isInOtherChapter ? styles.disabledRow : ''}
                        `}
                        onClick={() => !isInOtherChapter && handlePuzzleToggle(puzzle)}
                        style={{ cursor: isInOtherChapter ? 'not-allowed' : 'pointer' }}
                      >
                        <td className={styles.checkCell}>
                          {viewMode === 'library' && (
                            <div className={`${styles.checkbox} ${isInActiveChapter ? styles.checked : ''}`}
                              style={isInActiveChapter ? { borderColor: chapterColor, color: chapterColor } : {}}>
                              {isInActiveChapter && <FaCheckCircle />}
                            </div>
                          )}
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
                          <span
                            className={styles.usageCountBadge}
                            data-level={
                              (puzzle.competitionUsageCount || 0) === 0
                                ? 'none'
                                : (puzzle.competitionUsageCount || 0) <= 2
                                ? 'low'
                                : 'high'
                            }
                            title={`Used in ${puzzle.competitionUsageCount || 0} competition(s)`}
                          >
                            {puzzle.competitionUsageCount || 0}
                          </span>
                        </td>
                        <td>
                          {ownerChapter ? (
                            <span
                              className={styles.chapterPill}
                              style={{ background: chapterColor + '20', color: chapterColor, borderColor: chapterColor + '60' }}
                            >
                              {ownerChapter.name}
                            </span>
                          ) : (
                            <span className={styles.unassignedText}>—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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
                            {viewMode === 'selected' && (
                              <button
                                type="button"
                                className={styles.previewIconBtn}
                                style={{ color: '#ef4444' }}
                                title="Remove from chapter"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePuzzleToggle(puzzle);
                                }}
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
                {(() => {
                  const totalPages = Math.max(1, Math.ceil(pagination.totalRecords / pagination.limit));
                  const pages = [];
                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    if (pagination.current <= 3) {
                      pages.push(1, 2, 3, 4, '...', totalPages);
                    } else if (pagination.current >= totalPages - 2) {
                      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push(1, '...', pagination.current - 1, pagination.current, pagination.current + 1, '...', totalPages);
                    }
                  }

                  return pages.map((page, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`${styles.pageNumberBtn} ${page === pagination.current ? styles.activePage : ''} ${page === '...' ? styles.ellipsis : ''}`}
                      disabled={page === '...'}
                      onClick={() => page !== '...' && setPagination(p => ({ ...p, current: page }))}
                    >
                      {page}
                    </button>
                  ));
                })()}
                <button
                  type="button"
                  disabled={pagination.current >= Math.ceil(pagination.totalRecords / pagination.limit)}
                  onClick={() => setPagination(p => ({ ...p, current: p.current + 1 }))}
                >
                  <FaChevronRight />
                </button>
              </div>

              <div className={styles.goToPageWrapper}>
                <span>Go to:</span>
                <input
                  type="number"
                  min="1"
                  max={Math.ceil(pagination.totalRecords / pagination.limit)}
                  value={goToPage}
                  onChange={(e) => setGoToPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGoToPage(e);
                    }
                  }}
                  placeholder="Page"
                />
                <button type="button" className={styles.goBtn} onClick={handleGoToPage}>Go</button>
              </div>
            </div>
          )}
        </div>

        {/* --- Footer --- */}
        <div className={styles.stickyFooter}>
          <div className={styles.footerInfo}>
            <span className={styles.selectionCount}>
              {allAssignedPuzzleIds.length} Puzzles · {chapters.length} Chapters
            </span>
            <small>Organize puzzles into chapters for a structured competition</small>
          </div>
          <div className={styles.footerActions}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || allAssignedPuzzleIds.length === 0}
            >
              {isSubmitting ? "Creating..." : "Create Competition"}
            </button>
          </div>
        </div>

      </form>

      {/* --- Chapter Name Modal --- */}
      {showChapterModal && (
        <div className={styles.modalOverlay} onClick={() => setShowChapterModal(false)}>
          <div className={styles.chapterModalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.chapterModalHeader}>
              <FaBookOpen className={styles.chapterModalIcon} />
              <h4>New Chapter</h4>
            </div>
            <p className={styles.chapterModalDesc}>
              Give this chapter a descriptive name so students can navigate your puzzles easily.
            </p>
            <input
              ref={chapterInputRef}
              type="text"
              className={styles.chapterNameInput}
              placeholder="e.g. Opening Tactics, Endgame Practice..."
              value={newChapterName}
              onChange={e => setNewChapterName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddChapter()}
              maxLength={40}
            />
            <div className={styles.chapterModalActions}>
              <button
                type="button"
                className={styles.chapterModalCancel}
                onClick={() => { setShowChapterModal(false); setNewChapterName(""); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.chapterModalCreate}
                onClick={handleAddChapter}
                disabled={!newChapterName.trim()}
              >
                <FaPlus /> Create Chapter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Chapter Rename Modal --- */}
      {editingChapter && (
        <div className={styles.modalOverlay} onClick={() => setEditingChapter(null)}>
          <div className={styles.chapterModalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.chapterModalHeader}>
              <FaPencilAlt className={styles.chapterModalIcon} />
              <h4>Rename Chapter</h4>
            </div>
            <input
              ref={editChapterInputRef}
              type="text"
              className={styles.chapterNameInput}
              placeholder="Chapter name..."
              value={editingChapter.name}
              onChange={e => setEditingChapter(prev => ({ ...prev, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleRenameChapter()}
              maxLength={40}
            />
            <div className={styles.chapterModalActions}>
              <button
                type="button"
                className={styles.chapterModalCancel}
                onClick={() => setEditingChapter(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.chapterModalCreate}
                onClick={handleRenameChapter}
                disabled={!editingChapter.name.trim()}
              >
                <FaCheckCircle /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Preview Modal --- */}
      {previewPuzzle && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4>{previewPuzzle.title}</h4>
              <button onClick={() => setPreviewPuzzle(null)}><FaTimesCircle /></button>
            </div>
            <div className={styles.boardContainer}>
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
                disabled={(() => {
                  const owner = getChapterForPuzzle(previewPuzzle._id);
                  return owner && owner.id !== activeChapterId;
                })()}
              >
                {getChapterForPuzzle(previewPuzzle._id)?.id === activeChapterId ? "Remove from Chapter" : "Add to Chapter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateCompetition;