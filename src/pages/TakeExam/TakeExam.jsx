import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { examAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { Chessboard } from "react-chessboard";
import {
  FaClock,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaTimes,
  FaFlag,
  FaInfoCircle,
  FaThList,
  FaGraduationCap
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import styles from "./TakeExam.module.css";
import PremiumLoader from "../../components/PremiumLoader/PremiumLoader";

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [exam, setExam] = useState(location.state?.exam || null);
  const [loading, setLoading] = useState(!location.state?.exam);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [draggedItem, setDraggedItem] = useState(null);
  
  const hasAutoSubmittedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const loadExam = async () => {
      try {
        const res = await examAPI.getExamDetails(id);
        if (isMounted) {
          const data = res.data || res;
          const myParticipation = data.participants?.find(p => 
             (p.user === user?._id || p.user?._id === user?._id) && p.submittedAt
          );
          if (myParticipation) {
             navigate(`/exam-results/${id}`, { replace: true });
             return;
          }
          setExam(data);
          setLoading(false);
          initializeTimer(data);
        }
      } catch (err) {
        if (isMounted) { setError("Failed to load exam."); setLoading(false); }
      }
    };
    if (!exam) loadExam();
    else initializeTimer(exam);
    return () => { isMounted = false; };
  }, [id, user?._id]);

  const initializeTimer = (ex) => {
    if (!ex) return;
    const end = new Date(ex.endTime).getTime();
    const now = Date.now();
    const durationSeconds = (ex.duration || 60) * 60;
    const remaining = Math.min((end - now) / 1000, durationSeconds);
    setTimeLeft(Math.max(0, Math.floor(remaining)));
  };

  useEffect(() => {
    if (timeLeft === null || loading) return;
    if (timeLeft <= 0 && !submitting && !hasAutoSubmittedRef.current) {
       hasAutoSubmittedRef.current = true;
       handleSubmitExam(true);
       return;
    }
    const timerId = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, loading, submitting]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const chapters = useMemo(() => exam?.chapters || [], [exam]);
  const currentChapter = chapters[currentChapterIdx];
  const currentQuiz = currentChapter?.quizIds?.[currentQuizIdx];
  const totalQuestions = useMemo(() => chapters.reduce((acc, ch) => acc + ch.quizIds.length, 0), [chapters]);
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const progressPercent = (answeredCount / totalQuestions) * 100;

  const handleNext = () => {
    if (currentQuizIdx < currentChapter.quizIds.length - 1) setCurrentQuizIdx(prev => prev + 1);
    else if (currentChapterIdx < chapters.length - 1) { setCurrentChapterIdx(prev => prev + 1); setCurrentQuizIdx(0); }
  };

  const handlePrev = () => {
    if (currentQuizIdx > 0) setCurrentQuizIdx(prev => prev - 1);
    else if (currentChapterIdx > 0) {
      const prevChIdx = currentChapterIdx - 1;
      setCurrentChapterIdx(prevChIdx);
      setCurrentQuizIdx(chapters[prevChIdx].quizIds.length - 1);
    }
  };

  const toggleFlag = (quizId) => setFlags(prev => ({ ...prev, [quizId]: !prev[quizId] }));

  const handleOptionSelect = (optId) => {
    setAnswers(prev => ({ ...prev, [currentQuiz._id]: { ...prev[currentQuiz._id], selectedOption: optId } }));
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e, text) => {
    setDraggedItem(text);
    e.dataTransfer.setData("text/plain", text);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add(styles.dropBoxActive);
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove(styles.dropBoxActive);
  };

  const handleDrop = (e, leftItem) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dropBoxActive);
    const rightItemText = e.dataTransfer.getData("text/plain");
    
    setAnswers(prev => {
      const qAns = prev[currentQuiz._id] || { matchedPairs: [] };
      let pairs = [...(qAns.matchedPairs || [])];
      // Remove any existing pair for this left item or this right item
      pairs = pairs.filter(p => p.leftItem !== leftItem && p.rightItem !== rightItemText);
      pairs.push({ leftItem, rightItem: rightItemText });
      return { ...prev, [currentQuiz._id]: { ...qAns, matchedPairs: pairs } };
    });
    setDraggedItem(null);
  };

  const removeMatch = (leftItem) => {
    setAnswers(prev => {
      const qAns = prev[currentQuiz._id] || { matchedPairs: [] };
      return { ...prev, [currentQuiz._id]: { ...qAns, matchedPairs: qAns.matchedPairs.filter(p => p.leftItem !== leftItem) } };
    });
  };

  const handleSubmitExam = async (isAuto = false) => {
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([quizId, ans]) => ({
        quizId,
        selectedOption: ans.selectedOption,
        matchedPairs: ans.matchedPairs || []
      }));
      await examAPI.submitExam(exam._id, { answers: formattedAnswers });
      toast.success("Exam submitted!");
      navigate(`/exam-results/${exam._id}`, { replace: true });
    } catch (err) {
      toast.error("Failed to submit.");
      setSubmitting(false);
    }
  };

  const shuffledRightItems = useMemo(() => {
    if (currentQuiz?.type === 'column_matching' && currentQuiz.pairs) {
       return [...currentQuiz.pairs.map(p => p.rightItem)].sort(() => Math.random() - 0.5);
    }
    return [];
  }, [currentQuiz?._id]);

  if (loading) return <PremiumLoader text="Entering Examination Room..." />;
  if (error) return (
    <div className={styles.fullError}>
      <FaTimes />
      <h2>Exam Unavailable</h2>
      <p>{error}</p>
      <button onClick={() => navigate('/Dashboard/exams')}>Return</button>
    </div>
  );

  const currentAnswer = answers[currentQuiz?._id] || {};
  const isFirst = currentChapterIdx === 0 && currentQuizIdx === 0;
  const isLast = currentChapterIdx === chapters.length - 1 && currentQuizIdx === currentChapter?.quizIds?.length - 1;

  return (
    <div className={styles.examContainer}>
      <Toaster position="top-right" />
      
      <nav className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <div className={styles.examBrand}><FaGraduationCap /><span>{exam.title}</span></div>
          <div className={styles.progressBarWrapper}>
            <div className={styles.progressText}>Progress: {Math.round(progressPercent)}%</div>
            <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${progressPercent}%` }}></div></div>
          </div>
        </div>
        <div className={styles.statusRight}>
          <div className={`${styles.timerDisplay} ${timeLeft < 300 ? styles.timerWarning : ''}`}>
            <FaClock /><span>{formatTime(timeLeft)}</span>
          </div>
          <button className={styles.finishBtn} onClick={() => setShowConfirmModal(true)}>Finish Exam</button>
        </div>
      </nav>

      <div className={styles.mainLayout}>
        <aside className={styles.navPanel}>
          <div className={styles.navHeader}><FaThList /> Question Navigator</div>
          <div className={styles.chaptersScroll}>
            {chapters.map((ch, cIdx) => (
              <div key={cIdx} className={styles.chapterSection}>
                <div className={styles.chLabel}>Ch {cIdx + 1}: {ch.title}</div>
                <div className={styles.questionGrid}>
                  {ch.quizIds.map((q, qIdx) => {
                    const active = cIdx === currentChapterIdx && qIdx === currentQuizIdx;
                    const answered = !!(answers[q._id]?.selectedOption || answers[q._id]?.matchedPairs?.length > 0);
                    return (
                      <button key={q._id} className={`${styles.qNode} ${active ? styles.qActive : ''} ${answered ? styles.qAnswered : ''} ${flags[q._id] ? styles.qFlagged : ''}`} onClick={() => { setCurrentChapterIdx(cIdx); setCurrentQuizIdx(qIdx); }}>
                        {qIdx + 1}{flags[q._id] && <FaFlag className={styles.flagDot} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className={styles.questionArea}>
          <div className={styles.questionCard}>
            <div className={styles.cardHeader}>
              <div className={styles.qInfo}><span className={styles.qBadge}>Question {currentQuizIdx + 1}</span><span className={styles.qType}>{currentQuiz?.type === 'mcq' ? 'MCQ' : 'Matching'}</span></div>
              <button className={`${styles.flagBtn} ${flags[currentQuiz?._id] ? styles.flagged : ''}`} onClick={() => toggleFlag(currentQuiz?._id)}><FaFlag /> Flag</button>
            </div>

            <div className={styles.qContent}>
              <h2 className={styles.qText}>{currentQuiz?.questionText}</h2>

              {currentQuiz?.type === 'mcq' && currentQuiz.isBoardBased && (
                <div className={styles.boardContainer}>
                  <div className={styles.boardInner}>
                    <Chessboard position={currentQuiz.fen} arePiecesDraggable={false} customDarkSquareStyle={{ backgroundColor: '#b58863' }} />
                  </div>
                </div>
              )}

              {currentQuiz?.type === 'mcq' && (
                <div className={styles.mcqGrid}>
                  {currentQuiz.options?.map((opt, i) => (
                    <button key={opt._id} className={`${styles.mcqOption} ${currentAnswer.selectedOption === opt._id ? styles.selected : ''}`} onClick={() => handleOptionSelect(opt._id)}>
                      <span className={styles.optLetter}>{String.fromCharCode(65 + i)}</span><span className={styles.optText}>{opt.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {currentQuiz?.type === 'column_matching' && (
                <div className={styles.matchingSection}>
                  <div className={styles.matchGrid}>
                    <div>
                      <h4 className={styles.colLabel}>Items</h4>
                      {currentQuiz.pairs?.map(p => <div key={p.leftItem} className={styles.leftItem}>{p.leftItem}</div>)}
                    </div>
                    <div>
                      <h4 className={styles.colLabel}>Drop Box</h4>
                      {currentQuiz.pairs?.map(p => {
                        const match = currentAnswer.matchedPairs?.find(m => m.leftItem === p.leftItem);
                        return (
                          <div key={p.leftItem} className={`${styles.dropBox} ${match ? styles.boxFilled : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, p.leftItem)}>
                            {match ? (
                              <div className={styles.droppedItem}>
                                {match.rightItem}
                                <button className={styles.removeBtn} onClick={() => removeMatch(p.leftItem)}><FaTimes /></button>
                              </div>
                            ) : <span>Drop here</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div>
                      <h4 className={styles.colLabel}>Options</h4>
                      <div className={styles.rightOptions}>
                        {shuffledRightItems.map(txt => {
                          const used = currentAnswer.matchedPairs?.some(m => m.rightItem === txt);
                          return (
                            <div key={txt} draggable={!used} onDragStart={(e) => handleDragStart(e, txt)} className={`${styles.optionBox} ${used ? styles.optionUsed : ''}`}>
                              {txt}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.navActions}>
            <button className={styles.navActionBtn} onClick={handlePrev} disabled={isFirst}><FaChevronLeft /> Previous</button>
            <div className={styles.pageIndicator}>Q {currentQuizIdx + 1} / {currentChapter?.quizIds.length}</div>
            <button className={`${styles.navActionBtn} ${styles.primary}`} onClick={isLast ? () => setShowConfirmModal(true) : handleNext}>
              {isLast ? 'Finish' : 'Next'} <FaChevronRight />
            </button>
          </div>
        </main>
      </div>

      {showConfirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmBox}>
            <div className={styles.modalHeader}><FaGraduationCap /><h3>Submit Exam?</h3></div>
            <p>You have answered {answeredCount} / {totalQuestions} questions.</p>
            <div className={styles.modalButtons}>
              <button className={styles.backToExam} onClick={() => setShowConfirmModal(false)}>Continue Exam</button>
              <button className={styles.confirmFinish} onClick={() => handleSubmitExam(false)}>Submit Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeExam;
