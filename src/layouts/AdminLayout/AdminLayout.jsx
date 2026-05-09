import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Puzzle,
  CalendarDays,
  List,
  ListCheck,
  Trophy,
  Calendar,
  FileText,
  Car,
  Users,
  ArrowLeft,
  LogOut,
  Menu,
  X
} from "lucide-react";
import {
  FaBars, FaTimes
} from 'react-icons/fa';
import logo from '../../assets/QuickChessForYou-Logo.svg';
import styles from './AdminLayout.module.css';

function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove admin-specific items
    localStorage.removeItem('admin');
    //localStorage.removeItem('adminUser');
    // Remove token if it's an admin token (you might want to check this more carefully)
    // For now, we'll remove it to ensure clean logout
    const adminToken = localStorage.getItem('atoken');
    if (adminToken) {
      localStorage.removeItem('atoken');
    }
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    {
      label: 'Puzzle Management',
      icon: Puzzle,
      submenu: [
        { path: '/admin/categories', icon: Layers, label: 'Puzzle Categories' },
        { path: '/admin/puzzles', icon: Puzzle, label: 'Puzzles' },
        { path: '/admin/daily-training', icon: CalendarDays, label: 'Daily Training' },
      ]
    },
    {
      label: 'Quiz',
      icon: List,
      submenu: [
        { path: '/admin/quiz-categories', icon: List, label: 'Quiz Categories' },
        { path: '/admin/quiz/list', icon: ListCheck, label: 'Quiz List' },
      ]
    },
    {
      label: 'Competitions',
      icon: Trophy,
      submenu: [
        { path: '/admin/competitions', icon: Trophy, label: 'Manage Arena ' },
        { path: '/admin/events', icon: Calendar, label: 'Manage Events' },
        { path: '/admin/exams', icon: FileText, label: 'Manage Exams' },
      ]
    },
    {
      label: 'User Management',
      icon: Users,
      submenu: [
        { path: '/admin/students', icon: Users, label: 'Students' },
      ]
    },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className={styles.adminLayout}>
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          {!sidebarCollapsed && (
            <div className={styles.brandLogo}>
              {/* <img src={logo} alt="QuickChess4You" /> */}
              <span>Admin Panel</span>
            </div>
          )}
          <button
            className={styles.toggleBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {menuItems.map((item, index) => (
            item.submenu ? (
              <div key={index} className={styles.menuGroup}>
                {!sidebarCollapsed && (
                  <div className={styles.menuGroupLabel}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                )}
                {item.submenu.map((subItem) => (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    className={`${styles.menuItem} ${isActive(subItem.path) ? styles.active : ''}`}
                    title={sidebarCollapsed ? subItem.label : ''}
                  >
                    <span className={styles.menuIcon}><subItem.icon className="w-5 h-5" /></span>
                    {!sidebarCollapsed && <span>{subItem.label}</span>}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.menuItem} ${isActive(item.path, item.exact) ? styles.active : ''}`}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span className={styles.menuIcon}><item.icon className="w-5 h-5" /></span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.menuItem}>
            <span className={styles.menuIcon}><ArrowLeft className="w-5 h-5" /></span>
            {!sidebarCollapsed && <span>Back to Site</span>}
          </Link>
          <button
            className={`${styles.menuItem} ${styles.logoutMenuItem}`}
            onClick={() => setShowLogoutConfirm(true)}
            title={sidebarCollapsed ? "Logout" : ""}
          >
            <span className={styles.menuIcon}><LogOut className="w-5 h-5" /></span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className={styles.mainContent}>
        {/* Header removed as per new design */}


        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      {showLogoutConfirm && (
        <div className={styles.modal} onClick={() => setShowLogoutConfirm(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmHeader}>
              <LogOut className={styles.logoutIcon} />
              <h3>Confirm Logout</h3>
            </div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to logout from the admin panel?</p>
            </div>
            <div className={styles.confirmActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;
