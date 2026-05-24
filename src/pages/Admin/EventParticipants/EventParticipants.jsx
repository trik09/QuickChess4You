import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaUserCheck,
  FaUserClock,
  FaWhatsapp,
  FaTrophy,
  FaCalendarAlt,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import {
  Button,
  DataTable,
  Badge,
  IconButton,
} from "../../../components/Admin";
import { eventAPI } from "../../../services/api";
import styles from "./EventParticipants.module.css";

function EventParticipants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const evtRes = await eventAPI.getById(id);
      if (evtRes.success) {
        setEventDetails(evtRes.data);
      }

      const partRes = await eventAPI.getParticipants(id);
      if (partRes.success && Array.isArray(partRes.data)) {
        setParticipants(partRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch participants:", error);
      toast.error("Failed to load registrations.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleApprove = async (participant) => {
    // Optimistic update for instant UI feedback
    setParticipants(prev => 
      prev.map(p => 
        (p._id === participant._id || p.id === participant.id) 
          ? { ...p, isApproved: true } 
          : p
      )
    );

    try {
      const res = await eventAPI.approveParticipant(id, participant._id || participant.id);
      if (res.success) {
        toast.success(`${participant.fullName || participant.username} approved successfully!`);
        fetchParticipants();
      }
    } catch (err) {
      toast.error(err.message || "Failed to approve participant");
      fetchParticipants();
    }
  };

  const columns = [
    {
      key: "username",
      label: "Signup Username",
      render: (val, row) => <span className={styles.usernameText}>{val || row.userId?.username || "N/A"}</span>
    },
    { key: "fullName", label: "Full Name" },
    {
      key: "whatsappNumber",
      label: "WhatsApp",
      render: (val) => (
        val ? (
          <a href={`https://wa.me/${val}`} target="_blank" rel="noreferrer" className={styles.whatsappLink}>
            <FaWhatsapp /> {val}
          </a>
        ) : "—"
      )
    },
    { key: "age", label: "Age" },
    { key: "gender", label: "Gender" },
    {
      key: "fideRating",
      label: "FIDE Rating",
      render: (val) => (val ? <Badge variant="info">{val}</Badge> : <span className={styles.noRating}>None</span>)
    },
    {
      key: "utrNumber",
      label: "UTR Number",
      render: (val) => (val ? <span style={{ fontWeight: 'bold', color: '#f59e0b', fontSize: '0.85rem' }}>{val}</span> : "—")
    },
    {
      key: "isApproved",
      label: "Status",
      render: (val) => (
        val ? (
          <Badge variant="success"><FaUserCheck /> Approved</Badge>
        ) : (
          <Badge variant="warning"><FaUserClock /> Pending Approval</Badge>
        )
      )
    }
  ];

  return (
    <div className={styles.container}>
      <Toaster position="top-right" />
      
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/admin/events")}>
          <FaArrowLeft /> Back to Events
        </button>
        {eventDetails && (
          <div className={styles.titleArea}>
            <h2>Registrations for "{eventDetails.name}"</h2>
            <p><FaCalendarAlt /> {new Date(eventDetails.startTime).toLocaleString()}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Loading participants...</div>
      ) : (
        <div className={styles.tableWrap}>
          <DataTable
            variant="dark"
            columns={columns}
            data={participants}
            actions={(participant) => (
              <div className={styles.actionButtons}>
                {!participant.isApproved && (
                  <Button
                    variant="success"
                    size="small"
                    icon={FaCheck}
                    onClick={() => handleApprove(participant)}
                  >
                    Approve
                  </Button>
                )}
                {participant.isApproved && (
                  <span className={styles.approvedLabel}>Approved</span>
                )}
              </div>
            )}
            emptyMessage="No participants have registered for this event yet."
          />
        </div>
      )}
    </div>
  );
}

export default EventParticipants;
