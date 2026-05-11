import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { competitionAPI, eventAPI } from "../../services/api";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import PageHeader from "../../components/PageHeader/PageHeader";
import styles from "./Dashboard.module.css";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaCalendarAlt,
  FaClock,
  FaPuzzlePiece,
  FaUserFriends,
  FaTrophy,
  FaChevronRight,
  FaChartBar,
  FaEye,
  FaArrowLeft,
  FaArrowRight,
  FaThLarge,
  FaThList,
  FaBolt,
  FaRocket,
  FaFlask,
  FaHistory,
  FaStar,
  FaGamepad,
  FaSearch,
  FaFilter
} from "react-icons/fa";

function Dashboard({ isEvent = false }) {
  const navigate = useNavigate();
  const { isUserAuthenticated } = useAuth();

  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [filteredCompetitions, setFilteredCompetitions] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state - now managed by backend
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 10;

  const formatDate = (dateString) => {
    if (!dateString) return "TBA";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", { month: "short", day: "numeric" });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  // Helper: format a raw competition object into the display shape
  const formatComp = useCallback((comp) => {
    const startDate = new Date(comp.startTime);
    const endDate = new Date(comp.endTime);
    const now = new Date();
    const backendStatus = (comp.status || "").toLowerCase();

    let status;
    if (now < startDate) {
      status = "Upcoming";
    } else if (now >= startDate && now <= endDate) {
      status = backendStatus === "ended" ? "Ended" : "Live";
    } else {
      status = "Ended";
    }

    const durationMs = endDate - startDate;
    const durationMins = Math.floor(durationMs / 60000);
    const durationText =
      durationMins > 60
        ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
        : `${durationMins}m`;

    return {
      id: comp._id,
      _id: comp._id,
      title: comp.name || comp.title || "Untitled Competition",
      dateDisplay: `${formatDate(comp.startTime)} ${formatTime(comp.startTime)}`,
      startDate: comp.startTime,
      endDate: comp.endTime,
      participants: comp.participantCount ?? comp.participants?.length ?? 0,
      maxPlayers: comp.maxPlayers || 100,
      status,
      puzzlesCount: comp.puzzles?.length || 0,
      durationText,
      startTimeText: formatTime(comp.startTime),
      startDateText: formatDate(comp.startTime),
    };
  }, []);

  // Helper: sort by Live → Upcoming (soonest first) → Ended (most recent first)
  const sortCompetitions = (list) =>
    [...list].sort((a, b) => {
      const statusOrder = { Live: 1, Upcoming: 2, Ended: 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      if (a.status === "Ended") {
        return new Date(b.endDate || b.startDate) - new Date(a.endDate || a.startDate);
      }
      return new Date(a.startDate) - new Date(b.startDate);
    });

  // Fetch Competitions/Events with backend pagination
  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const searchParam = searchQuery.trim() ? { search: searchQuery.trim() } : {};

      if (activeTab === "All") {
        // ── "All" tab: same data as Live + Upcoming + Ended tabs combined.
        // Fire three parallel requests using the exact same params each tab uses.
        const now = new Date();
        const oneWeekFromNow = new Date(now);
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

        const callAPI = (params) =>
          isEvent ? eventAPI.getAll(params) : competitionAPI.getAll(params);

        const [liveRes, upcomingRes, endedRes] = await Promise.allSettled([
          callAPI({ status: "live", limit: 100, ...searchParam }),
          callAPI({ status: "upcoming", limit: 100, startBefore: oneWeekFromNow.toISOString(), ...searchParam }),
          callAPI({ status: "ended", limit: 100, ...searchParam }),
        ]);

        const extract = (res) =>
          res.status === "fulfilled" && res.value?.success && Array.isArray(res.value.data)
            ? res.value.data
            : [];

        const rawAll = [...extract(liveRes), ...extract(upcomingRes), ...extract(endedRes)];

        // De-duplicate by _id
        const seen = new Set();
        const unique = rawAll.filter((c) => {
          if (seen.has(c._id)) return false;
          seen.add(c._id);
          return true;
        });

        // Sort: Live first → Upcoming soonest first → Ended most recent first
        const sorted = sortCompetitions(unique.map(formatComp));

        // Client-side pagination
        const total = sorted.length;
        const pages = Math.max(1, Math.ceil(total / itemsPerPage));
        const safePage = Math.min(currentPage, pages);
        const sliced = sorted.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

        setCompetitions(sorted);
        setFilteredCompetitions(sliced);
        setTotalPages(pages);
        setTotalRecords(total);
        return; // ← done for "All" tab
      }

      // ── Single-status tabs (Live / Upcoming / Ended) ──────────────────────
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...searchParam,
      };

      if (activeTab === "Live") {
        params.status = "live";
      } else if (activeTab === "Upcoming") {
        params.status = "upcoming";
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        params.startBefore = oneWeekFromNow.toISOString();
      } else if (activeTab === "Ended") {
        params.status = "ended";
      }

      const response = isEvent
        ? await eventAPI.getAll(params)
        : await competitionAPI.getAll(params);

      if (response.success && Array.isArray(response.data)) {
        const formatted = response.data.map(formatComp);

        // Client-side status guard (clock may reclassify edge cases)
        let filtered = formatted;
        if (activeTab === "Live") filtered = formatted.filter((c) => c.status === "Live");
        else if (activeTab === "Upcoming") filtered = formatted.filter((c) => c.status === "Upcoming");
        else if (activeTab === "Ended") filtered = formatted.filter((c) => c.status === "Ended");

        const sorted = sortCompetitions(filtered);
        setCompetitions(sorted);
        setFilteredCompetitions(sorted);

        if (response.pagination) {
          setTotalPages(response.pagination.total || 1);
          setTotalRecords(response.pagination.totalRecords || sorted.length);
        } else {
          setTotalPages(1);
          setTotalRecords(sorted.length);
        }
      } else {
        setCompetitions([]);
        setFilteredCompetitions([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error(`Failed to fetch ${isEvent ? "events" : "competitions"}:`, err);
      setError(`Failed to load ${isEvent ? "events" : "competitions"}.`);
      setCompetitions([]);
      setFilteredCompetitions([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [isEvent, currentPage, activeTab, searchQuery, formatComp]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [activeTab, searchQuery]);

  // Backend handles pagination, so we use the full filtered list
  const currentCompetitions = filteredCompetitions;

  const getArenaIcon = (title, index) => {
    const icons = [
      { icon: <FaBolt />, bg: 'rgba(255, 215, 0, 0.1)', color: '#ffcc00' },
      { icon: <FaTrophy />, bg: 'rgba(255, 69, 0, 0.1)', color: '#ff6b6b' },
      { icon: <FaPuzzlePiece />, bg: 'rgba(30, 144, 255, 0.1)', color: '#4dabf7' },
      { icon: <FaRocket />, bg: 'rgba(255, 20, 147, 0.1)', color: '#f783ac' },
      { icon: <FaFlask />, bg: 'rgba(50, 205, 50, 0.1)', color: '#69db7c' },
      { icon: <FaStar />, bg: 'rgba(255, 165, 0, 0.1)', color: '#ffa94d' },
      { icon: <FaGamepad />, bg: 'rgba(103, 58, 183, 0.1)', color: '#b197fc' },
      { icon: <FaCalendarAlt />, bg: 'rgba(0, 188, 212, 0.1)', color: '#66d9e8' },
    ];

    // Deterministic selection based on title hash or just index
    const iconIndex = (title.length + index) % icons.length;
    return icons[iconIndex];
  };

  const handleParticipate = (competition) => {
    if (!isUserAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent(isEvent ? `/event/${competition._id}/lobby` : `/competition/${competition._id}/lobby`)}`);
      return;
    }
    if (competition.status === "Ended") {
      navigate(isEvent ? `/event-leaderboard/${competition._id}` : `/leaderboard/${competition._id}`);
    } else {
      navigate(isEvent ? `/event/${competition._id}/lobby` : `/competition/${competition._id}/lobby`);
    }
  };

  // PERFORMANCE: Prefetch lobby data when user hovers over a tournament card
  const prefetchedRef = new Set();
  const handlePrefetch = (competitionId) => {
    if (prefetchedRef.has(competitionId)) return;
    prefetchedRef.add(competitionId);
    if (!isEvent) {
      liveCompetitionAPI.getLobbyState(competitionId).catch(() => { });
    }
  };

  const handleViewPuzzles = (e, competition) => {
    e.stopPropagation();
    if (!isUserAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent(isEvent ? `/live-event/${competition._id}` : `/competition/${competition._id}/puzzle`)}`);
      return;
    }
    navigate(isEvent ? `/live-event/${competition._id}` : `/competition/${competition._id}/puzzle`, { state: { reviewMode: true } });
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <PageHeader
            title={isEvent ? "Events Arena" : "Puzzle Arena"}
            subtitle={isEvent ? "Register and compete in real-time chess events" : "Compete in real-time chess puzzle battles"}
            icon={<FaTrophy />}
          />
          <div className={styles.viewModeToggle}>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <FaThList />
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <FaThLarge />
            </button>

          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className={styles.controlsRow}>
          <div className={styles.filterTabs}>
            {["Upcoming", "Live", "Ended", "All"].map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "Live" && <span className={styles.tabDot} style={{ backgroundColor: '#22c55e' }}></span>}
                {tab === "Upcoming" && <span className={styles.tabDot} style={{ backgroundColor: '#3b82f6' }}></span>}
                {tab}
              </button>
            ))}
          </div>

          <div className={styles.searchWrapper}>
            <div className={styles.searchInputGroup}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search arenas..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className={styles.filterBtn}>
              <FaFilter />
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading Arena...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={fetchCompetitions} className={styles.retryBtn}>Retry</button>
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <div className={styles.emptyState}>
            <FaTrophy className={styles.emptyIcon} />
            <h3>No {isEvent ? "Events" : "Competitions"} Found</h3>
            <p>There are no {isEvent ? "events" : "tournaments"} in this category right now.</p>
          </div>
        ) : (
          viewMode === 'list' ? (
            <div className={styles.arenaTableWrapper}>
              <table className={styles.arenaTable}>
                <thead>
                  <tr>
                    <th>Arena</th>
                    <th>Status</th>
                    <th>Start Time</th>
                    <th>Duration</th>
                    <th>Players</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCompetitions.map((comp, idx) => {
                    const arenaStyle = getArenaIcon(comp.title, idx);
                    return (
                      <tr key={comp.id} onClick={() => handleParticipate(comp)} className={styles.tableRow}>
                        <td>
                          <div className={styles.arenaNameCell}>
                            <div className={styles.arenaIcon} style={{ backgroundColor: arenaStyle.bg, color: arenaStyle.color }}>
                              {arenaStyle.icon}
                            </div>
                            <div className={styles.arenaInfo}>
                              <span className={styles.arenaTitle}>{comp.title}</span>
                              <span className={styles.arenaSubtitle}>
                                {comp.status === 'Live' ? 'Compete now and win!' :
                                  comp.status === 'Upcoming' ? 'Get ready for the challenge.' :
                                    'Tournament finished.'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.statusColumn}>
                            <span className={`${styles.modernBadge} ${styles[`modernBadge${comp.status}`]}`}>
                              {comp.status === 'Live' && <span className={styles.liveDot}></span>}
                              {comp.status}
                            </span>

                          </div>
                        </td>
                        <td>
                          <div className={styles.timeColumn}>
                            <div className={styles.timeMain}>
                              <FaCalendarAlt /> {comp.startDateText}
                            </div>
                            <div className={styles.timeSub}>
                              {comp.startTimeText}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.simpleIconBox}>
                            <FaClock />
                            <span>{comp.durationText}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.simpleIconBox}>
                            <FaUserFriends />
                            <span>{comp.participants}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.tableActionCell} onClick={e => e.stopPropagation()}>
                            {comp.status === "Ended" ? (
                              <div className={styles.actionGroupHorizontal}>
                                <button
                                  className={styles.modernAnalyzeBtn}
                                  onClick={(e) => handleViewPuzzles(e, comp)}
                                >
                                  Analyze <FaEye />
                                </button>
                                <button
                                  className={styles.modernResultsBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(isEvent ? `/event-leaderboard/${comp._id}` : `/leaderboard/${comp._id}`);
                                  }}
                                >
                                  Results <FaChartBar />
                                </button>
                              </div>
                            ) : comp.status === "Live" ? (
                              <button
                                className={styles.modernJoinBtn}
                                onClick={(e) => { e.stopPropagation(); handleParticipate(comp); }}
                              >
                                Join Now <FaChevronRight />
                              </button>
                            ) : (
                              <button
                                className={styles.modernLobbyBtn}
                                onClick={(e) => { e.stopPropagation(); handleParticipate(comp); }}
                              >
                                Enter Lobby <FaChevronRight />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.tournamentList}>
              {currentCompetitions.map((comp) => (
                <div
                  key={comp.id}
                  className={`${styles.card} ${styles[comp.status.toLowerCase()]}`}
                  onClick={() => handleParticipate(comp)}
                  onMouseEnter={() => comp.status !== 'Ended' && handlePrefetch(comp._id)}
                >
                  <div className={styles.cardMain}>
                    {/* Header: Status + Title */}
                    <div className={styles.cardHeader}>
                      <span className={`${styles.statusBadge} ${styles[`badge${comp.status}`]}`}>
                        {comp.status === 'Live' && <span className={styles.liveDot}></span>}
                        {comp.status}
                      </span>
                      <h3 className={styles.cardTitle}>{comp.title}</h3>
                    </div>

                    {/* Metadata Grid */}
                    <div className={styles.metaGrid}>
                      <div className={styles.metaItem}>
                        <FaCalendarAlt className={styles.metaIcon} />
                        <span>{comp.dateDisplay}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <FaClock className={styles.metaIcon} />
                        <span>{comp.durationText}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <FaPuzzlePiece className={styles.metaIcon} />
                        <span>{comp.puzzlesCount} Puzzles</span>
                      </div>
                      <div className={styles.metaItem}>
                        <FaUserFriends className={styles.metaIcon} />
                        <span>{comp.participants} Players</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer / Actions */}
                  <div className={styles.cardFooter}>
                    {comp.status === "Ended" ? (
                      <div className={styles.actionGroup}>
                        <button
                          className={`${styles.actionBtn} ${styles.outlineBtn}`}
                          onClick={(e) => handleViewPuzzles(e, comp)}
                        >
                          <FaEye /> Analyze
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.primaryBtn}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(isEvent ? `/event-leaderboard/${comp._id}` : `/leaderboard/${comp._id}`);
                          }}
                        >
                          <FaChartBar /> Leaderboard
                        </button>
                      </div>
                    ) : (
                      <div className={styles.actionGroup}>
                        <button className={`${styles.actionBtn} ${styles.primaryBtn} ${styles.fullWidthBtn}`}>
                          {comp.status === 'Live' ? 'Join Now' : 'Enter Lobby'} <FaChevronRight />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Pagination Controls */}
        {!loading && !error && totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <FaArrowLeft />
            </button>
            <span className={styles.pageInfo}>
              Page {currentPage} of {totalPages} 
             {/*  Page {currentPage} of {totalPages} ({totalRecords} total) */}
            </span>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <FaArrowRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;