import React, { useMemo, useCallback } from "react";
import { useLiveCompetition } from "../../contexts/LiveCompetitionContext";
import { useAuth } from "../../contexts/AuthContext";
import { deduplicateLeaderboard, normalizeUserId } from "../../features/liveCompetition/leaderboardUtils";
import { FaGlobeAmericas, FaStar } from "react-icons/fa";
import "./PuzzleRacer.css";

/* ========================================================
   ALL 8 PLANETS – Mercury to Neptune (+ Sun as rank #1)
======================================================== */
const PLANET_DATA = [
  // Order: farthest from Sun (left) → closest to Sun (right)
  { key: "neptune", label: "Neptune", size: 42, color1: "#4a7dfc", color2: "#295eeb", color3: "#1a46bf", color4: "#0f2b80", glow: "rgba(74, 125, 252, 0.5)" },
  { key: "uranus", label: "Uranus", size: 44, color1: "#47e1f5", color2: "#20c2d6", color3: "#139eb0", color4: "#0a7e8f", glow: "rgba(71, 225, 245, 0.45)" },
  { key: "saturn", label: "Saturn", size: 55, color1: "#fce09c", color2: "#dbb75a", color3: "#b89335", color4: "#8f6916", glow: "rgba(252, 224, 156, 0.45)", hasRing: true },
  { key: "jupiter", label: "Jupiter", size: 65, color1: "#fca85d", color2: "#db8535", color3: "#b56316", color4: "#8a4405", glow: "rgba(252, 168, 93, 0.45)", hasBands: true },
  { key: "mars", label: "Mars", size: 32, color1: "#fa5c2a", color2: "#d43908", color3: "#ab2800", color4: "#781800", glow: "rgba(250, 92, 42, 0.45)" },
  { key: "earth", label: "Earth", size: 40, color1: "#4fbbff", color2: "#2493db", color3: "#1072b0", color4: "#045487", glow: "rgba(79, 187, 255, 0.5)", hasLand: true },
  { key: "venus", label: "Venus", size: 38, color1: "#f79120", color2: "#d67408", color3: "#ad5600", color4: "#853e00", glow: "rgba(247, 145, 32, 0.5)" },
  { key: "mercury", label: "Mercury", size: 28, color1: "#cfc4ba", color2: "#ab9e91", color3: "#8c7e70", color4: "#635649", glow: "rgba(207, 196, 186, 0.4)" },
];

const VISIBLE_SLOTS = 9; // 1 sun + 8 planets
const ORBITS = [180, 280, 380, 480, 580, 680, 780, 880]; // Mercury to Neptune radii

/* ========================================================
   COMPONENT
======================================================== */
const PuzzleRacer = ({
  leaderboard: propLeaderboard,
  competition: propCompetition,
  participant: propParticipant,
  puzzles: propPuzzles
}) => {
  const { 
    leaderboard: ctxLeaderboard, 
    competition: ctxCompetition, 
    participant: ctxParticipant, 
    puzzles: ctxPuzzles 
  } = useLiveCompetition();

  const leaderboard = propLeaderboard !== undefined ? propLeaderboard : ctxLeaderboard;
  const competition = propCompetition !== undefined ? propCompetition : ctxCompetition;
  const participant = propParticipant !== undefined ? propParticipant : ctxParticipant;
  const contextPuzzles = propPuzzles !== undefined ? propPuzzles : ctxPuzzles;
  
  const { user } = useAuth();

  const totalPuzzles = useMemo(() => {
    if (competition?.puzzles?.length) return competition.puzzles.length;
    if (contextPuzzles?.length) return contextPuzzles.length;
    return 10;
  }, [competition, contextPuzzles]);

  // Ground-truth solved count — prioritize participant.puzzlesSolved (updated instantly
  // via updateParticipant() from PuzzlePage on every successful solve), fall back to
  // counting solved puzzles in the context array.
  const localSolvedCount = useMemo(() => {
    // participant.puzzlesSolved is updated immediately by PuzzlePage via updateParticipant()
    if (participant?.puzzlesSolved != null && participant.puzzlesSolved > 0) {
      return participant.puzzlesSolved;
    }
    // Fallback: count from context puzzles array (populated by loadCompetitionPuzzles)
    if (contextPuzzles?.length > 0) {
      return contextPuzzles.filter(p => p.isSolved).length;
    }
    return 0;
  }, [participant, contextPuzzles]);

  const currentUserId = user ? user.id || user._id : null;

  const isCurrentUser = useCallback(
    (racer) => {
      if (!racer || !user) return false;
      const racerId = normalizeUserId(racer.userId);
      return (racerId && String(currentUserId) && racerId === String(currentUserId)) ||
        racer.username === user?.username;
    },
    [currentUserId, user]
  );

  // Build sorted racer list – current user's score always reads from local ground truth
  const racers = useMemo(() => {
    let displayList = [];

    if (leaderboard?.length > 0) {
      displayList = leaderboard.map((p) => {
        if (isCurrentUser(p)) {
          return {
            ...p,
            // FIX: Use participant.score (confirmed by backend via updateParticipant)
            // directly instead of Math.max which could pick a stale inflated value
            // from a previous optimistic update that was never confirmed by the server.
            score: participant?.score ?? p.score ?? 0,
            puzzlesSolved: Math.max(p.puzzlesSolved || 0, localSolvedCount),
          };
        }
        return p;
      });
      displayList.sort((a, b) => {
        if (b.score !== a.score) {
          return (b.score || 0) - (a.score || 0);
        }
        return (a.timeSpent || 0) - (b.timeSpent || 0);
      });
    }

    // If current user not in leaderboard yet, add them with local data
    if (currentUserId) {
      const inList = displayList.find(
        (p) => isCurrentUser(p)
      );
      if (!inList && user) {
        displayList.push({
          userId: currentUserId,
          username: user.username || user.name || "You",
          rank: 999,
          score: participant?.score || 0,
          puzzlesSolved: localSolvedCount,
        });
      }
    }

    // Use the comprehensive deduplication algorithm as the final step
    return deduplicateLeaderboard(displayList);
  }, [leaderboard, user, participant, currentUserId, localSolvedCount, isCurrentUser]);

  // Sun = rank 1, planets = ranks 2-9
  const sunRacer = racers[0] || null;
  const planetSlots = PLANET_DATA.map((planet, i) => {
    const racerIndex = PLANET_DATA.length - i;
    return {
      planet,
      racer: racers[racerIndex] || null,
      rank: racerIndex + 1,
    };
  });

  const currentUserInSlots = racers.slice(0, VISIBLE_SLOTS).some(
    (r) => r && isCurrentUser(r)
  );

  const currentUserRacer = racers.find(
    (r) => r && isCurrentUser(r)
  );

  const othersCount = Math.max(0, racers.length - VISIBLE_SLOTS);

  return (
    <div className="puzzle-racer-container">
      {/* Header */}
      <div className="racer-header">
        <h4>
          <span className="race-icon"><FaGlobeAmericas /></span>
          Puzzle Galaxy
        </h4>
        <div className="race-info">
          <span className="puzzle-count">{totalPuzzles} Puzzles</span>
          {othersCount > 0 && (
            <span className="others-badge">
              <span className="others-icon"><FaStar /></span>
              +{othersCount} more
            </span>
          )}
        </div>
      </div>

      {/* Solar System Visual */}
      <div className="solar-system-scene">
        {/* Orbit ellipses anchored at sun position */}
        <svg className="orbit-svg" viewBox="0 0 1000 260" preserveAspectRatio="none">
          {ORBITS.map((rx, i) => (
            <React.Fragment key={i}>
              {/* Outer Glow */}
              <ellipse
                cx="940"
                cy="130"
                rx={rx}
                ry={rx * 0.38}
                fill="none"
                stroke="rgba(255,255,255,0.02)"
                strokeWidth="3"
                style={{ filter: 'blur(2px)' }}
              />
              {/* Core Line */}
              <ellipse
                cx="940"
                cy="130"
                rx={rx}
                ry={rx * 0.38}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
            </React.Fragment>
          ))}
        </svg>

        {/* Comet decorations */}
        <div className="comet comet-1" />
        <div className="comet comet-2" />

        {/* Planets area */}
        <div className="planets-lineup">
          {planetSlots.map(({ planet, racer, rank }, idx) => {
            const isCurrent = racer && isCurrentUser(racer);
            // Use local ground truth for current user
            const solved = isCurrent ? localSolvedCount : (racer?.puzzlesSolved || 0);

            // Calculate exact horizontal position based on orbit radius
            const rx = ORBITS[ORBITS.length - 1 - idx];
            const leftCoord = 940 - rx;
            const leftPercent = `${leftCoord / 10}%`;

            return (
              <div
                key={planet.key}
                className={`planet-slot ${isCurrent ? "planet-slot-you" : ""} ${!racer ? "planet-slot-empty" : ""}`}
                style={{ 
                  left: leftPercent,
                  animationDelay: `${idx * 0.4}s` 
                }}
              >
                {/* The sphere */}
                <div
                  className={`planet-orb planet-float-${idx + 1} ${isCurrent ? "planet-orb-you" : ""}`}
                  style={{
                    width: `${planet.size}px`,
                    height: `${planet.size}px`,
                    background: `radial-gradient(circle at 35% 35%, ${planet.color1}, ${planet.color2} 40%, ${planet.color3} 75%, ${planet.color4})`,
                    boxShadow: isCurrent
                      ? `0 0 ${planet.size * 0.5}px ${planet.glow}, 0 0 ${planet.size}px rgba(120,200,255,0.25), 0 0 3px rgba(255,255,255,0.6)`
                      : `0 0 ${planet.size * 0.4}px ${planet.glow}, 0 0 ${planet.size * 0.8}px ${planet.glow.replace(/[\d.]+\)$/, '0.1)')}`,
                  }}
                >
                  {planet.hasRing && <div className="saturn-ring" />}
                  {planet.hasBands && <div className="jupiter-bands" />}
                  {planet.hasLand && <div className="earth-land" />}
                  <div className="planet-shine" />
                  {/* Numbered badge for rank on planet (starts at 2 since sun is 1) */}
                  {racer && <span className="planet-rank-badge">{rank}</span>}
                </div>

                {/* Score bar */}
                {racer && (
                  <div className="planet-progress-wrap">
                    <div
                      className="planet-progress-bar"
                      style={{ width: `${(solved / totalPuzzles) * 100}%`, background: isCurrent ? 'linear-gradient(90deg,#4fc3f7,#81d4fa)' : 'rgba(255,255,255,0.2)' }}
                    />
                  </div>
                )}

                {/* Label below */}
                <div className="planet-slot-label">
                  {racer ? (
                    <>
                      <span className={`planet-slot-name ${isCurrent ? "name-you" : ""}`} title={isCurrent ? "You" : racer.username}>
                        {isCurrent ? <><FaStar /> You</> : racer.username}
                      </span>
                      <span className={`planet-slot-score ${isCurrent ? "score-you" : ""}`}>
                        {solved * 10} pts
                      </span>
                    </>
                  ) : (
                    <span className="planet-slot-planet-name">{planet.label}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sun (right side) */}
        <div className="sun-region">
          <div className="sun-corona" />
          <div className="sun-outer-glow" />
          {sunRacer && <span className="planet-rank-badge sun-rank-badge">1</span>}
          <div className="sun-body" />

          <div className="sun-label">
            {sunRacer ? (
              <>
                <span className="sun-player-name" title={isCurrentUser(sunRacer) ? "You" : sunRacer.username}>
                  {isCurrentUser(sunRacer) ? <><FaStar /> You</> : sunRacer.username}
                </span>
                <span className="sun-player-score">
                  {(isCurrentUser(sunRacer) ? localSolvedCount : (sunRacer.puzzlesSolved || 0)) * 10} pts
                </span>
              </>
            ) : (
              <span className="sun-waiting">Waiting…</span>
            )}
          </div>
        </div>
      </div>

      {/* Current user star when outside top slots */}
      {!currentUserInSlots && currentUserRacer && (
        <div className="current-user-star-3d">
          <div className="star-glow-3d" />
          <div className="star-info-3d">
            <span className="star-username-3d"><FaStar /> You</span>
            <span className="star-rank-3d">
              Rank #{currentUserRacer.rank} · {localSolvedCount * 10} pts
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PuzzleRacer;