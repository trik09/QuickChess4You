import { apiRequest as baseRequest } from "./http";
import { getAdminToken, getUserToken } from "./authStorage";

const apiRequest = (endpoint, options = {}, token = null) => {
  const authToken = token || getAdminToken();
  return baseRequest(endpoint, options, authToken);
};


/**
 * Authentication APIs
 */
export const authAPI = {
  // Register a new user
  register: async (userData, avatarFile) => {
    const formData = new FormData();
    formData.append('name', userData.name);
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    formData.append('username', userData.username);

    if (userData.wins !== undefined) formData.append('wins', userData.wins);
    if (userData.losses !== undefined) formData.append('losses', userData.losses);
    if (userData.draws !== undefined) formData.append('draws', userData.draws);

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    return apiRequest("/user/register", {
      method: "POST",
      body: formData,
    });
  },

  // Login user
  login: async (email, password) => {
    return apiRequest("/user/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  // Send OTP to user's email
  sendOTP: async (email) => {
    return apiRequest("/user/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // Verify OTP and login
  verifyOTP: async (email, otp) => {
    return apiRequest("/user/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },

  // Reset password
  resetPassword: async (password, token) => {
    return apiRequest(
      "/user/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ password }),
      },
      token
    );
  },

  // Send OTP for signup email verification
  sendSignupOTP: async (userData) => {
    return apiRequest("/user/send-signup-otp", {
      method: "POST",
      body: JSON.stringify({
        email: userData.email,
        name: userData.name,
        username: userData.username,
        password: userData.password
      }),
    });
  },

  // Verify signup OTP and complete registration
  verifySignupOTP: async (email, otp, userData) => {
    return apiRequest("/user/verify-signup-otp", {
      method: "POST",
      body: JSON.stringify({
        email,
        otp,
        name: userData.name,
        username: userData.username,
        password: userData.password
      }),
    });
  },

  // Google OAuth authentication
  googleAuth: async (credential) => {
    return apiRequest("/user/google-auth", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
  },

  // Get current user data
  getCurrentUser: async () => {
    const userToken = getUserToken();
    return apiRequest(
      "/user/me",
      {
        method: "GET",
      },
      userToken
    );
  },

  // Update user profile (name, username, avatar)
  updateUser: async (userData, avatarFile) => {
    const userToken = getUserToken();
    const formData = new FormData();

    if (userData.name) formData.append('name', userData.name);
    if (userData.username) formData.append('username', userData.username);

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    return apiRequest(
      "/user/update",
      {
        method: "PUT",
        body: formData,
      },
      userToken
    );
  },

  // Check if a username is available (real-time availability check)
  checkUsername: async (username) => {
    return apiRequest(
      `/user/check-username?username=${encodeURIComponent(username)}`,
      { method: "GET" }
    );
  },
};

/**
 * Admin APIs - puzzle management
 */
export const adminAPI = {
  // Login admin
  login: async (email, password) => {
    return apiRequest(
      "/admin/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      null
    ); // Don't send token for login
  },
  // Get all puzzles (admin view) with server-side pagination and filters
  getPuzzles: async (params = {}) => {
    const adminToken = localStorage.getItem("atoken");
    const query = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      search: params.search || '',
      category: params.category || '',
      difficulty: params.difficulty || '',
      level: params.level || '',
      isDailyTraining: params.isDailyTraining !== undefined ? params.isDailyTraining : '',
    }).toString();
    return apiRequest(`/puzzle/get-puzzles?${query}`, { method: "GET" }, adminToken);
  },
  // Get a puzzle by id
  getPuzzleById: async (id) => {
    const adminToken = localStorage.getItem("atoken");
    // backend route: router.get('/get-puzzle/:id', ...)
    return apiRequest(
      `/puzzle/get-puzzle/${id}`,
      {
        method: "GET",
      },
      adminToken
    );
  },

  // Create a puzzle
  createPuzzle: async (puzzleData) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest("/puzzle/create-puzzle", {
      method: "POST",
      body: JSON.stringify(puzzleData),
    }, adminToken);
  },

  // Bulk create puzzles
  bulkCreatePuzzles: async (puzzles) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest("/puzzle/bulk-create-puzzle", {
      method: "POST",
      body: JSON.stringify(puzzles),
    }, adminToken);
  },

  // Export puzzles (all or selected)
  exportPuzzles: async (puzzleIds = null) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest("/puzzle/export-puzzles", {
      method: "POST",
      body: JSON.stringify({ puzzleIds }),
    }, adminToken);
  },

  // Update a puzzle
  updatePuzzle: async (id, puzzleData) => {
    const adminToken = localStorage.getItem("atoken");
    // backend route: router.put('/update-puzzle/:id', ...)
    return apiRequest(
      `/puzzle/update-puzzle/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(puzzleData),
      },
      adminToken
    );
  },
  // Delete a puzzle
  deletePuzzle: async (id) => {
    const adminToken = localStorage.getItem("atoken");
    // backend route: router.delete('/delete-puzzle/:id', ...)
    return apiRequest(
      `/puzzle/delete-puzzle/${id}`,
      {
        method: "DELETE",
      },
      adminToken
    );
  },

  // Delete ALL puzzles
  deleteAllPuzzles: async () => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/puzzle/delete-all-puzzles",
      {
        method: "DELETE",
      },
      adminToken
    );
  },

  // Delete multiple puzzles
  deleteMultiplePuzzles: async (puzzleIds) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/puzzle/delete-multiple-puzzles",
      {
        method: "POST",
        body: JSON.stringify({ puzzleIds }),
      },
      adminToken
    );
  },

  validatePuzzles: async () => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest("/puzzle/validate-puzzles", {}, adminToken);
  },

  deleteInvalidPuzzles: async (puzzleIds) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/puzzle/delete-invalid-puzzles",
      {
        method: "POST",
        body: JSON.stringify({ puzzleIds }),
      },
      adminToken
    );
  },

  // Import puzzles from Lichess
  importFromLichess: async (count = 50) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/puzzle/import-lichess",
      {
        method: "POST",
        body: JSON.stringify({ count }),
      },
      adminToken
    );
  },

  // Get puzzles with filters
  getPuzzlesFiltered: async (filters = {}) => {
    const adminToken = localStorage.getItem("atoken");
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(
      `/puzzle/puzzles-filtered?${queryParams}`,
      {
        method: "GET",
      },
      adminToken
    );
  },

  // Get puzzle statistics
  getPuzzleStats: async () => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/puzzle/puzzle-stats",
      {
        method: "GET",
      },
      adminToken
    );
  },

  // Get all users/students
  getAllUsers: async () => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/admin/users",
      {
        method: "GET",
      },
      adminToken
    );
  },

  // Delete a user by ID
  deleteUser: async (id) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/admin/users/${id}`,
      {
        method: "DELETE",
      },
      adminToken
    );
  },

  // Toggle daily training status
  toggleDailyTraining: async (id, isDailyTraining) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/puzzle/toggle-daily/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ isDailyTraining }),
      },
      adminToken
    );
  },

  // Fetch all sub-admins
  getSubAdmins: async () => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest("/admin/sub-admins", { method: "GET" }, adminToken);
  },

  // Create sub-admin
  createSubAdmin: async (adminData) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest("/admin/sub-admins", {
      method: "POST",
      body: JSON.stringify(adminData),
    }, adminToken);
  },

  // Update sub-admin
  updateSubAdmin: async (id, adminData) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(`/admin/sub-admins/${id}`, {
      method: "PUT",
      body: JSON.stringify(adminData),
    }, adminToken);
  },

  // Delete sub-admin
  deleteSubAdmin: async (id) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(`/admin/sub-admins/${id}`, {
      method: "DELETE",
    }, adminToken);
  },
};

/**
 * Public puzzle APIs
 */
export const puzzleAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `/puzzle/get-puzzles${queryParams ? `?${queryParams}` : ''}`;
    return apiRequest(
      url,
      {
        method: "GET",
      },
      null
    );
  },

  // Get random puzzle from Lichess (for casual play)
  getRandomPuzzle: async () => {
    return apiRequest(
      "/puzzle/random-puzzle",
      {
        method: "GET",
      },
      null
    );
  },
};

/**
 * Category APIs
 */
export const categoryAPI = {
  // Get all categories
  getAll: async (includeInactive = false) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/category/get-categories?includeInactive=${includeInactive}`,
      {
        method: "GET",
      },
      adminToken
    );
  },

  // Get category by ID
  getById: async (id) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/category/get-category/${id}`,
      {
        method: "GET",
      },
      adminToken
    );
  },

  // Create category
  createCategory: async (categoryData) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/category/create-category",
      {
        method: "POST",
        body: JSON.stringify(categoryData),
      },
      adminToken
    );
  },

  // Update category
  updateCategory: async (id, categoryData) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/category/update-category/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(categoryData),
      },
      adminToken
    );
  },

  // Delete category
  deleteCategory: async (id) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/category/delete-category/${id}`,
      {
        method: "DELETE",
      },
      adminToken
    );
  },

  // Get category statistics
  getStats: async () => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/category/category-stats",
      {
        method: "GET",
      },
      adminToken
    );
  },
};

export const competitionAPI = {
  // Get all competitions
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(
      `/competition/?${queryParams}`,
      {
        method: "GET",
      },
      null
    );
  },

  // Get competitions with filters (alias for getAll)
  getCompetitions: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(
      `/competition/?${queryParams}`,
      {
        method: "GET",
      },
      null
    );
  },

  // Get competition by ID
  getById: async (id) => {
    return apiRequest(`/competition/${id}`, {
      method: "GET",
    });
  },

  // Create competition
  createCompetition: async (competitionData) => {
    const adminToken = localStorage.getItem("atoken");

    return apiRequest(
      "/competition/create-competition",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(competitionData),
      },
      adminToken
    );
  },


  // Update competition
  updateCompetition: async (id, competitionData) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/competition/update-competition/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(competitionData),
      },
      adminToken
    );
  },

  // Delete competition
  deleteCompetition: async (id) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/competition/delete-competition/${id}`,
      {
        method: "DELETE",
      },
      adminToken
    );
  },

  // Join competition (user)
  joinCompetition: async (id, accessCode = null) => {
    const userToken = localStorage.getItem("token");
    const body = {};
    if (accessCode) {
      body.accessCode = accessCode;
    }

    return apiRequest(
      `/competition/${id}/join`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      userToken
    );
  },

  // Submit solution (user)
  submitSolution: async (competitionId, puzzleId, moves, timeTaken) => {
    const userToken = localStorage.getItem("token");
    return apiRequest(
      `/competition/${competitionId}/submit/${puzzleId}`,
      {
        method: "POST",
        body: JSON.stringify({ moves, timeTaken }),
      },
      userToken
    );
  },

  // Get leaderboard
  getLeaderboard: async (id) => {
    return apiRequest(`/competition/${id}/leaderboard`, {
      method: "GET",
    });
  },

  // Add puzzles to competition
  addPuzzlesToCompetition: async (competitionId, puzzleIds) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/competition/${competitionId}/add-puzzles`,
      {
        method: "POST",
        body: JSON.stringify({ puzzles: puzzleIds }),
      },
      adminToken
    );
  },

  // Get puzzles for competition creation with advanced filtering
  getPuzzlesForCompetition: async (filters = {}) => {
    const adminToken = localStorage.getItem("atoken");
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(
      `/competition/puzzles/for-competition?${queryParams}`,
      {
        method: "GET",
      },
      adminToken
    );
  },

  // Get puzzles by IDs (for fetching assigned puzzles)
  getPuzzlesByIds: async (puzzleIds = []) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/competition/puzzles/by-ids`,
      {
        method: "POST",
        body: JSON.stringify({ puzzleIds }),
      },
      adminToken
    );
  },
};

export const eventAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(
      `/event/?${queryParams}`,
      { method: "GET" },
      null
    );
  },

  getEvents: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(
      `/event/?${queryParams}`,
      { method: "GET" },
      null
    );
  },

  getById: async (id) => {
    return apiRequest(`/event/${id}`, { method: "GET" });
  },

  createEvent: async (eventData) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/event/create-event",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      },
      adminToken
    );
  },

  updateEvent: async (id, eventData) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/event/update-event/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(eventData),
      },
      adminToken
    );
  },

  deleteEvent: async (id) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/event/delete-event/${id}`,
      { method: "DELETE" },
      adminToken
    );
  },

  registerForEvent: async (id, details) => {
    const userToken = localStorage.getItem("token");
    return apiRequest(
      `/event/${id}/register`,
      {
        method: "POST",
        body: JSON.stringify(details),
      },
      userToken
    );
  },

  getUserRegistrations: async () => {
    const userToken = localStorage.getItem("token");
    return apiRequest(
      `/event/user/registrations`,
      { method: "GET" },
      userToken
    );
  },


  getParticipants: async (id) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/event/${id}/participants`,
      { method: "GET" },
      adminToken
    );
  },

  approveParticipant: async (id, participantId, isApproved) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/event/${id}/approve/${participantId}`,
      {
        method: "PUT",
        body: JSON.stringify({ isApproved }),
      },
      adminToken
    );
  },

  getPuzzlesForEvent: async (filters = {}) => {
    const adminToken = localStorage.getItem("atoken");
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(
      `/event/admin/puzzles/for-event?${queryParams}`,
      { method: "GET" },
      adminToken
    );
  },

  // Get puzzles by IDs (for fetching assigned puzzles)
  getPuzzlesByIds: async (puzzleIds = []) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/event/admin/puzzles/by-ids`,
      {
        method: "POST",
        body: JSON.stringify({ puzzleIds }),
      },
      adminToken
    );
  },
};

export const quizCategoryAPI = {

  getAll: async (includeInactive = false) => {
    return apiRequest(`/quiz-category/get-categories?includeInactive=${includeInactive}`, { method: "GET" }, null);
  },
  getById: async (id) => {
    return apiRequest(`/quiz-category/get-category/${id}`, { method: "GET" }, null);
  },
  createCategory: async (categoryData) => {
    return apiRequest("/quiz-category/create-category", { method: "POST", body: JSON.stringify(categoryData) }, localStorage.getItem("atoken"));
  },
  updateCategory: async (id, categoryData) => {
    return apiRequest(`/quiz-category/update-category/${id}`, { method: "PUT", body: JSON.stringify(categoryData) }, localStorage.getItem("atoken"));
  },
  deleteCategory: async (id) => {
    return apiRequest(`/quiz-category/delete-category/${id}`, { method: "DELETE" }, localStorage.getItem("atoken"));
  }
};

export const quizAPI = {
  getQuizzes: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(`/quiz/get-quizzes?${queryParams}`, { method: "GET" }, null);
  },
  getById: async (id) => {
    return apiRequest(`/quiz/get-quiz/${id}`, { method: "GET" }, null);
  },
  createQuiz: async (quizData) => {
    return apiRequest("/quiz/create-quiz", { method: "POST", body: JSON.stringify(quizData) }, localStorage.getItem("atoken"));
  },
  updateQuiz: async (id, quizData) => {
    return apiRequest(`/quiz/update-quiz/${id}`, { method: "PUT", body: JSON.stringify(quizData) }, localStorage.getItem("atoken"));
  },
  deleteQuiz: async (id) => {
    return apiRequest(`/quiz/delete-quiz/${id}`, { method: "DELETE" }, localStorage.getItem("atoken"));
  }
};

export const examAPI = {
  getAdminExams: async () => {
    return apiRequest("/exam/admin/get-exams", { method: "GET" }, localStorage.getItem("atoken"));
  },
  getAdminExamById: async (id) => {
    return apiRequest(`/exam/admin/get-exam/${id}`, { method: "GET" }, localStorage.getItem("atoken"));
  },
  // Alias used by CreateExam.jsx
  getAdminExam: async (id) => {
    return apiRequest(`/exam/admin/get-exam/${id}`, { method: "GET" }, localStorage.getItem("atoken"));
  },
  createExam: async (examData) => {
    return apiRequest("/exam/create-exam", { method: "POST", body: JSON.stringify(examData) }, localStorage.getItem("atoken"));
  },
  updateExam: async (id, examData) => {
    return apiRequest(`/exam/update-exam/${id}`, { method: "PUT", body: JSON.stringify(examData) }, localStorage.getItem("atoken"));
  },
  deleteExam: async (id) => {
    return apiRequest(`/exam/delete-exam/${id}`, { method: "DELETE" }, localStorage.getItem("atoken"));
  },
  getPublicExams: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(`/exam/public/get-exams?${queryParams}`, { method: "GET" }, null);
  },
  getExamDetails: async (id) => {
    return apiRequest(`/exam/public/get-exam/${id}`, { method: "GET" }, localStorage.getItem("token"));
  },
  submitExam: async (id, data) => {
    return apiRequest(`/exam/public/submit-exam/${id}`, { method: "POST", body: JSON.stringify(data) }, localStorage.getItem("token"));
  },
  getExamResults: async (id) => {
    return apiRequest(`/exam/public/exam-results/${id}`, { method: "GET" }, localStorage.getItem("token"));
  },
  joinExam: async (id) => {
    return apiRequest(`/exam/public/join-exam/${id}`, { method: "POST" }, localStorage.getItem("token"));
  }
};

export const chatAPI = {
  getChatHistory: async (competitionId) => {
    const userToken = localStorage.getItem("token");
    return apiRequest(`/live-competition/${competitionId}/chat`, { method: "GET" }, userToken);
  }
};

export default {
  authAPI,
  adminAPI,
  puzzleAPI,
  categoryAPI,
  competitionAPI,
  quizCategoryAPI,
  quizAPI,
  examAPI,
  eventAPI,
  chatAPI
};


