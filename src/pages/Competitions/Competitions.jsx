import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaTrophy,
    FaCalendarAlt,
    FaClock,
    FaUsers,
    FaGamepad,
    FaSignInAlt,
    FaCheckCircle,
    FaCircle,
    FaThLarge,
    FaThList
} from "react-icons/fa";
import styles from "./Competitions.module.css";
import { competitionAPI } from "../../services/api";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import CompetitionLeaderboard from "../../components/CompetitionLeaderboard/CompetitionLeaderboard"; // Import Leaderboard
import { useAuth } from "../../contexts/AuthContext";
import toast, { Toaster } from 'react-hot-toast';
import { FaTimes } from 'react-icons/fa'; // Added FaTimes for modal close

function Competitions() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [liveCompetitions, setLiveCompetitions] = useState([]);
    const [upcomingCompetitions, setUpcomingCompetitions] = useState([]);
    const [ENDEDCompetitions, setENDEDCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState(null);
    // Track which competition IDs the current user has joined (from live ParticipantModel)
    const [joinedCompetitionIds, setJoinedCompetitionIds] = useState(new Set());
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Result Modal State
    const [showResultModal, setShowResultModal] = useState(false);
    const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);

    useEffect(() => {
        fetchCompetitions();
        if (isAuthenticated) fetchJoinedCompetitions();

        const interval = setInterval(() => {
            fetchCompetitions(true);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const fetchJoinedCompetitions = async () => {
        try {
            const res = await liveCompetitionAPI.getActiveParticipation();
            if (res.success && res.competition?.id) {
                setJoinedCompetitionIds(prev => new Set([...prev, res.competition.id]));
            }
        } catch {
            // silent — not critical
        }
    };

    const fetchCompetitions = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            // Fetch live
            const liveRes = await competitionAPI.getCompetitions({ status: 'live', limit: 500 });
            // Fetch upcoming
            const upcomingRes = await competitionAPI.getCompetitions({ status: 'upcoming', limit: 500 });
            // Fetch ENDED
            const ENDEDRes = await competitionAPI.getCompetitions({ status: 'ENDED', limit: 500 });

            if (liveRes.success) setLiveCompetitions(liveRes.data);
            if (upcomingRes.success) setUpcomingCompetitions(upcomingRes.data);
            if (ENDEDRes.success) setENDEDCompetitions(ENDEDRes.data);
        } catch (error) {
            console.error("Failed to load competitions:", error);
            if (!isBackground) toast.error("Failed to load competitions");
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const handleViewResults = (competitionId) => {
        setSelectedCompetitionId(competitionId);
        setShowResultModal(true);
    };

    const handleJoin = async (competition) => {
        if (!isAuthenticated) {
            navigate(`/?reason=auth_required&returnTo=/competitions`);
            return;
        }

        try {
            setJoiningId(competition._id);
            await competitionAPI.joinCompetition(competition._id);
            toast.success("Joined successfully!");
            setJoinedCompetitionIds(prev => new Set([...prev, competition._id]));
            fetchCompetitions(true);
        } catch (error) {
            console.error("Failed to join:", error);
            toast.error(error.response?.data?.message || "Failed to join competition");
        } finally {
            setJoiningId(null);
        }
    };

    const handlePlay = (competitionId, e) => {
        // Prevent navigation if text is being selected
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            return;
        }
        navigate(`/live-competition/${competitionId}`);
    };

    const isJoined = (competition) => {
        if (!user) return false;
        // Check live ParticipantModel set first
        if (joinedCompetitionIds.has(competition._id)) return true;
        // Fallback: legacy participants array (may be present for upcoming competitions)
        if (competition.participants) {
            return competition.participants.some(p => p.user?._id === user.id || p.user === user.id);
        }
        return false;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const CompetitionCard = ({ competition, status }) => {
        const joined = isJoined(competition);
        const count = competition.participantCount ?? competition.participants?.length ?? 0;
        const isFull = competition.maxParticipants && count >= competition.maxParticipants;

        // Determine badge based on status
        let statusBadge;
        if (status === 'live') {
            statusBadge = <span className={styles.liveBadge}>LIVE</span>;
        } else if (status === 'upcoming') {
            statusBadge = <span className={styles.upcomingBadge}>UPCOMING</span>;
        } else {
            statusBadge = <span className={styles.ENDEDBadge} style={{ background: '#6c757d', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>ENDED</span>;
        }

        return (
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3>{competition.name}</h3>
                    {statusBadge}
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
                        <span>{competition.participantCount ?? competition.participants?.length ?? 0} / {competition.maxParticipants || '∞'} Players</span>
                    </div>
                    {competition.description && (
                        <p className={styles.description}>{competition.description}</p>
                    )}
                </div>

                <div className={styles.cardFooter}>
                    {status === 'ENDED' ? (
                        <button
                            className={styles.joinBtn}
                            onClick={() => handleViewResults(competition._id)}
                            style={{ background: '#17a2b8' }}
                        >
                            <FaTrophy /> View Results
                        </button>
                    ) : joined ? (
                        status === 'live' ? (
                            <button
                                className={styles.playBtn}
                                onClick={(e) => handlePlay(competition._id, e)}
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

    const CompetitionListView = ({ competitions, status }) => {
        return (
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Name</th>
                            <th>Start Time</th>
                            <th>Duration</th>
                            <th>Players</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {competitions.map(comp => {
                            const joined = isJoined(comp);
                            const count = comp.participantCount ?? comp.participants?.length ?? 0;
                            const isFull = comp.maxParticipants && count >= comp.maxParticipants;
                            
                            let statusBadge;
                            if (status === 'live') {
                                statusBadge = <span className={styles.liveBadge}>LIVE</span>;
                            } else if (status === 'upcoming') {
                                statusBadge = <span className={styles.upcomingBadge}>UPCOMING</span>;
                            } else {
                                statusBadge = <span className={styles.ENDEDBadge} style={{ background: '#6c757d', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>ENDED</span>;
                            }

                            return (
                                <tr key={comp._id} onClick={(e) => status === 'live' && joined ? handlePlay(comp._id, e) : null} style={{ cursor: status === 'live' && joined ? 'pointer' : 'default' }}>
                                    <td>{statusBadge}</td>
                                    <td>
                                        <div className={styles.tableNameCell}>
                                            <span className={styles.tableNameText}>{comp.name}</span>
                                            {comp.description && <span className={styles.tableDescText}>{comp.description}</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.tableIconBox}>
                                            <FaCalendarAlt />
                                            <span>{formatDate(comp.startTime)}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.tableIconBox}>
                                            <FaClock />
                                            <span>{comp.duration} mins</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.tableIconBox}>
                                            <FaUsers />
                                            <span>{count} / {comp.maxParticipants || '∞'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {status === 'ENDED' ? (
                                            <button
                                                className={styles.joinBtnSmall}
                                                onClick={(e) => { e.stopPropagation(); handleViewResults(comp._id); }}
                                                style={{ background: '#17a2b8' }}
                                            >
                                                Results
                                            </button>
                                        ) : joined ? (
                                            status === 'live' ? (
                                                <button
                                                    className={styles.playBtnSmall}
                                                    onClick={(e) => { e.stopPropagation(); handlePlay(comp._id, e); }}
                                                >
                                                    Play
                                                </button>
                                            ) : (
                                                <span className={styles.registeredText}><FaCheckCircle /> Registered</span>
                                            )
                                        ) : (
                                            <button
                                                className={isAuthenticated ? styles.joinBtnSmall : styles.loginBtnSmall}
                                                onClick={(e) => { e.stopPropagation(); handleJoin(comp); }}
                                                disabled={joiningId === comp._id || (isFull && isAuthenticated)}
                                            >
                                                {isAuthenticated ? (
                                                    joiningId === comp._id ? '...' : (isFull ? 'Full' : 'Join')
                                                ) : (
                                                    'Login'
                                                )}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
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

            {/* Leaderboard/Result Modal */}
            {showResultModal && selectedCompetitionId && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        zIndex: 1000,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '20px'
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#262421',
                            borderRadius: '8px',
                            width: '100%',
                            maxWidth: '600px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            position: 'relative',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                        }}
                    >
                        <div style={{ padding: '15px 20px', borderBottom: '1px solid #404040', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#e5e5e5', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaTrophy style={{ color: '#ffc107' }} /> Competition Results
                            </h3>
                            <button
                                onClick={() => setShowResultModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#999',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem'
                                }}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <CompetitionLeaderboard
                                competitionId={selectedCompetitionId}
                                isLive={false}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.viewModeToggle}>
                <button 
                    className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.toggleBtnActive : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                >
                    <FaThLarge />
                </button>
                <button 
                    className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleBtnActive : ''}`}
                    onClick={() => setViewMode('list')}
                    title="List View"
                >
                    <FaThList />
                </button>
            </div>

            <div className={styles.header}>
                <h1><FaTrophy /> Chess Competitions</h1>
                <p>Join live tournaments and compete with others!</p>
            </div>

            {liveCompetitions.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCircle style={{ color: '#ef4444', fontSize: '12px' }} /> Live Now</h2>
                    {viewMode === 'list' ? (
                        <CompetitionListView competitions={liveCompetitions} status="live" />
                    ) : (
                        <div className={styles.grid}>
                            {liveCompetitions.map(comp => (
                                <CompetitionCard key={comp._id} competition={comp} status="live" />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className={styles.section}>
                <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCalendarAlt /> Upcoming Events</h2>
                {upcomingCompetitions.length > 0 ? (
                    viewMode === 'list' ? (
                        <CompetitionListView competitions={upcomingCompetitions} status="upcoming" />
                    ) : (
                        <div className={styles.grid}>
                            {upcomingCompetitions.map(comp => (
                                <CompetitionCard key={comp._id} competition={comp} status="upcoming" />
                            ))}
                        </div>
                    )
                ) : (
                    <div className={styles.emptyState}>
                        <FaCalendarAlt />
                        <p>No upcoming competitions scheduled.</p>
                    </div>
                )}
            </div>

            {ENDEDCompetitions.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTrophy /> Past Competitions</h2>
                    {viewMode === 'list' ? (
                        <CompetitionListView competitions={ENDEDCompetitions} status="ENDED" />
                    ) : (
                        <div className={styles.grid}>
                            {ENDEDCompetitions.map(comp => (
                                <CompetitionCard key={comp._id} competition={comp} status="ENDED" />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Competitions;
