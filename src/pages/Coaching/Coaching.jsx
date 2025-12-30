import styles from './Coaching.module.css';
import { FaVideo, FaCalendar, FaChartLine, FaUsers, FaWhatsapp } from 'react-icons/fa';

function Coaching() {

  const coach = {
    name: 'Utkal Santra',
    title: 'Professional Chess Coach',
    rating: 1750,
    specialty: 'Complete Game Improvement',
    experience: '8+ years',
    students: 150,
    image: '👨‍🏫'
  };

  const handleWhatsApp = () => {
    const phone = '919901739147';
    const message = encodeURIComponent(
      'Hi Coach Utkal, I am interested in personal chess coaching. Please share details.'
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className={styles.container}>
      {/* Hero */}
      <div className={styles.hero}>
        <h1 className={styles.title}>Personal Chess Coaching</h1>
        <p className={styles.subtitle}>
          One-on-one coaching to improve your chess faster with expert guidance
        </p>
      </div>

      {/* Benefits */}
      <section className={styles.benefits}>
        <h2>Why Choose Personal Coaching?</h2>
        <div className={styles.benefitsGrid}>
          <div className={styles.benefit}>
            <FaVideo className={styles.benefitIcon} />
            <h3>Live Sessions</h3>
            <p>Interactive online coaching sessions</p>
          </div>
          <div className={styles.benefit}>
            <FaCalendar className={styles.benefitIcon} />
            <h3>Flexible Schedule</h3>
            <p>Sessions scheduled as per your availability</p>
          </div>
          <div className={styles.benefit}>
            <FaChartLine className={styles.benefitIcon} />
            <h3>Personal Growth</h3>
            <p>Structured improvement plan for your rating</p>
          </div>
          <div className={styles.benefit}>
            <FaUsers className={styles.benefitIcon} />
            <h3>Game Analysis</h3>
            <p>In-depth analysis of your games</p>
          </div>
        </div>
      </section>

      {/* Coach */}
      <section className={styles.coaches}>
        <h2>Meet Your Coach</h2>
        <div className={styles.coachesGrid}>
          <div className={styles.coachCard}>
            <div className={styles.coachImage}>{coach.image}</div>
            <h3 className={styles.coachName}>{coach.name}</h3>
            <div className={styles.coachTitle}>{coach.title}</div>
            <div className={styles.coachRating}>Rating: {coach.rating}</div>

            <div className={styles.coachInfo}>
              <p><strong>Specialty:</strong> {coach.specialty}</p>
              <p><strong>Experience:</strong> {coach.experience}</p>
              <p><strong>Students Trained:</strong> {coach.students}+</p>
            </div>

            <button className={styles.bookBtn} onClick={handleWhatsApp}>
              <FaWhatsapp /> Book Session on WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.pricing}>
        <h2>Coaching Packages</h2>

        <div className={styles.comingSoon}>
          <h3>🚧 Coming Soon</h3>
          <p>
            Coaching packages are currently being finalized.<br />
            Please contact us on WhatsApp to get early access.
          </p>
          <button className={styles.whatsappBtn} onClick={handleWhatsApp}>
            <FaWhatsapp /> Contact on WhatsApp
          </button>
        </div>
      </section>
    </div>
  );
}

export default Coaching;
