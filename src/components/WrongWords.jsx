import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX, CheckCircle2, XCircle, ArrowLeft, Play, Award, RefreshCw, X, Eye, HelpCircle, LogIn, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchWrongWords } from "../utils/wrongWordsService.js";
import { createQuestion } from "../utils/createQuestion.js";
import { speakWord } from "../utils/speech.js";
import { playFeedbackSound } from "../utils/feedbackSound.js";
import { saveStudyResultToSupabase } from "../utils/studyResultService.js";

// Helper to shuffle array
function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper to normalize input answer
function normalizeTypingAnswer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ");
}

// Helper to mask word in example
function maskWordInExample(example, word) {
  if (!example || !word) return example || "";
  const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`\\b${escapedWord}\\b`, "gi");
  let masked = example.replace(regex, "___");
  if (masked === example) {
    const fallbackRegex = new RegExp(escapedWord, "gi");
    masked = example.replace(fallbackRegex, "___");
  }
  return masked;
}

// Format date/time
function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function WrongWords({ cards, onBackHome, onOpenAuth }) {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [wrongWordsList, setWrongWordsList] = useState([]);
  const [quizStatus, setQuizStatus] = useState("listing"); // "listing" | "selecting_mode" | "playing" | "finished"
  const [questionQueue, setQuestionQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersLog, setAnswersLog] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle"); // "idle" | "saving" | "success" | "error"
  const [saveErrorMsg, setSaveErrorMsg] = useState("");
  const hasSavedRef = useRef(false);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("flashcard_feedback_sound_enabled");
    return saved !== null ? saved === "true" : true;
  });

  const [quizMode, setQuizMode] = useState("multipleChoice"); // "multipleChoice" | "typing"
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isAnsweredState, setIsAnsweredState] = useState(false);
  const inputRef = useRef(null);
  const autoNextTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
    };
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("flashcard_feedback_sound_enabled", String(next));
      return next;
    });
  };

  // Load wrong words from service
  const loadWrongWords = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const dbProgress = await fetchWrongWords(user.id);
      
      const mapped = dbProgress.map(item => {
        const dbVocab = item.vocab_items || {};
        // Match with local CSV cards to retrieve correct example, audio, pos, etc. if missing in DB
        const csvCard = cards.find(
          c => c.id === String(dbVocab.legacy_id) || 
               c.word.toLowerCase() === dbVocab.word?.toLowerCase()
        ) || {};

        return {
          id: dbVocab.legacy_id || csvCard.id || dbVocab.id,
          course: dbVocab.course_id ? (dbVocab.course_id === "922d185c-68b2-47cf-b9cf-0fe921e17892" ? "foundation" : "toeic1") : (csvCard.course || "foundation"),
          day: String(dbVocab.day || csvCard.day || "1"),
          word: dbVocab.word || csvCard.word || "",
          pos: dbVocab.pos || csvCard.pos || "",
          answer: dbVocab.answer || csvCard.answer || "",
          ipa: dbVocab.ipa || csvCard.ipa || "",
          example: dbVocab.example || csvCard.example || "",
          audio: dbVocab.audio || csvCard.audio || "",
          vocab_item_id: dbVocab.id,
          wrongCount: item.wrong_count || 0,
          wrong_review_correct_streak: item.wrong_review_correct_streak || 0,
          last_wrong_reviewed_at: item.last_wrong_reviewed_at || null,
          lastReviewedAt: item.last_reviewed_at
        };
      }).filter(item => item.word && item.answer);

      setWrongWordsList(mapped);
    } catch (err) {
      console.error("Error loading wrong words:", err);
    } finally {
      setLoading(false);
    }
  }, [user, cards]);

  useEffect(() => {
    loadWrongWords();
  }, [loadWrongWords]);

  // Autofocus input in typing mode
  useEffect(() => {
    if (quizStatus === "playing" && quizMode === "typing" && inputRef.current) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [currentIndex, quizStatus, quizMode]);

  const isAnswered = quizMode === "multipleChoice" ? selectedAnswer !== null : isAnsweredState;

  const currentQuestion = useMemo(() => {
    if (questionQueue.length === 0 || currentIndex >= questionQueue.length) {
      return null;
    }
    return questionQueue[currentIndex];
  }, [questionQueue, currentIndex]);

  const correctCount = useMemo(() => {
    return answersLog.filter((item) => item.isCorrect).length;
  }, [answersLog]);

  const incorrectAnswers = useMemo(() => {
    return answersLog.filter((item) => !item.isCorrect);
  }, [answersLog]);

  const score10 = useMemo(() => {
    if (questionQueue.length === 0) return 0;
    const raw = (correctCount / questionQueue.length) * 10;
    return Number(raw.toFixed(1));
  }, [correctCount, questionQueue]);

  const clearedWordsCount = useMemo(() => {
    let count = 0;
    answersLog.forEach(log => {
      const q = questionQueue.find(item => item.id === log.id);
      if (q && log.isCorrect) {
        const initialStreak = q.wrong_review_correct_streak || 0;
        if (initialStreak + 1 >= 3) {
          count++;
        }
      }
    });
    return count;
  }, [answersLog, questionQueue]);

  // Save study result when finished
  useEffect(() => {
    if (quizStatus === "finished") {
      if (hasSavedRef.current) return;
      hasSavedRef.current = true;

      async function saveResult() {
        setSaveStatus("saving");
        const courseCode = questionQueue[0]?.course || "foundation";

        const res = await saveStudyResultToSupabase({
          user,
          courseCode,
          selectedDays: [...new Set(questionQueue.map(q => q.day))],
          mode: "wrong_words", // Identify session as wrong words review
          totalQuestions: questionQueue.length,
          correctCount: correctCount,
          wrongCount: questionQueue.length - correctCount,
          score: score10,
          answersLog
        });

        if (res.success) {
          setSaveStatus("success");
          setSaveErrorMsg("");
          loadWrongWords(); // Reload list to update local state immediately
        } else {
          setSaveStatus("error");
          setSaveErrorMsg(res.error?.message || "Lỗi không xác định");
        }
      }

      saveResult();
    } else {
      hasSavedRef.current = false;
      setSaveStatus("idle");
      setSaveErrorMsg("");
    }
  }, [quizStatus, user, questionQueue, correctCount, score10, answersLog]);

  function handleStartReviewSelecting() {
    setQuizStatus("selecting_mode");
  }

  function handleStartReviewGameplay() {
    if (wrongWordsList.length < 3) return;

    // Limit to top 20 wrong words
    const wordsToReview = wrongWordsList.slice(0, 20);

    // Shuffle wrong cards
    const shuffled = shuffle(wordsToReview);

    // Create options for multiple choice using the subset
    const queue = shuffled.map((card) => {
      return createQuestion(card, wordsToReview, cards);
    });

    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
    }

    setQuestionQueue(queue);
    setCurrentIndex(0);
    setAnswersLog([]);
    setSelectedAnswer(null);
    setTypedAnswer("");
    setIsAnsweredState(false);
    setQuizStatus("playing");
  }

  function handleSelect(option) {
    if (isAnswered) return;

    setSelectedAnswer(option);
    const isCorrect = option === currentQuestion.answer;

    if (soundEnabled) {
      playFeedbackSound(isCorrect);
    }

    setAnswersLog((prev) => [
      ...prev,
      {
        id: currentQuestion.id,
        vocab_item_id: currentQuestion.vocab_item_id, // Pass Supabase primary key
        word: currentQuestion.word,
        correctAnswer: currentQuestion.answer,
        selectedAnswer: option,
        isCorrect: isCorrect,
        ipa: currentQuestion.ipa,
        pos: currentQuestion.pos,
        example: currentQuestion.example,
        audio: currentQuestion.audio,
        mode: "multipleChoice",
      },
    ]);

    // Auto next on correct
    if (isCorrect) {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
      autoNextTimerRef.current = setTimeout(() => {
        handleNext();
      }, 900); // AUTO_NEXT_DELAY_MS = 900
    }
  }

  function handleCheckAnswer() {
    if (isAnswered) return;

    const trimmed = typedAnswer.trim();
    const normalizedUser = normalizeTypingAnswer(trimmed);
    const normalizedCorrect = normalizeTypingAnswer(currentQuestion.word);
    const isCorrect = normalizedUser === normalizedCorrect;

    if (soundEnabled) {
      playFeedbackSound(isCorrect);
    }

    setIsAnsweredState(true);

    setAnswersLog((prev) => [
      ...prev,
      {
        id: currentQuestion.id,
        vocab_item_id: currentQuestion.vocab_item_id, // Pass Supabase primary key
        word: currentQuestion.word,
        pos: currentQuestion.pos,
        answer: currentQuestion.answer,
        ipa: currentQuestion.ipa,
        example: currentQuestion.example,
        typedAnswer: trimmed,
        correctAnswer: currentQuestion.word,
        isCorrect: isCorrect,
        audio: currentQuestion.audio,
        mode: "typing",
      },
    ]);
  }

  function handleNext() {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
    }
    if (currentIndex + 1 >= questionQueue.length) {
      setQuizStatus("finished");
    } else {
      setSelectedAnswer(null);
      setTypedAnswer("");
      setIsAnsweredState(false);
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function handleBack() {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
    }
    if (quizStatus === "selecting_mode" || quizStatus === "playing") {
      if (quizStatus === "playing") {
        if (!confirm("Bạn có chắc muốn dừng ôn tập và quay lại danh sách không?")) {
          return;
        }
      }
      setQuizStatus("listing");
      loadWrongWords();
    } else if (quizStatus === "finished") {
      setQuizStatus("listing");
      loadWrongWords();
    } else {
      onBackHome();
    }
  }

  // --- RENDERING VIEWS ---

  if (!user) {
    return (
      <div className="quiz-flow-container">
        <nav className="back-nav">
          <button className="ghost-button" onClick={onBackHome}>
            <ArrowLeft size={16} /> Trang chủ
          </button>
        </nav>
        <div className="progress-login-prompt">
          <div className="progress-login-prompt-icon" style={{ background: "rgba(240, 68, 56, 0.08)", color: "#f04438" }}>
            <XCircle size={48} />
          </div>
          <h2>Từ hay trả lời sai</h2>
          <p>
            Đăng nhập để theo dõi danh sách các từ vựng bạn hay làm sai, nghe phát âm và tiến hành ôn tập tập trung.
          </p>
          <button className="cta-button primary" onClick={onOpenAuth} style={{ background: "linear-gradient(135deg, #f04438, #d93025)" }}>
            <LogIn size={18} /> Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="quiz-flow-container">
        <nav className="back-nav">
          <button className="ghost-button" onClick={onBackHome}>
            <ArrowLeft size={16} /> Trang chủ
          </button>
        </nav>
        <div className="progress-loading">
          <div className="progress-loading-spinner"></div>
          <p>Đang tải danh sách từ hay sai...</p>
        </div>
      </div>
    );
  }

  // 1. LISTING WRONG WORDS SCREEN
  if (quizStatus === "listing") {
    return (
      <div className="quiz-flow-container">
        <nav className="back-nav">
          <button className="ghost-button" onClick={handleBack}>
            <ArrowLeft size={16} /> Trang chủ
          </button>
        </nav>

        <section className="progress-header" style={{ textAlign: "center", marginBottom: "24px" }}>
          <div className="eyebrow-badge-wrapper">
            <span className="eyebrow-badge" style={{ background: "rgba(240, 68, 56, 0.08)", color: "#f04438" }}>
              <XCircle size={12} className="eyebrow-icon" />
              WRONG WORDS
            </span>
          </div>
          <h1 className="progress-title">Từ hay trả lời sai</h1>
          <p className="progress-subtitle">
            Danh sách vựng bạn hay làm sai nhất. Luyện tập tập trung để cải thiện trí nhớ.
          </p>
          
          {wrongWordsList.length > 0 && (
            <div style={{ marginTop: "16px", display: "flex", gap: "12px", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  className="cta-button primary"
                  onClick={handleStartReviewSelecting}
                  disabled={wrongWordsList.length < 3}
                  style={{
                    background: wrongWordsList.length < 3 ? "#98a2b3" : "linear-gradient(135deg, #f04438, #d93025)",
                    cursor: wrongWordsList.length < 3 ? "not-allowed" : "pointer",
                    minHeight: "44px"
                  }}
                >
                  <Play size={18} fill="white" /> Ôn lại ngay ({wrongWordsList.length} từ)
                </button>
                <button
                  className="progress-refresh-btn"
                  onClick={loadWrongWords}
                  title="Làm mới dữ liệu"
                >
                  <RefreshCw size={16} /> Làm mới
                </button>
              </div>
              {wrongWordsList.length < 3 && (
                <p style={{ color: "#d97706", fontSize: "13px", marginTop: "8px", fontWeight: "500", textAlign: "center" }}>
                  ⚠️ Bạn cần ít nhất 3 từ sai để bắt đầu ôn tập. Hãy học thêm hoặc quay lại sau.
                </p>
              )}
            </div>
          )}
        </section>

        {wrongWordsList.length === 0 ? (
          <div className="progress-empty-state card" style={{ padding: "48px 24px" }}>
            <div className="progress-empty-icon" style={{ background: "rgba(18, 183, 106, 0.08)", color: "#12b76a" }}>
              <CheckCircle2 size={48} />
            </div>
            <h3>Tuyệt vời! Bạn đã xử lý hết các từ hay sai 🎉</h3>
            <p style={{ maxWidth: "420px", margin: "0 auto 24px" }}>
              Bạn không còn từ sai nào cần ôn tập. Hãy tiếp tục học thêm từ mới để nâng cao vốn từ nhé!
            </p>
            <button className="primary-button" onClick={onBackHome}>
              Học ngay
            </button>
          </div>
        ) : (
          <div className="vocab-cards-grid" style={{ marginTop: "24px" }}>
            {wrongWordsList.map((item) => (
              <div key={item.id} className="vocab-card" style={{ borderLeft: "4px solid #f04438" }}>
                <div>
                  <div className="vocab-card-header">
                    <div className="vocab-card-word-group">
                      <span className="vocab-card-word">{item.word}</span>
                      <span className="vocab-card-meta">
                        {item.pos ? `${item.pos} · ${item.ipa}` : item.ipa}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                      <span className="badge" style={{ background: "rgba(240, 68, 56, 0.08)", color: "#b42318", border: "1px solid rgba(240, 68, 56, 0.2)", fontSize: "11px" }}>
                        Sai {item.wrongCount} lần
                      </span>
                      <span className="badge" style={{ background: "rgba(53, 184, 224, 0.08)", color: "#0c8599", border: "1px solid rgba(53, 184, 224, 0.2)", fontSize: "11px" }}>
                        Đúng liên tục: {item.wrong_review_correct_streak || 0}/3
                      </span>
                    </div>
                  </div>
                  <div className="vocab-card-answer" style={{ fontWeight: "700", color: "#101828", fontSize: "16px", marginTop: "4px" }}>
                    {item.answer}
                  </div>
                  {item.example && (
                    <div className="vocab-card-example" style={{ marginTop: "8px", fontStyle: "italic", fontSize: "13px" }}>
                      “{item.example}”
                    </div>
                  )}
                  {item.lastReviewedAt && (
                    <div style={{ fontSize: "11px", color: "#667085", marginTop: "12px" }}>
                      Lần học gần nhất: {formatDateTime(item.lastReviewedAt)}
                    </div>
                  )}
                </div>
                <div className="vocab-card-actions">
                  <button
                    className="speaker-mini-btn"
                    onClick={() => speakWord(item.word, item.audio)}
                    title={`Nghe phát âm: ${item.word}`}
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. SELECTING GAMEPLAY MODE
  if (quizStatus === "selecting_mode") {
    return (
      <div className="quiz-flow-container">
        <nav className="back-nav">
          <button className="ghost-button" onClick={handleBack}>
            <ArrowLeft size={16} /> Danh sách từ sai
          </button>
        </nav>

        <section className="selection-screen wrong-words-selection-screen card">
          <div className="screen-header">
            <XCircle className="header-icon" size={32} style={{ color: "#f04438" }} />
            <h2>Ôn tập Từ hay sai</h2>
            <p className="subtitle">
              Bạn chuẩn bị bắt đầu bài ôn tập tập trung cho {wrongWordsList.length} từ bạn hay trả lời sai nhất.
            </p>
          </div>

          <div className="quiz-mode-selector-wrapper">
            <h3 className="selector-section-title">Chọn kiểu kiểm tra</h3>
            <div className="quiz-mode-options">
              <button
                type="button"
                className={`quiz-mode-btn ${quizMode === "multipleChoice" ? "active" : ""}`}
                onClick={() => setQuizMode("multipleChoice")}
              >
                <div className="quiz-mode-info">
                  <span className="quiz-mode-title">Trắc nghiệm</span>
                  <span className="quiz-mode-desc">Chọn đáp án đúng trong 4 lựa chọn</span>
                </div>
              </button>

              <button
                type="button"
                className={`quiz-mode-btn ${quizMode === "typing" ? "active" : ""}`}
                onClick={() => setQuizMode("typing")}
              >
                <div className="quiz-mode-info">
                  <span className="quiz-mode-title">Nhập từ tiếng Anh</span>
                  <span className="quiz-mode-desc">Nhìn nghĩa tiếng Việt và nhập từ tiếng Anh</span>
                </div>
              </button>
            </div>
          </div>

          <div className="action-box" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <button
              className="primary-button start-button"
              onClick={handleStartReviewGameplay}
              disabled={wrongWordsList.length < 3}
              style={{
                background: wrongWordsList.length < 3 ? "#98a2b3" : "linear-gradient(135deg, #f04438, #d93025)",
                cursor: wrongWordsList.length < 3 ? "not-allowed" : "pointer"
              }}
            >
              <Play size={18} fill="white" /> Bắt đầu ôn tập
            </button>
            {wrongWordsList.length < 3 && (
              <p style={{ color: "#d97706", fontSize: "13px", marginTop: "8px", fontWeight: "500", textAlign: "center" }}>
                ⚠️ Bạn cần ít nhất 3 từ sai để bắt đầu ôn tập.
              </p>
            )}
          </div>
        </section>
      </div>
    );
  }

  // 3. PLAYING SCREEN
  if (quizStatus === "playing") {
    if (!currentQuestion) {
      return (
        <div className="quiz-flow-container">
          <nav className="back-nav">
            <button className="ghost-button" onClick={handleBack}>
              <ArrowLeft size={16} /> Quay lại
            </button>
          </nav>
          <section className="quiz card" style={{ padding: '36px', textAlign: 'center' }}>
            <h3 style={{ color: '#b42318', marginBottom: '12px' }}>Không có câu hỏi</h3>
            <button className="primary-button" onClick={handleBack}>
              Quay lại
            </button>
          </section>
        </div>
      );
    }

    const isCorrect = quizMode === "multipleChoice"
      ? selectedAnswer === currentQuestion.answer
      : normalizeTypingAnswer(typedAnswer) === normalizeTypingAnswer(currentQuestion.word);

    return (
      <div className="quiz-flow-container">
        <div className="back-nav">
          <button className="ghost-button" onClick={handleBack}>
            <ArrowLeft size={16} /> Dừng ôn
          </button>
          <button type="button" className="sound-toggle-btn" onClick={toggleSound} title="Bật/Tắt âm thanh phản hồi">
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? "Âm thanh: Bật" : "Âm thanh: Tắt"}</span>
          </button>
        </div>

        <section className="quiz card">
          <div className="topbar">
            <div>
              <span className="label">Tiến độ</span>
              <strong>
                {currentIndex + 1} / {questionQueue.length}
              </strong>
            </div>
            <div>
              <span className="label">Đúng</span>
              <strong className="correct-counter">{correctCount}</strong>
            </div>
            <div>
              <span className="label">Loại</span>
              <span className="badge-inline" style={{ background: "rgba(240, 68, 56, 0.1)", color: "#b42318" }}>Ôn từ sai</span>
            </div>
          </div>

          {quizMode === "multipleChoice" ? (
            <>
              <div className="word-box">
                <div className="word-box-inner">
                  <button
                    className="speaker"
                    onClick={() => speakWord(currentQuestion.word, currentQuestion.audio)}
                  >
                    <Volume2 size={26} />
                  </button>
                  <div>
                    <h2>{currentQuestion.word}</h2>
                    <p className="ipa">
                      {currentQuestion.pos ? (
                        currentQuestion.ipa ? `${currentQuestion.pos} · ${currentQuestion.ipa}` : currentQuestion.pos
                      ) : (
                        currentQuestion.ipa || "Chưa có phiên âm"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <p className="example">“{currentQuestion.example || "Chưa có câu ví dụ."}”</p>

              <div className="options">
                {currentQuestion.options.map((option, idx) => {
                  const isThisCorrect = option === currentQuestion.answer;
                  const isThisSelected = option === selectedAnswer;
                  const labelLetter = ["A", "B", "C", "D"][idx] || "";

                  let className = "option";
                  if (isAnswered && isThisCorrect) className += " correct";
                  if (isAnswered && isThisSelected && !isThisCorrect) className += " wrong";

                  return (
                    <button
                      key={option}
                      className={className}
                      onClick={() => handleSelect(option)}
                      disabled={isAnswered}
                    >
                      <span className="option-label">{labelLetter}</span>
                      <span className="option-text">{option}</span>
                      {isAnswered && isThisCorrect && <CheckCircle2 size={20} className="option-status-icon" />}
                      {isAnswered && isThisSelected && !isThisCorrect && <XCircle size={20} className="option-status-icon" />}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div className={`result-box ${isCorrect ? "correct" : "wrong"}`}>
                  <p className={isCorrect ? "result correct-text" : "result wrong-text"}>
                    {isCorrect ? "Chính xác." : `Sai rồi. Đáp án đúng là: ${currentQuestion.answer}`}
                  </p>
                  
                  <p style={{ fontSize: "14px", color: isCorrect ? "#027a48" : "#b42318", marginTop: "6px", marginBottom: "6px", fontWeight: "600", textAlign: "center" }}>
                    {isCorrect ? (
                      (() => {
                        const newStreak = (currentQuestion.wrong_review_correct_streak || 0) + 1;
                        if (newStreak >= 3) {
                          return "🎉 Tuyệt vời! Bạn đã trả lời đúng 3 lần liên tục. Từ này sẽ được bỏ khỏi danh sách từ sai.";
                        } else {
                          return `Tiến trình: Đúng liên tục ${newStreak}/3`;
                        }
                      })()
                    ) : (
                      "Chuỗi đúng của từ này đã được đặt lại (0/3)"
                    )}
                  </p>

                  {!isCorrect && (
                    <button className="primary-button" onClick={handleNext}>
                      {currentIndex + 1 >= questionQueue.length ? "Xem kết quả" : "Tiếp tục"}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            // Typing mode
            <div className="typing-quiz-container">
              <div className="typing-word-box">
                <span className="label">Nghĩa tiếng Việt</span>
                <h2>{currentQuestion.answer}</h2>
                <p className="typing-pos">
                  Loại từ: <strong>{currentQuestion.pos || "chưa phân loại"}</strong>
                </p>
              </div>

              {currentQuestion.example && (
                <p className="example">
                  Ví dụ: “{maskWordInExample(currentQuestion.example, currentQuestion.word)}”
                </p>
              )}

              <div className="typing-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  className="typing-input"
                  placeholder="Nhập từ tiếng Anh tương ứng..."
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (!isAnswered) {
                        handleCheckAnswer();
                      } else {
                        handleNext();
                      }
                    }
                  }}
                  disabled={isAnswered}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                />

                {!isAnswered && (
                  <button
                    className="primary-button check-btn"
                    onClick={handleCheckAnswer}
                    disabled={!typedAnswer.trim()}
                  >
                    Kiểm tra
                  </button>
                )}
              </div>

              {isAnswered && (
                <div className="typing-result-feedback card">
                  <div className="feedback-status-header">
                     {isCorrect ? (
                       <span className="status-label correct"><CheckCircle2 size={20} /> Chính xác!</span>
                     ) : (
                       <span className="status-label wrong"><XCircle size={20} /> Chưa đúng rồi!</span>
                     )}
                  </div>

                  <p style={{ fontSize: "14px", color: isCorrect ? "#027a48" : "#b42318", marginTop: "8px", marginBottom: "8px", fontWeight: "600", textAlign: "center" }}>
                    {isCorrect ? (
                      (() => {
                        const newStreak = (currentQuestion.wrong_review_correct_streak || 0) + 1;
                        if (newStreak >= 3) {
                          return "🎉 Tuyệt vời! Bạn đã trả lời đúng 3 lần liên tục. Từ này sẽ được bỏ khỏi danh sách từ sai.";
                        } else {
                          return `Tiến trình: Đúng liên tục ${newStreak}/3`;
                        }
                      })()
                    ) : (
                      "Chuỗi đúng của từ này đã được đặt lại (0/3)"
                    )}
                  </p>

                  <div className="correct-word-details">
                    <span className="label">Từ tiếng Anh đúng:</span>
                    <div className="correct-word-row">
                      <span className="word-text">{currentQuestion.word}</span>
                      {currentQuestion.ipa && <span className="word-ipa">/{currentQuestion.ipa.replace(/\//g, "")}/</span>}

                      <button
                        className="speaker-mini-btn font-sound-btn"
                        onClick={() => speakWord(currentQuestion.word, currentQuestion.audio)}
                        title="Nghe phát âm"
                      >
                        <Volume2 size={18} />
                      </button>
                    </div>
                  </div>

                  {!isCorrect && (
                    <div className="user-typed-details">
                      <span className="label">Bạn đã nhập:</span>
                      <span className="user-typed-text">{typedAnswer || "(Trống)"}</span>
                    </div>
                  )}

                  <div className="feedback-actions">
                    <button className="primary-button next-btn" onClick={handleNext}>
                      {currentIndex + 1 >= questionQueue.length ? "Xem kết quả" : "Tiếp tục"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    );
  }

  // 4. FINISHED SCREEN
  if (quizStatus === "finished") {
    return (
      <div className="quiz-flow-container">
        <nav className="back-nav">
          <button className="ghost-button" onClick={handleBack}>
            <ArrowLeft size={16} /> Danh sách từ sai
          </button>
        </nav>

        <section className="results-screen card">
          <div className="results-header">
            <Award className="award-icon" size={48} style={{ color: "#f04438" }} />
            <h2>Hoàn thành Ôn tập từ sai</h2>
            <div className="score-display">
              <span className="score-num">{score10}</span>
              <span className="score-total">/ 10 điểm</span>
            </div>
            {clearedWordsCount > 0 && (
              <div className="cleared-summary-banner" style={{
                background: "rgba(18, 183, 106, 0.08)",
                border: "1px solid rgba(18, 183, 106, 0.2)",
                color: "#027a48",
                padding: "12px 16px",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "14px",
                textAlign: "center",
                margin: "12px auto 0",
                maxWidth: "400px"
              }}>
                🎉 Đã loại {clearedWordsCount} từ khỏi danh sách từ sai
              </div>
            )}
            <div className={`save-status-msg ${saveStatus}`}>
              {saveStatus === "saving" && "Đang lưu kết quả..."}
              {saveStatus === "success" && "Đã lưu kết quả học tập thành công."}
              {saveStatus === "error" && `Không lưu được kết quả: ${saveErrorMsg}`}
            </div>
          </div>

          <div className="stats-grid">
            <div className="quiz-stat-card">
              <span className="stat-label">Tổng số câu</span>
              <span className="stat-val">{questionQueue.length}</span>
            </div>
            <div className="quiz-stat-card correct">
              <span className="stat-label">Đúng</span>
              <span className="stat-val">{correctCount}</span>
            </div>
            <div className="quiz-stat-card wrong">
              <span className="stat-label">Sai</span>
              <span className="stat-val">{incorrectAnswers.length}</span>
            </div>
          </div>

          {incorrectAnswers.length > 0 && (
            <div className="wrong-review-box">
              <h3>Danh sách từ làm sai cần chú ý ({incorrectAnswers.length} từ)</h3>
              <div className="review-table-wrapper">
                <table className="review-table">
                  <thead>
                    <tr>
                      <th>Từ vựng</th>
                      <th>Loại từ</th>
                      <th>Nghĩa chuẩn</th>
                      <th>Lựa chọn của bạn</th>
                      <th>Nghe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incorrectAnswers.map((item, idx) => (
                      <tr key={idx} className="review-row">
                        <td>
                          <div className="review-word-info">
                            <span className="review-word">{item.word}</span>
                            <span className="review-ipa">{item.ipa}</span>
                          </div>
                        </td>
                        <td className="review-pos">{item.pos || ""}</td>
                        <td className="review-correct">
                          {item.mode === "typing" ? item.answer : item.correctAnswer}
                        </td>
                        <td>
                          {item.mode === "typing" ? (
                            <div className="review-typing-compare">
                              <span className="review-wrong" style={{ display: 'block' }}>Bạn nhập: <code className="typed-code">{item.typedAnswer || "(Trống)"}</code></span>
                              <span className="review-correct-label" style={{ display: 'block', color: '#027a48', fontWeight: '600', marginTop: '4px' }}>Đáp án đúng: <strong>{item.word}</strong></span>
                            </div>
                          ) : (
                            <span className="review-wrong">{item.selectedAnswer || "(Bỏ qua)"}</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="speaker-mini-btn"
                            onClick={() => speakWord(item.word, item.audio)}
                          >
                            <Volume2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list cards style */}
              <div className="review-cards-list">
                {incorrectAnswers.map((item, idx) => (
                  <div key={idx} className="review-card-item">
                    <div className="review-card-header">
                      <div className="review-card-word-info">
                        <span className="review-card-word">{item.word}</span>
                        {item.ipa && <span className="review-card-ipa">{item.ipa}</span>}
                        {item.pos && <span className="review-card-pos">{item.pos}</span>}
                      </div>
                      <button
                        className="speaker-mini-btn"
                        onClick={() => speakWord(item.word, item.audio)}
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>

                    <div className="review-card-body">
                      <div className="review-card-detail">
                        <span className="detail-label">{item.mode === "typing" ? "Nghĩa tiếng Việt:" : "Nghĩa đúng:"}</span>
                        <span className="detail-val review-correct">{item.mode === "typing" ? item.answer : item.correctAnswer}</span>
                      </div>
                      <div className="review-card-detail">
                        {item.mode === "typing" ? (
                          <div className="review-typing-compare-mobile" style={{ width: '100%' }}>
                            <div style={{ marginBottom: '4px' }}>
                              <span className="detail-label">Bạn nhập:</span>
                              <span className="detail-val review-wrong" style={{ marginLeft: '4px' }}>{item.typedAnswer || "(Trống)"}</span>
                            </div>
                            <div>
                              <span className="detail-label" style={{ color: '#027a48' }}>Đáp án đúng:</span>
                              <span className="detail-val" style={{ marginLeft: '4px', color: '#027a48', fontWeight: 'bold' }}>{item.word}</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="detail-label">Bạn chọn:</span>
                            <span className="detail-val review-wrong">{item.selectedAnswer || "(Bỏ qua)"}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="results-actions">
            <button className="primary-button action-btn" onClick={handleStartReviewGameplay} style={{ background: "linear-gradient(135deg, #f04438, #d93025)" }}>
              <RefreshCw size={16} /> Ôn tập lại các từ này
            </button>
            <button className="ghost-button action-btn" onClick={handleBack}>
              Danh sách từ sai
            </button>
          </div>
        </section>
      </div>
    );
  }

  return null;
}
