import styles from './About.module.css';
import { FaChess, FaTrophy, FaUsers, FaGraduationCap } from 'react-icons/fa';

function About() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>About Quick Chess 4 You</h1>
        <p className={styles.subtitle}>
          Empowering chess players worldwide with innovative training and competitive opportunities
        </p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>Our Mission</h2>
          <p>
            At Quick Chess 4 You, we believe that chess is more than just a game—it's a tool for developing critical thinking, 
            strategic planning, and mental discipline. Our mission is to make high-quality chess education accessible to everyone, 
            from beginners taking their first steps to advanced players seeking to master the game.
          </p>
        </section>

        <section className={styles.statsSection}>
          <div className={styles.statCard}>
            <FaUsers className={styles.statIcon} />
            <div className={styles.statValue}>10,000+</div>
            <div className={styles.statLabel}>Active Students</div>
          </div>
          <div className={styles.statCard}>
            <FaChess className={styles.statIcon} />
            <div className={styles.statValue}>50,000+</div>
            <div className={styles.statLabel}>Puzzles Solved</div>
          </div>
          <div className={styles.statCard}>
            <FaTrophy className={styles.statIcon} />
            <div className={styles.statValue}>500+</div>
            <div className={styles.statLabel}>Tournaments Hosted</div>
          </div>
          <div className={styles.statCard}>
            <FaGraduationCap className={styles.statIcon} />
            <div className={styles.statValue}>50+</div>
            <div className={styles.statLabel}>Expert Coaches</div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Our Story</h2>
          <p>
            Founded in 2020, Quick Chess 4 You started with a simple vision: to create a platform where chess enthusiasts 
            could learn, practice, and compete in a supportive environment. What began as a small online community has grown 
            into a comprehensive chess academy serving students from over 50 countries.
          </p>
          <p>
            Our team of international masters and grandmasters brings decades of combined experience, offering personalized 
            instruction and cutting-edge training methods. We've helped hundreds of students achieve their chess goals, from 
            earning their first rating to competing in national championships.
          </p>
        </section>

        <section className={styles.section}>
          <h2>What Sets Us Apart</h2>
          <div className={styles.features}>
            <div className={styles.feature}>
              <h3>🎯 Personalized Learning</h3>
              <p>Adaptive curriculum tailored to your skill level and learning pace</p>
            </div>
            <div className={styles.feature}>
              <h3>🏆 Competitive Platform</h3>
              <p>Regular tournaments and competitions to test your skills</p>
            </div>
            <div className={styles.feature}>
              <h3>👨‍🏫 Expert Instruction</h3>
              <p>Learn from titled players and experienced coaches</p>
            </div>
            <div className={styles.feature}>
              <h3>🌍 Global Community</h3>
              <p>Connect with chess players from around the world</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;
