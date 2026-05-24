import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FaClock,
  FaCheckCircle,
  FaPuzzlePiece,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaChevronLeft,
  FaChevronRight,
  FaCaretLeft,
  FaCaretRight,
  FaStar,
  FaRegStar,
  FaChartBar,
  FaTrophy,
  FaSyncAlt,
  FaChessBoard,
  FaGraduationCap,
  FaClipboardList,
  FaUserFriends,
  FaCog,
  FaArrowLeft
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import socketService from "../../services/socketService";

import ChessBoard from "../../components/ChessBoard/ChessBoard";
import { puzzleAPI, competitionAPI, eventAPI } from "../../services/api";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import { liveEventAPI } from "../../services/liveEventAPI";
import { useAuth } from "../../contexts/AuthContext";
import { useLiveCompetition } from "../../contexts/LiveCompetitionContext";
import { useLiveEvent } from "../../contexts/LiveEventContext";
import PuzzleRacer from "../../components/PuzzleRacer/PuzzleRacer";
import GameTimer from "./components/GameTimer";
import PremiumLoader from "../../components/PremiumLoader/PremiumLoader";
import CompetitionChat from "./components/CompetitionChat/CompetitionChat";
import styles from "./PuzzlePage.module.css";
import blackKingSvg from "../../assets/pieces/blackking.svg";
import whiteKingSvg from "../../assets/pieces/whiteking.svg";

// Convert an array of UCI moves (e.g. "e2e4", "a8a2") to SAN notation
// by replaying them from the given FEN position using chess.js
function uciMovesToSan(fen, uciMoves) {
  if (!fen || !uciMoves?.length) return uciMoves || [];
  try {
    const chess = new Chess(fen);
    return uciMoves.map((uci) => {
      // Already SAN if it contains piece letters or special chars beyond 4 chars
      if (!uci || uci.length < 4) return uci;
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length === 5 ? uci[4] : undefined;
      try {
        const result = chess.move({ from, to, promotion });
        return result ? result.san : uci;
      } catch {
        return uci;
      }
    });
  } catch {
    return uciMoves;
  }
}

function toSentenceCase(str) {
  if (!str) return "";
  const cleaned = str.trim();
  const aimMatch = cleaned.match(/^AIM\s*[-:]\s*(.*)/i);
  if (aimMatch) {
    const rest = aimMatch[1].trim();
    if (!rest) return "Aim";
    return "Aim - " + rest.charAt(0).toUpperCase() + rest.slice(1).toLowerCase();
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

function PuzzlePage({ isEvent = false }) {
  const { id: paramCompetitionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const compCtx = useLiveCompetition();
  const eventCtx = useLiveEvent();

  const participateInCompetition = isEvent ? eventCtx.participateInEvent : compCtx.participateInCompetition;
  const disconnectFromCompetition = isEvent ? eventCtx.disconnectFromEvent : compCtx.disconnectFromCompetition;
  const getLeaderboard = isEvent ? eventCtx.getLeaderboard : compCtx.getLeaderboard;
  const leaderboard = isEvent ? eventCtx.leaderboard : compCtx.leaderboard;
  const getCurrentUserRank = isEvent ? eventCtx.getCurrentUserRank : compCtx.getCurrentUserRank;
  const ensureSocketConnection = isEvent ? (() => { }) : compCtx.ensureSocketConnection;
  const updateParticipant = isEvent ? eventCtx.updateParticipant : compCtx.updateParticipant;

  // State - Initialize instantly from location.state if available to eliminate loading delays
  const [competitionData, setCompetitionData] = useState(() => {
    if (location.state?.competitionId) {
      return {
        _id: location.state.competitionId,
        name: location.state.competitionTitle,
        duration: location.state.time,
        startTime: location.state.competitionStartTime,
        endTime: location.state.competitionEndTime,
        status: location.state.status || "live",
      };
    }
    return null;
  });


  const [puzzles, setPuzzles] = useState(() => {
    // If we're in Review mode, do NOT hydrate from location.state.puzzles because we need
    // the backend to give us the fresh moveHistory data for each attempt!
    if (
      location.state?.puzzles &&
      Array.isArray(location.state.puzzles) &&
      !location.state?.reviewMode
    ) {
      return location.state.puzzles.map((p, index) => ({
        id: p._id,
        _id: p._id,
        index: index + 1,
        fen:
          p.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        solution: p.solutionMoves || [],
        alternativeSolutions: p.alternativeSolutions || [],
        title: p.title || `Puzzle ${index + 1}`,
        type: p.type === "kids" || p.type === "capture" ? "Capture" : p.title || "Puzzle",
        difficulty: p.difficulty || "medium",
        category: p.category || "",
        puzzleType: p.type === "kids" ? "capture" : (p.type || "normal"),
        captureConfig: p.captureConfig || p.kidsConfig || null,
        illegalConfig: p.illegalConfig || null,
        firstMoveBy: p.firstMoveBy || "human",
        isSolved: false,
        isFailed: false,
        status: "unsolved",
      }));
    }
    return [];
  });
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0); // For pagination (0 = 1-20, 1 = 21-40, etc.)
  const ITEMS_PER_PAGE = 10;

  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [showGalaxy, setShowGalaxy] = useState(true);
  const headerScrollRef = useRef(null);

  const scrollHeader = (direction) => {
    if (headerScrollRef.current) {
      const scrollAmount = 200;
      headerScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Chapter scroll reference and minimal indicator state
  const chapterScrollRef = useRef(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Automatically scroll active chapter into view whenever activeChapterIndex changes
  useEffect(() => {
    if (chapterScrollRef.current) {
      const activeTab = chapterScrollRef.current.querySelector(
        `.${styles.chapterPillActive}`,
      );
      if (activeTab) {
        activeTab.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }
  }, [activeChapterIndex]);

  // Check if chapters overflow container to show/hide scroll indicator
  const checkScrollOverflow = () => {
    if (chapterScrollRef.current) {
      const { scrollWidth, clientWidth } = chapterScrollRef.current;
      setShowScrollIndicator(scrollWidth > clientWidth + 5);
    }
  };

  useEffect(() => {
    checkScrollOverflow();
    window.addEventListener("resize", checkScrollOverflow);
    return () => window.removeEventListener("resize", checkScrollOverflow);
  }, [competitionData?.chapters]);

  // Handle native scroll to update the custom indicator thumb
  const handleChapterScroll = (e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.target;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(scrollLeft / maxScroll);
    }
  };

  // If we have initial location state, we don't need to show the loading screen at all!
  const [loading, setLoading] = useState(!location.state?.competitionId);
  const [solving, setSolving] = useState(false);
  const [isLiveCompetition, setIsLiveCompetition] = useState(
    !!location.state?.competitionId,
  );
  const [isReviewMode, setIsReviewMode] = useState(
    location.state?.reviewMode || false,
  );
  const [showSolution, setShowSolution] = useState(false);

  const [puzzleStatuses, setPuzzleStatuses] = useState({}); // { [puzzleId]: 'success' | 'failed' }
  const [puzzleBoardStates, setPuzzleBoardStates] = useState({}); // { [puzzleId]: { fen: string, moveHistory: string[] } }
  const [isBeforeStartTime, setIsBeforeStartTime] = useState(false);

  // New state strictly for Review Mode to track practice attempts vs actual competition results
  const [practiceStatuses, setPracticeStatuses] = useState({}); // { [puzzleId]: 'success' | 'failed' }

  // ─── FIX 2: Review mode reset key ───────────────────────────────────────────
  // Incrementing this forces the ChessBoard to fully remount/reset for the
  // current puzzle without navigating away.
  const [reviewResetKey, setReviewResetKey] = useState(0);

  // Timer & Score
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [score, setScore] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  // ─── Stable participant count ─────────────────────────────────────────────
  // The raw leaderboard array from context gets a new entry appended on every
  // score-update socket event, so `leaderboard.length` grows with each move
  // made by any player — it is NOT the real participant count.
  // We store the true count from the server on load and only update it when
  // the deduplicated leaderboard grows larger than what we already know.
  const [participantCount, setParticipantCount] = useState(0);

  // Submission Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Solution Modal State (for Review Mode)
  const [showSolutionModal, setShowSolutionModal] = useState(false);

  // Inline Solution Toggle State (for Review Mode)
  const [showInlineSolution, setShowInlineSolution] = useState(false);

  // Reset inline solution AND reviewResetKey when puzzle changes
  useEffect(() => {
    setShowInlineSolution(false);
    setReviewResetKey(0); // reset manual-reset counter when switching puzzles
  }, [currentPuzzleIndex]);

  const [notParticipated, setNotParticipated] = useState(false);
  const [participationMessage, setParticipationMessage] = useState("");

  // Refs for tracking without re-renders
  const timerRef = useRef(null);
  const isLoadedRef = useRef(false);
  const isLiveRef = useRef(false);

  // ─── Ref mirror of puzzleStatuses ────────────────────────────────────────────
  // puzzleStatuses state updates are async; handlers called from ChessBoard
  // (onWrongMove / onPuzzleSolved) may read a stale closure copy.
  // This ref is updated synchronously whenever puzzleStatuses changes so the
  // competition lock is always reading the latest value — no stale closures.
  const puzzleStatusesRef = useRef({});
  useEffect(() => {
    puzzleStatusesRef.current = puzzleStatuses;
  }, [puzzleStatuses]);

  // ─── Keep participantCount in sync with the deduplicated leaderboard ────────
  // The leaderboard from context may contain duplicate entries for the same
  // user (one per score-update event). We deduplicate by userId and take the
  // maximum of what we already know vs what the leaderboard now shows.
  // This ensures the count only ever increases — never flickers down.
  useEffect(() => {
    if (!leaderboard || leaderboard.length === 0) return;
    const uniqueIds = new Set(
      leaderboard.map((p) => {
        // userId may be an object { _id: "..." } — normalize to string
        const uid = p.userId?._id ?? p.userId ?? p._id ?? p.id;
        return uid ? String(uid) : null;
      }).filter(Boolean)
    );
    const uniqueCount = uniqueIds.size;
    // Use functional update to avoid stale closure on participantCount
    setParticipantCount((prev) => (uniqueCount > prev ? uniqueCount : prev));
  }, [leaderboard]);
  useEffect(() => {
    if (paramCompetitionId) {
      const onCompetitionStarted = () => {
        setIsLiveCompetition(true);
        isLiveRef.current = true;
        setIsBeforeStartTime(false);
        toast.success("Competition officially started!");
      };

      const onCompetitionEnded = () => {
        toast.success("Competition Ended! Redirecting to leaderboard...");
        navigate(`/competition/${paramCompetitionId}/lobby`);
      };

      socketService.on("competitionStarted", onCompetitionStarted);
      socketService.on("competitionEnded", onCompetitionEnded);

      return () => {
        socketService.off("competitionStarted", onCompetitionStarted);
        socketService.off("competitionEnded", onCompetitionEnded);
      };
    }
  }, [paramCompetitionId, navigate]);

  // 1. Initial Data Fetch & Restore
  useEffect(() => {
    loadPuzzleContext();
    return () => {
      clearInterval(timerRef.current);
      // Close the countdown AudioContext to free resources
      if (countdownAudioCtxRef.current) {
        countdownAudioCtxRef.current.close().catch(() => { });
        countdownAudioCtxRef.current = null;
      }
      // Clean up live competition connection on unmount/change
      if (paramCompetitionId) {
        disconnectFromCompetition();
      }
    };
  }, [paramCompetitionId]);

  // Synchronize Active Chapter with Current Puzzle
  useEffect(() => {
    if (competitionData?.chapters && puzzles.length > 0) {
      const currentPuzzleId = (
        puzzles[currentPuzzleIndex]?._id || puzzles[currentPuzzleIndex]?.id
      )?.toString();
      if (!currentPuzzleId) return;

      const chapterIdx = competitionData.chapters.findIndex((ch) =>
        (ch.puzzleIds || [])
          .map((id) => id.toString())
          .includes(currentPuzzleId),
      );

      if (chapterIdx !== -1 && chapterIdx !== activeChapterIndex) {
        setActiveChapterIndex(chapterIdx);
        // Automatically sync the pagination frame for the chapter
        const chPuzzleIds = (
          competitionData.chapters[chapterIdx].puzzleIds || []
        ).map((id) => id.toString());
        const navPuzzles = puzzles.filter((p) =>
          chPuzzleIds.includes((p._id || p.id).toString()),
        );
        const localIdx = navPuzzles.findIndex(
          (p) => (p._id || p.id).toString() === currentPuzzleId,
        );
        if (localIdx !== -1) {
          setCurrentFrame(Math.floor(localIdx / ITEMS_PER_PAGE));
        }
      } else if (chapterIdx !== -1) {
        // Just sync frame if chapter is same but frame might be wrong
        const chPuzzleIds = (
          competitionData.chapters[chapterIdx].puzzleIds || []
        ).map((id) => id.toString());
        const navPuzzles = puzzles.filter((p) =>
          chPuzzleIds.includes((p._id || p.id).toString()),
        );
        const localIdx = navPuzzles.findIndex(
          (p) => (p._id || p.id).toString() === currentPuzzleId,
        );
        if (localIdx !== -1) {
          const expectedFrame = Math.floor(localIdx / ITEMS_PER_PAGE);
          if (currentFrame !== expectedFrame) {
            setCurrentFrame(expectedFrame);
          }
        }
      }
    }
  }, [currentPuzzleIndex, competitionData?.chapters, puzzles]);

  // Persist State (Only for active competitions, NEVER for Review Mode where we should always rely on fresh backend data)
  useEffect(() => {
    if (
      !loading &&
      puzzles.length > 0 &&
      isLoadedRef.current &&
      !isReviewMode
    ) {
      const stateKey = `puzzleState_${paramCompetitionId || "casual"}`;
      const stateToSave = {
        currentPuzzleIndex,
        timeLeft,
        score,
        solvedCount,
        puzzleStatuses,
        puzzleBoardStates,
      };
      localStorage.setItem(stateKey, JSON.stringify(stateToSave));
    }
  }, [
    currentPuzzleIndex,
    timeLeft,
    score,
    solvedCount,
    puzzleStatuses,
    puzzleBoardStates,
    loading,
    paramCompetitionId,
    puzzles,
    isReviewMode,
  ]);

  const loadPuzzleContext = async () => {
    try {
      if (!location.state?.competitionId || puzzles.length === 0) {
        setLoading(true);
      }

      if (paramCompetitionId) {
        const compResponse = isEvent
          ? await eventAPI.getById(paramCompetitionId)
          : await competitionAPI.getById(paramCompetitionId);
        const puzzleRes = await (async () => {
          try {
            return isEvent
              ? await liveEventAPI.getPuzzles(paramCompetitionId)
              : await liveCompetitionAPI.getPuzzles(paramCompetitionId);
          } catch (err) {
            console.error("Error fetching puzzles:", err);
            return {
              success: false,
              message: err.message || "Failed to load puzzles"
            };
          }
        })();

        if (!compResponse.success || !compResponse.data) {
          throw new Error("Failed to load competition data");
        }

        const comp = compResponse.data;
        setCompetitionData(comp);

        // Seed the stable participant count from the server's authoritative list.
        // This is the number that shows in the rank card — we use the length of
        // comp.participants (the array of user IDs) as the baseline.
        if (Array.isArray(comp.participants) && comp.participants.length > 0) {
          setParticipantCount(comp.participants.length);
        }

        // Check active status
        const now = new Date();
        const start = new Date(comp.startTime).getTime();
        const end = new Date(comp.endTime).getTime();

        const isLive = comp.status === "live" || comp.status === "LIVE";
        // CRITICAL: Ensure isLiveCompetition is true if it's a competition from lobby,
        // so that rank, submit, and turn indicators are rendered immediately.
        setIsLiveCompetition(true);
        isLiveRef.current = isLive;

        // Check review mode
        const reviewMode = location.state?.reviewMode || false;
        setIsReviewMode(reviewMode);

        const diffToStart = start - Date.now();
        const isAboutToStart = diffToStart > 0 && diffToStart <= 25000; // 25s buffer covers the 20s early redirect from lobby
        setIsBeforeStartTime(!isLive && diffToStart > 0);
        targetStartTimeRef.current = start;

        // Hide loading immediately
        setLoading(false);

        if (!reviewMode) {
          // Allow entry if: live, about to start (within 25s), or lobby sent us here early
          const isEarlyRedirect = location.state?.isEarlyRedirect === true;
          if (!isLive && !isAboutToStart && !isEarlyRedirect) {
            navigate(isEvent ? `/event/${paramCompetitionId}/lobby` : `/competition/${paramCompetitionId}/lobby`);
            return;
          }
        }

        // Calculate Time Remaining from Server (Source of Truth)
        const msUntilEnd = end - Date.now();
        const secondsLeft = Math.floor(msUntilEnd / 1000);
        setTimeLeft(secondsLeft);
        targetEndTimeRef.current = end;

        // LIVE COMPETITION LOGIC OR REVIEW MODE
        if (isLive || reviewMode || isAboutToStart) {
          try {
            if (!reviewMode && (isLive || isAboutToStart)) {
              // Fire leaderboard + socket as non-blocking background calls
              getLeaderboard(paramCompetitionId);
              ensureSocketConnection(paramCompetitionId);
            }

            // Use puzzle data from parallel fetch above
            if (puzzleRes.success) {
              // Update Puzzles with IsSolved status
              const normalized = puzzleRes.puzzles.map((p, index) => ({
                id: p._id,
                _id: p._id,
                index: index + 1,
                fen:
                  p.fen ||
                  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                solution: p.solutionMoves || [],
                alternativeSolutions: p.alternativeSolutions || [],
                title: p.title || `Puzzle ${index + 1}`,
                type: p.type === "kids" || p.type === "capture" ? "Capture" : (p.type || "Puzzle"),
                difficulty: p.difficulty || "medium",
                category: p.category || "",
                description: p.description || "",
                captureConfig: p.captureConfig || p.kidsConfig || null,
                illegalConfig: p.illegalConfig || null,
                puzzleType: p.type === "kids" ? "capture" : (p.type || "normal"),
                level: p.level || 1,
                rating: p.rating || 400,
                firstMoveBy: p.firstMoveBy || "human",
                isSolved: p.isSolved,
                isFailed: p.isFailed,
                status: p.status,
                moveHistory: p.moveHistory || [],
              }));
              setPuzzles(normalized);

              // Update Statuses map from server data
              const statuses = {};
              normalized.forEach((p) => {
                if (p.isSolved || p.status === "solved") {
                  statuses[p.id] = "success";
                } else if (p.isFailed || p.status === "failed") {
                  statuses[p.id] = "failed";
                }
              });

              console.log("Setting puzzle statuses from server:", statuses);
              // Server is always the source of truth for statuses.
              // We set server statuses first, then only pull board positions
              // (not statuses) from localStorage — this prevents stale
              // localStorage entries from making the submit button think
              // a puzzle was attempted when the backend has no record of it.
              setPuzzleStatuses(statuses);

              // Restore board states from localStorage and merge with server data
              // In Review Mode, we don't want to restore old states since they might be missing our new moveHistory arrays!
              if (!reviewMode) {
                const stateKey = `puzzleState_${paramCompetitionId}`;
                const savedState = localStorage.getItem(stateKey);
                if (savedState) {
                  try {
                    const parsed = JSON.parse(savedState);
                    // FIX: Server statuses always win — only restore board positions
                    // from localStorage, never statuses. This prevents the case where
                    // a background API call failed silently but localStorage still
                    // shows the puzzle as done, unlocking the submit button incorrectly.
                    setPuzzleStatuses(statuses); // server wins — do NOT spread parsed.puzzleStatuses
                    setPuzzleBoardStates(parsed.puzzleBoardStates || {});
                    console.log(
                      "Puzzle statuses from server (localStorage statuses ignored):",
                      statuses,
                    );
                    console.log(
                      "Restored board positions from localStorage:",
                      parsed.puzzleBoardStates,
                    );
                  } catch (e) {
                    console.error("Error parsing saved state:", e);
                  }
                }
              }

              // Update Score and Solved Count from Backend
              if (puzzleRes.participant) {
                setScore(puzzleRes.participant.score);
                setSolvedCount(puzzleRes.participant.puzzlesSolved);
                // Immediately sync into context so PuzzleRacer shows correct score on first load (no refresh needed)
                if (!reviewMode) {
                  updateParticipant({
                    score: puzzleRes.participant.score,
                    puzzlesSolved: puzzleRes.participant.puzzlesSolved,
                  });
                }
              }

              // Find first unsolved puzzle
              const firstUnsolved = normalized.findIndex(
                (p) =>
                  !p.isSolved && p.status !== "solved" && p.status !== "failed",
              );
              if (firstUnsolved !== -1) {
                setCurrentPuzzleIndex(firstUnsolved);
              } else {
                // All puzzles are solved, stay on current or go to first
                setCurrentPuzzleIndex(0);
              }
            } else {
              // If we are in Review Mode and puzzles failed to load, it's likely due to participation
              if (reviewMode && puzzleRes.message?.toLowerCase().includes("participant")) {
                setNotParticipated(true);
                setParticipationMessage(puzzleRes.message || "You didn't participate in this competition.");
                setLoading(false);
                return;
              }
            }
          } catch (err) {
            console.error("Error syncing live competition data", err);
            // Silent error handling during initialization - no toast errors

            // Fallback: Load basic puzzles from competition data
            if (comp.puzzles && comp.puzzles.length > 0) {
              const normalized = comp.puzzles.map((p, index) => ({
                id: p._id,
                _id: p._id,
                index: index + 1,
                fen:
                  p.fen ||
                  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                solution: p.solutionMoves || [],
                alternativeSolutions: p.alternativeSolutions || [],
                title: p.title || `Puzzle ${index + 1}`,
                type: p.type === "kids" || p.type === "capture" ? "Capture" : (p.type || "Puzzle"),
                difficulty: p.difficulty || "medium",
                description: p.description || "",
                captureConfig: p.captureConfig || p.kidsConfig || null,
                illegalConfig: p.illegalConfig || null,
                puzzleType: p.type === "kids" ? "capture" : (p.type || "normal"),
                firstMoveBy: p.firstMoveBy || "human",
                isSolved: false,
                isFailed: false,
                status: "unsolved",
              }));
              setPuzzles(normalized);

              // Try to restore from localStorage with proper state merging
              const stateKey = `puzzleState_${paramCompetitionId}`;
              const savedState = localStorage.getItem(stateKey);
              if (savedState) {
                try {
                  const parsed = JSON.parse(savedState);
                  setPuzzleStatuses(parsed.puzzleStatuses || {});
                  setPuzzleBoardStates(parsed.puzzleBoardStates || {});
                  setScore(parsed.score || 0);
                  setSolvedCount(parsed.solvedCount || 0);
                  if (parsed.currentPuzzleIndex !== undefined) {
                    setCurrentPuzzleIndex(parsed.currentPuzzleIndex);
                  }

                  // Restore timeLeft accurately against real-time if we have a saved remaining time and a known completion time.
                  // If we don't, we just fall back to calculating from the end time.
                  if (comp.endTime) {
                    targetEndTimeRef.current = new Date(comp.endTime).getTime();
                    const msUntilEnd = targetEndTimeRef.current - Date.now();
                    setTimeLeft(Math.max(0, Math.floor(msUntilEnd / 1000)));
                  }

                  console.log("Restored complete state from localStorage:", {
                    statuses: parsed.puzzleStatuses,
                    score: parsed.score,
                    solvedCount: parsed.solvedCount,
                    currentIndex: parsed.currentPuzzleIndex,
                  });
                } catch (e) {
                  console.error("Error parsing saved state:", e);
                }
              }
            }
          }
        }

        // If Puzzles not loaded yet (fallback or non-live)
        if (puzzles.length === 0 && !isLive && !reviewMode) {
          // Load Basic Puzzles
          if (comp.puzzles && comp.puzzles.length > 0) {
            const normalized = comp.puzzles.map((p, index) => ({
              id: p._id,
              _id: p._id,
              index: index + 1,
              fen:
                p.fen ||
                "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
              solution: p.solutionMoves || [],
              alternativeSolutions: p.alternativeSolutions || [],
              title: p.title || `Puzzle ${index + 1}`,
              type: p.type === "kids" || p.type === "capture" ? "Capture" : (p.type || "Puzzle"),
              difficulty: p.difficulty,
              captureConfig: p.captureConfig || p.kidsConfig || null,
              illegalConfig: p.illegalConfig || null,
              puzzleType: p.type === "kids" ? "capture" : (p.type || "normal"),
              level: p.level || 1,
              rating: p.rating || 400,
            }));
            setPuzzles(normalized);
          }
        }

        if (!reviewMode) {
          // Start the game timer immediately (no countdown buffer)
          startTimer();
        }
      } else {
        // Casual Mode (Dashboard link)
        const normalized = data
          // Include normal puzzles (need solutionMoves), capture puzzles (need captureConfig), and illegal puzzles
          .filter((p) => p.fen && (p.solutionMoves?.length || p.captureConfig || p.kidsConfig || p.type === 'illegal' || p.type === 'capture' || p.type === 'kids'))
          .map((p, i) => ({
            id: p._id,
            _id: p._id,
            index: i + 1,
            fen: p.fen,
            solution: p.solutionMoves,
            alternativeSolutions: p.alternativeSolutions,
            title: p.title || `Puzzle ${i + 1}`,
            type: p.type === 'kids' || p.type === 'capture' ? 'Capture' : (p.type || 'Puzzle'),
            description: p.description,
            category: p.category || "",
            captureConfig: p.captureConfig || p.kidsConfig || null,
            illegalConfig: p.illegalConfig || null,
            puzzleType: p.type === 'kids' ? 'capture' : (p.type || 'normal'),
            level: p.level || 1,
            rating: p.rating || 400,
            firstMoveBy: p.firstMoveBy || "human",
          }));
        setPuzzles(normalized);

        // Restore Casual State
        const stateKey = `puzzleState_casual`;
        const savedState = localStorage.getItem(stateKey);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setScore(parsed.score);
          setSolvedCount(parsed.solvedCount);
          setPuzzleStatuses(parsed.puzzleStatuses || {});
          setPuzzleBoardStates(parsed.puzzleBoardStates || {});
          setCurrentPuzzleIndex(parsed.currentPuzzleIndex || 0);
        } else {
          const defaultSeconds = 300; // Default 5 mins for casual
          setTimeLeft(defaultSeconds);
          targetEndTimeRef.current = Date.now() + defaultSeconds * 1000;
        }
      }
    } catch (error) {
      console.error("Error loading puzzles:", error);
      // Silent error handling during initialization to prevent black page

      // Provide fallback to prevent black page
      setLoading(false);
      isLoadedRef.current = true;

      // Only navigate away for critical errors, not initialization issues
      if (error.message && error.message.includes("critical")) {
        setTimeout(() => {
          if (paramCompetitionId) {
            navigate(`/competition/${paramCompetitionId}/lobby`);
          } else {
            navigate("/");
          }
        }, 3000);
      }
    } finally {
      // Hide loading overlay regardless of what happened
      setLoading(false);
      isLoadedRef.current = true;
      setStartTime(Date.now());
    }
  };

  const targetStartTimeRef = useRef(null);
  const targetEndTimeRef = useRef(null);
  const lastSpokenSecondRef = useRef(null); // tracks last spoken countdown number
  const countdownAudioCtxRef = useRef(null); // shared AudioContext for countdown
  const countdownScheduledRef = useRef(false); // true once full schedule is queued
  const voiceBuffersRef = useRef({}); // { "1": AudioBuffer, "2": AudioBuffer, ... "20": AudioBuffer, "Go": AudioBuffer }
  const voiceBuffersLoadedRef = useRef(false);

  // Returns a running AudioContext, resuming it if suspended (autoplay policy)
  const getAudioCtx = () => {
    if (!countdownAudioCtxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      countdownAudioCtxRef.current = new AC();
    }
    const ctx = countdownAudioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };

  // Schedule a voice utterance at a precise wall-clock time using setTimeout.
  // This is more accurate than calling speechSynthesis in the interval loop.
  const scheduleVoiceAtTime = (text, fireAtMs) => {
    const nowMs = Date.now();
    const delayMs = fireAtMs - nowMs;
    if (delayMs < 0) return; // already past

    setTimeout(() => {
      try {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(String(text));
        utt.rate = 1.5;
        utt.volume = 1.0;
        window.speechSynthesis.speak(utt);
      } catch (e) { /* ignore */ }
    }, delayMs);
  };

  // Schedule the entire countdown: voice via setTimeout scheduled to wall-clock times.
  const scheduleCountdownAudio = (targetStartTime) => {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const nowMs = Date.now();

    for (let s = 20; s >= 1; s--) {
      const fireAtMs = targetStartTime - s * 1000; // wall-clock ms when this should fire
      if (fireAtMs - nowMs < 0) continue; // already past, skip

      // Schedule voice via setTimeout (uses wall-clock, ~10-50ms accuracy)
      // Pre-fire by 150ms to compensate for speechSynthesis startup latency
      scheduleVoiceAtTime(String(s), fireAtMs - 150);
    }

    // "Go!" at exactly start time
    if (targetStartTime - nowMs >= 0) {
      scheduleVoiceAtTime("Competition started!", targetStartTime - 150);
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    countdownScheduledRef.current = false; // reset so we reschedule on next tick
    timerRef.current = setInterval(() => {
      // Check if we are still before start time
      // Use Ref to avoid closure issues and force unlock when countdown hits 0 for responsiveness
      if (targetStartTimeRef.current) {
        if (isLiveRef.current) {
          setIsBeforeStartTime(false);
        } else {
          const diffToStart = targetStartTimeRef.current - Date.now();
          // Set false as soon as within 500ms or status changes
          if (diffToStart <= 0) {
            setIsBeforeStartTime(false);
            setIsLiveCompetition(true); // Unlock UI components
            // If it just started, we might need to refresh data or just ensure UI is unlocked
            isLiveRef.current = true;
            // Voice "Go!" already scheduled
            if (lastSpokenSecondRef.current !== 0) {
              lastSpokenSecondRef.current = 0;
            }
          } else {
            setIsBeforeStartTime(true);
            // Schedule all voice once as soon as we know the start time.
            // Voice uses setTimeout for precise wall-clock timing.
            if (!countdownScheduledRef.current && diffToStart <= 21000) {
              countdownScheduledRef.current = true;
              scheduleCountdownAudio(targetStartTimeRef.current);
            }
            // Still track seconds for the visual display ref
            const secondsLeft = Math.floor(diffToStart / 1000);
            lastSpokenSecondRef.current = secondsLeft;
          }
        }
      }

      if (!targetEndTimeRef.current) return;

      const remainingMs = targetEndTimeRef.current - Date.now();
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));

      setTimeLeft((prev) => {
        if (
          remainingSec <= 0 &&
          targetEndTimeRef.current &&
          Date.now() >= targetEndTimeRef.current
        ) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return remainingSec;
      });
    }, 500); // 500ms for extra responsiveness
  };

  const handleTimeout = () => {
    toast.error("Time's up!");
    // Redirect to lobby for competition, or home for casual
    setTimeout(() => {
      if (paramCompetitionId) {
        navigate(isEvent ? `/event/${paramCompetitionId}/lobby` : `/competition/${paramCompetitionId}/lobby`); // Lobby will show as leaderboard
      } else {
        navigate("/");
      }
    }, 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handlePuzzleSolved = async (winningMoves, boardMoveHistory) => {
    const currentPuzzle = puzzles[currentPuzzleIndex];
    if (!currentPuzzle) return;

    // Use passed winning moves or fallback to default solution.
    // For illegal puzzles, we send the string 'solved' — not move arrays.
    const isIllegalPuzzle = currentPuzzle.puzzleType === 'illegal' || currentPuzzle.type === 'illegal';
    const solutionToSend = isIllegalPuzzle
      ? 'solved'
      : (Array.isArray(winningMoves) && winningMoves.length > 0
        ? winningMoves
        : currentPuzzle.solution);

    // ─── Competition lock: use ref so we always read latest status ───────────
    // isReviewMode check first — review mode never blocks re-solving
    if (!isReviewMode) {
      const latestStatus = puzzleStatusesRef.current[currentPuzzle.id];
      if (latestStatus === "success" || latestStatus === "failed") {
        return;
      }
    }

    // Calculate time taken for this puzzle (simple approximation)
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    // If Review Mode, don't submit to backend, just show correct locally in practice statuses
    if (isReviewMode) {
      setPracticeStatuses((prev) => ({
        ...prev,
        [currentPuzzle.id]: "success",
      }));
      toast.success("Correct! (Review Mode)");

      // Don't auto-forward them in Review Mode, let them study the board
      setShowSolution(false); // Reset solution view
      return;
    }

    // --- OPTIMISTIC UPDATE ---
    // Instantly update UI states so the player feels zero latency
    setSolvedCount((prev) => prev + 1);
    setPuzzleStatuses((prev) => ({ ...prev, [currentPuzzle.id]: "success" }));
    toast.success("Correct!", { duration: 1500 });

    // Move to next puzzle immediately
    setStartTime(Date.now()); // Reset puzzle timer
    setTimeout(() => {
      // Find the next available unsolved puzzle
      const nextUnsolvedIndex = puzzles.findIndex(
        (p, idx) =>
          idx > currentPuzzleIndex &&
          puzzleStatuses[p.id || p._id] !== "success" &&
          puzzleStatuses[p.id || p._id] !== "failed",
      );

      // Also check from the beginning if we didn't find one after current index
      const wrapAroundUnsolvedIndex =
        nextUnsolvedIndex === -1
          ? puzzles.findIndex(
            (p) =>
              puzzleStatuses[p.id || p._id] !== "success" &&
              puzzleStatuses[p.id || p._id] !== "failed",
          )
          : -1;

      const finalNextIndex =
        nextUnsolvedIndex !== -1 ? nextUnsolvedIndex : wrapAroundUnsolvedIndex;

      if (finalNextIndex !== -1 && finalNextIndex !== currentPuzzleIndex) {
        // Still have unsolved puzzles, go to next one
        setCurrentPuzzleIndex(finalNextIndex);
      } else if (finalNextIndex === -1) {
        toast.success("All puzzles attempted!");
        // End flow
        if (!paramCompetitionId || !isLiveCompetition) {
          if (competitionData) navigate("/");
        }
      }
    }, 100); // 100ms delay provides just enough time for a visual "correct" indication on the board

    // --- BACKGROUND SUBMISSION ---
    if (competitionData) {
      // Fire-and-forget promise with retry + revert on failure
      (async () => {
        const MAX_RETRIES = 2;
        let attempt = 0;
        let res = null;

        while (attempt <= MAX_RETRIES) {
          try {
            if (isLiveRef.current || paramCompetitionId) {
              const movesPlayed =
                boardMoveHistory ||
                puzzleBoardStates[currentPuzzle.id]?.moveHistory ||
                [];
              res = isEvent
                ? await liveEventAPI.submitSolution(
                  competitionData._id,
                  currentPuzzle.id,
                  solutionToSend,
                  timeTaken,
                  null,
                  movesPlayed,
                )
                : await liveCompetitionAPI.submitSolution(
                  competitionData._id,
                  currentPuzzle.id,
                  solutionToSend,
                  timeTaken,
                  null,
                  movesPlayed,
                );
            } else {
              // Regular competition
              res = await competitionAPI.submitSolution(
                competitionData._id,
                currentPuzzle.id,
                solutionToSend,
                timeTaken,
              );
            }
            break; // success — exit retry loop
          } catch (error) {
            attempt++;
            if (attempt > MAX_RETRIES) {
              console.error(`[PuzzlePage] Solve submission failed after ${MAX_RETRIES + 1} attempts, reverting optimistic update for puzzle ${currentPuzzle.id}:`, error);
              // FIX: Revert the optimistic UI update so the puzzle is not
              // counted as done and the submit button stays locked.
              setPuzzleStatuses((prev) => {
                const next = { ...prev };
                delete next[currentPuzzle.id];
                return next;
              });
              setSolvedCount((prev) => Math.max(0, prev - 1));
              toast.error("Connection issue — puzzle not saved. Please try again.", { duration: 4000 });
              return;
            }
            // Wait before retrying (exponential backoff: 1s, 2s)
            await new Promise((r) => setTimeout(r, 1000 * attempt));
          }
        }

        if (res && res.success && res.scoreEarned) {
          setScore((prev) => {
            const newScore = prev + res.scoreEarned;
            // Instantly sync to LiveCompetitionContext so PuzzleRacer updates
            updateParticipant({
              puzzlesSolved: solvedCount + 1,
              score: newScore,
            });
            return newScore;
          });
        } else if (res && res.success === false) {
          console.warn("[PuzzlePage] Backend rejected correct solution:", res.message);
          // Backend rejected (e.g. already solved, competition ended) — revert optimistic update
          setPuzzleStatuses((prev) => {
            const next = { ...prev };
            delete next[currentPuzzle.id];
            return next;
          });
          setSolvedCount((prev) => Math.max(0, prev - 1));
        } else if (res && res.points) {
          setScore((prev) => prev + res.points);
        }
      })();
    } else {
      // No competition, just add local score dynamically based on type and level
      const dynamicScore = (() => {
        const type = currentPuzzle.type || currentPuzzle.puzzleType || "normal";
        if (type === "normal") return 10;
        const level = Number(currentPuzzle.level) || 1;
        return 15 + level * 3;
      })();
      setScore((prev) => prev + dynamicScore);
    }
  };

  const handleWrongMove = async (boardMoveHistory) => {
    const currentPuzzle = puzzles[currentPuzzleIndex];
    if (!currentPuzzle) return;

    const puzzleId = currentPuzzle.id || currentPuzzle._id;

    // ─── Competition lock: use ref so we always read latest status ───────────
    // isReviewMode check first — review mode never blocks retrying
    if (!isReviewMode) {
      const latestStatus = puzzleStatusesRef.current[puzzleId];
      if (latestStatus === "failed" || latestStatus === "success") {
        return;
      }
    }

    // Calculate time taken for this puzzle
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    // If Review Mode, don't submit wrong move or permanently block them. They can retry!
    if (isReviewMode) {
      toast.error("Incorrect move! Try again.");
      return; // Do nothing else, board will revert the move via resetToInitial
    }

    // --- OPTIMISTIC UPDATE ---
    setPuzzleStatuses((prev) => ({ ...prev, [puzzleId]: "failed" }));
    toast.error("Incorrect! Moving to next.", { duration: 1500 });

    // Move to next puzzle automatically (instant feel)
    setStartTime(Date.now());
    setTimeout(() => {
      // Find the next available unsolved puzzle
      const nextUnsolvedIndex = puzzles.findIndex(
        (p, idx) =>
          idx > currentPuzzleIndex &&
          puzzleStatuses[p.id || p._id] !== "success" &&
          puzzleStatuses[p.id || p._id] !== "failed",
      );

      // Also check from the beginning if we didn't find one after current index
      const wrapAroundUnsolvedIndex =
        nextUnsolvedIndex === -1
          ? puzzles.findIndex(
            (p) =>
              puzzleStatuses[p.id || p._id] !== "success" &&
              puzzleStatuses[p.id || p._id] !== "failed",
          )
          : -1;

      const finalNextIndex =
        nextUnsolvedIndex !== -1 ? nextUnsolvedIndex : wrapAroundUnsolvedIndex;

      if (finalNextIndex !== -1 && finalNextIndex !== currentPuzzleIndex) {
        // Still have unsolved puzzles, go to next one
        setCurrentPuzzleIndex(finalNextIndex);
      } else if (finalNextIndex === -1) {
        toast.success("All puzzles attempted!");
        // End flow
        if (!paramCompetitionId || !isLiveCompetition) {
          if (competitionData) navigate("/");
        }
      }
    }, 800); // 0.8s delay to show red error state on board before moving next

    // --- BACKGROUND SUBMISSION ---
    // Submit failed attempt to backend if it's a live competition
    if (competitionData && isLiveCompetition) {
      (async () => {
        const MAX_RETRIES = 2;
        let attempt = 0;

        while (attempt <= MAX_RETRIES) {
          try {
            // For illegal puzzles, send 'failed' string; for normal/kids send wrong move array
            const isIllegalPuzzle = currentPuzzle.puzzleType === 'illegal' || currentPuzzle.type === 'illegal';
            const movesPlayed =
              boardMoveHistory || puzzleBoardStates[puzzleId]?.moveHistory || [];
            if (isEvent) {
              await liveEventAPI.submitSolution(
                competitionData._id,
                currentPuzzle.id,
                isIllegalPuzzle ? 'failed' : ["wrong", "move"],
                timeTaken,
                null,
                movesPlayed,
              );
            } else {
              await liveCompetitionAPI.submitSolution(
                competitionData._id,
                currentPuzzle.id,
                isIllegalPuzzle ? 'failed' : ["wrong", "move"],
                timeTaken,
                null,
                movesPlayed,
              );
            }
            break; // success — exit retry loop
          } catch (error) {
            attempt++;
            if (attempt > MAX_RETRIES) {
              console.error(`[PuzzlePage] Wrong-move submission failed after ${MAX_RETRIES + 1} attempts, reverting optimistic update for puzzle ${puzzleId}:`, error);
              // FIX: Revert the optimistic "failed" status so the puzzle is
              // not counted as attempted and the submit button stays locked.
              setPuzzleStatuses((prev) => {
                const next = { ...prev };
                delete next[puzzleId];
                return next;
              });
              toast.error("Connection issue — puzzle not saved. Please try again.", { duration: 4000 });
              return;
            }
            // Wait before retrying (exponential backoff: 1s, 2s)
            await new Promise((r) => setTimeout(r, 1000 * attempt));
          }
        }
      })();
    }
  };

  // Handle early submission
  const handleSubmitCompetition = async () => {
    if (!competitionData || !isLiveCompetition) return;

    // Extra validation: Check if all puzzles are attempted
    const unattempted = getUnattemptedCount();
    if (unattempted > 0) {
      toast.error(`Please attempt all puzzles before submitting.`);
      setShowSubmitModal(false);
      return;
    }

    try {
      setSubmitting(true);

      const response = isEvent
        ? await liveEventAPI.submitEvent(competitionData._id)
        : await liveCompetitionAPI.submitCompetition(competitionData._id);

      if (response.success) {
        toast.success("Submitted! Returning to lobby...");
        setShowSubmitModal(false);

        // Clear local storage
        const stateKey = `puzzleState_${paramCompetitionId}`;
        localStorage.removeItem(stateKey);

        // Navigate back to Lobby (player waits there with live scores)
        navigate(isEvent ? `/event/${competitionData._id}/lobby` : `/competition/${competitionData._id}/lobby`);
      } else {
        toast.error(response.message || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to submit competition");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if there are unsolved puzzles
  const getUnattemptedCount = () => {
    let count = 0;
    const seenPuzzles = new Set(); // Prevent duplicate counting
    puzzles.forEach((p) => {
      const pid = (p.id || p._id).toString(); // Normalize to string
      if (seenPuzzles.has(pid)) return; // Skip duplicates
      seenPuzzles.add(pid);
      
      if (
        puzzleStatuses[pid] !== "success" &&
        puzzleStatuses[pid] !== "failed"
      ) {
        count++;
      }
    });
    return count;
  };

  // Get attempted count (solved + failed)
  const getAttemptedCount = () => {
    const seenPuzzles = new Set();
    let count = 0;
    puzzles.forEach((p) => {
      const pid = (p.id || p._id).toString();
      if (seenPuzzles.has(pid)) return; // Skip duplicates
      seenPuzzles.add(pid);
      
      if (
        puzzleStatuses[pid] === "success" ||
        puzzleStatuses[pid] === "failed"
      ) {
        count++;
      }
    });
    return count;
  };

  // Get unique puzzle count
  const getUniquePuzzleCount = () => {
    const seenPuzzles = new Set();
    puzzles.forEach((p) => {
      const pid = (p.id || p._id).toString();
      seenPuzzles.add(pid);
    });
    return seenPuzzles.size;
  };

  const currentPuzzle = puzzles[currentPuzzleIndex];

  if (loading) {
    return (
      <div className={styles.container}>
        <PremiumLoader text="PREPARING PUZZLES..." />
      </div>
    );
  }

  /* ── derive chapter-scoped puzzle list once for the whole render ── */
  const chapterData = competitionData?.chapters;
  let navPuzzles = puzzles;
  if (chapterData && chapterData.length > 0) {
    const chPuzzleIds = (chapterData[activeChapterIndex]?.puzzleIds || []).map(
      (id) => id.toString(),
    );
    navPuzzles = puzzles.filter((p) =>
      chPuzzleIds.includes((p._id || p.id).toString()),
    );
  }
  const totalPages = Math.ceil(navPuzzles.length / ITEMS_PER_PAGE);
  const currentPuzzleId = (
    puzzles[currentPuzzleIndex]?._id || puzzles[currentPuzzleIndex]?.id
  )?.toString();
  const chapterCurrentIndex = navPuzzles.findIndex(
    (p) => (p._id || p.id).toString() === currentPuzzleId,
  );

  /* ── puzzle progress label ── */
  const progressLabel = (() => {
    if (chapterData && chapterData.length > 0) {
      const chIdx = chapterCurrentIndex >= 0 ? chapterCurrentIndex : 0;
      return `Puzzle ${chIdx + 1} of ${navPuzzles.length} · ${chapterData[activeChapterIndex]?.name || ""
        }`;
    }
    return `Puzzle ${currentPuzzleIndex + 1} of ${puzzles.length}`;
  })();

  /* ── Deduplicated rank computation ──────────────────────────────────────────
     The leaderboard may contain multiple entries for the same user because
     the context appends an entry on every socket score-update. We deduplicate
     by keeping only the latest (highest-index) entry per userId, then sort
     by score descending to compute the current user's rank.
  ───────────────────────────────────────────────────────────────────────── */
  const stableRank = (() => {
    if (!leaderboard || leaderboard.length === 0) return getCurrentUserRank() || null;
    // Deduplicate: last entry wins for each userId
    const byUser = new Map();
    leaderboard.forEach((p) => {
      const uid = p.userId?._id ?? p.userId ?? p._id ?? p.id;
      if (uid) byUser.set(String(uid), p);
    });
    const deduped = Array.from(byUser.values());
    // Sort by score descending
    deduped.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    // Find current user
    const myId = user?._id || user?.id;
    if (!myId) return getCurrentUserRank() || null;
    const myIdx = deduped.findIndex((p) => {
      const uid = p.userId?._id ?? p.userId ?? p._id ?? p.id;
      return uid && String(uid) === String(myId);
    });
    return myIdx !== -1 ? myIdx + 1 : getCurrentUserRank() || null;
  })();
  const currentPuzzleStatus = currentPuzzle
    ? (puzzleStatusesRef.current[currentPuzzle.id || currentPuzzle._id] ?? puzzleStatuses[currentPuzzle.id || currentPuzzle._id])
    : null;

  const isBoardInteractive = (() => {
    if (solving) return false;
    if (isBeforeStartTime && !isReviewMode) return false;
    // Review mode: always interactive regardless of competition result
    if (isReviewMode) return true;
    // Competition mode: lock board once puzzle has been solved OR failed — final, no retries
    if (currentPuzzleStatus === "success" || currentPuzzleStatus === "failed") {
      return false;
    }
    return true;
  })();

  if (notParticipated) {
    return (
      <div className={styles.container}>
        <div className={styles.notParticipatedOverlay}>
          <div className={styles.notParticipatedCard}>
            <div className={styles.lockIconWrapper}>
              <FaTrophy className={styles.lockIcon} />
              <div className={styles.lockSlash}></div>
            </div>
            <h2 className={styles.notParticipatedTitle}>Analysis Unavailable</h2>
            <p className={styles.notParticipatedText}>
              {participationMessage || "You didn't participate in this competition."}
            </p>
            <p className={styles.notParticipatedSubtext}>
              To analyze puzzles and review your performance, you must join the competition while it is live.
            </p>
            <button
              className={styles.goBackBtn}
              onClick={() => navigate(isEvent ? "/events" : "/Dashboard")}
            >
              <FaArrowLeft /> Go Back to Arena
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${isReviewMode ? styles.analysisPage : styles.competitionPage} ${!showGalaxy ? styles.galaxyOffLayout : ""}`}>
      <Toaster position="top-right" />

      {/* TOP HEADERBAR */}
      {competitionData && (
        <div className={styles.titleHeader}>
          <div className={styles.titleHeaderLeft}>
            <button className={styles.backBtnHeader} onClick={() => paramCompetitionId ? navigate(isEvent ? `/event/${paramCompetitionId}/lobby` : `/competition/${paramCompetitionId}/lobby`) : navigate("/dashboard")} title="Go back">
              <FaArrowLeft />
              <span className={styles.mainTitle} style={{ marginLeft: "10px" }}>{competitionData.name}</span>
            </button>
            {isReviewMode && <span className={styles.liveBadge} style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", borderColor: "rgba(165,180,252,0.3)", marginLeft: "15px", padding: "4px 10px", borderRadius: "10px", fontSize: "0.7rem" }}>Review</span>}
          </div>

          <div className={styles.headerActions}>
            <button
              className={`${styles.galaxyToggle} ${showGalaxy ? styles.galaxyOn : ""}`}
              onClick={() => setShowGalaxy(!showGalaxy)}
              title="Toggle Galaxy View"
            >
              <span className={styles.toggleIcon}>🪐</span>
              <span className={styles.toggleText}>Galaxy</span>
              <div className={styles.toggleSwitch}>
                <div className={styles.toggleKnob} />
              </div>
            </button>
          </div>
        </div>
      )}

      <div className={styles.mainLayout}>
        {/* Main Content Area (Board + Stats) */}
        <div className={styles.mainContent}>
          {competitionData && (
            <>
                                          {/* Stats Sidebar */}
              <div className={styles.statsSidebar}>
                
                {/* 2. Premium Unified Dashboard Card */}
                {currentPuzzle && (() => {
                  let uColor = "w";
                  const fenTurn = currentPuzzle.fen?.split(" ")[1] || "w";
                  if (currentPuzzle.type === 'illegal' || currentPuzzle.puzzleType === 'illegal') {
                    uColor = currentPuzzle.illegalConfig?.playerSide || (['w', 'b'].includes(currentPuzzle.firstMoveBy) ? currentPuzzle.firstMoveBy : fenTurn);
                  } else if (currentPuzzle.type === 'capture' || currentPuzzle.puzzleType === 'capture') {
                    uColor = currentPuzzle.captureConfig?.playerSide || (['w', 'b'].includes(currentPuzzle.firstMoveBy) ? currentPuzzle.firstMoveBy : fenTurn);
                  } else {
                    uColor = (currentPuzzle.firstMoveBy && ['w', 'b'].includes(currentPuzzle.firstMoveBy)) ? currentPuzzle.firstMoveBy : (fenTurn === "w" ? "b" : "w");
                  }

                  return (
                    <div className={styles.premiumDashboardCard}>
                      {/* Center Aligned Large Clock Timer */}
                      {!isReviewMode && (
                        <div className={styles.timerValueCentered}>
                          <FaClock className={styles.timerIconLarge} />
                          <span className={styles.timerTimeBig}>
                            {(() => {
                              const t = isBeforeStartTime && targetStartTimeRef.current
                                ? Math.max(0, Math.floor((targetStartTimeRef.current - Date.now()) / 1000))
                                : timeLeft;
                              return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
                            })()}
                          </span>
                        </div>
                      )}

                      {/* Turn Indicator */}
                      <div className={styles.infoTopSection}>
                        <div className={`${styles.turnBanner} ${uColor === "w" ? styles.turnBannerWhite : styles.turnBannerBlack}`}>
                          <div className={styles.turnContent}>
                            <img src={uColor === "w" ? whiteKingSvg : blackKingSvg} alt="" className={styles.infoTurnIcon} />
                            <span className={styles.infoTurnText}>{uColor === "w" ? "WHITE TO PLAY" : "BLACK TO PLAY"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Unified List of Information */}
                      <div className={styles.dashboardList}>
                        <div className={styles.dashboardRow}>
                          <span className={styles.dashboardLabel}>Objective</span>
                          <span className={styles.dashboardValue} style={{ color: 'var(--gold)', fontWeight: '500', textAlign: 'right' }}>
                            {currentPuzzle.title || currentPuzzle.name || "Standard Puzzle"}
                          </span>
                        </div>



                        <div className={styles.dashboardRow}>
                          <span className={styles.dashboardLabel}>Level</span>
                          <div className={styles.starsRowPremiumSmall}>
                            {[...Array(7)].map((_, i) => (
                              <FaStar key={i} className={i < (currentPuzzle.level || 1) ? styles.starActiveSmall : styles.starInactiveSmall} />
                            ))}
                          </div>
                        </div>

                        {isLiveCompetition && !isReviewMode && (
                          <div className={`${styles.dashboardRow} ${styles.rankRowHighlight}`}>
                            <span className={styles.dashboardLabel} style={{ color: 'var(--gold)' }}>Your Rank</span>
                            <div className={styles.rankContainer}>
                              <span className={`${styles.dashboardValue} ${styles.goldValue}`}>#${stableRank || "–"}</span>
                              <span className={styles.rankPlayers} style={{ marginLeft: '4px' }}>/ {participantCount}</span>
                            </div>
                          </div>
                        )}

                        <div className={styles.dashboardRow}>
                          <span className={styles.dashboardLabel}>Total Puzzles</span>
                          <span className={styles.dashboardValue}>{getUniquePuzzleCount()}</span>
                        </div>

                        <div className={styles.dashboardRow}>
                          <span className={styles.dashboardLabel}>Solved</span>
                          <span className={styles.dashboardValue}>{solvedCount}</span>
                        </div>

                        <div className={styles.dashboardRow}>
                          <span className={styles.dashboardLabel}>Attempted</span>
                          <span className={styles.dashboardValue}>{getAttemptedCount()}</span>
                        </div>

                        <div className={styles.dashboardRow}>
                          <span className={styles.dashboardLabel}>Remaining</span>
                          <span className={styles.dashboardValue}>{getUnattemptedCount()}</span>
                        </div>

                        {/* Reward Section in small text at the very bottom */}
                        <div className={styles.dashboardRewardRow}>
                          <div className={styles.rewardHeaderSmall}>
                            <FaTrophy className={styles.rewardTrophyIconSmall} />
                            <span className={styles.rewardLabelSmall}>Reward: +10 Points</span>
                          </div>
                          {(() => {
                             const type = currentPuzzle.puzzleType || currentPuzzle.type || "normal";
                             const isSourceDestMode = type === "illegal" && currentPuzzle.illegalConfig?.subType === "source_destination";
                             if (isSourceDestMode) {
                                const minSteps = currentPuzzle.illegalConfig?.minSteps || (currentPuzzle.solution && currentPuzzle.solution.length) || (currentPuzzle.solutionMoves && currentPuzzle.solutionMoves.length) || 8;
                                return (
                                   <div className={styles.rewardSubPointsSmall}>
                                      Reach target in {minSteps} steps (-1 per extra step).
                                   </div>
                                );
                             }
                             return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

{/* Board Area */}
              <div className={styles.boardStage}>
                <div className={styles.boardContainer}>
                  {puzzles.length > 0 && currentPuzzle ? (
                    <ChessBoard
                      key={isReviewMode ? `${currentPuzzle.id || currentPuzzle._id}-review` : `${currentPuzzle.id || currentPuzzle._id}-live`}
                      fen={currentPuzzle.fen}
                      solution={currentPuzzle.solution}
                      alternativeSolutions={currentPuzzle.alternativeSolutions}
                      puzzleType={currentPuzzle.puzzleType || currentPuzzle.type}
                      captureConfig={currentPuzzle.captureConfig}
                      illegalConfig={currentPuzzle.illegalConfig}
                      firstMoveBy={currentPuzzle.firstMoveBy}
                      onPuzzleSolved={handlePuzzleSolved}
                      onWrongMove={handleWrongMove}
                      onBoardStateChange={(fen, moveHistory, trackedSquare) => {
                        if (isBeforeStartTime && !isReviewMode) return;
                        setPuzzleBoardStates(prev => ({ ...prev, [currentPuzzle.id || currentPuzzle._id]: { fen, moveHistory, trackedSquare } }));
                      }}
                      savedBoardState={isReviewMode ? null : puzzleBoardStates[currentPuzzle.id || currentPuzzle._id]}
                      isSolved={isReviewMode ? practiceStatuses[currentPuzzle.id || currentPuzzle._id] === "success" : (puzzleStatuses[currentPuzzle.id || currentPuzzle._id] === "success")}
                      interactive={isBoardInteractive}
                      showSolution={showSolution}
                    />
                  ) : (
                    <div className={styles.loadingState}>Loading Board...</div>
                  )}
                </div>
              </div>

                            {/* Right Sidebar Panel */}
              <div className={styles.sidebarPanel}>
                {/* Chapters Card */}
                {competitionData.chapters?.length > 0 && (
                  <div className={styles.sidebarCard}>
                    <h3 className={styles.sectionHeading}>Chapters</h3>
                    <div className={styles.chaptersList} ref={chapterScrollRef}>
                      {competitionData.chapters.map((chapter, idx) => {
                        const ids = (chapter.puzzleIds || []).map(id => id.toString());
                        const chPs = puzzles.filter(p => ids.includes((p._id || p.id).toString()));
                        const solved = chPs.filter(p => puzzleStatuses[(p.id || p._id).toString()] === "success").length;
                        return (
                          <button key={idx} className={`${styles.chapterItem} ${activeChapterIndex === idx ? styles.chapterActive : ""}`}
                            onClick={() => {
                              if (isBeforeStartTime && !isReviewMode) return;
                              setActiveChapterIndex(idx);
                              const gPs = puzzles.filter(p => ids.includes((p._id || p.id).toString()));
                              if (gPs.length > 0) {
                                const gi = puzzles.findIndex(p => (p._id || p.id).toString() === (gPs[0]._id || gPs[0].id).toString());
                                if (gi !== -1) setCurrentPuzzleIndex(gi);
                              }
                            }}
                          >
                            <span className={styles.chapterName}>{chapter.name}</span>
                            <span className={styles.chapterCount}>{solved}/{chPs.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Puzzles Grid Card (Redesigned as sleek circular indicators, borderless) */}
                <div className={styles.sidebarCard}>
                  <h3 className={styles.sectionHeading}>Puzzles</h3>
                  <div className={styles.puzzlesGrid}>
                    {navPuzzles.map((puzzle, idx) => {
                      const pid = puzzle.id || puzzle._id;
                      const status = puzzleStatuses[pid];
                      const globalIdx = puzzles.findIndex(p => (p._id || p.id) === pid);
                      return (
                        <button key={pid} className={`${styles.puzzleNavItem} ${currentPuzzleIndex === globalIdx ? styles.puzzleActive : ""} ${status === "success" ? styles.puzzleSuccess : ""} ${status === "failed" ? styles.puzzleFailed : ""}`}
                          onClick={() => {
                            if (isBeforeStartTime) return;
                            setCurrentPuzzleIndex(globalIdx);
                          }}
                        >
                          {status === "success" ? <FaCheckCircle style={{ fontSize: '0.85rem' }} /> : globalIdx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className={styles.puzzleNavControls} style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                    <button className={styles.puzzleNavItem} style={{ flex: 1, height: "36px", borderRadius: "18px" }} onClick={() => setCurrentFrame(f => Math.max(0, f - 1))} disabled={currentFrame === 0}>
                      <FaChevronLeft />
                    </button>
                    <button className={styles.puzzleNavItem} style={{ flex: 1, height: "36px", borderRadius: "18px" }} onClick={() => setCurrentFrame(f => f + 1)} disabled={(currentFrame + 1) * ITEMS_PER_PAGE >= (navPuzzles.length || 0)}>
                      <FaChevronRight />
                    </button>
                  </div>

                  {isLiveCompetition && !isReviewMode && (
                    <button className={styles.globalSubmitBtn} onClick={() => setShowSubmitModal(true)} disabled={submitting || getUnattemptedCount() > 0}>
                      Submit Competition
                    </button>
                  )}
                </div>

                {/* FEN Card (Review Mode) */}
                {isReviewMode && currentPuzzle?.fen && (
                  <div className={styles.sidebarCard}>
                    <h3 className={styles.sectionHeading}>FEN String</h3>
                    <div className={styles.fenBox} style={{ background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "10px" }}>
                      <code style={{ fontSize: "0.7rem", color: "var(--gold)", wordBreak: "break-all" }}>{currentPuzzle.fen}</code>
                    </div>
                  </div>
                )}
              </div>

{/* Bottom Galaxy (Spans only Col 1 and 2) */}
              {isLiveCompetition && !isReviewMode && showGalaxy && (
                <div className={styles.footerGalaxy}>
                  <PuzzleRacer
                    leaderboard={isEvent ? eventCtx.leaderboard : compCtx.leaderboard}
                    competition={isEvent ? eventCtx.event : compCtx.competition}
                    participant={isEvent ? eventCtx.participant : compCtx.participant}
                    puzzles={isEvent ? eventCtx.puzzles : compCtx.puzzles}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Submit Competition?</h3>
            {getUnattemptedCount() > 0 && (
              <div className={styles.modalWarning}>
                ⚠️ You still have {getUnattemptedCount()} unattempted puzzle{getUnattemptedCount() > 1 ? "s" : ""}. Attempt all puzzles before submitting.
              </div>
            )}
            <p className={styles.modalText}>
              Once you submit, you cannot make any more changes. Your final score will be calculated and you'll be taken to the leaderboard.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setShowSubmitModal(false)} disabled={submitting}>Cancel</button>
              <button className={styles.modalSubmit} onClick={handleSubmitCompetition} disabled={submitting || getUnattemptedCount() > 0}>
                {submitting ? "Submitting..." : "Submit Competition"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PuzzlePage;