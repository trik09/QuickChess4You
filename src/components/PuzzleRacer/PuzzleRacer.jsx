import React, { useMemo, useState, useEffect } from "react";
import { FaFlagCheckered } from "react-icons/fa";
import { useLiveCompetition } from "../../contexts/LiveCompetitionContext";
import { useAuth } from "../../contexts/AuthContext";
import "./PuzzleRacer.css";

const PuzzleRacer = () => {
  const { leaderboard, competition, participant } = useLiveCompetition();
  const { user } = useAuth();
  const [isBoosting, setIsBoosting] = useState(false);
  const [prevScore, setPrevScore] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Mark as loaded once we have competition data
  useEffect(() => {
    if (competition) {
      // Small delay to ensure smooth rendering
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [competition]);

  // Detect score increase to trigger boost animation
  useEffect(() => {
    if (participant && participant.score > prevScore) {
      setIsBoosting(true);
      const timer = setTimeout(() => setIsBoosting(false), 2000); // 2s Turbo Boost
      setPrevScore(participant.score);
      return () => clearTimeout(timer);
    }
    // Sync score on initial load without boosting
    if (participant && prevScore === 0 && participant.score > 0) {
      setPrevScore(participant.score);
    }
  }, [participant, prevScore]);

  const totalPuzzles = useMemo(() => {
    if (competition?.puzzles && competition.puzzles.length)
      return competition.puzzles.length;
    return 10; // Default fallback
  }, [competition]);

  const racers = useMemo(() => {
    const currentUserId = user ? user.id || user._id : null;

    // If no leaderboard yet, show at least current user if we have participant data
    if (!leaderboard || leaderboard.length === 0) {
      if (participant && user) {
        return [
          {
            userId: currentUserId,
            username: user.username || user.name || "You",
            rank: 1,
            score: participant.score || 0,
            puzzlesSolved: participant.puzzlesSolved || 0,
            lastActivity: Date.now(),
          },
        ];
      }
      return [];
    }

    // 1. Strict Activity Filter: Only show active users (Last 10 mins) OR Me
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    const activeRacers = leaderboard.filter((r) => {
      // Always show ME
      if (
        currentUserId &&
        (r.userId === currentUserId || r.username === user?.username)
      )
        return true;

      // Check activity
      if (r.lastActivity) {
        const lastActive = new Date(r.lastActivity).getTime();
        return lastActive > tenMinutesAgo;
      }
      return true;
    });

    // 2. Sort by Rank
    const sorted = [...activeRacers].sort((a, b) => a.rank - b.rank);

    // 3. Top 3 Logic
    const top3 = sorted.slice(0, 3);
    const currentUserInTop3 = top3.find(
      (p) =>
        p.userId === currentUserId || (user && p.username === user.username),
    );

    let displayList = [...top3];

    if (currentUserId && !currentUserInTop3) {
      const currentUserEntry = sorted.find(
        (p) =>
          p.userId === currentUserId || (user && p.username === user.username),
      );
      if (currentUserEntry) {
        displayList.push(currentUserEntry);
      } else if (user && participant) {
        // Show me based on participant data even if not in leaderboard yet
        displayList.push({
          userId: currentUserId,
          username: user.username || user.name || "You",
          rank: 999,
          score: participant.score || 0,
          puzzlesSolved: participant.puzzlesSolved || 0,
          lastActivity: Date.now(),
        });
      }
    }

    return displayList;
  }, [leaderboard, user, participant]);

  // Always render container
  // Show at least user's dot if we have participant data
  if (!competition) {
    return (
      <div className="puzzle-racer-container">
        <div className="racer-header">
          <h4>
            <span className="race-icon">🏃</span>
            Live Race Progress
          </h4>
        </div>
        <div
          className="racer-track"
          style={{
            minHeight: "180px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="waiting-message">Loading competition...</div>
        </div>
      </div>
    );
  }

  // Show loading state briefly on initial load
  if (isInitialLoad) {
    return (
      <div className="puzzle-racer-container">
        <div className="racer-header">
          <h4>
            <span className="race-icon">🏃</span>
            Live Race Progress
          </h4>
        </div>
        <div
          className="racer-track"
          style={{
            minHeight: "180px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="waiting-message">Initializing race...</div>
        </div>
      </div>
    );
  }

  const getProgress = (solvedCount) => {
    if (!totalPuzzles || totalPuzzles === 0) return 0;
    const pct = (solvedCount / totalPuzzles) * 100;
    return Math.min(100, Math.max(0, pct));
  };

  const getRacerColor = (rank, isCurrentUser) => {
    if (isCurrentUser) return "#b58863"; // Chess theme color for current user

    switch (rank) {
      case 1:
        return "#FFD700"; // Gold
      case 2:
        return "#C0C0C0"; // Silver
      case 3:
        return "#CD7F32"; // Bronze
      case 4:
        return "#4A90E2"; // Blue
      case 5:
        return "#5DADE2"; // Light Blue
      default:
        return "#7F8C8D"; // Gray
    }
  };

  return (
    <div className="puzzle-racer-container">
      <div className="racer-header">
        <h4>
          <span className="race-icon">🏃</span>
          Live Race Progress
          {isBoosting && <span className="boost-indicator">🚀</span>}
        </h4>
        <div className="race-info">
          <span className="puzzle-count">{totalPuzzles} Puzzles</span>
          <FaFlagCheckered className="finish-flag-icon" />
        </div>
      </div>

      {/* Universe Effect Background Layers */}
      <div className="stars"></div>
      <div className="twinkling"></div>

      <div
        className={`racer-track ${isBoosting ? "boosting" : ""}`}
        style={{ height: `${Math.max(160, racers.length * 45)}px` }}
      >
        <div className="finish-portal"></div>

        {racers.length === 0 && (
          <div className="waiting-message">Waiting for racers...</div>
        )}

        {racers.map((racer, index) => {
          const isCurrentUser =
            user &&
            (racer.userId === user.id ||
              racer.userId === user._id ||
              racer.username === user.username);
          const progress = getProgress(racer.puzzlesSolved || 0);
          // Use index for vertical position, but rank for color

          return (
            <div
              key={racer.userId || racer.username}
              className={`racer-row ${isCurrentUser ? "current-user-row" : ""}`}
              style={{ top: `${index * 45 + 20}px` }}
            >
              {/* Running Character (Dot) */}
              <div
                className={`racer-runner-wrapper ${isCurrentUser ? "current-user" : ""} rank-${racer.rank}`}
                style={{
                  left: `calc(40px + ${progress}% * 0.85)`,
                  top: "0",
                }}
              >
                <div className="racer-dot">
                  <span className="dot-rank">{racer.rank}</span>
                </div>

                <div className="racer-info-tooltip">
                  <span className="racer-username">
                    {isCurrentUser ? "You" : racer.username}
                  </span>
                  <span className="racer-score">
                    {racer.puzzlesSolved}/{totalPuzzles}
                  </span>
                </div>
              </div>

              {/* Connection Line (Trail) */}
              <div
                className="racer-trail"
                style={{ width: `calc(40px + ${progress}% * 0.85)` }}
              ></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PuzzleRacer;
