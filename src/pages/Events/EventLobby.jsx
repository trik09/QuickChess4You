import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { eventAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useLiveEvent } from "../../contexts/LiveEventContext"; 
import {
  FaClock,
  FaTrophy,
  FaUserCircle,
  FaCheckCircle,
  FaHourglassStart,
  FaPlayCircle,
  FaBolt,
  FaChartLine,
  FaHistory,
  FaArrowUp,
  FaMedal,
  FaCrown,
  FaFire,
  FaChessKnight,
  FaUsers,
  FaBan
} from "react-icons/fa";
import { MdWarning } from "react-icons/md";
import toast, { Toaster } from "react-hot-toast";
import styles from "./EventLobby.module.css";
import PremiumLoader from "../../components/PremiumLoader/PremiumLoader";

const EventLobby = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    leaderboard: liveLeaderboard,
    eventEnded,
    isConnected,
    participateInEvent,
    spectator
  } = useLiveEvent();

  const [eventData, setEventData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  
  const [regStatus, setRegStatus] = useState(null); // Holds the user's participant state
  const [showRegModal, setShowRegModal] = useState(false);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regForm, setRegForm] = useState({
    fullName: "",
    whatsappNumber: "",
    age: "",
    gender: "Male",
    fideRating: ""
  });

  const timeOffsetRef = useRef(0);

  useEffect(() => {
    loadLobby();
    const interval = setInterval(loadLobbyState, 10000);

    return () => clearInterval(interval);
  }, [id]);

  const loadLobby = async () => {
    try {
      setLoading(true);
      const res = await eventAPI.getById(id);
      if (res.success) {
        setEventData(res.data);
        await loadLobbyState();
      } else {
        setError("Failed to load event details.");
      }
    } catch (err) {
      console.error(err);
      setError("Error loading event.");
    } finally {
      setLoading(false);
    }
  };

  const loadLobbyState = async () => {
    try {
      // Get all approved participants
      const partRes = await eventAPI.getParticipants(id).catch(() => ({ success: true, data: [] }));
      if (partRes.success) {
        setParticipants(partRes.data);
      }

      // Get registration status of the user
      if (user) {
        const regRes = await eventAPI.getUserRegistrations();
        if (regRes.success) {
          const myReg = regRes.data.find(r => r.eventId === id || r.eventId?._id === id);
          setRegStatus(myReg || null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch lobby state", err);
    }
  };

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.fullName || !regForm.whatsappNumber || !regForm.age) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmittingReg(true);
    try {
      const res = await eventAPI.registerForEvent(id, regForm);
      if (res.success || res.participant) {
        toast.success("Registration submitted! Waiting for approval.");
        setShowRegModal(false);
        loadLobbyState();
      }
    } catch (err) {
      toast.error(err.message || "Failed to register");
    } finally {
      setIsSubmittingReg(false);
    }
  };

  useEffect(() => {
    if (eventData) {
      const timer = setInterval(() => {
        calculateTimeLeft();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [eventData]);

  const calculateTimeLeft = () => {
    if (!eventData) return;

    const start = new Date(eventData.startTime).getTime();
    const end = new Date(eventData.endTime).getTime();
    const now = Date.now() + timeOffsetRef.current;

    let target = start;
    let status = "UPCOMING";

    if (now >= end) {
      status = "ENDED";
      setTimeLeft("Event Ended!");
      return;
    } else if (now >= start) {
      status = "LIVE";
      target = end;
    }

    const diff = target - now;

    if (diff <= 0) {
      setTimeLeft(status === "UPCOMING" ? "Starting..." : "Ended!");
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    setTimeLeft(
      `${days > 0 ? days + "d " : ""}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    );
  };

  const handleJoin = () => {
    navigate(`/live-event/${id}`);
  };

  if (loading) {
    return <PremiumLoader text="Entering Lobby..." />;
  }

  if (error) {
    return (
      <div className={styles.premiumLoaderOverlay}>
        <div className={styles.errorBox}>
          <div className={styles.errorIcon}><MdWarning /></div>
          <h3>Lobby Access Failed</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.eventLobby}>
      <Toaster position="top-right" />
      
      <div className={`${styles.lobbyCard} ${styles.headerCard}`}>
        <div className={styles.headerLeft}>
          <h1 className={styles.compTitle}>
            {eventData?.name}
            <span className={styles.compDate}>
              {eventData?.startTime &&
                ` – ${new Date(eventData.startTime).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}`}
            </span>
          </h1>
          <div className={styles.statusBadgeContainer}>
            <span className={`${styles.statusPill} ${styles.live}`}>
              {new Date() > new Date(eventData.endTime) ? "ENDED" : new Date() >= new Date(eventData.startTime) ? "LIVE" : "UPCOMING"}
            </span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.timerSection}>
            <div className={styles.timerBox}>
              <span className={styles.timerLabel}><FaClock /> TIME LEFT</span>
              <span className={styles.timerVal}>{timeLeft}</span>
            </div>

            <div className={styles.actionButtons}>
              {regStatus ? (
                regStatus.isApproved ? (
                  <button className={`${styles.actionBtn} ${styles.enterBtnLive}`} onClick={handleJoin}>
                    Enter Event
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className={styles.pendingNotice}>
                      <FaHourglassStart /> Waiting for Admin Approval
                    </div>
                    <button className={`${styles.actionBtn} ${styles.spectateBtn}`} onClick={handleJoin}>
                      Spectate
                    </button>
                  </div>
                )
              ) : (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className={`${styles.actionBtn} ${styles.registerBtn}`} onClick={() => setShowRegModal(true)}>
                    Join Event
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.lobbyMainContent}>
        {/* Participated Users */}
        <div className={`${styles.lobbyCard} ${styles.participantsCard}`}>
          <h2 className={styles.sectionTitle}>
            <FaUsers className={styles.titleIcon} /> Participants ({participants.length})
          </h2>
          <div className={styles.participantsGrid}>
            {participants.length > 0 ? (
              participants.map((p, idx) => (
                <div key={p._id} className={styles.participantRow}>
                  <div className={styles.partIndex}>#{idx + 1}</div>
                  <div className={styles.partAvatar}><FaUserCircle /></div>
                  <div className={styles.partDetails}>
                    <span className={styles.partUsername}>{p.userId?.username || p.fullName}</span>
                    <span className={styles.partRating}>{p.fideRating ? `FIDE: ${p.fideRating}` : "No Rating"}</span>
                  </div>
                  <div className={styles.partStatus}>
                    <span className={p.isApproved ? styles.approvedBadge : styles.pendingBadge}>
                      {p.isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noParticipants}>
                <p>No approved participants yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Rules Card */}
        <div className={`${styles.lobbyCard} ${styles.rulesCard}`}>
          <h2 className={styles.sectionTitle}>
            <FaFire className={styles.titleIcon} /> Rules & Guidelines
          </h2>
          <ul className={styles.rulesList}>
            <li>
              <div className={styles.ruleIconWrapper}>
                <FaCheckCircle className={styles.ruleIcon} />
              </div>
              <span>
                <strong>Approval Required:</strong> Only users approved by the admin can solve puzzles and score.
              </span>
            </li>
            <li>
              <div className={styles.ruleIconWrapper}>
                <FaClock className={styles.ruleIcon} />
              </div>
              <span>
                <strong>Spectator Mode:</strong> Unapproved users can spectate live activities but cannot score.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {showRegModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.regModal}>
            <div className={styles.modalHeader}>
              <h3>Register for Event</h3>
              <button className={styles.closeBtn} onClick={() => setShowRegModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleRegSubmit} className={styles.regForm}>
              <div className={styles.formGroup}>
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={regForm.fullName}
                  onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>WhatsApp Number *</label>
                <input
                  type="text"
                  required
                  value={regForm.whatsappNumber}
                  onChange={(e) => setRegForm({ ...regForm, whatsappNumber: e.target.value })}
                  placeholder="e.g. +91 9876543210"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Age *</label>
                  <input
                    type="number"
                    required
                    min="4"
                    value={regForm.age}
                    onChange={(e) => setRegForm({ ...regForm, age: e.target.value })}
                    placeholder="Your Age"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Gender *</label>
                  <select
                    value={regForm.gender}
                    onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>FIDE Rating (Optional)</label>
                <input
                  type="number"
                  value={regForm.fideRating}
                  onChange={(e) => setRegForm({ ...regForm, fideRating: e.target.value })}
                  placeholder="Enter FIDE Rating if any"
                />
              </div>

              <button type="submit" disabled={isSubmittingReg} className={styles.submitRegBtn}>
                {isSubmittingReg ? "Submitting..." : "Submit Registration"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventLobby;
