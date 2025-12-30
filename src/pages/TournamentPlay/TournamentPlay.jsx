import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { competitionAPI } from '../../services/api';
import styles from './TournamentPlay.module.css';
import { toast } from 'react-hot-toast';
import ChessBoard from '../../components/ChessBoard/ChessBoard'; // Manual Board

const TournamentPlay = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [competition, setCompetition] = useState(null);
    const [puzzles, setPuzzles] = useState([]);
    const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
    const [solvedPuzzles, setSolvedPuzzles] = useState({}); // { [puzzleId]: 'solved' | 'wrong' | null }
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(null); // in seconds
    const [isSubmitting, setIsSubmitting] = useState(false);

    const timerRef = useRef(null);

    // 1. Initial Data Load
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Competition info
                const response = await competitionAPI.getById(id);
                if (response.success) {
                    const comp = response.data;
                    setCompetition(comp);
                    setPuzzles(comp.puzzles || []);

                    // Determine time left
                    const now = new Date();
                    const end = new Date(comp.endTime);
                    const diffSeconds = Math.floor((end - now) / 1000);

                    // If ended, redirect
                    if (diffSeconds <= 0 && comp.status === 'completed') {
                        navigate(`/competition/${id}/lobby`);
                        return;
                    }

                    setTimeLeft(diffSeconds > 0 ? diffSeconds : 0);
                }

                // Fetch Participant Progress (Persistence)
                try {
                    const statusRes = await competitionAPI.getParticipantDetails(id);
                    if (statusRes.success && statusRes.data) {
                        const pData = statusRes.data;

                        // Restore solved puzzles based on competition data where we have the full list
                        // The ParticipantModel might only have count. 
                        // But actually, we need to know WHICH puzzles are solved.
                        // Since 'ParticipantSchema' doesn't seem to store the list of IDs (only count),
                        // we need to rely on the embedded data in `competition.participants` or update schema.
                        // However, let's try to match with `competition.participants` if available.
                    }
                } catch (err) {
                    console.log("Could not load participant status", err);
                }

            } catch (error) {
                console.error("Error loading competition:", error);
                toast.error("Failed to load game");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    // Independent effect to sync solved state from competition data once loaded
    useEffect(() => {
        if (competition && competition.participants) {
            const storedUser = localStorage.getItem("user"); // We rely on stored user info or token decoding
            let myId = null;

            if (storedUser) {
                try {
                    const userObj = JSON.parse(storedUser);
                    myId = userObj.id || userObj._id;
                } catch (e) { }
            }

            if (!myId) {
                // Fallback: decode token
                const token = localStorage.getItem("token");
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        myId = payload.id;
                    } catch (e) { }
                }
            }

            if (myId) {
                const me = competition.participants.find(p => {
                    const pUserId = typeof p.user === 'string' ? p.user : p.user?._id;
                    return pUserId === myId;
                });

                if (me && me.completedPuzzles) {
                    const newSolved = {};
                    me.completedPuzzles.forEach(pid => {
                        newSolved[pid] = 'solved';
                    });
                    setSolvedPuzzles(newSolved);
                }
            }
        }
    }, [competition]);

    // 2. Timer Logic
    useEffect(() => {
        if (timeLeft === null) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleTimeOut();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [timeLeft]);

    const handleTimeOut = async () => {
        toast("Time's up!", { icon: '⏳' });
        await handleSubmitTournament();
    };

    const handleSubmitTournament = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await competitionAPI.finishParticipation(id);
            toast.success("Tournament Completed!");
            navigate(`/competition/${id}/lobby`);
        } catch (error) {
            console.error("Error finishing:", error);
            // Even if error, we likely want to exit
            navigate(`/competition/${id}/lobby`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 3. Puzzle Logic
    const handlePuzzleSolved = async () => {
        const puzzle = puzzles[currentPuzzleIndex];
        if (!puzzle || solvedPuzzles[puzzle._id] === 'solved') return;

        // Optimistic UI Update
        setSolvedPuzzles(prev => ({ ...prev, [puzzle._id]: 'solved' }));
        toast.success("Correct!", { duration: 1000 });

        // Auto advance (Optimistic) - allow user to proceed regardless of network speed
        setTimeout(() => {
            if (currentPuzzleIndex < puzzles.length - 1) {
                setCurrentPuzzleIndex(prev => prev + 1);
            } else {
                toast("All puzzles solved! You can finish now.", { icon: '🎉' });
            }
        }, 800); // 800ms delay for visual feedback

        try {
            // Submit solution
            await competitionAPI.submitSolution(id, puzzle._id, {
                moves: puzzle.solutionMoves || puzzle.solution || [],
                timeTaken: 10 // This should ideally be calculated based on real time
            });

        } catch (error) {
            console.error("Submission error", error);
            // Optionally toast error if critical, but for now we let them play
        }
    };

    const handleWrongMove = () => {
        const puzzle = puzzles[currentPuzzleIndex];
        setSolvedPuzzles(prev => ({ ...prev, [puzzle._id]: 'wrong' }));
        // toast.error("Incorrect move"); // Optional, board handles feedback too
    };

    // Helper for Timer Display
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className={styles.loading}>Loading Tournament...</div>;

    const currentPuzzle = puzzles[currentPuzzleIndex];

    return (
        <div className={styles.playContainer}>

            {/* Left Panel: Info */}
            <div className={styles.leftPanel}>
                <h2 className={styles.competitionTitle}>{competition?.name}</h2>

                <div className={styles.timerContainer}>
                    <span className={styles.timerLabel}>Time Remaining</span>
                    <div className={`${styles.timer} ${timeLeft < 60 ? styles.warning : ''}`}>
                        {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                    </div>
                </div>

                {/* Could add player stats or upcoming features here */}
            </div>

            {/* Center Panel: Board */}
            <div className={styles.centerPanel}>
                <div className={styles.boardHeader}>
                    {currentPuzzle && (
                        <div className={styles.puzzleInfo}>
                            Puzzle #${currentPuzzleIndex + 1}
                            {/* <span style={{opacity: 0.7, marginLeft: '8px'}}>({currentPuzzle.difficulty})</span> */}
                        </div>
                    )}
                </div>

                <div className={styles.boardWrapper}>
                    {currentPuzzle ? (
                        <ChessBoard
                            key={currentPuzzle._id} // Remount on puzzle change
                            fen={currentPuzzle.fen}
                            solution={currentPuzzle.solutionMoves || currentPuzzle.solution || []}
                            onPuzzleSolved={handlePuzzleSolved}
                            onWrongMove={handleWrongMove}
                            puzzleType="normal"
                            interactive={!(solvedPuzzles[currentPuzzle._id] === 'solved')}
                        />
                    ) : (
                        <p>No puzzles loaded</p>
                    )}
                </div>
            </div>

            {/* Right Panel: Grid & Actions */}
            <div className={styles.rightPanel}>
                <h3 className={styles.sectionTitle}>Puzzles</h3>

                <div className={styles.puzzleGrid}>
                    {puzzles.map((p, idx) => {
                        const status = solvedPuzzles[p._id];
                        return (
                            <button
                                key={p._id}
                                className={`
                                    ${styles.puzzleBtn}
                                    ${idx === currentPuzzleIndex ? styles.active : ''}
                                    ${status === 'solved' ? styles.solved : ''}
                                    ${status === 'wrong' ? styles.wrong : ''}
                                `}
                                onClick={() => setCurrentPuzzleIndex(idx)}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>

                <div className={styles.actionArea}>
                    <button
                        className={styles.finishBtn}
                        onClick={handleSubmitTournament}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Finishing...' : 'Finish & Return'}
                    </button>
                </div>
            </div>

        </div>
    );
};

export default TournamentPlay;
