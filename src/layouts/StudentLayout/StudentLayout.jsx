import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
    FaUser,
    FaSignOutAlt,
    FaChevronLeft,
    FaChevronRight,
    FaThLarge,
    FaTrophy,
    FaGraduationCap,
    FaPuzzlePiece,
    FaHistory,
    FaCog
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import ThemeModal from '../../components/ThemeModal/ThemeModal';
import styles from './StudentLayout.module.css';
import logo from '../../assets/QuickChessForYou-Logo.svg';

const StudentLayout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Primary Navigation (Bottom Bar on Mobile / Sidebar on Desktop)
    const navItems = [
        { path: '/Dashboard', label: 'Arena', icon: <FaThLarge /> },
        { path: '/Dashboard/competitions', label: 'Compete', icon: <FaTrophy /> },
        { path: '/puzzle', label: 'Play', icon: <FaPuzzlePiece />, isSpecial: true }, // Special styling for Play
        { path: '/Dashboard/courses', label: 'Learn', icon: <FaGraduationCap /> },
        { path: '/Dashboard/puzzles', label: 'History', icon: <FaHistory /> },
    ];

    const handleLogout = () => {
        if (logout) logout();
        navigate('/');
    };

    return (
        <div className={styles.container}>
            {/* --- MOBILE: Top App Bar --- */}
            <header className={styles.mobileHeader}>
                <Link to="/" className={styles.mobileLogo}>
                    <img src={logo} alt="Logo" />
                </Link>
                <div className={styles.mobileHeaderActions}>
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
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/Dashboard'}
                            className={({ isActive }) =>
                                `${styles.navItem} ${isActive ? styles.active : ''}`
                            }
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {!isSidebarCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                        </NavLink>
                    ))}

                    <div className={styles.separator} />

                    {/* Desktop Specific Profile Links */}
                    <NavLink to="/profile" className={styles.navItem}>
                        <span className={styles.navIcon}><FaUser /></span>
                        {!isSidebarCollapsed && <span className={styles.navLabel}>Profile</span>}
                    </NavLink>

                    {/* Settings Button */}
                    <button
                        className={styles.navItem}
                        onClick={() => setIsThemeModalOpen(true)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                    >
                        <span className={styles.navIcon}><FaCog /></span>
                        {!isSidebarCollapsed && <span className={styles.navLabel}>Settings</span>}
                    </button>
                </nav>

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
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/Dashboard'}
                        className={({ isActive }) =>
                            `${styles.bottomNavItem} ${isActive ? styles.bottomNavActive : ''} ${item.isSpecial ? styles.specialNavItem : ''}`
                        }
                    >
                        <span className={styles.bottomNavIcon}>{item.icon}</span>
                        <span className={styles.bottomNavLabel}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Theme Modal */}
            <ThemeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
        </div>
    );
};

export default StudentLayout;
