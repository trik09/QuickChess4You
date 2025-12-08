import styles from './Courses.module.css';
import { FaChessKnight, FaChessRook, FaChessQueen, FaClock, FaStar } from 'react-icons/fa';

function Courses() {
  const courses = [
    {
      id: 1,
      title: 'Beginner Fundamentals',
      level: 'Beginner',
      duration: '8 weeks',
      rating: 4.9,
      students: 2500,
      icon: <FaChessKnight />,
      description: 'Master the basics of chess including piece movement, basic tactics, and opening principles.',
      topics: ['Piece Movement', 'Basic Tactics', 'Opening Principles', 'Endgame Basics']
    },
    {
      id: 2,
      title: 'Intermediate Strategy',
      level: 'Intermediate',
      duration: '12 weeks',
      rating: 4.8,
      students: 1800,
      icon: <FaChessRook />,
      description: 'Develop your strategic understanding with advanced tactics, positional play, and middlegame planning.',
      topics: ['Advanced Tactics', 'Positional Play', 'Pawn Structures', 'Strategic Planning']
    },
    {
      id: 3,
      title: 'Advanced Mastery',
      level: 'Advanced',
      duration: '16 weeks',
      rating: 4.9,
      students: 950,
      icon: <FaChessQueen />,
      description: 'Refine your skills with grandmaster-level concepts, deep calculation, and tournament preparation.',
      topics: ['Deep Calculation', 'Complex Endgames', 'Opening Repertoire', 'Tournament Prep']
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Our Courses</h1>
        <p className={styles.subtitle}>
          Structured learning paths designed to take you from beginner to master
        </p>
      </div>

      <div className={styles.coursesGrid}>
        {courses.map((course) => (
          <div key={course.id} className={styles.courseCard}>
            <div className={styles.courseIcon}>{course.icon}</div>
            <div className={styles.courseLevel}>{course.level}</div>
            
            <h2 className={styles.courseTitle}>{course.title}</h2>
            <p className={styles.courseDescription}>{course.description}</p>

            <div className={styles.courseStats}>
              <div className={styles.stat}>
                <FaClock />
                <span>{course.duration}</span>
              </div>
              <div className={styles.stat}>
                <FaStar />
                <span>{course.rating} ({course.students} students)</span>
              </div>
            </div>

            <div className={styles.topics}>
              <h4>What You'll Learn:</h4>
              <ul>
                {course.topics.map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
            </div>

            <button className={styles.enrollBtn}>Enroll Now</button>
          </div>
        ))}
      </div>

      <section className={styles.features}>
        <h2>Course Features</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📚</div>
            <h3>Comprehensive Curriculum</h3>
            <p>Carefully structured lessons covering all aspects of chess</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🎥</div>
            <h3>Video Lessons</h3>
            <p>High-quality video content with detailed explanations</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>✍️</div>
            <h3>Practice Exercises</h3>
            <p>Hundreds of puzzles and exercises to reinforce learning</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📊</div>
            <h3>Progress Tracking</h3>
            <p>Monitor your improvement with detailed analytics</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Courses;
