import styles from './Coaching.module.css';
import { FaVideo, FaCalendar, FaChartLine, FaUsers } from 'react-icons/fa';

function Coaching() {
  const coaches = [
    {
      name: 'GM Alexander Petrov',
      title: 'Grandmaster',
      rating: 2650,
      specialty: 'Opening Theory & Strategy',
      experience: '15 years',
      students: 200,
      image: '👨‍🏫'
    },
    {
      name: 'IM Sarah Chen',
      title: 'International Master',
      rating: 2480,
      specialty: 'Tactics & Calculation',
      experience: '10 years',
      students: 150,
      image: '👩‍🏫'
    },
    {
      name: 'FM David Kumar',
      title: 'FIDE Master',
      rating: 2380,
      specialty: 'Endgame Mastery',
      experience: '8 years',
      students: 120,
      image: '👨‍💼'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Personal Chess Coaching</h1>
        <p className={styles.subtitle}>
          One-on-one instruction from titled players to accelerate your chess journey
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
            <div key={index} className={styles.coachCard}>
              <div className={styles.coachImage}>{coach.image}</div>
              <h3 className={styles.coachName}>{coach.name}</h3>
              <div className={styles.coachTitle}>{coach.title}</div>
              <div className={styles.coachRating}>Rating: {coach.rating}</div>
              <div className={styles.coachInfo}>
                <p><strong>Specialty:</strong> {coach.specialty}</p>
                <p><strong>Experience:</strong> {coach.experience}</p>
                <p><strong>Students Taught:</strong> {coach.students}+</p>
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
            <div className={styles.price}>$50<span>/hour</span></div>
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
            <div className={styles.price}>$180<span>/month</span></div>
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
            <div className={styles.price}>$500<span>/3 months</span></div>
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
