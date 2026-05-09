import { useEffect, useState } from 'react';
import { FaEdit, FaTrash, FaBook, FaPlus } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, SearchBar, FilterSelect, Button, DataTable, Badge, IconButton } from '../../../components/Admin';
import { quizAPI, quizCategoryAPI } from '../../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import styles from './QuizList.module.css';

function QuizList() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState(initialCategory);
  const [filterType, setFilterType] = useState('all');
  const [quizzes, setQuizzes] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([{ value: 'all', label: 'All Categories' }]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'text_mcq', label: 'Text MCQ' },
    { value: 'board_mcq', label: 'Board MCQ' },
    { value: 'column_matching', label: 'Column Matching' },
  ];

  useEffect(() => {
    let isMounted = true;
    const fetchQuizzesAndCategories = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [quizzesData, categoriesData] = await Promise.all([
          quizAPI.getQuizzes(),
          quizCategoryAPI.getAll()
        ]);

        if (isMounted) {
          setQuizzes(quizzesData);
          
          if (Array.isArray(categoriesData)) {
            const catOptions = categoriesData.map(cat => ({
              value: cat._id || cat.name.toLowerCase(),
              label: cat.name,
              id: cat._id
            }));
            setCategoryOptions([{ value: 'all', label: 'All Categories' }, ...catOptions]);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load quizzes:", err);
          setError(err.message || "Failed to load quizzes");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchQuizzesAndCategories();
    return () => { isMounted = false; };
  }, []);

  const handleDelete = async (quiz) => {
    if (!window.confirm(`Are you sure you want to delete this quiz?`)) return;
    try {
      await quizAPI.deleteQuiz(quiz._id);
      setQuizzes(prev => prev.filter(q => q._id !== quiz._id));
      toast.success("Quiz deleted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to delete quiz");
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.questionText.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' ||
      (quiz.category && (quiz.category._id === filterCategory || quiz.category.name === filterCategory));

    let matchesType = true;
    if (filterType === 'text_mcq') {
      matchesType = quiz.type === 'mcq' && !quiz.isBoardBased;
    } else if (filterType === 'board_mcq') {
      matchesType = quiz.type === 'mcq' && !!quiz.isBoardBased;
    } else if (filterType === 'column_matching') {
      matchesType = quiz.type === 'column_matching';
    }
    // 'all' → matchesType stays true

    return matchesSearch && matchesCategory && matchesType;
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterType]);

  const paginatedQuizzes = filteredQuizzes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const columns = [
    { key: 'questionText', label: 'Question', render: (text) => text.length > 50 ? text.substring(0, 50) + '...' : text },
    {
      key: 'type',
      label: 'Type',
      render: (type, row) => {
        if (type === 'mcq') {
          return row.isBoardBased
            ? <Badge variant="secondary">Board MCQ</Badge>
            : <Badge variant="primary">Text MCQ</Badge>;
        }
        if (type === 'column_matching') return <Badge variant="info">Matching</Badge>;
        return <Badge variant="secondary">{type}</Badge>;
      }
    },
    { key: 'category', label: 'Category', render: (cat) => cat ? cat.name : '—' },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (createdAt) => createdAt ? new Date(createdAt).toLocaleDateString() : '—'
    }
  ];

  return (
    <div className={styles.quizList}>
      <Toaster />
      <PageHeader
        icon={FaBook}
        title="Quiz Management"
        subtitle="Manage all chess quizzes"
        action={
          <Button to="/admin/quizzes/create" icon={FaPlus}>
            Create Quiz
          </Button>
        }
      />

      <div className={styles.filters}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search quizzes by question..."
        />
        <FilterSelect
          value={filterType}
          onChange={setFilterType}
          options={typeOptions}
          label="Type"
        />
        <FilterSelect
          value={filterCategory}
          onChange={setFilterCategory}
          options={categoryOptions}
          label="Category"
        />
      </div>

      {isLoading ? (
        <p>Loading quizzes...</p>
      ) : error ? (
        <p className={styles.errorText}>{error}</p>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paginatedQuizzes}
            actions={(quiz) => (
              <>
                <IconButton
                  icon={FaEdit}
                  to={`/admin/quizzes/edit/${quiz._id}`}
                  title="Edit"
                  variant="primary"
                />
                <IconButton
                  icon={FaTrash}
                  onClick={() => handleDelete(quiz)}
                  title="Delete"
                  variant="danger"
                />
              </>
            )}
            emptyMessage="No quizzes found"
          />

          {filteredQuizzes.length > ITEMS_PER_PAGE && (
            <div className={styles.paginationContainer}>
               <button onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1}>Prev</button>
               <span style={{margin: '0 10px'}}>Page {currentPage}</span>
               <button onClick={() => setCurrentPage(c => c + 1)} disabled={currentPage * ITEMS_PER_PAGE >= filteredQuizzes.length}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default QuizList;
