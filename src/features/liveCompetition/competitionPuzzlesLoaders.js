import { buildPuzzleStateToSave } from "./puzzleStateMerge";

export function shouldHydrateCompetition(currentCompetition) {
  return !currentCompetition;
}

export function deriveTotalPuzzleCount({
  currentTotalPuzzleCount,
  responseCompetition,
  responsePuzzles,
}) {
  if (currentTotalPuzzleCount !== 0) return null;
  return responseCompetition?.totalPuzzles || responsePuzzles?.length || 0;
}

export function syncPuzzleStatesToLocalStorage({
  competitionId,
  puzzlesWithStates,
  puzzleStateManager,
}) {
  (puzzlesWithStates || []).forEach((puzzle) => {
    if (puzzle.status !== "unsolved") {
      const stateToSave = buildPuzzleStateToSave(puzzle);
      puzzleStateManager.savePuzzleState(competitionId, puzzle._id, stateToSave);
    }
  });
}

