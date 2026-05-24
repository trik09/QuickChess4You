import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaComments, FaTimes, FaGripLines } from 'react-icons/fa';
import CompetitionChat from '../../pages/PuzzlePage/components/CompetitionChat/CompetitionChat';
import socketService from '../../services/socketService';
import styles from './FloatingChatWidget.module.css';

const FloatingChatWidget = ({ competitionId, user }) => {
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    if (competitionId && user && !socketService.isConnected) {
      console.log("[FloatingChat] Initializing failsafe connection");
      socketService.connect({
        competition: { id: competitionId }
      }).catch(err => console.error("[FloatingChat] Failsafe connect failed:", err));
    }
  }, [competitionId, user]);

  return (
    <div className={styles.floatingWrapper}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.chatWindow}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            drag
            dragMomentum={false}
          >
            <div className={styles.dragHandle}>
              <FaGripLines />
              <span>COMMUNITY CHAT</span>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <div className={styles.chatContent}>
              <CompetitionChat competitionId={competitionId} user={user} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className={`${styles.toggleButton} ${isOpen ? styles.hidden : ''}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} // Snap back or keep movable? User said icon also movable.
        // For icon movable, let's allow free drag but maybe restricted to viewport
      >
        <FaComments />
        <span className={styles.badge}>LIVE</span>
      </motion.button>
    </div>
  );
};

export default FloatingChatWidget;
