import React from 'react';
import { FaListUl, FaGripLines } from 'react-icons/fa';
import styles from './QuizTabs.module.css';

const QuizTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className={styles.tabsContainer}>
      <button 
        className={`${styles.tab} ${activeTab === 'mcq' ? styles.active : ''}`}
        onClick={() => setActiveTab('mcq')}
        type="button"
      >
        <FaListUl className={styles.tabIcon} /> Multiple Choice (MCQ)
      </button>
      <button 
        className={`${styles.tab} ${activeTab === 'column_matching' ? styles.active : ''}`}
        onClick={() => setActiveTab('column_matching')}
        type="button"
      >
        <FaGripLines className={styles.tabIcon} /> Column Matching
      </button>
    </div>
  );
};

export default QuizTabs;
