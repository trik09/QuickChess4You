import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import styles from './Gallery.module.css';

const Gallery = () => {
    const [selectedImage, setSelectedImage] = useState(null);

    // 20 photos using the same image for now
    const photos = Array(20).fill({
        url: 'https://content.jdmagicbox.com/v2/comp/bangalore/m2/080pxx80.xx80.230107012949.d9m2/catalogue/sajjan-chess-academy-nagarbhavi-bangalore-chess-coach-9t0dkfvmmc.jpg',
        alt: 'Chess Academy'
    });

    // Assign random sizes for masonry effect
    const photoSizes = photos.map((photo, idx) => ({
        ...photo,
        size: idx % 5 === 0 ? 'large' : idx % 3 === 0 ? 'medium' : 'small'
    }));

    const openModal = (index) => {
        setSelectedImage(index);
    };

    const closeModal = () => {
        setSelectedImage(null);
    };

    const navigateImage = (direction) => {
        if (selectedImage === null) return;

        if (direction === 'prev') {
            setSelectedImage(selectedImage === 0 ? photos.length - 1 : selectedImage - 1);
        } else {
            setSelectedImage(selectedImage === photos.length - 1 ? 0 : selectedImage + 1);
        }
    };

    return (
        <div className={styles.galleryPage}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Our Gallery</h1>
                <p className={styles.pageSubtitle}>Moments captured at our chess academy</p>
            </div>

            <div className={styles.galleryGrid}>
                {photoSizes.map((photo, index) => (
                    <div
                        key={index}
                        className={`${styles.galleryItem} ${styles[photo.size]}`}
                        onClick={() => openModal(index)}
                    >
                        <img src={photo.url} alt={`${photo.alt} ${index + 1}`} />
                        <div className={styles.imageOverlay}>
                            <span className={styles.viewText}>View Full Size</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {selectedImage !== null && (
                <div className={styles.modal} onClick={closeModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={closeModal}>
                            <FaTimes />
                        </button>

                        <button
                            className={`${styles.navBtn} ${styles.prevBtn}`}
                            onClick={() => navigateImage('prev')}
                        >
                            ❮
                        </button>

                        <img
                            src={photos[selectedImage].url}
                            alt={`${photos[selectedImage].alt} ${selectedImage + 1}`}
                            className={styles.modalImage}
                        />

                        <button
                            className={`${styles.navBtn} ${styles.nextBtn}`}
                            onClick={() => navigateImage('next')}
                        >
                            ❯
                        </button>

                        <div className={styles.imageCounter}>
                            {selectedImage + 1} / {photos.length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gallery;
