import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaTrophy,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaUsers,
  FaClock,
  FaPuzzlePiece,
  FaTimes,
  FaChess,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import {
  Button,
  DataTable,
  Badge,
  IconButton,
  SearchBar,
} from "../../../components/Admin";
import { eventAPI } from "../../../services/api";
import styles from "../CompetitionList/CompetitionList.module.css";

function EventList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || "all");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const itemsPerPage = 10;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await eventAPI.getAll();
      if (response.success && Array.isArray(response.data)) {
        const mappedEvents = response.data.map((evt) => ({
          id: evt._id,
          _id: evt._id,
          name: evt.name || evt.title,
          status: getEventStatus(evt),
          startTime: evt.startTime
            ? new Date(evt.startTime).toLocaleString([], {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "N/A",
          startTimeRaw: evt.startTime ? new Date(evt.startTime) : new Date(0),
          endTime: evt.endTime ? new Date(evt.endTime).toLocaleString() : "N/A",
          puzzlesCount: evt.puzzles?.length || 0,
          registeredCount: evt.registeredCount || 0,
          approvedCount: evt.approvedCount || 0,
          maxParticipants: evt.maxParticipants || "∞",
        })).sort((a, b) => b.startTimeRaw - a.startTimeRaw);
        setEvents(mappedEvents);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      toast.error("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Sync filters to URL search params
  useEffect(() => {
    const params = {};
    if (activeTab !== 'all') params.status = activeTab;
    if (searchTerm) params.search = searchTerm;
    if (currentPage > 1) params.page = currentPage;
    setSearchParams(params, { replace: true });
  }, [activeTab, searchTerm, currentPage, setSearchParams]);

  const getEventStatus = (evt) => {
    const now = new Date();
    const startDate = new Date(evt.startTime);
    const endDate = new Date(evt.endTime);

    if (now < startDate) return "Upcoming";
    if (now > endDate) return "Ended";
    return "Live";
  };

  const handleDelete = async (evt) => {
    if (window.confirm(`Are you sure you want to delete the event "${evt.name}"?`)) {
      try {
        await eventAPI.deleteEvent(evt._id || evt.id);
        toast.success("Event deleted successfully!");
        fetchEvents();
      } catch (err) {
        toast.error(err.message || "Failed to delete event");
      }
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesTab = activeTab === "all" || e.status.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const columns = [
    { key: "name", label: "Event Name" },
    {
      key: "status",
      label: "Status",
      render: (status) => {
        const variantMap = {
          Live: "live",
          Upcoming: "warning",
          Ended: "info",
        };
        return <Badge variant={variantMap[status]}>{status}</Badge>;
      },
    },
    { key: "startTime", label: "Start Time" },
    {
      key: "puzzlesCount",
      label: "Puzzles",
      render: (count) => (
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <FaPuzzlePiece /> {count}
        </span>
      ),
    },
    {
      key: "registeredCount",
      label: "Registered",
      render: (count) => <span style={{ fontWeight: "bold", fontSize: "1.1rem", color: "#b58863" }}>{count}</span>
    },
    {
      key: "approvedCount",
      label: "Approved",
      render: (count) => <span style={{ fontWeight: "bold", fontSize: "1.1rem", color: "#10b981" }}>{count}</span>
    },
  ];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className={styles.competitionList}>
      <Toaster position="top-right" />
      
      <div className={styles.compactHeader}>
        <div className={styles.titleArea}>
          <div className={styles.titleWithIcon}>
            <FaTrophy className={styles.headerIcon} style={{ color: "#fbbf24" }} />
            <h2>Event Management</h2>
          </div>
          <p className={styles.subtitle}>Review registrations and configure chess events</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.tabsCompact}>
            {["all", "upcoming", "live", "ended"].map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.active : ""}`}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
          
          <Button
            onClick={() => navigate("/admin/events/create")}
            icon={FaPlus}
            size="small"
          >
            Create Event
          </Button>
        </div>
      </div>

      <div className={styles.filterSectionCompact}>
        <div className={styles.searchBarWrapperCompact}>
          <div className={styles.searchIconInside}>
            <FaSearch />
          </div>
          <input
            type="text"
            className={styles.compactInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search events by title..."
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading events...</div>
      ) : (
        <>
          <div className={styles.tableSection}>
            <DataTable
              columns={columns}
              data={currentEvents}
              actions={(evt) => (
                <div className={styles.actionButtons}>
                  <IconButton
                    icon={FaUsers}
                    onClick={() => navigate(`/admin/events/${evt._id || evt.id}/participants`)}
                    title="View Registrations"
                    variant="primary"
                  />
                  <IconButton
                    icon={FaEdit}
                    onClick={() => navigate(`/admin/events/edit/${evt._id || evt.id}${window.location.search}`)}
                    title="Edit"
                    variant="primary"
                  />
                  <IconButton
                    icon={FaTrash}
                    onClick={() => handleDelete(evt)}
                    title="Delete"
                    variant="danger"
                  />
                </div>
              )}
              emptyMessage="No events found."
            />
          </div>

          {filteredEvents.length > itemsPerPage && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <FaChevronLeft/>
              </button>
              
              <span className={styles.pageInfo}>
                Page <strong>{currentPage}</strong> of {Math.ceil(filteredEvents.length / itemsPerPage)}
              </span>

              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredEvents.length / itemsPerPage), prev + 1))}
                disabled={currentPage === Math.ceil(filteredEvents.length / itemsPerPage)}
              >
                <FaChevronRight/>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default EventList;
