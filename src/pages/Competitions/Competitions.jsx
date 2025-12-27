import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaTrophy,
    FaCalendarAlt,
    FaClock,
    FaUsers,
    FaGamepad,
    FaSignInAlt,
    FaCheckCircle
} from "react-icons/fa";
import styles from "./Competitions.module.css";
import { competitionAPI } from "../../services/api";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import { useAuth } from "../../contexts/AuthContext";
import toast, { Toaster } from 'react-hot-toast';

function Competitions() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [liveCompetitions, setLiveCompetitions] = useState([]);
    const [upcomingCompetitions, setUpcomingCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState(null);

    useEffect(() => {
        fetchCompetitions();
    }, []);

    const fetchCompetitions = async () => {
        try {
            setLoading(true);
            // Fetch live
            const liveRes = await competitionAPI.getCompetitions({ status: 'live', limit: 50 });
            // Fetch upcoming
            const upcomingRes = await competitionAPI.getCompetitions({ status: 'upcoming', limit: 50 });

            if (liveRes.success) setLiveCompetitions(liveRes.data);
            if (upcomingRes.success) setUpcomingCompetitions(upcomingRes.data);
        } catch (error) {
            console.error("Failed to load competitions:", error);
            toast.error("Failed to load competitions");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (competition) => {
        if (!isAuthenticated) {
            // Redirect to login with return url
            navigate(`/login?returnTo=/competitions`);
            return;
        }

        try {
            setJoiningId(competition._id);
            await competitionAPI.joinCompetition(competition._id);
            toast.success("Joined successfully!");

            // Refresh list to update UI state
            fetchCompetitions();
        } catch (error) {
            console.error("Failed to join:", error);
            toast.error(error.response?.data?.message || "Failed to join competition");
        } finally {
            setJoiningId(null);
        }
    };

    const handlePlay = (competitionId) => {
        // Navigate to live competition page instead of regular puzzle page
        navigate(`/live-competition/${competitionId}`);
    };

    const isJoined = (competition) => {
        if (!user || !competition.participants) return false;
        return competition.participants.some(p => p.user?._id === user.id || p.user === user.id);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const CompetitionCard = ({ competition, isLive }) => {
        const joined = isJoined(competition);
        const isFull = competition.maxParticipants && competition.participants.length >= competition.maxParticipants;

        return (
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3>{competition.name}</h3>
                    {isLive ? (
                        <span className={styles.liveBadge}>LIVE</span>
                    ) : (
                        <span className={styles.upcomingBadge}>UPCOMING</span>
                    )}
                </div>

                <div className={styles.cardBody}>
                    <div className={styles.infoRow}>
                        <FaCalendarAlt />
                        <span>{formatDate(competition.startTime)}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <FaClock />
                        <span>{competition.duration} mins</span>
                    </div>
                    <div className={styles.infoRow}>
                        <FaUsers />
                        <span>{competition.participants?.length || 0} / {competition.maxParticipants || '∞'} Players</span>
                    </div>
                    {competition.description && (
                        <p className={styles.description}>{competition.description}</p>
                    )}
                </div>

                <div className={styles.cardFooter}>
                    {joined ? (
                        isLive ? (
                            <button
                                className={styles.playBtn}
                                onClick={() => handlePlay(competition._id)}
                            >
                                <FaGamepad /> Join Live Competition
                            </button>
                        ) : (
                            <button className={styles.disabledBtn} disabled>
                                <FaCheckCircle /> Registered (Starts Soon)
                            </button>
                        )
                    ) : (
                        <button
                            className={isAuthenticated ? styles.joinBtn : styles.loginBtn}
                            onClick={() => handleJoin(competition)}
                            disabled={joiningId === competition._id || (isFull && isAuthenticated)}
                        >
                            {isAuthenticated ? (
                                joiningId === competition._id ? 'Joining...' : (isFull ? 'Full' : 'Join Competition')
                            ) : (
                                <><FaSignInAlt /> Login to Join</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading competitions...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Toaster position="top-right" />

            <div className={styles.header}>
                <h1><FaTrophy /> Chess Competitions</h1>
                <p>Join live tournaments and compete with others!</p>
            </div>

            {liveCompetitions.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>🔴 Live Now</h2>
                    <div className={styles.grid}>
                        {liveCompetitions.map(comp => (
                            <CompetitionCard key={comp._id} competition={comp} isLive={true} />
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>📅 Upcoming Events</h2>
                {upcomingCompetitions.length > 0 ? (
                    <div className={styles.grid}>
                        {upcomingCompetitions.map(comp => (
                            <CompetitionCard key={comp._id} competition={comp} isLive={false} />
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <FaCalendarAlt />
                        <p>No upcoming competitions scheduled.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Competitions;
