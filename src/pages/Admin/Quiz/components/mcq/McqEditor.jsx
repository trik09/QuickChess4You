import React from 'react';
import { FaTrash, FaPlus, FaCheckCircle, FaChessBoard, FaFont } from 'react-icons/fa';
import styles from './McqEditor.module.css';

const genId = () => Math.random().toString(36).slice(2, 9);

const McqEditor = ({ formData, setFormData }) => {
  const handleOptionChange = (id, text) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => opt.id === id ? { ...opt, text } : opt)
    }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { id: genId(), text: '', isCorrect: false }]
    }));
  };

  const removeOption = (id) => {
    if (formData.options.length <= 2) return;
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== id)
    }));
  };

  const toggleCorrect = (id) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => ({
        ...opt,
        isCorrect: opt.id === id
      }))
    }));
  };

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <span className={styles.icon}><FaCheckCircle /></span>
        <h3 className={styles.sectionTitle}>Answer Options</h3>
        <button className={styles.addBtn} onClick={addOption} type="button" title="Add Option">
          <FaPlus />
        </button>
      </div>
      
      <div className={styles.optionsList}>
        {formData.options.map((opt, index) => (
          <div key={opt.id} className={`${styles.optionItem} ${opt.isCorrect ? styles.correct : ''}`}>
            <span className={styles.optionLabel}>{String.fromCharCode(65 + index)}</span>
            
            <div className={styles.inputWrapper}>
              <input 
                type="text"
                className={styles.textInput}
                value={opt.text}
                onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                placeholder="Enter option..."
              />
            </div>

            <div className={styles.optionActions}>
              <button 
                className={`${styles.checkBtn} ${opt.isCorrect ? styles.active : ''}`}
                onClick={() => toggleCorrect(opt.id)}
                type="button"
                title="Mark Correct"
              >
                <FaCheckCircle />
              </button>
              <button 
                className={styles.removeBtn} 
                onClick={() => removeOption(opt.id)}
                type="button"
                disabled={formData.options.length <= 2}
                title="Remove"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default McqEditor;
