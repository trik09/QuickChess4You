import React, { useState } from 'react';
import styles from './faq.module.css';
import FaqItem from './FaqItem';

const faqs = [
  {
    question: "How many classes are there per week?",
    answer: "There will be 8 classes per month (twice a week). Additionally, 8 practice sessions per month to provide kids with an opportunity to play against different levels of players, enhancing their learning experience."
  },
  {
    question: "What are the class timings?",
    answer: "Classes will be scheduled on weekends in the mornings (9AM - 1PM) and on weekdays in the evenings (after 6 PM). You can choose a batch that suits your convenience as there will be 2-3 different batches available."
  },
  {
    question: "What is the fee structure?",
    answer: "The fee is INR 2500/- per month. Payment should be done in the first week."
  },
  {
    question: "Is there any registration fee?",
    answer: "A one time registration fee of INR 500/- to be paid at the time of enrollment along with the first month's fee."
  },
  {
    question: "Will there be a demo session before joining the class?",
    answer: "Yes, the first demo session is on Saturday Morning, March 15th, for those starting immediately. Additional sessions are scheduled for March 22nd and 29th for those joining later."
  },
  {
    question: "What is the ideal age to start learning chess?",
    answer: "While some children can start at 4, group classes are recommended from ages 6 or 7 onwards."
  },
  {
    question: "How many students are in each batch?",
    answer: "Each batch consists of approximately 8 students, ensuring personalized attention."
  },
  {
    question: "Are there assignments after every class?",
    answer: "Yes, students will receive assignments relevant to the topics covered in class, which should be completed before the next session."
  },
  {
    question: "When will kids be ready for tournaments?",
    answer: "It depends on the child's progress. On average, beginners take about a year. The journey includes learning chess rules, mastering checkmates, understanding openings, endgames and gaining tournament experience."
  },
  {
    question: "If kids miss a class, will there be a compensation?",
    answer: "If the coach misses a class, it will be compensated with an additional session. If a student misses a class, no compensation will be provided, but the concepts will be reviewed and assignments will be shared."
  }
];

const FaqSection = () => {
  const [activeIndex, setActiveIndex] = useState(0); // First item expanded by default
  const [showAll, setShowAll] = useState(false);

  const displayedFaqs = showAll ? faqs : faqs.slice(0, 4);

  const handleToggle = (index) => {
    setActiveIndex(activeIndex === index ? -1 : index);
  };

  return (
    <section className={styles.faqSection}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.subtitle}>Trusted By</h2>
          <h1 className={styles.title}>Frequently Asked Questions</h1>
        </div>

        <div className={styles.faqList}>
          {displayedFaqs.map((faq, index) => (
            <FaqItem
              key={index}
              id={index}
              question={faq.question}
              answer={faq.answer}
              isActive={activeIndex === index}
              onClick={() => handleToggle(index)}
            />
          ))}
        </div>

        {faqs.length > 4 && (
          <div className={styles.buttonContainer}>
            <button 
              className={styles.toggleButton}
              onClick={() => setShowAll(!showAll)}
              aria-expanded={showAll}
            >
              {showAll ? 'Show Less' : 'View All FAQs'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FaqSection;
