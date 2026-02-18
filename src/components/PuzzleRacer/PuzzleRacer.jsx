import React, { useMemo, useCallback } from "react";
import styles from "./PuzzleRacer.module.css";

/* ========================================================
   ALL 8 PLANETS – Mercury to Neptune (+ Sun as rank #1)
======================================================== */
const PLANET_DATA = [
  {
    key: "mercury", label: "Mercury", size: 28,
    color1: "#c8b8a2", color2: "#a89070", color3: "#7a6248", color4: "#4e3c2a",
    glow: "rgba(180,150,120,0.5)",
    surface: "radial-gradient(circle at 38% 32%, #d4c4ae, #b09878 30%, #7a6248 65%, #4e3c2a)",
    crater: true,
  },
  {
    key: "venus", label: "Venus", size: 38,
    color1: "#ffe08a", color2: "#e8a04a", color3: "#c06020", color4: "#8a3800",
    glow: "rgba(255,180,60,0.55)",
    surface: "radial-gradient(circle at 35% 30%, #fff0b0, #eea840 25%, #c26830 55%, #8a4010)",
    clouds: true,
  },
  {
    key: "earth", label: "Earth", size: 40,
    color1: "#60d0ff", color2: "#2888ee", color3: "#0d5ccc", color4: "#083a90",
    glow: "rgba(40,160,255,0.55)",
    surface: "radial-gradient(circle at 35% 30%, #88e4ff, #2898f0 30%, #0d65d0 62%, #083a90)",
    hasLand: true,
    hasAtmo: true,
  },
  {
    key: "mars", label: "Mars", size: 33,
    color1: "#ff7744", color2: "#dd4411", color3: "#bb1800", color4: "#800800",
    glow: "rgba(240,60,20,0.5)",
    surface: "radial-gradient(circle at 36% 30%, #ff8855, #dd4412 28%, #bb1900 58%, #7a0800)",
    polar: true,
  },
  {
    key: "jupiter", label: "Jupiter", size: 68,
    color1: "#ffcc88", color2: "#ee9944", color3: "#cc7030", color4: "#904818",
    glow: "rgba(230,155,60,0.5)",
    surface: "radial-gradient(circle at 35% 32%, #ffd8a0, #eeaa55 22%, #cc7030 55%, #904818)",
    hasBands: true,
    hasGRS: true,
  },
  {
    key: "saturn", label: "Saturn", size: 58,
    color1: "#f0d890", color2: "#d4aa50", color3: "#b07830", color4: "#7a5018",
    glow: "rgba(220,185,80,0.45)",
    surface: "radial-gradient(circle at 35% 32%, #f8e8a8, #d8b858 25%, #b07830 58%, #7a5018)",
    hasRing: true,
    hasBands: true,
  },
  {
    key: "uranus", label: "Uranus", size: 46,
    color1: "#aaeeff", color2: "#55ccdd", color3: "#2299bb", color4: "#006680",
    glow: "rgba(60,210,235,0.5)",
    surface: "radial-gradient(circle at 38% 33%, #ccf8ff, #66ddee 28%, #2299bb 60%, #006680)",
    hasAtmo: true,
  },
  {
    key: "neptune", label: "Neptune", size: 44,
    color1: "#7799ff", color2: "#3355ee", color3: "#1133cc", color4: "#0011aa",
    glow: "rgba(50,100,255,0.55)",
    surface: "radial-gradient(circle at 37% 32%, #99bbff, #4466ff 25%, #1133cc 58%, #0011aa)",
    hasAtmo: true,
    hasStorm: true,
  },
];

const VISIBLE_SLOTS = 9;

/* ========================================================
   COMPONENT
======================================================== */
const PuzzleRacer = () => {
  // Mock context data for standalone demo
  const leaderboard = [
    { userId: "u1", username: "StarLord", rank: 1, score: 950, puzzlesSolved: 10 },
    { userId: "u2", username: "Nebula", rank: 2, score: 880, puzzlesSolved: 9 },
    { userId: "u3", username: "Gamora", rank: 3, score: 820, puzzlesSolved: 8 },
    { userId: "u4", username: "Drax", rank: 4, score: 760, puzzlesSolved: 7 },
    { userId: "u5", username: "Rocket", rank: 5, score: 700, puzzlesSolved: 6 },
    { userId: "u6", username: "Groot", rank: 6, score: 640, puzzlesSolved: 5 },
    { userId: "u7", username: "You", rank: 7, score: 580, puzzlesSolved: 4 },
  ];
  const competition = { puzzles: Array(10).fill(null) };
  const participant = { score: 580, puzzlesSolved: 4 };
  const user = { id: "u7", username: "You" };

  const totalPuzzles = useMemo(() => {
    if (competition?.puzzles?.length) return competition.puzzles.length;
    return 10;
  }, [competition]);

  const racers = useMemo(() => {
    const currentUserId = user ? user.id || user._id : null;
    let displayList = [];

    if (leaderboard?.length > 0) {
      displayList = [...leaderboard].sort((a, b) => (a.rank || 999) - (b.rank || 999));
    }

    if (currentUserId) {
      const inList = displayList.find(
        (p) => p.userId === currentUserId || p.username === user?.username
      );
      if (!inList) {
        const fromLb = leaderboard?.find(
          (p) => p.userId === currentUserId || p.username === user?.username
        );
        if (fromLb) {
          displayList.push(fromLb);
        } else if (user) {
          displayList.push({
            userId: currentUserId,
            username: user.username || user.name || "You",
            rank: 999,
            score: participant?.score || 0,
            puzzlesSolved: participant?.puzzlesSolved || 0,
          });
        }
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

  const sunRacer = racers[0] || null;
  const planetSlots = PLANET_DATA.map((planet, i) => ({
    planet,
    racer: racers[i + 1] || null,
    rank: i + 2,
  }));

  const currentUserInSlots = racers.slice(0, VISIBLE_SLOTS).some(
    (r) => r && (r.userId === currentUserId || r.username === user?.username)
  );

  const currentUserRacer = racers.find(
    (r) => r.userId === currentUserId || r.username === user?.username
  );

  const othersCount = Math.max(0, racers.length - VISIBLE_SLOTS);

  return (
    <div className={styles.container}>
      {/* Nebula layers */}
      <div className={styles.nebula1} />
      <div className={styles.nebula2} />
      <div className={styles.nebula3} />

      {/* Stars */}
      <div className={styles.stars} />
      <div className={styles.starsDeep} />

      {/* Header */}
      <div className={styles.header}>
        <h4 className={styles.title}>
          <span className={styles.titleIcon}>🪐</span>
          Puzzle Galaxy
        </h4>
        <div className={styles.headerMeta}>
          <span className={styles.puzzleBadge}>{totalPuzzles} Puzzles</span>
          {othersCount > 0 && (
            <span className={styles.moreBadge}>
              <span>✦</span>+{othersCount} more
            </span>
          )}
        </div>
      </div>

      {/* Main solar scene */}
      <div className={styles.scene}>

        {/* Orbital ellipses */}
        <svg className={styles.orbitSvg} viewBox="0 0 1100 320" preserveAspectRatio="none">
          {[120, 170, 220, 270, 330, 395, 460, 530].map((ry, i) => (
            <ellipse
              key={i}
              cx="1050"
              cy="160"
              rx={ry * 1.7}
              ry={ry}
              fill="none"
              stroke={`rgba(120,180,255,${0.055 - i * 0.005})`}
              strokeWidth="1"
              strokeDasharray={i % 2 === 0 ? "none" : "4 6"}
            />
          ))}
        </svg>

        {/* Planets lineup — left to right: Neptune → Mercury */}
        <div className={styles.planetsArea}>
          {/* Render in reverse: Neptune first (outermost/left), Mercury last (rightmost before sun) */}
          {[...planetSlots].reverse().map(({ planet, racer, rank }, idx) => {
            const isCurrent = racer && isCurrentUser(racer);
            const solved = racer?.puzzlesSolved || 0;
            const floatClass = styles[`float${(idx % 8) + 1}`];

            return (
              <div
                key={planet.key}
                className={`${styles.planetSlot} ${isCurrent ? styles.planetSlotYou : ""} ${!racer ? styles.planetSlotEmpty : ""}`}
                style={{ "--float-delay": `${idx * 0.55}s` }}
              >
                {/* Orbit glow dot on ring */}
                <div
                  className={styles.orbitDot}
                  style={{ background: planet.glow.replace(/[\d.]+\)$/, '0.8)') }}
                />

                {/* Planet wrapper */}
                <div className={`${styles.planetWrapper} ${floatClass}`}>
                  {/* Saturn ring BEHIND planet */}
                  {planet.hasRing && <div className={styles.saturnRingBack} />}

                  {/* The sphere */}
                  <div
                    className={`${styles.planetOrb} ${isCurrent ? styles.planetOrbYou : ""}`}
                    style={{
                      width: `${planet.size}px`,
                      height: `${planet.size}px`,
                      background: planet.surface,
                      boxShadow: `
                        0 0 ${planet.size * 0.5}px ${planet.glow},
                        0 0 ${planet.size * 1.2}px ${planet.glow.replace(/[\d.]+\)$/, '0.15)')},
                        inset 0 0 ${planet.size * 0.25}px rgba(255,255,255,0.05),
                        inset -${planet.size * 0.15}px -${planet.size * 0.15}px ${planet.size * 0.3}px rgba(0,0,0,0.5)
                      `,
                    }}
                  >
                    {/* Surface details */}
                    {planet.hasBands && <div className={styles.jupiterBands} />}
                    {planet.hasLand && (
                      <>
                        <div className={styles.earthLand1} />
                        <div className={styles.earthLand2} />
                        <div className={styles.earthLand3} />
                      </>
                    )}
                    {planet.hasAtmo && (
                      <div className={styles.atmosphere} style={{ boxShadow: `0 0 ${planet.size * 0.3}px ${planet.glow.replace(/[\d.]+\)$/, '0.3)')}` }} />
                    )}
                    {planet.polar && <div className={styles.polarCap} />}
                    {planet.crater && (
                      <>
                        <div className={styles.crater1} />
                        <div className={styles.crater2} />
                      </>
                    )}
                    {planet.hasGRS && <div className={styles.greatRedSpot} />}
                    {planet.hasStorm && <div className={styles.neptuneStorm} />}
                    {planet.clouds && <div className={styles.venusCloud} />}

                    {/* Terminator (shadow) */}
                    <div className={styles.terminator} />
                    {/* Specular highlight */}
                    <div className={styles.specular} />
                  </div>

                  {/* Saturn ring FRONT */}
                  {planet.hasRing && <div className={styles.saturnRingFront} />}

                  {/* YOU glow halo */}
                  {isCurrent && (
                    <div className={styles.youHalo} />
                  )}
                </div>

                {/* Label */}
                <div className={styles.planetLabel}>
                  {racer ? (
                    <>
                      <span className={`${styles.playerName} ${isCurrent ? styles.playerNameYou : ""}`}>
                        {isCurrent ? "⭐ You" : racer.username}
                      </span>
                      <span className={styles.playerScore}>
                        {solved}/{totalPuzzles}
                      </span>
                    </>
                  ) : (
                    <span className={styles.planetName}>{planet.label}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* SUN — right side */}
        <div className={styles.sunRegion}>
          <div className={styles.sunOuterGlow} />
          <div className={styles.sunMidGlow} />
          <div className={styles.sunCorona} />
          <div className={styles.sunFlares} />
          <div className={styles.sunBody}>
            <div className={styles.sunSurface} />
            <div className={styles.sunGranules} />
          </div>
          {sunRacer && <span className={styles.crown}>👑</span>}
          <div className={styles.sunLabel}>
            {sunRacer ? (
              <>
                <span className={styles.sunName}>
                  {isCurrentUser(sunRacer) ? "⭐ You" : sunRacer.username}
                </span>
                <span className={styles.sunScore}>
                  {sunRacer.puzzlesSolved || 0}/{totalPuzzles}
                </span>
              </>
            ) : (
              <span className={styles.sunWaiting}>Awaiting…</span>
            )}
          </div>
        </div>
      </div>

      {/* Current user outside top slots */}
      {!currentUserInSlots && currentUserRacer && (
        <div className={styles.youCard}>
          <div className={styles.youCardGlow} />
          <div className={styles.youCardDot} />
          <div className={styles.youCardInfo}>
            <span className={styles.youCardName}>⭐ You</span>
            <span className={styles.youCardRank}>
              Rank #{currentUserRacer.rank} · {currentUserRacer.puzzlesSolved || 0}/{totalPuzzles} solved
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PuzzleRacer;