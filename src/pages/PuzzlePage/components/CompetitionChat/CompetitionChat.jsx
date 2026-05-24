import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaUserCircle } from 'react-icons/fa';
import socketService from '../../../../services/socketService';
import { chatAPI } from '../../../../services/api';
import styles from './CompetitionChat.module.css';

const CompetitionChat = ({ competitionId, user }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(socketService.isConnected);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await chatAPI.getChatHistory(competitionId);
        if (response.success) {
          setMessages(response.data);
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (competitionId) {
      fetchHistory();
    }

    const handleNewMessage = (message) => {
      console.log("[Chat] New message received:", message);
      if (String(message.competitionId) === String(competitionId)) {
        setMessages((prev) => {
          if (prev.some(m => m._id === message._id && message._id)) return prev;
          return [...prev, message];
        });
      }
    };

    const handleConnectionChange = () => {
      setIsConnected(socketService.isConnected);
    };

    socketService.on("newChatMessage", handleNewMessage);
    // Listen for connection events from the service
    socketService.on("connect", handleConnectionChange);
    socketService.on("disconnect", handleConnectionChange);

    return () => {
      console.log("[Chat] Cleaning up listeners");
      socketService.off("newChatMessage", handleNewMessage);
      socketService.off("connect", handleConnectionChange);
      socketService.off("disconnect", handleConnectionChange);
    };
  }, [competitionId]);

  useEffect(() => {
    // Also poll connection status briefly
    const interval = setInterval(() => {
      if (socketService.isConnected !== isConnected) {
        setIsConnected(socketService.isConnected);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (!socketService.isConnected) {
      console.error("[Chat] Cannot send: Socket not connected");
      return;
    }

    const messageData = {
      competitionId,
      message: inputValue.trim(),
      username: user?.username || user?.name || "Guest",
      userId: user?._id || user?.id
    };

    console.log("[Chat] Attempting to send message:", messageData);
    socketService.sendMessage(messageData);
    setInputValue('');
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <span className={styles.chatTitle}>Live Chat</span>
        <div className={styles.liveIndicator}>
          <span className={`${styles.pulse} ${!isConnected ? styles.disconnectedPulse : ''}`}></span>
          {isConnected ? 'LIVE' : 'RECONNECTING...'}
        </div>
      </div>

      <div className={styles.messagesList}>
        {loading ? (
          <div className={styles.loadingChat}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyChat}>No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = String(msg.userId) === String(user?._id || user?.id) || 
                         (msg.username === (user?.username || user?.name));
            return (
              <div 
                key={msg._id || idx} 
                className={`${styles.messageItem} ${isMe ? styles.myMessage : ''}`}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.username}>
                    {isMe ? 'You' : msg.username}
                  </span>
                  <span className={styles.timestamp}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={styles.messageText}>{msg.message}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.quickButtons}>
        {['All the best!', 'Thank you!', 'GG', 'Good luck all', 'Nice move!'].map((text) => (
          <button 
            key={text} 
            type="button" 
            className={styles.quickBtn}
            onClick={() => {
              const messageData = {
                competitionId,
                message: text,
                username: user?.username || user?.name || "Guest",
                userId: user?._id || user?.id
              };
              console.log("[Chat] Sending quick message:", messageData);
              socketService.sendMessage(messageData);
            }}
          >
            {text}
          </button>
        ))}
      </div>

      <form className={styles.inputArea} onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder={isConnected ? "Type a message..." : "Connecting to chat..."}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          maxLength={500}
          disabled={!isConnected}
        />
        <button type="submit" disabled={!inputValue.trim() || !isConnected}>
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default CompetitionChat;
