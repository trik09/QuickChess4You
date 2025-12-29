import React, { useMemo, useState, useEffect } from 'react';
import { FaCarSide, FaFlagCheckered } from 'react-icons/fa';
import { useLiveCompetition } from '../../contexts/LiveCompetitionContext';
import { useAuth } from '../../contexts/AuthContext';
import './PuzzleRacer.css';

const PuzzleRacer = () => {
    const { leaderboard, competition, participant } = useLiveCompetition();
    const { user } = useAuth();
    const [isBoosting, setIsBoosting] = useState(false);
    const [prevScore, setPrevScore] = useState(0);

    // Safety check
    if (!competition) return null;

    // Detect score increase to trigger boost animation
    useEffect(() => {
        if (participant && participant.score > prevScore) {
            setIsBoosting(true);
            const timer = setTimeout(() => setIsBoosting(false), 2000); // 2s Turbo Boost
            setPrevScore(participant.score);
            return () => clearTimeout(timer);
        }
        // Sync score on initial load without boosting
        if (participant && prevScore === 0 && participant.score > 0) {
            setPrevScore(participant.score);
        }
    }, [participant, prevScore]);

    const totalPuzzles = useMemo(() => {
        if (competition.puzzles && competition.puzzles.length) return competition.puzzles.length;
        return 10; // Default fallback
    }, [competition]);

    const racers = useMemo(() => {
        if (!leaderboard) return [];

        const currentUserId = user ? (user.id || user._id) : null;

        // 1. Strict Activity Filter: Only show active users (Last 10 mins) OR Me
        // If lastActivity is missing, assume active (for backward compatibility) or filter out?
        // Let's be semi-strict: if lastActivity exists, check it.
        const tenMinutesAgo = Date.now() - (10 * 60 * 1000);

        const activeRacers = leaderboard.filter(r => {
            // Always show ME
            if (currentUserId && (r.userId === currentUserId || r.username === user?.username)) return true;

            // Check activity
            if (r.lastActivity) {
                const lastActive = new Date(r.lastActivity).getTime();
                return lastActive > tenMinutesAgo;
            }
            // If no activity date, assume active for now (or filter if "ghosts" are the issue)
            // Given the ghost issue, let's essentially TRUST the strict context reset we did earlier.
            // But if ghosts persist, they might be in the DB.
            return true;
        });

        // 2. Sort by Rank
        const sorted = [...activeRacers].sort((a, b) => a.rank - b.rank);

        // 3. Top 5 Logic
        const top5 = sorted.slice(0, 5);
        const currentUserInTop5 = top5.find(p => p.userId === currentUserId || (user && p.username === user.username));

        let displayList = [...top5];

        if (currentUserId && !currentUserInTop5) {
            const currentUserEntry = sorted.find(p => p.userId === currentUserId || (user && p.username === user.username));
            if (currentUserEntry) {
                displayList.push(currentUserEntry);
            } else if (user) {
                // Show me at start even if not in leaderboard yet
                displayList.push({
                    userId: user.id || user._id,
                    username: user.username || 'You',
                    rank: 999,
                    score: 0,
                    puzzlesSolved: 0
                });
            }
        }

        return displayList;
    }, [leaderboard, user]);

    const getProgress = (solvedCount) => {
        if (!totalPuzzles || totalPuzzles === 0) return 0;
        const pct = (solvedCount / totalPuzzles) * 100;
        return Math.min(100, Math.max(0, pct));
    };

    return (
        <div className="puzzle-racer-container">
            <h4 style={{ marginBottom: '10px', color: '#ccc', textAlign: 'center', fontSize: '0.9rem' }}>
                Live Race Progress {isBoosting && "🚀"}
            </h4>

            <div className={`racer-track ${isBoosting ? 'boosting' : ''}`} style={{ height: `${Math.max(120, racers.length * 35)}px` }}>
                <div className="finish-line"></div>

                {racers.length === 0 && (
                    <div className="waiting-message">Waiting for racers...</div>
                )}

                {racers.map((racer, index) => {
                    const isCurrentUser = user && (racer.userId === user.id || racer.userId === user._id || racer.username === user.username);
                    const progress = getProgress(racer.puzzlesSolved || 0);

                    return (
                        <div
                            key={racer.userId || racer.username}
                            className="track-lane"
                            style={{ top: 0, height: '35px' }}
                        >
                            <div
                                className={`racer-car-wrapper ${isCurrentUser ? 'current-user' : ''} rank-${racer.rank}`}
                                style={{ left: `${progress}%` }}
                            >
                                <FaCarSide className="racer-car-icon" />
                                <span className="racer-username">
                                    {isCurrentUser ? 'You' : racer.username}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div style={{ textAlign: 'right', fontSize: '10px', color: '#666', marginTop: '5px' }}>
                Finish Line ({totalPuzzles} Puzzles)
            </div>
        </div>
    );
};

export default PuzzleRacer;
