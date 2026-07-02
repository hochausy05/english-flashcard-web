import { supabase } from "../lib/supabaseClient";

/**
 * Fetches the user's most frequently wrong words from word_progress.
 * @param {string} userId
 * @returns {Promise<Array<Object>>}
 */
export async function fetchWrongWords(userId) {
  try {
    const { data, error } = await supabase
      .from("word_progress")
      .select(`
        id,
        vocab_item_id,
        correct_count,
        wrong_count,
        correct_streak,
        mastery_level,
        last_reviewed_at,
        wrong_review_correct_streak,
        last_wrong_reviewed_at,
        cleared_from_wrong_words_at,
        last_wrong_at,
        vocab_items (
          id,
          legacy_id,
          word,
          answer,
          ipa,
          pos,
          example,
          audio,
          course_id,
          is_active
        )
      `)
      .eq("user_id", userId)
      .gt("wrong_count", 0)
      .limit(100);

    if (error) {
      console.error("fetchWrongWords error:", error);
      return [];
    }

    // Filter by the new definition of wrong words:
    // 1. User has answered wrong at least once (wrong_count > 0, done in SQL query)
    // 2. Has not reached wrong_review_correct_streak >= 3
    // 3. cleared_from_wrong_words_at is null
    // 4. vocab_items is active (is_active !== false)
    const filtered = (data || []).filter((item) => {
      if (!item.vocab_items) return false;
      if (item.vocab_items.is_active === false) return false;
      
      const streak = item.wrong_review_correct_streak || 0;
      if (streak >= 3) return false;
      if (item.cleared_from_wrong_words_at) return false;

      return true;
    });

    // Sort by level of priority to review:
    // - wrong_count descending (higher count first)
    // - last_wrong_at descending (most recent wrong first)
    // - wrong_review_correct_streak ascending (lower streak first)
    filtered.sort((a, b) => {
      const wrongCountDiff = (b.wrong_count || 0) - (a.wrong_count || 0);
      if (wrongCountDiff !== 0) return wrongCountDiff;

      const timeA = a.last_wrong_at ? new Date(a.last_wrong_at).getTime() : 0;
      const timeB = b.last_wrong_at ? new Date(b.last_wrong_at).getTime() : 0;
      const timeDiff = timeB - timeA;
      if (timeDiff !== 0) return timeDiff;

      const streakDiff = (a.wrong_review_correct_streak || 0) - (b.wrong_review_correct_streak || 0);
      return streakDiff;
    });

    return filtered;
  } catch (err) {
    console.error("fetchWrongWords unexpected error:", err);
    return [];
  }
}

