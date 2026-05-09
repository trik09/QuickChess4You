import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/Admin';
import { FaBook, FaCog, FaSave, FaSpinner, FaChessBoard, FaFont } from 'react-icons/fa';
import QuizTabs from './components/QuizTabs';
import McqTypeToggle from './components/mcq/McqTypeToggle';
import McqEditor from './components/mcq/McqEditor';
import ColumnMatching from './components/matching/ColumnMatching';
import BoardConfig from './components/mcq/BoardConfig';
import styles from './CreateQuiz.module.css';
import { quizAPI, quizCategoryAPI } from '../../../services/api';
import { MOCK_QUIZ_CATEGORIES } from '../../../constants/mockCategories';
import toast, { Toaster } from 'react-hot-toast';

const genId = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_FORM_DATA = {
  questionText: '',
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  options: [
    { id: genId(), text: '', isCorrect: false },
    { id: genId(), text: '', isCorrect: false },
    { id: genId(), text: '', isCorrect: false },
    { id: genId(), text: '', isCorrect: false },
  ],
  pairs: [
    { id: genId(), leftItem: '', rightItem: '', correctAnswer: '' },
    { id: genId(), leftItem: '', rightItem: '', correctAnswer: '' },
    { id: genId(), leftItem: '', rightItem: '', correctAnswer: '' },
  ],
  difficulty: 'Medium',
  tags: [],
  category: '',
};

/**
 * Converts a quiz API response back into our formData shape.
 * Handles both create (fresh) and edit (hydrate) scenarios.
 */
const hydrateFormData = (quiz) => {
  return {
    questionText: quiz.questionText || '',
    fen: quiz.fen || DEFAULT_FORM_DATA.fen,
    options: Array.isArray(quiz.options) && quiz.options.length > 0
      ? quiz.options.map(o => ({ id: genId(), text: o.text || '', isCorrect: !!o.isCorrect }))
      : DEFAULT_FORM_DATA.options,
    pairs: Array.isArray(quiz.pairs) && quiz.pairs.length > 0
      ? quiz.pairs.map(p => ({ 
          id: genId(), 
          leftItem: p.leftItem || '', 
          rightItem: p.rightItem || '', 
          correctAnswer: p.correctAnswer || '' 
        }))
      : DEFAULT_FORM_DATA.pairs,
    difficulty: quiz.difficulty || 'Medium',
    tags: Array.isArray(quiz.tags) ? quiz.tags : [],
    category: quiz.category?._id || quiz.category || '',
  };
};

/**
 * Returns true when the category ID is a dev-only mock (not a real ObjectId).
 * Once real quiz categories are seeded in the DB, this should always return false.
 */
const isMockCategory = (categoryId) =>
  !categoryId || String(categoryId).startsWith('mock_');

/**
 * Builds the API payload from UI state.
 * Maps UI tab/mcqType → backend type + isBoardBased flag.
 *
 * IMPORTANT: mock category IDs (mock_1, mock_2 …) are stripped before
 * sending because they are not valid MongoDB ObjectIds and would cause a
 * CastError on the backend.
 */
const buildPayload = (activeTab, mcqType, formData) => {
  const isMatching = activeTab === 'column_matching';

  // Only send category if it is a real DB ObjectId
  const categoryValue = isMockCategory(formData.category)
    ? undefined
    : formData.category;

  const payload = {
    questionText: formData.questionText.trim(),
    type: isMatching ? 'column_matching' : 'mcq',
    isBoardBased: !isMatching && mcqType === 'board',
    difficulty: formData.difficulty || 'Medium',
    tags: Array.isArray(formData.tags) ? formData.tags : [],
    // Only include category when it is a real ObjectId
    ...(categoryValue ? { category: categoryValue } : {}),
    // MCQ fields
    ...(isMatching
      ? {}
      : {
          options: formData.options.map(({ text, isCorrect }) => ({
            text: text.trim(),
            isCorrect: !!isCorrect,
          })),
        }),
    // Board MCQ field
    ...(!isMatching && mcqType === 'board' ? { fen: formData.fen } : {}),
    // Column Matching field
    ...(isMatching
      ? {
          pairs: formData.pairs.map(({ leftItem, rightItem, correctAnswer }) => ({
            leftItem: leftItem.trim(),
            rightItem: rightItem.trim(),
            correctAnswer: (correctAnswer || '').trim(),
          })),
        }
      : {}),
  };

  // ── Debug log (remove once stable) ──────────────────────────────
  console.log('[CreateQuiz] Payload being sent to API:', JSON.stringify(payload, null, 2));

  return payload;
};

const CreateQuiz = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [activeTab, setActiveTab] = useState('mcq');
  const [mcqType, setMcqType] = useState('text');
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  // ── Load categories (auto-seed if DB is empty) ─────────────────────────
  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      try {
        const data = await quizCategoryAPI.getAll();

        if (!mounted) return;

        // Happy path: the DB already has quiz categories
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          return;
        }

        // DB is empty — seed the default categories via the API so we get
        // real MongoDB ObjectIds back (not fake 'mock_N' strings).
        console.info('[CreateQuiz] No quiz categories found. Seeding defaults via API...');

        const results = await Promise.allSettled(
          MOCK_QUIZ_CATEGORIES.map(cat =>
            quizCategoryAPI.createCategory({ name: cat.name, description: '' })
          )
        );

        if (!mounted) return;

        const created = results
          .filter(r => r.status === 'fulfilled' && r.value?._id)
          .map(r => r.value);

        if (created.length > 0) {
          console.info(`[CreateQuiz] Seeded ${created.length} categories with real IDs.`);
          setCategories(created);
        } else {
          // Seeding also failed (e.g. backend down) — fall back to mocks so the
          // UI is at least usable; quiz saves will omit category until DB is reachable.
          console.warn('[CreateQuiz] Category seeding failed. Using mock placeholders.');
          setCategories(MOCK_QUIZ_CATEGORIES);
        }
      } catch (err) {
        // Network error or backend down — graceful degradation
        if (mounted) {
          console.warn('[CreateQuiz] Category API unreachable. Using mock placeholders.', err);
          setCategories(MOCK_QUIZ_CATEGORIES);
        }
      }
    };

    loadCategories();
    return () => { mounted = false; };
  }, []);

  // ── Load quiz for edit mode ───────────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return;
    let mounted = true;
    setIsLoadingQuiz(true);

    quizAPI.getById(id)
      .then(quiz => {
        if (!mounted) return;
        // Set tab & mcq type from quiz data
        if (quiz.type === 'column_matching') {
          setActiveTab('column_matching');
        } else {
          setActiveTab('mcq');
          setMcqType(quiz.isBoardBased ? 'board' : 'text');
        }
        setFormData(hydrateFormData(quiz));
      })
      .catch(err => {
        if (!mounted) return;
        toast.error(err.message || 'Failed to load quiz');
      })
      .finally(() => { if (mounted) setIsLoadingQuiz(false); });

    return () => { mounted = false; };
  }, [id, isEditMode]);

  // ── Save handler ─────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    // ── Step 1: Field validation ──────────────────────────────────
    if (!formData.questionText.trim()) {
      return toast.error('Question text is required.');
    }

    if (activeTab === 'mcq') {
      if (formData.options.some(o => !o.text.trim())) {
        return toast.error('All answer options must have text.');
      }
      if (!formData.options.some(o => o.isCorrect)) {
        return toast.error('Please mark one correct answer.');
      }
    } else {
      const incomplete = formData.pairs.filter(p => !p.leftItem.trim() || !p.rightItem.trim());
      if (incomplete.length > 0) {
        return toast.error(`${incomplete.length} pair(s) are incomplete. Fill both sides of each pair.`);
      }
    }

    // Warn (not block) if using a mock category — it won't be stored on the server
    if (isMockCategory(formData.category)) {
      // Hard block: mock IDs are not real ObjectIds and will cause a backend 400
      return toast.error(
        'Please refresh the page — real categories are being loaded. If this persists, go to Quiz Categories and create one manually.'
      );
    }

    // ── Step 2: Build + log payload ───────────────────────────────
    const payload = buildPayload(activeTab, mcqType, formData);

    // ── Step 3: Submit ────────────────────────────────────────────
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await quizAPI.updateQuiz(id, payload);
        toast.success('Quiz updated successfully!');
      } else {
        await quizAPI.createQuiz(payload);
        toast.success('Quiz created successfully!');
      }
      setTimeout(() => navigate('/admin/quizzes'), 1200);
    } catch (err) {
      // Surface the exact backend message so we can diagnose issues
      console.error('[CreateQuiz] API error:', err);
      const userMessage =
        err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        'Failed to save quiz. Please try again.';
      toast.error(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeTab, mcqType, formData, id, isEditMode, navigate]);

  if (isLoadingQuiz) {
    return (
      <div className={styles.createQuiz}>
        <PageHeader title={isEditMode ? 'Edit Quiz' : 'Create New Quiz'} subtitle="Loading..." />
        <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading quiz data...</div>
      </div>
    );
  }

  return (
    <div className={styles.createQuiz}>
      <Toaster position="top-center" />
      <PageHeader
        title={isEditMode ? 'Edit Quiz' : 'Create New Quiz'}
        subtitle={isEditMode ? 'Update quiz details' : 'Create a new quiz'}
      />

      <div className={styles.content}>
        <div className={styles.layoutGrid}>
          {/* Main Area (Left) - Question & Settings */}
          <div className={styles.mainColumn}>
            <div className={styles.stickyWrapper}>
              <QuizTabs activeTab={activeTab} setActiveTab={setActiveTab} />
              
              <div className={styles.card}>
                <div className={styles.sectionHeader}>
                  <span className={styles.icon}><FaBook /></span>
                  <h3 className={styles.sectionTitle}>Question Content</h3>
                </div>
                
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Question Text</label>
                  <textarea 
                    className={styles.textarea}
                    value={formData.questionText}
                    onChange={(e) => setFormData(p => ({...p, questionText: e.target.value}))}
                    placeholder="Enter your question here..."
                  />
                </div>
              </div>

              {activeTab === 'mcq' && (
                <div className={styles.card}>
                  <div className={styles.sectionHeader}>
                    <span className={styles.icon}><FaChessBoard /></span>
                    <h3 className={styles.sectionTitle}>MCQ Configuration</h3>
                  </div>
                  <McqTypeToggle mcqType={mcqType} setMcqType={setMcqType} />
                  
                  {mcqType === 'board' && (
                    <div className={styles.boardConfigWrapper}>
                      <BoardConfig formData={formData} setFormData={setFormData} />
                    </div>
                  )}
                </div>
              )}

              <div className={styles.card}>
                <div className={styles.sectionHeader}>
                  <span className={styles.icon}><FaCog /></span>
                  <h3 className={styles.sectionTitle}>Quiz Settings</h3>
                </div>

                <div className={styles.settingsGrid}>
                  <div className={styles.settingItem}>
                    <label className={styles.label}>Category</label>
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

                  <div className={styles.settingItem}>
                    <label className={styles.label}>Difficulty</label>
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
                </div>

                <div className={styles.tagSection}>
                  <label className={styles.label}>Tags</label>
                  <div className={styles.tagInputWrapper}>
                    <input
                      type="text"
                      className={styles.tagInput}
                      placeholder="Add tag and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.target.value.trim();
                          if (val && !formData.tags.includes(val)) {
                            setFormData(p => ({ ...p, tags: [...p.tags, val] }));
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <div className={styles.tagsList}>
                      {formData.tags.map(tag => (
                        <span key={tag} className={styles.tagBadge}>
                          {tag}
                          <button type="button" onClick={() => setFormData(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area (Right) - Options & Actions */}
          <div className={styles.sidebarColumn}>
            {activeTab === 'mcq' ? (
              <McqEditor
                mcqType={mcqType}
                formData={formData}
                setFormData={setFormData}
              />
            ) : (
              <ColumnMatching
                formData={formData}
                setFormData={setFormData}
              />
            )}

            <div className={styles.actionCard}>
              <div className={styles.validationStatus}>
                <h4 className={styles.statusTitle}>Validation</h4>
                <div className={styles.statusItems}>
                  <div className={`${styles.statusItem} ${formData.questionText.trim() ? styles.valid : ''}`}>
                    {formData.questionText.trim() ? '✓' : '○'} Question Text
                  </div>
                  <div className={`${styles.statusItem} ${(activeTab === 'mcq' ? formData.options.some(o => o.isCorrect) : formData.pairs.every(p => p.leftItem && p.correctAnswer)) ? styles.valid : ''}`}>
                    {(activeTab === 'mcq' ? formData.options.some(o => o.isCorrect) : formData.pairs.every(p => p.leftItem && p.correctAnswer)) ? '✓' : '○'} {activeTab === 'mcq' ? 'Answer Marked' : 'Pairs Complete'}
                  </div>
                </div>
              </div>

              <button
                className={styles.primarySaveBtn}
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><FaSpinner className={styles.spin} /> Saving...</>
                ) : (
                  <><FaSave /> {isEditMode ? 'Update Quiz' : 'Create Quiz'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuiz;
