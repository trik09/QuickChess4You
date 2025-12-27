import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveCompetition } from '../../contexts/LiveCompetitionContext';
import { competitionAPI } from '../../services/api';
import LiveLeaderboard from '../../components/LiveCompetition/LiveLeaderboard';
import CompetitionTimer from '../../components/LiveCompetition/CompetitionTimer';
import toast from 'react-hot-toast';
import './LiveCompetitionPage.css';

const LiveCompetitionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    competition,
    puzzles,
    participant,
    isConnected,
    isLoading,
    error,
    competitionEnded,
    participateInCompetition,
    submitSolution,
    disconnectFromCompetition,
    getSolvedPuzzlesCount,
    getTotalPuzzlesCount,
    isCompetitionActive
  } = useLiveCompetition();

  const [competitionData, setCompetitionData] = useState(null);
  const [loadingCompetition, setLoadingCompetition] = useState(true);
  const [hasParticipated, setHasParticipated] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [puzzleStartTime, setPuzzleStartTime] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  // Load competition data on mount
  useEffect(() => {
    loadCompetitionData();
  }, [id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnectFromCompetition();
      }
    };
  }, []);

  const loadCompetitionData = async () => {
    try {
      setLoadingCompetition(true);
      const response = await competitionAPI.getById(id);
      
      if (response.success) {
        setCompetitionData(response.data);
      }
    } catch (error) {
      console.error('Failed to load competition:', error);
      toast.error('Failed to load competition details');
    } finally {
      setLoadingCompetition(false);
    }
  };

  const handleParticipate = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await participateInCompetition(id, user.username || user.name);
      setHasParticipated(true);
    } catch (error) {
      console.error('Participation failed:', error);
    }
  };

  const handlePuzzleSelect = (puzzle) => {
    if (puzzle.isSolved) {
      toast.info('You have already solved this puzzle!');
      return;
    }

    setSelectedPuzzle(puzzle);
    setPuzzleStartTime(Date.now());
  };

  const handleSolutionSubmit = async (solution) => {
    if (!selectedPuzzle || !puzzleStartTime) return;

    try {
      const timeSpent = Math.floor((Date.now() - puzzleStartTime) / 1000);
      
      await submitSolution(selectedPuzzle._id, solution, timeSpent);
      
      // Close puzzle view
      setSelectedPuzzle(null);
      setPuzzleStartTime(null);
      
    } catch (error) {
      console.error('Solution submission failed:', error);
    }
  };

  const handleBackToPuzzles = () => {
    setSelectedPuzzle(null);
    setPuzzleStartTime(null);
  };

  if (loadingCompetition) {
    return (
      <div className="live-competition-loading">
        <div className="loading-spinner"></div>
        <p>Loading competition...</p>
      </div>
    );
  }

  if (!competitionData) {
    return (
      <div className="live-competition-error">
        <h2>Competition not found</h2>
        <button onClick={() => navigate('/competitions')}>
          Back to Competitions
        </button>
      </div>
    );
  }

  // Show participation screen if not participated yet
  if (!hasParticipated && !competition) {
    return (
      <div className="live-competition-page">
        <div className="participation-screen">
          <div className="competition-info">
            <h1>{competitionData.name}</h1>
            <p className="competition-description">{competitionData.description}</p>
            
            <div className="competition-details">
              <div className="detail-item">
                <span className="label">Start Time:</span>
                <span className="value">
                  {new Date(competitionData.startTime).toLocaleString()}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">End Time:</span>
                <span className="value">
                  {new Date(competitionData.endTime).toLocaleString()}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Duration:</span>
                <span className="value">{competitionData.duration} minutes</span>
              </div>
              <div className="detail-item">
                <span className="label">Puzzles:</span>
                <span className="value">{competitionData.puzzles?.length || 0}</span>
              </div>
            </div>

            <div className="participation-actions">
              <button 
                className="participate-btn"
                onClick={handleParticipate}
                disabled={isLoading}
              >
                {isLoading ? 'Joining...' : '🚀 Participate Now'}
              </button>
              
              <button 
                className="back-btn"
                onClick={() => navigate('/competitions')}
              >
                Back to Competitions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show puzzle solving interface if puzzle is selected
  if (selectedPuzzle) {
    return (
      <div className="live-competition-page">
        <div className="puzzle-solving-interface">
          <div className="puzzle-header">
            <button className="back-btn" onClick={handleBackToPuzzles}>
              ← Back to Puzzles
            </button>
            <h2>{selectedPuzzle.title}</h2>
            <div className="puzzle-info">
              <span className="difficulty">{selectedPuzzle.difficulty}</span>
              <span className="category">{selectedPuzzle.category}</span>
            </div>
          </div>

          <div className="puzzle-content">
            {/* Chess board component would go here */}
            <div className="chess-board-placeholder">
              <p>Chess Board Component</p>
              <p>FEN: {selectedPuzzle.fen}</p>
              <p>Solution: {JSON.stringify(selectedPuzzle.solutionMoves)}</p>
              
              {/* Temporary solution buttons for testing */}
              <div className="temp-solution-buttons">
                <button 
                  onClick={() => handleSolutionSubmit(selectedPuzzle.solutionMoves)}
                  className="correct-solution-btn"
                >
                  Submit Correct Solution
                </button>
                <button 
                  onClick={() => handleSolutionSubmit(['wrong', 'moves'])}
                  className="wrong-solution-btn"
                >
                  Submit Wrong Solution
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main competition interface
  return (
    <div className="live-competition-page">
      <div className="competition-header">
        <div className="header-left">
          <h1>{competition?.name}</h1>
          <div className="connection-indicator">
            <span className={`indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="toggle-leaderboard-btn"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
          >
            {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
          </button>
          <button 
            className="leave-btn"
            onClick={() => {
              disconnectFromCompetition();
              navigate('/competitions');
            }}
          >
            Leave Competition
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
        </div>
      )}

      {competitionEnded && (
        <div className="competition-ended-banner">
          <span>🏁 Competition has ended! Check the final results below.</span>
        </div>
      )}

      <div className="competition-content">
        <div className="left-panel">
          <CompetitionTimer />
          
          {participant && (
            <div className="participant-stats">
              <h3>Your Progress</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">{participant.score}</span>
                  <span className="stat-label">Score</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {getSolvedPuzzlesCount()}/{getTotalPuzzlesCount()}
                  </span>
                  <span className="stat-label">Puzzles</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {Math.floor(participant.timeSpent / 60)}m
                  </span>
                  <span className="stat-label">Time</span>
                </div>
              </div>
            </div>
          )}

          <div className="puzzles-section">
            <h3>Competition Puzzles</h3>
            <div className="puzzles-grid">
              {puzzles.map((puzzle, index) => (
                <div 
                  key={puzzle._id}
                  className={`puzzle-card ${puzzle.isSolved ? 'solved' : ''} ${
                    !isCompetitionActive() ? 'disabled' : ''
                  }`}
                  onClick={() => isCompetitionActive() && handlePuzzleSelect(puzzle)}
                >
                  <div className="puzzle-number">#{index + 1}</div>
                  <div className="puzzle-title">{puzzle.title}</div>
                  <div className="puzzle-difficulty">{puzzle.difficulty}</div>
                  {puzzle.isSolved && (
                    <div className="solved-indicator">
                      ✅ +{puzzle.solvedData?.scoreEarned || 0} pts
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {showLeaderboard && (
          <div className="right-panel">
            <LiveLeaderboard />
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveCompetitionPage;