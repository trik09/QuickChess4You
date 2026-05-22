import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader, Button, DataTable, IconButton } from '../../../components/Admin';
import { categoryAPI } from '../../../services/api';
import { FaFolder, FaPlus, FaEdit, FaTrash, FaTimes, FaSave, FaSearch, FaChess, FaEye, FaExclamationTriangle } from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import styles from './CategoryList.module.css';

function CategoryList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    icon: 'FaChess'
  });

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '', puzzleCount: 0, loading: false });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Sync search to URL
  useEffect(() => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    setSearchParams(params, { replace: true });
  }, [searchTerm, setSearchParams]);

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
      const data = await categoryAPI.getAll(false);
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
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
        title: category.title,
        description: category.description,
        icon: category.icon || 'FaChess'
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        title: '',
        description: '',
        icon: 'FaChess'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      title: '',
      description: '',
      icon: 'FaChess'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        await categoryAPI.updateCategory(editingCategory._id, formData);
        toast.success('Category updated successfully!');
      } else {
        await categoryAPI.createCategory(formData);
        toast.success('Category created successfully!');
      }

      handleCloseModal();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category');
    }
  };

  // Opens the delete confirmation modal immediately — no API call yet
  const handleDelete = (id, name, puzzleCount, e) => {
    if (e) e.stopPropagation();
    setDeleteModal({ open: true, id, name, puzzleCount: puzzleCount ?? 0, loading: false });
  };

  const handleConfirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      if (deleteModal.puzzleCount > 0) {
        await categoryAPI.deleteCategoryWithPuzzles(deleteModal.id);
        toast.success(
          `"${deleteModal.name}" and ${deleteModal.puzzleCount} puzzle${deleteModal.puzzleCount !== 1 ? 's' : ''} deleted successfully!`
        );
      } else {
        await categoryAPI.deleteCategory(deleteModal.id);
        toast.success(`"${deleteModal.name}" deleted successfully!`);
      }
      setDeleteModal({ open: false, id: null, name: '', puzzleCount: 0, loading: false });
      fetchCategories();
    } catch (error) {
      toast.error(error.message || 'Failed to delete category');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ open: false, id: null, name: '', puzzleCount: 0, loading: false });
  };

  const handleCardClick = (categoryName) => {
    navigate(`/admin/puzzles?category=${categoryName}`);
  };

  // Helper to render dynamic icon
  const renderIcon = (iconName) => {
    const IconComponent = FaIcons[iconName] || FaChess;
    return <IconComponent />;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div className={styles.categoryList}>
      <Toaster position="top-center" />

      <div className={styles.compactHeader}>
        <div className={styles.titleArea}>
          <div className={styles.titleWithIcon}>
            <FaFolder className={styles.headerIcon} />
            <h2>Category Management</h2>
          </div>
          <p className={styles.subtitle}>Manage categories and view puzzles</p>
        </div>
        
        <div className={styles.headerActions}>
          <Button icon={FaPlus} onClick={() => handleOpenModal()} size="small">
            Create Category
          </Button>
        </div>
      </div>

      <div className={styles.filterSectionCompact}>
        <div className={styles.searchBarWrapperCompact}>
          <div className={styles.searchIconInside}>
            <FaSearch />
          </div>
          <input
            type="text"
            className={styles.compactInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories..."
          />
        </div>
      </div>

      {categories.length === 0 && !loading ? (
        <div className={styles.emptyState}>
          <FaFolder className={styles.emptyIcon} />
          <h3>No Categories Yet</h3>
          <p>Create your first category to start organizing puzzles</p>
          <Button icon={FaPlus} onClick={() => handleOpenModal()}>
            Create Category
          </Button>
        </div>
      ) : (
        <div className={styles.tableSection}>
          <DataTable
            columns={[
              { 
                key: 'icon', 
                label: 'Icon', 
                width: '60px',
                render: (icon) => <div className={styles.tableIcon}>{renderIcon(icon)}</div>
              },
              { key: 'name', label: 'Category Name' },
              { 
                key: 'totalPuzzles', 
                label: 'Puzzles',
                width: '120px',
                render: (count) => (
                  <div className={styles.puzzleCountCell}>
                    <FaChess /> {count || 0}
                  </div>
                )
              }
            ]}
            data={filteredCategories}
            actions={(category) => (
              <div className={styles.actionButtons}>
                <IconButton
                  icon={FaEye}
                  onClick={() => handleCardClick(category.name)}
                  title="View Puzzles"
                  variant="primary"
                />
                <IconButton
                  icon={FaEdit}
                  onClick={(e) => handleOpenModal(category, e)}
                  title="Edit"
                  variant="primary"
                />
                <IconButton
                  icon={FaTrash}
                  onClick={(e) => handleDelete(category._id, category.name, category.totalPuzzles, e)}
                  title="Delete"
                  variant="danger"
                />
              </div>
            )}
            emptyMessage={`No categories found matching "${searchTerm}"`}
          />
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, title: e.target.value })}
                  placeholder="e.g., Tactics"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Icon (React Icons Name)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., FaTrophy"
                />
                <small>Enter a valid React Icon name (e.g. FaChess, FaBolt)</small>
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
      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.deleteModal}`}>
            <div className={styles.modalHeader}>
              <h2>
                <FaExclamationTriangle className={styles.warnIcon} />
                Delete Category
              </h2>
              <button className={styles.closeBtn} onClick={handleCancelDelete} disabled={deleteModal.loading}>
                <FaTimes />
              </button>
            </div>

            <div className={styles.deleteModalBody}>
              <p>
                You are about to delete the category <strong>"{deleteModal.name}"</strong>.
              </p>
              {deleteModal.puzzleCount > 0 ? (
                <div className={styles.puzzleWarning}>
                  <FaChess className={styles.puzzleWarnIcon} />
                  <span>
                    This will also permanently delete{' '}
                    <strong>{deleteModal.puzzleCount} puzzle{deleteModal.puzzleCount !== 1 ? 's' : ''}</strong>{' '}
                    belonging to this category.
                  </span>
                </div>
              ) : (
                <p className={styles.noPuzzleNote}>This category has no puzzles.</p>
              )}
              <p className={styles.irreversibleNote}>This action <strong>cannot be undone</strong>.</p>
            </div>

            <div className={styles.modalActions}>
              <Button
                type="button"
                variant="secondary"
                icon={FaTimes}
                onClick={handleCancelDelete}
                disabled={deleteModal.loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                icon={FaTrash}
                onClick={handleConfirmDelete}
                disabled={deleteModal.loading}
              >
                {deleteModal.loading
                  ? 'Deleting…'
                  : `Delete`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryList;
