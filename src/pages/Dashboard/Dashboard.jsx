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
} from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();
  const { isUserAuthenticated } = useAuth();

  // Access Code Modal State
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedCompForCode, setSelectedCompForCode] = useState(null);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

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
          let canParticipate = false;

          if (now < startDate) {
            status = "Upcoming";
            canParticipate = false;
          } else if (now >= startDate && now <= endDate) {
            status = "Live";
            canParticipate = true;
          } else {
            status = "ENDED";
            canParticipate = false;
          }

          // Calculate duration display
          const durationMs = endDate - startDate;
          const durationMins = Math.floor(durationMs / 60000);
          const durationText =
            durationMins > 60
              ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
              : `${durationMins}m`;

          return {
            id: comp._id,
            _id: comp._id,
            title: comp.title || comp.name || "Untitled Competition",
            dateDisplay: formatDateRange(comp.startTime),
            startDate: comp.startTime,
            endDate: comp.endTime,
            participants: comp.participants?.length || 0,
            maxPlayers: comp.maxPlayers || 100,
            prize: comp.prize || "TBA",
            status, // Live, Upcoming, ENDED
            canParticipate,
            puzzles: comp.puzzles || [],
            durationText,
            description: comp.description || "",
            accessCode: comp.accessCode,
          };
        });

        // Sort: Live first, then Upcoming (soonest first), then ENDED (recent first)
        const sorted = formattedCompetitions.sort((a, b) => {
          if (a.status === "Live" && b.status !== "Live") return -1;
          if (b.status === "Live" && a.status !== "Live") return 1;
          if (a.status === "Upcoming" && b.status === "ENDED") return -1;
          if (b.status === "Upcoming" && a.status === "ENDED") return 1;
          return new Date(b.startDate) - new Date(a.startDate);
        });

        setCompetitions(sorted);
      } else {
        setCompetitions([]);
      }
    } catch (err) {
      console.error("Failed to fetch competitions:", err);
      setError("Failed to load competitions. Please try again.");
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  // Update filtered list when tab or competitions change
  useEffect(() => {
    if (activeTab === "All") {
      setFilteredCompetitions(competitions);
    } else {
      setFilteredCompetitions(
        competitions.filter((c) => c.status === activeTab)
      );
    }
  }, [activeTab, competitions]);

  // Real-time status update
  useEffect(() => {
    const timer = setInterval(() => {
      // Refetch or update status locally
      // For simplicity, let's refetch every 30s or rely on local time comparison
      // Updating local state status logic:
      setCompetitions((prev) =>
        prev.map((comp) => {
          const start = new Date(comp.startDate);
          const end = new Date(comp.endDate);
          const now = new Date();
          let newStatus = comp.status;
          if (now < start) newStatus = "Upcoming";
          else if (now >= start && now <= end) newStatus = "Live";
          else newStatus = "ENDED";

          return newStatus !== comp.status
            ? { ...comp, status: newStatus }
            : comp;
        })
      );
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const formatDateRange = (startDate) => {
    if (!startDate) return "TBA";
    const start = new Date(startDate);
    // Format: 30 Dec, 15:07
    return start.toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Image uses 24h format? "15:07", "14:20". Yes.
    });
  };

  const handleParticipate = (competition) => {
    if (!isUserAuthenticated) {
      navigate("/", { state: { openLogin: true } });
      return;
    }

    if (competition.status === "ENDED") {
      navigate(`/leaderboard/${competition._id}`);
      return;
    }

    // Access code check if needed (handled in Lobby usually, but here we just go to Lobby)
    navigate(`/competition/${competition._id}/lobby`);
  };

  // Helper for status badge style
  const getStatusStyle = (status) => {
    switch (status) {
      case "Live":
        return styles.statusLive;
      case "Upcoming":
        return styles.statusUpcoming;
      case "ENDED":
        return styles.statusENDED;
      default:
        return "";
    }
  };

  // Helper for border color style class
  const getBorderStyle = (status) => {
    switch (status) {
      case "Live":
        return styles.borderLive;
      case "Upcoming":
        return styles.borderUpcoming;
      case "ENDED":
        return styles.borderENDED;
      default:
        return "";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Tournaments</h1>
          <p>
            Join exciting chess competitions and compete with players worldwide
          </p>
        </div>

        {/* Filter Tabs */}
        <div className={styles.filterTabs}>
          {["All", "Upcoming", "Live", "ENDED"].map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ""
                }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading competitions...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={fetchCompetitions} className={styles.retryBtn}>
              Try Again
            </button>
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No Competitions Found</h3>
            <p>Try changing the filter or check back later.</p>
          </div>
        ) : (
          <div className={styles.tournamentList}>
            {filteredCompetitions.map((comp) => (
              <div
                key={comp.id}
                className={`${styles.card} ${getBorderStyle(comp.status)}`}
              >
                <div className={styles.cardLeft}>
                  <h3 className={styles.cardTitle}>{comp.title}</h3>
                  <div className={styles.cardDetails}>
                    <div className={styles.detailItem}>
                      <FaCalendarAlt />
                      <span>{comp.dateDisplay}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <FaClock />
                      <span>{comp.durationText}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <FaPuzzlePiece />
                      <span>{comp.puzzles.length} Puzzles</span>
                    </div>
                    <div className={styles.detailItem}>
                      <FaUserFriends />
                      <span>{comp.participants}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardRight}>
                  <span
                    className={`${styles.statusBadge} ${getStatusStyle(
                      comp.status
                    )}`}
                  >
                    {comp.status.toUpperCase()}
                  </span>
                  <button
                    className={styles.viewBtn}
                    onClick={() => handleParticipate(comp)}
                  >
                    View
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
