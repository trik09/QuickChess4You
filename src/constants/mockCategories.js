/**
 * MOCK QUIZ CATEGORIES
 *
 * Used as a development fallback when the quiz-category API returns no data.
 * Replace this file's export with a real API call in production by updating
 * CreateQuiz.jsx to remove the fallback once categories are seeded in the DB.
 *
 * Shape mirrors the API response: { _id: string, name: string }
 * Using string IDs prefixed with "mock_" to distinguish them at a glance.
 */

export const MOCK_QUIZ_CATEGORIES = [
  { _id: 'mock_1', name: 'Opening' },
  { _id: 'mock_2', name: 'Tactics' },
  { _id: 'mock_3', name: 'Endgame' },
  { _id: 'mock_4', name: 'Checkmate' },
  { _id: 'mock_5', name: 'Strategy' },
  { _id: 'mock_6', name: 'Defense' },
  { _id: 'mock_7', name: 'Pawn Structure' },
];
