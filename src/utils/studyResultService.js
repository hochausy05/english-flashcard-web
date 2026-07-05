import { supabase } from "../lib/supabaseClient";

/**
 * Saves the results of a study session to Supabase database.
 * 
 * @param {Object} params
 * @param {Object} params.user - The current authenticated user object
 * @param {string} params.courseCode - Code of the course (e.g. 'foundation', 'toeic1')
 * @param {Array<string>} params.selectedDays - Array of day strings (e.g. ['1', '2'])
 * @param {string} params.mode - The quiz mode ('multipleChoice', 'typing', 'listening')
 * @param {number} params.totalQuestions - Total questions in this session
 * @param {number} params.correctCount - Count of correct answers
 * @param {number} params.wrongCount - Count of incorrect answers
 * @param {number} params.score - Calculated score (out of 10)
 * @param {Array<Object>} params.answersLog - Array of logged answers from play history
 * @returns {Promise<Object>} Object containing success status and error if any
 */
export async function saveStudyResultToSupabase({
  user,
  courseCode,
  selectedDays,
  mode,
  totalQuestions,
  correctCount,
  wrongCount,
  score,
  answersLog
}) {
  // 1. Logs at the very beginning
  console.log("SAVE_RESULT_START", {
    userId: user?.id,
    userEmail: user?.email,
    courseCode,
    selectedDays,
    mode,
    totalQuestions,
    correctCount,
    wrongCount,
    score,
    answersLogLength: answersLog ? answersLog.length : 0
  });

  // 2. Return skip object if user is null
  if (!user) {
    return { skipped: true, reason: "not_authenticated" };
  }

  // 3. Map mode safely
  let mappedMode = "multiple_choice";
  if (mode === "multipleChoice" || mode === "multiple_choice") {
    mappedMode = "multiple_choice";
  } else if (mode === "typing") {
    mappedMode = "typing";
  } else if (mode === "listening") {
    mappedMode = "listening";
  } else if (mode === "vietnamese_typing") {
    mappedMode = "vietnamese_typing";
  } else if (mode === "vocabulary_test") {
    mappedMode = "vocabulary_test";
  } else if (mode === "wrong_words" || mode === "wrong_review") {
    mappedMode = mode;
  } else {
    // Handling fallback mode safely, no crash
    mappedMode = "multiple_choice";
  }

  try {
    // 4. Retrieve course id
    let courseId = null;
    try {
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id")
        .eq("code", courseCode)
        .single();

      if (courseError || !course) {
        console.warn("Course not found", courseError || "Empty course data returned");
      } else {
        courseId = course.id;
      }
    } catch (err) {
      console.warn("Course not found", err);
    }

    const nowStr = new Date().toISOString();

    // 5. Construct payload for study_sessions
    const sessionPayload = {
      user_id: user.id,
      course_id: courseId,
      mode: mappedMode,
      total_questions: Number(totalQuestions || 0),
      correct_count: Number(correctCount || 0),
      wrong_count: Number(wrongCount || 0),
      score: Number(score || 0),
      finished_at: nowStr
    };

    // 6. Insert into study_sessions
    const { data: session, error: sessionError } = await supabase
      .from("study_sessions")
      .insert(sessionPayload)
      .select("id")
      .single();

    if (sessionError || !session) {
      console.error("Study session insert error:", {
        step: "insert_session",
        payload: sessionPayload,
        message: sessionError?.message,
        details: sessionError?.details,
        hint: sessionError?.hint,
        code: sessionError?.code
      });
      return { success: false, error: sessionError || new Error("Failed to insert study session") };
    }

    console.log("Study session inserted successfully: ID =", session.id);

    // 7. Proceed with lesson mappings (non-blocking)
    try {
      if (courseId && selectedDays && selectedDays.length > 0) {
        const { data: lessons, error: lessonsError } = await supabase
          .from("lessons")
          .select("*")
          .eq("course_id", courseId);

        if (lessons && !lessonsError) {
          const lessonMap = {};
          lessons.forEach(l => {
            const dayVal = l.day ?? l.lesson_number ?? l.code ?? l.name ?? l.title;
            if (dayVal !== undefined && dayVal !== null) {
              lessonMap[String(dayVal).trim()] = l.id;
            }
          });

          const sslRows = selectedDays
            .map(day => {
              const lessonId = lessonMap[String(day).trim()];
              if (!lessonId) return null;
              return {
                session_id: session.id,
                lesson_id: lessonId
              };
            })
            .filter(Boolean);

          if (sslRows.length > 0) {
            const { error: sslError } = await supabase
              .from("study_session_lessons")
              .insert(sslRows);
            if (sslError) {
              console.error("Error inserting study_session_lessons (non-blocking):", sslError);
            }
          }
        }
      }
    } catch (lessonsErr) {
      console.error("Error mapping lessons (non-blocking):", lessonsErr);
    }

    // 8. Process study answers & word progress updates (non-blocking)
    try {
      let vocabMap = {};
      if (courseId) {
        const { data: vocabItems } = await supabase
          .from("vocab_items")
          .select("id, legacy_id, word")
          .eq("course_id", courseId);

        if (vocabItems) {
          vocabItems.forEach(item => {
            if (item.legacy_id !== undefined && item.legacy_id !== null) {
              vocabMap[`id_${item.legacy_id}`] = item.id;
            }
            if (item.word) {
              vocabMap[`word_${item.word.toLowerCase().trim()}`] = item.id;
            }
          });
        }
      }

      // Fallback: Query by word list from log
      const words = [...new Set(answersLog.map(item => item.word).filter(Boolean))];
      if (words.length > 0) {
        const { data: backupVocabs } = await supabase
          .from("vocab_items")
          .select("id, legacy_id, word")
          .in("word", words);
        
        if (backupVocabs) {
          backupVocabs.forEach(item => {
            if (item.legacy_id !== undefined && item.legacy_id !== null) {
              vocabMap[`id_${item.legacy_id}`] = item.id;
            }
            if (item.word) {
              vocabMap[`word_${item.word.toLowerCase().trim()}`] = item.id;
            }
          });
        }
      }

      const answerRows = [];
      const progressUpdates = [];

      answersLog.forEach((item, index) => {
        let vocabItemId = item.vocab_item_id || item.vocabItemId || null;
        if (!vocabItemId) {
          if (item.id) {
            vocabItemId = vocabMap[`id_${item.id}`];
          }
          if (!vocabItemId && item.word) {
            vocabItemId = vocabMap[`word_${item.word.toLowerCase().trim()}`];
          }
        }

        if (!vocabItemId) return;

        let promptText = "";
        let userAnswer = "";
        let correctAnswer = "";

        if (mappedMode === "multiple_choice") {
          promptText = item.word || "";
          userAnswer = item.selectedAnswer || "";
          correctAnswer = item.correctAnswer || "";
        } else if (mappedMode === "typing") {
          promptText = item.answer || "";
          userAnswer = item.typedAnswer || "";
          correctAnswer = item.word || "";
        } else if (mappedMode === "listening") {
          promptText = "listening";
          userAnswer = item.typedAnswer || item.selectedAnswer || "";
          correctAnswer = item.word || "";
        } else if (mappedMode === "vietnamese_typing" || mappedMode === "vocabulary_test") {
          promptText = item.word || "";
          userAnswer = item.typedAnswer || "";
          correctAnswer = item.answer || item.correctAnswer || "";
        } else {
          promptText = item.word || "";
          userAnswer = item.typedAnswer || item.selectedAnswer || "";
          correctAnswer = item.correctAnswer || item.word || "";
        }

        answerRows.push({
          session_id: session.id,
          user_id: user.id,
          vocab_item_id: vocabItemId,
          mode: mappedMode,
          question_order: index + 1,
          prompt_text: promptText,
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          is_correct: !!item.isCorrect
        });

        progressUpdates.push({
          vocabItemId,
          isCorrect: !!item.isCorrect
        });
      });

      if (answerRows.length > 0) {
        const { error: answersError } = await supabase
          .from("study_answers")
          .insert(answerRows);
        if (answersError) {
          console.error("Error inserting study_answers (non-blocking):", answersError);
        }
      }

      if (progressUpdates.length > 0) {
        const uniqueVocabItemIds = [...new Set(progressUpdates.map(p => p.vocabItemId))];

        const { data: existingProgress } = await supabase
          .from("word_progress")
          .select("*")
          .eq("user_id", user.id)
          .in("vocab_item_id", uniqueVocabItemIds);

        const progressMap = {};
        if (existingProgress) {
          existingProgress.forEach(row => {
            progressMap[row.vocab_item_id] = row;
          });
        }

        const upsertRows = [];

        progressUpdates.forEach(update => {
          const existing = progressMap[update.vocabItemId];
          let correctCount = existing?.correct_count || 0;
          let wrongCount = existing?.wrong_count || 0;
          let correctStreak = existing?.correct_streak || 0;
          let masteryLevel = existing?.mastery_level || 0;

          if (update.isCorrect) {
            correctCount += 1;
            correctStreak += 1;
            masteryLevel = Math.min(5, masteryLevel + 1);
          } else {
            wrongCount += 1;
            correctStreak = 0;
            masteryLevel = Math.max(0, masteryLevel - 1);
          }

          const isMastered = masteryLevel >= 4;

          const nextReviewDate = new Date();
          if (correctStreak === 0) {
            // remains now
          } else if (correctStreak === 1) {
            nextReviewDate.setDate(nextReviewDate.getDate() + 1);
          } else if (correctStreak === 2) {
            nextReviewDate.setDate(nextReviewDate.getDate() + 3);
          } else if (correctStreak === 3) {
            nextReviewDate.setDate(nextReviewDate.getDate() + 7);
          } else {
            nextReviewDate.setDate(nextReviewDate.getDate() + 14);
          }

          // Recovery Progress columns for Wrong Words review
          let wrongReviewCorrectStreak = existing?.wrong_review_correct_streak || 0;
          let clearedFromWrongWordsAt = existing?.cleared_from_wrong_words_at || null;
          let lastWrongReviewedAt = existing?.last_wrong_reviewed_at || null;
          let lastWrongAt = existing?.last_wrong_at || null;

          const isWrongWordsSession = (mappedMode === "wrong_words" || mappedMode === "wrong_review");

          if (isWrongWordsSession) {
            lastWrongReviewedAt = nowStr;
            if (update.isCorrect) {
              wrongReviewCorrectStreak += 1;
              if (wrongReviewCorrectStreak >= 3) {
                clearedFromWrongWordsAt = nowStr;
              }
            } else {
              wrongReviewCorrectStreak = 0;
              clearedFromWrongWordsAt = null;
              lastWrongAt = nowStr;
            }
          } else {
            // In standard quiz sessions, wrong answers put the word back into the wrong words list
            if (!update.isCorrect) {
              wrongReviewCorrectStreak = 0;
              clearedFromWrongWordsAt = null;
              lastWrongAt = nowStr;
            }
          }

          const rowToUpsert = {
            user_id: user.id,
            vocab_item_id: update.vocabItemId,
            correct_count: correctCount,
            wrong_count: wrongCount,
            correct_streak: correctStreak,
            mastery_level: masteryLevel,
            is_mastered: isMastered,
            last_reviewed_at: nowStr,
            next_review_at: nextReviewDate.toISOString(),
            wrong_review_correct_streak: wrongReviewCorrectStreak,
            last_wrong_reviewed_at: lastWrongReviewedAt,
            cleared_from_wrong_words_at: clearedFromWrongWordsAt,
            last_wrong_at: lastWrongAt
          };

          if (existing?.id) {
            rowToUpsert.id = existing.id;
          }

          upsertRows.push(rowToUpsert);
        });

        if (upsertRows.length > 0) {
          const { error: upsertError } = await supabase
            .from("word_progress")
            .upsert(upsertRows);
          if (upsertError) {
            console.error("Error upserting word_progress (non-blocking):", upsertError);
          }
        }
      }
    } catch (answersAndProgressErr) {
      console.error("Error saving answers/progress (non-blocking):", answersAndProgressErr);
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in saveStudyResultToSupabase:", error);
    return { success: false, error };
  }
}
