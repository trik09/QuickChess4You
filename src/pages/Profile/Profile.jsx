import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import styles from './Profile.module.css';

// Helper function to construct avatar URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  const baseUrl = apiBaseUrl.replace('/api', '');
  return `${baseUrl}/${avatarPath}`;
};

function Profile() {
  const navigate = useNavigate();
  const { user: contextUser, userLogin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fallback user data from context or localStorage
  const fallbackUserData = contextUser || JSON.parse(localStorage.getItem('user')) || {
    name: '',
    username: '',
    email: '',
    avatar: null,
    rating: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
    createdAt: new Date()
  };

  // State for real-time user data
  const [userData, setUserData] = useState(fallbackUserData);

  // Fetch real-time user data from database
  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await authAPI.getCurrentUser();
      
      if (response.user) {
        setUserData(response.user);
        // Update context and localStorage with fresh data
        userLogin(response.user, token);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data. Showing cached data.');
      // Use fallback data if API call fails
      setUserData(fallbackUserData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data on mount
    fetchUserData();

    // Refresh data when window comes into focus (e.g., after editing profile)
    const handleFocus = () => {
      fetchUserData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Get statistics from userData or use defaults
  const stats = {
    puzzlesSolved: userData.statistics?.puzzlesSolved || 0,
    accuracy: 87, // TODO: Calculate from puzzle history
    currentStreak: 12, // TODO: Calculate from puzzle history
    bestStreak: 28, // TODO: Calculate from puzzle history
    totalGames: (userData.wins || 0) + (userData.losses || 0) + (userData.draws || 0),
    wins: userData.wins || 0,
    draws: userData.draws || 0,
    losses: userData.losses || 0,
    competitionsParticipated: userData.statistics?.competitionsParticipated || 0
  };

  // Format join date
  const joinDate = userData.createdAt 
    ? new Date(userData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'N/A';

  // Get rank based on rating
  const getRank = (rating) => {
    if (rating >= 2000) return 'Master';
    if (rating >= 1800) return 'Expert';
    if (rating >= 1600) return 'Advanced';
    if (rating >= 1400) return 'Intermediate';
    return 'Beginner';
  };

  const recentActivity = [
    { type: 'puzzle', title: 'Mate in 2', result: 'Solved', time: '2 hours ago' },
    { type: 'tournament', title: 'Spring Championship', result: '3rd Place', time: '1 day ago' },
    { type: 'puzzle', title: 'Mate in 3', result: 'Solved', time: '2 days ago' },
    { type: 'puzzle', title: 'Mate in 1', result: 'Solved', time: '3 days ago' }
  ];

  const achievements = [
    { icon: '🏆', title: 'First Win', description: 'Won your first tournament' },
    { icon: '🎯', title: '100 Puzzles', description: 'Solved 100 puzzles' },
    { icon: '🔥', title: '7 Day Streak', description: 'Maintained 7 day streak' },
    { icon: '⭐', title: getRank(userData.rating || 1200), description: `Reached ${getRank(userData.rating || 1200)} rating` }
  ];

  // Navigate to edit page
  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  // Handle avatar click to view full size
  const handleAvatarClick = () => {
    if (getAvatarUrl(userData.avatar)) {
      setShowAvatarModal(true);
    }
  };

  // Close avatar modal
  const handleCloseAvatarModal = () => {
    setShowAvatarModal(false);
  };

  return (
    <div className={styles.container}>
      {/* Navbar Removed */}

      <div className={styles.content}>
        {loading && (
          <div className={styles.loadingMessage}>
            Loading profile data...
          </div>
        )}
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.headerContent}>
            <div className={styles.avatarSection}>
              <div 
                className={`${styles.avatar} ${getAvatarUrl(userData.avatar) ? styles.avatarClickable : ''}`}
                onClick={handleAvatarClick}
              >
                {getAvatarUrl(userData.avatar) ? (
                  <img src={getAvatarUrl(userData.avatar) } 
                    alt={userData.name || 'User'} />
                ) : (
                  <span className={styles.avatarPlaceholder} >
                    {(userData.name || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {getAvatarUrl(userData.avatar) && (
                <span className={styles.viewImageHint}>Click to view</span>
              )}
            </div>

            <div className={styles.userInfo}>
              <h1 className={styles.userName}>{userData.name || 'User'}</h1>
              <p className={styles.username}>@{userData.username || 'username'}</p>
              <div className={styles.badges}>
                <span className={styles.badge}>{getRank(userData.rating || 1200)}</span>
                <span className={styles.badge}>⭐ {userData.rating || 1200}</span>
              </div>
            </div>

            <button className={styles.editProfileBtn} onClick={handleEditProfile}>
              Edit Profile
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎯</div>
            <div className={styles.statValue}>{stats.puzzlesSolved}</div>
            <div className={styles.statLabel}>Puzzles Solved</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statValue}>{stats.competitionsParticipated}</div>
            <div className={styles.statLabel}>Competitions</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statValue}>{stats.accuracy}%</div>
            <div className={styles.statLabel}>Accuracy</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔥</div>
            <div className={styles.statValue}>{stats.currentStreak}</div>
            <div className={styles.statLabel}>Current Streak</div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'activity' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'achievements' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'settings' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.overviewGrid}>
              <div className={styles.card}>
                <h3>Performance</h3>
                <div className={styles.performanceStats}>
                  <div className={styles.performanceItem}>
                    <span>Total Games</span>
                    <strong>{stats.totalGames}</strong>
                  </div>
                  <div className={styles.performanceItem}>
                    <span>Wins</span>
                    <strong className={styles.green}>{stats.wins}</strong>
                  </div>
                  <div className={styles.performanceItem}>
                    <span>Draws</span>
                    <strong className={styles.gray}>{stats.draws}</strong>
                  </div>
                  <div className={styles.performanceItem}>
                    <span>Losses</span>
                    <strong className={styles.red}>{stats.losses}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <h3>Account Info</h3>
                <div className={styles.infoList}>
                  <div className={styles.infoItem}>
                    <span>Email</span>
                    <strong>{userData.email}</strong>
                  </div>
                  <div className={styles.infoItem}>
                    <span>Member Since</span>
                    <strong>{joinDate}</strong>
                  </div>
                  <div className={styles.infoItem}>
                    <span>Rating</span>
                    <strong>{userData.rating || 1200}</strong>
                  </div>
                  <div className={styles.infoItem}>
                    <span>Best Streak</span>
                    <strong>{stats.bestStreak} days</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className={styles.card}>
              <h3>Recent Activity</h3>
              <div className={styles.activityList}>
                {recentActivity.map((activity, index) => (
                  <div key={index} className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      {activity.type === 'puzzle' ? '🧩' : '🏆'}
                    </div>
                    <div className={styles.activityDetails}>
                      <strong>{activity.title}</strong>
                      <span className={styles.activityResult}>{activity.result}</span>
                    </div>
                    <span className={styles.activityTime}>{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className={styles.achievementsGrid}>
              {achievements.map((achievement, index) => (
                <div key={index} className={styles.achievementCard}>
                  <div className={styles.achievementIcon}>{achievement.icon}</div>
                  <h4>{achievement.title}</h4>
                  <p>{achievement.description}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={styles.card}>
              <h3>Account Settings</h3>
              <div className={styles.settingsForm}>
                <div className={styles.formGroup}>
                  <label>Display Name</label>
                  <input type="text" value={userData.name || ''} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label>Username</label>
                  <input type="text" value={userData.username || ''} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input type="email" value={userData.email || ''} disabled />
                </div>
                <button className={styles.saveBtn} onClick={handleEditProfile}>
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Image Viewer Modal */}
      {showAvatarModal && getAvatarUrl(userData.avatar) && (
        <div className={styles.avatarModalOverlay} onClick={handleCloseAvatarModal}>
          <div className={styles.avatarModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.avatarModalHeader}>
              {/* <h3>{userData.name || 'User'}'s Profile Picture</h3> */}
              <button 
                className={styles.avatarModalClose}
                onClick={handleCloseAvatarModal}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className={styles.avatarModalBody}>
              <img 
                src={getAvatarUrl(userData.avatar)} 
                alt={userData.name || 'User'} 
                className={styles.avatarModalImage}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
