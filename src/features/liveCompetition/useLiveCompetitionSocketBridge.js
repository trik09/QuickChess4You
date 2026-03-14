import { useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import socketService from "../../services/socketService";
import { deduplicateLeaderboard } from "./leaderboardUtils";

/**
 * Bridge SocketService events into React state setters.
 * This is intentionally behavior-preserving: it mirrors the prior
 * LiveCompetitionContext socket wiring and actions.
 */
export function useLiveCompetitionSocketBridge({
  setLeaderboard,
  setLastUpdate,
  setCompetitionEnded,
  setError,
  setIsConnected,
  disconnectFromCompetition,
}) {
  useEffect(() => {
    const handleLeaderboardUpdate = (newLeaderboard) => {
      console.log(
        "[LiveComp] Socket: leaderboardUpdate, entries:",
        newLeaderboard?.length,
      );
      setLeaderboard(deduplicateLeaderboard(newLeaderboard));
      setLastUpdate(new Date());
    };

    const handleLiveScoreUpdate = (data) => {
      console.log(
        "[LiveComp] Socket: liveScoreUpdate",
        data.username,
        data.score,
      );
      setLeaderboard((prev) => {
        const updated = prev.map((entry) =>
          entry.userId === data.userId?.toString() || entry.userId === data.userId
            ? {
                ...entry,
                score: data.score,
                puzzlesSolved: data.puzzlesSolved,
                timeSpent: data.timeSpent,
                status: data.status,
              }
            : entry,
        );
        return deduplicateLeaderboard(updated);
      });
      setLastUpdate(new Date());
    };

    const handleCompetitionEnded = (finalResults) => {
      setCompetitionEnded(true);
      setLeaderboard(deduplicateLeaderboard(finalResults.leaderboard));
      toast.success(finalResults.message, { duration: 5000 });
      setTimeout(() => disconnectFromCompetition(), 10000);
    };

    const handleParticipantJoined = (data) => {
      console.log("[LiveComp] Socket: participantJoined", data.username);
      // Removed toast to decrease noise
    };

    const handleParticipantSubmitted = (data) => {
      toast(`${data.username} submitted their solution!`, {
        icon: "🏁",
        duration: 3000,
      });
    };

    const handleError = (error) => {
      console.error("Socket error state:", error);
      setError(error.message);
    };

    socketService.on("leaderboardUpdate", handleLeaderboardUpdate);
    socketService.on("liveScoreUpdate", handleLiveScoreUpdate);
    socketService.on("competitionEnded", handleCompetitionEnded);
    socketService.on("participantJoined", handleParticipantJoined);
    socketService.on("participantSubmitted", handleParticipantSubmitted);
    socketService.on("error", handleError);

    return () => {
      socketService.off("leaderboardUpdate", handleLeaderboardUpdate);
      socketService.off("liveScoreUpdate", handleLiveScoreUpdate);
      socketService.off("competitionEnded", handleCompetitionEnded);
      socketService.off("participantJoined", handleParticipantJoined);
      socketService.off("participantSubmitted", handleParticipantSubmitted);
      socketService.off("error", handleError);
    };
  }, [
    disconnectFromCompetition,
    setCompetitionEnded,
    setError,
    setIsConnected,
    setLastUpdate,
    setLeaderboard,
  ]);

  const ensureSocketConnection = useCallback(
    async (competitionId) => {
      if (!competitionId) return;

      if (!socketService.isConnected) {
        try {
          console.log(
            `[LiveComp] ensureSocketConnection: Manually connecting socket for ${competitionId}`,
          );
          const compData = { competition: { id: competitionId, name: "" } };
          await socketService.connect(compData);
          setIsConnected(true);
          socketService.emit("joinCompetition", { competitionId });
        } catch (err) {
          console.error(`[LiveComp] ensureSocketConnection: Failed`, err);
        }
      } else {
        socketService.emit("joinCompetition", { competitionId });
        setIsConnected(true);
      }
    },
    [setIsConnected],
  );

  const refreshLeaderboard = useCallback(() => {
    socketService.refreshLeaderboard();
  }, []);

  return {
    ensureSocketConnection,
    refreshLeaderboard,
  };
}

