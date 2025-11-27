import { FaFolder, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { PageHeader, Button, IconButton } from '../../../components/Admin';
import styles from './CategoryList.module.css';

function CategoryList() {
  const categories = [
    { id: 1, name: 'Tactics', totalPuzzles: 156, createdAt: '2024-01-15', description: 'Tactical puzzles and combinations' },
    { id: 2, name: 'Endgame', totalPuzzles: 89, createdAt: '2024-02-10', description: 'Endgame studies and positions' },
    { id: 3, name: 'Opening', totalPuzzles: 67, createdAt: '2024-03-05', description: 'Opening traps and theory' },
    { id: 4, name: 'Middlegame', totalPuzzles: 124, createdAt: '2024-04-12', description: 'Middlegame strategy' },
  ];

  return (
    <div className={styles.categoryList}>
      <PageHeader
        icon={FaFolder}
        title="Puzzle Categories"
        subtitle="Manage puzzle categories"
        action={
          <Button icon={FaPlus}>Add Category</Button>
        }
      />

      <div className={styles.grid}>
        {categories.map(category => (
          <div key={category.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>{category.name}</h3>
              <div className={styles.actions}>
                <IconButton icon={FaEdit} variant="primary" title="Edit" />
                <IconButton icon={FaTrash} variant="danger" title="Delete" />
              </div>
            </div>
            <p className={styles.description}>{category.description}</p>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{category.totalPuzzles}</span>
                <span className={styles.statLabel}>Puzzles</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Created</span>
                <span className={styles.statValue}>{category.createdAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategoryList;
