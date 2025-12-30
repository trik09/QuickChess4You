import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { competitionAPI } from '../../services/api';
import socketService from '../../services/socketService';
import styles from './TournamentLobby.module.css';
import { toast } from 'react-hot-toast';

const TournamentLobby = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [competition, setCompetition] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    // Get current user
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch (e) { }
        }
    }, []);

    // Load Initial Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await competitionAPI.getById(id);
                if (response.success) {
                    setCompetition(response.data);
                    // Initial participants load (if API provides it, otherwise socket will update)
                    // Ideally API should return participants with details
                    // For now assuming response.data.participants contains minimal info or we fetch separate
                    // But based on controller, getById populates participants.user
                    if (response.data.participants) {
                        setParticipants(response.data.participants);
                    }
                }
            } catch (error) {
                console.error("Failed to load competition:", error);
                toast.error("Failed to load lobby");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // Socket Connection & Real-time Updates
    useEffect(() => {
        if (!id) return;

        // Connect and Join Room
        socketService.connect();
        socketService.emit('joinCompetitionRoom', { competitionId: id });

        // Listeners
        socketService.on('competitionStatsUpdate', (data) => {
            if (data && data.leaderboard) {
                setParticipants(data.leaderboard);
            }
        });

        socketService.on('participantUpdate', (data) => {
            // Update specific participant in the list
            setParticipants(prev => prev.map(p => {
                // Check match by ID
                const pId = p.user._id || p.user;
                if (pId === data.userId) {
                    return { ...p, ...data };
                }
                return p;
            }));
        });

        socketService.on('competitionStarted', () => {
            toast.success("Competition Started! Redirecting...");
            navigate(`/competition/${id}/play`);
        });

        if (!currentUser) return;

        // Check if current user has already submitted/completed
        const participant = participants.find(p =>
            (p.user?._id === currentUser.id || p.user === currentUser.id)
        );
        const hasFinished = participant && (participant.status === 'submitted' || participant.status === 'completed');

        // Safety check: if status is already live, redirect ONLY if not finished
        if (competition && competition.status === 'live' && competition.isActive && !hasFinished) {
            navigate(`/competition/${id}/play`);
        }

        return () => {
            socketService.off('competitionStatsUpdate');
            socketService.off('competitionStarted');
            // Do not disconnect socket entirely if used elsewhere, but maybe leave room?
            // socketService.emit('leaveCompetitionRoom', ...); 
        };
    }, [id, navigate, competition, participants, currentUser]);


    // Timer & Auto-Status Check Logic
    useEffect(() => {
        if (!competition || !competition.startTime) return;

        const checkStatus = async () => {
            try {
                const res = await competitionAPI.getById(id);
                // Check user status here too if possible, but for now rely on local participants state if updated
                // Or simply don't auto-redirect here if we can't verify status. 
                // Better: rely on the socket/main effect above for redirect.
                // But if we must:
                if (res.success && res.data.status === 'live') {
                    // We need to know if user is finished. 
                    // We can use the 'participants' state but it might be stale? 
                    // Let's assume participants state is reasonably up to date via socket.
                    const participant = participants.find(p =>
                        (p.user?._id === currentUser?.id || p.user === currentUser?.id)
                    );

                    if (!participant || (participant.status !== 'submitted' && participant.status !== 'completed')) {
                        toast.success("Tournament Started!");
                        navigate(`/competition/${id}/play`);
                    }
                }
            } catch (e) {
                console.error("Status check failed", e);
            }
        };

        const timer = setInterval(() => {
            const now = new Date();
            const start = new Date(competition.startTime);
            const diff = start - now;

            if (diff <= 0) {
                setTimeRemaining("00:00:00");
                // If we hit 0, check status immediately and every few seconds
                // This acts as a fallback to socket
                checkStatus();
            } else {
                const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((diff / (1000 * 60)) % 60);
                const seconds = Math.floor((diff / 1000) % 60);
                setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [competition, id, navigate]);


    if (loading) return <div className={styles.loading}>Loading Lobby...</div>;
    if (!competition) return <div className={styles.loading}>Competition not found</div>;

    return (
        <div className={styles.container}>
            <div className={styles.content}>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <h1>{competition.name || competition.title}</h1>
                        <span className={`${styles.statusBadge} ${styles[competition.status]}`}>
                            {competition.status}
                        </span>
                    </div>

                    <div className={styles.timerSection}>
                        {competition.status === 'upcoming' && (
                            <>
                                <span className={styles.timerLabel}>Starts In</span>
                                <div className={styles.timerValue}>{timeRemaining || "--:--:--"}</div>
                            </>
                        )}
                        {competition.status === 'completed' && (
                            <div className={styles.timerValue}>ENDED</div>
                        )}
                    </div>
                </div>

                {/* Participants Table */}
                <div className={styles.participantsSection}>
                    <div className={styles.tableHeader}>
                        <h3>Participants ({participants.length})</h3>
                    </div>

                    <table className={styles.participantsTable}>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>Status</th>
                                <th>Score</th>
                                <th>Time Used</th>
                            </tr>
                        </thead>
                        <tbody>
                            {participants.map((p, index) => {
                                const isCurrentUser = p.user?._id === currentUser?._id || p.user === currentUser?._id; // Need current user context
                                const isFinished = p.status === 'submitted' || p.status === 'completed';
                                const showScore = isCurrentUser || isFinished;

                                return (
                                    <tr key={p.user._id || p.user || index}>
                                        <td className={styles.rankColumn}>#{index + 1}</td>
                                        <td className={styles.userColumn}>
                                            {p.user?.name || p.username || "Unknown"}
                                            {isCurrentUser && " (You)"}
                                        </td>
                                        <td className={`${styles.statusCell} ${styles[p.status || 'waiting']}`}>
                                            {p.status || 'Waiting'}
                                        </td>
                                        <td className={styles.scoreColumn}>
                                            {showScore ? p.score : <span style={{ opacity: 0.5 }}>--</span>}
                                        </td>
                                        <td>
                                            {showScore ? (p.timeUsed || 0) + 's' : <span style={{ opacity: 0.5 }}>--</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                            {participants.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                        No participants yet. Be the first to join!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default TournamentLobby;
