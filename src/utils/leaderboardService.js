import { supabase } from "../lib/supabaseClient";

/**
 * Fetches the vocabulary leaderboard from Supabase.
 * Uses the get_vocabulary_leaderboard RPC function.
 * 
 * @param {number} limitCount - Maximum number of users to fetch
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function fetchLeaderboard(limitCount = 20) {
  try {
    const { data, error } = await supabase.rpc("get_vocabulary_leaderboard", {
      limit_count: limitCount
    });

    if (error) {
      console.error("fetchLeaderboard RPC error:", error);
      
      // Provide a friendly error message for permission or missing function issues
      let friendlyMessage = "Không tải được bảng xếp hạng. Vui lòng thử lại.";
      if (error.code === "P0001" || error.message?.includes("permission") || error.code === "42501") {
        friendlyMessage = "Bạn không có quyền xem bảng xếp hạng. Vui lòng đăng nhập lại.";
      } else if (error.code === "3f000" || error.message?.includes("does not exist")) {
        friendlyMessage = "Tính năng bảng xếp hạng đang được thiết lập hệ thống. Vui lòng quay lại sau.";
      }

      return {
        success: false,
        data: [],
        error: friendlyMessage
      };
    }

    // Map database snake_case fields to camelCase for standard frontend usage
    const normalizedData = (data || []).map(row => ({
      rank: Number(row.rank || 0),
      displayName: row.display_name || "Người học ẩn danh",
      learnedWords: Number(row.learned_words || 0),
      completedLessons: Number(row.completed_lessons || 0),
      accuracy: Number(row.accuracy || 0),
      totalSessions: Number(row.total_sessions || 0),
      leaderboardScore: Number(row.leaderboard_score || 0)
    }));

    return {
      success: true,
      data: normalizedData,
      error: null
    };
  } catch (err) {
    console.error("fetchLeaderboard unexpected error:", err);
    return {
      success: false,
      data: [],
      error: "Đã xảy ra lỗi không mong muốn khi tải bảng xếp hạng."
    };
  }
}
