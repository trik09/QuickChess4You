// API Base URL - Update this to match your backend server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

/**
 * Generic API request function
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @param {string} token - Optional token (if not provided, will get from localStorage)
 */
const apiRequest = async (endpoint, options = {}, token = null) => {
  const authToken = token || localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
    ...options,
  };

  // Handle FormData (for file uploads)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle non-JSON responses
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
    // Re-throw with more context if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Could not connect to server. Please check if the backend is running.');
    }
    throw error;
  }
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
      formData.append('avatar', avatarFile);
    }

    return apiRequest('/user/register', {
      method: 'POST',
      body: formData,
    });
  },

  // Login user
  login: async (email, password) => {
    return apiRequest('/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Send OTP to user's email
  sendOTP: async (email) => {
    return apiRequest('/user/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify OTP and login
  verifyOTP: async (email, otp) => {
    return apiRequest('/user/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },
};

/**
 * Admin APIs
 */
export const adminAPI = {
  // Login admin
  login: async (email, password) => {
    return apiRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, null); // Don't send token for login
  },
};

export default {
  authAPI,
  adminAPI,
};

