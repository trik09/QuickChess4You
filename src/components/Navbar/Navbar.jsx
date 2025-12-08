import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ThemeModal from "../ThemeModal/ThemeModal";
import styles from "./Navbar.module.css";
import logo from "../../assets/QuickChessForYou-Logo.svg";

function Navbar({ onLoginClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isHomePage = location.pathname === "/";

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Lock scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {/* Dark overlay for mobile menu */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.active : ""}`}
        onClick={() => setIsOpen(false)}
      />

      <nav className={styles.navbar}>
        <div className={styles.container}>
          {/* LOGO */}
          <Link to="/" className={styles.logo}>
            <img src={logo} alt="Quick Chess" className={styles.logoImg} />
            <span className={styles.logoText}>QUICK CHESS 4 YOU</span>
          </Link>

          {/* HAMBURGER BUTTON */}
          <button
            className={`${styles.hamburger} ${isOpen ? styles.open : ""}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* NAVIGATION MENU */}
          <div
            className={`${styles.navMenu} ${isOpen ? styles.active : ""}`}
          >
            <ul className={styles.navLinks}>
              {isHomePage ? (
                <>
                  <li>
                    <a href="#features">Features</a>
                  </li>
                  <li>
                    <Link to="/dashboard">Tournaments</Link>
                  </li>
                  <li>
                    <a href="#about">About</a>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/">Home</Link>
                  </li>
                  <li>
                    <Link to="/dashboard">Tournaments</Link>
                  </li>
                  <li>
                    <Link to="/puzzle">Puzzles</Link>
                  </li>
                  {isAuthenticated && (
                    <li>
                      <Link to="/profile">Profile</Link>
                    </li>
                  )}
                </>
              )}
            </ul>

            {/* AUTHENTICATION */}
            <div className={styles.authSection}>
              {/* Theme Settings Button */}
              <button 
                className={styles.settingsBtn}
                onClick={() => {
                  setIsThemeModalOpen(true);
                  setIsOpen(false);
                }}
                title="Customize Board"
              >
                ⚙️
              </button>

              {isAuthenticated ? (
                <div className={styles.userProfile}>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                      {user?.avatar ? (
                        <img src={user.avatar} alt="User" />
                      ) : (
                        <span>
                          {user?.username?.[0]?.toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                    <span className={styles.username}>
                      {user?.name || user?.username || "Player"}
                    </span>
                  </div>
                  <button className={styles.logoutBtn} onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              ) : (
                <div className={styles.authButtons}>
                  <button
                    className={styles.loginBtn}
                    onClick={() => {
                      onLoginClick();
                      setIsOpen(false);
                    }}
                  >
                    Log In
                  </button>

                  <button className={styles.signupBtn}>
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Theme Customization Modal */}
      <ThemeModal 
        isOpen={isThemeModalOpen} 
        onClose={() => setIsThemeModalOpen(false)} 
      />
    </>
  );
}

export default Navbar;
