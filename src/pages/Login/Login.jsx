import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
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
          
          <form onSubmit={handleLogin} className={styles.form}>
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
              <span className={styles.eyeIcon}>👁</span>
            </div>
            
            <div className={styles.rememberRow}>
              <label className={styles.checkbox}>
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className={styles.forgotLink}>Forgot password?</a>
            </div>

            <button type="submit" className={styles.loginBtn}>
              Log in
            </button>

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
