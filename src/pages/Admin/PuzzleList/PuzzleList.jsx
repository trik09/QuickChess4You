import { useEffect, useState, useRef, useCallback } from 'react';
import { FaEye, FaEdit, FaTrash, FaChess, FaFilter, FaLayerGroup, FaUpload, FaDownload, FaSignal } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, SearchBar, FilterSelect, Button, DataTable, Badge, IconButton } from '../../../components/Admin';
import { adminAPI, categoryAPI } from '../../../services/api';
import ChessBoard from '../../../components/ChessBoard/ChessBoard';
import styles from './PuzzleList.module.css';

const ITEMS_PER_PAGE = 20;

function PuzzleList() {
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || '');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  const [puzzles, setPuzzles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryOptions, setCategoryOptions] = useState([{ value: '', label: 'All Categories' }]);

  // Server-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showPreview, setShowPreview] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleteSelectedConfirm, setDeleteSelectedConfirm] = useState(false);
  const [selectedPuzzles, setSelectedPuzzles] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef(null);

  // Debounce search
  const searchDebounceRef = useRef(null);

  const fetchPuzzles = useCallback(async (page, search, category, difficulty, level) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await adminAPI.getPuzzles({ page, limit: ITEMS_PER_PAGE, search, category, difficulty, level });
      const raw = response.puzzles || [];
      const normalized = raw.map((puzzle, index) => ({
        ...puzzle,
        id: ((page - 1) * ITEMS_PER_PAGE + index + 1).toString().padStart(6, '0'),
        title: puzzle.title || `Puzzle #${index + 1}`,
        difficulty: puzzle.difficulty || 'Unknown',
        category: puzzle.category || 'General',
        level: puzzle.level || '',
        createdAt: puzzle.createdAt || puzzle.updatedAt || '',
      }));
      setPuzzles(normalized);
      setTotalRecords(response.pagination?.totalRecords || 0);
      setTotalPages(response.pagination?.total || 1);
    } catch (err) {
      console.error('Failed to load puzzles:', err);
      setError(err.message || 'Unable to load puzzles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on page or filter change
  useEffect(() => {
    fetchPuzzles(currentPage, searchTerm, filterCategory, filterDifficulty, filterLevel);
  }, [currentPage, filterCategory, filterDifficulty, filterLevel]);

  // Debounce search input
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchPuzzles(1, searchTerm, filterCategory, filterDifficulty, filterLevel);
    }, 400);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterDifficulty, filterLevel]);

  // Load categories once
  useEffect(() => {
    categoryAPI.getAll(false).then(data => {
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setCategoryOptions([{ value: '', label: 'All Categories' }, ...list.map(c => ({ value: c.name.toLowerCase(), label: c.name }))]);
    }).catch(() => {});
  }, []);

  const handleFilterChange = (setter) => (val) => {
    setter(val === 'all' ? '' : val);
    setCurrentPage(1);
  };

  const handlePreview = (puzzle) => { setSelectedPuzzle(puzzle); setShowPreview(true); };
  const handleDelete = (puzzle) => setDeleteConfirm(puzzle);

  const handleSelectAll = (e) => {
    setSelectedPuzzles(e.target.checked ? puzzles.map(p => p._id) : []);
  };
  const handleSelectPuzzle = (id) => {
    setSelectedPuzzles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (!Array.isArray(json)) { alert('Invalid JSON: Root must be an array of puzzles.'); return; }
        if (confirm(`Ready to import ${json.length} puzzles?`)) {
          setIsImporting(true);
          const response = await adminAPI.bulkCreatePuzzles(json);
          setIsImporting(false);
          alert(response.message || 'Import successful!');
          if (response.results?.failed > 0) {
            console.error('Import errors:', response.results.errors);
            alert(`Import finished with ${response.results.failed} errors. Check console for details.`);
          }
          fetchPuzzles(currentPage, searchTerm, filterCategory, filterDifficulty, filterLevel);
        }
      } catch (err) {
        alert('Failed to parse JSON file: ' + err.message);
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const data = await adminAPI.exportPuzzles();
      if (!data || data.length === 0) { alert("No puzzles to export."); setIsLoading(false); return; }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `puzzles_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsLoading(false);
    } catch (error) {
      alert("Failed to export puzzles.");
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm?._id) return;
    try {
      await adminAPI.deletePuzzle(deleteConfirm._id);
      alert(`Puzzle "${deleteConfirm.title}" deleted successfully!`);
      fetchPuzzles(currentPage, searchTerm, filterCategory, filterDifficulty, filterLevel);
    } catch (err) {
      alert(err.message || 'Failed to delete puzzle');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const confirmDeleteAll = async () => {
    try {
      setIsLoading(true);
      const result = await adminAPI.deleteAllPuzzles();
      alert(result.message || 'All puzzles deleted successfully!');
      setCurrentPage(1);
      fetchPuzzles(1, searchTerm, filterCategory, filterDifficulty, filterLevel);
    } catch (err) {
      alert(err.message || 'Failed to delete all puzzles');
    } finally {
      setDeleteAllConfirm(false);
      setIsLoading(false);
    }
  };

  const confirmDeleteSelected = async () => {
    try {
      setIsLoading(true);
      const result = await adminAPI.deleteMultiplePuzzles(selectedPuzzles);
      alert(result.message || 'Selected puzzles deleted successfully!');
      setSelectedPuzzles([]);
      fetchPuzzles(currentPage, searchTerm, filterCategory, filterDifficulty, filterLevel);
    } catch (err) {
      alert(err.message || 'Failed to delete selected puzzles');
    } finally {
      setDeleteSelectedConfirm(false);
      setIsLoading(false);
    }
  };

  const handleValidatePuzzles = async () => {
    setIsValidating(true);
    try {
      const result = await adminAPI.validatePuzzles();
      if (result.total === 0) {
        alert(result.message || 'All puzzles are already validated.');
      } else {
        setValidationResult(result);
      }
    } catch (err) {
      alert('Validation failed: ' + err.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDeleteInvalid = async () => {
    if (!validationResult?.invalid?.length) return;
    const ids = validationResult.invalid.map(p => p._id);
    try {
      const result = await adminAPI.deleteInvalidPuzzles(ids);
      alert(result.message);
      setValidationResult(null);
      fetchPuzzles(currentPage, searchTerm, filterCategory, filterDifficulty, filterLevel);
    } catch (err) {
      alert('Failed to delete invalid puzzles: ' + err.message);
    }
  };

  const difficultyOptions = [
    { value: 'all', label: 'All Difficulties' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];

  const levelOptions = [
    { value: 'all', label: 'All Levels' },
    ...Array.from({ length: 7 }, (_, i) => ({ value: String(i + 1), label: `Level ${i + 1}` })),
  ];

  const columns = [
    {
      key: 'select',
      label: (
        <input type="checkbox"
          checked={puzzles.length > 0 && selectedPuzzles.length === puzzles.length}
          onChange={handleSelectAll}
          title="Select all on this page"
        />
      ),
      width: '40px',
      render: (_, row) => (
        <input type="checkbox" checked={selectedPuzzles.includes(row._id)} onChange={() => handleSelectPuzzle(row._id)} />
      )
    },
    { key: 'id', label: 'ID', width: '80px', render: (id) => `#${id}` },
    { key: 'title', label: 'Title' },
    {
      key: 'fen', label: 'FEN',
      render: (fen) => (
        <span title={fen} style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '120px' }}>
          {fen ? (fen.length > 15 ? `${fen.substring(0, 6)}...${fen.substring(fen.length - 6)}` : fen) : '—'}
        </span>
      ),
    },
    {
      key: 'difficulty', label: 'Difficulty',
      render: (difficulty) => {
        const n = (difficulty || '').toString();
        const label = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
        const variantMap = { easy: 'success', medium: 'warning', hard: 'danger', expert: 'info' };
        return <Badge variant={variantMap[n.toLowerCase()] || 'secondary'}>{label || 'Unknown'}</Badge>;
      },
    },
    { key: 'category', label: 'Category' },
    { key: 'level', label: 'Level', render: (lvl) => lvl ? `Lvl ${lvl}` : '—' },
    { key: 'createdAt', label: 'Created At', render: (v) => v ? new Date(v).toLocaleString() : '—' },
  ];

  return (
    <div className={styles.puzzleList}>
      {isLoading && puzzles.length === 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #444', borderTop: '4px solid #a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#fff', fontSize: '1rem', margin: 0 }}>Loading puzzles, please wait...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {isImporting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #444', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#fff', fontSize: '1rem', margin: 0 }}>Importing puzzles, please wait...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {isValidating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #444', borderTop: '4px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#fff', fontSize: '1rem', margin: 0 }}>Validating puzzles, please wait...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <PageHeader
        icon={FaChess}
        title="Puzzle Management"
        subtitle={`${totalRecords} puzzles total`}
        action={
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
            <Button variant="secondary" icon={FaUpload} onClick={() => fileInputRef.current.click()}>Import JSON</Button>
            <Button variant="secondary" icon={FaDownload} onClick={handleExport}>Export JSON</Button>
            <Button variant="secondary" onClick={handleValidatePuzzles} disabled={isValidating}>
              {isValidating ? 'Validating...' : 'Validate Puzzles'}
            </Button>
            <Button to="/admin/puzzles/create" icon={FaChess}>Create Puzzle</Button>
            {selectedPuzzles.length > 0 && (
              <Button variant="danger" icon={FaTrash} onClick={() => setDeleteSelectedConfirm(true)}>
                Delete Selected ({selectedPuzzles.length})
              </Button>
            )}
            <Button variant="danger" icon={FaTrash} onClick={() => setDeleteAllConfirm(true)} disabled={totalRecords === 0}>
              Delete All
            </Button>
          </div>
        }
      />

      <div className={styles.filters}>
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search puzzles by title or FEN..." />
        <FilterSelect value={filterCategory || 'all'} onChange={handleFilterChange(setFilterCategory)} options={categoryOptions} icon={FaLayerGroup} label="Category" />
        <FilterSelect value={filterDifficulty || 'all'} onChange={handleFilterChange(setFilterDifficulty)} options={difficultyOptions} icon={FaFilter} label="Difficulty" />
        <FilterSelect value={filterLevel || 'all'} onChange={handleFilterChange(setFilterLevel)} options={levelOptions} icon={FaSignal} label="Level" />
      </div>

      {isLoading && puzzles.length > 0 && <p>Loading puzzles...</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      <DataTable
        columns={columns}
        data={puzzles}
        actions={(puzzle) => (
          <>
            <IconButton icon={FaEye} onClick={() => handlePreview(puzzle)} title="Preview" variant="primary" />
            <IconButton icon={FaEdit} to={`/admin/puzzles/edit/${puzzle._id}`} title="Edit" variant="primary" />
            <IconButton icon={FaTrash} onClick={() => handleDelete(puzzle)} title="Delete" variant="danger" />
          </>
        )}
        emptyMessage="No puzzles found"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <>
          <div className={styles.paginationInfo}>
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)} of {totalRecords}
          </div>
          <div className={styles.paginationContainer}>
            <button className={styles.pageBtn} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>‹</button>
            {(() => {
              const pages = [];
              const add = (i) => pages.push(
                <button key={i} className={`${styles.pageBtn} ${currentPage === i ? styles.activePage : ''}`} onClick={() => setCurrentPage(i)}>{i}</button>
              );
              const ellipsis = (k) => pages.push(<span key={k} style={{ padding: '0 4px', color: '#888' }}>...</span>);
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) add(i);
              } else {
                add(1);
                if (currentPage > 3) ellipsis('e1');
                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);
                for (let i = start; i <= end; i++) add(i);
                if (currentPage < totalPages - 2) ellipsis('e2');
                add(totalPages);
              }
              return pages;
            })()}
            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>›</button>
            <button className={styles.pageBtn} onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
          </div>
        </>
      )}

      {/* Preview Modal */}
      {showPreview && selectedPuzzle && (
        <div className={styles.modal} onClick={() => setShowPreview(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{selectedPuzzle.title}</h3>
              <button onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.chessboardPreview}>
                <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                  <ChessBoard fen={selectedPuzzle.fen} interactive={false} puzzleType={selectedPuzzle.puzzleType || 'normal'} kidsConfig={selectedPuzzle.kidsConfig} />
                </div>
              </div>
              <div className={styles.puzzleDetails}>
                <p><strong>Difficulty:</strong> {selectedPuzzle.difficulty}</p>
                <p><strong>Category:</strong> {selectedPuzzle.category}</p>
                <p><strong>Created:</strong> {selectedPuzzle.createdAt ? new Date(selectedPuzzle.createdAt).toLocaleString() : '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single */}
      {deleteConfirm && (
        <div className={styles.modal} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmHeader}><FaTrash className={styles.dangerIcon} /><h3>Delete Puzzle</h3></div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>?</p>
              <p className={styles.warningText}>This action cannot be undone.</p>
            </div>
            <div className={styles.confirmActions}>
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" icon={FaTrash} onClick={confirmDelete}>Delete Puzzle</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All */}
      {deleteAllConfirm && (
        <div className={styles.modal} onClick={() => setDeleteAllConfirm(false)}>
          <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmHeader}><FaTrash className={styles.dangerIcon} /><h3>Delete All Puzzles</h3></div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to delete <strong>ALL {totalRecords} puzzles</strong>?</p>
              <p className={styles.warningText}>This action cannot be undone.</p>
            </div>
            <div className={styles.confirmActions}>
              <Button variant="secondary" onClick={() => setDeleteAllConfirm(false)}>Cancel</Button>
              <Button variant="danger" icon={FaTrash} onClick={confirmDeleteAll}>Delete All Puzzles</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Selected */}
      {deleteSelectedConfirm && (
        <div className={styles.modal} onClick={() => setDeleteSelectedConfirm(false)}>
          <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmHeader}><FaTrash className={styles.dangerIcon} /><h3>Delete Selected Puzzles</h3></div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to delete <strong>{selectedPuzzles.length}</strong> selected puzzles?</p>
              <p className={styles.warningText}>This action cannot be undone.</p>
            </div>
            <div className={styles.confirmActions}>
              <Button variant="secondary" onClick={() => setDeleteSelectedConfirm(false)}>Cancel</Button>
              <Button variant="danger" icon={FaTrash} onClick={confirmDeleteSelected}>Delete Selected</Button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className={styles.modal} onClick={() => setValidationResult(null)}>
          <div className={styles.confirmModal} style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmHeader}><h3>Validation Results</h3></div>
            <div className={styles.confirmBody}>
              <p>Scanned <strong>{validationResult.total}</strong> puzzles — found <strong>{validationResult.invalidCount}</strong> invalid.</p>
              {validationResult.invalidCount === 0 ? (
                <p style={{ color: '#16a34a' }}>All puzzles are valid.</p>
              ) : (
                <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #333' }}>
                        <th style={{ textAlign: 'left', padding: '4px 8px' }}>Title</th>
                        <th style={{ textAlign: 'left', padding: '4px 8px' }}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResult.invalid.map(p => (
                        <tr key={p._id} style={{ borderBottom: '1px solid #222' }}>
                          <td style={{ padding: '4px 8px' }}>{p.title}</td>
                          <td style={{ padding: '4px 8px', color: '#ef4444' }}>{p.reasons.join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className={styles.confirmActions}>
              <Button variant="secondary" onClick={() => setValidationResult(null)}>Close</Button>
              {validationResult.invalidCount > 0 && (
                <Button variant="danger" icon={FaTrash} onClick={handleDeleteInvalid}>
                  Delete {validationResult.invalidCount} Invalid Puzzles
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PuzzleList;
