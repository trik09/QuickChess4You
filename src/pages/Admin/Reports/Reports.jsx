import { FaChartBar, FaTrophy, FaUsers, FaChartLine, FaDownload } from 'react-icons/fa';
import styles from './Reports.module.css';

function Reports() {
  return (
    <div className={styles.reports}>
      <div className={styles.header}>
        <h2>Reports & Analytics</h2>
        <p>View detailed reports and analytics</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3><FaChartBar style={{ marginRight: '8px' }} />Puzzle Submissions</h3>
          <p>Track puzzle completion rates and user performance</p>
          <button className={styles.viewBtn}>View Report</button>
        </div>
        <div className={styles.card}>
          <h3><FaTrophy style={{ marginRight: '8px' }} />Competition Analytics</h3>
          <p>Analyze competition participation and outcomes</p>
          <button className={styles.viewBtn}>View Report</button>
        </div>
        <div className={styles.card}>
          <h3><FaUsers style={{ marginRight: '8px' }} />User Activity</h3>
          <p>Monitor user engagement and activity patterns</p>
          <button className={styles.viewBtn}>View Report</button>
        </div>
        <div className={styles.card}>
          <h3><FaChartLine style={{ marginRight: '8px' }} />Growth Metrics</h3>
          <p>Track platform growth and key metrics</p>
          <button className={styles.viewBtn}>View Report</button>
        </div>
      </div>

      <div className={styles.exportSection}>
        <h3>Export Data</h3>
        <div className={styles.exportOptions}>
          <button className={styles.exportBtn} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaDownload /> Export as CSV</button>
          <button className={styles.exportBtn} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaDownload /> Export as PDF</button>
          <button className={styles.exportBtn} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaDownload /> Export as Excel</button>
        </div>
      </div>
    </div>
  );
}

export default Reports;
