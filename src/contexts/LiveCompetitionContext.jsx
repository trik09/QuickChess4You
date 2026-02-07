import React, { createContext, useContext, useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { liveCompetitionAPI } from '../services/liveCompetitionAPI';
import puzzleStateManager from '../services/puzzleStateManager';
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
  const [totalPuzzleCount, setTotalPuzzleCount] = useState(0); // Add total puzzle count state

  // Initialize state on mount - restore from localStorage if available
  useEffect(() => {
    const initializeState = async () => {
      // Check if we're on a competition page
      const currentPath = window.location.pathname;
      console.log('Current path:', currentPath);
      
      // Match both /competition/:id and /competition/:id/puzzle patterns
      const competitionMatch = currentPath.match(/\/competition\/([^\/]+)/);
      
      if (competitionMatch) {
        const competitionId = competitionMatch[1];
        console.log('Initializing competition state for:', competitionId);
        
        try {
          // Try to load competition puzzles to restore state
          await loadCompetitionPuzzles(competitionId);
          console.log('Competition state restored successfully');
          
          // Fetch leaderboard immediately on initialization
          console.log('Fetching initial leaderboard on mount');
          await getLeaderboard(competitionId);
        } catch (error) {
          console.error('Failed to restore competition state:', error);
          // This is expected if user hasn't participated yet
        }
      } else {
        console.log('Not on a competition page, skipping state restoration');
      }
    };

    initializeState();
  }, []); // Run once on mount

  // Participate in competition
  const participateInCompetition = async (competitionId, username) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if already participating to avoid duplicate calls
      if (competition && competition.id === competitionId) {
        console.log('Already participating in this competition');
        return { success: true, competition };
      }

      // Check localStorage for existing participation to avoid duplicate calls
      const stateKey = `competition_${competitionId}_state`;
      const existingState = localStorage.getItem(stateKey);
      if (existingState) {
        try {
          const parsed = JSON.parse(existingState);
          if (parsed.puzzleStates && Object.keys(parsed.puzzleStates).length > 0) {
            console.log('Found existing participation state, skipping API call');
            // Load competition data without making participation call
            await loadCompetitionPuzzles(competitionId);
            return { success: true, message: 'Using existing participation' };
          }
        } catch (e) {
          console.error('Error parsing existing state:', e);
        }
      }

      // RESET STATE: Clear any previous competition data to prevent "ghost" racers
      setCompetition(null);
      setLeaderboard([]);
      setPuzzles([]);
      setParticipant(null);
      setCompetitionEnded(false);
      setTotalPuzzleCount(0); // Reset total puzzle count
      
      const response = await liveCompetitionAPI.participate(competitionId, username);

      if (!response.success) {
        throw new Error(response.error || 'Failed to participate');
      }

      // Step 2: Connect to Socket.IO after REST success
      const socket = socketService.connect(response);

      // Set competition data
      setCompetition(response.competition);
      setTotalPuzzleCount(response.competition.puzzles?.length || 0); // Set total puzzle count
      setIsConnected(true);

      // Setup socket event listeners
      setupSocketListeners();

      // Load competition puzzles
      await loadCompetitionPuzzles(competitionId);

      // Fetch initial leaderboard immediately with competition ID
      console.log('Fetching initial leaderboard data');
      await getLeaderboard(competitionId);

      toast.success(`Successfully joined ${response.competition.name}!`);

      return response;

    } catch (error) {
      console.error('Participation failed:', error);
      
      // Silent error handling during initialization - don't show toast for common errors
      if (!error.message.toLowerCase().includes('already') && 
          !error.message.toLowerCase().includes('participating') &&
          !error.message.toLowerCase().includes('invalid access code')) {
        setError(error.message);
        // Don't show toast during initialization to avoid spam
        console.log('Participation error:', error.message);
      } else {
        // For access code errors during refresh, just log silently
        console.log('Participation error (silent):', error.message);
      }
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

    // Participant submitted
    socketService.on('participantSubmitted', (data) => {
      toast(`${data.username} submitted their solution!`, {
        icon: '🏁',
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

  // Load competition puzzles - can be called manually with competitionId
  const loadCompetitionPuzzles = async (competitionId) => {
    if (!competitionId) {
      console.error('No competition ID provided to loadCompetitionPuzzles');
      return;
    }
    
    try {
      console.log('Loading competition puzzles for:', competitionId);
      const response = await liveCompetitionAPI.getPuzzles(competitionId);

      if (response.success) {
        console.log('Received puzzle data:', response.puzzles.length, 'puzzles');
        
        // Set competition data if not already set
        if (!competition) {
          setCompetition(response.competition);
          setTotalPuzzleCount(response.competition?.totalPuzzles || response.puzzles.length);
          console.log('Set competition data, total puzzles:', response.competition?.totalPuzzles || response.puzzles.length);
        }

        // Get stored puzzle states from localStorage
        const storedStates = puzzleStateManager.getAllPuzzleStates(competitionId);
        console.log('Stored states from localStorage:', storedStates);
        
        // Merge server data with stored states
        const puzzlesWithStates = response.puzzles.map(puzzle => {
          const storedState = storedStates[puzzle._id];
          
          console.log(`Puzzle ${puzzle._id}:`, {
            serverStatus: puzzle.status,
            serverSolved: puzzle.isSolved,
            serverFailed: puzzle.isFailed,
            storedState: storedState
          });
          
          // Determine final status - server takes precedence, then localStorage
          let finalStatus = 'unsolved';
          let isSolved = false;
          let isFailed = false;
          let isLocked = false;
          
          if (puzzle.status && (puzzle.status === 'solved' || puzzle.status === 'failed')) {
            // Server has definitive status
            finalStatus = puzzle.status;
            isSolved = puzzle.status === 'solved';
            isFailed = puzzle.status === 'failed';
            isLocked = true;
          } else if (storedState && (storedState.status === 'solved' || storedState.status === 'failed')) {
            // Use localStorage status if server doesn't have it
            finalStatus = storedState.status;
            isSolved = storedState.status === 'solved';
            isFailed = storedState.status === 'failed';
            isLocked = storedState.isLocked || true;
          } else if (puzzle.isSolved || puzzle.isFailed) {
            // Fallback to boolean flags
            finalStatus = puzzle.isSolved ? 'solved' : 'failed';
            isSolved = puzzle.isSolved;
            isFailed = puzzle.isFailed;
            isLocked = true;
          }
          
          return {
            ...puzzle,
            status: finalStatus,
            isSolved,
            isFailed,
            isLocked,
            
            // Preserve board position from localStorage if available
            boardPosition: puzzle.boardPosition || storedState?.boardPosition,
            moveHistory: puzzle.moveHistory || storedState?.moveHistory || [],
            
            // Merge solved data
            solvedData: puzzle.solvedData || (storedState?.status === 'solved' ? {
              scoreEarned: storedState.scoreEarned,
              timeSpent: storedState.timeSpent,
              solvedAt: storedState.solvedAt
            } : null)
          };
        });

        console.log('Final puzzles with states:', puzzlesWithStates.map(p => ({
          id: p._id,
          status: p.status,
          isSolved: p.isSolved,
          isFailed: p.isFailed
        })));

        setPuzzles(puzzlesWithStates);
        setParticipant(response.participant);
        
        // Update total puzzle count if not already set
        if (totalPuzzleCount === 0) {
          setTotalPuzzleCount(response.competition?.totalPuzzles || response.puzzles.length);
        }

        // Sync any missing states to localStorage
        puzzlesWithStates.forEach(puzzle => {
          if (puzzle.status !== 'unsolved') {
            const stateToSave = {
              status: puzzle.status,
              boardPosition: puzzle.boardPosition,
              moveHistory: puzzle.moveHistory,
              timeSpent: puzzle.solvedData?.timeSpent || 0,
              isLocked: puzzle.isLocked,
              scoreEarned: puzzle.solvedData?.scoreEarned || 0
            };

            if (puzzle.status === 'solved') {
              stateToSave.solvedAt = puzzle.solvedData?.solvedAt || Date.now();
            } else if (puzzle.status === 'failed') {
              stateToSave.failedAt = Date.now();
            }

            puzzleStateManager.savePuzzleState(competitionId, puzzle._id, stateToSave);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load puzzles:', error);
      // Silent error handling during initialization to prevent toast spam
      // Only show toast if this is a user-initiated action (not on page load)
      const isInitialLoad = !competition;
      if (!isInitialLoad) {
        toast.error('Failed to load competition puzzles');
      }
      // Don't throw error to prevent black page - return error info instead
      return { success: false, error: error.message };
    }
  };

  // Submit puzzle solution
  const submitSolution = async (puzzleId, solution, timeSpent, boardPosition = null, moveHistory = []) => {
    try {
      setIsLoading(true);

      const response = await liveCompetitionAPI.submitSolution(
        competition.id,
        puzzleId,
        solution,
        timeSpent,
        boardPosition,
        moveHistory
      );

      // Handle both correct and incorrect solutions
      if (response.success || response.isCorrect === false) {
        const isCorrect = response.isCorrect !== false;
        const puzzleStatus = response.puzzleStatus || (isCorrect ? 'solved' : 'failed');

        // Update participant data
        setParticipant(prev => ({
          ...prev,
          score: response.totalScore,
          puzzlesSolved: response.puzzlesSolved
        }));

        // Update puzzle status in state
        setPuzzles(prev => prev.map(puzzle =>
          puzzle._id === puzzleId
            ? {
              ...puzzle,
              status: puzzleStatus,
              isSolved: isCorrect,
              isFailed: !isCorrect,
              isLocked: true,
              solvedData: isCorrect ? {
                scoreEarned: response.scoreEarned,
                timeSpent,
                solvedAt: new Date()
              } : null
            }
            : puzzle
        ));

        // Save state to localStorage
        console.log('Saving puzzle state to localStorage:', {
          competitionId: competition.id,
          puzzleId,
          isCorrect,
          puzzleStatus
        });
        
        if (isCorrect) {
          const saved = puzzleStateManager.markPuzzleSolved(
            competition.id,
            puzzleId,
            response.scoreEarned,
            timeSpent,
            boardPosition
          );
          console.log('Puzzle marked as solved in localStorage:', saved);
          toast.success(`Puzzle solved! +${response.scoreEarned} points`, {
            duration: 4000
          });
        } else {
          const saved = puzzleStateManager.markPuzzleFailed(
            competition.id,
            puzzleId,
            timeSpent,
            boardPosition
          );
          console.log('Puzzle marked as failed in localStorage:', saved);
          toast.error('Incorrect solution. Puzzle is now locked.', {
            duration: 4000
          });
        }

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
  const getLeaderboard = async (competitionIdOverride = null) => {
    try {
      const compId = competitionIdOverride || competition?.id;
      if (!compId) {
        console.log('No competition ID available for leaderboard fetch');
        return;
      }

      console.log('Fetching leaderboard for competition:', compId);
      const response = await liveCompetitionAPI.getLeaderboard(compId);

      if (response.success) {
        console.log('Leaderboard fetched successfully:', response.leaderboard.length, 'entries');
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
    setTotalPuzzleCount(0); // Reset total puzzle count
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
    // Priority: 1. Actual puzzles loaded, 2. Competition total, 3. Stored total
    if (puzzles && puzzles.length > 0) {
      return puzzles.length;
    }
    if (competition && competition.puzzles && competition.puzzles.length > 0) {
      return competition.puzzles.length;
    }
    return totalPuzzleCount || 0;
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

  // Save board position for a puzzle
  const saveBoardPosition = (puzzleId, boardPosition, moveHistory = []) => {
    if (!competition) return;
    
    puzzleStateManager.saveBoardPosition(
      competition.id,
      puzzleId,
      boardPosition,
      moveHistory
    );
  };

  // Get board position for a puzzle
  const getBoardPosition = (puzzleId) => {
    if (!competition) return { boardPosition: null, moveHistory: [] };
    
    return puzzleStateManager.getBoardPosition(competition.id, puzzleId);
  };

  // Check if puzzle is locked
  const isPuzzleLocked = (puzzleId) => {
    if (!competition) return false;
    
    return puzzleStateManager.isPuzzleLocked(competition.id, puzzleId);
  };

  // Debug function to check localStorage
  const debugLocalStorage = (competitionId) => {
    const state = puzzleStateManager.getCompetitionState(competitionId);
    console.log('Current localStorage state:', state);
    return state;
  };

  // Add debug function to window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.debugCompetitionState = debugLocalStorage;
    }
  }, []);

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
    loadCompetitionPuzzles, // Expose for manual loading

    // Computed values
    getCurrentUserRank,
    getSolvedPuzzlesCount,
    getTotalPuzzlesCount,
    isCompetitionActive,
    getTimeRemaining,

    // Board position management
    saveBoardPosition,
    getBoardPosition,
    isPuzzleLocked,
    debugLocalStorage, // Debug function

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