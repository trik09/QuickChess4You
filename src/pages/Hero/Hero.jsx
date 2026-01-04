import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChessKing, FaChessKnight, FaChessRook, FaChessBishop, FaArrowRight, FaGraduationCap } from 'react-icons/fa';
import styles from './Hero.module.css';

const Hero = () => {
    const navigate = useNavigate();

    return (
        <section className={styles.heroWrapper} id="home">
            {/* Animated Background Elements */}
            <div className={styles.bgGradient}></div>
            <div className={styles.floatingShape1}></div>
            <div className={styles.floatingShape2}></div>

            <div className={styles.container}>
                <div className={styles.heroContent}>
                    <div className={styles.badge}>
                        <span className={styles.badgeIcon}><FaChessKing /></span>
                        <span>Best Platform for Chess Puzzles</span>
                    </div>

                    <h1 className={styles.heroTitle}>
                        Master Chess <br />
                        <span className={styles.textGradient}>One Puzzle at a Time</span>
                    </h1>

                    <p className={styles.heroSubtitle}>
                        Elevate your game with our curated collection of diverse chess puzzles.
                        Join a community of masters in the making and compete in real-time tournaments.
                    </p>

                    <div className={styles.ctaGroup}>
                        <button
                            className={styles.btnPrimary}
                            onClick={() => navigate('/puzzle')}
                        >
                            Start Solving
                            <span className={styles.btnIcon}><FaChessKnight /></span>
                        </button>
                        <button
                            className={styles.btnSecondary}
                            onClick={() => navigate('/dashboard')}
                        >
                            View Tournaments
                            <span className={styles.btnIcon}><FaArrowRight /></span>
                        </button>
                        <button
                            className={styles.btnLearn}
                            onClick={() => navigate('/learn/capture')}
                        >
                            <FaGraduationCap /> Learn
                        </button>
                    </div>

                    <div className={styles.statsRow}>
                        <div className={styles.statItem}>
                            <strong>10k+</strong>
                            <span>Puzzles</span>
                        </div>
                        <div className={styles.statDivider}></div>
                        <div className={styles.statItem}>
                            <strong>500+</strong>
                            <span>Active Users</span>
                        </div>
                        <div className={styles.statDivider}></div>
                        <div className={styles.statItem}>
                            <strong>Daily</strong>
                            <span>Competitions</span>
                        </div>
                    </div>
                </div>

                <div className={styles.heroVisual}>
                    <div className={styles.glassCard}>
                        <div className={styles.iconGrid}>
                            <FaChessRook className={`${styles.floatIcon} ${styles.icon1}`} />
                            <FaChessBishop className={`${styles.floatIcon} ${styles.icon2}`} />
                            <FaChessKnight className={`${styles.floatIcon} ${styles.icon3}`} />
                        </div>
                        <div className={styles.cardContent}>
                            <h3>Daily Challenge</h3>
                            <p>Solve the Mate in 3</p>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
