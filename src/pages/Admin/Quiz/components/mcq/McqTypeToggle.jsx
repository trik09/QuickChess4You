import React from 'react';
import styles from './McqTypeToggle.module.css';

const McqTypeToggle = ({ mcqType, setMcqType }) => {
  return (
    <div className={styles.toggleContainer}>
      <span className={styles.toggleLabel}>MCQ TYPE</span>
      <div className={styles.radioGroup}>
        <label className={styles.radioLabel}>
          <input 
            type="radio" 
            name="mcqType" 
            value="board" 
            className={styles.radioInput}
            checked={mcqType === 'board'}
            onChange={() => setMcqType('board')}
          />
          Board-Based MCQ
        </label>
        <label className={styles.radioLabel}>
          <input 
            type="radio" 
            name="mcqType" 
            value="text" 
            className={styles.radioInput}
            checked={mcqType === 'text'}
            onChange={() => setMcqType('text')}
          />
          Text-Based MCQ
        </label>
      </div>
    </div>
  );
};

export default McqTypeToggle;
