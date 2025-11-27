import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import styles from './Dashboard.module.css';

function Dashboard() {
  const navigate = useNavigate();

  const tournaments = [
    {
      id: 1,
      title: 'Spring Championship 2025',
      date: 'March 15-20, 2025',
      participants: 128,
      prize: '$5,000',
      status: 'Open'
    },
    {
      id: 2,
      title: 'Rapid Chess Tournament',
      date: 'April 5, 2025',
      participants: 64,
      prize: '$2,500',
      status: 'Open'
    },
    {
      id: 3,
      title: 'Blitz Masters Cup',
      date: 'April 20, 2025',
      participants: 32,
      prize: '$3,000',
      status: 'Open'
    },
    {
      id: 4,
      title: 'Classical Chess Open',
      date: 'May 10-15, 2025',
      participants: 256,
      prize: '$10,000',
      status: 'Open'
    }
  ];

  const handleParticipate = () => {
    navigate('/puzzle');
  };

  return (
    <div className={styles.container}>
      <Navbar isLoggedIn={true} />
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Upcoming Tournaments</h1>
          <p>Join exciting chess tournaments and compete with players worldwide</p>
        </div>

        <div className={styles.tournamentGrid}>
          {tournaments.map(tournament => (
            <div key={tournament.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.status}>{tournament.status}</span>
              </div>
              <h3 className={styles.cardTitle}>{tournament.title}</h3>
              <div className={styles.cardInfo}>
                <div className={styles.infoItem}>
                  <span className={styles.icon}>📅</span>
                  <span>{tournament.date}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.icon}>👥</span>
                  <span>{tournament.participants} Players</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.icon}>🏆</span>
                  <span>{tournament.prize}</span>
                </div>
              </div>
              <button 
                className={styles.participateBtn}
                onClick={handleParticipate}
              >
                Participate
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
