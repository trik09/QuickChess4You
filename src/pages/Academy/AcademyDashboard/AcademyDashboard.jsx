import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    FaRocket, 
    FaBookOpen, 
    FaLightbulb, 
    FaChessKnight, 
    FaChessKing,
    FaLock,
    FaCheckCircle,
    FaClock,
    FaLayerGroup
} from 'react-icons/fa';
import styles from './AcademyDashboard.module.css';

const AcademyDashboard = () => {
    const navigate = useNavigate();

    const stats = [
        { label: 'Lessons Completed', value: '12/45', icon: <FaCheckCircle /> },
        { label: 'Current Streak', value: '5 Days', icon: <FaRocket /> },
        { label: 'Total XP', value: '1,250', icon: <FaLightbulb /> },
        { label: 'Rank', value: 'Beginner II', icon: <FaChessKnight /> },
    ];

    const chapters = [
        {
            id: 1,
            number: '01',
            title: 'Introduction to Chess',
            description: 'Learn the history, board setup, and the basic objective of the game.',
            difficulty: 'Beginner',
            time: '20 mins',
            progress: 100,
            isLocked: false,
            color: 'var(--accent-cyan, #00f2fe)',
        },
        {
            id: 2,
            number: '02',
            title: 'Understanding Chess Pieces',
            description: 'Master how each piece moves, their relative value, and special rules.',
            difficulty: 'Beginner',
            time: '45 mins',
            progress: 45,
            isLocked: false,
            color: 'var(--accent-purple, #a18cd1)',
        },
        {
            id: 3,
            number: '03',
            title: 'Basic Opening Principles',
            description: 'Control the center, develop your pieces, and ensure king safety.',
            difficulty: 'Intermediate',
            time: '60 mins',
            progress: 0,
            isLocked: true,
            color: 'var(--accent-blue, #4facfe)',
        },
        {
            id: 4,
            number: '04',
            title: 'Tactics and Combinations',
            description: 'Discover forks, pins, skewers, and how to spot winning sequences.',
            difficulty: 'Intermediate',
            time: '90 mins',
            progress: 0,
            isLocked: true,
            color: 'var(--accent-pink, #ff0844)',
        },
        {
            id: 5,
            number: '05',
            title: 'Checkmate Patterns',
            description: 'Learn the essential patterns to finish the game with a win.',
            difficulty: 'Advanced',
            time: '120 mins',
            progress: 0,
            isLocked: true,
            color: 'var(--accent-gold, #f6d365)',
        }
    ];

    const handleStartChapter = (id) => {
        if (id === 1 || id === 2) {
            navigate(`/academy/lesson/${id}`);
        }
    };

    return (
        <div className={styles.container}>
            {/* Background Decorations */}
            <div className={styles.galaxyBg}></div>
            <div className={styles.particles}></div>

            {/* Hero Section */}
            <motion.header 
                className={styles.hero}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className={styles.heroContent}>
                    <motion.div 
                        className={styles.badge}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                    >
                        CHESS ACADEMY
                    </motion.div>
                    <h1 className={styles.title}>Become a <span className={styles.glowText}>Chess Master</span></h1>
                    <p className={styles.subtitle}>
                        Embark on a structured journey from basic moves to grandmaster strategies. 
                        A gamified learning experience designed for rapid improvement.
                    </p>
                    
                    <div className={styles.progressContainer}>
                        <div className={styles.progressHeader}>
                            <span>Overall Progress</span>
                            <span>28%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <motion.div 
                                className={styles.progressFill}
                                initial={{ width: 0 }}
                                animate={{ width: '28%' }}
                                transition={{ duration: 1, delay: 0.5 }}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.heroIllustration}>
                    <div className={styles.glowCircle}></div>
                    <motion.div 
                        className={styles.floatingPiece}
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <FaChessKing className={styles.kingIcon} />
                    </motion.div>
                </div>
            </motion.header>

            {/* Stats Grid */}
            <section className={styles.statsGrid}>
                {stats.map((stat, index) => (
                    <motion.div 
                        key={index}
                        className={styles.statCard}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ y: -5, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    >
                        <div className={styles.statIcon}>{stat.icon}</div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{stat.value}</div>
                            <div className={styles.statLabel}>{stat.label}</div>
                        </div>
                    </motion.div>
                ))}
            </section>

            {/* Learning Path */}
            <section className={styles.learningPath}>
                <div className={styles.sectionHeader}>
                    <h2>Learning Path</h2>
                    <p>Complete chapters to unlock advanced concepts</p>
                </div>

                <div className={styles.chaptersGrid}>
                    {chapters.map((chapter, index) => (
                        <motion.div 
                            key={chapter.id}
                            className={`${styles.chapterCard} ${chapter.isLocked ? styles.locked : ''}`}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={!chapter.isLocked ? { y: -10 } : {}}
                        >
                            <div className={styles.cardGlow} style={{ backgroundColor: chapter.color }}></div>
                            
                            <div className={styles.chapterHeader}>
                                <span className={styles.chapterNumber}>{chapter.number}</span>
                                {chapter.progress > 0 && (
                                    <div className={styles.miniProgress}>
                                        <svg viewBox="0 0 36 36">
                                            <path 
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="rgba(255,255,255,0.1)"
                                                strokeWidth="3"
                                            />
                                            <motion.path 
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke={chapter.color}
                                                strokeWidth="3"
                                                strokeDasharray={`${chapter.progress}, 100`}
                                                initial={{ strokeDasharray: "0, 100" }}
                                                animate={{ strokeDasharray: `${chapter.progress}, 100` }}
                                                transition={{ duration: 1.5, delay: 0.5 }}
                                            />
                                        </svg>
                                        <span>{chapter.progress}%</span>
                                    </div>
                                )}
                            </div>

                            <h3 className={styles.chapterTitle}>{chapter.title}</h3>
                            <p className={styles.chapterDesc}>{chapter.description}</p>

                            <div className={styles.chapterMeta}>
                                <span className={styles.metaItem}><FaLayerGroup /> {chapter.difficulty}</span>
                                <span className={styles.metaItem}><FaClock /> {chapter.time}</span>
                            </div>

                            <div className={styles.cardActions}>
                                {chapter.isLocked ? (
                                    <div className={styles.lockedBadge}>
                                        <FaLock /> Locked
                                    </div>
                                ) : (
                                    <button 
                                        className={styles.startBtn}
                                        onClick={() => handleStartChapter(chapter.id)}
                                        style={{ '--btn-color': chapter.color }}
                                    >
                                        {chapter.progress === 100 ? 'Review' : chapter.progress > 0 ? 'Continue' : 'Start Learning'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Resume Section */}
            <motion.div 
                className={styles.resumeCard}
                whileHover={{ scale: 1.01 }}
            >
                <div className={styles.resumeContent}>
                    <h4>Continue where you left off</h4>
                    <h3>Chapter 02: Piece Values & Movements</h3>
                    <p>Next Topic: The Power of the Rook</p>
                </div>
                <button className={styles.resumeBtn} onClick={() => handleStartChapter(2)}>
                    Resume Now
                </button>
            </motion.div>
        </div>
    );
};

export default AcademyDashboard;
