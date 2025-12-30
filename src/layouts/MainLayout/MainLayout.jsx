import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FaTrophy,
    FaChessBoard,
    FaUser,
    FaCog,
    FaBars,
    FaTimes,
    FaGraduationCap,
    FaChalkboardTeacher,
    FaTags,
    FaEnvelope,
    FaInfoCircle,
    FaSignInAlt,
    FaSignOutAlt,
    FaSun,
    FaMoon,
    FaHome
} from 'react-icons/fa';
import LoginModal from '../../components/LoginModal/LoginModal';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './MainLayout.module.css';
import logo from '../../assets/QuickChessForYou-Logo.svg';

const MainLayout = () => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { user, isAuthenticated, logout } = useAuth();
    const { darkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    // Auto-open login modal if requested by state
    useEffect(() => {
        if (location.state?.openLogin) {
            setIsLoginModalOpen(true);
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    const navItems = [
        { path: '/dashboard', label: 'Tournaments', icon: <FaTrophy /> },
        { path: '/courses', label: 'Courses', icon: <FaGraduationCap /> },
        { path: '/coaching', label: 'Coaching', icon: <FaChalkboardTeacher /> },
        { path: '/pricing', label: 'Pricing', icon: <FaTags /> },
        { path: '/about', label: 'About Us', icon: <FaInfoCircle /> },
        { path: '/contact', label: 'Contact', icon: <FaEnvelope /> },
    ];

    const userItems = [
        { path: '/profile', label: 'Profile', icon: <FaUser /> },
        { path: '/settings', label: 'Settings', icon: <FaCog /> },
    ];

    const handleLogout = () => {
        if (logout) logout();
    };

    return (
        <div className={styles.container} data-theme={darkMode ? 'dark' : 'light'}>

            {/* === MOBILE HEADER (Visible only on mobile) === */}
            <header className={styles.mobileHeader}>
                <Link to="/" className={styles.mobileLogo}>
                    <img src={logo} alt="Logo" />
                    {/* <span>Quick Chess</span> */}
                </Link>
                <button className={styles.themeToggleIcon} onClick={toggleTheme}>
                    {darkMode ? <FaSun /> : <FaMoon />}
                </button>
            </header>

            {/* === DESKTOP SIDEBAR === */}
            <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>

                {/* Logo / Toggle Section */}
                <div className={styles.logoSection}>
                    <Link to="/" className={styles.logoLink} title="Home">
                        <img src={logo} alt="Logo" className={styles.logoImg} />
                        {/* Removed QCFY text as requested */}
                        {/* {!isSidebarCollapsed && <span className={styles.fullLogoText}>Quick Chess</span>} */}
                    </Link>
                    <button
                        className={styles.toggleBtn}
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    >
                        {isSidebarCollapsed ? <FaBars /> : <FaTimes />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className={styles.navLinks}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                            title={isSidebarCollapsed ? item.label : ''}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {!isSidebarCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                        </NavLink>
                    ))}

                    <div className={styles.separator} />

                    {isAuthenticated && userItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                            title={isSidebarCollapsed ? item.label : ''}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {!isSidebarCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer / User Section */}
                <div className={styles.sidebarFooter}>
                    <button className={styles.themeToggleBtn} onClick={toggleTheme}>
                        {darkMode ? <FaSun /> : <FaMoon />}
                        {!isSidebarCollapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>

                    {isAuthenticated ? (
                        <div className={styles.userProfile}>
                            <div className={styles.avatar}>
                                {user?.avatar ? <img src={user.avatar} alt="U" /> : (user?.username?.[0] || 'U')}
                            </div>
                            {!isSidebarCollapsed && (
                                <div className={styles.userDetails}>
                                    <div className={styles.userName}>{user?.name || 'Player'}</div>
                                    <button onClick={handleLogout} className={styles.logoutTextBtn}>Logout</button>
                                </div>
                            )}
                            {isSidebarCollapsed && (
                                <button onClick={handleLogout} className={styles.logoutIconBtn} title="Logout"><FaSignOutAlt /></button>
                            )}
                        </div>
                    ) : (
                        !isSidebarCollapsed ? (
                            <button className={styles.loginFullBtn} onClick={() => setIsLoginModalOpen(true)}>
                                Login / Sign Up
                            </button>
                        ) : (
                            <button className={styles.loginIconBtn} onClick={() => setIsLoginModalOpen(true)} title="Login">
                                <FaSignInAlt />
                            </button>
                        )
                    )}
                </div>
            </aside>

            {/* === MAIN CONTENT === */}
            <main className={`${styles.mainContent} ${isSidebarCollapsed ? styles.expanded : ''}`}>
                <Outlet />
            </main>

            {/* === MOBILE BOTTOM NAV (Visible only on mobile) === */}
            <nav className={styles.bottomNav}>
                <NavLink to="/" className={({ isActive }) => `${styles.mobileNavItem} ${isActive ? styles.active : ''}`}>
                    <FaHome /><span>Home</span>
                </NavLink>
                <NavLink to="/dashboard" className={({ isActive }) => `${styles.mobileNavItem} ${isActive ? styles.active : ''}`}>
                    <FaTrophy /><span>Play</span>
                </NavLink>
                <NavLink to="/courses" className={({ isActive }) => `${styles.mobileNavItem} ${isActive ? styles.active : ''}`}>
                    <FaGraduationCap /><span>Learn</span>
                </NavLink>
                {isAuthenticated ? (
                    <NavLink to="/profile" className={({ isActive }) => `${styles.mobileNavItem} ${isActive ? styles.active : ''}`}>
                        <FaUser /><span>Profile</span>
                    </NavLink>
                ) : (
                    <button className={styles.mobileNavItem} onClick={() => setIsLoginModalOpen(true)}>
                        <FaSignInAlt /><span>Login</span>
                    </button>
                )}
            </nav>

            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </div>
    );
};

export default MainLayout;