import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { examAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { 
  FaTrophy, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaArrowLeft, 
  FaChartLine, 
  FaUserGraduate, 
  FaMedal,
  FaClipboardCheck
} from "react-icons/fa";
import styles from "./ExamResults.module.css";
import PremiumLoader from "../../components/PremiumLoader/PremiumLoader";

const ExamResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("summary"); // summary | breakdown | leaderboard

  useEffect(() => {
    let isMounted = true;
    async function fetchResults() {
      try {
        const response = await examAPI.getExamResults(id);
        if (isMounted) setResultsData(response.data || response);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Failed to fetch results.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (user) fetchResults();
    else setLoading(false);
    return () => { isMounted = false; };
  }, [id, user]);

  const { score, answers, examDetails } = resultsData || {};
  
  const participantsSorted = useMemo(() => {
    if (!examDetails?.participants) return [];
    return [...examDetails.participants]
      .filter(p => p.submittedAt)
      .sort((a, b) => b.score - a.score || new Date(a.submittedAt) - new Date(b.submittedAt));
  }, [examDetails]);

  const userRank = useMemo(() => {
    return participantsSorted.findIndex(p => p.user?._id === user?._id || p.user === user?._id) + 1;
  }, [participantsSorted, user?._id]);

  const totalQuestions = useMemo(() => {
    if (!examDetails) return 0;
    return examDetails.chapters.reduce((acc, ch) => acc + ch.quizIds.length, 0);
  }, [examDetails]);

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  if (loading) return <PremiumLoader text="Processing your results..." />;
  if (error) return (
    <div className={styles.fullError}>
      <h2>Access Restricted</h2>
      <p>{error}</p>
      <button onClick={() => navigate('/Dashboard/exams')}>Back to Exams</button>
    </div>
  );

  return (
    <div className={styles.resultsWrapper}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button className={styles.backBtn} onClick={() => navigate('/Dashboard/exams')}>
            <FaArrowLeft />
          </button>
          <div className={styles.titleArea}>
            <span className={styles.preTitle}>Exam Performance Report</span>
            <h1 className={styles.examName}>{examDetails?.name || examDetails?.title}</h1>
          </div>
        </div>
        
        <div className={styles.tabContainer}>
          <div className={styles.resultTabs}>
            <button className={`${styles.resTab} ${activeTab === 'summary' ? styles.tabActive : ''}`} onClick={() => setActiveTab('summary')}>
              <FaChartLine /> Summary
            </button>
            <button className={`${styles.resTab} ${activeTab === 'breakdown' ? styles.tabActive : ''}`} onClick={() => setActiveTab('breakdown')}>
              <FaClipboardCheck /> Question Breakdown
            </button>
            <button className={`${styles.resTab} ${activeTab === 'leaderboard' ? styles.tabActive : ''}`} onClick={() => setActiveTab('leaderboard')}>
              <FaTrophy /> Leaderboard
            </button>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        {activeTab === 'summary' && (
          <div className={styles.summaryGrid}>
            {/* SCORE CARD */}
            <div className={styles.scoreCard}>
              <div className={styles.percentageCircle}>
                <svg viewBox="0 0 36 36" className={styles.circularChart}>
                  <path className={styles.circleBg} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className={styles.circle} strokeDasharray={`${percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="20.35" className={styles.percText}>{percentage}%</text>
                </svg>
              </div>
              <div className={styles.scoreInfo}>
                <div className={styles.pointsLabel}>Final Score</div>
                <div className={styles.pointsValue}>{score} <span>/ {totalQuestions}</span></div>
                <div className={styles.rankBadge}>
                  <FaMedal /> Rank #{userRank} of {participantsSorted.length}
                </div>
              </div>
            </div>

            {/* QUICK STATS */}
            <div className={styles.statsList}>
              <div className={styles.miniStatCard}>
                <FaCheckCircle className={styles.iconCorrect} />
                <div className={styles.miniStatInfo}>
                  <span className={styles.mValue}>{score}</span>
                  <span className={styles.mLabel}>Correct Answers</span>
                </div>
              </div>
              <div className={styles.miniStatCard}>
                <FaTimesCircle className={styles.iconWrong} />
                <div className={styles.miniStatInfo}>
                  <span className={styles.mValue}>{totalQuestions - score}</span>
                  <span className={styles.mLabel}>Mistakes Made</span>
                </div>
              </div>
              <div className={styles.miniStatCard}>
                <FaUserGraduate className={styles.iconNeutral} />
                <div className={styles.miniStatInfo}>
                  <span className={styles.mValue}>{percentage > 50 ? 'Passed' : 'Needs Work'}</span>
                  <span className={styles.mLabel}>Current Standing</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div className={styles.breakdownList}>
            {examDetails?.chapters.map((ch, cIdx) => (
              <div key={ch._id} className={styles.chRow}>
                <h3 className={styles.chTitle}>Chapter {cIdx + 1}: {ch.title}</h3>
                <div className={styles.qGrid}>
                  {ch.quizIds.map((q, qIdx) => {
                    const ans = answers.find(a => a.quizId === q._id);
                    const correct = ans?.isCorrect;
                    return (
                      <div key={q._id} className={`${styles.qResultCard} ${correct ? styles.qrCorrect : styles.qrWrong}`}>
                        <div className={styles.qrHeader}>
                          <span className={styles.qrNum}>Q{qIdx + 1}</span>
                          {correct ? <FaCheckCircle /> : <FaTimesCircle />}
                        </div>
                        <div className={styles.qrBody}>
                          <p className={styles.qrText}>{q.questionText}</p>
                          {!correct && q.type === 'mcq' && (
                            <div className={styles.qrSolution}>
                              <div className={styles.solRow}><strong>Your:</strong> {q.options.find(o => o._id === ans?.selectedOption)?.text || 'Skipped'}</div>
                              <div className={styles.solRowCorrect}><strong>Correct:</strong> {q.options.find(o => o.isCorrect)?.text}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className={styles.leaderboardCard}>
            <div className={styles.lbHeader}>
              <h3>Exam Leaderboard</h3>
              <span>Global Rankings</span>
            </div>
            <div className={styles.lbTable}>
              {participantsSorted.map((p, idx) => {
                const isMe = p.user?._id === user?._id || p.user === user?._id;
                return (
                  <div key={idx} className={`${styles.lbRow} ${isMe ? styles.lbMe : ''}`}>
                    <div className={styles.lbRank}>
                      {idx === 0 ? <FaTrophy className={styles.gold} /> : idx + 1}
                    </div>
                    <div className={styles.lbUser}>
                      <img src={p.user?.avatar || p.user?.profilePicture || 'https://via.placeholder.com/40'} alt="" />
                      <div className={styles.lbUserInfo}>
                        <span className={styles.lbName}>{p.user?.name || "Anonymous Student"}</span>
                        {isMe && <span className={styles.meBadge}>YOU</span>}
                      </div>
                    </div>
                    <div className={styles.lbScore}>
                      <span className={styles.lbPoints}>{p.score}</span>
                      <span className={styles.lbMax}>/ {totalQuestions}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ExamResults;
