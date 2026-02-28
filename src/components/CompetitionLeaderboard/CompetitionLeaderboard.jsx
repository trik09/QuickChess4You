import React, { useState, useEffect } from "react";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import socketService from "../../services/socketService";
import {
  FaTrophy,
  FaMedal,
  FaUserCircle,
  FaSync,
  FaPuzzlePiece,
} from "react-icons/fa";
import "./CompetitionLeaderboard.css";

const CompetitionLeaderboard = ({
  competitionId,
  isLive = false,
  theme = "dark",
}) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  /* =====================================================
     EFFECT
  ===================================================== */
  useEffect(() => {
    if (!competitionId) return;

    if (!isLive) {
      loadLeaderboard();
    } else {
      ensureParticipation();
      setupLiveUpdates();
    }

    return () => {
      cleanup();
    };
  }, [competitionId, isLive]);

  /* =====================================================
     ENSURE PARTICIPATION (LIVE ONLY)
  ===================================================== */
  const ensureParticipation = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

      if (!user?.id || !token) return;

      await liveCompetitionAPI.participate(
        competitionId,
        user.username || user.name
      );

      // ❌ NO leaderboard reload here
      // Socket will handle everything
    } catch (error) {
      // User already participating — ignore
    }
  };

  /* =====================================================
     HTTP LEADERBOARD (NON-LIVE ONLY)
  ===================================================== */
  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      const response = await liveCompetitionAPI.getLeaderboard(
        competitionId
      );

      if (response.success) {
        setLeaderboard(response.leaderboard);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     SOCKET LIVE UPDATES
  ===================================================== */
  const setupLiveUpdates = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = socketService.connect();

    socket.on("connect", () => {
      setIsConnected(true);

      socket.emit("joinCompetition", {
        competitionId,
      });
    });

    socket.on("competitionJoined", (data) => {
      setLeaderboard(data.leaderboard || []);
      setLastUpdate(new Date());
      setLoading(false);
    });

    socket.on("leaderboardUpdate", (data) => {
      setLeaderboard(data || []);
      setLastUpdate(new Date());
      setLoading(false);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });
  };

  /* =====================================================
     CLEANUP (IMPORTANT)
  ===================================================== */
  const cleanup = () => {
    const socket = socketService.getSocket?.();

    if (socket) {
      socket.off("connect");
      socket.off("competitionJoined");
      socket.off("leaderboardUpdate");
      socket.off("disconnect");
    }

    socketService.disconnect?.();
    setIsConnected(false);
  };

  /* =====================================================
     RENDER HELPERS
  ===================================================== */
  const getRankStart = (rank) => {
    switch (rank) {
      case 1:
        return (
          <div className="rank-icon gold">
            <FaTrophy />
          </div>
        );
      case 2:
        return (
          <div className="rank-icon silver">
            <FaMedal />
          </div>
        );
      case 3:
        return (
          <div className="rank-icon bronze">
            <FaMedal />
          </div>
        );
      default:
        return <div className="rank-number">#{rank}</div>;
    }
  };

  /* =====================================================
     LOADING STATE
  ===================================================== */
  if (loading) {
    return (
      <div className="competition-leaderboard loading">
        <div className="loading-pulse"></div>
        <p>Fetching rankings...</p>
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */
  return (
    <div
      className={`competition-leaderboard ${
        theme === "light" ? "light-theme" : ""
      }`}
    >
      <div className="leaderboard-header-stylish">
        <div className="header-content">
          <h3>Top Performers</h3>
          <p className="subtitle">
            {isLive ? "Live Updates" : "Final Results"}
          </p>
        </div>

        {!isLive && (
          <button
            className="refresh-btn-stylish"
            onClick={loadLeaderboard}
          >
            <FaSync className={loading ? "spinning" : ""} />
          </button>
        )}
      </div>

      <div className="leaderboard-list-stylish">
        {leaderboard.length > 0 ? (
          leaderboard.slice(0, 50).map((participant, index) => (
            <div
              key={participant.userId}
              className={`leaderboard-card ${
                participant.userId === currentUser?.id
                  ? "current-user-card"
                  : ""
              } rank-${participant.rank}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="card-left">
                <div className="rank-display">
                  {getRankStart(participant.rank)}
                </div>

                <div className="user-info">
                  <span className="user-avatar">
                    <FaUserCircle />
                  </span>

                  <span className="username">
                    {participant.username}
                  </span>

                  {participant.userId === currentUser?.id && (
                    <span className="you-badge">YOU</span>
                  )}
                </div>
              </div>

              <div className="card-right">
                <div className="stat-group primary">
                  <div className="stat-value">
                    {participant.score}
                  </div>
                  <div className="stat-label">PTS</div>
                </div>

                <div className="stat-divider"></div>

                <div className="stat-group">
                  <div className="stat-value">
                    <FaPuzzlePiece className="icon-small" />{" "}
                    {participant.puzzlesSolved || 0}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state-stylish">
            <div className="empty-icon">
              <FaTrophy />
            </div>
            <h3>No Participants Yet</h3>
            <p>Be the first to join and solve puzzles!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionLeaderboard;