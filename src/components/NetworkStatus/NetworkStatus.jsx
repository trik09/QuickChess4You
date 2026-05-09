import React, { useState, useEffect } from 'react';
import { MdSignalCellularAlt, MdSignalCellularAlt1Bar, MdSignalCellularAlt2Bar, MdSignalCellularConnectedNoInternet0Bar } from 'react-icons/md';
import styles from './NetworkStatus.module.css';

const NetworkStatus = ({ isCollapsed = false }) => {
    const [latency, setLatency] = useState(null);
    const [status, setStatus] = useState('good'); // 'good', 'fair', 'poor', 'offline'

    useEffect(() => {
        const checkLatency = async () => {
            if (!navigator.onLine) {
                setStatus('offline');
                setLatency(null);
                return;
            }

            const start = Date.now();
            try {
                // Use the ping endpoint to check latency.
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
                await fetch(`${apiUrl}/ping`, { 
                    method: 'GET',
                    cache: 'no-store'
                });
                const rtt = Date.now() - start;
                setLatency(rtt);

                if (rtt < 150) setStatus('good');
                else if (rtt < 400) setStatus('fair');
                else setStatus('poor');
            } catch (error) {
                console.error("Network check failed:", error);
                setStatus('poor');
                setLatency(null);
            }
        };

        // Initial check
        checkLatency();

        // Check every 30 seconds
        const interval = setInterval(checkLatency, 30000);

        const handleOnline = () => {
            setStatus('good');
            checkLatency();
        };
        const handleOffline = () => setStatus('offline');

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            clearInterval(interval);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const getIcon = () => {
        switch (status) {
            case 'good':
                return <MdSignalCellularAlt className={styles.iconGood} />;
            case 'fair':
                return <MdSignalCellularAlt2Bar className={styles.iconFair} />;
            case 'poor':
                return <MdSignalCellularAlt1Bar className={styles.iconPoor} />;
            case 'offline':
                return <MdSignalCellularConnectedNoInternet0Bar className={styles.iconOffline} />;
            default:
                return <MdSignalCellularAlt className={styles.iconGood} />;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'good': return 'Connection Good';
            case 'fair': return 'Connection Fair';
            case 'poor': return 'Connection Poor';
            case 'offline': return 'Offline';
            default: return 'Checking...';
        }
    };

    return (
        <div className={`${styles.container} ${isCollapsed ? styles.collapsed : ''}`} title={`${getStatusText()} ${latency ? `(${latency}ms)` : ''}`}>
            <div className={styles.iconWrapper}>
                {getIcon()}
            </div>
            {!isCollapsed && (
                <div className={styles.textWrapper}>
                    <span className={styles.statusLabel}>{getStatusText()}</span>
                    {latency && <span className={styles.latencyValue}>{latency}ms</span>}
                </div>
            )}
        </div>
    );
};

export default NetworkStatus;
