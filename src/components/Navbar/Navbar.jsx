import { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BsGear, BsX } from "react-icons/bs";
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
        x: '-100%',
        duration: 0.4,
        ease: "power3.in",
      });
    }
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
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

  // Logic to split links for Desktop view
  const midpoint = Math.ceil(menuLinks.length / 2);
  const leftLinks = menuLinks.slice(0, midpoint);
  const rightLinks = menuLinks.slice(midpoint);

  return (
    <>
      <nav className={styles.navbar} ref={containerRef}>
        <div className={styles.container}>

          {/* MOBILE HAMBURGER (Left) */}
          <button
            className={styles.hamburger}
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* LEFT NAV (Desktop) */}
          <div className={styles.navLeft}>
            <ul className={styles.navLinks}>
              {leftLinks.map((link, index) => (
                <li key={index}>
                  {link.to ? (
                    <Link to={link.to}>{link.name}</Link>
                  ) : (
                    <a href={link.href}>{link.name}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* CENTER LOGO */}
          <div className={styles.logoContainer}>
            <div className={styles.logoBadge}>
              <Link to="/" className={styles.logoLink} aria-label="Quick Chess Home">
                <img src={logo} alt="Quick Chess Logo" className={styles.logoImg} />
              </Link>
            </div>
          </div>

          {/* RIGHT NAV (Desktop) */}
          <div className={styles.navRight}>
            <ul className={styles.navLinks}>
              {rightLinks.map((link, index) => (
                <li key={index + midpoint}>
                  {link.to ? (
                    <Link to={link.to}>{link.name}</Link>
                  ) : (
                    <a href={link.href}>{link.name}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* AUTH & SETTINGS (Absolute Right) */}
          <div className={styles.authSection}>
            <button
              className={styles.settingsBtn}
              onClick={() => setIsThemeModalOpen(true)}
              aria-label="Customize board theme"
              title="Customize Board"
            >
              <BsGear />
            </button>

            {isAuthenticated ? (
              <div className={styles.userProfile}>
                <button
                  className={styles.userInfo}
                  onClick={() => navigate('/dashboard')}
                  aria-label="Go to dashboard"
                >
                  <div className={styles.avatar}>
                    {user?.avatar ? (
                      <img src={user.avatar} alt={`${user.username}'s avatar`} />
                    ) : (
                      user?.username?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                </button>
              </div>
            ) : (
              <div className={styles.authButtons}>
                <button className={styles.loginBtn} onClick={onLoginClick}>
                  LOG IN
                </button>
                <button className={styles.signupBtn} onClick={onSignupClick}>
                  SIGN UP
                </button>
              </div>
            )}
          </div>

        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}

      <div className={styles.mobileMenuWrapper} ref={menuRef}>
        <div className={styles.mobileHeader}>
          <Link
            to="/"
            className={styles.mobileLogo}
            onClick={() => setIsOpen(false)}
            aria-label="Quick Chess Home"
          >
            <img src={logo} alt="Quick Chess Logo" />
          </Link>

          <div className={styles.mobileHeaderControls}>
            <button
              className={styles.mobileThemeBtn}
              onClick={() => {
                setIsThemeModalOpen(true);
                setIsOpen(false);
              }}
              aria-label="Customize board theme"
              title="Customize Board"
            >
              <BsGear size={20} />
            </button>
            <button
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <BsX size={32} />
            </button>
          </div>
        </div>

        <div className={styles.mobileContent}>
          <ul className={styles.mobileLinks}>
            {menuLinks.map((link, index) => (
              <li
                key={index}
                ref={el => linksRef.current[index] = el}
                className={styles.mobileLinkItem}
              >
                {link.to ? (
                  <Link to={link.to} onClick={() => setIsOpen(false)}>
                    {link.name}
                  </Link>
                ) : (
                  <a href={link.href} onClick={() => setIsOpen(false)}>
                    {link.name}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.mobileFooter} ref={footerRef}>
          {isAuthenticated ? (
            <div className={styles.mobileAuth}>
              <span className={styles.mobileUsername}>
                Hi, {user?.name || user?.username || "Player"}
              </span>
              <button className={styles.mobileLogoutBtn} onClick={handleLogout}>
                Log Out
              </button>
            </div>
          ) : (
            <div className={styles.mobileAuth}>
              <button
                className={styles.mobileLoginBtn}
                onClick={() => {
                  onLoginClick();
                  setIsOpen(false);
                }}
              >
                Log In
              </button>
              <button
                className={styles.callCtaBtn}
                onClick={() => {
                  onSignupClick();
                  setIsOpen(false);
                }}
              >
                Sign Up <span className={styles.arrow}>→</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ThemeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
    </>
  );
}

export default Navbar;
