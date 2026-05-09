import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { FaCamera } from 'react-icons/fa';
import styles from './EditProfile.module.css';

// Helper function to construct avatar URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  const baseUrl = apiBaseUrl.replace('/api', '');
  return `${baseUrl}/${avatarPath}`;
};

// Username format: 3–20 chars, letters/numbers/underscores only
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

function EditProfile() {
  const navigate = useNavigate();
  const { user: contextUser, userLogin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    username: ''
  });

  // Username availability state
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid' | 'unchanged'
  const [usernameMessage, setUsernameMessage] = useState('');
  const debounceTimer = useRef(null);

  // Initialize form with user data
  useEffect(() => {
    if (contextUser) {
      setFormData({
        name: contextUser.name || '',
        username: contextUser.username || ''
      });
      if (contextUser.avatar) {
        setAvatarPreview(getAvatarUrl(contextUser.avatar));
      }
    }
  }, [contextUser]);

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');

    if (name === 'username') {
      const trimmed = value.trim();

      // Clear previous debounce
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      // Same as current username — no need to check
      if (trimmed === (contextUser?.username || '')) {
        setUsernameStatus('unchanged');
        setUsernameMessage('');
        return;
      }

      if (!trimmed) {
        setUsernameStatus(null);
        setUsernameMessage('');
        return;
      }

      // Validate format immediately
      if (!USERNAME_REGEX.test(trimmed)) {
        setUsernameStatus('invalid');
        setUsernameMessage('3–20 characters, letters, numbers, and underscores only');
        return;
      }

      // Debounce the availability check
      setUsernameStatus('checking');
      setUsernameMessage('Checking availability...');
      debounceTimer.current = setTimeout(async () => {
        try {
          const result = await authAPI.checkUsername(trimmed);
          if (result.available) {
            setUsernameStatus('available');
            setUsernameMessage('Username is available');
          } else {
            setUsernameStatus('taken');
            setUsernameMessage(result.message || 'Username is already taken');
          }
        } catch {
          setUsernameStatus(null);
          setUsernameMessage('');
        }
      }, 500);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = formData.username.trim();
    const trimmedName = formData.name.trim();

    // Block submit if username format is invalid
    if (trimmedUsername && !USERNAME_REGEX.test(trimmedUsername)) {
      setError('Username must be 3–20 characters and contain only letters, numbers, or underscores');
      return;
    }

    // Block submit if username is known to be taken
    if (usernameStatus === 'taken') {
      setError('That username is already taken. Please choose a different one.');
      return;
    }

    // Block submit while availability is still being checked
    if (usernameStatus === 'checking') {
      setError('Please wait while we check username availability.');
      return;
    }

    if (!trimmedName && !trimmedUsername && !selectedAvatar) {
      setError('Please make at least one change to save');
      return;
    }

    setLoading(true);
    try {
      const updateData = {};
      if (trimmedName) updateData.name = trimmedName;
      if (trimmedUsername) updateData.username = trimmedUsername;

      const response = await authAPI.updateUser(updateData, selectedAvatar);

      if (response.user) {
        userLogin(response.user, localStorage.getItem('token'));
        navigate('/profile');
      }
    } catch (err) {
      // Surface the backend error message clearly
      const msg = err.message || '';
      if (msg.toLowerCase().includes('username')) {
        setError('That username is already taken. Please choose a different one.');
        setUsernameStatus('taken');
        setUsernameMessage('Username is already taken');
      } else {
        setError(msg || 'Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/profile');
  };

  // Determine username input border style
  const getUsernameInputStyle = () => {
    if (usernameStatus === 'available') return { borderColor: '#22c55e' };
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') return { borderColor: '#ef4444' };
    return {};
  };

  const getUsernameHintStyle = () => {
    if (usernameStatus === 'available') return { color: '#22c55e' };
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') return { color: '#ef4444' };
    return { color: '#a0a0a0' };
  };

  const isSaveDisabled = loading || usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking';

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Edit Profile</h1>
          <p>Update your profile information</p>
        </div>

        <div className={styles.card}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Avatar Section */}
            <div className={styles.avatarSection}>
              <label className={styles.avatarLabel}>Profile Picture</label>
              <div className={styles.avatarContainer}>
                <div className={styles.avatar}>
                  {avatarPreview || getAvatarUrl(contextUser?.avatar) ? (
                    <img
                      src={avatarPreview || getAvatarUrl(contextUser?.avatar)}
                      alt={contextUser?.name || 'User'}
                    />
                  ) : (
                    <span className={styles.avatarPlaceholder}>
                      {(contextUser?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <label htmlFor="avatar-upload" className={styles.avatarUploadBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <FaCamera /> Change Photo
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                </label>
                {selectedAvatar && (
                  <p className={styles.avatarHint}>New photo selected</p>
                )}
              </div>
            </div>

            {/* Name Field */}
            <div className={styles.formGroup}>
              <label htmlFor="name">Display Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your display name"
                required
              />
            </div>

            {/* Username Field */}
            <div className={styles.formGroup}>
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                required
                style={getUsernameInputStyle()}
              />
              {usernameMessage && (
                <small style={getUsernameHintStyle()}>
                  {usernameStatus === 'checking' ? '⏳ ' : usernameStatus === 'available' ? '✓ ' : '✗ '}
                  {usernameMessage}
                </small>
              )}
              {!usernameMessage && (
                <small className={styles.hint}>3–20 characters, letters, numbers, and underscores only</small>
              )}
            </div>

            {/* Email Field (Read-only) */}
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={contextUser?.email || ''}
                disabled
                className={styles.disabledInput}
              />
              <small className={styles.hint}>Email cannot be changed</small>
            </div>

            {/* Action Buttons */}
            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={handleCancel}
                className={styles.cancelBtn}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={isSaveDisabled}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
