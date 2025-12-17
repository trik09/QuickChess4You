import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { competitionAPI } from "../../services/api";
import styles from "./Dashboard.module.css";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCompetitions();
  }, []);

  // 🔥 Update UI every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCompetitions((prev) => [...prev]); // forces UI re-render
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchCompetitions = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await competitionAPI.getAll();
      console.log("Raw API Response:", response);
      if (response.success && Array.isArray(response.data)) {
        console.log("First competition from API:", response.data[0]);
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
            status = "Completed";
            canParticipate = false;
          }

          console.log(
            `Competition "${comp.name}" - Duration from backend:`,
            comp.duration
          );

          return {
            id: comp._id,
            _id: comp._id,
            title: comp.title || comp.name || "Untitled Competition",
            date: formatDateRange(comp.startTime, comp.endTime),
            startDate: comp.startTime,
            endDate: comp.endTime,
            participants: comp.participants?.length || comp.maxPlayers || 0,
            maxPlayers: comp.maxPlayers || 100,
            prize: comp.prize || "TBA",
            status,
            canParticipate,
            puzzles: comp.puzzles || [],
            duration: comp.duration, // Competition duration in minutes
            description: comp.description || "",
          };
        });

        setCompetitions(formattedCompetitions);
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
  };

  // Format date range
  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return "Date TBA";

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    const options = { month: "short", day: "numeric", year: "numeric" };
    const startStr = start.toLocaleDateString("en-US", options);

    if (!end || start.toDateString() === end.toDateString()) return startStr;

    if (
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      return `${start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}-${end.getDate()}, ${end.getFullYear()}`;
    }

    const endStr = end.toLocaleDateString("en-US", options);
    return `${startStr} - ${endStr}`;
  };

  // 🔥 REAL-TIME COUNTDOWN FUNCTION
  const getTimeRemaining = (startDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const diff = start - now;

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const handleParticipate = (competition) => {
    if (!competition.canParticipate) return;
    console.log("Navigating with competition duration:", competition.duration);
    navigate(`/competition/${competition._id}/puzzle`, {
      state: {
        competitionId: competition._id,
        competitionTitle: competition.title,
        puzzles: competition.puzzles,
        time: competition.duration,
      },
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Live":
        return styles.statusLive;
      case "Completed":
        return styles.statusCompleted;
      default:
        return styles.statusUpcoming;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Competitions</h1>
          <p>
            Join exciting chess competitions and compete with players worldwide
          </p>
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
        ) : competitions.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🏆</span>
            <h3>No Competitions Available</h3>
            <p>Check back later for upcoming competitions!</p>
          </div>
        ) : (
          <div className={styles.tournamentGrid}>
            {competitions
              .filter((competition) => competition.status !== "Completed")
              .map((competition) => (
                <div key={competition.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span
                      className={`${styles.status} ${getStatusClass(
                        competition.status
                      )}`}
                    >
                      {competition.status}
                    </span>
                  </div>

                  <h3 className={styles.cardTitle}>{competition.title}</h3>

                  <div className={styles.cardInfo}>
                    <div className={styles.infoItem}>
                      <span className={styles.icon}>📅</span>
                      <span>{competition.date}</span>
                    </div>

                    <div className={styles.infoItem}>
                      <span className={styles.icon}>👥</span>
                      <span>
                        {competition.participants}/{competition.maxPlayers}{" "}
                        Players
                      </span>
                    </div>

                    {competition.prize !== "TBA" && (
                      <div className={styles.infoItem}>
                        <span className={styles.icon}>🏆</span>
                        <span>{competition.prize}</span>
                      </div>
                    )}

                    <div className={styles.infoItem}>
                      <span className={styles.icon}>🧩</span>
                      <span>{competition.puzzles?.length || 0} Puzzles</span>
                    </div>

                    {/* 🔥 LIVE COUNTDOWN */}
                    {competition.status === "Upcoming" &&
                      competition.startDate && (
                        <div className={styles.timeRemaining}>
                          <span className={styles.icon}>⏰</span>
                          <span>{getTimeRemaining(competition.startDate)}</span>
                        </div>
                      )}
                  </div>

                  <button
                    className={`${styles.participateBtn} ${
                      !competition.canParticipate ? styles.disabledBtn : ""
                    }`}
                    onClick={() => handleParticipate(competition)}
                    disabled={!competition.canParticipate}
                  >
                    {competition.status === "Upcoming"
                      ? "Coming Soon"
                      : competition.status === "Completed"
                      ? "View Results"
                      : "Participate"}
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
