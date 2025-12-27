// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

/**
 * Generic API request function for live competitions
 */
const apiRequest = async (endpoint, options = {}, token = null) => {
  const authToken = token || localStorage.getItem("token");

  const config = {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || 'An error occurred');
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || 'An error occurred');
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Could not connect to server. Please check if the backend is running.');
    }
    throw error;
  }
};

/**
 * Live Competition APIs
 */
export const liveCompetitionAPI = {
  // Participate in live competition (REST API validation)
  participate: async (competitionId, username) => {
    const userToken = localStorage.getItem("token");
    return apiRequest(
      `/live-competition/${competitionId}/participate`,
      {
        method: "POST",
        body: JSON.stringify({ username }),
      },
      userToken
    );
  },

  // Submit puzzle solution with Socket.IO notification
  submitSolution: async (competitionId, puzzleId, solution, timeSpent) => {
    const userToken = localStorage.getItem("token");
    return apiRequest(
      `/live-competition/${competitionId}/puzzles/${puzzleId}/submit`,
      {
        method: "POST",
        body: JSON.stringify({ solution, timeSpent }),
      },
      userToken
    );
  },

  // Get live leaderboard (REST API fallback)
  getLeaderboard: async (competitionId) => {
    return apiRequest(`/live-competition/${competitionId}/leaderboard`, {
      method: "GET",
    });
  },

  // Get competition puzzles for participants
  getPuzzles: async (competitionId) => {
    const userToken = localStorage.getItem("token");
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