import React, { createContext, useContext, useState, useEffect } from "react";
import socketEventService from "../services/socketEventService";
import { liveEventAPI } from "../services/liveEventAPI";
import puzzleStateManager from "../services/puzzleStateManager";
import { normalizeUserId } from "../features/liveCompetition/leaderboardUtils";
import toast from "react-hot-toast";

const LiveEventContext = createContext();

export const useLiveEvent = () => {
  const context = useContext(LiveEventContext);
  if (!context) {
    throw new Error(
      "useLiveEvent must be used within a LiveEventProvider",
    );
  }
  return context;
};

export const LiveEventProvider = ({ children }) => {
  const [event, setEvent] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [puzzles, setPuzzles] = useState([]);
  const [participant, setParticipant] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [eventEnded, setEventEnded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [totalPuzzleCount, setTotalPuzzleCount] = useState(0);
  const [forceRenderTick, setForceRenderTick] = useState(0);
  const [spectator, setSpectator] = useState(false);

  useEffect(() => {
    if (!event) return;

    const now = Date.now();
    const startTime = new Date(event.startTime).getTime();
    const endTime = new Date(event.endTime).getTime();

    let startTimeout, endTimeout;

    if (now < startTime) {
      const waitTime = startTime - now;
      startTimeout = setTimeout(() => {
        setForceRenderTick(prev => prev + 1);
        toast.success("Event is now LIVE! Good luck!");
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
  }, [event]);

  useEffect(() => {
    const initializeState = async () => {
      const currentPath = window.location.pathname;
      const eventMatch = currentPath.match(/\/live-event\/([^\/]+)/);

      if (eventMatch) {
        const eventId = eventMatch[1];
        console.log("Initializing event state for:", eventId);

        try {
          await loadEventPuzzles(eventId);
          await getLeaderboard(eventId);

          const token = localStorage.getItem("token");
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          if (token && user && !socketEventService.isConnected) {
            try {
              const evtData = { event: { id: eventId, name: "" } };
              await socketEventService.connect(evtData);
              setIsConnected(true);
            } catch (sockErr) {
              console.error("Socket reconnect failed:", sockErr.message);
            }
          }
        } catch (error) {
          console.error("Failed to restore event state:", error);
        }
      }
    };

    initializeState();
  }, []);

  useEffect(() => {
    const handleLeaderboardUpdate = (newLeaderboard) => {
      setLeaderboard(newLeaderboard);
      
      if (newLeaderboard && newLeaderboard.length > 0) {
        setParticipant((prev) => {
          if (!prev) return prev;
          const currentUserId = normalizeUserId(prev.userId?._id || prev.userId);
          const entry = newLeaderboard.find((e) => {
            const entryId = normalizeUserId(e.userId);
            return (currentUserId && entryId && currentUserId === entryId) ||
              (prev.username && e.username && prev.username === e.username);
          });
          if (entry) {
            return {
              ...prev,
              score: entry.score,
              puzzlesSolved: entry.puzzlesSolved,
              timeSpent: entry.timeSpent,
              status: entry.status,
            };
          }
          return prev;
        });
      }
      
      setLastUpdate(new Date());
    };

    const handleEventJoined = (data) => {
      if (data?.leaderboard?.length) {
        setLeaderboard(data.leaderboard);
        
        setParticipant((prev) => {
          if (!prev) return prev;
          const currentUserId = normalizeUserId(prev.userId?._id || prev.userId);
          const entry = data.leaderboard.find((e) => {
            const entryId = normalizeUserId(e.userId);
            return (currentUserId && entryId && currentUserId === entryId) ||
              (prev.username && e.username && prev.username === e.username);
          });
          if (entry) {
            return {
              ...prev,
              score: entry.score,
              puzzlesSolved: entry.puzzlesSolved,
              timeSpent: entry.timeSpent,
              status: entry.status,
            };
          }
          return prev;
        });
        
        setLastUpdate(new Date());
      }
    };

    const handleLiveScoreUpdate = (data) => {
      const incomingId = normalizeUserId(data.userId);

      setLeaderboard((prev) => {
        let found = false;
        const updated = prev.map((entry) => {
          const entryId = normalizeUserId(entry.userId);
          const isMatch =
            (incomingId && entryId && incomingId === entryId) ||
            (data.username && entry.username && data.username === entry.username);
          if (isMatch) {
            found = true;
            return {
              ...entry,
              score: data.score,
              puzzlesSolved: data.puzzlesSolved,
              timeSpent: data.timeSpent,
              status: data.status,
            };
          }
          return entry;
        });

        if (!found) {
          updated.push({
            userId: incomingId || data.userId,
            username: data.username,
            score: data.score,
            puzzlesSolved: data.puzzlesSolved,
            timeSpent: data.timeSpent,
            status: data.status,
          });
        }

        const sorted = updated.sort((a, b) => b.score - a.score || a.timeSpent - b.timeSpent);
        return sorted.map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));
      });

      setParticipant((prev) => {
        if (!prev) return prev;
        const currentUserId = normalizeUserId(prev.userId?._id || prev.userId);
        const isMatch =
          (incomingId && currentUserId && incomingId === currentUserId) ||
          (data.username && prev.username && data.username === prev.username);
        if (isMatch) {
          return {
            ...prev,
            score: data.score,
            puzzlesSolved: data.puzzlesSolved,
            timeSpent: data.timeSpent,
            status: data.status,
          };
        }
        return prev;
      });

      setLastUpdate(new Date());
    };

    const handleEventEnded = (finalResults) => {
      setEventEnded(true);
      setLeaderboard(finalResults.leaderboard);
      toast.success(finalResults.message);
      setTimeout(() => disconnectFromEvent(), 10000);
    };

    const handleParticipantJoined = (data) => {
      if (data.userId || data.username) {
        const incomingId = normalizeUserId(data.userId);
        setLeaderboard((prev) => {
          const alreadyIn = prev.some((entry) => {
            const entryId = normalizeUserId(entry.userId);
            return (incomingId && entryId && incomingId === entryId) ||
              (data.username && entry.username && data.username === entry.username);
          });
          if (alreadyIn) return prev;
          return [
            ...prev,
            {
              userId: incomingId || data.userId,
              username: data.username,
              score: 0,
              puzzlesSolved: 0,
              timeSpent: 0,
              status: "JOINED",
              rank: prev.length + 1,
            },
          ];
        });
        setLastUpdate(new Date());
      }
    };

    const handleParticipantSubmitted = (data) => {
      toast(`${data.username} submitted their solution!`, { icon: "🏁" });
    };

    const handleError = (error) => {
      setError(error.message);
    };

    socketEventService.on("eventJoined", handleEventJoined);
    socketEventService.on("leaderboardUpdate", handleLeaderboardUpdate);
    socketEventService.on("liveScoreUpdate", handleLiveScoreUpdate);
    socketEventService.on("eventEnded", handleEventEnded);
    socketEventService.on("participantJoined", handleParticipantJoined);
    socketEventService.on("participantSubmitted", handleParticipantSubmitted);
    socketEventService.on("error", handleError);

    return () => {
      socketEventService.off("eventJoined", handleEventJoined);
      socketEventService.off("leaderboardUpdate", handleLeaderboardUpdate);
      socketEventService.off("liveScoreUpdate", handleLiveScoreUpdate);
      socketEventService.off("eventEnded", handleEventEnded);
      socketEventService.off("participantJoined", handleParticipantJoined);
      socketEventService.off("participantSubmitted", handleParticipantSubmitted);
      socketEventService.off("error", handleError);
    };
  }, []);

  const ensureSocketConnection = async (eventId) => {
    if (!eventId) return;

    if (!socketEventService.isConnected) {
      try {
        const evtData = { event: { id: eventId, name: "" } };
        await socketEventService.connect(evtData);
        setIsConnected(true);
      } catch (err) {
        console.error(`Failed socket connect`, err);
      }
    } else {
      setIsConnected(true);
    }
  };

  const participateInEvent = async (eventId, username) => {
    try {
      setIsLoading(true);
      setError(null);

      setEvent(null);
      setLeaderboard([]);
      setPuzzles([]);
      setParticipant(null);
      setEventEnded(false);
      setSpectator(false);

      const response = await liveEventAPI.participate(eventId, username);

      if (!response.success) {
        throw new Error(response.error || "Failed to participate");
      }

      if (response.spectator) {
        setSpectator(true);
        setEvent(response.event);
        setIsConnected(true);
        await socketEventService.connect(response);
        await getLeaderboard(eventId);
        toast.error("You are a spectator. Waiting for admin approval.", { duration: 5000 });
        return response;
      }

      await socketEventService.connect(response);

      setEvent(response.event);
      setTotalPuzzleCount(response.event.puzzles?.length || 0);
      setIsConnected(true);

      await loadEventPuzzles(eventId);
      await getLeaderboard(eventId);

      toast.success(`Successfully joined ${response.event.name}!`);
      return response;
    } catch (error) {
      console.error("Participation failed:", error);
      if (error.message && !error.message.includes("already")) {
        setError(error.message);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadEventPuzzles = async (eventId) => {
    if (!eventId) return;
    try {
      const response = await liveEventAPI.getPuzzles(eventId);

      if (response.success) {
        if (!event) {
          setEvent(response.event);
          setTotalPuzzleCount(response.event?.totalPuzzles || response.puzzles.length);
        }

        const storedStates = puzzleStateManager.getAllPuzzleStates(`event_${eventId}`);

        const puzzlesWithStates = response.puzzles.map((puzzle) => {
          const storedState = storedStates[puzzle._id];
          let finalStatus = "unsolved";
          let isSolved = false;
          let isFailed = false;
          let isLocked = false;

          if (puzzle.status && (puzzle.status === "solved" || puzzle.status === "failed")) {
            finalStatus = puzzle.status;
            isSolved = puzzle.status === "solved";
            isFailed = puzzle.status === "failed";
            isLocked = true;
          } else if (storedState && (storedState.status === "solved" || storedState.status === "failed")) {
            finalStatus = storedState.status;
            isSolved = storedState.status === "solved";
            isFailed = storedState.status === "failed";
            isLocked = storedState.isLocked || true;
          } else if (puzzle.isSolved || puzzle.isFailed) {
            finalStatus = puzzle.isSolved ? "solved" : "failed";
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
            boardPosition: puzzle.boardPosition || storedState?.boardPosition,
            moveHistory: puzzle.moveHistory || storedState?.moveHistory || [],
            solvedData: puzzle.solvedData || (storedState?.status === "solved" ? {
              scoreEarned: storedState.scoreEarned,
              timeSpent: storedState.timeSpent,
              solvedAt: storedState.solvedAt,
            } : null),
          };
        });

        setPuzzles(puzzlesWithStates);
        setParticipant(response.participant);

        puzzlesWithStates.forEach((puzzle) => {
          if (puzzle.status !== "unsolved") {
            const stateToSave = {
              status: puzzle.status,
              boardPosition: puzzle.boardPosition,
              moveHistory: puzzle.moveHistory,
              timeSpent: puzzle.solvedData?.timeSpent || 0,
              isLocked: puzzle.isLocked,
              scoreEarned: puzzle.solvedData?.scoreEarned || 0,
            };
            if (puzzle.status === "solved") {
              stateToSave.solvedAt = puzzle.solvedData?.solvedAt || Date.now();
            } else if (puzzle.status === "failed") {
              stateToSave.failedAt = Date.now();
            }
            puzzleStateManager.savePuzzleState(`event_${eventId}`, puzzle._id, stateToSave);
          }
        });
      }
    } catch (error) {
      console.error("Failed to load puzzles:", error);
    }
  };

  const submitSolution = async (puzzleId, solution, timeSpent, boardPosition = null, moveHistory = []) => {
    try {
      setIsLoading(true);
      const response = await liveEventAPI.submitSolution(event.id || event._id, puzzleId, solution, timeSpent, boardPosition, moveHistory);

      if (response.success || response.isCorrect === false) {
        const isCorrect = response.isCorrect !== false;
        const puzzleStatus = response.puzzleStatus || (isCorrect ? "solved" : "failed");

        setParticipant((prev) => ({
          ...prev,
          score: response.totalScore,
          puzzlesSolved: response.puzzlesSolved,
        }));

        setPuzzles((prev) =>
          prev.map((puzzle) =>
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
                  solvedAt: new Date(),
                } : null,
              }
              : puzzle,
          ),
        );

        if (isCorrect) {
          puzzleStateManager.markPuzzleSolved(`event_${event.id || event._id}`, puzzleId, response.scoreEarned, timeSpent, boardPosition);
          toast.success(`Puzzle solved! +${response.scoreEarned} points`);
        } else {
          puzzleStateManager.markPuzzleFailed(`event_${event.id || event._id}`, puzzleId, timeSpent, boardPosition);
          toast.error("Incorrect solution. Puzzle is now locked.");
        }

        getLeaderboard(event.id || event._id);
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

  const getLeaderboard = React.useCallback(async (eventIdOverride = null) => {
    try {
      const evtId = eventIdOverride || event?.id || event?._id;
      if (!evtId) return;

      const response = await liveEventAPI.getLeaderboard(evtId);
      if (response.success) {
        setLeaderboard(response.leaderboard);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    }
  }, [event?.id, event?._id]);

  useEffect(() => {
    const evtId = event?.id || event?._id;
    if (!evtId || eventEnded) return;

    const isLive = isEventActive();
    if (!isLive) return;

    const syncInterval = setInterval(() => {
      console.log(`[LiveEvent] Background refresh trigger (ID: ${evtId})`);
      getLeaderboard(evtId);
    }, 10000); // 10 seconds as requested

    return () => clearInterval(syncInterval);
  }, [event?.id, event?._id, eventEnded, forceRenderTick, getLeaderboard]);

  const updateParticipant = (data) => {
    setParticipant((prev) => {
      if (!prev) return data;
      return {
        ...prev,
        ...data,
      };
    });
  };

  const disconnectFromEvent = () => {
    socketEventService.disconnect();
    setIsConnected(false);
    setEvent(null);
    setLeaderboard([]);
    setPuzzles([]);
    setParticipant(null);
    setEventEnded(false);
    setError(null);
    setLastUpdate(null);
    setTotalPuzzleCount(0);
    setSpectator(false);
  };

  const getCurrentUserRank = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!storedUser || (!storedUser.id && !storedUser._id && !storedUser.username)) return null;

    const targetId = normalizeUserId(storedUser.id || storedUser._id);
    const userEntry = leaderboard.find((entry) => {
      const entryId = normalizeUserId(entry.userId);
      const idMatch = targetId && entryId && entryId === targetId;
      const usernameMatch = entry.username && storedUser.username && entry.username === storedUser.username;
      return idMatch || usernameMatch;
    });

    return userEntry?.rank ?? null;
  };

  const getSolvedPuzzlesCount = () => {
    return puzzles.filter((puzzle) => puzzle.isSolved).length;
  };

  const getTotalPuzzlesCount = () => {
    if (puzzles && puzzles.length > 0) return puzzles.length;
    if (event && event.puzzles && event.puzzles.length > 0) return event.puzzles.length;
    return totalPuzzleCount || 0;
  };

  const isEventActive = () => {
    const _tick = forceRenderTick;
    if (!event) return false;
    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    return now >= startTime && now <= endTime && !eventEnded;
  };

  return (
    <LiveEventContext.Provider value={{
      event,
      leaderboard,
      puzzles,
      participant,
      isConnected,
      isLoading,
      error,
      eventEnded,
      spectator,
      participateInEvent,
      submitSolution,
      disconnectFromEvent,
      getSolvedPuzzlesCount,
      getTotalPuzzlesCount,
      isEventActive,
      getCurrentUserRank,
      getLeaderboard,
      updateParticipant,
    }}>
      {children}
    </LiveEventContext.Provider>
  );
};
