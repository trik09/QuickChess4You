import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import confetti from 'canvas-confetti';
import { 
    FaChevronLeft, 
    FaChevronRight, 
    FaCheck, 
    FaPlay, 
    FaSync, 
    FaRetweet, 
    FaLightbulb, 
    FaBookmark,
    FaArrowRight,
    FaTrophy,
    FaQuestionCircle
} from 'react-icons/fa';
import styles from './LessonView.module.css';

const LessonView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [activeTopic, setActiveTopic] = useState(0);
    const [boardPosition, setBoardPosition] = useState('start');
    const [showExercise, setShowExercise] = useState(false);

    const chapterData = {
        title: 'Introduction to Chess',
        topics: [
            { id: 0, title: 'What is Chess?', type: 'lesson', completed: true },
            { id: 1, title: 'Chess Board Overview', type: 'lesson', completed: true },
            { id: 2, title: 'White vs Black', type: 'lesson', completed: false },
            { id: 3, title: 'How Turns Work', type: 'lesson', completed: false },
            { id: 4, title: 'Goal of the Game', type: 'lesson', completed: false },
            { id: 5, title: 'Exercise: Identify Squares', type: 'exercise', completed: false },
            { id: 6, title: 'Exercise: Board Setup', type: 'exercise', completed: false },
        ]
    };

    const nextTopic = () => {
        if (activeTopic < chapterData.topics.length - 1) {
            // Celebrate completion of previous topic
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#00f2fe', '#4facfe', '#764ba2']
            });

            setActiveTopic(prev => prev + 1);
            if (chapterData.topics[activeTopic + 1].type === 'exercise') {
                setShowExercise(true);
            } else {
                setShowExercise(false);
            }
        }
    };

    return (
        <div className={styles.container}>
            {/* --- LEFT SIDEBAR: Topic List --- */}
            <aside className={styles.leftSidebar}>
                <div className={styles.sidebarHeader}>
                    <button className={styles.backBtn} onClick={() => navigate('/academy')}>
                        <FaChevronLeft /> Back
                    </button>
                    <h3>{chapterData.title}</h3>
                </div>

                <div className={styles.topicList}>
                    {chapterData.topics.map((topic, index) => (
                        <div 
                            key={topic.id}
                            className={`${styles.topicItem} ${activeTopic === index ? styles.activeTopic : ''} ${topic.completed ? styles.completed : ''}`}
                            onClick={() => {
                                setActiveTopic(index);
                                setShowExercise(topic.type === 'exercise');
                            }}
                        >
                            <div className={styles.topicIcon}>
                                {topic.completed ? <FaCheck /> : topic.type === 'exercise' ? <FaQuestionCircle /> : <FaPlay />}
                            </div>
                            <div className={styles.topicInfo}>
                                <span className={styles.topicLabel}>{topic.type}</span>
                                <span className={styles.topicTitle}>{topic.title}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.sidebarFooter}>
                    <div className={styles.chapterProgress}>
                        <div className={styles.progressText}>
                            <span>Chapter Progress</span>
                            <span>45%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: '45%' }}></div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* --- CENTER AREA: Interactive Board & Content --- */}
            <main className={styles.mainContent}>
                <header className={styles.contentHeader}>
                    <div className={styles.breadcrumbs}>
                        <span>Academy</span> / <span>Introduction to Chess</span> / <span className={styles.activeBreadcrumb}>{chapterData.topics[activeTopic].title}</span>
                    </div>
                    <div className={styles.headerActions}>
                        <div className={styles.lessonTimer}>
                            <FaSync className={styles.spinning} /> Est. 5 mins remaining
                        </div>
                        <button 
                            className={`${styles.progressToggleBtn} ${isRightSidebarOpen ? styles.active : ''}`}
                            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                        >
                            <FaTrophy /> <span>My Progress</span>
                        </button>
                    </div>
                </header>

                <div className={styles.interactiveSection}>
                    <div className={styles.boardWrapper}>
                        <div className={styles.premiumBoard}>
                            <Chessboard 
                                position={boardPosition} 
                                boardOrientation="white"
                                customDarkSquareStyle={{ backgroundColor: '#8b6242' }}
                                customLightSquareStyle={{ backgroundColor: '#d4a373' }}
                                animationDuration={300}
                            />
                        </div>
                        <div className={styles.boardControls}>
                            <button title="Flip Board"><FaRetweet /></button>
                            <button title="Reset" onClick={() => setBoardPosition('start')}><FaSync /></button>
                            <button title="Previous"><FaChevronLeft /></button>
                            <button title="Next"><FaChevronRight /></button>
                            <button className={styles.playBtn} title="Play Animation"><FaPlay /></button>
                        </div>
                        
                        <div className={styles.annotationTools}>
                            <div className={styles.tool} title="Draw Arrow">↗️</div>
                            <div className={styles.tool} title="Highlight Square">🟦</div>
                            <div className={styles.tool} title="Clear All">🧹</div>
                        </div>
                    </div>

                    <div className={styles.explanationArea}>
                        <AnimatePresence mode="wait">
                            {!showExercise ? (
                                <motion.div 
                                    key="lesson"
                                    className={styles.lessonContent}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <h2>{chapterData.topics[activeTopic].title}</h2>
                                    <div className={styles.richText}>
                                        <p>
                                            Chess is a game of strategy and logic played on an 8x8 grid. 
                                            The board consists of 64 squares, alternating between light and dark colors.
                                        </p>
                                        <div className={styles.tipBox}>
                                            <FaLightbulb className={styles.tipIcon} />
                                            <div>
                                                <strong>Pro Tip:</strong> Always make sure the bottom-right square is a 
                                                <span className={styles.highlight}> light-colored </span> square. 
                                                Remember: "White on the right!"
                                            </div>
                                        </div>
                                        <p>
                                            Each player begins with 16 pieces: one king, one queen, two rooks, 
                                            two knights, two bishops, and eight pawns.
                                        </p>
                                        <ul className={styles.keyPoints}>
                                            <li>The board has 8 horizontal lines called <strong>ranks</strong> (1-8).</li>
                                            <li>The board has 8 vertical lines called <strong>files</strong> (a-h).</li>
                                            <li>Diagonal lines are simply called <strong>diagonals</strong>.</li>
                                        </ul>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="exercise"
                                    className={styles.exerciseContent}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                >
                                    <div className={styles.exerciseBadge}>EXERCISE</div>
                                    <h2>Find the Square: e4</h2>
                                    <p>Click on the square <strong>e4</strong> on the chessboard above.</p>
                                    
                                    <div className={styles.quizOptions}>
                                        <button className={styles.quizOption}>It's a Dark Square</button>
                                        <button className={styles.quizOption}>It's a Light Square</button>
                                    </div>

                                    <div className={styles.exerciseFooter}>
                                        <div className={styles.xpReward}>+50 XP Reward</div>
                                        <button className={styles.hintBtn}>Need a Hint?</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* --- RIGHT SIDEBAR: Progress & Goals (Modal/Drawer Type) --- */}
            <AnimatePresence>
                {isRightSidebarOpen && (
                    <>
                        <motion.div 
                            className={styles.sidebarOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsRightSidebarOpen(false)}
                        />
                        <motion.aside 
                            className={styles.rightSidebar}
                            initial={{ x: 400 }}
                            animate={{ x: 0 }}
                            exit={{ x: 400 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            <div className={styles.sidebarCloseBtn} onClick={() => setIsRightSidebarOpen(false)}>
                                <FaChevronRight />
                            </div>

                            <div className={styles.sidebarScrollContent}>
                                <div className={styles.progressCircleWrapper}>
                                    <div className={styles.progressCircle}>
                                        <svg viewBox="0 0 36 36">
                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#b58863" strokeWidth="2" strokeDasharray="45, 100" />
                                        </svg>
                                        <div className={styles.progressValue}>
                                            <span>45%</span>
                                        </div>
                                    </div>
                                    <p>Lesson Progress</p>
                                </div>

                                <div className={styles.sidebarSection}>
                                    <h4>Today's Goal</h4>
                                    <div className={styles.goalCard}>
                                        <div className={styles.goalInfo}>
                                            <span>Complete 3 Lessons</span>
                                            <span>2/3</span>
                                        </div>
                                        <div className={styles.goalBar}>
                                            <div className={styles.goalFill} style={{ width: '66%' }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.sidebarSection}>
                                    <h4>Key Concepts</h4>
                                    <div className={styles.conceptTags}>
                                        <span className={styles.tag}>Coordinates</span>
                                        <span className={styles.tag}>Ranks & Files</span>
                                        <span className={styles.tag}>Board Orientation</span>
                                    </div>
                                </div>

                                <div className={styles.sidebarSection}>
                                    <h4>Quick Notes</h4>
                                    <textarea className={styles.notesArea} placeholder="Type your notes here..."></textarea>
                                </div>

                                <div className={styles.sidebarActions}>
                                    <button className={styles.bookmarkBtn}><FaBookmark /> Save Lesson</button>
                                    <button className={styles.nextBtn} onClick={nextTopic}>
                                        Next Topic <FaArrowRight />
                                    </button>
                                </div>

                                <div className={styles.achievementCard}>
                                    <FaTrophy className={styles.trophyIcon} />
                                    <div className={styles.achievementInfo}>
                                        <span>New Milestone!</span>
                                        <strong>Board Visionary</strong>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LessonView;
