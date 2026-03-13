import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import socketService from "../services/socketService";
import { liveCompetitionAPI } from "../services/liveCompetitionAPI";
import puzzleStateManager from "../services/puzzleStateManager";
import toast from "react-hot-toast";
import { useLiveCompetitionSocketBridge } from "../features/liveCompetition/useLiveCompetitionSocketBridge";
import {
  mergePuzzlesWithStoredStates,
} from "../features/liveCompetition/puzzleStateMerge";
import {
  deriveTotalPuzzleCount,
  shouldHydrateCompetition,
  syncPuzzleStatesToLocalStorage,
} from "../features/liveCompetition/competitionPuzzlesLoaders";

const LiveCompetitionContext = createContext();

export const useLiveCompetition = () => {
  const context = useContext(LiveCompetitionContext);
  if (!context) {
    throw new Error(
      "useLiveCompetition must be used within a LiveCompetitionProvider",
    );
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
  const [forceRenderTick, setForceRenderTick] = useState(0);

  // Disconnect from competition (defined early because socket bridge depends on it)
  const disconnectFromCompetition = useCallback(() => {
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
  }, []);

  // Exact transition trigger to eliminate the 5-8 second polling delay when a competition starts
  useEffect(() => {
    if (!competition) return;

    const now = Date.now();
    const startTime = new Date(competition.startTime).getTime();
    const endTime = new Date(competition.endTime).getTime();

    let startTimeout, endTimeout;

    if (now < startTime) {
      const waitTime = startTime - now;
      console.log(`[LiveComp] Setting exact start timeout: ${waitTime}ms`);
      startTimeout = setTimeout(() => {
        setForceRenderTick(prev => prev + 1);
        toast.success("Competition is now LIVE! Good luck!", { duration: 4000 });
      }, waitTime);
    }

    if (now < endTime) {
      const waitTime = endTime - now;
      endTimeout = setTimeout(() => {
        setForceRenderTick(prev => prev + 1);
      }, waitTime);
    }

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(endTimeout);
    };
  }, [competition]);

  // Initialize state on mount - restore from localStorage if available
  useEffect(() => {
    const initializeState = async () => {
      const currentPath = window.location.pathname;

      // Match both /competition/:id and /competition/:id/puzzle patterns
      const competitionMatch = currentPath.match(/\/competition\/([^\/]+)/);

      // PERFORMANCE: Skip heavy init if not on a competition page
      // Also skip on LOBBY pages — lobby has its own loadLobby() function
      if (!competitionMatch || currentPath.includes('/lobby')) return;

      const competitionId = competitionMatch[1];

      try {
        // Parallel: load puzzles + leaderboard simultaneously
        await Promise.all([
          loadCompetitionPuzzles(competitionId),
          getLeaderboard(competitionId)
        ]);

        // AUTO-RECONNECT SOCKET on page refresh
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (token && user && !socketService.isConnected) {
          try {
            const compData = { competition: { id: competitionId, name: "" } };
            await socketService.connect(compData);
            setIsConnected(true);
            socketService.emit("joinCompetition", { competitionId });
          } catch (sockErr) {
            // Not critical — REST polling will cover us
          }
        }
      } catch (error) {
        // Expected if user hasn't participated yet
      }
    };

    initializeState();
  }, []); // Run once on mount

  const { ensureSocketConnection, refreshLeaderboard } =
    useLiveCompetitionSocketBridge({
      setLeaderboard,
      setLastUpdate,
      setCompetitionEnded,
      setError,
      setIsConnected,
      disconnectFromCompetition,
    });

  // Participate in competition
  const participateInCompetition = async (competitionId, username) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if already participating to avoid duplicate calls
      if (competition && competition.id === competitionId) {
        console.log("Already participating in this competition");
        return { success: true, competition };
      }

      // Check localStorage for existing participation to avoid duplicate calls
      const stateKey = `competition_${competitionId}_state`;
      const existingState = localStorage.getItem(stateKey);
      if (existingState) {
        try {
          const parsed = JSON.parse(existingState);
          if (
            parsed.puzzleStates &&
            Object.keys(parsed.puzzleStates).length > 0
          ) {
            console.log(
              "Found existing participation state, skipping API call",
            );
            // Load competition data without making participation call
            await loadCompetitionPuzzles(competitionId);
            return { success: true, message: "Using existing participation" };
          }
        } catch (e) {
          console.error("Error parsing existing state:", e);
        }
      }

      // RESET STATE: Clear any previous competition data to prevent "ghost" racers
      setCompetition(null);
      setLeaderboard([]);
      setPuzzles([]);
      setParticipant(null);
      setCompetitionEnded(false);
      setTotalPuzzleCount(0); // Reset total puzzle count

      const response = await liveCompetitionAPI.participate(
        competitionId,
        username,
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to participate");
      }

      // Step 2: Connect to Socket.IO after REST success
      await socketService.connect(response);

      // Set competition data
      setCompetition(response.competition);
      setTotalPuzzleCount(response.competition.puzzles?.length || 0); // Set total puzzle count
      setIsConnected(true);

      socketService.emit("joinCompetition", {
        competitionId,
      });

      // Load competition puzzles
      await loadCompetitionPuzzles(competitionId);

      // Fetch initial leaderboard immediately with competition ID
      console.log("Fetching initial leaderboard data");
      await getLeaderboard(competitionId);

      toast.success(`Successfully joined ${response.competition.name}!`);

      return response;
    } catch (error) {
      console.error("Participation failed:", error);

      // Silent error handling during initialization - don't show toast for common errors
      if (
        !error.message.toLowerCase().includes("already") &&
        !error.message.toLowerCase().includes("participating") &&
        !error.message.toLowerCase().includes("invalid access code")
      ) {
        setError(error.message);
        // Don't show toast during initialization to avoid spam
        console.log("Participation error:", error.message);
      } else {
        // For access code errors during refresh, just log silently
        console.log("Participation error (silent):", error.message);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Setup socket event listeners handled in persistent useEffect

  // Load competition puzzles - can be called manually with competitionId
  const loadCompetitionPuzzles = async (competitionId) => {
    if (!competitionId) {
      console.error("No competition ID provided to loadCompetitionPuzzles");
      return;
    }

    try {
      console.log("Loading competition puzzles for:", competitionId);
      const response = await liveCompetitionAPI.getPuzzles(competitionId);

      if (response.success) {
        console.log(
          "Received puzzle data:",
          response.puzzles.length,
          "puzzles",
        );

        // Set competition data if not already set
        if (shouldHydrateCompetition(competition)) {
          setCompetition(response.competition);
          setTotalPuzzleCount(
            response.competition?.totalPuzzles || response.puzzles.length,
          );
          console.log(
            "Set competition data, total puzzles:",
            response.competition?.totalPuzzles || response.puzzles.length,
          );
        }

        // Get stored puzzle states from localStorage
        const storedStates =
          puzzleStateManager.getAllPuzzleStates(competitionId);
        console.log("Stored states from localStorage:", storedStates);

        // Merge server data with stored states
        const puzzlesWithStates = mergePuzzlesWithStoredStates({
          serverPuzzles: response.puzzles,
          storedStates,
        });

        console.log(
          "Final puzzles with states:",
          puzzlesWithStates.map((p) => ({
            id: p._id,
            status: p.status,
            isSolved: p.isSolved,
            isFailed: p.isFailed,
          })),
        );

        setPuzzles(puzzlesWithStates);
        setParticipant(response.participant);

        // Update total puzzle count if not already set
        const nextTotal = deriveTotalPuzzleCount({
          currentTotalPuzzleCount: totalPuzzleCount,
          responseCompetition: response.competition,
          responsePuzzles: response.puzzles,
        });
        if (nextTotal != null) setTotalPuzzleCount(nextTotal);

        // Sync any missing states to localStorage
        syncPuzzleStatesToLocalStorage({
          competitionId,
          puzzlesWithStates,
          puzzleStateManager,
        });
      }
    } catch (error) {
      console.error("Failed to load puzzles:", error);
      // Silent error handling during initialization to prevent toast spam
      // Only show toast if this is a user-initiated action (not on page load)
      const isInitialLoad = !competition;
      if (!isInitialLoad) {
        toast.error("Failed to load competition puzzles");
      }
      // Don't throw error to prevent black page - return error info instead
      return { success: false, error: error.message };
    }
  };

  // Submit puzzle solution
  const submitSolution = async (
    puzzleId,
    solution,
    timeSpent,
    boardPosition = null,
    moveHistory = [],
  ) => {
    try {
      setIsLoading(true);

      const response = await liveCompetitionAPI.submitSolution(
        competition.id,
        puzzleId,
        solution,
        timeSpent,
        boardPosition,
        moveHistory,
      );

      // Handle both correct and incorrect solutions
      if (response.success || response.isCorrect === false) {
        const isCorrect = response.isCorrect !== false;
        const puzzleStatus =
          response.puzzleStatus || (isCorrect ? "solved" : "failed");

        // Update participant data
        setParticipant((prev) => ({
          ...prev,
          score: response.totalScore,
          puzzlesSolved: response.puzzlesSolved,
        }));

        // Update puzzle status in state
        setPuzzles((prev) =>
          prev.map((puzzle) =>
            puzzle._id === puzzleId
              ? {
                ...puzzle,
                status: puzzleStatus,
                isSolved: isCorrect,
                isFailed: !isCorrect,
                isLocked: true,
                solvedData: isCorrect
                  ? {
                    scoreEarned: response.scoreEarned,
                    timeSpent,
                    solvedAt: new Date(),
                  }
                  : null,
              }
              : puzzle,
          ),
        );

        // Save state to localStorage
        console.log("Saving puzzle state to localStorage:", {
          competitionId: competition.id,
          puzzleId,
          isCorrect,
          puzzleStatus,
        });

        if (isCorrect) {
          const saved = puzzleStateManager.markPuzzleSolved(
            competition.id,
            puzzleId,
            response.scoreEarned,
            timeSpent,
            boardPosition,
          );
          console.log("Puzzle marked as solved in localStorage:", saved);
          toast.success(`Puzzle solved! +${response.scoreEarned} points`, {
            duration: 4000,
          });
        } else {
          const saved = puzzleStateManager.markPuzzleFailed(
            competition.id,
            puzzleId,
            timeSpent,
            boardPosition,
          );
          console.log("Puzzle marked as failed in localStorage:", saved);
          toast.error("Incorrect solution. Puzzle is now locked.", {
            duration: 4000,
          });
        }

        // Immediately fetch fresh leaderboard for instant local feedback
        if (competition?.id) {
          getLeaderboard(competition.id);
        }

        return response;
      }
    } catch (error) {
      console.error("Solution submission failed:", error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get leaderboard via REST API (fallback)
  const getLeaderboard = async (competitionIdOverride = null) => {
    try {
      const compId = competitionIdOverride || competition?.id;
      if (!compId) {
        console.log("No competition ID available for leaderboard fetch");
        return;
      }

      console.log("Fetching leaderboard for competition:", compId);
      const response = await liveCompetitionAPI.getLeaderboard(compId);

      if (response.success) {
        console.log(
          "Leaderboard fetched successfully:",
          response.leaderboard.length,
          "entries",
        );
        setLeaderboard(response.leaderboard);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    }
  };

  // Periodic leaderboard sync as safety net (every 15 seconds while live)
  useEffect(() => {
    if (!competition?.id || competitionEnded) return;

    // Only poll if competition is live
    const isLive =
      competition.status === "LIVE" || competition.status === "live";
    if (!isLive) return;

    const syncInterval = setInterval(() => {
      getLeaderboard(competition.id);
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [competition?.id, competition?.status, competitionEnded]);

  // Get current user's rank
  const getCurrentUserRank = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userEntry = leaderboard.find(
      (entry) =>
        (user.id && entry.userId === user.id) ||
        (user._id && entry.userId === user._id) ||
        entry.username === user.username,
    );
    return userEntry ? userEntry.rank : null;
  };

  // Get solved puzzles count
  const getSolvedPuzzlesCount = () => {
    return puzzles.filter((puzzle) => puzzle.isSolved).length;
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
    // Reference forceRenderTick to ensure component re-renders when it changes
    const _tick = forceRenderTick;

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
      moveHistory,
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

  // Allow external components (e.g. PuzzlePage) to directly update participant
  const updateParticipant = (newData) => {
    setParticipant((prev) => ({
      ...(prev || {}),
      ...newData,
    }));
  };

  // Debug function to check localStorage
  const debugLocalStorage = (competitionId) => {
    const state = puzzleStateManager.getCompetitionState(competitionId);
    console.log("Current localStorage state:", state);
    return state;
  };

  // Add debug function to window for testing
  useEffect(() => {
    if (typeof window !== "undefined") {
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
    forceRenderTick,

    // Actions
    participateInCompetition,
    submitSolution,
    refreshLeaderboard,
    getLeaderboard,
    disconnectFromCompetition,
    loadCompetitionPuzzles, // Expose for manual loading
    updateParticipant, // Allow PuzzlePage to instantly sync participant data

    // Computed values
    getCurrentUserRank,
    getSolvedPuzzlesCount,
    getTotalPuzzlesCount,
    isCompetitionActive,
    getTimeRemaining,

    ensureSocketConnection, // Explicit socket ensuring

    // Board position management
    saveBoardPosition,
    getBoardPosition,
    isPuzzleLocked,
    debugLocalStorage, // Debug function

    // Socket status
    socketStatus: socketService.getConnectionStatus(),
  };

  return (
    <LiveCompetitionContext.Provider value={value}>
      {children}
    </LiveCompetitionContext.Provider>
  );
};

export default LiveCompetitionContext;
