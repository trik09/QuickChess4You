export const deduplicateLeaderboard = (list) => {
  if (!list || !Array.isArray(list)) return [];
  const map = new Map();
  list.forEach(p => {
    // Correctly handle both string IDs and populated object IDs to ensure 100% uniqueness
    const extractedId = p.userId && typeof p.userId === 'object' 
      ? (p.userId._id || p.userId.id) 
      : p.userId;
    const idToUse = String(extractedId || p.username);
    
    if (map.has(idToUse)) {
      const existing = map.get(idToUse);
      // Keep the entry with highest score -> highest puzzlesSolved -> lowest timeSpent
      const isNewBetter = 
        (p.score || 0) > (existing.score || 0) || 
        ((p.score || 0) === (existing.score || 0) && (p.puzzlesSolved || 0) > (existing.puzzlesSolved || 0)) ||
        ((p.score || 0) === (existing.score || 0) && (p.puzzlesSolved || 0) === (existing.puzzlesSolved || 0) && (p.timeSpent || 0) < (existing.timeSpent || 0));

      if (isNewBetter) {
        map.set(idToUse, p);
      }
    } else {
      map.set(idToUse, p);
    }
  });

  const deduped = Array.from(map.values()).sort((a, b) => {
    if ((b.score || 0) !== (a.score || 0)) {
      return (b.score || 0) - (a.score || 0);
    }
    return (a.timeSpent || 0) - (b.timeSpent || 0);
  });

  // Reassign ranks dynamically
  deduped.forEach((racer, index) => {
    racer.rank = index + 1;
  });

  return deduped;
};
