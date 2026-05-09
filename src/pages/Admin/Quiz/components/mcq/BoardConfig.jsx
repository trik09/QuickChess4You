import React, { useState, useEffect, useCallback, memo } from 'react';
import { FaChessBoard, FaExpandAlt, FaTrash, FaSync } from 'react-icons/fa';
import { Chess } from 'chess.js';
import ChessBoard from '../../../../../components/ChessBoard/ChessBoard';
import styles from './BoardConfig.module.css';

import whitePawn from '../../../../../assets/pieces/whitepawn.svg';
import whiteKnight from '../../../../../assets/pieces/whiteknight.svg';
import whiteBishop from '../../../../../assets/pieces/whitebishop.svg';
import whiteRook from '../../../../../assets/pieces/whiterook.svg';
import whiteQueen from '../../../../../assets/pieces/whitequeen.svg';
import whiteKing from '../../../../../assets/pieces/whiteking.svg';
import blackPawn from '../../../../../assets/pieces/blackpawn.svg';
import blackKnight from '../../../../../assets/pieces/blackknight.svg';
import blackBishop from '../../../../../assets/pieces/blackbishop.svg';
import blackRook from '../../../../../assets/pieces/blackrook.svg';
import blackQueen from '../../../../../assets/pieces/blackqueen.svg';
import blackKing from '../../../../../assets/pieces/blackking.svg';

const BoardConfig = memo(({ formData, setFormData }) => {
  const [setupMode, setSetupMode] = useState('manual'); // 'manual' | 'fen'
  const [editorState, setEditorState] = useState({});

  useEffect(() => {
    // Initialize editor state from FEN if possible when switching to manual mode
    if (setupMode === 'manual' && formData.fen) {
      try {
        const chess = new Chess(formData.fen);
        const board = chess.board();
        const newState = {};
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        board.forEach((row, rIdx) => {
          row.forEach((piece, cIdx) => {
            if (piece) {
              const sq = `${files[cIdx]}${8 - rIdx}`;
              newState[sq] = { type: piece.type, color: piece.color };
            }
          });
        });
        setEditorState(newState);
      } catch (e) {
        setEditorState({});
      }
    }
  }, [setupMode]);

  const getPieceImage = (type, color) => {
    const pieceMap = {
      p: { w: whitePawn, b: blackPawn },
      n: { w: whiteKnight, b: blackKnight },
      b: { w: whiteBishop, b: blackBishop },
      r: { w: whiteRook, b: blackRook },
      q: { w: whiteQueen, b: blackQueen },
      k: { w: whiteKing, b: blackKing },
    };
    return pieceMap[type]?.[color] || null;
  };

  const updateFenFromEditor = useCallback((state) => {
    const chess = new Chess();
    chess.clear();
    Object.entries(state).forEach(([sq, piece]) => {
      try {
        chess.put({ type: piece.type, color: piece.color }, sq);
      } catch (e) {}
    });
    setFormData(prev => ({ ...prev, fen: chess.fen() }));
  }, [setFormData]);

  const clearEditor = () => {
    setEditorState({});
    updateFenFromEditor({});
  };

  const handlePaletteDragStart = useCallback((e, type, value, color, sourceSquare = null) => {
    e.dataTransfer.setData('type', type);
    e.dataTransfer.setData('value', value);
    if (color) e.dataTransfer.setData('color', color);
    if (sourceSquare) e.dataTransfer.setData('sourceSquare', sourceSquare);
    e.dataTransfer.effectAllowed = 'copyMove';
  }, []);

  const handleBoardDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleBoardDrop = (e, square) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const value = e.dataTransfer.getData('value');
    const color = e.dataTransfer.getData('color');
    const sourceSquare = e.dataTransfer.getData('sourceSquare');

    if (!type || !value) return;

    if (setupMode === 'manual') {
      if (type === 'piece') {
        const newEditorState = { ...editorState };
        if (sourceSquare && sourceSquare !== square) {
          delete newEditorState[sourceSquare];
        }
        newEditorState[square] = { type: value, color };
        setEditorState(newEditorState);
        updateFenFromEditor(newEditorState);
      } else if (type === 'trash') {
        const newEditorState = { ...editorState };
        delete newEditorState[square];
        setEditorState(newEditorState);
        updateFenFromEditor(newEditorState);
      }
    }
  };

  const handleSquareClick = (square) => {
    if (setupMode === 'manual') {
      const newEditorState = { ...editorState };
      if (newEditorState[square]) {
        delete newEditorState[square];
        setEditorState(newEditorState);
        updateFenFromEditor(newEditorState);
      }
    }
  };
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <FaChessBoard className={styles.icon} />
          <h3 className={styles.title}>Board Configuration</h3>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.actionBtn + ' ' + styles.expandBtn}>
            <FaExpandAlt /> Fullscreen
          </button>
          <button type="button" className={styles.actionBtn + ' ' + styles.clearBtn} onClick={clearEditor}>
            <FaTrash /> Clear Board
          </button>
        </div>
      </div>

      <div className={styles.boardGrid}>
        <div className={styles.boardWrapper}>
          {setupMode === 'fen' ? (
            <ChessBoard 
               fen={formData.fen}
               interactive={false}
            />
          ) : (
            <div className={styles.chessboard}>
              {[8, 7, 6, 5, 4, 3, 2, 1].map((rank, rankIndex) => (
                <div key={rank} className={styles.row}>
                  {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file, fileIndex) => {
                    const squareName = `${file}${rank}`;
                    const isLight = (rankIndex + fileIndex) % 2 === 0;
                    const piece = editorState[squareName];
                    return (
                      <div
                        key={file}
                        className={`${styles.square} ${isLight ? styles.light : styles.dark} ${styles.interactiveSquare}`}
                        onClick={() => handleSquareClick(squareName)}
                        onDragOver={handleBoardDragOver}
                        onDrop={(e) => handleBoardDrop(e, squareName)}
                      >
                        {piece && (
                          <img
                            src={getPieceImage(piece.type, piece.color)}
                            alt={`${piece.color}${piece.type}`}
                            className={styles.piece}
                            draggable
                            onDragStart={(e) => handlePaletteDragStart(e, 'piece', piece.type, piece.color, squareName)}
                          />
                        )}
                        {fileIndex === 0 && (
                          <div
                            className={styles.rankLabel}
                            style={{ color: isLight ? '#b58863' : '#f0d9b5' }}
                          >
                            {rank}
                          </div>
                        )}
                        {rankIndex === 7 && (
                          <div
                            className={styles.fileLabel}
                            style={{ color: isLight ? '#b58863' : '#f0d9b5' }}
                          >
                            {file}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.configPanel}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={setupMode === 'manual'}
              onChange={() => setSetupMode(setupMode === 'manual' ? 'fen' : 'manual')} 
            />
            Manually Place Pieces (Drag & Drop)
          </label>
          
          <div className={styles.pieceSelectorBox} style={{ opacity: setupMode === 'manual' ? 1 : 0.5, pointerEvents: setupMode === 'manual' ? 'auto' : 'none' }}>
            {['p', 'n', 'b', 'r', 'q', 'k'].map(p => (
              <div 
                key={`w${p}`} 
                className={styles.pieceBtn}
                draggable
                onDragStart={(e) => handlePaletteDragStart(e, 'piece', p, 'w')}
              >
                <img src={getPieceImage(p, 'w')} alt={p} style={{ width: '80%', height: '80%' }} />
              </div>
            ))}
            {['p', 'n', 'b', 'r', 'q', 'k'].map(p => (
              <div 
                key={`b${p}`} 
                className={styles.pieceBtn}
                draggable
                onDragStart={(e) => handlePaletteDragStart(e, 'piece', p, 'b')}
              >
                <img src={getPieceImage(p, 'b')} alt={p} style={{ width: '80%', height: '80%' }} />
              </div>
            ))}
            <div 
                className={styles.pieceBtn}
                draggable
                title="Trash"
                onDragStart={(e) => handlePaletteDragStart(e, 'trash', 'trash', null)}
                style={{ background: '#ffeeee', borderColor: '#cc3333', color: '#cc3333' }}
              >
                <FaTrash />
            </div>
          </div>

          <label className={styles.checkboxLabel} style={{ marginTop: '16px' }}>
            <input 
              type="checkbox" 
              checked={setupMode === 'fen'}
              onChange={() => setSetupMode(setupMode === 'fen' ? 'manual' : 'fen')} 
            />
            Enter FEN String
          </label>

          <div className={styles.rowInputs} style={{ opacity: setupMode === 'fen' ? 1 : 0.5, pointerEvents: setupMode === 'fen' ? 'auto' : 'none' }}>
             <input 
               type="text" 
               className={styles.textInput}
               value={formData.fen}
               onChange={(e) => setFormData(p => ({...p, fen: e.target.value}))}
               placeholder="FEN string"
             />
             <button type="button" className={styles.loadBtn}>
                <FaSync /> Load
             </button>
          </div>
        </div>
      </div>
    </div>
  );
});

BoardConfig.displayName = 'BoardConfig';

export default BoardConfig;
