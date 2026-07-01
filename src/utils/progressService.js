import { supabase } from "../lib/supabaseClient";

/**
 * Fetches aggregated study session statistics for a user.
 * @param {string} userId
 * @returns {Promise<{totalSessions: number, totalQuestions: number, totalCorrect: number, averageAccuracy: number}>}
 */
export async function fetchSessionStats(userId) {
  try {
    const { data, error } = await supabase
      .from("study_sessions")
      .select("id, total_questions, correct_count, wrong_count, score")
      .eq("user_id", userId);

    if (error) {
      console.error("fetchSessionStats error:", error);
      return { totalSessions: 0, totalQuestions: 0, totalCorrect: 0, averageAccuracy: 0, averageScore: 0 };
    }

    if (!data || data.length === 0) {
      return { totalSessions: 0, totalQuestions: 0, totalCorrect: 0, averageAccuracy: 0, averageScore: 0 };
    }

    const totalSessions = data.length;
    const totalQuestions = data.reduce((sum, s) => sum + (s.total_questions || 0), 0);
    const totalCorrect = data.reduce((sum, s) => sum + (s.correct_count || 0), 0);
    const averageAccuracy = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    const totalScore = data.reduce((sum, s) => sum + (Number(s.score) || 0), 0);
    const averageScore = totalSessions > 0
      ? Number((totalScore / totalSessions).toFixed(1))
      : 0;

    return { totalSessions, totalQuestions, totalCorrect, averageAccuracy, averageScore };
  } catch (err) {
    console.error("fetchSessionStats unexpected error:", err);
    return { totalSessions: 0, totalQuestions: 0, totalCorrect: 0, averageAccuracy: 0, averageScore: 0 };
  }
}

/**
 * Fetches word progress statistics for a user.
 * @param {string} userId
 * @returns {Promise<{wordsLearned: number, wordsMastered: number, wordsToReviewToday: number}>}
 */
export async function fetchWordProgressStats(userId) {
  try {
    const { data, error } = await supabase
      .from("word_progress")
      .select("id, is_mastered, next_review_at")
      .eq("user_id", userId);

    if (error) {
      console.error("fetchWordProgressStats error:", error);
      return { wordsLearned: 0, wordsMastered: 0, wordsToReviewToday: 0 };
    }

    if (!data || data.length === 0) {
      return { wordsLearned: 0, wordsMastered: 0, wordsToReviewToday: 0 };
    }

    const wordsLearned = data.length;
    const wordsMastered = data.filter((w) => w.is_mastered === true).length;

    // Words due for review: next_review_at <= now
    const now = new Date();
    const wordsToReviewToday = data.filter((w) => {
      if (!w.next_review_at) return false;
      return new Date(w.next_review_at) <= now;
    }).length;

    return { wordsLearned, wordsMastered, wordsToReviewToday };
  } catch (err) {
    console.error("fetchWordProgressStats unexpected error:", err);
    return { wordsLearned: 0, wordsMastered: 0, wordsToReviewToday: 0 };
  }
}

/**
 * Fetches the most recent study sessions for a user.
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Array<{id, mode, total_questions, correct_count, score, finished_at}>>}
 */
export async function fetchRecentSessions(userId, limit = 5) {
  try {
    const { data, error } = await supabase
      .from("study_sessions")
      .select("id, mode, total_questions, correct_count, wrong_count, score, finished_at")
      .eq("user_id", userId)
      .order("finished_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("fetchRecentSessions error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("fetchRecentSessions unexpected error:", err);
    return [];
  }
}

/**
 * Fetches the count of words that need review today.
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function fetchWordsToReviewTodayCount(userId) {
  try {
    const nowStr = new Date().toISOString();

    const { data, error } = await supabase
      .from("word_progress")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .lte("next_review_at", nowStr);

    if (error) {
      console.error("fetchWordsToReviewTodayCount error:", error);
      return 0;
    }

    return data ? data.length : 0;
  } catch (err) {
    console.error("fetchWordsToReviewTodayCount unexpected error:", err);
    return 0;
  }
}

/**
 * Fetches vocabulary items that are due for review for a user.
 * @param {string} userId
 * @returns {Promise<Array<Object>>}
 */
export async function fetchDueReviewWords(userId) {
  try {
    const nowStr = new Date().toISOString();

    const { data, error } = await supabase
      .from("word_progress")
      .select(`
        id,
        vocab_item_id,
        correct_count,
        wrong_count,
        correct_streak,
        mastery_level,
        vocab_items (
          id,
          legacy_id,
          word,
          answer,
          ipa,
          pos,
          example,
          audio,
          course_id
        )
      `)
      .eq("user_id", userId)
      .lte("next_review_at", nowStr);

    if (error) {
      console.error("fetchDueReviewWords error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("fetchDueReviewWords unexpected error:", err);
    return [];
  }
}

