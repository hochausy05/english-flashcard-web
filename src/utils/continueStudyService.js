import { supabase } from "../lib/supabaseClient";
import { fetchLessonCompletionMap } from "./lessonProgressService";
import { fetchWordsToReviewTodayCount } from "./progressService";

/**
 * Resolves the prioritized suggestion for today's study.
 * 
 * Hierarchy:
 * 1. Due Review items (Spaced Repetition) -> Open DueReview component.
 * 2. Wrong Words items (Luyện từ hay sai) -> Open WrongWords component.
 * 3. Next uncompleted lesson of the course -> Open FlashcardQuiz with course/lesson preselected.
 * 
 * @param {string} userId - Auth user ID (null if guest)
 * @param {Array<Object>} cards - List of vocab cards loaded from database/CSV
 * @returns {Promise<Object>} Recommendation data structure
 */
export async function getStudyRecommendation(userId, cards = []) {
  // If not logged in, return Guest recommendation
  if (!userId) {
    const foundationCards = cards.filter(c => c.course === "foundation");
    const totalDays = [...new Set(foundationCards.map(c => c.day))].length || 18;
    const day1Words = foundationCards.filter(c => c.day === "1").length;

    return {
      type: "continue",
      dueCount: 0,
      wrongCount: 0,
      continueData: {
        courseCode: "foundation",
        courseName: "Khóa học Nền tảng",
        lessonId: null,
        lessonNumber: "1",
        lessonName: "Buổi 1",
        totalWords: day1Words,
        completedLessons: 0,
        totalLessons: totalDays,
        isCourseCompleted: false
      }
    };
  }

  try {
    // 1. Check Due Review count (Spaced Repetition)
    let dueCount = 0;
    try {
      dueCount = await fetchWordsToReviewTodayCount(userId);
    } catch (e) {
      console.error("Error fetching due review count:", e);
    }

    if (dueCount > 0) {
      return {
        type: "due",
        dueCount,
        wrongCount: 0,
        continueData: null
      };
    }

    // 2. Check Wrong Words count
    let wrongCount = 0;
    try {
      const { data, error } = await supabase
        .from("word_progress")
        .select("id, wrong_review_correct_streak, cleared_from_wrong_words_at")
        .eq("user_id", userId)
        .gt("wrong_count", 0);

      if (!error && data) {
        // Filter by the new definition of wrong words
        const wrongWords = data.filter(item => {
          const streak = item.wrong_review_correct_streak || 0;
          return streak < 3 && !item.cleared_from_wrong_words_at;
        });
        wrongCount = wrongWords.length;
      }
    } catch (e) {
      console.error("Error fetching wrong words count:", e);
    }

    if (wrongCount >= 3) {
      return {
        type: "wrong",
        dueCount: 0,
        wrongCount,
        continueData: null
      };
    }

    // 3. Find next lesson to continue
    // Fetch courses from Supabase
    let coursesList = [];
    try {
      const { data: dbCourses, error: coursesError } = await supabase
        .from("courses")
        .select("id, code, name")
        .order("sort_order", { ascending: true });

      if (!coursesError && dbCourses && dbCourses.length > 0) {
        coursesList = dbCourses;
      }
    } catch (e) {
      console.warn("Failed to load courses from Supabase, using default list:", e);
    }

    if (coursesList.length === 0) {
      coursesList = [
        { code: "foundation", name: "Khóa học Nền tảng" },
        { code: "toeic1", name: "Khóa học TOEIC 1" }
      ];
    }

    // Loop through courses to find the first uncompleted lesson
    let finalRecommendation = null;

    for (let i = 0; i < coursesList.length; i++) {
      const course = coursesList[i];
      const map = await fetchLessonCompletionMap(userId, course.code);

      if (!map || Object.keys(map).length === 0) {
        // Fallback for this course if completion map is empty
        const courseCards = cards.filter(c => c.course === course.code);
        if (courseCards.length > 0) {
          const totalDays = [...new Set(courseCards.map(c => c.day))].length || 18;
          const day1Words = courseCards.filter(c => c.day === "1").length;

          finalRecommendation = {
            courseCode: course.code,
            courseName: course.name,
            lessonId: null,
            lessonNumber: "1",
            lessonName: "Buổi 1",
            totalWords: day1Words,
            completedLessons: 0,
            totalLessons: totalDays,
            isCourseCompleted: false
          };
          break; // Suggest this fallback
        }
        continue;
      }

      // Filter and sort unique lessons
      const uniqueLessons = Object.values(map).filter((value, index, self) =>
        self.findIndex(v => v.lessonId === value.lessonId) === index
      );
      uniqueLessons.sort((a, b) => Number(a.day) - Number(b.day));

      const totalLessons = uniqueLessons.length;
      const completedLessons = uniqueLessons.filter(l => l.isCompleted).length;
      const nextUncompleted = uniqueLessons.find(l => !l.isCompleted);

      if (nextUncompleted) {
        finalRecommendation = {
          courseCode: course.code,
          courseName: course.name,
          lessonId: nextUncompleted.lessonId,
          lessonNumber: nextUncompleted.day,
          lessonName: nextUncompleted.title || `Buổi ${nextUncompleted.day}`,
          totalWords: nextUncompleted.totalCount,
          completedLessons,
          totalLessons,
          isCourseCompleted: false
        };
        break; // Found the first uncompleted lesson, stop here!
      } else if (totalLessons > 0 && completedLessons === totalLessons) {
        // All lessons in this course are completed!
        // We will keep this as the final recommendation in case it's the last course
        finalRecommendation = {
          courseCode: course.code,
          courseName: course.name,
          lessonId: null,
          lessonNumber: null,
          lessonName: null,
          totalWords: 0,
          completedLessons,
          totalLessons,
          isCourseCompleted: true
        };
        // Continue loop to check if next course has uncompleted lessons
      }
    }

    return {
      type: "continue",
      dueCount: 0,
      wrongCount: 0,
      continueData: finalRecommendation
    };

  } catch (error) {
    console.error("getStudyRecommendation unexpected error:", error);
    // Fallback to safe default
    return {
      type: "continue",
      dueCount: 0,
      wrongCount: 0,
      continueData: {
        courseCode: "foundation",
        courseName: "Khóa học Nền tảng",
        lessonId: null,
        lessonNumber: "1",
        lessonName: "Buổi 1",
        totalWords: 0,
        completedLessons: 0,
        totalLessons: 18,
        isCourseCompleted: false
      }
    };
  }
}
