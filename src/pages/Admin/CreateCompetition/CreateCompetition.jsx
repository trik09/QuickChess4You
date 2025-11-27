import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaClock, FaUsers, FaCalendar, FaChess } from 'react-icons/fa';
import styles from './CreateCompetition.module.css';

function CreateCompetition() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    duration: '',
    maxPlayers: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Competition created successfully!');
    navigate('/admin/competitions');
  };

  return (
    <div className={styles.createCompetition}>
      <div className={styles.header}>
        <h2><FaTrophy /> Create New Competition</h2>
        <p>Set up a new chess competition</p>
      </div>

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label><FaTrophy /> Competition Name</label>
            <input
              type="text"
              placeholder="Enter competition name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label><FaCalendar /> Start Date & Time</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label><FaClock /> Duration (hours)</label>
              <input
                type="number"
                placeholder="2"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label><FaUsers /> Maximum Players</label>
            <input
              type="number"
              placeholder="100"
              value={formData.maxPlayers}
              onChange={(e) => setFormData({...formData, maxPlayers: e.target.value})}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label><FaChess /> Description</label>
            <textarea
              rows="4"
              placeholder="Enter competition description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => navigate('/admin/competitions')}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Create Competition
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCompetition;
