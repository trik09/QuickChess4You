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
  Users,
  ArrowLeft,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/QuickChessForYou-Logo.svg';
import styles from './AdminLayout.module.css';

function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, adminLogout } = useAuth();

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const hasPermission = (perm) => {
    if (!admin) return false;
    if (admin.role === 'super' || admin.email === 'admin@admin.com') return true;
    if (!admin.permissions) return false;
    return admin.permissions[perm] === true;
  };

  const hasAnyPuzzlePermission = hasPermission('create_puzzle') || hasPermission('edit_puzzle') || hasPermission('delete_puzzle');
  const hasAnyCategoryPermission = hasPermission('create_category') || hasPermission('edit_category') || hasPermission('delete_category');
  const hasAnyCompetitionPermission = hasPermission('create_competition') || hasPermission('edit_competition') || hasPermission('delete_competition');
  const hasAnyEventPermission = hasPermission('create_event') || hasPermission('edit_event') || hasPermission('delete_event');
  const hasAnyExamPermission = hasPermission('create_exam') || hasPermission('edit_exam') || hasPermission('delete_exam');

  const menuItems = [
    { path: '/admin/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  ];

  // 1. Puzzle Group
  const puzzleSubmenu = [];
  if (hasAnyCategoryPermission) {
    puzzleSubmenu.push({ path: '/admin/categories', icon: Layers, label: 'Puzzle Categories' });
  }
  if (hasAnyPuzzlePermission) {
    puzzleSubmenu.push({ path: '/admin/puzzles', icon: Puzzle, label: 'Puzzles' });
    puzzleSubmenu.push({ path: '/admin/daily-training', icon: CalendarDays, label: 'Daily Training' });
  }
  if (puzzleSubmenu.length > 0) {
    menuItems.push({
      label: 'Puzzle Management',
      icon: Puzzle,
      submenu: puzzleSubmenu
    });
  }

  // 2. Quiz Group
  const quizSubmenu = [];
  if (hasAnyCategoryPermission) {
    quizSubmenu.push({ path: '/admin/quiz-categories', icon: List, label: 'Quiz Categories' });
  }
  if (hasAnyExamPermission) {
    quizSubmenu.push({ path: '/admin/quiz/list', icon: ListCheck, label: 'Quiz List' });
  }
  if (quizSubmenu.length > 0) {
    menuItems.push({
      label: 'Quiz',
      icon: List,
      submenu: quizSubmenu
    });
  }

  // 3. Competitions Group
  const compSubmenu = [];
  if (hasAnyCompetitionPermission) {
    compSubmenu.push({ path: '/admin/competitions', icon: Trophy, label: 'Manage Arena' });
  }
  if (hasAnyEventPermission) {
    compSubmenu.push({ path: '/admin/events', icon: Calendar, label: 'Manage Events' });
  }
  if (hasAnyExamPermission) {
    compSubmenu.push({ path: '/admin/exams', icon: FileText, label: 'Manage Exams' });
  }
  if (compSubmenu.length > 0) {
    menuItems.push({
      label: 'Competitions',
      icon: Trophy,
      submenu: compSubmenu
    });
  }

  // 4. User/Admin Group
  const userSubmenu = [
    { path: '/admin/students', icon: Users, label: 'Students' }
  ];
  if (admin?.role === 'super' || admin?.email === 'admin@admin.com') {
    userSubmenu.push({ path: '/admin/admins', icon: Users, label: 'Sub-Admins' });
  }
  menuItems.push({
    label: 'User Management',
    icon: Users,
    submenu: userSubmenu
  });

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
