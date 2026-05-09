import React from 'react';
import { FaPlus, FaTrash, FaLink, FaInfoCircle } from 'react-icons/fa';
import styles from './ColumnMatching.module.css';

const genId = () => Math.random().toString(36).slice(2, 9);

const ColumnMatching = ({ formData, setFormData }) => {
  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newPairs = [...prev.pairs];
      newPairs[index] = { ...newPairs[index], [field]: value };
      return { ...prev, pairs: newPairs };
    });
  };

  const handleAddPair = () => {
    if (formData.pairs.length >= 12) return;
    setFormData(prev => ({
      ...prev,
      pairs: [...prev.pairs, { id: genId(), leftItem: '', rightItem: '', correctAnswer: '' }]
    }));
  };

  const handleRemovePair = (id) => {
    if (formData.pairs.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      pairs: prev.pairs.filter(p => p.id !== id)
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <FaLink className={styles.mainIcon} />
          <div>
            <h3 className={styles.title}>Matching Configuration</h3>
            <p className={styles.subtitle}>Define pairs with custom display labels</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={handleAddPair} type="button">
          <FaPlus /> Add Pair
        </button>
      </div>

      <div className={styles.hintBox}>
        <FaInfoCircle />
        <span><strong>Left Item:</strong> Base item. <strong>Display Right:</strong> What student sees. <strong>Correct Ans:</strong> Reference/Verification.</span>
      </div>

      <div className={styles.pairsGrid}>
        {formData.pairs.map((pair, index) => (
          <div key={pair.id} className={styles.pairCard}>
            <div className={styles.pairHeader}>
              <span className={styles.pairIndex}>#{index + 1}</span>
              <button 
                className={styles.deleteBtn} 
                onClick={() => handleRemovePair(pair.id)}
                type="button"
                title="Remove pair"
              >
                <FaTrash />
              </button>
            </div>
            
            <div className={styles.cardInputs}>
              <div className={styles.inputGroup}>
                <label>Left Box</label>
                <input
                  value={pair.leftItem}
                  onChange={(e) => handleItemChange(index, 'leftItem', e.target.value)}
                  placeholder="e.g. A"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Display Box</label>
                <input
                  value={pair.rightItem}
                  onChange={(e) => handleItemChange(index, 'rightItem', e.target.value)}
                  placeholder="e.g. 2"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.correctLabel}>Correct Ans</label>
                <input
                  className={styles.correctInput}
                  value={pair.correctAnswer}
                  onChange={(e) => handleItemChange(index, 'correctAnswer', e.target.value)}
                  placeholder="e.g. 1"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColumnMatching;
