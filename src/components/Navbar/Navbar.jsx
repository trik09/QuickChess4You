import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Navbar.module.css';
import logo from "../../assets/QuickChessForYou-Logo.svg"

function Navbar({ onLoginClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const isHomePage = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}><img src={logo} alt="" height={60}/></span>
          {/* <span className={styles.logoText}>Quick Chess For You</span> */}
        </Link>
        
        <ul className={styles.navLinks}>
          {isHomePage ? (
            <>
              <li><a href="#features">Features</a></li>
              <li><a href="#tournaments">Tournaments</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#why-choose-us">Why Choose Us</a></li>
              <li><a href="#contact">Contact</a></li>
            </>
          ) : (
            <>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/puzzle">Puzzles</Link></li>
            </>
          )}
        </ul>

        <div className={styles.userSection}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className={styles.userAvatar} title={user?.name || user?.username || 'User'}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <span style={{ color: '#1f2937', fontSize: '0.875rem', fontWeight: 500 }}>
                {user?.name || user?.username || 'User'}
              </span>
              <button 
                className={styles.loginBtn} 
                onClick={handleLogout}
                style={{ marginLeft: '8px', padding: '8px 16px', fontSize: '0.875rem' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button className={styles.loginBtn} onClick={onLoginClick}>
              Log In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
