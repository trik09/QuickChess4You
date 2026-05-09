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
    FaTimes,
    FaUserCircle
} from "react-icons/fa";
import styles from "./Events.module.css";
import { eventAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import toast, { Toaster } from 'react-hot-toast';

function Events() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    
    const [liveEvents, setLiveEvents] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [ENDEDEvents, setENDEDEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Track registrations for the user
    const [registrations, setRegistrations] = useState([]);
    
    // Registration Modal State
    const [showRegModal, setShowRegModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [formData, setFormData] = useState({
        fullName: "",
        whatsappNumber: "",
        age: "",
        gender: "Male",
        fideRating: ""
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEvents();
        if (isAuthenticated) fetchRegistrations();

        const interval = setInterval(() => {
            fetchEvents(true);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const fetchRegistrations = async () => {
        try {
            const res = await eventAPI.getUserRegistrations();
            if (res.success) {
                setRegistrations(res.data);
            }
        } catch (error) {
            console.error("Failed to load registrations", error);
        }
    };

    const fetchEvents = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const liveRes = await eventAPI.getEvents({ status: 'live', limit: 500 });
            const upcomingRes = await eventAPI.getEvents({ status: 'upcoming', limit: 500 });
            const ENDEDRes = await eventAPI.getEvents({ status: 'ENDED', limit: 500 });

            if (liveRes.success) setLiveEvents(liveRes.data);
            if (upcomingRes.success) setUpcomingEvents(upcomingRes.data);
            if (ENDEDRes.success) setENDEDEvents(ENDEDRes.data);
        } catch (error) {
            console.error("Failed to load events:", error);
            if (!isBackground) toast.error("Failed to load events");
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const handleOpenRegModal = (event) => {
        if (!isAuthenticated) {
            navigate(`/login?returnTo=/events`);
            return;
        }
        setSelectedEvent(event);
        // Auto-fill user name if available
        setFormData({
            fullName: user?.name || "",
            whatsappNumber: "",
            age: "",
            gender: "Male",
            fideRating: ""
        });
        setShowRegModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegSubmit = async (e) => {
        e.preventDefault();
        if (!formData.fullName || !formData.whatsappNumber || !formData.age || !formData.gender) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            setSubmitting(true);
            const res = await eventAPI.registerForEvent(selectedEvent._id, formData);
            toast.success(res.message || "Registration submitted!");
            setShowRegModal(false);
            fetchRegistrations();
        } catch (error) {
            console.error("Failed to register:", error);
            toast.error(error.response?.data?.message || "Failed to register for event");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePlay = (eventId) => {
        navigate(`/event/${eventId}/lobby`);
    };

    const getRegistrationStatus = (eventId) => {
        if (!user) return null;
        return registrations.find(r => r.eventId === eventId || r.eventId?._id === eventId);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const EventCard = ({ event, status }) => {
        const regStatus = getRegistrationStatus(event._id);
        const count = event.participantCount ?? 0;
        const isFull = event.maxParticipants && count >= event.maxParticipants;

        let statusBadge;
        if (status === 'live') {
            statusBadge = <span className={styles.liveBadge}>LIVE</span>;
        } else if (status === 'upcoming') {
            statusBadge = <span className={styles.upcomingBadge}>UPCOMING</span>;
        } else {
            statusBadge = <span className={styles.ENDEDBadge}>ENDED</span>;
        }

        return (
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3>{event.name}</h3>
                    {statusBadge}
                </div>

                <div className={styles.cardBody}>
                    <div className={styles.infoRow}>
                        <FaCalendarAlt />
                        <span>{formatDate(event.startTime)}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <FaClock />
                        <span>{event.duration} mins</span>
                    </div>
                    <div className={styles.infoRow}>
                        <FaUsers />
                        <span>{count} / {event.maxParticipants || '∞'} Approved Players</span>
                    </div>
                    {event.description && (
                        <p className={styles.description}>{event.description}</p>
                    )}
                </div>

                <div className={styles.cardFooter}>
                    {status === 'ENDED' ? (
                        <button
                            className={styles.joinBtn}
                            onClick={() => navigate(`/event-leaderboard/${event._id}`)}
                            style={{ background: '#17a2b8' }}
                        >
                            <FaTrophy /> View Results
                        </button>
                    ) : (
                        <button
                            className={styles.playBtn}
                            onClick={() => handlePlay(event._id)}
                        >
                            {status === 'live' ? <><FaGamepad /> Enter Lobby</> : <><FaClock /> Enter Lobby</>}
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
                <p>Loading events...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Toaster position="top-right" />

            {/* Registration Form Modal */}
            {showRegModal && selectedEvent && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Register for Event</h2>
                            <button className={styles.closeBtn} onClick={() => setShowRegModal(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <p style={{ color: '#a0a0a0', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Event: <strong>{selectedEvent.name}</strong><br/>
                            Username: <strong>{user?.username}</strong>
                        </p>
                        <form onSubmit={handleRegSubmit}>
                            <div className={styles.formGroup}>
                                <label>Full Name *</label>
                                <input 
                                    type="text" 
                                    name="fullName" 
                                    value={formData.fullName} 
                                    onChange={handleInputChange}
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>WhatsApp Number *</label>
                                <input 
                                    type="text" 
                                    name="whatsappNumber" 
                                    value={formData.whatsappNumber} 
                                    onChange={handleInputChange}
                                    placeholder="Enter WhatsApp number"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Age *</label>
                                <input 
                                    type="number" 
                                    name="age" 
                                    value={formData.age} 
                                    onChange={handleInputChange}
                                    placeholder="Enter age"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Gender *</label>
                                <select name="gender" value={formData.gender} onChange={handleInputChange}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>FIDE Rating (Optional)</label>
                                <input 
                                    type="text" 
                                    name="fideRating" 
                                    value={formData.fideRating} 
                                    onChange={handleInputChange}
                                    placeholder="Enter FIDE rating if any"
                                />
                            </div>
                            <button type="submit" className={styles.submitBtn} disabled={submitting}>
                                {submitting ? "Submitting..." : "Submit Registration"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className={styles.header}>
                <h1><FaTrophy style={{ color: '#f59e0b' }} /> Chess Events</h1>
                <p>Register for upcoming events or watch live games!</p>
            </div>

            {liveEvents.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaCircle style={{ color: '#ef4444', fontSize: '12px' }} /> Live Now
                    </h2>
                    <div className={styles.grid}>
                        {liveEvents.map(evt => (
                            <EventCard key={evt._id} event={evt} status="live" />
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.section}>
                <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaCalendarAlt /> Upcoming Events
                </h2>
                {upcomingEvents.length > 0 ? (
                    <div className={styles.grid}>
                        {upcomingEvents.map(evt => (
                            <EventCard key={evt._id} event={evt} status="upcoming" />
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <FaCalendarAlt />
                        <p>No upcoming events scheduled.</p>
                    </div>
                )}
            </div>

            {ENDEDEvents.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaTrophy /> Past Events
                    </h2>
                    <div className={styles.grid}>
                        {ENDEDEvents.map(evt => (
                            <EventCard key={evt._id} event={evt} status="ENDED" />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Events;
