import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FaUser,
    FaCog,
    FaSignOutAlt,
    FaSun,
    FaMoon,
    FaChevronLeft,
    FaChevronRight,
    FaThLarge,
    FaTrophy,
    FaGraduationCap,
    FaPuzzlePiece,
    FaHistory
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './StudentLayout.module.css';
import logo from '../../assets/QuickChessForYou-Logo.svg';

const StudentLayout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const { darkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // Student Navigation Items
    const navItems = [
        { path: '/Dashboard', label: 'Puzzle Arena', icon: <FaThLarge /> },
        { path: '/Dashboard/competitions', label: 'My Competitions', icon: <FaTrophy /> },
        { path: '/Dashboard/courses', label: 'My Courses', icon: <FaGraduationCap /> },
        { path: '/Dashboard/puzzles', label: 'Puzzle History', icon: <FaHistory /> },
        { path: '/puzzle', label: 'Solve Puzzles', icon: <FaPuzzlePiece /> }, // Direct link to play
    ];

    const userItems = [
        { path: '/profile', label: 'Profile', icon: <FaUser /> },
        { path: '/settings', label: 'Settings', icon: <FaCog /> },
    ];

    const handleLogout = () => {
        if (logout) logout();
        navigate('/');
    };

    // Close mobile menu on route change
    const location = useLocation();
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    return (
        <div className={styles.container}>
            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <Link to="/" className={styles.logoLink} title="Puzzle Arena">
                    <img src={logo} alt="Puzzle Arena" className={styles.logoImg} />
                </Link>
                <button
                    className={styles.mobileMenuBtn}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <FaChevronLeft /> : <FaThLarge />}
                </button>
            </header>

            {/* Mobile Overlay */}
            <div
                className={`${styles.mobileOverlay} ${isMobileMenuOpen ? styles.active : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
                {/* Logo Section */}
                <div className={styles.logoSection}>
                    {!isSidebarCollapsed && (
                        <Link to="/" className={styles.logoLink} title="Puzzle Arena">
                            {/* Logo Image is hidden in desktop sidebar if we want cleaner look or keep it? 
                                 Design decision: Keep it for brand identity.
                             */}
                            <img src={logo} alt="Quick Chess" className={styles.logoImg} />
                            {/* Removed text as per request <span className={styles.logoText}>Quick Chess</span> */}
                        </Link>
                    )}
                    <button
                        className={styles.toggleBtn}
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className={styles.navLinks}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/Dashboard'} // Exact match for root dashboard
                            className={({ isActive }) =>
                                `${styles.navItem} ${isActive ? styles.active : ''}`
                            }
                            title={item.label}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {!isSidebarCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                        </NavLink>
                    ))}

                    <div className={styles.separator} />

                    {userItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `${styles.navItem} ${isActive ? styles.active : ''}`
                            }
                            title={item.label}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {!isSidebarCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Section */}
                <div className={styles.sidebarFooter}>
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
                                <div className={styles.userName}>
                                    {user?.name || user?.username || 'Player'}
                                </div>
                                <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
                                    <FaSignOutAlt /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`${styles.mainContent} ${isSidebarCollapsed ? styles.expanded : ''}`}>
                <Outlet />
            </main>
        </div>
    );
};

export default StudentLayout;
