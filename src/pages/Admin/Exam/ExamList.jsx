import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGraduationCap,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaClock,
  FaLock,
  FaCalendarAlt,
  FaHourglassHalf,
  FaTimes,
  FaBookOpen,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import {
  PageHeader,
  Button,
  Badge,
} from "../../../components/Admin";
import { examAPI } from "../../../services/api";
import styles from "./ExamList.module.css";

function ExamList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "N/A";
    if (minutes < 60) return `${minutes} min`;
    const hours = (minutes / 60).toFixed(1);
    return `${hours} hrs`;
  };

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const response = await examAPI.getAdminExams();
      if (Array.isArray(response)) {
        const mappedExams = response.map((exam) => ({
          ...exam,
          startDate: exam.startTime
            ? new Date(exam.startTime).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
            : "N/A",
          startTimeOnly: exam.startTime
            ? new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : "N/A",
          startTimeRaw: exam.startTime ? new Date(exam.startTime) : new Date(0),
          durationFormatted: exam.duration ? formatDuration(exam.duration) : "N/A",
        })).sort((a, b) => b.startTimeRaw - a.startTimeRaw);
        setExams(mappedExams);
      }
    } catch (error) {
      console.error("Failed to fetch exams:", error);
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleView = (exam) => {
    setSelectedExam(exam);
    setShowViewModal(true);
  };

  const handleDelete = (exam) => {
    setDeleteConfirm(exam);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm?._id) return;
    try {
      await examAPI.deleteExam(deleteConfirm._id);
      setExams((prev) => prev.filter((p) => p._id !== deleteConfirm._id));
      toast.success(`Exam "${deleteConfirm.name}" deleted successfully!`);
    } catch (err) {
      toast.error(err.message || "Failed to delete exam");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredExams = activeTab === "all"
      ? exams
      : exams.filter((c) => c.status && c.status.toLowerCase() === activeTab);

  return (
    <div className={styles.examList}>
      <Toaster position="top-right" />
      <PageHeader
        icon={FaGraduationCap}
        title="Exam Management"
        subtitle="Manage all exams and quizzes"
        action={
          <Button
            onClick={() => navigate("/admin/exams/create")}
            icon={FaPlus}
          >
            Create Exam
          </Button>
        }
      />

      <div className={styles.tabs}>
        {['all', 'upcoming', 'live', 'ended'].map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ""}`}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>Loading exams...</div>
      ) : (
        <>
          <div className={styles.examGrid}>
            {filteredExams
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((exam) => (
                <div key={exam._id} className={styles.examCard}>
                  <div className={styles.cardHeader}>
                    <Badge variant={
                      exam.status === "LIVE" ? "live" :
                        exam.status === "UPCOMING" ? "warning" : "info"
                    }>
                      {exam.status}
                    </Badge>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.actionIcon}
                        onClick={() => handleView(exam)}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        className={styles.actionIcon}
                        onClick={() => navigate(`/admin/exams/edit/${exam._id}`)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className={`${styles.actionIcon} ${styles.delete}`}
                        onClick={() => handleDelete(exam)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{exam.name}</h3>
                    <div className={styles.infoRow}>
                      <FaCalendarAlt />
                      <span>{exam.startDate} • {exam.startTimeOnly}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <FaHourglassHalf />
                      <span>Duration: {exam.durationFormatted}</span>
                    </div>
                    {exam.accessCode && (
                      <div className={styles.infoRow}>
                        <FaLock />
                        <span>Passcode: {exam.accessCode}</span>
                      </div>
                    )}
                    <div className={styles.infoRow}>
                      <FaBookOpen />
                      <span>Chapters: {exam.chapters?.length || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {filteredExams.length > itemsPerPage && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                &laquo;
              </button>
              
              <span className={styles.pageInfo}>
                Page <strong>{currentPage}</strong> of {Math.ceil(filteredExams.length / itemsPerPage)}
              </span>

              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredExams.length / itemsPerPage), prev + 1))}
                disabled={currentPage === Math.ceil(filteredExams.length / itemsPerPage)}
              >
                &raquo;
              </button>
            </div>
          )}

          {filteredExams.length === 0 && (
            <div className={styles.loading}>No exams found</div>
          )}
        </>
      )}

      {/* View Exam Details Modal */}
      {showViewModal && selectedExam && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><FaGraduationCap /> {selectedExam.name}</h3>
              <button className={styles.closeBtn} onClick={() => setShowViewModal(false)}><FaTimes /></button>
            </div>
            <div className={styles.modalBody}>
               <p><strong>Description:</strong> {selectedExam.description || 'No description provided.'}</p>
               <p><strong>Start Time:</strong> {new Date(selectedExam.startTime).toLocaleString()}</p>
               <p><strong>End Time:</strong> {new Date(selectedExam.endTime).toLocaleString()}</p>
               <p><strong>Status:</strong> {selectedExam.status}</p>
               <p><strong>Passcode:</strong> {selectedExam.accessCode || 'Public'}</p>
               
               <h4 style={{marginTop: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px'}}>Chapters & Quizzes</h4>
               {selectedExam.chapters && selectedExam.chapters.length > 0 ? (
                 selectedExam.chapters.map((chapter, idx) => (
                   <div key={idx} style={{marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '8px'}}>
                     <h5>{chapter.name}</h5>
                     <p style={{fontSize: '0.9rem', color: '#666'}}>{chapter.description}</p>
                     <p style={{fontSize: '0.9rem', margin: '5px 0'}}><strong>Duration:</strong> {chapter.duration} mins</p>
                     <p style={{fontSize: '0.9rem', margin: '5px 0'}}><strong>Quizzes:</strong> {chapter.quizzes?.length || 0}</p>
                   </div>
                 ))
               ) : (
                 <p>No chapters added yet.</p>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmHeader}>
              <FaTrash className={styles.dangerIcon} />
              <h3>Delete Exam</h3>
            </div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?</p>
              <p className={styles.warningText}>This action cannot be undone.</p>
            </div>
            <div className={styles.confirmActions}>
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" icon={FaTrash} onClick={confirmDelete}>Delete Exam</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamList;
