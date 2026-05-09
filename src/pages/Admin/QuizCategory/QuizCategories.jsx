import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFolder, FaPlus, FaEdit, FaTrash, FaTimes, FaSave, FaSearch, FaBook, FaCheckCircle } from 'react-icons/fa';
import { PageHeader, Button } from '../../../components/Admin';
import { quizCategoryAPI } from '../../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import styles from './QuizCategories.module.css';

function QuizCategories() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await quizCategoryAPI.getAll(false);
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error('Error fetching quiz categories:', error);
      toast.error('Failed to load quiz categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null, e = null) => {
    if (e) e.stopPropagation();
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        await quizCategoryAPI.updateCategory(editingCategory._id, formData);
        toast.success('Quiz Category updated successfully!');
      } else {
        await quizCategoryAPI.createCategory(formData);
        toast.success('Quiz Category created successfully!');
      }

      handleCloseModal();
      fetchCategories();
    } catch (error) {
      console.error('Error saving quiz category:', error);
      toast.error(error.message || 'Failed to save quiz category');
    }
  };

  const handleDelete = async (id, name, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await quizCategoryAPI.deleteCategory(id);
      toast.success('Quiz Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting quiz category:', error);
      toast.error(error.message || 'Failed to delete quiz category');
    }
  };

  const handleCardClick = (categoryName, categoryId) => {
    navigate(`/admin/quizzes?category=${categoryId}`);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading Quiz Categories...</p>
      </div>
    );
  }

  return (
    <div className={styles.categoryList}>
      <Toaster position="top-center" />

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <FaFolder className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Quiz Category Management</h1>
            <p className={styles.subtitle}>Organize your quizzes into categories</p>
          </div>
        </div>
        <Button icon={FaPlus} onClick={() => handleOpenModal()}>
          Create Category
        </Button>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {categories.length === 0 && !loading ? (
        <div className={styles.emptyState}>
          <FaFolder className={styles.emptyIcon} />
          <h3>No Categories Yet</h3>
          <p>Create your first quiz category to start organizing quizzes.</p>
          <Button icon={FaPlus} onClick={() => handleOpenModal()}>
            Create Category
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredCategories.map((category) => (
            <div
              key={category._id}
              className={styles.card}
              onClick={() => handleCardClick(category.name, category._id)}
            >
              <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                  <FaBook />
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={styles.iconBtn}
                    onClick={(e) => handleOpenModal(category, e)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                    onClick={(e) => handleDelete(category._id, category.name, e)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{category.name}</h3>
                {category.description && (
                   <p className={styles.cardDesc}>{category.description}</p>
                )}
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.puzzleCount}>
                  <FaCheckCircle /> {category.totalQuizzes || 0} Quizzes
                </span>
                <span className={styles.arrow}>→</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredCategories.length === 0 && searchTerm && (
        <div className={styles.noResults}>
          <p>No categories found matching "{searchTerm}"</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingCategory ? 'Edit Category' : 'Create New Category'}</h2>
              <button className={styles.closeBtn} onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Opening Traps"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>

              <div className={styles.modalActions}>
                <Button
                  type="button"
                  variant="secondary"
                  icon={FaTimes}
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button type="submit" icon={FaSave}>
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizCategories;
