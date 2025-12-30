import React from 'react';
import styles from './TournamentCard.module.css';
import { FaClock, FaUserFriends, FaPuzzlePiece, FaCalendarAlt } from 'react-icons/fa';

const TournamentCard = ({ competition, onJoin, onView }) => {
    const {
        _id,
        name,
        title, // Fallback
        startTime,
        duration,
        puzzles,
        participants,
        status,
        maxParticipants
    } = competition;

    const displayTitle = name || title || "Untitled Tournament";
    const puzzleCount = puzzles?.length || 0;
    const participantCount = Array.isArray(participants) ? participants.length : (participants || 0);

    // Format date
    const startDate = new Date(startTime);
    const dateStr = startDate.toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const getStatusLabel = () => {
        switch (status) {
            case 'upcoming': return 'Upcoming';
            case 'live': return 'Live';
            case 'completed': return 'Completed';
            default: return status;
        }
    };

    const handleAction = () => {
        if (status === 'upcoming') {
            onJoin(competition);
        } else {
            onView(competition);
        }
    };

    return (
        <div className={`${styles.card} ${styles[status]}`}>
            <div className={styles.infoSection}>
                <h3 className={styles.title}>{displayTitle}</h3>

                <div className={styles.details}>
                    <div className={styles.detailItem}>
                        <FaCalendarAlt className={styles.icon} />
                        <span>{dateStr}</span>
                    </div>

                    <div className={styles.detailItem}>
                        <FaClock className={styles.icon} />
                        <span>{duration}m</span>
                    </div>

                    <div className={styles.detailItem}>
                        <FaPuzzlePiece className={styles.icon} />
                        <span>{puzzleCount} Puzzles</span>
                    </div>

                    <div className={styles.detailItem}>
                        <FaUserFriends className={styles.icon} />
                        <span>{participantCount} {maxParticipants ? `/ ${maxParticipants}` : ''}</span>
                    </div>
                </div>
            </div>

            <div className={styles.statusSection}>
                <span className={`${styles.statusBadge} ${styles[status]}`}>
                    {getStatusLabel()}
                </span>

                <button
                    onClick={handleAction}
                    className={`${styles.actionBtn} ${status === 'upcoming' ? styles.joinBtn : styles.viewBtn}`}
                >
                    {status === 'upcoming' ? 'Join' : 'View'}
                </button>
            </div>
        </div>
    );
};

export default TournamentCard;
