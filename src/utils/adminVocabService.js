import { supabase } from "../lib/supabaseClient";

/**
 * Fetches all courses and lessons for selector inputs.
 */
export async function fetchCoursesAndLessons() {
  try {
    const { data: courses, error: errC } = await supabase
      .from("courses")
      .select("*")
      .order("sort_order", { ascending: true });

    if (errC) throw errC;

    const { data: lessons, error: errL } = await supabase
      .from("lessons")
      .select("*")
      .order("sort_order", { ascending: true });

    if (errL) throw errL;

    return { courses: courses || [], lessons: lessons || [] };
  } catch (err) {
    console.error("Error in fetchCoursesAndLessons:", err);
    throw err;
  }
}

/**
 * Fetches the list of all vocab items including inactive ones for the admin dashboard.
 */
export async function fetchAdminVocabList() {
  try {
    const { data, error } = await supabase
      .from("vocab_items")
      .select(`
        id,
        legacy_id,
        word,
        pos,
        answer,
        ipa,
        example,
        audio,
        is_active,
        course_id,
        lesson_id,
        courses ( code, name ),
        lessons ( day, title )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error("Error in fetchAdminVocabList:", err);
    throw err;
  }
}

/**
 * Helper to retrieve or create a lesson ID for a given course and day.
 */
async function getOrCreateLessonId(courseId, dayNumber, cachedLessons) {
  const day = Number(dayNumber);
  // Look in cache
  const existing = cachedLessons.find(l => l.course_id === courseId && Number(l.day) === day);
  if (existing) return existing.id;

  // Insert to DB
  const { data, error } = await supabase
    .from("lessons")
    .insert({
      course_id: courseId,
      day: day,
      title: `Buổi ${day}`,
      sort_order: day,
      is_active: true
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error || new Error(`Failed to create lesson for day ${day}`);
  }

  // Add to cache list
  cachedLessons.push({ id: data.id, course_id: courseId, day: day });
  return data.id;
}

/**
 * Creates a new vocab item.
 */
export async function createVocabItem(item) {
  try {
    const { courses, lessons } = await fetchCoursesAndLessons();
    const course = courses.find(c => c.code === item.courseCode);
    if (!course) throw new Error(`Không tìm thấy khóa học với mã: ${item.courseCode}`);

    const lessonId = await getOrCreateLessonId(course.id, item.day, lessons);

    // Get max legacy_id to assign to this new item
    const { data: maxLegacy } = await supabase
      .from("vocab_items")
      .select("legacy_id")
      .order("legacy_id", { ascending: false })
      .limit(1);
    const nextLegacyId = maxLegacy && maxLegacy.length > 0 ? (maxLegacy[0].legacy_id || 0) + 1 : 1;

    const payload = {
      course_id: course.id,
      lesson_id: lessonId,
      legacy_id: nextLegacyId,
      word: String(item.word || "").trim(),
      pos: String(item.pos || "").trim(),
      answer: String(item.answer || "").trim(),
      ipa: String(item.ipa || "").trim(),
      example: String(item.example || "").trim(),
      audio: String(item.audio || "").trim(),
      is_active: item.is_active !== false,
      sort_order: nextLegacyId
    };

    const { data, error } = await supabase
      .from("vocab_items")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("Error in createVocabItem:", err);
    return { success: false, error: err };
  }
}

/**
 * Updates an existing vocab item.
 */
export async function updateVocabItem(id, updates) {
  try {
    const { courses, lessons } = await fetchCoursesAndLessons();
    const course = courses.find(c => c.code === updates.courseCode);
    if (!course) throw new Error(`Không tìm thấy khóa học với mã: ${updates.courseCode}`);

    const lessonId = await getOrCreateLessonId(course.id, updates.day, lessons);

    const payload = {
      course_id: course.id,
      lesson_id: lessonId,
      word: String(updates.word || "").trim(),
      pos: String(updates.pos || "").trim(),
      answer: String(updates.answer || "").trim(),
      ipa: String(updates.ipa || "").trim(),
      example: String(updates.example || "").trim(),
      audio: String(updates.audio || "").trim(),
      is_active: updates.is_active !== false,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("vocab_items")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("Error in updateVocabItem:", err);
    return { success: false, error: err };
  }
}

/**
 * Deletes or hides a vocab item.
 */
export async function deleteVocabItem(id, softDelete = true) {
  try {
    if (softDelete) {
      // Soft Delete: update is_active to false
      const { data, error } = await supabase
        .from("vocab_items")
        .update({ is_active: false })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return { success: true, mode: "soft", data };
    }

    // Hard Delete checks: verify related student records
    const { data: answers, error: errA } = await supabase
      .from("study_answers")
      .select("id")
      .eq("vocab_item_id", id)
      .limit(1);
    if (errA) throw errA;

    const { data: progress, error: errP } = await supabase
      .from("word_progress")
      .select("id")
      .eq("vocab_item_id", id)
      .limit(1);
    if (errP) throw errP;

    if ((answers && answers.length > 0) || (progress && progress.length > 0)) {
      throw new Error("Từ vựng này đã có dữ liệu học tập liên quan (Study Answers / Word Progress). Không thể xóa cứng! Hãy chọn Ẩn (Soft Delete).");
    }

    const { error } = await supabase
      .from("vocab_items")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true, mode: "hard" };
  } catch (err) {
    console.error("Error in deleteVocabItem:", err);
    return { success: false, error: err };
  }
}

/**
 * Saves raw CSV data and upserts vocabulary items.
 */
export async function importCSVVocab(rows, rawString = "") {
  try {
    // 1. Log to raw import table
    const { data: currentUser } = await supabase.auth.getUser();
    await supabase.from("vocab_import_raw").insert({
      filename: `import_${new Date().toISOString().slice(0, 10)}.csv`,
      raw_content: rawString || JSON.stringify(rows),
      status: "processing",
      imported_by: currentUser?.user?.id || null
    });

    const { courses, lessons } = await fetchCoursesAndLessons();
    const courseMap = {};
    courses.forEach(c => { courseMap[c.code] = c.id; });

    // Fetch existing vocab to check for duplicates by (course_id, word)
    const { data: existingVocab } = await supabase
      .from("vocab_items")
      .select("id, word, course_id, legacy_id");

    const existingMap = {};
    if (existingVocab) {
      existingVocab.forEach(item => {
        const key = `${item.course_id}_${item.word.toLowerCase().trim()}`;
        existingMap[key] = item;
      });
    }

    // Get max legacy_id to fallback on if row is missing ID or for new items
    let maxLegacyId = 0;
    if (existingVocab) {
      maxLegacyId = existingVocab.reduce((max, item) => Math.max(max, item.legacy_id || 0), 0);
    }

    const cachedLessons = [...lessons];
    const successRows = [];
    const errorRows = [];

    // Process row by row to support dynamic lesson inserts and proper logging
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const courseCode = String(row.course || "foundation").trim().toLowerCase();
        let courseId = courseMap[courseCode];

        if (!courseId) {
          // If course code doesn't exist, dynamically map to first course or create it?
          // We default to foundation course
          courseId = courseMap["foundation"];
          if (!courseId) {
            throw new Error(`Course code '${courseCode}' not found and 'foundation' fallback missing.`);
          }
        }

        const dayVal = String(row.day || "1").trim();
        const lessonId = await getOrCreateLessonId(courseId, dayVal, cachedLessons);

        const word = String(row.word || "").trim();
        if (!word) throw new Error("Cột 'word' không được trống");

        const answer = String(row.answer || "").trim();
        if (!answer) throw new Error("Cột 'answer' không được trống");

        const legacyId = row.id ? Number(row.id) : ++maxLegacyId;

        const payload = {
          course_id: courseId,
          lesson_id: lessonId,
          legacy_id: legacyId,
          word: word,
          pos: String(row.pos || "").trim(),
          answer: answer,
          ipa: String(row.ipa || "").trim(),
          example: String(row.example || "").trim(),
          audio: String(row.audio || "").trim(),
          is_active: true,
          sort_order: legacyId,
          updated_at: new Date().toISOString()
        };

        const key = `${courseId}_${word.toLowerCase()}`;
        const existingItem = existingMap[key];

        if (existingItem) {
          // Update
          const { error: updErr } = await supabase
            .from("vocab_items")
            .update(payload)
            .eq("id", existingItem.id);
          if (updErr) throw updErr;
        } else {
          // Insert
          const { error: insErr } = await supabase
            .from("vocab_items")
            .insert(payload);
          if (insErr) throw insErr;
        }

        successRows.push(row);
      } catch (rowErr) {
        errorRows.push({
          row: i + 1,
          data: row,
          error: rowErr.message || "Lỗi không xác định"
        });
      }
    }

    // Update raw status
    await supabase
      .from("vocab_import_raw")
      .update({ status: errorRows.length === 0 ? "success" : "partial_success" })
      .eq("filename", `import_${new Date().toISOString().slice(0, 10)}.csv`);

    return {
      success: true,
      totalProcessed: rows.length,
      importedCount: successRows.length,
      failedCount: errorRows.length,
      errors: errorRows
    };
  } catch (err) {
    console.error("Error in importCSVVocab:", err);
    return { success: false, error: err };
  }
}
