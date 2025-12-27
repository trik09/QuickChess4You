import React, { useState, useEffect } from 'react';
import { liveCompetitionAPI } from '../../services/liveCompetitionAPI';
import socketService from '../../services/socketService';
import './CompetitionLeaderboard.css';

const CompetitionLeaderboard = ({ competitionId, isLive = false }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!competitionId) return;

    // Load initial leaderboard
    loadLeaderboard();

    // If it's a live competition, setup real-time updates and ensure participation
    if (isLive) {
      ensureParticipation();
      setupLiveUpdates();
    }

    return () => {
      if (isLive) {
        cleanup();
      }
    };
  }, [competitionId, isLive]);

  const ensureParticipation = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      if (!user.id || !token) {
        console.log('No user or token found');
        return;
      }

      console.log('Ensuring participation for user:', user.username || user.name);
      
      // Try to participate in the live competition
      const response = await liveCompetitionAPI.participate(competitionId, user.username || user.name);
      console.log('Participation response:', response);
      
      // Reload leaderboard after participation
      setTimeout(() => {
        loadLeaderboard();
      }, 1000);
      
    } catch (error) {
      console.log('Participation failed (user might already be participating):', error.message);
      // This is expected if user is already participating
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      console.log('Loading leaderboard for competition:', competitionId);
      
      const response = await liveCompetitionAPI.getLeaderboard(competitionId);
      console.log('Leaderboard API response:', response);
      
      if (response.success) {
        setLeaderboard(response.leaderboard);
        setLastUpdate(new Date());
        console.log('Leaderboard loaded:', response.leaderboard);
      } else {
        console.log('Leaderboard API failed:', response);
        // Fallback to regular competition API
        try {
          const fallbackResponse = await fetch(`http://localhost:4000/api/competition/${competitionId}/leaderboard`);
          const fallbackData = await fallbackResponse.json();
          console.log('Fallback leaderboard:', fallbackData);
          
          if (fallbackData.leaderboard) {
            // Convert regular leaderboard format to live format
            const convertedLeaderboard = fallbackData.leaderboard.map((participant, index) => ({
              rank: index + 1,
              userId: participant.user._id || participant.user,
              username: participant.user.name || participant.user.username || 'Unknown',
              score: participant.score || 0,
              puzzlesSolved: participant.completedPuzzles?.length || 0,
              timeSpent: 0
            }));
            setLeaderboard(convertedLeaderboard);
            setLastUpdate(new Date());
          }
        } catch (fallbackError) {
          console.error('Fallback leaderboard failed:', fallbackError);
        }
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupLiveUpdates = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found for socket connection');
      return;
    }

    try {
      console.log('Setting up live updates for competition:', competitionId);
      
      // Connect to socket for this competition
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
      console.log('Connecting to socket:', socketUrl);
      
      const socket = socketService.connect({ 
        competition: { id: competitionId } 
      });

      // Listen for leaderboard updates
      socketService.on('leaderboardUpdate', (newLeaderboard) => {
        console.log('Received leaderboard update:', newLeaderboard);
        setLeaderboard(newLeaderboard);
        setLastUpdate(new Date());
      });

      // Track connection status
      setIsConnected(true);

      // Join competition room
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Joining competition room with user:', user.username || user.name);
      
      socket.emit('joinCompetition', {
        competitionId,
        username: user.username || user.name || 'Anonymous'
      });

      // Listen for connection events
      socket.on('connect', () => {
        console.log('Socket connected successfully');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        setIsConnected(false);
      });

    } catch (error) {
      console.error('Failed to setup live updates:', error);
      setIsConnected(false);
    }
  };

  const cleanup = () => {
    socketService.disconnect();
    setIsConnected(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankDisplay = (rank) => {
    switch (rank) {
      case 1:
        return <span className="rank gold">#{rank}</span>;
      case 2:
        return <span className="rank silver">#{rank}</span>;
      case 3:
        return <span className="rank bronze">#{rank}</span>;
      default:
        return <span className="rank">#{rank}</span>;
    }
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  if (loading) {
    return (
      <div className="competition-leaderboard loading">
        <div className="loading-spinner"></div>
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="competition-leaderboard">
      <div className="leaderboard-header">
        <h3 className='text-red-500'>Leaderboard</h3>
        <div className="header-controls">
          {/* {isLive && (
            <div className="live-status">
              <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢 LIVE' : '🔴 OFFLINE'}
              </span>
            </div>
          )} */}
          <button 
            className="refresh-btn" 
            onClick={loadLeaderboard}
            title="Refresh leaderboard"
          >
            🔄
          </button>
        </div>
      </div>

      {/* {lastUpdate && (
        <div className="last-update">
          Updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )} */}

      {/* Debug Info */}
      {/* <div className="debug-info" style={{ fontSize: '0.7rem', color: '#666', marginBottom: '8px' }}>
        Competition: {competitionId} | Live: {isLive ? 'Yes' : 'No'} | Count: {leaderboard.length}
        <br />
        <button 
          onClick={async () => {
            try {
              const response = await fetch(`http://localhost:4000/api/live-competition/${competitionId}/debug/participants`);
              const data = await response.json();
              console.log('Debug participants:', data);
              alert(`Found ${data.participantCount} participants. Check console for details.`);
            } catch (error) {
              console.error('Debug failed:', error);
            }
          }}
          style={{ fontSize: '0.6rem', padding: '2px 4px', margin: '2px' }}
        >
          Debug DB
        </button>
        <button 
          onClick={async () => {
            try {
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              const response = await fetch(`http://localhost:4000/api/live-competition/${competitionId}/debug/add-participant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, username: user.username || user.name })
              });
              const data = await response.json();
              console.log('Added test participant:', data);
              loadLeaderboard();
            } catch (error) {
              console.error('Add participant failed:', error);
            }
          }}
          style={{ fontSize: '0.6rem', padding: '2px 4px', margin: '2px' }}
        >
          Add Test
        </button>
      </div> */}

      <div className="leaderboard-list">
        {leaderboard.length > 0 ? (
          leaderboard.slice(0, 10).map((participant) => (
            <div 
              key={participant.userId}
              className={`leaderboard-item ${
                participant.userId === currentUser.id ? 'current-user' : ''
              }`}
            >
              <div className="rank-section">
                {getRankDisplay(participant.rank)}
              </div>
              
              <div className="player-section">
                <div className="player-name">{participant.username}</div>
                <div className="player-stats">
                  <span className="score">{participant.score} pts</span>
                  <span className="puzzles">{participant.puzzlesSolved} solved</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-leaderboard">
            <p>No participants yet</p>
            <small>Solve puzzles to appear on the leaderboard!</small>
            {isLive && (
              <div style={{ marginTop: '8px' }}>
                <button 
                  onClick={ensureParticipation}
                  style={{ 
                    background: '#d2b561', 
                    color: '#000', 
                    border: 'none', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Join Competition
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {leaderboard.length > 10 && (
        <div className="leaderboard-footer">
          <small>Showing top 10 participants</small>
        </div>
      )}
    </div>
  );
};

export default CompetitionLeaderboard;