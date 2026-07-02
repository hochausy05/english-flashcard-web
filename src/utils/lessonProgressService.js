import { supabase } from "../lib/supabaseClient";

/**
 * Fetches the completion status for each lesson/day of a course for a specific user.
 * 
 * @param {string} userId - The authenticated user's ID
 * @param {string} courseCode - Code of the course (e.g. 'foundation', 'toeic1')
 * @returns {Promise<Object>} Map of completion status by lessonId and day string
 */
export async function fetchLessonCompletionMap(userId, courseCode) {
  if (!userId || !courseCode) {
    return {};
  }

  try {
    // 1. Get course ID
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("code", courseCode)
      .single();

    if (courseError || !course) {
      console.warn("fetchLessonCompletionMap: course not found", courseError);
      return {};
    }
    const courseId = course.id;

    // 2. Fetch all lessons for this course
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, day, title")
      .eq("course_id", courseId);

    if (lessonsError || !lessons) {
      console.warn("fetchLessonCompletionMap: lessons not found", lessonsError);
      return {};
    }

    // 3. Fetch active vocab items for this course
    const { data: vocabItems, error: vocabError } = await supabase
      .from("vocab_items")
      .select("id, lesson_id")
      .eq("course_id", courseId)
      .eq("is_active", true);

    if (vocabError || !vocabItems || vocabItems.length === 0) {
      console.warn("fetchLessonCompletionMap: no active vocab items", vocabError);
      return {};
    }

    // Map: vocab_item_id -> lesson_id
    const vocabToLessonMap = {};
    // Map: lesson_id -> Set of active vocab_item_ids
    const lessonVocabIds = {};

    lessons.forEach(l => {
      lessonVocabIds[l.id] = new Set();
    });

    vocabItems.forEach(item => {
      if (item.lesson_id && lessonVocabIds[item.lesson_id]) {
        lessonVocabIds[item.lesson_id].add(item.id);
        vocabToLessonMap[item.id] = item.lesson_id;
      }
    });

    // 4. Fetch user's study sessions to get finished_at dates
    const { data: sessions, error: sessionsError } = await supabase
      .from("study_sessions")
      .select("id, finished_at")
      .eq("user_id", userId);

    const sessionFinishedAtMap = {};
    if (sessions && !sessionsError) {
      sessions.forEach(s => {
        sessionFinishedAtMap[s.id] = s.finished_at;
      });
    }

    // 5. Fetch user's study answers for the course's active vocab items
    const vocabIds = vocabItems.map(v => v.id);
    const { data: answers, error: answersError } = await supabase
      .from("study_answers")
      .select("session_id, vocab_item_id, is_correct")
      .eq("user_id", userId)
      .in("vocab_item_id", vocabIds);

    if (answersError || !answers) {
      console.warn("fetchLessonCompletionMap: error loading study answers or empty", answersError);
      // If error or no answers, we still return default states
      return buildDefaultMap(lessons, lessonVocabIds);
    }

    // Group answers by session_id and lesson_id
    // sessionLessonAnswers[sessionId][lessonId] = { correct: Set, incorrect: Set }
    const sessionLessonAnswers = {};

    answers.forEach(ans => {
      const lessonId = vocabToLessonMap[ans.vocab_item_id];
      if (!lessonId) return;

      const sessionId = ans.session_id;
      if (!sessionLessonAnswers[sessionId]) {
        sessionLessonAnswers[sessionId] = {};
      }
      if (!sessionLessonAnswers[sessionId][lessonId]) {
        sessionLessonAnswers[sessionId][lessonId] = {
          correct: new Set(),
          incorrect: new Set()
        };
      }

      if (ans.is_correct) {
        sessionLessonAnswers[sessionId][lessonId].correct.add(ans.vocab_item_id);
      } else {
        sessionLessonAnswers[sessionId][lessonId].incorrect.add(ans.vocab_item_id);
      }
    });

    // 6. Calculate completion map
    const completionMap = {};

    lessons.forEach(l => {
      const activeVocabIds = lessonVocabIds[l.id] || new Set();
      const totalCount = activeVocabIds.size;

      // Default state for this lesson
      const defaultState = {
        lessonId: l.id,
        day: String(l.day),
        title: l.title,
        isCompleted: false,
        bestAccuracy: 0,
        correctCount: 0,
        totalCount: totalCount,
        lastCompletedAt: null
      };

      completionMap[l.id] = { ...defaultState };
      completionMap[String(l.day)] = completionMap[l.id]; // Reference mapping
    });

    // Evaluate sessions to find the best accuracy and check completion
    Object.keys(sessionLessonAnswers).forEach(sessionId => {
      const finishedAt = sessionFinishedAtMap[sessionId] || null;
      const lessonsInSession = sessionLessonAnswers[sessionId];

      Object.keys(lessonsInSession).forEach(lessonId => {
        const stats = lessonsInSession[lessonId];
        const status = completionMap[lessonId];
        if (!status) return;

        const totalVocabInLesson = status.totalCount;
        if (totalVocabInLesson === 0) return;

        const correctCount = stats.correct.size;
        const incorrectCount = stats.incorrect.size;

        const accuracy = Math.round((correctCount / totalVocabInLesson) * 100);

        const isSessionCompleted = (correctCount === totalVocabInLesson && incorrectCount === 0);

        // Update best accuracy
        if (accuracy > status.bestAccuracy) {
          status.bestAccuracy = accuracy;
          status.correctCount = correctCount;
        } else if (accuracy === status.bestAccuracy && correctCount > status.correctCount) {
          status.correctCount = correctCount;
        }

        if (isSessionCompleted) {
          status.isCompleted = true;
          if (finishedAt) {
            if (!status.lastCompletedAt || new Date(finishedAt) > new Date(status.lastCompletedAt)) {
              status.lastCompletedAt = finishedAt;
            }
          }
        }
      });
    });

    return completionMap;
  } catch (error) {
    console.error("fetchLessonCompletionMap: unexpected error", error);
    return {};
  }
}

function buildDefaultMap(lessons, lessonVocabIds) {
  const completionMap = {};
  lessons.forEach(l => {
    const totalCount = (lessonVocabIds[l.id] || new Set()).size;
    completionMap[l.id] = {
      lessonId: l.id,
      day: String(l.day),
      title: l.title,
      isCompleted: false,
      bestAccuracy: 0,
      correctCount: 0,
      totalCount: totalCount,
      lastCompletedAt: null
    };
    completionMap[String(l.day)] = completionMap[l.id];
  });
  return completionMap;
}
