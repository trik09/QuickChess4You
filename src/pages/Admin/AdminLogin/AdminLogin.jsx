import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import logo from '../../../assets/logo.png';
import styles from './AdminLogin.module.css';

function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Static credentials (in production, this would be handled by backend)
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      if (
        formData.username === ADMIN_CREDENTIALS.username &&
        formData.password === ADMIN_CREDENTIALS.password
      ) {
        // Store auth token in localStorage
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminUser', formData.username);
        
        // Navigate to admin dashboard
        navigate('/admin/dashboard');
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.logoSection}>
            <img src={logo} alt="QuickChess4You" className={styles.logo} />
            <h1>QuickChess4You</h1>
            <p>Admin Panel</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <h2>
              <FaUserShield /> Admin Login
            </h2>
            <p className={styles.subtitle}>Enter your credentials to access the admin panel</p>

            {error && (
              <div className={styles.errorAlert}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>
                <FaUserShield /> Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
                required
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <FaLock /> Password
              </label>
              <div className={styles.passwordInput}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.loginBtn} disabled={loading}>
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Logging in...
                </>
              ) : (
                'Login to Admin Panel'
              )}
            </button>

            <div className={styles.demoCredentials}>
              <p>Demo Credentials:</p>
              <div className={styles.credentials}>
                <span><strong>Username:</strong> admin</span>
                <span><strong>Password:</strong> admin123</span>
              </div>
            </div>
          </form>

          <div className={styles.footer}>
            <a href="/">← Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
