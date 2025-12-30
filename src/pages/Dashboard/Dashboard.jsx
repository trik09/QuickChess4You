import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { competitionAPI } from "../../services/api";
import TournamentCard from "../../components/TournamentCard/TournamentCard";
import styles from "./Dashboard.module.css";
import { useAuth } from "../../contexts/AuthContext";

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
  const [filter, setFilter] = useState("all"); // all, upcoming, live, completed

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await competitionAPI.getAll();
      if (response.success && Array.isArray(response.data)) {
        // Use backend data directly
        setCompetitions(response.data);
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


  const joinAndProceed = async (competition, accessCode = null) => {
    try {
      await competitionAPI.joinCompetition(competition._id, accessCode);

      // Navigate to Lobby after joining (Project Requirement)
      navigate(`/competition/${competition._id}/lobby`);

    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Failed to join competition";

      if (message.toLowerCase().includes("already")) {
        // If already joined, just go to lobby
        navigate(`/competition/${competition._id}/lobby`);
      } else if (err?.response?.status === 403 && err?.response?.data?.requireCode) {
        // Should have been handled by UI but double check
        setCodeError("Access code required");
      } else {
        setError(message);
      }
    }
  };

  const handleJoin = (competition) => {
    if (!isUserAuthenticated) {
      navigate("/", { state: { openLogin: true } });
      return;
    }

    // Check for Access Code
    if (competition.accessCode) {
      setSelectedCompForCode(competition);
      setAccessCodeInput("");
      setCodeError("");
      setShowCodeModal(true);
      return;
    }

    joinAndProceed(competition);
  };

  const handleView = (competition) => {
    // Navigate to Lobby in View/Result mode
    navigate(`/competition/${competition._id}/lobby`);
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (accessCodeInput) {
      // We can't verify code client side if hashed (it's not hash currently but safer to let backend do it)
      // But current controller checks equality. 
      // For better UX we try to join.
      try {
        await joinAndProceed(selectedCompForCode, accessCodeInput);
        setShowCodeModal(false);
      } catch (err) {
        setCodeError("Incorrect access code or failed to join.");
      }
    }
  };

  // Filter competitions
  const filteredCompetitions = competitions.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Tournaments</h1>
          <p>Join exciting chess competitions and compete with players worldwide</p>

          <div className={styles.filters}>
            {['all', 'upcoming', 'live', 'completed'].map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.activeFilter : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Modal for Access Code */}
        {showCodeModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h3>Enter Access Code</h3>
              <p>This competition is password protected.</p>
              <form onSubmit={handleCodeSubmit}>
                <input
                  type="text"
                  placeholder="Enter Code"
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value)}
                  className={styles.codeInput}
                  autoFocus
                />
                {codeError && <p className={styles.errorMsg}>{codeError}</p>}
                <div className={styles.modalActions}>
                  <button type="button" onClick={() => setShowCodeModal(false)} className={styles.cancelBtn}>Cancel</button>
                  <button type="submit" className={styles.submitBtn}>Join</button>
                </div>
              </form>
            </div>
          </div>
        )}

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
            <span className={styles.emptyIcon}>🏆</span>
            <h3>No Competitions Found</h3>
            <p>Adjust filters or check back later!</p>
          </div>
        ) : (
          <div className={styles.tournamentList}>
            {filteredCompetitions.map((competition) => (
              <TournamentCard
                key={competition._id}
                competition={competition}
                onJoin={handleJoin}
                onView={handleView}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
