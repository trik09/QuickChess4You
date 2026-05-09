import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { examAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaClock,
  FaBookOpen,
  FaCheckCircle,
  FaFire,
  FaArrowRight,
  FaLock,
  FaTimes,
  FaGraduationCap,
  FaUsers,
  FaInfoCircle,
  FaListUl,
  FaShieldAlt
} from "react-icons/fa";
import { MdWarning } from "react-icons/md";
import toast from "react-hot-toast";
import styles from "./ExamLobby.module.css";
import PremiumLoader from "../../components/PremiumLoader/PremiumLoader";

const ExamLobby = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [examState, setExamState] = useState(""); // UPCOMING, LIVE, ENDED
  
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  const [participants, setParticipants] = useState([]);
  const [isJoining, setIsJoining] = useState(false);

  const hasJoined = user && participants.some(p => String(p.user?._id) === String(user._id) || String(p.user) === String(user._id));
  const hasAutoRedirectedRef = useRef(sessionStorage.getItem(`exam_redirected_${id}`) === "true");

  useEffect(() => {
    let isMounted = true;
    async function loadLobby() {
      try {
        const response = await examAPI.getExamDetails(id);
        if (!isMounted) return;
        const examData = response.data || response;
        if (examData?._id) {
          setExam(examData);
          setExamState(examData.status);
          setParticipants(examData.participants || []);
          if (examData.status === "ENDED") navigate(`/exam-results/${id}`, { replace: true });
        } else setError("Failed to load exam details.");
      } catch (err) {
        if (isMounted) setError("Error loading exam.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLobby();
    let pollTimer = setInterval(async () => {
      try {
        const res = await examAPI.getExamDetails(id);
        const data = res.data || res;
        if (data?._id) {
          setExamState(data.status);
          setParticipants(data.participants || []);
        }
      } catch(err) {}
    }, 5000);
    return () => { isMounted = false; clearInterval(pollTimer); };
  }, [id, navigate]);

  useEffect(() => {
    if (exam && examState !== "ENDED") {
      const timer = setInterval(() => calculateTimeLeft(), 1000);
      return () => clearInterval(timer);
    }
  }, [exam, examState]);

  const calculateTimeLeft = () => {
    if (!exam) return;
    const start = new Date(exam.startTime).getTime();
    const end = new Date(exam.endTime).getTime();
    const now = Date.now();
    if (examState === "UPCOMING") {
      const diff = start - now;
      if (diff <= 0) {
        setExamState("LIVE");
        if (!hasAutoRedirectedRef.current && !exam.accessCode && hasJoined) handleEnterExam(true);
      } else formatTimeDisplay(diff);
    } else if (examState === "LIVE") {
       const diff = end - now;
       if (diff <= 0) {
         setExamState("ENDED");
         navigate(`/exam-results/${id}`, { replace: true });
       } else formatTimeDisplay(diff);
    }
  };

  const formatTimeDisplay = (diff) => {
    const hours = Math.floor((diff / (1000 * 60 * 60)));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    setTimeLeft(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
  };

  const handleActionClick = () => {
    if (!hasJoined) handleJoinClick();
    else if (examState === "LIVE") handleEnterExam(false);
  };

  const handleJoinClick = () => {
    if (!user) { navigate(`/login?returnTo=${encodeURIComponent(`/exam/${id}/lobby`)}`); return; }
    if (exam?.accessCode) { setShowCodeModal(true); setAccessCodeInput(""); setCodeError(""); return; }
    executeJoin();
  };

  const executeJoin = async () => {
    setIsJoining(true);
    try {
      const res = await examAPI.joinExam(id);
      const data = res.data || res;
      setParticipants(data.participants || []);
      toast.success("Registration successful!");
      if (examState === "LIVE") handleEnterExam(false);
    } catch (err) { toast.error("Failed to participate"); }
    finally { setIsJoining(false); }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (accessCodeInput.trim() === exam.accessCode) { setShowCodeModal(false); executeJoin(); }
    else setCodeError("Incorrect access code");
  };

  const handleEnterExam = (isAuto = false) => {
     if (examState !== "LIVE" && !isAuto) { toast.error("Exam has not started!"); return; }
     hasAutoRedirectedRef.current = true;
     sessionStorage.setItem(`exam_redirected_${id}`, "true");
     navigate(`/exam/${id}/take`, { state: { exam } });
  };

  if (loading) return <PremiumLoader text="Connecting to Lobby..." />;
  if (error) return (
    <div className={styles.fullError}>
      <MdWarning className={styles.errIcon} />
      <h3>Lobby Unavailable</h3>
      <p>{error}</p>
      <button onClick={() => navigate('/Dashboard/exams')}>Return to Exams</button>
    </div>
  );

  return (
    <div className={styles.lobbyWrapper}>
      {/* ACCESS CODE MODAL */}
      {showCodeModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
             <div className={styles.modalHeader}>
               <FaLock className={styles.modalIcon} />
               <h3>Protected Exam</h3>
               <button className={styles.closeBtn} onClick={() => setShowCodeModal(false)}><FaTimes /></button>
             </div>
             <p>Enter the access code to register.</p>
             <form onSubmit={handleCodeSubmit}>
               <input type="text" placeholder="Access Code" value={accessCodeInput} onChange={e => setAccessCodeInput(e.target.value)} className={styles.modalInput} autoFocus />
               {codeError && <p className={styles.errorMsg}>{codeError}</p>}
               <button type="submit" className={styles.modalSubmit}>Unlock & Register</button>
             </form>
          </div>
        </div>
      )}

      {/* EXAM STRUCTURE MODAL */}
      {showStructureModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
             <div className={styles.modalHeader}>
               <FaListUl className={styles.modalIcon} />
               <h3>Exam Structure</h3>
               <button className={styles.closeBtn} onClick={() => setShowStructureModal(false)}><FaTimes /></button>
             </div>
             <div className={styles.structureList}>
               {exam?.chapters?.map((ch, i) => (
                 <div key={i} className={styles.structureItem}>
                   <div className={styles.strLeft}>
                     <span className={styles.strNum}>{i+1}</span>
                     <div>
                       <h4>{ch.title}</h4>
                       <p>{ch.quizIds?.length || 0} Questions</p>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      <div className={styles.container}>
        {/* TOP PARTICIPANTS BAR */}
        <div className={styles.participantsBar}>
          <div className={styles.pInfo}>
            <FaUsers />
            <span><strong>{participants.length}</strong> Registered Participants</span>
          </div>
          <div className={styles.pAvatars}>
            {participants.slice(0, 8).map((p, i) => (
              <img key={i} src={p.user?.avatar || p.user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="p" className={styles.pAvatar} title={p.user?.name} />
            ))}
            {participants.length > 8 && <div className={styles.pMore}>+{participants.length - 8}</div>}
          </div>
        </div>

        {/* MAIN HERO CARD */}
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.statusRow}>
              <span className={`${styles.statusPill} ${styles[examState?.toLowerCase()]}`}>{examState}</span>
              {exam?.accessCode && <span className={styles.lockPill}><FaLock /> Private</span>}
            </div>
            <h1 className={styles.examTitle}>{exam?.name || exam?.title}</h1>
            <p className={styles.examDesc}>{exam?.description || "Master the board with this comprehensive evaluation."}</p>
            
            <div className={styles.quickMeta}>
              <div className={styles.metaItem}><FaBookOpen /> {exam?.chapters?.length} Chapters</div>
              <div className={styles.metaItem}><FaClock /> {exam?.duration} Minutes</div>
              <button className={styles.structureBtn} onClick={() => setShowStructureModal(true)}>
                <FaListUl /> View Structure
              </button>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.timerContainer}>
              <span className={styles.timerLabel}>{examState === "UPCOMING" ? "Countdown to Start" : "Time Remaining"}</span>
              <div className={styles.timerValue}>{timeLeft || "00:00:00"}</div>
              <div className={styles.timerDates}>
                <span>{new Date(exam?.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                <FaArrowRight />
                <span>{new Date(exam?.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
            <button className={`${styles.actionBtn} ${hasJoined && examState === "LIVE" ? styles.pulse : ""}`} onClick={handleActionClick} disabled={examState === "ENDED" || isJoining || (hasJoined && examState === "UPCOMING")}>
              {isJoining ? "Joining..." : !hasJoined ? "Participate Now" : examState === "LIVE" ? "Enter Examination Room" : "Awaiting Start Time..."}
            </button>
          </div>
        </div>

        {/* INFO SECTION */}
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.icHeader}>
              <FaShieldAlt />
              <h3>Integrity & Rules</h3>
            </div>
            <div className={styles.rulesList}>
              <div className={styles.rule}><FaCheckCircle /> <span>No page refreshes allowed during exam.</span></div>
              <div className={styles.rule}><FaCheckCircle /> <span>Strict timer - auto-submission enabled.</span></div>
              <div className={styles.rule}><FaCheckCircle /> <span>Maintain stable internet connectivity.</span></div>
            </div>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.icHeader}>
              <FaInfoCircle />
              <h3>System Requirements</h3>
            </div>
            <div className={styles.rulesList}>
              <div className={styles.rule}><FaCheckCircle /> <span>Latest Chrome/Firefox recommended.</span></div>
              <div className={styles.rule}><FaCheckCircle /> <span>Enable JavaScript and Cookies.</span></div>
              <div className={styles.rule}><FaCheckCircle /> <span>Minimum screen width 1024px.</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamLobby;
