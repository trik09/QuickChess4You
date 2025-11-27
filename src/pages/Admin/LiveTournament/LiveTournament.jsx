import styles from './LiveTournament.module.css';

function LiveTournament() {
  const liveTournaments = [
    { 
      id: 1, 
      name: 'Spring Championship', 
      startTime: '10:00 AM',
      duration: '2 hours',
      elapsed: '45 min',
      players: 128,
      completed: 45,
      inProgress: 83
    },
    { 
      id: 2, 
      name: 'Rapid Blitz', 
      startTime: '2:00 PM',
      duration: '1 hour',
      elapsed: '15 min',
      players: 64,
      completed: 12,
      inProgress: 52
    },
  ];

  const leaderboard = [
    { rank: 1, name: 'Alice Johnson', score: 950, progress: 95 },
    { rank: 2, name: 'Bob Smith', score: 920, progress: 92 },
    { rank: 3, name: 'Charlie Brown', score: 890, progress: 89 },
    { rank: 4, name: 'Diana Prince', score: 870, progress: 87 },
    { rank: 5, name: 'Eve Wilson', score: 850, progress: 85 },
  ];

  return (
    <div className={styles.liveTournament}>
      <div className={styles.header}>
        <h2>Live Tournaments</h2>
        <p>Monitor ongoing competitions in real-time</p>
      </div>

      <div className={styles.tournamentsGrid}>
        {liveTournaments.map(tournament => (
          <div key={tournament.id} className={styles.tournamentCard}>
            <div className={styles.cardHeader}>
              <h3>{tournament.name}</h3>
              <span className={styles.liveBadge}>🔴 LIVE</span>
            </div>
            
            <div className={styles.tournamentInfo}>
              <div className={styles.infoRow}>
                <span>⏰ Started:</span>
                <strong>{tournament.startTime}</strong>
              </div>
              <div className={styles.infoRow}>
                <span>⏱️ Elapsed:</span>
                <strong>{tournament.elapsed} / {tournament.duration}</strong>
              </div>
              <div className={styles.infoRow}>
                <span>👥 Players:</span>
                <strong>{tournament.players}</strong>
              </div>
            </div>

            <div className={styles.progress}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${(tournament.completed / tournament.players) * 100}%` }}
                />
              </div>
              <div className={styles.progressStats}>
                <span>✅ Completed: {tournament.completed}</span>
                <span>⏳ In Progress: {tournament.inProgress}</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.viewBtn}>View Details</button>
              <button className={styles.pauseBtn}>⏸️ Pause</button>
              <button className={styles.endBtn}>⏹️ End</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.leaderboardSection}>
        <h3>Live Leaderboard - Spring Championship</h3>
        <div className={styles.leaderboardContainer}>
          {leaderboard.map(player => (
            <div key={player.rank} className={styles.leaderboardItem}>
              <div className={styles.rankBadge}>#{player.rank}</div>
              <div className={styles.playerInfo}>
                <div className={styles.playerAvatar}>👤</div>
                <div>
                  <div className={styles.playerName}>{player.name}</div>
                  <div className={styles.playerScore}>{player.score} points</div>
                </div>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.car} style={{ left: `${player.progress}%` }}>🏎️</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LiveTournament;
