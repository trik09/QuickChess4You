import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // Connect to Socket.IO server
  connect(url = null) {
    if (this.socket && this.socket.connected) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Authentication token missing for socket');
      // We might allow anon connection depending on logic, but for now just warn
    }

    const socketUrl = url || import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'; // Fallback to 3000 as backend is there

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });

    // forward any raw event for debugging
    // this.socket.onAny((event, ...args) => console.log(event, args));

    return this.socket;
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  // Legacy method support if needed, or simplified join
  joinCompetition(competitionId) {
    this.socket.emit('joinCompetition', { competitionId });
  }

  // Setup competition-specific event listeners
  setupCompetitionListeners() {
    if (!this.socket) return;

    // Leaderboard updates
    this.socket.on('leaderboardUpdate', (leaderboard) => {
      console.log('Leaderboard updated:', leaderboard);
      this.emit('leaderboardUpdate', leaderboard);
    });

    // Competition ended
    this.socket.on('competitionEnded', (finalResults) => {
      console.log('Competition ended:', finalResults);
      this.emit('competitionEnded', finalResults);
    });

    // Participant joined
    this.socket.on('participantJoined', (data) => {
      console.log('New participant joined:', data);
      this.emit('participantJoined', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });
  }

  // Simple wrapper methods are defined above (on, off, emit)
  // Removing complex internal listener map as it duplicates socket.io functionality

  refreshLeaderboard(competitionId) {
    this.socket.emit('refreshLeaderboard', { competitionId });
  }

  // Disconnect from socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket disconnected');
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      competitionId: this.competitionId,
      socketId: this.socket?.id || null
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;