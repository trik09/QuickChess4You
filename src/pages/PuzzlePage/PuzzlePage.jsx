import { useState, useEffect, useRef } from "react";
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
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import socketService from "../../services/socketService";

import ChessBoard from "../../components/ChessBoard/ChessBoard";
import { FaArrowLeft } from "react-icons/fa";
import { puzzleAPI, competitionAPI } from "../../services/api";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import { useAuth } from "../../contexts/AuthContext";
import { useLiveCompetition } from "../../contexts/LiveCompetitionContext";
import PuzzleRacer from "../../components/PuzzleRacer/PuzzleRacer";
import GameTimer from "./components/GameTimer";
import PremiumLoader from "../../components/PremiumLoader/PremiumLoader";
import styles from "./PuzzlePage.module.css";

function PuzzlePage() {
  const { id: paramCompetitionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    participateInCompetition,
    disconnectFromCompetition,
    getLeaderboard,
    leaderboard,
    getCurrentUserRank,
    ensureSocketConnection,
    updateParticipant,
  } = useLiveCompetition();

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
        type: p.type === "kids" ? "Kids" : p.title || "Puzzle",
        difficulty: p.difficulty || "medium",
        puzzleType: p.type || "normal",
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
        `.${styles.chapterTabActive}`,
      );
      if (activeTab) {
        activeTab.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
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

  // Timer & Score
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [score, setScore] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  // Submission Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Solution Modal State (for Review Mode)
  const [showSolutionModal, setShowSolutionModal] = useState(false);

  // Inline Solution Toggle State (for Review Mode)
  const [showInlineSolution, setShowInlineSolution] = useState(false);

  // Reset inline solution when puzzle changes
  useEffect(() => {
    setShowInlineSolution(false);
  }, [currentPuzzleIndex]);

  // Refs for tracking without re-renders
  const timerRef = useRef(null);
  const isLoadedRef = useRef(false);
  const isLiveRef = useRef(false);

  // Listen for competition events from socket directly
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
      // Only show loading spinner if we don't have instant state from the Lobby
      if (!location.state?.competitionId) {
        setLoading(true);
      }

      // Check if this is a competition
      if (paramCompetitionId) {
        // PERFORMANCE: Parallel fetch of competition data + puzzles
        const [compResponse, puzzleRes] = await Promise.all([
          competitionAPI.getById(paramCompetitionId),
          liveCompetitionAPI
            .getPuzzles(paramCompetitionId)
            .catch(() => ({ success: false })),
        ]);

        if (!compResponse.success || !compResponse.data) {
          throw new Error("Failed to load competition data");
        }

        const comp = compResponse.data;
        setCompetitionData(comp);

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
        const isAboutToStart = diffToStart > 0 && diffToStart <= 12000; // 12s buffer for clock drift
        setIsBeforeStartTime(!isLive && diffToStart > 0);
        targetStartTimeRef.current = start;

        // CRITICAL: Hide loading as soon as we have competition data to show the layout
        setLoading(false);

        if (!reviewMode) {
          if (!isLive && !isAboutToStart) {
            navigate(`/competition/${paramCompetitionId}/lobby`);
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
                type: p.type === "kids" ? "Kids" : p.title || "Puzzle",
                difficulty: p.difficulty || "medium",
                description: p.description || "",
                kidsConfig: p.kidsConfig,
                puzzleType: p.type || "normal",
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
              setPuzzleStatuses(statuses);

              // Restore board states from localStorage and merge with server data
              // In Review Mode, we don't want to restore old states since they might be missing our new moveHistory arrays!
              if (!reviewMode) {
                const stateKey = `puzzleState_${paramCompetitionId}`;
                const savedState = localStorage.getItem(stateKey);
                if (savedState) {
                  try {
                    const parsed = JSON.parse(savedState);
                    // Merge server statuses with localStorage statuses
                    const mergedStatuses = {
                      ...parsed.puzzleStatuses,
                      ...statuses,
                    };
                    setPuzzleStatuses(mergedStatuses);
                    setPuzzleBoardStates(parsed.puzzleBoardStates || {});
                    console.log(
                      "Merged puzzle statuses (server + localStorage):",
                      mergedStatuses,
                    );
                    console.log(
                      "Restored board states from localStorage:",
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
                type: p.type === "kids" ? "Kids" : p.title || "Puzzle",
                difficulty: p.difficulty || "medium",
                description: p.description || "",
                kidsConfig: p.kidsConfig,
                puzzleType: p.type || "normal",
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
              title: p.title,
              type: p.type,
              difficulty: p.difficulty,
              kidsConfig: p.kidsConfig,
              puzzleType: p.type || "normal",
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
        const data = await puzzleAPI.getAll();
        const normalized = data
          .filter((p) => p.fen && (p.solutionMoves?.length || p.kidsConfig))

          .map((p, i) => ({
            id: p._id,
            index: i + 1,
            fen: p.fen,
            solution: p.solutionMoves,
            alternativeSolutions: p.alternativeSolutions,
            type: p.type,
            description: p.description,
            kidsConfig: p.kidsConfig,
            puzzleType: p.type,
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

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
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
          } else {
            setIsBeforeStartTime(true);
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
        navigate(`/competition/${paramCompetitionId}/lobby`); // Lobby will show as leaderboard
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

    // Use passed winning moves or fallback to default solution
    // If winningMoves is an array of strings (SAN), use it.
    const solutionToSend =
      Array.isArray(winningMoves) && winningMoves.length > 0
        ? winningMoves
        : currentPuzzle.solution;

    // Check if already solved
    if (puzzleStatuses[currentPuzzle.id] === "success") return;

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
      // Fire-and-forget promise
      (async () => {
        try {
          // Always use live API for competitions to ensure immediate calculation in the race
          if (isLiveRef.current || paramCompetitionId) {
            const movesPlayed =
              boardMoveHistory ||
              puzzleBoardStates[currentPuzzle.id]?.moveHistory ||
              [];
            const res = await liveCompetitionAPI.submitSolution(
              competitionData._id,
              currentPuzzle.id,
              solutionToSend,
              timeTaken,
              null,
              movesPlayed,
            );

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
              console.warn("Backend rejected correct solution:", res.message);
              // Revert optimistic update could be placed here if strictly needed
            }
          } else {
            // Regular competition
            const res = await competitionAPI.submitSolution(
              competitionData._id,
              currentPuzzle.id,
              solutionToSend,
              timeTaken,
            );

            if (res.points) {
              setScore((prev) => prev + res.points);
            }
          }
        } catch (error) {
          console.error("Background submission failed:", error);
        }
      })();
    } else {
      // No competition, just add local score
      setScore((prev) => prev + 10);
    }
  };

  const handleWrongMove = async (boardMoveHistory) => {
    const currentPuzzle = puzzles[currentPuzzleIndex];
    if (!currentPuzzle) return;

    const puzzleId = currentPuzzle.id || currentPuzzle._id;

    // Check if already marked as failed
    if (puzzleStatuses[puzzleId] === "failed") return;

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
    }, 200); // 200ms delay to show red error state on board explicitly

    // --- BACKGROUND SUBMISSION ---
    // Submit failed attempt to backend if it's a live competition
    if (competitionData && isLiveCompetition) {
      (async () => {
        try {
          // Submit wrong solution to backend to mark as failed
          const movesPlayed =
            boardMoveHistory || puzzleBoardStates[puzzleId]?.moveHistory || [];
          await liveCompetitionAPI.submitSolution(
            competitionData._id,
            currentPuzzle.id,
            ["wrong", "move"], // Send wrong moves
            timeTaken,
            null,
            movesPlayed,
          );
        } catch (error) {
          console.error("Failed to submit wrong move in background:", error);
        }
      })();
    }
  };

  // Handle early submission
  const handleSubmitCompetition = async () => {
    if (!competitionData || !isLiveCompetition) return;

    try {
      setSubmitting(true);

      const response = await liveCompetitionAPI.submitCompetition(
        competitionData._id,
      );

      if (response.success) {
        toast.success("Submitted! Returning to lobby...");
        setShowSubmitModal(false);

        // Clear local storage
        const stateKey = `puzzleState_${paramCompetitionId}`;
        localStorage.removeItem(stateKey);

        // Navigate back to Lobby (player waits there with live scores)
        navigate(`/competition/${competitionData._id}/lobby`);
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
    puzzles.forEach((p) => {
      const pid = p.id || p._id;
      if (
        puzzleStatuses[pid] !== "success" &&
        puzzleStatuses[pid] !== "failed"
      ) {
        count++;
      }
    });
    return count;
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

  return (
    <div className={styles.container}>
      <Toaster position="top-right" />
      {/* THIN TITLE HEADERBAR */}
      {competitionData && (
        <div className={styles.titleHeader}>
          <div className={styles.titleHeaderLeft}>
            <button className={styles.backBtnHeader} onClick={() => navigate(-1)} title="Go back">
              <FaArrowLeft />
            </button>
            <h2 className={styles.mainTitle}>{competitionData.name}</h2>
            {/* {competitionData.chapters?.length > 0 && (
              <div className={styles.chapterBadgeRowHeader}>
                <span className={styles.chapterBadgeHeader}>{competitionData.chapters[activeChapterIndex]?.name || "Chapter 1"}</span>
                <span className={styles.chapterBadgeHeader} style={{ opacity: 0.8 }}>
                  {chapterCurrentIndex >= 0 ? chapterCurrentIndex + 1 : 1} of {navPuzzles.length}
                </span>
              </div>
            )} */}
            {isReviewMode && <span className={styles.liveBadge} style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", borderColor: "rgba(165,180,252,0.3)" }}>Review</span>}
          </div>

          {/* MID HEADER: HORIZONTAL CHAPTERS */}
          {competitionData.chapters?.length > 0 && (
            <div className={styles.titleHeaderMid}>
              <button className={styles.headerNavArrow} onClick={() => scrollHeader('left')} title="Scroll left">
                <FaCaretLeft />
              </button>
              <div className={styles.headerChaptersWrap} ref={headerScrollRef}>
                {competitionData.chapters.map((chapter, idx) => {
                  const ids = (chapter.puzzleIds || []).map(id => id.toString());
                  const chPs = puzzles.filter(p => ids.includes((p._id || p.id).toString()));
                  const solved = chPs.filter(p => puzzleStatuses[(p.id || p._id).toString()] === "success").length;
                  return (
                    <button
                      key={`h-ch-${idx}`}
                      type="button"
                      className={`${styles.headerChapterPill} ${activeChapterIndex === idx ? styles.headerChapterPillActive : ""}`}
                      onClick={() => {
                        if (isBeforeStartTime && !isReviewMode) return;
                        setActiveChapterIndex(idx);
                        setCurrentFrame(0);
                        const gPs = puzzles.filter(p => ids.includes((p._id || p.id).toString()));
                        if (gPs.length > 0) {
                          const gi = puzzles.findIndex(p => (p._id || p.id).toString() === (gPs[0]._id || gPs[0].id).toString());
                          if (gi !== -1) setCurrentPuzzleIndex(gi);
                        }
                      }}
                      style={{ cursor: isBeforeStartTime && !isReviewMode ? "not-allowed" : "pointer" }}
                    >
                      <span className={styles.headerChapterName}>{chapter.name}</span>
                      <span className={styles.headerChapterBadge}>{solved}/{chPs.length}</span>
                    </button>
                  );
                })}
              </div>
              <button className={styles.headerNavArrow} onClick={() => scrollHeader('right')} title="Scroll right">
                <FaCaretRight />
              </button>
            </div>
          )}

          <div className={styles.titleHeaderRight}>
            <button
              className={`${styles.galaxyToggle} ${!showGalaxy ? styles.galaxyToggleOff : ""}`}
              onClick={() => setShowGalaxy(!showGalaxy)}
              title={showGalaxy ? "Hide Galaxy" : "Show Galaxy"}
            >
              <span className={styles.toggleIcon}>🪐</span>
              <span className={styles.toggleText}>{showGalaxy ? "Galaxy On" : "Galaxy Off"}</span>
              <div className={styles.toggleSwitch}>
                <div className={styles.toggleKnob} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* BODY — 3 Columns */}
      <div className={`${styles.body} ${!showGalaxy ? styles.galaxyOffLayout : ""}`}>
        {/* LEFT COLUMN */}
        <div className={styles.leftColumn}>
          {competitionData && (
            <div className={styles.statsCard}>

              {!isReviewMode && (
                <div className={styles.timerBox}>
                  <div className={styles.timerLabel}>{isBeforeStartTime ? "Starts In" : "Time Left"}</div>
                  <div className={styles.timerValue}>
                    {(() => {
                      const t = isBeforeStartTime && targetStartTimeRef.current
                        ? Math.max(0, Math.floor((targetStartTimeRef.current - Date.now()) / 1000))
                        : timeLeft;
                      return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
                    })()}
                  </div>
                </div>
              )}
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Score</span>
                  <span className={`${styles.statValue} ${styles.gold}`}>{Math.round(score)}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Solved</span>
                  <span className={styles.statValue}>{solvedCount}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Attempted</span>
                  <span className={styles.statValue}>{puzzles.length - getUnattemptedCount()}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Remaining</span>
                  <span className={styles.statValue}>{getUnattemptedCount()}</span>
                </div>
              </div>
            </div>
          )}

          {currentPuzzle && (() => {
            const fenTurn = currentPuzzle.fen?.split(" ")[1];
            const uColor = fenTurn === "w" ? "b" : "w";
            return (
              <div className={`${styles.infoCard} ${uColor === "w" ? styles.turnWhite : styles.turnBlack}`}>
                <div className={styles.toPlayRow}>
                  <span className={`${styles.kingIcon} ${uColor === "w" ? styles.kingWhite : styles.kingBlack}`}>
                    {uColor === "w" ? "♔" : "♚"}
                  </span>
                  <span className={styles.toPlayText}>{uColor === "w" ? "White to play" : "Black to play"}</span>
                </div>
                <div className={styles.infoMeta}>
                  <div className={styles.infoMetaItem}>
                    <span className={styles.infoMetaLabel}>Level</span>
                    <span className={styles.infoMetaValue}>{currentPuzzle.level || 1}/7</span>
                  </div>
                  <div className={styles.infoMetaItem}>
                    <span className={styles.infoMetaLabel}>Difficulty</span>
                    <span className={`${styles.infoMetaValue} ${styles["diff_" + (currentPuzzle.difficulty || "medium").toLowerCase()]}`}>
                      {currentPuzzle.difficulty || "Medium"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
          {competitionData && isLiveCompetition && !isReviewMode && (
            <div className={styles.rankCard}>
              <div className={styles.rankRow}>
                <div className={styles.rankLabel}><span>🏆</span> YOUR RANK</div>
                <div className={styles.rankNumber}>#{getCurrentUserRank() || "–"}</div>
              </div>
              <div className={styles.rankProgressBar}>
                <div className={styles.rankProgressFill} style={{ width: `${puzzles.length > 0 ? (solvedCount / puzzles.length) * 100 : 0}%` }} />
              </div>
              <div className={styles.rankParticipants}>{leaderboard.length} participant{leaderboard.length !== 1 ? "s" : ""}</div>
            </div>
          )}




        </div>

        {/* CENTER: Chessboard */}
        <div className={styles.boardArea}>
          <div className={styles.boardWrapper}>
            {puzzles.length > 0 && currentPuzzle ? (
              <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChessBoard
                  key={`${currentPuzzle.id || currentPuzzle._id}-${currentPuzzleIndex}`}
                  fen={currentPuzzle.fen}
                  solution={currentPuzzle.solution}
                  alternativeSolutions={currentPuzzle.alternativeSolutions}
                  puzzleType={currentPuzzle.puzzleType || currentPuzzle.type}
                  kidsConfig={currentPuzzle.kidsConfig}
                  firstMoveBy={
                    isBeforeStartTime && !isReviewMode
                      ? "human"
                      : currentPuzzle.firstMoveBy
                  }
                  onPuzzleSolved={handlePuzzleSolved}
                  onWrongMove={handleWrongMove}
                  onBoardStateChange={(fen, moveHistory) => {
                    if (isBeforeStartTime && !isReviewMode) return;
                    const puzzleId = currentPuzzle.id || currentPuzzle._id;
                    setPuzzleBoardStates(prev => ({ ...prev, [puzzleId]: { fen, moveHistory } }));
                  }}
                  savedBoardState={
                    isReviewMode
                      ? null
                      : puzzleBoardStates[currentPuzzle.id || currentPuzzle._id]
                  }
                  isSolved={
                    puzzleStatuses[currentPuzzle.id || currentPuzzle._id] ===
                    "success"
                  }
                  interactive={
                    !solving &&
                    !isBeforeStartTime &&
                    (isReviewMode ||
                      (puzzleStatuses[currentPuzzle.id || currentPuzzle._id] !==
                        "success" &&
                        puzzleStatuses[
                        currentPuzzle.id || currentPuzzle._id
                        ] !== "failed"))
                  }
                  showSolution={showSolution}
                />
                {isBeforeStartTime && !isReviewMode && (
                  <div className={styles.boardBeforeStart}>
                    <div className={styles.boardStartLabel}>Competition starts in</div>
                    <div className={styles.boardStartCountdown}>
                      {Math.max(0, Math.floor((new Date(competitionData.startTime).getTime() - Date.now()) / 1000))}s
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.loading}>No Puzzles Available</div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        {competitionData && (
          <div className={styles.rightColumn}>

            {/* CHAPTERS BOX — all visible, wrapping */}
            {competitionData.chapters?.length > 0 && (
              <div className={styles.chaptersBox}>
                <div className={styles.chaptersBoxTitle}>CHAPTERS</div>
                <div className={styles.chaptersWrap}>
                  {competitionData.chapters.map((chapter, idx) => {
                    const ids = (chapter.puzzleIds || []).map(id => id.toString());
                    const chPs = puzzles.filter(p => ids.includes((p._id || p.id).toString()));
                    const solved = chPs.filter(p => puzzleStatuses[(p.id || p._id).toString()] === "success").length;
                    return (
                      <button key={idx} type="button"
                        className={`${styles.chapterPill} ${activeChapterIndex === idx ? styles.chapterPillActive : ""}`}
                        onClick={() => {
                          if (isBeforeStartTime && !isReviewMode) return;
                          setActiveChapterIndex(idx); setCurrentFrame(0);
                          const gPs = puzzles.filter(p => ids.includes((p._id || p.id).toString()));
                          if (gPs.length > 0) { const gi = puzzles.findIndex(p => (p._id || p.id).toString() === (gPs[0]._id || gPs[0].id).toString()); if (gi !== -1) setCurrentPuzzleIndex(gi); }
                        }}
                        style={{ cursor: isBeforeStartTime && !isReviewMode ? "not-allowed" : "pointer" }}
                      >
                        <div className={styles.chapterPillContent}>
                          <span className={styles.chapterPillName}>{chapter.name}</span>
                          <span className={styles.chapterPillBadge}>{solved}/{chPs.length}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.navCard}>
              <div className={styles.navCardTitle}>PUZZLES</div>
              {totalPages > 1 && <div className={styles.paginationInfo}>Page {currentFrame + 1} of {totalPages}</div>}

              {!isReviewMode && (
                <div className={styles.navGrid}>
                  {navPuzzles.slice(currentFrame * ITEMS_PER_PAGE, (currentFrame + 1) * ITEMS_PER_PAGE).map((puzzle, li) => {
                    const gi = puzzles.findIndex(p => (p._id || p.id) === (puzzle._id || puzzle.id));
                    const ci = currentFrame * ITEMS_PER_PAGE + li;
                    const pid = puzzle.id || puzzle._id;
                    const status = puzzleStatuses[pid];
                    return (
                      <div key={`nav-${pid}`}
                        className={`${styles.navItem} ${chapterCurrentIndex === ci ? styles.active : ""} ${status === "success" ? styles.success : ""} ${status === "failed" ? styles.danger : ""}`}
                        onClick={() => { if (isBeforeStartTime && !isReviewMode) return; if (!solving) { setCurrentPuzzleIndex(gi); if (status === "success") toast.info("Puzzle already solved!"); else if (status === "failed") toast.info("Puzzle failed — view only"); } }}
                        style={{ cursor: isBeforeStartTime && !isReviewMode ? "not-allowed" : "pointer" }}
                      >
                        {status === "success" ? <FaCheckCircle /> : gi + 1}
                      </div>
                    );
                  })}
                </div>
              )}

              {isReviewMode && (
                <>
                  <div className={styles.sectionTitle}>Practice Attempts</div>
                  <div className={styles.navGrid}>
                    {navPuzzles.slice(currentFrame * ITEMS_PER_PAGE, (currentFrame + 1) * ITEMS_PER_PAGE).map((puzzle, li) => {
                      const gi = puzzles.findIndex(p => (p._id || p.id) === (puzzle._id || puzzle.id));
                      const ci = currentFrame * ITEMS_PER_PAGE + li;
                      const pid = puzzle.id || puzzle._id;
                      const pStatus = practiceStatuses[pid];
                      return (
                        <div key={`prac-${pid}`}
                          className={`${styles.navItem} ${chapterCurrentIndex === ci ? styles.active : ""} ${pStatus === "success" ? styles.success : ""} ${pStatus === "failed" ? styles.danger : ""}`}
                          onClick={() => { if (!solving) setCurrentPuzzleIndex(gi); }} style={{ cursor: "pointer" }}>
                          {pStatus === "success" ? <FaCheckCircle /> : gi + 1}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div className={styles.navControls}>
                <button className={styles.navArrow}
                  onClick={() => {
                    if (chapterCurrentIndex <= 0) {
                      if (activeChapterIndex > 0) {
                        const pi = activeChapterIndex - 1;
                        const ids = (competitionData.chapters[pi].puzzleIds || []).map(id => id.toString());
                        const chPs = puzzles.filter(p => ids.includes((p._id || p.id).toString()));
                        if (chPs.length > 0) { const gi = puzzles.findIndex(p => (p._id || p.id).toString() === (chPs[chPs.length - 1]._id || chPs[chPs.length - 1].id).toString()); if (gi !== -1) setCurrentPuzzleIndex(gi); }
                      }
                    } else {
                      const nci = chapterCurrentIndex - 1;
                      const gi = puzzles.findIndex(p => (p._id || p.id) === (navPuzzles[nci]?._id || navPuzzles[nci]?.id));
                      if (gi !== -1) setCurrentPuzzleIndex(gi);
                    }
                  }}
                  disabled={(chapterCurrentIndex <= 0 && activeChapterIndex <= 0) || (isBeforeStartTime && !isReviewMode)}
                >← Prev</button>
                <button className={styles.navArrow}
                  onClick={() => {
                    if (chapterCurrentIndex >= navPuzzles.length - 1) {
                      if (competitionData.chapters && activeChapterIndex < competitionData.chapters.length - 1) {
                        const ni = activeChapterIndex + 1;
                        const ids = (competitionData.chapters[ni].puzzleIds || []).map(id => id.toString());
                        const chPs = puzzles.filter(p => ids.includes((p._id || p.id).toString()));
                        if (chPs.length > 0) { const gi = puzzles.findIndex(p => (p._id || p.id).toString() === (chPs[0]._id || chPs[0].id).toString()); if (gi !== -1) setCurrentPuzzleIndex(gi); }
                      }
                    } else {
                      const nci = chapterCurrentIndex + 1;
                      const gi = puzzles.findIndex(p => (p._id || p.id) === (navPuzzles[nci]?._id || navPuzzles[nci]?.id));
                      if (gi !== -1) setCurrentPuzzleIndex(gi);
                    }
                  }}
                  disabled={(chapterCurrentIndex >= navPuzzles.length - 1 && activeChapterIndex >= (competitionData.chapters?.length || 1) - 1) || (isBeforeStartTime && !isReviewMode)}
                >Next →</button>
              </div>

              {totalPages > 1 && (
                <div className={styles.paginationContainer}>
                  <button className={styles.pageBtn} onClick={() => setCurrentFrame(0)} disabled={currentFrame === 0}>«</button>
                  <button className={styles.pageBtn} onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))} disabled={currentFrame === 0}>‹</button>
                  <button className={styles.pageBtn} onClick={() => setCurrentFrame(Math.min(totalPages - 1, currentFrame + 1))} disabled={currentFrame >= totalPages - 1}>›</button>
                  <button className={styles.pageBtn} onClick={() => setCurrentFrame(totalPages - 1)} disabled={currentFrame >= totalPages - 1}>»</button>
                </div>
              )}



              {isReviewMode && (
                <div style={{ marginTop: 8 }}>
                  <button className={styles.viewSolBtn} onClick={() => setShowInlineSolution(!showInlineSolution)}>
                    {showInlineSolution ? "Hide Solution" : "View Solution"}
                  </button>
                  {showInlineSolution && (
                    <div className={styles.solutionBox}>
                      {currentPuzzle?.moveHistory?.length > 0 && (() => {
                        const pid = currentPuzzle.id || currentPuzzle._id;
                        const wasSolved = puzzleStatuses[pid] === "success";
                        const accent = wasSolved ? "#4ade80" : "#f87171";
                        return (
                          <div className={styles.userAttemptSection}>
                            <div className={styles.sectionTitle} style={{ color: accent }}>Your Moves</div>
                            <div className={styles.solutionMoves}>
                              {currentPuzzle.moveHistory.map((move, i) => i % 2 === 0
                                ? <span key={`am${i}`} style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: "0.78rem" }}>{Math.floor(i / 2) + 1}. {move}</span>
                                : <span key={`am${i}`} className={styles.moveTag} style={{ background: wasSolved ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)", color: accent, textDecoration: wasSolved ? "none" : "line-through" }}>{move}</span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                      <div className={styles.correctSolutionSection}>
                        <div className={styles.sectionTitle} style={{ color: "#4ade80", marginTop: 8 }}>Correct Solution</div>
                        <div className={styles.solutionMoves}>
                          {currentPuzzle?.solution?.length > 0
                            ? currentPuzzle.solution.map((move, i) => i % 2 === 0 ? null : <span key={`sol${i}`} className={styles.moveTag} style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}>{Math.floor(i / 2) + 1}. {move}</span>)
                            : <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem" }}>No solution available.</span>
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {isLiveCompetition && !isReviewMode && (
              <button className={styles.btnSubmitLeft}
                onClick={() => setShowSubmitModal(true)}
                disabled={submitting || getUnattemptedCount() > 0}
                title={getUnattemptedCount() > 0 ? `Attempt ${getUnattemptedCount()} more puzzle(s) first` : ""}
              >
                Submit Competition
              </button>
            )}
          </div>
        )}


      </div>
      {/* END BODY */}

      {/* GALAXY — Full Width */}
      {isLiveCompetition && !isReviewMode && showGalaxy && (
        <div className={styles.galaxySection}>
          <PuzzleRacer />
        </div>
      )}

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
