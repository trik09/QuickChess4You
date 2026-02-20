import React, { useMemo, useCallback } from "react";
import { useLiveCompetition } from "../../contexts/LiveCompetitionContext";
import { useAuth } from "../../contexts/AuthContext";
import "./PuzzleRacer.css";

/* ========================================================
   ALL 8 PLANETS – Mercury to Neptune (+ Sun as rank #1)
======================================================== */
const PLANET_DATA = [
  // Order: farthest from Sun (left) → closest to Sun (right)
  { key: "neptune", label: "Neptune", size: 42, color1: "#5588ff", color2: "#3366ee", color3: "#2244cc", color4: "#1122aa", glow: "rgba(60,110,255,0.5)" },
  { key: "uranus", label: "Uranus", size: 44, color1: "#55eeff", color2: "#22ccdd", color3: "#11aabb", color4: "#008899", glow: "rgba(50,220,240,0.45)" },
  { key: "saturn", label: "Saturn", size: 55, color1: "#ffe4a0", color2: "#eebb55", color3: "#cc9933", color4: "#aa7722", glow: "rgba(238,190,90,0.4)", hasRing: true },
  { key: "jupiter", label: "Jupiter", size: 65, color1: "#ffbb77", color2: "#ee9944", color3: "#cc7733", color4: "#995522", glow: "rgba(238,160,80,0.45)", hasBands: true },
  { key: "mars", label: "Mars", size: 32, color1: "#ff6633", color2: "#dd3311", color3: "#bb1100", color4: "#880000", glow: "rgba(255,60,20,0.45)" },
  { key: "earth", label: "Earth", size: 40, color1: "#55ccff", color2: "#2299ee", color3: "#1177cc", color4: "#0055aa", glow: "rgba(50,170,255,0.5)", hasLand: true },
  { key: "venus", label: "Venus", size: 38, color1: "#ff9933", color2: "#e87722", color3: "#cc5511", color4: "#993300", glow: "rgba(255,140,40,0.5)" },
  { key: "mercury", label: "Mercury", size: 28, color1: "#e0d6cc", color2: "#c4b8a8", color3: "#9e8e78", color4: "#706050", glow: "rgba(200,185,165,0.4)" },
];

const VISIBLE_SLOTS = 9; // 1 sun + 8 planets

/* ========================================================
   COMPONENT
======================================================== */
const PuzzleRacer = () => {
  const { leaderboard, competition, participant } = useLiveCompetition();
  const { user } = useAuth();

  const totalPuzzles = useMemo(() => {
    if (competition?.puzzles?.length) return competition.puzzles.length;
    return 10;
  }, [competition]);

  // Build sorted racer list
  const racers = useMemo(() => {
    const currentUserId = user ? user.id || user._id : null;
    let displayList = [];

    if (leaderboard?.length > 0) {
      // Map leaderboard to immediately reflect local participant updates for the current user
      displayList = leaderboard.map((p) => {
        if (currentUserId && (p.userId === currentUserId || p.username === user?.username)) {
          return {
            ...p,
            score: Math.max(p.score || 0, participant?.score || 0),
            puzzlesSolved: Math.max(p.puzzlesSolved || 0, participant?.puzzlesSolved || 0),
          };
        }
        return p;
      });
      displayList.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    }

    if (currentUserId) {
      const inList = displayList.find(
        (p) => p.userId === currentUserId || p.username === user?.username
      );
      if (!inList && user) {
        displayList.push({
          userId: currentUserId,
          username: user.username || user.name || "You",
          rank: 999,
          score: participant?.score || 0,
          puzzlesSolved: participant?.puzzlesSolved || 0,
        });
      }
    }

    return displayList.sort((a, b) => (a.rank || 999) - (b.rank || 999));
  }, [leaderboard, user, participant]);

  const currentUserId = user ? user.id || user._id : null;

  const isCurrentUser = useCallback(
    (racer) => {
      if (!racer || !user) return false;
      return racer.userId === currentUserId || racer.username === user?.username;
    },
    [currentUserId, user]
  );

  // Sun = rank 1, planets = ranks 2-9
  const sunRacer = racers[0] || null;
  const planetSlots = PLANET_DATA.map((planet, i) => {
    // We want Rank 2 (racers[1]) to be at Mercury (last index) roughly
    // So we map in reverse order:
    // i=7 (Mercury) -> racer 1 (Rank 2)
    // i=0 (Neptune) -> racer 8 (Rank 9)
    const racerIndex = PLANET_DATA.length - i;
    return {
      planet,
      racer: racers[racerIndex] || null,
      rank: racerIndex + 1,
    };
  });

  const currentUserInSlots = racers.slice(0, VISIBLE_SLOTS).some(
    (r) => r && (r.userId === currentUserId || r.username === user?.username)
  );

  const currentUserRacer = racers.find(
    (r) => r.userId === currentUserId || r.username === user?.username
  );

  const othersCount = Math.max(0, racers.length - VISIBLE_SLOTS);

  return (
    <div className="puzzle-racer-container">
      {/* Header */}
      <div className="racer-header">
        <h4>
          <span className="race-icon">🪐</span>
          Puzzle Galaxy
        </h4>
        <div className="race-info">
          <span className="puzzle-count">{totalPuzzles} Puzzles</span>
          {othersCount > 0 && (
            <span className="others-badge">
              <span className="others-icon">🌟</span>
              +{othersCount} more
            </span>
          )}
        </div>
      </div>

      {/* Solar System Visual */}
      <div className="solar-system-scene">
        {/* Decorative orbit curves */}
        <svg className="orbit-svg" viewBox="0 0 1000 340" preserveAspectRatio="none">
          {[180, 220, 260, 300, 340, 380, 420, 460].map((rx, i) => (
            <ellipse
              key={i}
              cx="920"
              cy="170"
              rx={rx}
              ry={rx * 0.45}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}
        </svg>

        {/* Comet decorations */}
        <div className="comet comet-1" />
        <div className="comet comet-2" />

        {/* Planets area (left → center) */}
        <div className="planets-lineup">
          {planetSlots.map(({ planet, racer, rank }, idx) => {
            const isCurrent = racer && isCurrentUser(racer);
            const solved = racer?.puzzlesSolved || 0;

            return (
              <div
                key={planet.key}
                className={`planet-slot ${isCurrent ? "planet-slot-you" : ""} ${!racer ? "planet-slot-empty" : ""}`}
                style={{ animationDelay: `${idx * 0.4}s` }}
              >
                {/* The sphere */}
                <div
                  className={`planet-orb planet-float-${idx + 1}`}
                  style={{
                    width: `${planet.size}px`,
                    height: `${planet.size}px`,
                    background: `radial-gradient(circle at 35% 35%, ${planet.color1}, ${planet.color2} 40%, ${planet.color3} 75%, ${planet.color4})`,
                    boxShadow: `0 0 ${planet.size * 0.4}px ${planet.glow}, 0 0 ${planet.size * 0.8}px ${planet.glow.replace(/[\d.]+\)$/, '0.12)')}`,
                  }}
                >
                  {/* Saturn ring */}
                  {planet.hasRing && <div className="saturn-ring" />}
                  {/* Jupiter bands */}
                  {planet.hasBands && <div className="jupiter-bands" />}
                  {/* Earth land patches */}
                  {planet.hasLand && <div className="earth-land" />}

                  {/* Highlight shine */}
                  <div className="planet-shine" />
                </div>

                {/* Label below */}
                <div className="planet-slot-label">
                  {racer ? (
                    <>
                      <span className={`planet-slot-name ${isCurrent ? "name-you" : ""}`}>
                        {isCurrent ? "⭐ You" : racer.username}
                      </span>
                      <span className="planet-slot-score">
                        {solved}/{totalPuzzles}
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
          {sunRacer && <span className="sun-crown-icon">👑</span>}
          <div className="sun-body" />

          <div className="sun-label">
            {sunRacer ? (
              <>
                <span className="sun-player-name">
                  {isCurrentUser(sunRacer) ? "⭐ You" : sunRacer.username}
                </span>
                <span className="sun-player-score">
                  {sunRacer.puzzlesSolved || 0}/{totalPuzzles}
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
            <span className="star-username-3d">⭐ You</span>
            <span className="star-rank-3d">
              Rank #{currentUserRacer.rank} · {currentUserRacer.puzzlesSolved || 0}/{totalPuzzles} solved
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PuzzleRacer;