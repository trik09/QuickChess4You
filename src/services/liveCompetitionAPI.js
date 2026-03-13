import { apiRequest as baseRequest } from "./http";
import { clearUserAuth, getUserToken } from "./authStorage";

const apiRequest = async (endpoint, options = {}, token = null) => {
  const authToken = token || getUserToken();
  try {
    return await baseRequest(endpoint, options, authToken);
  } catch (err) {
    if (err?.status === 401) {
      clearUserAuth();
      throw new Error("Session expired. Please login again.");
    }
    throw err;
  }
};

/**
 * Live Competition APIs
 */
// ─── Short-lived cache for getLobbyState (supports prefetching from Dashboard) ───
const lobbyCache = new Map();
const LOBBY_CACHE_TTL = 3000; // 3 seconds

// Helper to get from sessionStorage safely
const getSessionCache = (competitionId) => {
  try {
    const cachedStr = sessionStorage.getItem(`lobbyCache_${competitionId}`);
    if (cachedStr) {
      const parsed = JSON.parse(cachedStr);
      // Let sessionStorage cache live for 60 seconds to survive page reloads smoothly
      if (Date.now() - parsed.timestamp < 60000) {
        return parsed.data;
      }
    }
  } catch (err) {
    console.error("Session storage cache read error", err);
  }
  return null;
};

// Helper to save to sessionStorage safely
const saveSessionCache = (competitionId, data) => {
  try {
    sessionStorage.setItem(`lobbyCache_${competitionId}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (err) {
    // Ignore QuotaExceeded errors
  }
};

export const liveCompetitionAPI = {
  // Participate in live competition (REST API validation)
  participate: async (competitionId, username, accessCode = null) => {
    const userToken = getUserToken();
    const body = { username };
    if (accessCode) {
      body.accessCode = accessCode;
    }
    return apiRequest(
      `/live-competition/${competitionId}/participate`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      userToken
    );
  },

  // Submit entire competition (early submission)
  submitCompetition: async (competitionId) => {
    const userToken = getUserToken();
    return apiRequest(
      `/live-competition/${competitionId}/submit`,
      {
        method: "POST",
      },
      userToken
    );
  },

  // Submit puzzle solution with Socket.IO notification
  submitSolution: async (competitionId, puzzleId, solution, timeSpent, boardPosition = null, moveHistory = []) => {
    const userToken = getUserToken();
    const body = { solution, timeSpent };

    if (boardPosition) {
      body.boardPosition = boardPosition;
    }

    if (moveHistory && moveHistory.length > 0) {
      body.moveHistory = moveHistory;
    }

    return apiRequest(
      `/live-competition/${competitionId}/puzzles/${puzzleId}/submit`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      userToken
    );
  },

  // Get live leaderboard (REST API fallback)
  getLeaderboard: async (competitionId) => {
    return apiRequest(`/live-competition/${competitionId}/leaderboard?t=${Date.now()}`, {
      method: "GET",
    });
  },

  getLobbyState: async (competitionId, bypassCache = false) => {
    // Check cache first (supports prefetch from Dashboard hover without delay)
    if (!bypassCache) {
      // 1. Check tight memory cache first (3s TTL)
      const cached = lobbyCache.get(competitionId);
      if (cached && (Date.now() - cached.timestamp) < LOBBY_CACHE_TTL) {
        return cached.data;
      }

      // 2. Check slightly longer sessionStorage cache to prevent 4s load times on hard reload
      const sessionCachedData = getSessionCache(competitionId);
      if (sessionCachedData) {
        // Return instantly, but we might still want to trigger a background sweep in the UI later
        return sessionCachedData;
      }
    }

    const token = localStorage.getItem("token");
    const result = await apiRequest(
      `/live-competition/${competitionId}/lobby-state`,
      { method: "GET" },
      token
    );

    // Cache the result ONLY if it wasn't a bypass call, 
    // or cache it anyway since it's fresh data
    lobbyCache.set(competitionId, { data: result, timestamp: Date.now() });
    saveSessionCache(competitionId, result);
    return result;
  },

  // Check for active participation
  getActiveParticipation: async () => {
    const userToken = getUserToken();
    return apiRequest(
      `/live-competition/user/active-participation`,
      { method: "GET" },
      userToken
    );
  },


  // Get competition puzzles for participants
  getPuzzles: async (competitionId) => {
    const userToken = getUserToken();
    return apiRequest(
      `/live-competition/${competitionId}/puzzles`,
      {
        method: "GET",
      },
      userToken
    );
  },

  // Start competition (Admin only)
  startCompetition: async (competitionId) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/live-competition/${competitionId}/start`,
      {
        method: "POST",
      },
      adminToken
    );
  },
};

export default liveCompetitionAPI;