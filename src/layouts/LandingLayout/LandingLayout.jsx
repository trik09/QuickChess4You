import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import LoginModal from '../../components/LoginModal/LoginModal';
import styles from './LandingLayout.module.css';

const LandingLayout = () => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('login');
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Check if session expired
        const sessionExpired = searchParams.get("reason") === "session_expired";
        
        if (sessionExpired) {
            setModalMode('login');
            setIsLoginModalOpen(true);
            // Clear the query parameter
            navigate(location.pathname, { replace: true });
        } else if (location.state?.openLogin) {
            setIsLoginModalOpen(true);
            // Clear state to prevent reopening on reload
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate, searchParams]);

    const handleLoginClick = () => {
        setModalMode('login');
        setIsLoginModalOpen(true);
    };

    const handleSignupClick = () => {
        setModalMode('signup');
        setIsLoginModalOpen(true);
    };

    return (
        <div className={styles.container}>
            <Navbar onLoginClick={handleLoginClick} onSignupClick={handleSignupClick} />
            <main className={styles.main}>
                <Outlet context={{ handleLoginClick, handleSignupClick }} />
            </main>
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                initialMode={modalMode}
            />
        </div>
    );
};

export default LandingLayout;
