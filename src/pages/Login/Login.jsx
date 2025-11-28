import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import styles from './Login.module.css';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isOTPMode, setIsOTPMode] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(formData.email, formData.password);

      // Use context to store token and user data
      login(response.user, response.token);

      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.email) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    try {
      await authAPI.sendOTP(formData.email);
      setSuccess('OTP sent to your email! Please check your inbox.');
      setIsOTPMode(true);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.email || !formData.otp) {
      setError('Email and OTP are required');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.verifyOTP(formData.email, formData.otp);

      // Instead of logging in directly, switch to reset password mode
      setTempToken(response.token);
      setIsResetMode(true);
      setIsOTPMode(false);
      setSuccess('OTP verified! Please set your new password.');
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setError('Please enter your email first');
      return;
    }
    handleSendOTP(e);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.newPassword) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    try {
      await authAPI.resetPassword(formData.newPassword, tempToken);
      setSuccess('Password reset successful! Please login with your new password.');
      
      // Reset all states after success
      setTimeout(() => {
        setIsResetMode(false);
        setShowNewPassword(false);
        setTempToken(null);
        setFormData(prev => ({
          ...prev,
          password: '',
          otp: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <div className={styles.decorCircle}></div>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>♟♔</span>
        </div>
        <div className={styles.formContainer}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>
            Sign in to access your launcher, games, videos, and weblooms.
          </p>
          
          {error && (
            <div style={{ 
              padding: '12px', 
              background: '#fee2e2', 
              border: '1px solid #fca5a5', 
              borderRadius: '8px', 
              color: '#dc2626', 
              marginBottom: '16px',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ 
              padding: '12px', 
              background: '#d1fae5', 
              border: '1px solid #86efac', 
              borderRadius: '8px', 
              color: '#059669', 
              marginBottom: '16px',
              fontSize: '0.875rem'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={isResetMode ? handleResetPassword : (isOTPMode ? handleVerifyOTP : handleLogin)} className={styles.form}>
            <input 
              type="email" 
              name="email"
              placeholder="Email address" 
              className={styles.input}
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isOTPMode || isResetMode}
            />
            
            {isResetMode ? (
              <>
                <div className={styles.passwordContainer}>
                  <input 
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    placeholder="New Password" 
                    className={styles.input}
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                  />
                  <span 
                    className={styles.eyeIcon}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? '👁️' : '👁'}
                  </span>
                </div>
                <div className={styles.passwordContainer} style={{ marginTop: '16px' }}>
                  <input 
                    type="password" 
                    name="confirmPassword"
                    placeholder="Confirm New Password" 
                    className={styles.input}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                  />
                </div>
              </>
            ) : isOTPMode ? (
              <input 
                type="text" 
                name="otp"
                placeholder="Enter 6-digit OTP" 
                className={styles.input}
                value={formData.otp}
                onChange={handleInputChange}
                maxLength={6}
                required
              />
            ) : (
              <div className={styles.passwordContainer}>
                <input 
                  type="password" 
                  name="password"
                  placeholder="Password" 
                  className={styles.input}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <span className={styles.eyeIcon}>👁</span>
              </div>
            )}
            
            {!isOTPMode && !isResetMode && (
              <div className={styles.rememberRow}>
                <label className={styles.checkbox}>
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className={styles.forgotLink}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button 
              type="submit" 
              className={styles.loginBtn}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading 
                ? 'Please wait...' 
                : isResetMode
                  ? 'Reset Password'
                  : isOTPMode 
                    ? 'Verify OTP' 
                    : 'Log in'}
            </button>

            {(isOTPMode || isResetMode) && (
              <button 
                type="button"
                onClick={() => {
                  setIsOTPMode(false);
                  setIsResetMode(false);
                  setFormData(prev => ({ ...prev, otp: '' }));
                  setError('');
                  setSuccess('');
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#d97706', 
                  cursor: 'pointer', 
                  marginTop: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                Back to Login
              </button>
            )}

            <div className={styles.socialButtons}>
              <button type="button" className={styles.socialBtn}>
                <span className={styles.googleIcon}>G</span> Google
              </button>
              <button type="button" className={styles.socialBtn}>
                <span className={styles.fbIcon}>f</span> Facebook
              </button>
            </div>
          </form>
        </div>
        <div className={styles.decorCircleBottom}></div>
      </div>
      
      <div className={styles.rightSection}>
        <img 
          src="https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800&q=80" 
          alt="Chess Board" 
          className={styles.chessImage}
        />
      </div>
    </div>
  );
}

export default Login;
