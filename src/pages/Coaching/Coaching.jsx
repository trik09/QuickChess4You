import styles from './Coaching.module.css';
import { FaVideo, FaCalendar, FaChartLine, FaUsers } from 'react-icons/fa';

function Coaching() {
  const coaches = [
    {
      name: 'Utkal Santra',
      title: 'Chess Coach & Player',
      rating: 'Strong', // or just omit if no specific number
      specialty: 'Kids & Improving Players',
      experience: 'Experienced',
      students: 'Active',
      image: '👨‍🏫',
      bio: 'Utkal Santra is a well-known Indian chess coach and player, mainly active in Odisha. He is respected for training young players and organizing chess tournaments at the grassroots level.',
      highlights: [
        'Strong competitive chess player',
        'Dedicated chess coach',
        'Focuses on kids & improving players',
        'Known for discipline + practical chess thinking'
      ]
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Personal Chess Coaching</h1>
        <p className={styles.subtitle}>
          One-on-one instruction from trusted experts to accelerate your chess journey
        </p>
      </div>

      <section className={styles.benefits}>
        <h2>Why Choose Personal Coaching?</h2>
        <div className={styles.benefitsGrid}>
          <div className={styles.benefit}>
            <FaVideo className={styles.benefitIcon} />
            <h3>Live Sessions</h3>
            <p>Interactive video lessons tailored to your needs</p>
          </div>
          <div className={styles.benefit}>
            <FaCalendar className={styles.benefitIcon} />
            <h3>Flexible Schedule</h3>
            <p>Book sessions at times that work for you</p>
          </div>
          <div className={styles.benefit}>
            <FaChartLine className={styles.benefitIcon} />
            <h3>Personalized Plan</h3>
            <p>Custom training program based on your goals</p>
          </div>
          <div className={styles.benefit}>
            <FaUsers className={styles.benefitIcon} />
            <h3>Game Analysis</h3>
            <p>Detailed review of your games with expert feedback</p>
          </div>
        </div>
      </section>

      <section className={styles.coaches}>
        <h2>Meet Our Coaches</h2>
        <div className={styles.coachesGrid}>
          {coaches.map((coach, index) => (
            <div key={index} className={styles.coachCard} style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div className={styles.coachImage}>{coach.image}</div>
              <h3 className={styles.coachName}>{coach.name}</h3>
              <div className={styles.coachTitle}>{coach.title}</div>
              {/* <div className={styles.coachRating}>Rating: {coach.rating}</div> */}

              <div className={styles.coachBio} style={{ margin: '1rem 0', fontStyle: 'italic' }}>
                "{coach.bio}"
              </div>

              <div className={styles.coachInfo} style={{ textAlign: 'left', paddingLeft: '1rem' }}>
                <ul style={{ listStyleType: 'disc', color: '#ccc' }}>
                  {coach.highlights.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </div>
              <button className={styles.bookBtn}>Book Session</button>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.pricing}>
        <h2>Coaching Packages</h2>
        <div className={styles.pricingGrid}>
          <div className={styles.priceCard}>
            <h3>Single Session</h3>
            <div className={styles.price} style={{ fontSize: '1.5rem' }}>Coming Soon</div>
            <ul>
              <li>1 hour live session</li>
              <li>Game analysis</li>
              <li>Study materials</li>
            </ul>
            <button className={styles.selectBtn}>Select</button>
          </div>
          <div className={`${styles.priceCard} ${styles.popular}`}>
            <div className={styles.badge}>Most Popular</div>
            <h3>Monthly Package</h3>
            <div className={styles.price} style={{ fontSize: '1.5rem' }}>Coming Soon</div>
            <ul>
              <li>4 hours of coaching</li>
              <li>Weekly sessions</li>
              <li>Unlimited game analysis</li>
              <li>Custom training plan</li>
            </ul>
            <button className={styles.selectBtn}>Select</button>
          </div>
          <div className={styles.priceCard}>
            <h3>Intensive Program</h3>
            <div className={styles.price} style={{ fontSize: '1.5rem' }}>Coming Soon</div>
            <ul>
              <li>12 hours of coaching</li>
              <li>Bi-weekly sessions</li>
              <li>Tournament preparation</li>
              <li>Opening repertoire</li>
              <li>Priority support</li>
            </ul>
            <button className={styles.selectBtn}>Select</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Coaching;
