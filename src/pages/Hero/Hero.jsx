import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChessKing, FaChessKnight } from 'react-icons/fa';
import { BsArrowRight } from "react-icons/bs";
import styles from './Hero.module.css';
import chess1 from "../../assets/Chess-1.png";
import chess2 from "../../assets/Chess-2.png";

const Hero = () => {
    const navigate = useNavigate();

    return (
        <section className={styles.heroWrapper} id="home">
            <div className={styles.container}>
                {/* LEFT SIDE: Content */}
                <div className={styles.heroContent}>
                    <div className={styles.badge}>
                        <span className={styles.badgeIcon}><FaChessKing /></span>
                        <span>#1 Platform for Chess Puzzles</span>
                    </div>

                    <h1 className={styles.heroTitle}>
                        Master Strategy <br />
                        One Move at a Time
                    </h1>

                    <p className={styles.heroSubtitle}>
                        Elevate your game with daily puzzles. <br className={styles.desktopBr} />
                        Join 10k+ masters in the making.
                    </p>

                    <div className={styles.ctaGroup}>
                        <button className={styles.btnPrimary} onClick={() => navigate('/puzzle')}>
                            Start Solving <BsArrowRight className={styles.btnIcon} />
                        </button>
                        <button className={styles.btnSecondary} onClick={() => navigate('/dashboard')}>
                            View Puzzle Arena
                        </button>
                    </div>
                </div>

                {/* RIGHT SIDE: Grid */}
                <div className={styles.heroVisual}>
                    <div className={styles.gridContainer}>
                        {/* 1. Stats Card (Top Left) */}
                        <div className={`${styles.gridItem} ${styles.cardStats} ${styles.cardTopLeft}`}>
                            <h3>10K+</h3>
                            <p>STUDENTS</p>
                        </div>

                        {/* 2. Image (Top Right) */}
                        <div className={`${styles.gridItem} ${styles.imageItem}`}>
                            <img src={chess1} alt="Chess Strategy" />
                        </div>

                        {/* 3. Image (Bottom Left) */}
                        <div className={`${styles.gridItem} ${styles.imageItem}`}>
                            <img src={chess2} alt="Chess Board" />
                        </div>

                        {/* 4. Stats Card (Bottom Right) */}
                        <div className={`${styles.gridItem} ${styles.cardStats} ${styles.cardBottomRight}`}>
                            <h3>50k+</h3>
                            <p>TOURNAMENTS</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;