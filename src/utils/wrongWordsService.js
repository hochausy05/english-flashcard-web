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
      .gt("wrong_count", 0)
      .order("wrong_count", { ascending: false })
      .limit(30); // Top 30 wrong words

    if (error) {
      console.error("fetchWrongWords error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("fetchWrongWords unexpected error:", err);
    return [];
  }
}
