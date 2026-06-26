import Papa from "papaparse";

export async function loadFlashcards(csvPath) {
  const response = await fetch(csvPath);

  if (!response.ok) {
    throw new Error(`Không tìm thấy file CSV: ${csvPath}`);
  }

  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data
          .map((row) => ({
            id: String(row.id || "").trim(),
            course: String(row.course || "foundation").trim(),
            day: String(row.day || "1").trim(),
            word: String(row.word || "").trim(),
            pos: String(row.pos || "").trim(),
            answer: String(row.answer || "").trim(),
            ipa: String(row.ipa || "").trim(),
            example: String(row.example || "").trim(),
            audio: String(row.audio || "").trim(),
          }))
          .filter((row) => row.word && row.answer);

        if (rows.length < 4) {
          reject(new Error("CSV cần ít nhất 4 dòng có word và answer để tạo 4 đáp án."));
          return;
        }

        resolve(rows);
      },
      error: (error) => reject(error),
    });
  });
}
