import React from 'react';
import styles from './faq.module.css';

const FaqItem = ({ question, answer, isActive, onClick, id }) => {
  return (
    <div className={`${styles.faqItem} ${isActive ? styles.active : ''}`}>
      <div 
        className={styles.questionContainer} 
        onClick={onClick}
        role="button"
        aria-expanded={isActive}
        aria-controls={`faq-answer-${id}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <h3 className={styles.questionText}>{question}</h3>
        <div className={styles.iconWrapper}>
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" />
          </svg>
        </div>
      </div>
      <div 
        className={styles.answerContainer}
        id={`faq-answer-${id}`}
        role="region"
        aria-labelledby={`faq-question-${id}`}
      >
        <div className={styles.answerContent}>
          <p className={styles.answerText}>{answer}</p>
        </div>
      </div>
    </div>
  );
};

export default FaqItem;
