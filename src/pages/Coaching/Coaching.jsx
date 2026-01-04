import React from 'react';
import styles from './Coaching.module.css';
import { FaVideo, FaCalendar, FaChartLine, FaUsers } from 'react-icons/fa';

function Coaching() {
  const coaches = [
    {
      name: 'Utkal Santra',
      title: 'Chess Coach & Player',
      specialty: 'Kids & Improving Players',
      image: '👨‍🏫',
      bio: 'Training young minds to master the board through discipline and creative strategy.',
      highlights: [
        'Strong competitive player',
        'Specialized in youth coaching',
        'Focus on practical thinking',
        'Grassroots tournament organizer'
      ]
    }
  ];

  return (
    <section className={styles.coachingWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Personalized Mastery</h2>
          <p className={styles.subtitle}>
            Accelerate your growth with one-on-one guidance from experienced chess mentors.
          </p>
        </div>

        <div className={styles.benefitsGrid}>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>
              <FaVideo />
            </div>
            <h3>Live Sessions</h3>
            <p>Interactive video lessons tailored specifically to your playstyle and needs.</p>
          </div>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>
              <FaCalendar />
            </div>
            <h3>Flexible Schedule</h3>
            <p>Book training sessions at times that perfectly fit your lifestyle.</p>
          </div>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>
              <FaChartLine />
            </div>
            <h3>Custom Roadmap</h3>
            <p>A personalized training plan designed to target your specific weaknesses.</p>
          </div>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>
              <FaUsers />
            </div>
            <h3>Game Analysis</h3>
            <p>Detailed breakdown of your games to find missed opportunities and improvements.</p>
          </div>
        </div>

        <div className={styles.coachesSection}>
          <h3 className={styles.title} style={{ fontSize: '2rem' }}>Meet Your Mentor</h3>

          <div className={styles.coachesGrid}>
            {coaches.map((coach, index) => (
              <div key={index} className={styles.coachCard}>
                <div className={styles.coachImageWrapper}>
                  <div className={styles.coachImage}>{coach.image}</div>
                </div>

                <div className={styles.coachContent}>
                  <h3 className={styles.coachName}>{coach.name}</h3>
                  <div className={styles.coachTitle}>{coach.title}</div>

                  <div className={styles.coachBio}>
                    {coach.bio}
                  </div>

                  <ul className={styles.highlightsList}>
                    {coach.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>

                  <button className={styles.bookBtn}>Book a Trial Session</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Coaching;
