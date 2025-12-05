import { useTheme } from '../../contexts/ThemeContext';
import styles from './ThemeModal.module.css';

// Import piece previews
import whiteKnight1 from '../../assets/pieces/whiteknight.svg';
import whiteKnight2 from '../../assets/pieces2/whiteknight.svg';
import whiteKnight3 from '../../assets/pieces3/whiteknight.svg';

function ThemeModal({ isOpen, onClose }) {
  const { 
    boardTheme, 
    setBoardTheme, 
    pieceSet, 
    setPieceSet, 
    boardThemes, 
    pieceSets 
  } = useTheme();

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>⚙️ Customize Board</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          {/* Board Theme Section */}
          <div className={styles.section}>
            <h3>Board Theme</h3>
            <div className={styles.themeGrid}>
              {Object.entries(boardThemes).map(([key, theme]) => (
                <div
                  key={key}
                  className={`${styles.themeCard} ${boardTheme === key ? styles.active : ''}`}
                  onClick={() => setBoardTheme(key)}
                >
                  <div className={styles.boardPreview}>
                    <div 
                      className={styles.square} 
                      style={{ backgroundColor: theme.light }}
                    />
                    <div 
                      className={styles.square} 
                      style={{ backgroundColor: theme.dark }}
                    />
                    <div 
                      className={styles.square} 
                      style={{ backgroundColor: theme.dark }}
                    />
                    <div 
                      className={styles.square} 
                      style={{ backgroundColor: theme.light }}
                    />
                  </div>
                  <span className={styles.themeName}>{theme.name}</span>
                  {boardTheme === key && (
                    <div className={styles.checkmark}>✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Piece Set Section */}
          <div className={styles.section}>
            <h3>Piece Style</h3>
            <div className={styles.pieceGrid}>
              <div
                className={`${styles.pieceCard} ${pieceSet === 'default' ? styles.active : ''}`}
                onClick={() => setPieceSet('default')}
              >
                <div className={styles.piecePreview}>
                  <img src={whiteKnight1} alt="Classic pieces" className={styles.pieceImg} />
                </div>
                <span className={styles.pieceName}>Classic</span>
                {pieceSet === 'default' && (
                  <div className={styles.checkmark}>✓</div>
                )}
              </div>

              <div
                className={`${styles.pieceCard} ${pieceSet === 'modern' ? styles.active : ''}`}
                onClick={() => setPieceSet('modern')}
              >
                <div className={styles.piecePreview}>
                  <img src={whiteKnight2} alt="Modern pieces" className={styles.pieceImg} />
                </div>
                <span className={styles.pieceName}>Modern</span>
                {pieceSet === 'modern' && (
                  <div className={styles.checkmark}>✓</div>
                )}
              </div>

              <div
                className={`${styles.pieceCard} ${pieceSet === 'elegant' ? styles.active : ''}`}
                onClick={() => setPieceSet('elegant')}
              >
                <div className={styles.piecePreview}>
                  <img src={whiteKnight3} alt="Elegant pieces" className={styles.pieceImg} />
                </div>
                <span className={styles.pieceName}>Elegant</span>
                {pieceSet === 'elegant' && (
                  <div className={styles.checkmark}>✓</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.applyBtn} onClick={onClose}>
            Apply Changes
          </button>
        </div>
      </div>
    </>
  );
}

export default ThemeModal;
