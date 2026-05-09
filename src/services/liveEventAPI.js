import { apiRequest as baseRequest } from "./http";
import { clearUserAuth, getUserToken } from "./authStorage";

const apiRequest = async (endpoint, options = {}, token = null) => {
  const authToken = token || getUserToken();
  return await baseRequest(endpoint, options, authToken);
};

/**
 * Live Event APIs
 */
const eventLobbyCache = new Map();
const LOBBY_CACHE_TTL = 3000; 

const getSessionCache = (eventId) => {
  try {
    const cachedStr = sessionStorage.getItem(`eventLobbyCache_${eventId}`);
    if (cachedStr) {
      const parsed = JSON.parse(cachedStr);
      if (Date.now() - parsed.timestamp < 5000) {
        return parsed.data;
      }
    }
  } catch (err) {
    console.error("Session storage cache read error", err);
  }
  return null;
};

const saveSessionCache = (eventId, data) => {
  try {
    sessionStorage.setItem(`eventLobbyCache_${eventId}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (err) {
  }
};

export const liveEventAPI = {
  participate: async (eventId, username) => {
    const userToken = getUserToken();
    const body = { username };
    return apiRequest(
      `/live-event/${eventId}/participate`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      userToken
    );
  },

  submitEvent: async (eventId) => {
    const userToken = getUserToken();
    return apiRequest(
      `/live-event/${eventId}/submit`,
      {
        method: "POST",
      },
      userToken
    );
  },

  submitSolution: async (eventId, puzzleId, solution, timeSpent, boardPosition = null, moveHistory = []) => {
    const userToken = getUserToken();
    const body = { solution, timeSpent };

    if (boardPosition) {
      body.boardPosition = boardPosition;
    }

    if (moveHistory && moveHistory.length > 0) {
      body.moveHistory = moveHistory;
    }

    return apiRequest(
      `/live-event/${eventId}/puzzles/${puzzleId}/submit`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      userToken
    );
  },

  getLeaderboard: async (eventId) => {
    return apiRequest(`/live-event/${eventId}/leaderboard?t=${Date.now()}`, {
      method: "GET",
    });
  },

  getLobbyState: async (eventId, bypassCache = false) => {
    if (!bypassCache) {
      const cached = eventLobbyCache.get(eventId);
      if (cached && (Date.now() - cached.timestamp) < LOBBY_CACHE_TTL) {
        return cached.data;
      }

      const sessionCachedData = getSessionCache(eventId);
      if (sessionCachedData) {
        return sessionCachedData;
      }
    }

    const token = localStorage.getItem("token");
    const result = await apiRequest(
      `/live-event/${eventId}/leaderboard`,
      { method: "GET" },
      token
    );

    if (result.success) {
      const mappedResult = {
        success: true,
        competition: result.event,
        leaderboard: result.leaderboard || [],
        competitionState: result.eventState || "UPCOMING",
        participantState: result.participantState === "NOT_JOINED" 
          ? "NOT_JOINED" 
          : result.isApproved 
            ? result.participantState 
            : "PENDING",
        serverTime: result.serverTime
      };
      eventLobbyCache.set(eventId, { data: mappedResult, timestamp: Date.now() });
      saveSessionCache(eventId, mappedResult);
      return mappedResult;
    }

    return result;
  },

  getActiveParticipation: async () => {
    const userToken = getUserToken();
    return apiRequest(
      `/live-event/user/active-participation`,
      { method: "GET" },
      userToken
    );
  },

  getPuzzles: async (eventId) => {
    const userToken = getUserToken();
    return apiRequest(
      `/live-event/${eventId}/puzzles`,
      {
        method: "GET",
      },
      userToken
    );
  },
};

export default liveEventAPI;
