import React, { createContext, useContext, useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { liveCompetitionAPI } from '../services/liveCompetitionAPI';
import toast from 'react-hot-toast';

const LiveCompetitionContext = createContext();

export const useLiveCompetition = () => {
  const context = useContext(LiveCompetitionContext);
  if (!context) {
    throw new Error('useLiveCompetition must be used within a LiveCompetitionProvider');
  }
  return context;
};

export const LiveCompetitionProvider = ({ children }) => {
  const [competition, setCompetition] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [puzzles, setPuzzles] = useState([]);
  const [participant, setParticipant] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [competitionEnded, setCompetitionEnded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Participate in competition
  const participateInCompetition = async (competitionId, username) => {
    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Validate participation via REST API
      const response = await liveCompetitionAPI.participate(competitionId, username);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to participate');
      }

      // Step 2: Connect to Socket.IO after REST success
      const socket = socketService.connect(response);
      
      // Set competition data
      setCompetition(response.competition);
      setIsConnected(true);

      // Setup socket event listeners
      setupSocketListeners();

      // Load competition puzzles
      await loadCompetitionPuzzles(competitionId);

      toast.success(`Successfully joined ${response.competition.name}!`);
      
      return response;

    } catch (error) {
      console.error('Participation failed:', error);
      setError(error.message);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Setup socket event listeners
  const setupSocketListeners = () => {
    // Leaderboard updates
    socketService.on('leaderboardUpdate', (newLeaderboard) => {
      setLeaderboard(newLeaderboard);
      setLastUpdate(new Date());
      
      // Show brief notification for leaderboard updates
      if (newLeaderboard.length > 0) {
        toast.success('Leaderboard updated!', { duration: 2000 });
      }
    });

    // Competition ended
    socketService.on('competitionEnded', (finalResults) => {
      setCompetitionEnded(true);
      setLeaderboard(finalResults.finalLeaderboard);
      toast.success(finalResults.message, { duration: 5000 });
      
      // Disconnect socket after competition ends
      setTimeout(() => {
        disconnectFromCompetition();
      }, 10000); // Disconnect after 10 seconds
    });

    // Participant joined
    socketService.on('participantJoined', (data) => {
      toast(`${data.username} joined the competition!`, { 
        icon: '👋',
        duration: 3000 
      });
    });

    // Error handling
    socketService.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message);
      toast.error(error.message);
    });
  };

  // Load competition puzzles
  const loadCompetitionPuzzles = async (competitionId) => {
    try {
      const response = await liveCompetitionAPI.getPuzzles(competitionId);
      
      if (response.success) {
        setPuzzles(response.puzzles);
        setParticipant(response.participant);
      }
    } catch (error) {
      console.error('Failed to load puzzles:', error);
      toast.error('Failed to load competition puzzles');
    }
  };

  // Submit puzzle solution
  const submitSolution = async (puzzleId, solution, timeSpent) => {
    try {
      setIsLoading(true);

      const response = await liveCompetitionAPI.submitSolution(
        competition.id,
        puzzleId,
        solution,
        timeSpent
      );

      if (response.success) {
        // Update participant data
        setParticipant(prev => ({
          ...prev,
          score: response.totalScore,
          puzzlesSolved: response.puzzlesSolved
        }));

        // Update puzzle status
        setPuzzles(prev => prev.map(puzzle => 
          puzzle._id === puzzleId 
            ? { 
                ...puzzle, 
                isSolved: true, 
                solvedData: {
                  scoreEarned: response.scoreEarned,
                  timeSpent,
                  solvedAt: new Date()
                }
              }
            : puzzle
        ));

        toast.success(`Puzzle solved! +${response.scoreEarned} points`, {
          duration: 4000
        });

        return response;
      }

    } catch (error) {
      console.error('Solution submission failed:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh leaderboard manually
  const refreshLeaderboard = () => {
    socketService.refreshLeaderboard();
  };

  // Get leaderboard via REST API (fallback)
  const getLeaderboard = async () => {
    try {
      if (!competition) return;

      const response = await liveCompetitionAPI.getLeaderboard(competition.id);
      
      if (response.success) {
        setLeaderboard(response.leaderboard);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  // Disconnect from competition
  const disconnectFromCompetition = () => {
    socketService.disconnect();
    setIsConnected(false);
    setCompetition(null);
    setLeaderboard([]);
    setPuzzles([]);
    setParticipant(null);
    setCompetitionEnded(false);
    setError(null);
    setLastUpdate(null);
  };

  // Get current user's rank
  const getCurrentUserRank = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userEntry = leaderboard.find(entry => 
      entry.userId === user.id || entry.username === user.username
    );
    return userEntry ? userEntry.rank : null;
  };

  // Get solved puzzles count
  const getSolvedPuzzlesCount = () => {
    return puzzles.filter(puzzle => puzzle.isSolved).length;
  };

  // Get total puzzles count
  const getTotalPuzzlesCount = () => {
    return puzzles.length;
  };

  // Check if competition is active
  const isCompetitionActive = () => {
    if (!competition) return false;
    
    const now = new Date();
    const startTime = new Date(competition.startTime);
    const endTime = new Date(competition.endTime);
    
    return now >= startTime && now <= endTime && !competitionEnded;
  };

  // Get time remaining
  const getTimeRemaining = () => {
    if (!competition) return 0;
    
    const now = new Date();
    const endTime = new Date(competition.endTime);
    
    return Math.max(0, endTime.getTime() - now.getTime());
  };

  // Context value
  const value = {
    // State
    competition,
    leaderboard,
    puzzles,
    participant,
    isConnected,
    isLoading,
    error,
    competitionEnded,
    lastUpdate,

    // Actions
    participateInCompetition,
    submitSolution,
    refreshLeaderboard,
    getLeaderboard,
    disconnectFromCompetition,

    // Computed values
    getCurrentUserRank,
    getSolvedPuzzlesCount,
    getTotalPuzzlesCount,
    isCompetitionActive,
    getTimeRemaining,

    // Socket status
    socketStatus: socketService.getConnectionStatus()
  };

  return (
    <LiveCompetitionContext.Provider value={value}>
      {children}
    </LiveCompetitionContext.Provider>
  );
};

export default LiveCompetitionContext;