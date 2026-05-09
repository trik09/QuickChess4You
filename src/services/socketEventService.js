import { io } from "socket.io-client";
import { getUserToken } from "./authStorage";

class SocketEventService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventId = null;
    this.listeners = new Map();
  }

  // Connect to Socket.IO server
  connect(eventData) {
    return new Promise((resolve, reject) => {
      try {
        const token = getUserToken();

        if (!token) {
          return reject(new Error("Authentication token required"));
        }

        // If already connected, just return success
        if (this.socket && this.isConnected) {
          this.joinEvent(eventData);
          return resolve(this.socket);
        }

        const socketUrl =
          import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

        this.socket = io(socketUrl, {
          auth: {
            token: token,
          },
          transports: ["websocket", "polling"],
        });

        this.eventId = eventData.event?.id || eventData.event?._id;

        // Connection event handlers
        this.socket.on("connect", () => {
          console.log("Connected to Socket.IO for events:", this.socket.id);
          this.isConnected = true;

          // Join event room
          this.joinEvent(eventData);
          resolve(this.socket);
        });

        this.socket.on("disconnect", (reason) => {
          console.log("Disconnected from Socket.IO for events:", reason);
          this.isConnected = false;
        });

        this.socket.on("connect_error", (error) => {
          console.error("Socket event connection error:", error);
          this.isConnected = false;
          reject(error);
        });

        // Event-specific event handlers
        this.setupEventListeners();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Join event room
  joinEvent(eventData) {
    if (!this.socket || !this.isConnected) {
      console.error("Socket not connected");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const eventId = eventData.event?.id || eventData.event?._id;

    this.socket.emit("joinEvent", {
      eventId,
      username: user.username || user.name || "Anonymous",
    });

    console.log(`Joining event: ${eventId}`);
  }

  // Setup event-specific event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Leaderboard updates
    this.socket.on("eventLeaderboardUpdate", (leaderboard) => {
      console.log("Event leaderboard updated:", leaderboard?.length, "entries");
      this.emit("leaderboardUpdate", leaderboard);
    });

    // Live score update (individual player)
    this.socket.on("eventLiveScoreUpdate", (data) => {
      console.log("Event live score update:", data?.username, data?.score);
      this.emit("liveScoreUpdate", data);
    });

    // Event ended
    this.socket.on("eventEnded", (finalResults) => {
      console.log("Event ended:", finalResults);
      this.emit("eventEnded", finalResults);
    });

    // Participant joined
    this.socket.on("eventParticipantJoined", (data) => {
      console.log("New event participant joined:", data);
      this.emit("participantJoined", data);
    });

    // Event Started (Initial Data & Time Sync)
    this.socket.on("eventJoined", (data) => {
      console.log("Joined event sync data:", data);
      this.emit("eventJoined", data);
    });

    // Error handling
    this.socket.on("error", (error) => {
      console.error("Socket event error:", error);
      this.emit("error", error);
    });
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event to listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in event listener:", error);
        }
      });
    }
  }

  // Refresh leaderboard manually
  refreshLeaderboard() {
    if (this.socket && this.isConnected && this.eventId) {
      this.socket.emit("refreshEventLeaderboard", {
        eventId: this.eventId,
      });
    }
  }

  // Disconnect from socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventId = null;
      this.listeners.clear();
      console.log("Event socket disconnected");
    }
  }
}

const socketEventService = new SocketEventService();

export default socketEventService;
