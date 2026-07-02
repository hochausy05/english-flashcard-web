import { useEffect, useState } from "react";
import { Home } from "./components/Home.jsx";
import { FlashcardQuiz } from "./components/FlashcardQuiz.jsx";
import { VocabularyReview } from "./components/VocabularyReview.jsx";
import { ListeningPractice } from "./components/ListeningPractice.jsx";
import { AuthPanel } from "./components/AuthPanel.jsx";
import { ProgressDashboard } from "./components/ProgressDashboard.jsx";
import { DueReview } from "./components/DueReview.jsx";
import { WrongWords } from "./components/WrongWords.jsx";
import AdminVocabularyManager from "./components/AdminVocabularyManager.jsx";
import { getVocabData } from "./utils/vocabDataService.js";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState("home");
  const [initialCourse, setInitialCourse] = useState("foundation");
  const [initialLesson, setInitialLesson] = useState(null);
  const { user, profile, isAdmin, loading: authLoading } = useAuth();

  // Load vocabulary data (Supabase preferred, fallback to CSV)
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getVocabData();
      setCards(data);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu từ vựng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Combine vocabs loading and auth loading states to prevent premature render, but let admin view manage its own auth loading
  if (loading || (authLoading && currentPage !== "admin")) {
    return <main className="page"><div className="card" style={{ padding: '24px' }}>Đang tải dữ liệu...</div></main>;
  }

  if (error) {
    return <main className="page"><div className="card error">{error}</div></main>;
  }

  const layoutClass = currentPage === "admin" ? "page page--admin" : "page page--home";

  return (
    <main className={layoutClass}>
      {currentPage === "home" && (
        <Home
          cards={cards}
          user={user}
          profile={profile}
          isAdmin={isAdmin}
          onOpenFlashcard={(course, lesson) => {
            if (course) setInitialCourse(course);
            setInitialLesson(lesson || null);
            setCurrentPage("flashcard");
          }}
          onOpenVocabularyReview={(course) => {
            if (course) setInitialCourse(course);
            setCurrentPage("vocabularyReview");
          }}
          onOpenListeningPractice={(course) => {
            if (course) setInitialCourse(course);
            setCurrentPage("listeningPractice");
          }}
          onOpenAuth={() => setCurrentPage("auth")}
          onOpenProgress={() => setCurrentPage("progress")}
          onOpenWrongWords={() => setCurrentPage("wrongWords")}
          onOpenAdmin={() => setCurrentPage("admin")}
          onNavigate={setCurrentPage}
        />
      )}
      {currentPage === "flashcard" && (
        <FlashcardQuiz 
          cards={cards} 
          onBackHome={() => {
            setInitialLesson(null);
            setCurrentPage("home");
          }} 
          initialCourse={initialCourse} 
          initialLesson={initialLesson} 
        />
      )}
      {currentPage === "vocabularyReview" && (
        <VocabularyReview cards={cards} onBackHome={() => setCurrentPage("home")} initialCourse={initialCourse} />
      )}
      {currentPage === "listeningPractice" && (
        <ListeningPractice cards={cards} onBackHome={() => setCurrentPage("home")} initialCourse={initialCourse} />
      )}
      {currentPage === "auth" && (
        <AuthPanel onBackHome={() => setCurrentPage("home")} />
      )}
      {currentPage === "progress" && (
        <ProgressDashboard
          onBackHome={() => setCurrentPage("home")}
          onOpenAuth={() => setCurrentPage("auth")}
          onOpenFlashcard={(course, lesson) => {
            if (course) setInitialCourse(course);
            setInitialLesson(lesson || null);
            setCurrentPage("flashcard");
          }}
          onOpenDueReview={() => setCurrentPage("dueReview")}
          onOpenWrongWords={() => setCurrentPage("wrongWords")}
        />
      )}
      {currentPage === "dueReview" && (
        <DueReview cards={cards} onBackHome={() => setCurrentPage("home")} />
      )}
      {currentPage === "wrongWords" && (
        <WrongWords cards={cards} onBackHome={() => setCurrentPage("home")} onOpenAuth={() => setCurrentPage("auth")} />
      )}
      {currentPage === "admin" && (
        (() => {
          if (authLoading) {
            return <div className="card" style={{ padding: '24px' }}>Đang kiểm tra quyền truy cập...</div>;
          }

          if (!user || !isAdmin) {
            return (
              <div className="card error" style={{ padding: '24px', textAlign: 'center' }}>
                <h2>Bạn không có quyền truy cập</h2>
                <button className="ghost-button" style={{ marginTop: '16px' }} onClick={() => setCurrentPage("home")}>Về trang chủ</button>
              </div>
            );
          }

          return (
            <AdminVocabularyManager
              isAdmin={isAdmin}
              onBackHome={() => {
                loadData(); // Refresh list in App when returning from Admin
                setCurrentPage("home");
              }}
            />
          );
        })()
      )}
    </main>
  );
}
