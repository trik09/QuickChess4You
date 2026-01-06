import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChessKing, FaChessKnight } from 'react-icons/fa';
import styles from './Hero.module.css';
import heroimg from "../../assets/hero.png"

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
                        <span className={styles.textGradient}>One Move at a Time</span>
                    </h1>

                    <p className={styles.heroSubtitle}>
                        Elevate your game with daily puzzles. Join 10k+ masters in the making.
                    </p>

                    <div className={styles.ctaGroup}>
                        <button className={styles.btnPrimary} onClick={() => navigate('/puzzle')}>
                            Start Solving <FaChessKnight />
                        </button>
                        <button className={styles.btnSecondary} onClick={() => navigate('/dashboard')}>
                            View Tournaments
                        </button>
                    </div>
                </div>

                {/* RIGHT SIDE: Hero Image */}
                <div className={styles.heroVisual}>
                    <div className={styles.imageContainer}>
                        <img 
                            src={heroimg}
                            alt="Chess Strategy"
                            className={styles.heroImage}
                        />
                        <div className={styles.imageOverlay}>
                            <div className={styles.floatingCard}>
                                <FaChessKing className={styles.cardIcon} />
                                <span>QCFY</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;