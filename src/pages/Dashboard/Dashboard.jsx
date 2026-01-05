import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { competitionAPI } from "../../services/api";
import styles from "./Dashboard.module.css";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaCalendarAlt,
  FaClock,
  FaPuzzlePiece,
  FaUserFriends,
  FaTrophy,
  FaChevronRight
} from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();
  const { isUserAuthenticated } = useAuth();

  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [filteredCompetitions, setFilteredCompetitions] = useState([]);

  // Fetch Competitions
  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await competitionAPI.getAll();
      if (response.success && Array.isArray(response.data)) {
        const formattedCompetitions = response.data.map((comp) => {
          const startDate = new Date(comp.startTime);
          const endDate = new Date(comp.endTime);
          const now = new Date();

          let status = "Upcoming";
          if (now < startDate) status = "Upcoming";
          else if (now >= startDate && now <= endDate) status = "Live";
          else status = "Ended";

          const durationMs = endDate - startDate;
          const durationMins = Math.floor(durationMs / 60000);
          const durationText =
            durationMins > 60
              ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
              : `${durationMins}m`;

          return {
            id: comp._id,
            _id: comp._id,
            title: comp.title || "Untitled Competition",
            dateDisplay: formatDateRange(comp.startTime),
            startDate: comp.startTime,
            endDate: comp.endTime,
            participants: comp.participants?.length || 0,
            maxPlayers: comp.maxPlayers || 100,
            status,
            puzzlesCount: comp.puzzles?.length || 0,
            durationText,
          };
        });

        // Sort: Live -> Upcoming -> Ended
        const sorted = formattedCompetitions.sort((a, b) => {
          const statusOrder = { Live: 1, Upcoming: 2, Ended: 3 };
          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
          }
          return new Date(a.startDate) - new Date(b.startDate);
        });

        setCompetitions(sorted);
      } else {
        setCompetitions([]);
      }
    } catch (err) {
      console.error("Failed to fetch competitions:", err);
      setError("Failed to load competitions.");
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  useEffect(() => {
    if (activeTab === "All") {
      setFilteredCompetitions(competitions);
    } else {
      setFilteredCompetitions(
        competitions.filter((c) => c.status.toLowerCase() === activeTab.toLowerCase())
      );
    }
  }, [activeTab, competitions]);

  const formatDateRange = (startDate) => {
    if (!startDate) return "TBA";
    const start = new Date(startDate);
    return start.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const handleParticipate = (competition) => {
    if (!isUserAuthenticated) {
      navigate("/", { state: { openLogin: true } });
      return;
    }
    if (competition.status === "Ended") {
      navigate(`/leaderboard/${competition._id}`);
    } else {
      navigate(`/competition/${competition._id}/lobby`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Puzzle Arena</h1>
          <p>Compete in real-time chess puzzle battles</p>
        </div>

        {/* Scrollable Filter Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.filterTabs}>
            {["All", "Live", "Upcoming", "Ended"].map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
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
            <h3>No Competitions</h3>
            <p>Check back later for new tournaments.</p>
          </div>
        ) : (
          <div className={styles.tournamentList}>
            {filteredCompetitions.map((comp) => (
              <div
                key={comp.id}
                className={`${styles.card} ${styles[comp.status.toLowerCase()]}`}
                onClick={() => handleParticipate(comp)}
              >
                {/* Mobile: Top Row (Status Badge) */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleSection}>
                    <h3 className={styles.cardTitle}>{comp.title}</h3>
                    <span className={`${styles.statusBadge} ${styles[`badge${comp.status}`]}`}>
                      {comp.status}
                    </span>
                  </div>
                  <FaChevronRight className={styles.cardArrow} />
                </div>

                {/* Grid Info Section */}
                <div className={styles.cardInfoGrid}>
                  <div className={styles.infoItem}>
                    <FaCalendarAlt className={styles.infoIcon} />
                    <span>{comp.dateDisplay}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <FaClock className={styles.infoIcon} />
                    <span>{comp.durationText}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <FaPuzzlePiece className={styles.infoIcon} />
                    <span>{comp.puzzlesCount} Puzzles</span>
                  </div>
                  <div className={styles.infoItem}>
                    <FaUserFriends className={styles.infoIcon} />
                    <span>{comp.participants} Players</span>
                  </div>
                </div>

                {/* Action Button (Visible on Desktop mostly, or bottom of card) */}
                <div className={styles.cardAction}>
                  <button className={styles.actionBtn}>
                    {comp.status === "Ended" ? "View Results" : "Enter Lobby"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;