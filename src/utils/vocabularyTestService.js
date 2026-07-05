/**
 * Service for Vocabulary Test component.
 * Filters and validates vocabulary items for tests.
 */

/**
 * Filter and sort vocab items for a test.
 * 
 * @param {Array<Object>} cards - List of all vocabulary items
 * @param {string} courseCode - 'foundation' or 'toeic1'
 * @param {number} startDay - Start day number (e.g. 1)
 * @param {number} endDay - End day number (e.g. 9 or 18)
 * @returns {Array<Object>} Filtered and sorted cards
 */
export function getTestQuestions(cards, courseCode, startDay, endDay) {
  if (!cards || cards.length === 0) return [];
  
  const filtered = cards.filter(card => {
    const cardCourse = String(card.course || "").trim().toLowerCase();
    const targetCourse = String(courseCode || "").trim().toLowerCase();
    if (cardCourse !== targetCourse) return false;
    
    const dayNum = Number(card.day);
    return !isNaN(dayNum) && dayNum >= startDay && dayNum <= endDay;
  });

  // Sort by day/lesson ascending, then alphabetically by English word
  return filtered.sort((a, b) => {
    const dayA = Number(a.day) || 0;
    const dayB = Number(b.day) || 0;
    if (dayA !== dayB) return dayA - dayB;
    
    const wordA = String(a.word || "").trim();
    const wordB = String(b.word || "").trim();
    return wordA.localeCompare(wordB);
  });
}

/**
 * Normalizes input Vietnamese answer string by removing trailing/leading whitespaces,
 * converting to lowercase, collapsing multiple spaces, and stripping leading/trailing punctuation.
 * 
 * @param {string} str - Raw input answer
 * @returns {string} Cleaned answer
 */
export function cleanAnswer(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?]+|[.,\/#!$%\^&\*;:{}=\-_`~()?]+$/g, "")
    .trim();
}

/**
 * Compares user input Vietnamese answer against correct Vietnamese meanings.
 * Accepts exact matches or single correct meaning from list of slash/comma/semicolon/pipe-separated answers.
 * 
 * @param {string} userVal - User input
 * @param {string} correctVal - Expected meaning
 * @returns {boolean} True if correct
 */
export function checkVietnameseAnswer(userVal, correctVal) {
  if (!userVal || !correctVal) return false;
  
  const cleanedUser = cleanAnswer(userVal);
  
  // 1. Exact match after cleaning
  if (cleanedUser === cleanAnswer(correctVal)) {
    return true;
  }

  // Helper function to remove punctuation
  const removePunctuation = (str) => {
    return str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?|]/g, " ").replace(/\s+/g, " ").trim();
  };

  // 2. Match after removing punctuation entirely (handling optional symbols)
  if (cleanAnswer(removePunctuation(userVal)) === cleanAnswer(removePunctuation(correctVal))) {
    return true;
  }

  // 3. Match any sub-meanings (splitting by comma, semicolon, slash, pipe, or newline)
  const parts = correctVal.split(/[,\/;|]|\r?\n/);
  if (parts.length > 1) {
    return parts.some(part => {
      const cleanedPart = cleanAnswer(part);
      return cleanedPart === cleanedUser || cleanAnswer(removePunctuation(part)) === cleanAnswer(removePunctuation(userVal));
    });
  }

  return false;
}
