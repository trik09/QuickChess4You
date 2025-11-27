import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import logo from "../../assets/logo.png"

function Navbar({ onLoginClick, isLoggedIn = false }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

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
          {isLoggedIn ? (
            <div className={styles.userAvatar}>
              <span>👤</span>
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
