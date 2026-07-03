import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX, CheckCircle2, XCircle, ArrowLeft, Play, Award, RefreshCw, Layers, CalendarClock, LogIn, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchDueReviewWords } from "../utils/progressService.js";
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

export function DueReview({ cards, onBackHome }) {
  const { user } = useAuth();
  
  const [loadingWords, setLoadingWords] = useState(true);
  const [dueWordsList, setDueWordsList] = useState([]);
  const [quizStatus, setQuizStatus] = useState("selecting"); // "selecting" | "playing" | "finished"
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

  // Fetch and map due words from database and CSV
  const loadDueWords = useCallback(async () => {
    if (!user) {
      setLoadingWords(false);
      return;
    }
    setLoadingWords(true);
    try {
      const dbProgress = await fetchDueReviewWords(user.id);
      
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
          vocab_item_id: dbVocab.id
        };
      }).filter(item => item.word && item.answer);

      setDueWordsList(mapped);
    } catch (err) {
      console.error("Error loading due review words:", err);
    } finally {
      setLoadingWords(false);
    }
  }, [user, cards]);

  useEffect(() => {
    loadDueWords();
  }, [loadDueWords]);

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

  // Save review study result when finished
  useEffect(() => {
    if (quizStatus === "finished") {
      if (hasSavedRef.current) return;
      hasSavedRef.current = true;

      async function saveResult() {
        setSaveStatus("saving");
        // Get the course code of the first card or default
        const courseCode = questionQueue[0]?.course || "foundation";

        const res = await saveStudyResultToSupabase({
          user,
          courseCode,
          selectedDays: [...new Set(questionQueue.map(q => q.day))],
          mode: "due_review",
          totalQuestions: questionQueue.length,
          correctCount: correctCount,
          wrongCount: questionQueue.length - correctCount,
          score: score10,
          answersLog
        });

        if (res.success) {
          setSaveStatus("success");
          setSaveErrorMsg("");
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

  function handleStartReview() {
    if (dueWordsList.length === 0) return;

    // Shuffle cards
    const shuffled = shuffle(dueWordsList);

    // Create options for multiple choice
    const queue = shuffled.map((card) => {
      return createQuestion(card, dueWordsList, cards);
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
    if (quizStatus === "playing") {
      if (confirm("Bạn có chắc muốn dừng ôn tập và quay lại không?")) {
        setQuizStatus("selecting");
      }
    } else if (quizStatus === "finished") {
      // Reload lists
      loadDueWords();
      setQuizStatus("selecting");
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
        <section className="selection-screen card" style={{ padding: "40px", textAlign: "center" }}>
          <CalendarClock size={48} style={{ color: "#d97706", marginBottom: "16px" }} />
          <h2>Ôn tập hôm nay</h2>
          <p style={{ color: "#475467", marginBottom: "24px" }}>
            Vui lòng đăng nhập để sử dụng tính năng ôn tập hàng ngày theo thuật toán lặp lại ngắt quãng.
          </p>
        </section>
      </div>
    );
  }

  if (loadingWords) {
    return (
      <div className="quiz-flow-container">
        <nav className="back-nav">
          <button className="ghost-button" onClick={onBackHome}>
            <ArrowLeft size={16} /> Trang chủ
          </button>
        </nav>
        <section className="selection-screen card" style={{ padding: "40px", textAlign: "center" }}>
          <div className="progress-loading-spinner" style={{ margin: "0 auto 16px" }}></div>
          <p>Đang tìm danh sách từ cần ôn...</p>
        </section>
      </div>
    );
  }

  // 1. SELECTING MODE SCREEN
  if (quizStatus === "selecting") {
    return (
      <div className="quiz-flow-container">
        <nav className="back-nav">
          <button className="ghost-button" onClick={handleBack}>
            <ArrowLeft size={16} /> Trang chủ
          </button>
        </nav>

        <section className="selection-screen card">
          <div className="screen-header">
            <CalendarClock className="header-icon" size={32} style={{ color: "#d97706" }} />
            <h2>Ôn tập hôm nay (Spaced Repetition)</h2>
            <p className="subtitle">
              Hệ thống đã chọn ra các từ đã đến thời gian ôn lại dựa trên lịch sử trả lời của bạn để đạt hiệu quả ghi nhớ tốt nhất.
            </p>
          </div>

          {dueWordsList.length === 0 ? (
            <div className="due-empty-state" style={{ textAlign: "center", padding: "32px 0" }}>
              <div className="due-success-icon" style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
              <h3 style={{ color: "#027a48", fontWeight: "800", marginBottom: "8px" }}>Tất cả đã hoàn thành!</h3>
              <p style={{ color: "#475467", maxWidth: "480px", margin: "0 auto" }}>
                Tuyệt vời! Bạn không có từ nào cần ôn hôm nay. Hãy quay lại vào ngày mai hoặc tiếp tục học các bài mới!
              </p>
              <button className="primary-button" onClick={onBackHome} style={{ marginTop: "24px" }}>
                Về trang chủ
              </button>
            </div>
          ) : (
            <>
              <div className="due-summary-badge" style={{
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                color: "#b45309",
                padding: "16px",
                borderRadius: "14px",
                fontWeight: "700",
                textAlign: "center",
                marginBottom: "24px"
              }}>
                Bạn đang có <strong style={{ fontSize: "20px" }}>{dueWordsList.length}</strong> từ cần ôn tập.
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

              <div className="action-box">
                <button
                  className="primary-button start-button"
                  onClick={handleStartReview}
                  style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                >
                  <Play size={18} fill="white" /> Bắt đầu ôn tập
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  // 2. PLAYING SCREEN
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
            <button className="primary-button" onClick={() => setQuizStatus("selecting")}>
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
              <span className="label">Tiến độ ôn</span>
              <strong>
                {currentIndex + 1} / {questionQueue.length}
              </strong>
            </div>
            <div>
              <span className="label">Câu đúng</span>
              <strong className="correct-counter">{correctCount}</strong>
            </div>
            <div>
              <span className="label">Lớp học</span>
              <span className="badge-inline" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#b45309" }}>Ôn tập</span>
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
                  {!isCorrect && (
                    <button className="primary-button" onClick={handleNext}>
                      {currentIndex + 1 >= questionQueue.length ? "Xem kết quả" : "Câu tiếp theo"}
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
                      {currentIndex + 1 >= questionQueue.length ? "Xem kết quả" : "Câu tiếp theo"}
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

  // 3. FINISHED SCREEN
  if (quizStatus === "finished") {
    return (
      <div className="quiz-flow-container">
        <nav className="back-nav">
          <button className="ghost-button" onClick={handleBack}>
            <ArrowLeft size={16} /> Màn hình ôn
          </button>
        </nav>

        <section className="results-screen card">
          <div className="results-header">
            <Award className="award-icon" size={48} style={{ color: "#d97706" }} />
            <h2>Kết quả Ôn tập</h2>
            <div className="score-display">
              <span className="score-num">{score10}</span>
              <span className="score-total">/ 10 điểm</span>
            </div>
            <div className={`save-status-msg ${saveStatus}`}>
              {saveStatus === "saving" && "Đang lưu kết quả..."}
              {saveStatus === "success" && "Đã lưu kết quả ôn tập thành công."}
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

              {/* Mobile review list card style */}
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
            <button className="primary-button action-btn" onClick={handleStartReview} style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              <RefreshCw size={16} /> Ôn tập lại buổi này
            </button>
            <button className="ghost-button action-btn" onClick={onBackHome}>
              Về trang chủ
            </button>
          </div>
        </section>
      </div>
    );
  }

  return null;
}
