import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import styles from './Dashboard.module.css';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleParticipate = () => {
    navigate('/puzzle');
  };

  return (
    <div className={styles.container}>
      <Navbar />
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Join Puzzle Race</h1>
          <p>Sharpen your mind with exciting chess puzzles</p>
        </div>

        <div className={styles.tournamentGrid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Join Puzzle Race</h3>

            <button 
              className={styles.participateBtn}
              onClick={handleParticipate}
            >
              Start Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
