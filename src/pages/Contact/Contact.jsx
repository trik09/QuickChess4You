import styles from './Contact.module.css';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

function Contact() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Get In Touch</h1>
        <p className={styles.subtitle}>
          Have questions? We'd love to hear from you. Reach out to us using the details below.
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.contactInfo}>
          <div className={styles.infoCard}>
            <FaEnvelope className={styles.icon} />
            <h3>Email Us</h3>
            <p>quickchess4kids@gmail.com</p>
          </div>

          <div className={styles.infoCard}>
            <FaPhone className={styles.icon} />
            <h3>Call Us</h3>
            <p>+91 99017 39147</p>
            <p>Mon-Sat: 9AM - 8PM IST</p>
          </div>

          <div className={styles.infoCard}>
            <FaMapMarkerAlt className={styles.icon} />
            <h3>Visit Us</h3>
            <p>Bangalore, India</p>
          </div>

          <div className={styles.infoCard}>
            <FaClock className={styles.icon} />
            <h3>Business Hours</h3>
            <p>Monday - Friday: 9AM - 6PM</p>
            <p>Saturday: 10AM - 4PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
