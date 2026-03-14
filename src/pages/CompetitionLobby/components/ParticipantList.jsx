import React from "react";
import { FaUserCircle } from "react-icons/fa";
import styles from "../CompetitionLobby.module.css";

const ParticipantList = ({
    participants,
    user,
    competition,
    currentPage,
    setCurrentPage,
    itemsPerPage,
}) => {
    const getProcessedParticipants = () => {
        // 1. Deduplicate by UserId (keeping highest score/activity)
        const uniqueUsers = new Map();
        participants.forEach(entry => {
            const uid = entry.userId?._id || entry.userId || entry.id;
            if (!uid) return;
            
            const existing = uniqueUsers.get(String(uid));
            // Keep the one with more puzzles solved or higher score
            if (!existing || (entry.puzzlesSolved || 0) > (existing.puzzlesSolved || 0) || (entry.score || 0) > (existing.score || 0)) {
                uniqueUsers.set(String(uid), entry);
            }
        });

        // 2. Sort by Puzzles Solved (DESC) then Time (ASC)
        return Array.from(uniqueUsers.values()).sort((a, b) => {
            if (b.puzzlesSolved !== a.puzzlesSolved) {
                return (b.puzzlesSolved || 0) - (a.puzzlesSolved || 0);
            }
            return (a.timeSpent || 0) - (b.timeSpent || 0);
        });
    };

    const processedParticipants = getProcessedParticipants();
    const totalPages = Math.ceil(processedParticipants.length / itemsPerPage) || 1;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentParticipants = processedParticipants.slice(
        indexOfFirstItem,
        indexOfLastItem,
    );

    const handlePageChange = (pageNum) => {
        if (pageNum >= 1 && pageNum <= totalPages) {
            setCurrentPage(pageNum);
        }
    };

    const getStatus = (participant) => {
        // Prefer explicit status coming from backend (JOINED / PLAYING / SUBMITTED)
        if (participant.status) return participant.status;

        // Legacy flag from older data structures
        if (participant.isSubmitted || participant.submittedAt) return "SUBMITTED";

        // Heuristic: if the player has started solving (score, puzzles, time),
        // treat them as PLAYING even if status wasn't sent.
        const hasActivity =
            (participant.puzzlesSolved && participant.puzzlesSolved > 0) ||
            (participant.score && participant.score > 0) ||
            (participant.timeSpent && participant.timeSpent > 0);

        if (hasActivity) return "PLAYING";

        // Default fallback when they have joined but not started
        return "JOINED";
    };

    const formatTime = (seconds) => {
        if (!seconds && seconds !== 0) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className={`${styles.lobbyCard} ${styles.participantsCard}`}>
            <h2 className={styles.sectionTitle}>
                Participants ({participants.length})
            </h2>
            <div className={styles.tableResponsive}>
                <table className={styles.participantsTable}>
                    <thead>
                        <tr>
                            <th className={styles.thRank}>Rank</th>
                            <th className={styles.thPlayer}>Player</th>
                            <th className={styles.thStatus}>Status</th>
                            <th className={styles.thPuzzles}>Score</th>
                            <th className={styles.thTime}>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.length > 0 ? (
                            currentParticipants.map((p, idx) => {
                                const actualRank = indexOfFirstItem + idx + 1;
                                return (
                                    <tr
                                        key={`${p.userId || idx}-${actualRank}`}
                                        className={`${p.userId === user?.id || p.userId?._id === user?.id ? styles.rowHighlight : ""}`}
                                    >
                                        <td className={styles.tdRank}>#{actualRank}</td>
                                        <td className={styles.tdPlayer}>
                                            <div className={styles.playerInfo}>
                                                {p.userId === user?.id ? (
                                                    <span
                                                        className={`${styles.playerAvatar} ${styles.self}`}
                                                    >
                                                        You
                                                    </span>
                                                ) : (
                                                    <span className={styles.playerAvatar}>
                                                        <FaUserCircle />
                                                    </span>
                                                )}
                                                <span className={styles.playerName}>
                                                    {p.username || p.name || "User"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={styles.tdStatus}>
                                            <span
                                                className={`${styles.statusBadge} ${styles[getStatus(p).toLowerCase()] || styles.defaultStatus}`}
                                            >
                                                {getStatus(p)}
                                            </span>
                                        </td>
                                        <td className={styles.tdPuzzles}>
                                            <div className={styles.scoreContainer}>
                                                <span className={styles.scoreHighlight}>
                                                    {p.puzzlesSolved || 0}
                                                </span>
                                                <span className={styles.scoreSeparator}>/</span>
                                                <span className={styles.scoreTotal}>
                                                    {competition?.totalPuzzles ||
                                                        competition?.puzzles?.length ||
                                                        0}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={styles.tdTime}>
                                            <span className={styles.timeBadge}>
                                                {p.timeSpent ? formatTime(p.timeSpent) : "--:--"}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className={styles.emptyRow}>
                                    No participants yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div
                    className={styles.paginationContainer}
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "10px",
                        marginTop: "15px",
                    }}
                >
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background:
                                currentPage === 1 ? "rgba(255,255,255,0.05)" : "#d4a373",
                            color: currentPage === 1 ? "#666" : "#fff",
                            border: "none",
                            cursor: currentPage === 1 ? "not-allowed" : "pointer",
                            fontWeight: "bold",
                        }}
                    >
                        Prev
                    </button>
                    <span
                        style={{
                            color: "#d4a373",
                            fontWeight: "600",
                            fontSize: "14px",
                        }}
                    >
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background:
                                currentPage === totalPages
                                    ? "rgba(255,255,255,0.05)"
                                    : "#d4a373",
                            color: currentPage === totalPages ? "#666" : "#fff",
                            border: "none",
                            cursor:
                                currentPage === totalPages ? "not-allowed" : "pointer",
                            fontWeight: "bold",
                        }}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default ParticipantList;
