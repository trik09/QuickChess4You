import { useState } from 'react';
import styles from './Profile.module.css';

function Profile() {
  const [activeTab, setActiveTab] = useState('overview');

  // Static user data for demo
  const userData = {
    name: 'Chess Master',
    username: '@chessmaster',
    email: 'player@quickchess.com',
    joinDate: 'January 2025',
    avatar: null,
    rating: 1850,
    rank: 'Expert',
    country: 'India'
  };

  const stats = {
    puzzlesSolved: 245,
    accuracy: 87,
    currentStreak: 12,
    bestStreak: 28,
    totalGames: 156,
    wins: 98,
    draws: 32,
    losses: 26
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
    { icon: '⭐', title: 'Expert', description: 'Reached Expert rating' }
  ];

  return (
    <div className={styles.container}>
      {/* Navbar Removed */}


      <div className={styles.content}>
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.headerContent}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                {userData.avatar ? (
                  <img src={userData.avatar} alt={userData.name} />
                ) : (
                  <span className={styles.avatarPlaceholder}>
                    {userData.name.charAt(0)}
                  </span>
                )}
              </div>
              <button className={styles.editAvatarBtn}>📷</button>
            </div>

            <div className={styles.userInfo}>
              <h1 className={styles.userName}>{userData.name}</h1>
              <p className={styles.username}>{userData.username}</p>
              <div className={styles.badges}>
                <span className={styles.badge}>{userData.rank}</span>
                <span className={styles.badge}>⭐ {userData.rating}</span>
                <span className={styles.badge}>🌍 {userData.country}</span>
              </div>
            </div>

            <button className={styles.editProfileBtn}>Edit Profile</button>
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
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statValue}>{stats.accuracy}%</div>
            <div className={styles.statLabel}>Accuracy</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔥</div>
            <div className={styles.statValue}>{stats.currentStreak}</div>
            <div className={styles.statLabel}>Current Streak</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statValue}>{stats.wins}</div>
            <div className={styles.statLabel}>Wins</div>
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
                    <strong>{userData.joinDate}</strong>
                  </div>
                  <div className={styles.infoItem}>
                    <span>Rating</span>
                    <strong>{userData.rating}</strong>
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
                  <input type="text" defaultValue={userData.name} />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input type="email" defaultValue={userData.email} />
                </div>
                <div className={styles.formGroup}>
                  <label>Country</label>
                  <input type="text" defaultValue={userData.country} />
                </div>
                <button className={styles.saveBtn}>Save Changes</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
