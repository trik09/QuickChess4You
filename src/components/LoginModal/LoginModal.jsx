import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginModal.module.css';

function LoginModal({ onClose }) {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>♔</span>
            </div>
            <h2 className={styles.title}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className={styles.subtitle}>
              {isSignUp 
                ? 'Join thousands of chess players worldwide' 
                : 'Sign in to continue your chess journey'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {isSignUp && (
              <input 
                type="text" 
                placeholder="Full Name" 
                className={styles.input}
                required
              />
            )}
            
            <input 
              type="email" 
              placeholder="Email address" 
              className={styles.input}
              required
            />
            
            <div className={styles.passwordContainer}>
              <input 
                type="password" 
                placeholder="Password" 
                className={styles.input}
                required
              />
            </div>

            {isSignUp && (
              <div className={styles.passwordContainer}>
                <input 
                  type="password" 
                  placeholder="Confirm Password" 
                  className={styles.input}
                  required
                />
              </div>
            )}
            
            {!isSignUp && (
              <div className={styles.rememberRow}>
                <label className={styles.checkbox}>
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" className={styles.forgotLink}>Forgot password?</a>
              </div>
            )}

            <button type="submit" className={styles.submitBtn}>
              {isSignUp ? 'Sign Up' : 'Log In'}
            </button>

            <div className={styles.divider}>
              <span>or continue with</span>
            </div>

            <div className={styles.socialButtons}>
              <button type="button" className={styles.socialBtn}>
                <span className={styles.googleIcon}>G</span>
              </button>
              <button type="button" className={styles.socialBtn}>
                <span className={styles.fbIcon}>f</span>
              </button>
              <button type="button" className={styles.socialBtn}>
                <span className={styles.appleIcon}></span>
              </button>
            </div>

            <p className={styles.switchText}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                type="button" 
                className={styles.switchBtn}
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Log In' : 'Sign Up'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
