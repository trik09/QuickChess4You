import { useOutletContext } from 'react-router-dom';
import Hero from '../Hero/Hero';
import About from '../About/About';
import Courses from '../Courses/Courses';
import Pricing from '../Pricing/Pricing';
import Coaching from '../Coaching/Coaching';
import Syllabus from '../Syllabus/Syllabus';
import Contact from '../Contact/Contact';
import Footer from '../../components/Footer/Footer';
import styles from './Home.module.css';
import HighlightsStrip from '../HighlightsStrip/HighlightsStrip';
import FaqSection from '../../components/Faq/FaqSection';

const Home = () => {
  const { handleLoginClick, handleSignupClick } = useOutletContext();

  return (
    <div className={styles.mainWrapper}>
      <Hero handleLoginClick={handleLoginClick} />
      <HighlightsStrip />

      <div id="about" className={styles.sectionWrapper}>
        <About />
      </div>

      <div id="courses" className={styles.sectionWrapper}>
        <Courses />
      </div>

      <div id="syllabus" className={styles.sectionWrapper}>
        <Syllabus />
      </div>

      <div id="pricing" className={styles.sectionWrapper}>
        {/* <Pricing /> */}
      </div>

      <div id="coaching" className={styles.sectionWrapper}>
        <Coaching />
      </div>

      <div id="contact" className={styles.sectionWrapper}>
        <Contact />
      </div>

      <div id="faq" className={styles.sectionWrapper}>
        <FaqSection />
      </div>

      <Footer />
    </div>
  );
};

export default Home;