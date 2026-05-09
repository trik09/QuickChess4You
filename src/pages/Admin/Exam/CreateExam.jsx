import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaGraduationCap,
  FaClock,
  FaPlus,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaBookOpen,
  FaSearch,
  FaListUl,
  FaGripLines
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import styles from "./CreateExam.module.css";
import { examAPI, quizAPI, quizCategoryAPI } from "../../../services/api";

const genId = () => Math.random().toString(36).slice(2, 9);

const CHAPTER_COLORS = [
  "#d97706", "#7c3aed", "#0891b2", "#16a34a", "#db2777", "#ea580c"
];

function CreateExam() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: "",
    startTime: "",
    duration: "60",
    description: "",
    accessCode: ""
  });

  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [chapters, setChapters] = useState([]); // [{ id, title, description, duration, quizIds: [] }]
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [showChapterModal, setShowChapterModal] = useState(false);
  
  const [newChapterData, setNewChapterData] = useState({ title: "", description: "" });
  const chapterInputRef = useRef(null);

  const [viewMode, setViewMode] = useState("library"); // 'library' or 'selected'
  const [filters, setFilters] = useState({ search: "", category: "all", type: "all" });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoadingQuizzes(true);
    try {
      const [quizzesData, catsData] = await Promise.all([
        quizAPI.getQuizzes(),
        quizCategoryAPI.getAll()
      ]);
      setQuizzes(quizzesData);
      setCategories(catsData);

      if (isEditing) {
        const examData = await examAPI.getAdminExam(id);
        if (examData) {
          setFormData({
            title: examData.name || "",
            startTime: examData.startTime ? new Date(examData.startTime).toISOString().slice(0, 16) : "",
            duration: examData.duration || "60",
            description: examData.description || "",
            accessCode: examData.accessCode || ""
          });

          if (examData.chapters) {
            const mappedChapters = examData.chapters.map(ch => ({
              id: ch._id || genId(),
              title: ch.name,
              description: ch.description,
              quizIds: ch.quizzes ? ch.quizzes.map(q => q._id || q) : ch.quizIds.map(q => q._id || q)
            }));
            setChapters(mappedChapters);
            if (mappedChapters.length > 0) setActiveChapterId(mappedChapters[0].id);
          }
        }
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    if (showChapterModal && chapterInputRef.current) {
      setTimeout(() => chapterInputRef.current?.focus(), 50);
    }
  }, [showChapterModal]);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const getChapterForQuiz = (quizId) => chapters.find(ch => ch.quizIds.includes(quizId)) || null;

  const getChapterColor = (chapterId) => {
    const idx = chapters.findIndex(ch => ch.id === chapterId);
    return CHAPTER_COLORS[idx % CHAPTER_COLORS.length] || CHAPTER_COLORS[0];
  };

  const allAssignedQuizIds = chapters.flatMap(ch => ch.quizIds);
  const selectedQuizzes = quizzes.filter(q => allAssignedQuizIds.includes(q._id));

  // --- Chapter CRUD ---
  const handleAddChapter = () => {
    if (!newChapterData.title.trim()) return toast.error("Enter chapter title");
    
    const newChapter = { 
      id: genId(), 
      title: newChapterData.title.trim(), 
      description: newChapterData.description.trim(),
      quizIds: [] 
    };
    
    setChapters(prev => [...prev, newChapter]);
    setActiveChapterId(newChapter.id);
    setNewChapterData({ title: "", description: "" });
    setShowChapterModal(false);
    toast.success(`Chapter "${newChapter.title}" created!`);
  };

  const handleDeleteChapter = (chapterId, e) => {
    e.stopPropagation();
    setChapters(prev => prev.filter(ch => ch.id !== chapterId));
    if (activeChapterId === chapterId) {
      const remaining = chapters.filter(ch => ch.id !== chapterId);
      setActiveChapterId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // --- Quiz Toggle ---
  const handleQuizToggle = (quiz) => {
    if (chapters.length === 0) return toast.error("Create a chapter first!");
    if (!activeChapterId) return toast.error("Select a chapter first!");

    const quizId = quiz._id;
    const ownerChapter = getChapterForQuiz(quizId);

    if (ownerChapter && ownerChapter.id !== activeChapterId) return; // Belong to another chapter -> disabled

    setChapters(prev => prev.map(ch => {
      if (ch.id !== activeChapterId) return ch;
      const alreadyIn = ch.quizIds.includes(quizId);
      return {
        ...ch,
        quizIds: alreadyIn ? ch.quizIds.filter(id => id !== quizId) : [...ch.quizIds, quizId]
      };
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error("Enter exam title");
    if (!formData.startTime) return toast.error("Select start time");
    if (chapters.length === 0) return toast.error("Create at least one chapter");

    const totalAssigned = chapters.flatMap(c => c.quizIds);
    if (totalAssigned.length === 0) return toast.error("Add at least one quiz to a chapter");

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.title.trim(),
        description: formData.description.trim(),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(new Date(formData.startTime).getTime() + parseInt(formData.duration) * 60 * 1000).toISOString(),
        duration: parseInt(formData.duration),
        isActive: true,
        accessCode: formData.accessCode.trim() || undefined,
        chapters: chapters.map(ch => ({
          name: ch.title,
          description: ch.description,
          quizIds: ch.quizIds
        }))
      };

      if (isEditing) {
        await examAPI.updateExam(id, payload);
        toast.success("Exam updated!");
      } else {
        await examAPI.createExam(payload);
        toast.success("Exam created!");
      }
      setTimeout(() => navigate("/admin/exams"), 1500);
    } catch (error) {
      toast.error(error.message || "Failed to save exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Data
  const filteredList = (viewMode === 'selected' ? selectedQuizzes : quizzes).filter(q => {
    const matchesSearch = q.questionText.toLowerCase().includes(filters.search.toLowerCase());
    const qCatId = q.category?._id || q.category;
    const matchesCat = filters.category === 'all' || qCatId === filters.category;

    let matchesType = true;
    if (filters.type === 'text_mcq') {
      matchesType = q.type === 'mcq' && !q.isBoardBased;
    } else if (filters.type === 'board_mcq') {
      matchesType = q.type === 'mcq' && !!q.isBoardBased;
    } else if (filters.type === 'column_matching') {
      matchesType = q.type === 'column_matching';
    }
    // 'all' → true

    return matchesSearch && matchesCat && matchesType;
  });

  return (
    <div className={styles.container}>
       <Toaster position="top-center" />
       
       <div className={styles.header}>
        <div>
          <h1>{isEditing ? 'Edit Exam' : 'Create Exam'}</h1>
          <p>Configure exam details and organize quizzes into chapters</p>
        </div>
        <button className={styles.cancelBtn} onClick={() => navigate("/admin/exams")}>
          <FaTimesCircle /> Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.mainLayout}>
         
         <div className={styles.card}>
           <div className={styles.cardHeader}>
             <FaGraduationCap className={styles.iconGold} />
             <h3>Exam Details</h3>
           </div>
           
           <div className={styles.formGrid}>
             <div className={styles.inputGroup}>
               <label>Exam Title *</label>
               <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. End of Semester Chess Exam" />
             </div>
             
             <div className={styles.inputGroup}>
               <label>Duration (mins) *</label>
               <div className={styles.inputIconWrapper}>
                 <FaClock className={styles.inputIcon} />
                 <input required type="number" min="1" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
               </div>
             </div>

             <div className={styles.inputGroup}>
               <label>Start Date & Time *</label>
               <input required type="datetime-local" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
             </div>


             <div className={styles.inputGroup}>
               <label>Access Code</label>
               <div className={styles.inputIconWrapper}>
                 <FaLock className={styles.inputIcon} />
                 <input type="text" placeholder="Leave empty for public" value={formData.accessCode} onChange={e => setFormData({...formData, accessCode: e.target.value})} />
               </div>
             </div>

             <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
               <label>Description</label>
               <textarea rows="2" placeholder="Exam rules and details..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
             </div>
           </div>
         </div>

         <div className={`${styles.card} ${styles.tableCard}`}>
           
           <div className={styles.chapterSection}>
              <div className={styles.chapterSectionHeader}>
                <div className={styles.chapterSectionLeft}>
                  <FaBookOpen className={styles.chapterSectionIcon} />
                  <span className={styles.chapterSectionTitle}>Chapters</span>
                  <span className={styles.chapterSectionHint}>
                    {chapters.length === 0 ? "Create chapters to organize quizzes" : `${chapters.length} chapters · ${allAssignedQuizIds.length} quizzes`}
                  </span>
                </div>
                <button type="button" className={styles.addChapterBtn} onClick={() => setShowChapterModal(true)}>
                  <FaPlus /> Add Chapter
                </button>
              </div>

              {chapters.length > 0 && (
                <div className={styles.chapterBubbleBar}>
                  {chapters.map((ch, idx) => {
                    const color = getChapterColor(ch.id);
                    const isActive = activeChapterId === ch.id;
                    return (
                      <div key={ch.id} className={`${styles.chapterBubble} ${isActive ? styles.chapterBubbleActive : ''}`}
                           style={isActive ? { '--ch-color': color, borderColor: color } : { '--ch-color': color }}
                           onClick={() => setActiveChapterId(ch.id)}>
                        <span className={styles.chapterDotIndicator} style={{ background: color }} />
                        <span className={styles.chapterBubbleName}>{ch.title}</span>
                        <span className={styles.chapterBubbleCount}>{ch.quizIds.length}</span>
                        <button type="button" className={styles.chapterDeleteBtn} onClick={(e) => handleDeleteChapter(ch.id, e)}><FaTimesCircle /></button>
                      </div>
                    );
                  })}
                </div>
              )}
           </div>

           <div className={styles.toolbar}>
             <div className={styles.toolbarLeft}>
               <div className={styles.searchBox}>
                 <FaSearch />
                 <input type="text" placeholder="Search quizzes..." value={filters.search} onChange={e => handleFilterChange("search", e.target.value)} />
               </div>
               <div className={styles.filters}>
                 <select value={filters.category} onChange={e => handleFilterChange("category", e.target.value)}>
                   <option value="all">Category: All</option>
                   {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                 </select>
                 <select value={filters.type} onChange={e => handleFilterChange("type", e.target.value)}>
                    <option value="all">Type: All</option>
                    <option value="text_mcq">Text-Based MCQ</option>
                    <option value="board_mcq">Board-Based MCQ</option>
                    <option value="column_matching">Column Matching</option>
                  </select>
               </div>
             </div>
             
             <div className={styles.toolbarRight}>
               <div className={styles.viewToggle}>
                 <button type="button" className={viewMode === 'library' ? styles.activeView : ''} onClick={() => setViewMode('library')}>Library</button>
                 <button type="button" className={viewMode === 'selected' ? styles.activeView : ''} onClick={() => setViewMode('selected')}>Assigned ({allAssignedQuizIds.length})</button>
               </div>
             </div>
           </div>

           {activeChapterId && (() => {
             const ch = chapters.find(c => c.id === activeChapterId);
             const color = getChapterColor(activeChapterId);
             return (
               <div className={styles.activeChapterStrip} style={{ borderLeftColor: color }}>
                 <span className={styles.activeChapterDot} style={{ background: color }} />
                 <span>Adding quizzes to: <strong>{ch?.title}</strong></span>
               </div>
             );
           })()}

           <div className={styles.tableWrapper}>
             <table className={styles.table}>
               <thead>
                 <tr>
                   <th width="50"></th>
                   <th>Question</th>
                   <th>Type</th>
                   <th>Category</th>
                   <th width="150">Chapter</th>
                 </tr>
               </thead>
               <tbody>
                  {loadingQuizzes ? (
                    <tr><td colSpan="5" className={styles.loadingCell}>Loading quizzes...</td></tr>
                  ) : filteredList.length === 0 ? (
                    <tr><td colSpan="5" className={styles.emptyCell}>No quizzes found.</td></tr>
                  ) : (
                    filteredList.map(quiz => {
                      const ownerChapter = getChapterForQuiz(quiz._id);
                      const isInActiveChapter = ownerChapter?.id === activeChapterId;
                      const isInOtherChapter = ownerChapter && ownerChapter.id !== activeChapterId;
                      const chapterColor = ownerChapter ? getChapterColor(ownerChapter.id) : null;

                      return (
                        <tr key={quiz._id} 
                            className={`${isInActiveChapter ? styles.selectedRow : ''} ${isInOtherChapter ? styles.disabledRow : ''}`}
                            onClick={() => !isInOtherChapter && handleQuizToggle(quiz)}
                            style={{ cursor: isInOtherChapter ? 'not-allowed' : 'pointer' }}>
                          <td className={styles.checkCell}>
                            <div className={`${styles.checkbox} ${isInActiveChapter ? styles.checked : ''}`}
                                 style={isInActiveChapter ? { borderColor: chapterColor, color: chapterColor } : {}}>
                              {isInActiveChapter && <FaCheckCircle />}
                            </div>
                          </td>
                          <td>
                            <div className={styles.puzzleTitle}>{quiz.questionText.length > 50 ? quiz.questionText.slice(0,50)+'...' : quiz.questionText}</div>
                          </td>
                          <td>
                            {
                              quiz.type === 'column_matching'
                                ? <><FaGripLines/> Column Matching</>
                                : quiz.isBoardBased
                                  ? <><FaListUl/> Board MCQ</>
                                  : <><FaListUl/> Text MCQ</>
                            }
                          </td>
                          <td><span className={styles.tag}>{quiz.category?.name || 'General'}</span></td>
                          <td>
                            {ownerChapter ? (
                              <span className={styles.chapterPill} style={{ background: chapterColor+'20', color: chapterColor, borderColor: chapterColor+'60' }}>
                                {ownerChapter.title}
                              </span>
                            ) : <span className={styles.unassignedText}>—</span>}
                          </td>
                        </tr>
                      )
                    })
                  )}
               </tbody>
             </table>
           </div>

         </div>

         <div className={styles.stickyFooter}>
           <div className={styles.footerInfo}>
             <span className={styles.selectionCount}>{allAssignedQuizIds.length} Quizzes · {chapters.length} Chapters</span>
           </div>
           <div className={styles.footerActions}>
             <button type="submit" className={styles.submitBtn} disabled={isSubmitting || chapters.length === 0}>
               {isSubmitting ? "Processing..." : isEditing ? "Save Changes" : "Create Exam"}
             </button>
           </div>
         </div>
      </form>

      {/* Chapter Modal */}
      {showChapterModal && (
        <div className={styles.modalOverlay} onClick={() => setShowChapterModal(false)}>
          <div className={styles.chapterModalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.chapterModalHeader}>
              <FaBookOpen className={styles.chapterModalIcon} />
              <h4>New Chapter</h4>
            </div>
            
            <div className={styles.formGroupModal}>
              <label>Chapter Title</label>
              <input ref={chapterInputRef} type="text" className={styles.chapterNameInput} placeholder="e.g. Chess Basics" value={newChapterData.title} onChange={e => setNewChapterData({...newChapterData, title: e.target.value})} maxLength={40}/>
            </div>
            
            <div className={styles.formGroupModal}>
               <label>Description (optional)</label>
               <textarea className={styles.chapterNameInput} rows="2" placeholder="Brief description..." value={newChapterData.description} onChange={e => setNewChapterData({...newChapterData, description: e.target.value})} />
            </div>

            <div className={styles.chapterModalActions}>
              <button type="button" className={styles.chapterModalCancel} onClick={() => setShowChapterModal(false)}>Cancel</button>
              <button type="button" className={styles.chapterModalCreate} onClick={handleAddChapter} disabled={!newChapterData.title.trim()}>
                <FaPlus /> Create Chapter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateExam;
