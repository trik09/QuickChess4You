import React from 'react';
import styles from './DashboardPages.module.css';

const MyCourses = () => {
    const courses = [
        { id: 1, name: 'Beginner Fundamentals', progress: 45, nextLesson: 'Piece Coordination' },
    ];

    return (
        <div className={styles.pageContainer}>
            <header className={styles.pageHeader}>
                <h1>My Courses</h1>
                <p>Continue your learning journey</p>
            </header>

            <div className={styles.coursesGrid}>
                {courses.map(course => (
                    <div key={course.id} className={styles.courseCard}>
                        <div className={styles.coursePreview}>
                            {/* Placeholder for course image */}
                            <div className={styles.placeholderImg}>♟️</div>
                        </div>
                        <div className={styles.courseInfo}>
                            <h3>{course.name}</h3>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${course.progress}%` }}></div>
                            </div>
                            <span className={styles.progressText}>{course.progress}% Complete</span>
                            <p className={styles.nextLesson}>Up Next: {course.nextLesson}</p>
                            <button className={styles.actionBtn}>Resume</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyCourses;
