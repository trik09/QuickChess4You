import { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BsMoon, BsX } from "react-icons/bs";
import { useAuth } from "../../contexts/AuthContext";
import ThemeModal from "../ThemeModal/ThemeModal";
import styles from "./Navbar.module.css";
import logo from "../../assets/QuickChessForYou-Logo.svg";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

function Navbar({ onLoginClick, onSignupClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const linksRef = useRef([]);
  const footerRef = useRef(null);

  const isHomePage = location.pathname === "/";

  // GSAP Animation for Mobile Menu
  useGSAP(() => {
    if (isOpen) {
      const tl = gsap.timeline();

      tl.to(menuRef.current, {
        x: '0%',
        duration: 0.5,
        ease: "power3.out",
      })
        .fromTo(linksRef.current,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" },
          "-=0.2"
        )
        .fromTo(footerRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
          "-=0.2"
        );

    } else {
      gsap.to(menuRef.current, {
        x: '100%',
        duration: 0.4,
        ease: "power3.in",
      });
    }
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuLinks = isHomePage ? [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Learn", to: "/learn/capture" },
    { name: "Courses", href: "#courses" },
    { name: "Pricing", href: "#pricing" },
    { name: "Coaching", href: "#coaching" },
    { name: "Contact", href: "#contact" },
  ] : [
    { name: "Home", to: "/" },
    { name: "Puzzle Arena", to: "/puzzle" },
  ];

  return (
    <>
      <nav className={styles.navbar} ref={containerRef}>
        <div className={styles.container}>
          {/* LOGO */}
          <Link to="/" className={styles.logo}>
            <img src={logo} alt="Quick Chess" className={styles.logoImg} />
          </Link>

          {/* DESKTOP MENU (Hidden on Mobile) */}
          <div className={styles.desktopMenu}>
            <ul className={styles.navLinks}>
              {menuLinks.map((link, index) => (
                <li key={index}>
                  {link.to ? <Link to={link.to}>{link.name}</Link> : <a href={link.href}>{link.name}</a>}
                </li>
              ))}
            </ul>

            <div className={styles.authSection}>
              <button
                className={styles.settingsBtn}
                onClick={() => setIsThemeModalOpen(true)}
                title="Customize Board"
              >
                <BsMoon />
              </button>

              {isAuthenticated ? (
                <div className={styles.userProfile}>
                  <div className={styles.userInfo} onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                    <div className={styles.avatar}>
                      {user?.avatar ? <img src={user.avatar} alt="User" /> : (user?.username?.[0]?.toUpperCase() || "U")}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.authButtons}>
                  <button className={styles.loginBtn} onClick={onLoginClick}>Log In</button>
                  <button className={styles.signupBtn} onClick={onSignupClick}>Sign Up</button>
                </div>
              )}
            </div>
          </div>

          {/* MOBILE HAMBURGER */}
          <button className={styles.hamburger} onClick={toggleMenu} aria-label="Open menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY (LimelQ Style) */}
      <div className={styles.mobileMenuWrapper} ref={menuRef}>
        <div className={styles.mobileHeader}>
          <Link to="/" className={styles.mobileLogo} onClick={() => setIsOpen(false)}>
            <img src={logo} alt="Quick Chess" />
          </Link>

          <div className={styles.mobileHeaderControls}>
            <button
              className={styles.mobileThemeBtn}
              onClick={() => {
                setIsThemeModalOpen(true);
                setIsOpen(false);
              }}
              title="Customize Board"
            >
              <BsMoon size={20} />
            </button>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
              <BsX size={32} />
            </button>
          </div>
        </div>

        <div className={styles.mobileContent}>
          <ul className={styles.mobileLinks}>
            {menuLinks.map((link, index) => (
              <li key={index} ref={el => linksRef.current[index] = el} className={styles.mobileLinkItem}>
                {link.to ? (
                  <Link to={link.to} onClick={() => setIsOpen(false)}>{link.name}</Link>
                ) : (
                  <a href={link.href} onClick={() => setIsOpen(false)}>{link.name}</a>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.mobileFooter} ref={footerRef}>
          {isAuthenticated ? (
            <div className={styles.mobileAuth}>
              <span className={styles.mobileUsername}>Hi, {user?.name || "Player"}</span>
              <button className={styles.mobileLogoutBtn} onClick={handleLogout}>Log out</button>
            </div>
          ) : (
            <div className={styles.mobileAuth}>
              <button className={styles.mobileLoginBtn} onClick={() => { onLoginClick(); setIsOpen(false); }}>Log in</button>
              <button className={styles.callCtaBtn} onClick={() => { onSignupClick(); setIsOpen(false); }}>Sign Up <span className="arrow">→</span></button>
            </div>
          )}
        </div>
      </div>

      <ThemeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
    </>
  );
}

export default Navbar;
