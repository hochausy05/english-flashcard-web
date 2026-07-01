import { supabase } from "../lib/supabaseClient";
import { loadFlashcards } from "./loadFlashcards";

/**
 * Unified vocabulary data service.
 * Fetches vocab items from Supabase, mapping them to the standard card structure.
 * Falls back to local CSV file if Supabase fails or has no entries.
 * 
 * @returns {Promise<Array<Object>>}
 */
export async function getVocabData() {
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
        courses ( code ),
        lessons ( day )
      `);

    if (error) {
      console.warn("Error loading vocab items from Supabase, falling back to CSV:", error);
      return await loadFlashcards("/data/flashcards.csv");
    }

    if (!data || data.length === 0) {
      console.warn("No vocab items found on Supabase, falling back to CSV");
      return await loadFlashcards("/data/flashcards.csv");
    }

    // Map database results to match the CSV flashcard row format
    const mappedCards = data
      .map((row) => ({
        id: String(row.legacy_id || row.id || "").trim(),
        vocab_item_id: row.id, // Store Supabase primary key
        course: String(row.courses?.code || "foundation").trim(),
        day: String(row.lessons?.day || "1").trim(),
        word: String(row.word || "").trim(),
        pos: String(row.pos || "").trim(),
        answer: String(row.answer || "").trim(),
        ipa: String(row.ipa || "").trim(),
        example: String(row.example || "").trim(),
        audio: String(row.audio || "").trim(),
        is_active: row.is_active !== false,
      }))
      .filter((row) => row.word && row.answer && row.is_active);

    if (mappedCards.length < 4) {
      console.warn("Too few active vocab items found on Supabase (< 4), falling back to CSV");
      return await loadFlashcards("/data/flashcards.csv");
    }

    return mappedCards;
  } catch (err) {
    console.error("Unexpected error in getVocabData, falling back to CSV:", err);
    try {
      return await loadFlashcards("/data/flashcards.csv");
    } catch (csvErr) {
      throw csvErr;
    }
  }
}
