import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { examAPI } from "../../services/api";
import PageHeader from "../../components/PageHeader/PageHeader";
import styles from "./Dashboard.module.css";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaCalendarAlt,
  FaClock,
  FaBookOpen,
  FaClipboardList,
  FaChevronRight,
  FaChartBar,
  FaLock,
  FaTrophy,
  FaArrowRight
} from "react-icons/fa";

function ExamDashboard() {
  const navigate = useNavigate();
  const { isUserAuthenticated } = useAuth();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [filteredExams, setFilteredExams] = useState([]);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await examAPI.getPublicExams();
      if (Array.isArray(response)) {
        const formattedExams = response.map((exam) => {
          const startDate = new Date(exam.startTime);
          const endDate = new Date(exam.endTime);
          const now = new Date();

          let status = "Upcoming";
          if (now >= startDate && now <= endDate) {
            status = "Live";
          } else if (now > endDate) {
            status = "Ended";
          }

          const durationMins = exam.duration || 60;
          const durationText =
            durationMins > 60
              ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
              : `${durationMins}m`;

          return {
            id: exam._id,
            _id: exam._id,
            title: exam.name || exam.title || "Untitled Exam",
            dateDisplay: formatDateRange(exam.startTime),
            startDate: exam.startTime,
            endDate: exam.endTime,
            status,
            chaptersCount: exam.chapters?.length || 0,
            durationText,
            requiresPasscode: !!exam.accessCode,
            description: exam.description
          };
        });

        const sorted = formattedExams.sort((a, b) => {
          const statusOrder = { Live: 1, Upcoming: 2, Ended: 3 };
          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
          }

          if (a.status === 'Ended') {
            return new Date(b.endDate || b.startDate) - new Date(a.endDate || a.startDate);
          }
          return new Date(a.startDate) - new Date(b.startDate);
        });

        setExams(sorted);
      }
    } catch (err) {
      console.error("Failed to fetch exams:", err);
      setError("Failed to load exams.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    if (activeTab === "All") {
      setFilteredExams(exams);
    } else {
      setFilteredExams(
        exams.filter((c) => c.status.toLowerCase() === activeTab.toLowerCase())
      );
    }
  }, [activeTab, exams]);

  const formatDateRange = (startDate) => {
    if (!startDate) return "TBA";
    const start = new Date(startDate);
    return start.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleParticipate = (exam) => {
    if (!isUserAuthenticated) {
      navigate(`/?reason=auth_required&returnTo=${encodeURIComponent(`/exam/${exam._id}/lobby`)}`);
      return;
    }
    if (exam.status === "Ended") {
      navigate(`/exam-results/${exam._id}`);
    } else {
      navigate(`/exam/${exam._id}/lobby`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
         <div className={styles.headerRow}>
           <PageHeader
            title="Exams & Quizzes"
            subtitle="Test your chess knowledge with official exams"
            icon={<FaClipboardList />}
          />
          <div className={styles.statsOverview}>
            <div className={styles.miniStat}>
              <span className={styles.statLabel}>Active</span>
              <span className={styles.statValue}>{exams.filter(e => e.status === 'Live').length}</span>
            </div>
            <div className={styles.miniStat}>
              <span className={styles.statLabel}>Upcoming</span>
              <span className={styles.statValue}>{exams.filter(e => e.status === 'Upcoming').length}</span>
            </div>
          </div>
         </div>

        <div className={styles.tabsWrapper}>
          <div className={styles.modernTabs}>
            {["All", "Live", "Upcoming", "Ended"].map((tab) => (
              <button
                key={tab}
                className={`${styles.modernTab} ${activeTab === tab ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {tab !== 'All' && exams.filter(e => e.status === tab).length > 0 && (
                  <span className={styles.tabBadge}>{exams.filter(e => e.status === tab).length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={styles.premiumLoadingState}>
            <div className={styles.dualSpinner}></div>
            <p>Loading your knowledge challenge...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={fetchExams} className={styles.retryBtn}>Retry</button>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className={styles.emptyStateContainer}>
            <div className={styles.emptyIllustration}>
              <FaClipboardList className={styles.emptyIcon} />
            </div>
            <h3>No {activeTab !== 'All' ? activeTab : ''} Exams Found</h3>
            <p>Ready to sharpen your skills? Check back soon for new quizzes.</p>
          </div>
        ) : (
          <div className={styles.examTableWrapper}>
            <table className={styles.examTable}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Exam Name</th>
                  <th>Start Time</th>
                  <th>Duration</th>
                  <th>Chapters</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map((exam) => (
                  <tr key={exam.id} onClick={() => handleParticipate(exam)} style={{ cursor: 'pointer' }}>
                    <td>
                      <span className={`${styles.statusPill} ${styles[exam.status.toLowerCase()]}`}>
                        {exam.status === 'Live' && <span className={styles.pulseDot}></span>}
                        {exam.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.tableNameCell}>
                        <div className={styles.tableNameMain}>
                          <span className={styles.tableNameText}>{exam.title}</span>
                          {exam.requiresPasscode && <span className={styles.lockBadge}><FaLock /></span>}
                        </div>
                        <span className={styles.tableDescText}>
                          {exam.description || "Challenge yourself with this chess quiz."}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.tableIconBox}>
                        <FaCalendarAlt />
                        <span>{exam.dateDisplay}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.tableIconBox}>
                        <FaClock />
                        <span>{exam.durationText}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.tableIconBox}>
                        <FaBookOpen />
                        <span>{exam.chaptersCount} Ch.</span>
                      </div>
                    </td>
                    <td>
                      {exam.status === "Ended" ? (
                        <button 
                          className={styles.resultsBtn} 
                          onClick={(e) => { e.stopPropagation(); handleParticipate(exam); }}
                          style={{ padding: '8px 14px', fontSize: '0.85rem', borderRadius: '8px', width: 'auto' }}
                        >
                          <FaTrophy /> Leaderboard
                        </button>
                      ) : (
                        <button 
                          className={styles.enterBtn} 
                          onClick={(e) => { e.stopPropagation(); handleParticipate(exam); }}
                          style={{ padding: '8px 14px', fontSize: '0.85rem', borderRadius: '8px', width: 'auto' }}
                        >
                          {exam.status === 'Live' ? 'Enter' : 'Lobby'} 
                          <FaArrowRight />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExamDashboard;
