import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChessKnight, FaTrophy, FaGraduationCap } from 'react-icons/fa';
import styles from './Home.module.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <section className={`${styles.hero} animate-fade-in`}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Master Chess <br />
            <span className="text-gradient">One Puzzle at a Time</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Improve your strategic thinking with our curated collection of diverse chess puzzles. Join a community of masters in the making.
          </p>
          <div className={styles.ctaButtons}>
            <button
              className={styles.btnPrimary}
              onClick={() => navigate('/puzzle')}
            >
              Start Solving
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => navigate('/dashboard')}
            >
              View Dashboard
            </button>
          </div>
        </div>
      </section>

      <section className={styles.featuresGrid}>
        <div className={styles.featureCard}>
          <div className={styles.iconWrapper}>
            <FaChessKnight />
          </div>
          <h3 className={styles.featureTitle}>Tactical Training</h3>
          <p className={styles.featureDesc}>
            Solve puzzles ranging from simple mates to complex tactical motifs. Sharpen your vision and calculation skills.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.iconWrapper}>
            <FaTrophy />
          </div>
          <h3 className={styles.featureTitle}>Competitions</h3>
          <p className={styles.featureDesc}>
            Compete with other players in timed puzzle runs. climb the leaderboard and prove your tactical supremacy.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.iconWrapper}>
            <FaGraduationCap />
          </div>
          <h3 className={styles.featureTitle}>Track Progress</h3>
          <p className={styles.featureDesc}>
            Analyze your performance with detailed statistics. Identification of your strengths and weaknesses to improve faster.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;