import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    FaUser,
    FaChevronLeft,
    FaChevronRight,
    FaThLarge,
    FaGraduationCap,
    FaPuzzlePiece,
    FaCog,
    FaSun,
    FaTrophy,
    FaMoon,
    FaClipboardList
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeModal from '../../components/ThemeModal/ThemeModal';
import styles from './StudentLayout.module.css';
import logo from '../../assets/QuickChessForYou-Logo.svg';
import NetworkStatus from '../../components/NetworkStatus/NetworkStatus';

const StudentLayout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const { user, logout } = useAuth();
    const { darkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // Auto-collapse sidebar on Live Competition or Analysis Screen entry for large screens (>= 1350px)
    useEffect(() => {
        const isTargetPage = location.pathname.includes('/competition/') || 
                            location.pathname.includes('/tournament/') || 
                            location.pathname.includes('/live-event/');
        
        if (isTargetPage && window.innerWidth >= 1350) {
            setIsSidebarCollapsed(true);
        }
    }, [location.pathname, location.state]);

    const openSettings = () => setIsThemeModalOpen(true);

    const sidebarNavItems = [
        { path: '/Dashboard', label: 'Arena', icon: <FaThLarge /> },
        { path: '/play', label: 'Play', icon: <FaPuzzlePiece /> },
        { path: '/events', label: 'Events', icon: <FaTrophy /> },
        { path: '/Dashboard/courses', label: 'Learn', icon: <FaGraduationCap /> },
        { path: '/Dashboard/exams', label: 'Exams', icon: <FaClipboardList /> },
        { path: '/profile', label: 'Profile', icon: <FaUser /> },
        { label: 'Settings', icon: <FaCog />, action: openSettings },
    ];

    // Mobile Bottom Nav: Arena in the center as the special raised button
    const mobileNavItems = [
        { path: '/play', label: 'Play', icon: <FaPuzzlePiece /> },
        { path: '/events', label: 'Events', icon: <FaTrophy /> },
        { path: '/Dashboard', label: 'Arena', icon: <FaThLarge />, isSpecial: true },
        { path: '/Dashboard/exams', label: 'Exams', icon: <FaClipboardList /> },
        { path: '/profile', label: 'Profile', icon: <FaUser /> },
    ];

    const handleLogout = async () => {
        await logout?.();
        navigate('/');
    };

    // Renders a nav item as either a NavLink (if it has a path) or a button (if it has an action)
    const renderNavItem = (item, styleClasses) => {
        if (item.action) {
            return (
                <button
                    key={item.label}
                    className={styleClasses.base}
                    onClick={item.action}
                >
                    <span className={styleClasses.icon}>{item.icon}</span>
                    {styleClasses.showLabel && <span className={styleClasses.labelClass}>{item.label}</span>}
                </button>
            );
        }
        return (
            <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/Dashboard'}
                className={({ isActive }) =>
                    `${styleClasses.base} ${isActive ? styleClasses.active : ''} ${item.isSpecial ? (styleClasses.special || '') : ''}`
                }
            >
                <span className={styleClasses.icon}>{item.icon}</span>
                {styleClasses.showLabel && <span className={styleClasses.labelClass}>{item.label}</span>}
            </NavLink>
        );
    };

    return (
        <div className={styles.container}>
            {/* --- MOBILE: Top App Bar --- */}
            <header className={styles.mobileHeader}>
                <Link to="/" className={styles.mobileLogo}>
                    <img src={logo} alt="Logo" />
                </Link>
                <div className={styles.mobileHeaderActions}>
                    {/* <NetworkStatus isCollapsed={true} /> */}
                    <Link to="/profile" className={styles.mobileAvatar}>
                        {user?.avatar ? (
                            <img src={user.avatar} alt="User" />
                        ) : (
                            <span>{user?.username?.[0]?.toUpperCase() || 'U'}</span>
                        )}
                    </Link>
                </div>
            </header>

            {/* --- DESKTOP: Sidebar (Hidden on Mobile) --- */}
            <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
                <div className={styles.logoSection}>
                    {!isSidebarCollapsed && (
                        <Link to="/" className={styles.logoLink}>
                            <img src={logo} alt="Quick Chess" className={styles.logoImg} />
                        </Link>
                    )}
                    <button
                        className={styles.toggleBtn}
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    >
                        {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                    </button>
                </div>

                <nav className={styles.navLinks}>
                    {sidebarNavItems.map((item) =>
                        renderNavItem(item, {
                            base: styles.navItem,
                            active: styles.active,
                            icon: styles.navIcon,
                            labelClass: styles.navLabel,
                            showLabel: !isSidebarCollapsed,
                        })
                    )}
                </nav>

                <div className={styles.sidebarFooter}>
                    <button
                        className={styles.themeToggleBtn}
                        onClick={toggleTheme}
                        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {darkMode ? <FaSun /> : <FaMoon />}
                        {!isSidebarCollapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>

                    {/* <NetworkStatus isCollapsed={isSidebarCollapsed} /> */}

                    <div className={styles.userProfile}>
                        <div className={styles.avatar}>
                            {user?.avatar ? (
                                <img src={user.avatar} alt="User" />
                            ) : (
                                <span>{user?.username?.[0]?.toUpperCase() || 'U'}</span>
                            )}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className={styles.userDetails}>
                                <div className={styles.userName}>{user?.name || 'Player'}</div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className={`${styles.mainContent} ${isSidebarCollapsed ? styles.expanded : ''}`}>
                <Outlet />
            </main>

            {/* --- MOBILE: Bottom Navigation Bar --- */}
            <nav className={styles.bottomNav}>
                {mobileNavItems.map((item) =>
                    renderNavItem(item, {
                        base: styles.bottomNavItem,
                        active: styles.bottomNavActive,
                        special: styles.specialNavItem,
                        icon: styles.bottomNavIcon,
                        labelClass: styles.bottomNavLabel,
                        showLabel: true,
                    })
                )}
            </nav>

            {/* Theme Modal */}
            <ThemeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
        </div>
    );
};

export default StudentLayout;


