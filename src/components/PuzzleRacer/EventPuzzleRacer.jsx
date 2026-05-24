import React, { useMemo, useCallback } from "react";
import { useLiveEvent } from "../../contexts/LiveEventContext";
import { useAuth } from "../../contexts/AuthContext";
import { deduplicateLeaderboard, normalizeUserId } from "../../features/liveCompetition/leaderboardUtils";
import { FaGlobeAmericas, FaStar } from "react-icons/fa";
import "./PuzzleRacer.css";

const PLANET_DATA = [
  { key: "neptune", label: "Neptune", size: 42, color1: "#4a7dfc", color2: "#295eeb", color3: "#1a46bf", color4: "#0f2b80", glow: "rgba(74, 125, 252, 0.5)" },
  { key: "uranus", label: "Uranus", size: 44, color1: "#47e1f5", color2: "#20c2d6", color3: "#139eb0", color4: "#0a7e8f", glow: "rgba(71, 225, 245, 0.45)" },
  { key: "saturn", label: "Saturn", size: 55, color1: "#fce09c", color2: "#dbb75a", color3: "#b89335", color4: "#8f6916", glow: "rgba(252, 224, 156, 0.45)", hasRing: true },
  { key: "jupiter", label: "Jupiter", size: 65, color1: "#fca85d", color2: "#db8535", color3: "#b56316", color4: "#8a4405", glow: "rgba(252, 168, 93, 0.45)", hasBands: true },
  { key: "mars", label: "Mars", size: 32, color1: "#fa5c2a", color2: "#d43908", color3: "#ab2800", color4: "#781800", glow: "rgba(250, 92, 42, 0.45)" },
  { key: "earth", label: "Earth", size: 40, color1: "#4fbbff", color2: "#2493db", color3: "#1072b0", color4: "#045487", glow: "rgba(79, 187, 255, 0.5)", hasLand: true },
  { key: "venus", label: "Venus", size: 38, color1: "#f79120", color2: "#d67408", color3: "#ad5600", color4: "#853e00", glow: "rgba(247, 145, 32, 0.5)" },
  { key: "mercury", label: "Mercury", size: 28, color1: "#cfc4ba", color2: "#ab9e91", color3: "#8c7e70", color4: "#635649", glow: "rgba(207, 196, 186, 0.4)" },
];

const VISIBLE_SLOTS = 9; 
const ORBITS = [180, 280, 380, 480, 580, 680, 780, 880]; 

const EventPuzzleRacer = () => {
  const { leaderboard, event, participant, puzzles: contextPuzzles, getSolvedPuzzlesCount } = useLiveEvent();
  const { user } = useAuth();

  const totalPuzzles = useMemo(() => {
    if (event?.puzzles?.length) return event.puzzles.length;
    if (contextPuzzles?.length) return contextPuzzles.length;
    return 10;
  }, [event, contextPuzzles]);

  const localSolvedCount = useMemo(() => {
    if (participant?.puzzlesSolved != null && participant.puzzlesSolved > 0) {
      return participant.puzzlesSolved;
    }
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

  const racers = useMemo(() => {
    let displayList = [];

    if (leaderboard?.length > 0) {
      displayList = leaderboard.map((p) => {
        if (isCurrentUser(p)) {
          return {
            ...p,
            score: Math.max(p.score || 0, participant?.score || 0),
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

    return deduplicateLeaderboard(displayList);
  }, [leaderboard, user, participant, currentUserId, localSolvedCount, isCurrentUser]);

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
      <div className="racer-header">
        <h4>
          <span className="race-icon"><FaGlobeAmericas /></span>
          Event Galaxy
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

      <div className="solar-system-scene">
        <svg className="orbit-svg" viewBox="0 0 1000 260" preserveAspectRatio="none">
          {ORBITS.map((rx, i) => (
            <React.Fragment key={i}>
              <ellipse cx="940" cy="130" rx={rx} ry={rx * 0.38} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="3" style={{ filter: 'blur(2px)' }} />
              <ellipse cx="940" cy="130" rx={rx} ry={rx * 0.38} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            </React.Fragment>
          ))}
        </svg>

        <div className="comet comet-1" />
        <div className="comet comet-2" />

        <div className="planets-lineup">
          {planetSlots.map(({ planet, racer, rank }, idx) => {
            const isCurrent = racer && isCurrentUser(racer);
            const solved = isCurrent ? localSolvedCount : (racer?.puzzlesSolved || 0);
            const rx = ORBITS[ORBITS.length - 1 - idx];
            const leftCoord = 940 - rx;
            const leftPercent = `${leftCoord / 10}%`;

            return (
              <div key={planet.key} className={`planet-slot ${isCurrent ? "planet-slot-you" : ""} ${!racer ? "planet-slot-empty" : ""}`} style={{ left: leftPercent, animationDelay: `${idx * 0.4}s` }}>
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
                  {racer && <span className="planet-rank-badge">{rank}</span>}
                </div>

                {racer && (
                  <div className="planet-progress-wrap">
                    <div className="planet-progress-bar" style={{ width: `${(solved / totalPuzzles) * 100}%`, background: isCurrent ? 'linear-gradient(90deg,#4fc3f7,#81d4fa)' : 'rgba(255,255,255,0.2)' }} />
                  </div>
                )}

                <div className="planet-slot-label">
                  {racer ? (
                    <>
                      <span className={`planet-slot-name ${isCurrent ? "name-you" : ""}`} title={isCurrent ? "You" : racer.username}>
                        {isCurrent ? <><FaStar /> You</> : racer.username}
                      </span>
                      <span className={`planet-slot-score ${isCurrent ? "score-you" : ""}`}>
                        {racer.score ?? 0} pts
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
                  {sunRacer.score ?? 0} pts
                </span>
              </>
            ) : (
              <span className="sun-waiting">Waiting…</span>
            )}
          </div>
        </div>
      </div>

      {!currentUserInSlots && currentUserRacer && (
        <div className="current-user-star-3d">
          <div className="star-glow-3d" />
          <div className="star-info-3d">
            <span className="star-username-3d"><FaStar /> You</span>
            <span className="star-rank-3d">Rank #{currentUserRacer.rank} · {currentUserRacer.score ?? 0} pts</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventPuzzleRacer;
