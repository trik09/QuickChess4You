import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BsMoon } from "react-icons/bs";
import { useAuth } from "../../contexts/AuthContext";
import ThemeModal from "../ThemeModal/ThemeModal";
import styles from "./Navbar.module.css";
import logo from "../../assets/QuickChessForYou-Logo.svg";

function Navbar({ onLoginClick, onSignupClick }) {
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
          {/* LOGO - Image Only */}
          <Link to="/" className={styles.logo}>
            <img src={logo} alt="Quick Chess" className={styles.logoImg} />
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
                  <li><a href="#home">Home</a></li>
                  <li><a href="#about">About</a></li>
                  <li><Link to="/learn/capture">Learn</Link></li>
                  <li><a href="#courses">Courses</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                  <li><a href="#coaching">Coaching</a></li>
                  <li><a href="#contact">Contact</a></li>
                </>
              ) : (
                <>
                  <li><Link to="/">Home</Link></li>
                  <li><Link to="/">Puzzle Arena</Link></li>
                </>
              )}
            </ul>

            {/* AUTHENTICATION */}
            <div className={styles.authSection}>
              {/* Theme Settings Button */}
              {/* Theme Settings Button */}
              <button
                className={styles.settingsBtn}
                onClick={() => {
                  setIsThemeModalOpen(true);
                  setIsOpen(false);
                }}
                title="Customize Board"
              >
                <BsMoon />
              </button>

              {isAuthenticated ? (
                <div className={styles.userProfile}>
                  <div className={styles.userInfo} onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
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

                  <button className={styles.signupBtn} onClick={() => {
                    onSignupClick();
                    setIsOpen(false);
                  }}>
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
