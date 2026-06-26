import { useEffect, useState } from "react";
import { Home } from "./components/Home.jsx";
import { FlashcardQuiz } from "./components/FlashcardQuiz.jsx";
import { VocabularyReview } from "./components/VocabularyReview.jsx";
import { loadFlashcards } from "./utils/loadFlashcards.js";

export default function App() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState("home");
  const [initialCourse, setInitialCourse] = useState("foundation");

  useEffect(() => {
    async function init() {
      try {
        const data = await loadFlashcards("/data/flashcards.csv");
        setCards(data);
      } catch (err) {
        setError(err.message || "Không thể tải dữ liệu CSV");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  if (loading) {
    return <main className="page"><div className="card" style={{ padding: '24px' }}>Đang tải flashcards...</div></main>;
  }

  if (error) {
    return <main className="page"><div className="card error">{error}</div></main>;
  }

  return (
    <main className="page">
      {currentPage === "home" && (
        <Home
          cards={cards}
          onOpenFlashcard={(course) => {
            if (course) setInitialCourse(course);
            setCurrentPage("flashcard");
          }}
          onOpenVocabularyReview={(course) => {
            if (course) setInitialCourse(course);
            setCurrentPage("vocabularyReview");
          }}
        />
      )}
      {currentPage === "flashcard" && (
        <FlashcardQuiz cards={cards} onBackHome={() => setCurrentPage("home")} initialCourse={initialCourse} />
      )}
      {currentPage === "vocabularyReview" && (
        <VocabularyReview cards={cards} onBackHome={() => setCurrentPage("home")} initialCourse={initialCourse} />
      )}
    </main>
  );
}
