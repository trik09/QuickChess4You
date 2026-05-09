import React, { useState } from 'react';
import {
  FaRegCheckCircle, FaCog, FaSave, FaInfoCircle,
  FaGripVertical, FaCheckCircle, FaExclamationCircle,
  FaTimes, FaTag, FaSpinner, FaChartLine, FaLayerGroup, FaLink
} from 'react-icons/fa';
import styles from './RightSidebar.module.css';

const RightSidebar = ({
  activeTab,
  mcqType,
  formData,
  setFormData,
  categories = [],
  onSave,
  isSubmitting = false,
  isEditMode = false,
}) => {
  const [tagInput, setTagInput] = useState('');

  const handleSelectAnswer = (selectedIndex) => {
    if (!setFormData) return;
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => ({ ...opt, isCorrect: i === selectedIndex }))
    }));
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (!val) return;
    const currentTags = formData.tags || [];
    if (currentTags.includes(val)) { setTagInput(''); return; }
    setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), val] }));
    setTagInput('');
  };

  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
  };

  const hasRealCategory = formData.category &&
    !String(formData.category).startsWith('mock_');

  const hasQuestion = (formData.questionText || '').trim().length > 0;
  const hasCorrectAnswer = activeTab === 'mcq'
    ? (formData.options || []).some(o => o.isCorrect)
    : (formData.pairs || []).every(p => p.leftItem.trim() && p.correctAnswer.trim());

  const renderAnswersSection = () => (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.icon}><FaCheckCircle /></span>
        <h3 className={styles.sectionTitle}>Answers Summary</h3>
      </div>
      <div className={styles.answerList}>
        {(formData.options || []).map((opt, index) => {
          const letter = String.fromCharCode(65 + index);
          return (
            <div
              key={opt.id || index}
              className={`${styles.answerRow} ${opt.isCorrect ? styles.active : ''}`}
              onClick={() => handleSelectAnswer(index)}
            >
              <div className={styles.answerInfo}>
                <span className={styles.answerLetter}>{letter}</span>
                <span className={styles.answerText}>{opt.text || <em className={styles.empty}>Empty...</em>}</span>
              </div>
              <div className={styles.statusDot} />
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderMatchingSummary = () => (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.icon}><FaLink /></span>
        <h3 className={styles.sectionTitle}>Matching Pairs</h3>
      </div>
      <div className={styles.matchList}>
        {(formData.pairs || []).map((pair, index) => (
          <div key={pair.id || index} className={styles.matchRow}>
            <div className={styles.matchIndex}>{index + 1}</div>
            <div className={styles.matchContent}>
              <div className={styles.matchTop}>{pair.leftItem || <em className={styles.empty}>Empty...</em>}</div>
              <div className={styles.matchBottom}>{pair.correctAnswer || <em className={styles.empty}>No match...</em>}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.sidebar}>
      {activeTab === 'mcq' ? renderAnswersSection() : renderMatchingSummary()}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.icon}><FaCog /></span>
          <h3 className={styles.sectionTitle}>Quiz Settings</h3>
        </div>

        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}><FaLayerGroup /> Category</label>
          <select
            className={styles.selectInput}
            value={formData.category || ''}
            onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">— Select category —</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}><FaChartLine /> Difficulty</label>
          <div className={styles.difficultyGrid}>
            {['Beginner', 'Medium', 'Advanced', 'Grandmaster'].map(diff => (
              <button
                key={diff}
                type="button"
                className={`${styles.diffBtn} ${formData.difficulty === diff ? styles.active : ''} ${styles[diff.toLowerCase()]}`}
                onClick={() => setFormData(p => ({ ...p, difficulty: diff }))}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}><FaTag /> Tags</label>
          <div className={styles.tagInputRow}>
            <input
              type="text"
              className={styles.tagInput}
              placeholder="Press Enter..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
            />
          </div>
          <div className={styles.tagsContainer}>
            {(formData.tags || []).map(tag => (
              <span key={tag} className={styles.tagBadge}>
                {tag}
                <button type="button" onClick={() => removeTag(tag)}><FaTimes /></button>
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={styles.saveBtn}
          onClick={onSave}
          disabled={isSubmitting || !hasQuestion}
        >
          {isSubmitting ? (
            <><FaSpinner className={styles.spin} /> Saving...</>
          ) : (
            <><FaSave /> {isEditMode ? 'Update Quiz' : 'Create Quiz'}</>
          )}
        </button>
      </div>

      <div className={styles.statusCard}>
        <h4 className={styles.statusTitle}>Validation Status</h4>
        <div className={styles.statusList}>
          <div className={`${styles.statusItem} ${hasQuestion ? styles.success : styles.error}`}>
            {hasQuestion ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span>Question text</span>
          </div>
          <div className={`${styles.statusItem} ${hasCorrectAnswer ? styles.success : styles.error}`}>
            {hasCorrectAnswer ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span>{activeTab === 'mcq' ? 'Correct answer marked' : 'All pairs complete'}</span>
          </div>
          <div className={`${styles.statusItem} ${hasRealCategory ? styles.success : styles.error}`}>
            {hasRealCategory ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span>Category selected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
