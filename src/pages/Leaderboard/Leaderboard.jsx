import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaTrophy, FaMedal, FaClock, FaPuzzlePiece, FaArrowLeft, FaSync } from "react-icons/fa";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import { competitionAPI } from "../../services/api";
import socketService from "../../services/socketService";
import styles from "./Leaderboard.module.css";
import toast from "react-hot-toast";

function Leaderboard() {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (competitionId) {
      loadCompetitionData();
      loadLeaderboard();
    }
  }, [competitionId]);

  const loadCompetitionData = async () => {
    try {
      const response = await competitionAPI.getById(competitionId);
      if (response.success) {
        setCompetition(response.data);
        setIsLive(response.data.status === 'live');
        
        // If it's a live competition, setup real-time updates
        if (response.data.status === 'live') {
          setupLiveUpdates();
        }
      }
    } catch (error) {
      console.error('Failed to load competition:', error);
      toast.error('Failed to load competition details');
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await liveCompetitionAPI.getLeaderboard(competitionId);
      
      if (response.success && response.leaderboard) {
        setLeaderboard(response.leaderboard);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const setupLiveUpdates = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const socket = socketService.connect({
        competition: { id: competitionId }
      });

      socketService.on('leaderboardUpdate', (newLeaderboard) => {
        setLeaderboard(newLeaderboard);
        setLastUpdate(new Date());
      });

      socketService.on('competitionEnded', (finalResults) => {
        setLeaderboard(finalResults.finalLeaderboard);
        setIsLive(false);
        toast.success('Competition has ended!');
      });

      socketService.on('participantSubmitted', (data) => {
        toast.success(`${data.username} submitted their solution!`);
      });

    } catch (error) {
      console.error('Failed to setup live updates:', error);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "0m 0s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <FaTrophy className={styles.goldTrophy} />;
      case 2:
        return <FaMedal className={styles.silverMedal} />;
      case 3:
        return <FaMedal className={styles.bronzeMedal} />;
      default:
        return <span className={styles.rankNumber}>{rank}</span>;
    }
  };

  const getCurrentUser = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  };

  const isCurrentUser = (userId) => {
    return userId === getCurrentUser();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          onClick={() => navigate('/dashboard')} 
          className={styles.backButton}
        >
          <FaArrowLeft /> Back to Dashboard
        </button>
        
        <div className={styles.titleSection}>
          <h1>Leaderboard</h1>
          {competition && (
            <h2>{competition.name || competition.title}</h2>
          )}
          
          <div className={styles.statusBar}>
            {/* <span className={`${styles.status} ${isLive ? styles.live : styles.completed}`}>
              {isLive ? '🟢 LIVE' : '🏁 COMPLETED'}
            </span> */}
            
            {/* {lastUpdate && (
              <span className={styles.lastUpdate}>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )} */}
            
            {isLive && (
              <button 
                onClick={loadLeaderboard} 
                className={styles.refreshButton}
              >
                <FaSync /> Refresh
              </button>
            )}
          </div>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className={styles.emptyState}>
          <FaTrophy className={styles.emptyIcon} />
          <h3>No participants yet</h3>
          <p>Be the first to join this competition!</p>
        </div>
      ) : (
        <div className={styles.leaderboardContainer}>
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className={styles.podium}>
              {/* 2nd Place */}
              <div className={styles.podiumPosition + ' ' + styles.second}>
                <div className={styles.podiumUser}>
                  <div className={styles.podiumRank}>
                    <FaMedal className={styles.silverMedal} />
                  </div>
                  <div className={styles.podiumInfo}>
                    <h3>{leaderboard[1].username}</h3>
                    <p>{leaderboard[1].score} pts</p>
                    <small>{leaderboard[1].puzzlesSolved} puzzles</small>
                  </div>
                </div>
                <div className={styles.podiumBase + ' ' + styles.secondBase}>2nd</div>
              </div>

              {/* 1st Place */}
              <div className={styles.podiumPosition + ' ' + styles.first}>
                <div className={styles.podiumUser}>
                  <div className={styles.podiumRank}>
                    <FaTrophy className={styles.goldTrophy} />
                  </div>
                  <div className={styles.podiumInfo}>
                    <h3>{leaderboard[0].username}</h3>
                    <p>{leaderboard[0].score} pts</p>
                    <small>{leaderboard[0].puzzlesSolved} puzzles</small>
                  </div>
                </div>
                <div className={styles.podiumBase + ' ' + styles.firstBase}>1st</div>
              </div>

              {/* 3rd Place */}
              <div className={styles.podiumPosition + ' ' + styles.third}>
                <div className={styles.podiumUser}>
                  <div className={styles.podiumRank}>
                    <FaMedal className={styles.bronzeMedal} />
                  </div>
                  <div className={styles.podiumInfo}>
                    <h3>{leaderboard[2].username}</h3>
                    <p>{leaderboard[2].score} pts</p>
                    <small>{leaderboard[2].puzzlesSolved} puzzles</small>
                  </div>
                </div>
                <div className={styles.podiumBase + ' ' + styles.thirdBase}>3rd</div>
              </div>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className={styles.leaderboardTable}>
            <div className={styles.tableHeader}>
              <div className={styles.headerCell}>Rank</div>
              <div className={styles.headerCell}>Player</div>
              <div className={styles.headerCell}>Score</div>
              {/* <div className={styles.headerCell}>Puzzles</div> */}
              <div className={styles.headerCell}>Time</div>
            </div>

            {leaderboard.map((participant, index) => (
              <div 
                key={participant.userId} 
                className={`${styles.tableRow} ${isCurrentUser(participant.userId) ? styles.currentUser : ''}`}
              >
                <div className={styles.rankCell}>
                  {getRankIcon(participant.rank)}
                </div>
                
                <div className={styles.playerCell}>
                  <span className={styles.username}>
                    {participant.username}
                    {isCurrentUser(participant.userId) && (
                      <span className={styles.youBadge}>YOU</span>
                    )}
                  </span>
                </div>
                
                <div className={styles.scoreCell}>
                  <span className={styles.score}>{participant.score}</span>
                  <span className={styles.points}>pts</span>
                </div>
                
                {/* <div className={styles.puzzlesCell}>
                  <FaPuzzlePiece className={styles.puzzleIcon} />
                  <span>{participant.puzzlesSolved}</span>
                </div> */}
                
                <div className={styles.timeCell}>
                  <FaClock className={styles.clockIcon} />
                  <span>{formatTime(participant.timeSpent)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;