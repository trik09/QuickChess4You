/**
 * Merge server puzzle list with stored puzzle states (localStorage).
 * Behavior is intentionally conservative and mirrors the previous inline logic:
 * - Server definitive status ("solved"/"failed") takes precedence
 * - Otherwise, localStorage status can fill in
 * - Otherwise, fall back to boolean flags
 */
export function mergePuzzlesWithStoredStates({
  serverPuzzles,
  storedStates,
}) {
  return (serverPuzzles || []).map((puzzle) => {
    const storedState = storedStates?.[puzzle._id];

    // Determine final status - server takes precedence, then localStorage
    let finalStatus = "unsolved";
    let isSolved = false;
    let isFailed = false;
    let isLocked = false;

    if (
      puzzle.status &&
      (puzzle.status === "solved" || puzzle.status === "failed")
    ) {
      // Server has definitive status
      finalStatus = puzzle.status;
      isSolved = puzzle.status === "solved";
      isFailed = puzzle.status === "failed";
      isLocked = true;
    } else if (
      storedState &&
      (storedState.status === "solved" || storedState.status === "failed")
    ) {
      // Use localStorage status if server doesn't have it
      finalStatus = storedState.status;
      isSolved = storedState.status === "solved";
      isFailed = storedState.status === "failed";
      isLocked = storedState.isLocked || true;
    } else if (puzzle.isSolved || puzzle.isFailed) {
      // Fallback to boolean flags
      finalStatus = puzzle.isSolved ? "solved" : "failed";
      isSolved = puzzle.isSolved;
      isFailed = puzzle.isFailed;
      isLocked = true;
    }

    return {
      ...puzzle,
      status: finalStatus,
      isSolved,
      isFailed,
      isLocked,

      // Preserve board position from localStorage if available
      boardPosition: puzzle.boardPosition || storedState?.boardPosition,
      moveHistory: puzzle.moveHistory || storedState?.moveHistory || [],

      // Merge solved data
      solvedData:
        puzzle.solvedData ||
        (storedState?.status === "solved"
          ? {
              scoreEarned: storedState.scoreEarned,
              timeSpent: storedState.timeSpent,
              solvedAt: storedState.solvedAt,
            }
          : null),
    };
  });
}

/**
 * Create a localStorage-safe puzzle state blob for saving.
 * Matches the previous inline format as closely as possible.
 */
export function buildPuzzleStateToSave(puzzle) {
  const stateToSave = {
    status: puzzle.status,
    boardPosition: puzzle.boardPosition,
    moveHistory: puzzle.moveHistory,
    timeSpent: puzzle.solvedData?.timeSpent || 0,
    isLocked: puzzle.isLocked,
    scoreEarned: puzzle.solvedData?.scoreEarned || 0,
  };

  if (puzzle.status === "solved") {
    stateToSave.solvedAt = puzzle.solvedData?.solvedAt || Date.now();
  } else if (puzzle.status === "failed") {
    stateToSave.failedAt = Date.now();
  }

  return stateToSave;
}

