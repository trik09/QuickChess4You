import styles from './Contact.module.css';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

function Contact() {
  return (
    <section className={styles.contactWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Get In Touch</h2>
          <p className={styles.subtitle}>
            Have questions? We'd love to hear from you. Reach out to us through any of the following channels.
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <FaEnvelope />
            </div>
            <div className={styles.infoText}>
              <h3>Email Us</h3>
              <p>quickchess4kids@gmail.com</p>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <FaPhone />
            </div>
            <div className={styles.infoText}>
              <h3>Call Us</h3>
              <p>+91 99017 39147</p>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <FaMapMarkerAlt />
            </div>
            <div className={styles.infoText}>
              <h3>Visit Us</h3>
              <p>Odisha, India</p>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <FaClock />
            </div>
            <div className={styles.infoText}>
              <h3>Working Hours</h3>
              <p>Mon - Fri: 9AM - 6PM</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
