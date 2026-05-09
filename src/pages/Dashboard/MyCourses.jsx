import React from 'react';
import { FaGraduationCap, FaRocket, FaClock } from 'react-icons/fa';
import PageHeader from '../../components/PageHeader/PageHeader';
import styles from './DashboardPages.module.css';

const MyCourses = () => {
    return (
        <div className={styles.pageContainer}>
            {/* <PageHeader
                title="My Courses"
                subtitle="Master the game with expert-led training"
                icon={<FaGraduationCap />}
            /> */}

            <div className={styles.comingSoonContainer}>
                <div className={styles.comingSoonIconWrapper}>
                    <FaRocket />
                </div>
                <div className={styles.comingSoonBadge}>Module in Development</div>
                <h2 className={styles.comingSoonTitle}>Elevate Your Game Soon</h2>
                <p className={styles.comingSoonText}>
                    We're currently crafting a world-class curriculum designed to take you from beginner to grandmaster.
                    Expect high-quality video lessons, interactive puzzles, and personalized training paths
                    launching very soon in the Academy.
                </p>
                <div className={styles.comingSoonMeta}>
                    <FaClock /> <span>Stay tuned for our first major curriculum drop</span>
                </div>
            </div>
        </div>
    );
};

export default MyCourses;
