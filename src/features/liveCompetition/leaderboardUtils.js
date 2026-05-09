// Normalize a userId field (string, object with _id/id, or null) to a plain string
export const normalizeUserId = (userId) => {
  if (!userId) return null;
  if (typeof userId === 'object') return String(userId._id || userId.id || '');
  return String(userId);
};

export const deduplicateLeaderboard = (list) => {
  if (!list || !Array.isArray(list)) return [];
  const map = new Map();
  
  // Process in forward order to maintain natural join sequence
  const processedList = [...list];
  
  processedList.forEach(p => {
    const extractedId = normalizeUserId(p.userId);
    // Only fall back to username if we genuinely have no ID
    const idToUse = (extractedId && extractedId !== '') ? extractedId : String(p.username || '');
    
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
    if ((a.timeSpent || 0) !== (b.timeSpent || 0)) {
      return (a.timeSpent || 0) - (b.timeSpent || 0);
    }
    
    // Tiebreaker: joinedAt ascending (earlier join gets lower rank/comes first)
    const timeA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
    const timeB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    
    return 0;
  });

  // Reassign ranks dynamically
  deduped.forEach((racer, index) => {
    racer.rank = index + 1;
  });

  return deduped;
};
