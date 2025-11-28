import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import LoginModal from '../../components/LoginModal/LoginModal';
import ChessBoard from '../../components/ChessBoard/ChessBoard';
import { FaTrophy, FaUsers, FaChartLine, FaGraduationCap, FaCheck, FaRobot, FaMobile, FaPlay, FaAward, FaStar, FaGift, FaEnvelope, FaPhone, FaMapMarkerAlt, FaWhatsapp, FaClock, FaRocket } from 'react-icons/fa';
import { GiChessKing, GiTargetPrize } from 'react-icons/gi';
import styles from './Home.module.css';

function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes demo timer
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [navigate, isAuthenticated, loading]);

  // Demo timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) return 180; // Reset to 3 minutes
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Demo puzzle
  const demoPuzzle = {
    fen: '2q3k1/8/8/5N2/6P1/7K/8/8 w - - 0 1',
    solution: ['Ne7+', 'Kf7', 'Nxc8'],
    type: 'Fork Tactic'
  };

  const features = [
    {
      icon: <GiTargetPrize size={48} />,
      title: 'Daily Puzzles',
      description: 'Sharpen your tactical skills with thousands of chess puzzles'
    },
    {
      icon: <FaTrophy size={48} />,
      title: 'Tournaments',
      description: 'Compete in exciting tournaments and win amazing prizes'
    },
    {
      icon: <FaChartLine size={48} />,
      title: 'Track Progress',
      description: 'Monitor your improvement with detailed analytics'
    },
    {
      icon: <FaUsers size={48} />,
      title: 'Global Community',
      description: 'Connect with chess players from around the world'
    }
  ];

  const whyChooseUs = [
    {
      title: 'Professional Training',
      description: 'Learn from grandmasters and improve your game',
      icon: <FaGraduationCap size={48} />
    },
    {
      title: 'Fair Play Guaranteed',
      description: 'Advanced anti-cheat system ensures fair competition',
      icon: <FaCheck size={48} />
    },
    {
      title: 'Real-time Analysis',
      description: 'Get instant feedback on your moves with AI analysis',
      icon: <FaRobot size={48} />
    },
    {
      title: 'Mobile Friendly',
      description: 'Play anywhere, anytime on any device',
      icon: <FaMobile size={48} />
    }
  ];

  const testimonials = [
    {
      name: 'Rahul Sharma',
      school: 'Delhi Public School',
      text: 'I improved my rating by 300 points in just 2 months! The puzzles are amazing.',
      rating: 5,
      image: <GiChessKing size={32} />
    },
    {
      name: 'Priya Patel',
      school: 'Kendriya Vidyalaya',
      text: 'Won my first tournament here! The platform is so easy to use.',
      rating: 5,
      image: <GiChessKing size={32} />
    },
    {
      name: 'Arjun Kumar',
      school: 'DAV Public School',
      text: 'Best chess platform for students. Love the live tournaments!',
      rating: 5,
      image: <GiChessKing size={32} />
    }
  ];

  return (
    <div className={styles.container}>
      <Navbar onLoginClick={() => setShowLoginModal(true)} />
      
      {/* Hero Section with Live Demo */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <div className={styles.badge}>
              <span className={styles.badgeDot}></span>
              Coming Soon - Beta Access Available
            </div>
            <h1 className={styles.heroTitle}>
              Master Chess Through
              <span className={styles.highlight}> Live Tournaments</span>
            </h1>
            <p className={styles.heroSubtitle}>
              India's first interactive chess tournament platform for students. 
              Solve puzzles, compete live, and win exciting prizes!
            </p>
            <div className={styles.heroButtons}>
              <button 
                className={styles.primaryBtn}
                onClick={() => setShowLoginModal(true)}
              >
                <GiTargetPrize style={{marginRight: '8px'}} /> Join Beta Now
              </button>
              <button 
                className={styles.secondaryBtn}
                onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
              >
                <FaPlay style={{marginRight: '8px'}} /> Watch Demo
              </button>
            </div>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>50K+</span>
                <span className={styles.statLabel}>Students Waiting</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>₹50L+</span>
                <span className={styles.statLabel}>Prize Pool</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>100+</span>
                <span className={styles.statLabel}>Schools</span>
              </div>
            </div>
          </div>
          
          {/* Live Demo Board */}
          <div className={styles.demoBoard}>
            <div className={styles.demoHeader}>
              <div className={styles.demoTitle}>
                <span className={styles.liveDot}></span>
                Try Live Demo - {demoPuzzle.type}
              </div>
              <div className={styles.demoTimer}>
                <FaClock style={{marginRight: '8px'}} /> {formatTime(timeLeft)}
              </div>
            </div>
            <div className={styles.boardWrapper}>
              <ChessBoard
                fen={demoPuzzle.fen}
                solution={demoPuzzle.solution}
                onPuzzleSolved={() => {}}
                onWrongMove={() => {}}
              />
            </div>
            <div className={styles.demoFooter}>
              <p>👆 Click and drag pieces to solve the puzzle!</p>
              <button 
                className={styles.demoBtn}
                onClick={() => setShowLoginModal(true)}
              >
                Unlock 1000+ Puzzles
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Video Section */}
      <section className={styles.demoVideo} id="demo">
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>See How It Works</h2>
          <p className={styles.sectionSubtitle}>
            Watch students compete in real-time tournaments
          </p>
          <div className={styles.videoContainer}>
            <div className={styles.videoPlaceholder}>
              <div className={styles.playButton}><FaPlay size={24} /></div>
              <p>Platform Demo Video</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features} id="features">
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>Why Students Love Our Platform</h2>
          <p className={styles.sectionSubtitle}>
            Everything you need to excel in competitive chess
          </p>
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tournaments Banner */}
      <section className={styles.tournamentBanner} id="tournaments">
        <div className={styles.bannerContent}>
          <div className={styles.comingSoonBadge}><FaRocket style={{marginRight: '8px'}} /> Launching December 2025</div>
          <h2 className={styles.bannerTitle}><FaTrophy style={{marginRight: '12px'}} /> National Student Chess Championship</h2>
          <p className={styles.bannerText}>
            Be among the first 1000 students to register and get FREE lifetime access! 
            Compete with students across India, win cash prizes up to ₹1 Lakh, and get 
            certificates recognized by schools.
          </p>
          <div className={styles.bannerFeatures}>
            <div className={styles.bannerFeature}>
              <span className={styles.bannerIcon}><FaTrophy /></span>
              <span>₹1L Prize Pool</span>
            </div>
            <div className={styles.bannerFeature}>
              <span className={styles.bannerIcon}><FaAward /></span>
              <span>School Certificates</span>
            </div>
            <div className={styles.bannerFeature}>
              <span className={styles.bannerIcon}><FaStar /></span>
              <span>National Ranking</span>
            </div>
            <div className={styles.bannerFeature}>
              <span className={styles.bannerIcon}><FaGift /></span>
              <span>Free Coaching</span>
            </div>
          </div>
          <div className={styles.countdown}>
            <div className={styles.countdownItem}>
              <span className={styles.countdownNumber}>847</span>
              <span className={styles.countdownLabel}>Spots Left</span>
            </div>
          </div>
          <button 
            className={styles.bannerBtn}
            onClick={() => setShowLoginModal(true)}
          >
            <GiTargetPrize style={{marginRight: '8px'}} /> Reserve Your Spot Now
          </button>
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonials}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>What Students Say</h2>
          <p className={styles.sectionSubtitle}>
            Join thousands of happy students already improving their chess
          </p>
          <div className={styles.testimonialsGrid}>
            {testimonials.map((testimonial, index) => (
              <div key={index} className={styles.testimonialCard}>
                <div className={styles.testimonialHeader}>
                  <div className={styles.testimonialAvatar}>{testimonial.image}</div>
                  <div>
                    <h4 className={styles.testimonialName}>{testimonial.name}</h4>
                    <p className={styles.testimonialSchool}>{testimonial.school}</p>
                  </div>
                </div>
                <div className={styles.testimonialRating}>
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
                <p className={styles.testimonialText}>"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className={styles.whyChooseUs} id="why-choose-us">
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>Why Choose Us</h2>
          <p className={styles.sectionSubtitle}>
            The best platform for competitive chess learning
          </p>
          <div className={styles.whyGrid}>
            {whyChooseUs.map((item, index) => (
              <div key={index} className={styles.whyCard}>
                <div className={styles.whyIcon}>{item.icon}</div>
                <h3 className={styles.whyTitle}>{item.title}</h3>
                <p className={styles.whyDescription}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className={styles.about} id="about">
        <div className={styles.aboutContent}>
          <div className={styles.aboutText}>
            <h2 className={styles.aboutTitle}>About Quick Chess For You</h2>
            <p className={styles.aboutDescription}>
              We're on a mission to make chess accessible and exciting for students everywhere. 
              Our platform combines competitive tournaments, engaging puzzles, and comprehensive 
              learning tools to help you become the best chess player you can be.
            </p>
            <p className={styles.aboutDescription}>
              Founded by chess enthusiasts and educators, we understand what it takes to improve 
              at chess. Whether you're a beginner or an advanced player, our platform adapts to 
              your skill level and helps you grow.
            </p>
            <div className={styles.aboutStats}>
              <div className={styles.aboutStat}>
                <h3>5+</h3>
                <p>Years Experience</p>
              </div>
              <div className={styles.aboutStat}>
                <h3>100+</h3>
                <p>Partner Schools</p>
              </div>
              <div className={styles.aboutStat}>
                <h3>24/7</h3>
                <p>Support Available</p>
              </div>
            </div>
          </div>
          <div className={styles.aboutImage}>
            <div className={styles.imageCard}></div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className={styles.contact} id="contact">
        <div className={styles.contactContent}>
          <h2 className={styles.sectionTitle}>Get In Touch</h2>
          <p className={styles.sectionSubtitle}>
            Have questions? We'd love to hear from you
          </p>
          <div className={styles.contactGrid}>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}><FaEnvelope size={24} /></div>
                <div>
                  <h4>Email</h4>
                  <p>quickchess4kids@gmail.com</p>
                </div>
              </div>
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}><FaPhone size={24} /></div>
                <div>
                  <h4>Phone</h4>
                  <p>+91 99017 39147</p>
                </div>
              </div>
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}><FaMapMarkerAlt size={24} /></div>
                <div>
                  <h4>Address</h4>
                  <p>Banglauru, India</p>
                </div>
              </div>
            </div>
            <form className={styles.contactForm}>
              <input type="text" placeholder="Your Name" className={styles.input} />
              <input type="email" placeholder="Your Email" className={styles.input} />
              <textarea placeholder="Your Message" className={styles.textarea} rows="5"></textarea>
              <button type="submit" className={styles.submitBtn}>Send Message</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3>Quick Chess For You</h3>
            <p>Empowering students through competitive chess</p>
          </div>
          <div className={styles.footerSection}>
            <h4>Quick Links</h4>
            <a href="#about">About</a>
            <a href="#tournaments">Tournaments</a>
            <a href="#contact">Contact</a>
          </div>
          <div className={styles.footerSection}>
            <h4>Follow Us</h4>
            <div className={styles.socialLinks}>
              <a href="#">Facebook</a>
              <a href="#">Twitter</a>
              <a href="#">Instagram</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2025 Quick Chess For You. All rights reserved.</p>
        </div>
      </footer>

      {/* WhatsApp Button */}
      <a 
        href="https://wa.me/916362957513?text=Hi! I'm interested in Quick Chess For You platform" 
        className={styles.whatsappBtn}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaWhatsapp size={24} />
      </a>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}

export default Home;