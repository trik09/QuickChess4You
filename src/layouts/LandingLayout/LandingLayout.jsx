import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import LoginModal from '../../components/LoginModal/LoginModal';
import styles from './LandingLayout.module.css';

const LandingLayout = () => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('login');
    const [modalReturnTo, setModalReturnTo] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Check if session expired or auth is required
        const reason = searchParams.get("reason");
        const sessionExpired = reason === "session_expired" || reason === "auth_required";

        if (sessionExpired) {
            setModalMode('login');
            setModalReturnTo(returnTo);
            setIsLoginModalOpen(true);
            // Clear the query parameters
            navigate(location.pathname, { replace: true });
        } else if (location.state?.openLogin) {
            setIsLoginModalOpen(true);
            setModalReturnTo('');
            // Clear state to prevent reopening on reload
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate, searchParams]);

    const handleLoginClick = () => {
        setModalMode('login');
        setModalReturnTo('');
        setIsLoginModalOpen(true);
    };

    const handleSignupClick = () => {
        setModalMode('signup');
        setModalReturnTo('');
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
                returnTo={modalReturnTo}
            />
        </div>
    );
};

export default LandingLayout;
