import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaTrophy, FaMedal, FaClock, FaArrowLeft, FaSync, FaCrown } from "react-icons/fa";
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
        if (response.data.status === 'live') {
          setupLiveUpdates();
        }
      }
    } catch (error) {
      console.error('Failed to load competition:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await liveCompetitionAPI.getLeaderboard(competitionId);
      if (response.success && response.leaderboard) {
        setLeaderboard(response.leaderboard);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupLiveUpdates = () => {
    // ... keep your existing socket logic here ...
    // using existing socket logic for brevity
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      socketService.connect({ competition: { id: competitionId } });
      socketService.on('leaderboardUpdate', (newLeaderboard) => {
        setLeaderboard(newLeaderboard);
      });
    } catch (error) {
       console.error(error);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "-";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
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
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerWrapper}>
        <button onClick={() => navigate('/')} className={styles.backButton}>
          <FaArrowLeft /> <span>Back</span>
        </button>

        <div className={styles.titleSection}>
          <h1 className={styles.pageTitle}>Leaderboard</h1>
          {competition && <h2 className={styles.compName}>{competition.name}</h2>}
          
          {isLive && (
             <div className={styles.liveBadge}>
                <span className={styles.pulse}></span> LIVE UPDATES
             </div>
          )}
        </div>
        
        {/* Placeholder for symmetry or refresh button */}
        <div className={styles.headerAction}>
             {isLive && (
              <button onClick={loadLeaderboard} className={styles.iconBtn}>
                <FaSync />
              </button>
            )}
        </div>
      </div>

      <div className={styles.contentArea}>
        {leaderboard.length === 0 ? (
          <div className={styles.emptyState}>
            <FaCrown className={styles.emptyIcon} />
            <h3>Be the first to join!</h3>
          </div>
        ) : (
          <>
            {/* --- PODIUM SECTION --- */}
            {leaderboard.length > 0 && (
              <div className={styles.podiumContainer}>
                
                {/* 2nd Place */}
                <div className={`${styles.podiumColumn} ${styles.secondPlace}`}>
                  {leaderboard[1] && (
                    <>
                      <div className={styles.avatar}>
                         <span className={styles.avatarLetter}>{leaderboard[1].username[0]}</span>
                         <div className={styles.badge}>2</div>
                      </div>
                      <div className={styles.podiumName}>{leaderboard[1].username}</div>
                      <div className={styles.podiumScore}>{leaderboard[1].score} pts</div>
                      <div className={styles.podiumBar}></div>
                    </>
                  )}
                </div>

                {/* 1st Place */}
                <div className={`${styles.podiumColumn} ${styles.firstPlace}`}>
                  <div className={styles.crownIcon}><FaCrown /></div>
                  <div className={styles.avatar}>
                     <span className={styles.avatarLetter}>{leaderboard[0].username[0]}</span>
                     <div className={styles.badge}>1</div>
                  </div>
                  <div className={styles.podiumName}>{leaderboard[0].username}</div>
                  <div className={styles.podiumScore}>{leaderboard[0].score} pts</div>
                  <div className={styles.podiumBar}></div>
                </div>

                {/* 3rd Place */}
                <div className={`${styles.podiumColumn} ${styles.thirdPlace}`}>
                  {leaderboard[2] && (
                    <>
                      <div className={styles.avatar}>
                         <span className={styles.avatarLetter}>{leaderboard[2].username[0]}</span>
                         <div className={styles.badge}>3</div>
                      </div>
                      <div className={styles.podiumName}>{leaderboard[2].username}</div>
                      <div className={styles.podiumScore}>{leaderboard[2].score} pts</div>
                      <div className={styles.podiumBar}></div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* --- LIST SECTION --- */}
            <div className={styles.listContainer}>
              <div className={styles.tableHeader}>
                <span>Rank</span>
                <span>Player</span>
                <span className={styles.alignRight}>Score</span>
                <span className={`${styles.alignRight} ${styles.hideMobile}`}>Time</span>
              </div>
              
              <div className={styles.tableBody}>
                {leaderboard.map((user, index) => (
                  <div 
                    key={user.userId} 
                    className={`${styles.tableRow} ${isCurrentUser(user.userId) ? styles.currentUser : ''}`}
                    style={{animationDelay: `${index * 0.05}s`}}
                  >
                    <div className={styles.rankCol}>
                      {user.rank <= 3 ? <FaMedal className={styles[`medal${user.rank}`]} /> : `#${user.rank}`}
                    </div>
                    
                    <div className={styles.playerCol}>
                      <span className={styles.rowName}>{user.username}</span>
                      {isCurrentUser(user.userId) && <span className={styles.youTag}>YOU</span>}
                    </div>
                    
                    <div className={`${styles.scoreCol} ${styles.alignRight}`}>
                      {user.score}
                    </div>
                    
                    <div className={`${styles.timeCol} ${styles.alignRight} ${styles.hideMobile}`}>
                      <FaClock className={styles.tinyIcon}/> {formatTime(user.timeSpent)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;