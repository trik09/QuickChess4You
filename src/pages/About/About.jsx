import React from 'react';
import styles from './About.module.css';
import { FaChess, FaTrophy, FaUsers, FaGraduationCap, FaRegLightbulb, FaGlobeAmericas, FaChessKnight } from 'react-icons/fa';

function About() {
  return (
    <section className={styles.aboutWrapper}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Reimagining Chess Education</h2>
          <p className={styles.subtitle}>
            We're building the future of chess learning, combining traditional wisdom with cutting-edge technology.
          </p>
        </div>

        {/* Mission & Stats */}
        <div className={styles.missionSection}>
          <div className={styles.missionContent}>
            <h3>Our Mission</h3>
            <p>
              At Quick Chess 4 You, we believe that chess is more than just a game—it's a tool for developing critical thinking,
              strategic planning, and mental discipline. Our mission is to make high-quality chess education accessible to everyone,
              from beginners taking their first steps to advanced players seeking to master the game.
            </p>
            <p>
              Founded in 2020, we have grown from a small community into a global academy, connecting players from over 50 countries
              with world-class instruction and competitive opportunities.
            </p>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <FaUsers className={styles.statIcon} />
              <span className={styles.statValue}>10k+</span>
              <span className={styles.statLabel}>Students</span>
            </div>
            <div className={styles.statCard}>
              <FaChess className={styles.statIcon} />
              <span className={styles.statValue}>50k+</span>
              <span className={styles.statLabel}>Puzzles</span>
            </div>
            <div className={styles.statCard}>
              <FaTrophy className={styles.statIcon} />
              <span className={styles.statValue}>500+</span>
              <span className={styles.statLabel}>Tournaments</span>
            </div>
            <div className={styles.statCard}>
              <FaGraduationCap className={styles.statIcon} />
              <span className={styles.statValue}>50+</span>
              <span className={styles.statLabel}>Masters</span>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className={styles.valuesSection}>
          <h3 className={styles.title} style={{ fontSize: '2rem' }}>Why Choose Us</h3>

          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIconWrapper}>
                <FaRegLightbulb />
              </div>
              <h3>Smart Learning</h3>
              <p>Adaptive curriculum that evolves with your playing style and skill level.</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIconWrapper}>
                <FaChessKnight />
              </div>
              <h3>Expert Coaching</h3>
              <p>Direct access to titled players and experienced coaches for personalized guidance.</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIconWrapper}>
                <FaTrophy />
              </div>
              <h3>Competitive Play</h3>
              <p>Regular tournaments and leagues to test your skills against players worldwide.</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIconWrapper}>
                <FaGlobeAmericas />
              </div>
              <h3>Global Community</h3>
              <p>Join a vibrant community of chess enthusiasts to learn, share, and grow together.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default About;
