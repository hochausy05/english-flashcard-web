import { useMemo, useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Check, CheckCircle2, XCircle, ArrowLeft, Play, Calendar, Award, RefreshCw, Layers } from "lucide-react";
import { speakWord } from "../utils/speech.js";
import { playFeedbackSound } from "../utils/feedbackSound.js";
import { useAuth } from "../context/AuthContext.jsx";
import { saveStudyResultToSupabase } from "../utils/studyResultService.js";
import { fetchLessonCompletionMap } from "../utils/lessonProgressService.js";


// Helper to shuffle array using Fisher-Yates algorithm
function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper to normalize user typed answer for comparison
function normalizeListeningAnswer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ");
}

// Helper to generate 4 options of English words for multiple choice mode
function createListeningQuestion(correctCard, sessionCards, allCards) {
  const sessionWrong = [
    ...new Set(
      sessionCards
        .filter((c) => c.word.trim().toLowerCase() !== correctCard.word.trim().toLowerCase())
        .map((c) => c.word.trim())
    )
  ];

  let wrongAnswers = [];
  if (sessionWrong.length >= 3) {
    wrongAnswers = shuffle(sessionWrong).slice(0, 3);
  } else {
    const courseWrong = [
      ...new Set(
        allCards
          .filter((c) => c.course === correctCard.course && c.word.trim().toLowerCase() !== correctCard.word.trim().toLowerCase())
          .map((c) => c.word.trim())
      )
    ];
    const combinedCourseWrong = [...new Set([...sessionWrong, ...courseWrong])];

    if (combinedCourseWrong.length >= 3) {
      wrongAnswers = shuffle(combinedCourseWrong).slice(0, 3);
    } else {
      const allWrong = [
        ...new Set(
          allCards
            .filter((c) => c.word.trim().toLowerCase() !== correctCard.word.trim().toLowerCase())
            .map((c) => c.word.trim())
        )
      ];
      const combinedAllWrong = [...new Set([...combinedCourseWrong, ...allWrong])];
      wrongAnswers = shuffle(combinedAllWrong).slice(0, 3);
    }
  }

  return {
    ...correctCard,
    options: shuffle([...wrongAnswers, correctCard.word]),
  };
}

export function ListeningPractice({ cards, onBackHome, initialCourse }) {
  const { user } = useAuth();
  const [quizStatus, setQuizStatus] = useState("selecting"); // "selecting" | "playing" | "finished"
  const [selectedCourse, setSelectedCourse] = useState(initialCourse || "foundation");
  const [selectedDays, setSelectedDays] = useState([]);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersLog, setAnswersLog] = useState([]);
  const [saveStatus, setSaveStatus] = useState("idle"); // "idle" | "saving" | "success" | "error" | "not_logged_in"
  const [saveErrorMsg, setSaveErrorMsg] = useState("");
  const hasSavedRef = useRef(false);

  const [completionMap, setCompletionMap] = useState({});
  const [loadingCompletion, setLoadingCompletion] = useState(false);

  
  const [quizMode, setQuizMode] = useState("multipleChoice"); // "multipleChoice" | "typing"
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isAnsweredState, setIsAnsweredState] = useState(false);
  const [isDaysExpanded, setIsDaysExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("flashcard_feedback_sound_enabled");
    return saved !== null ? saved === "true" : true;
  });

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

  // Group days of the selected course
  const daysInfo = useMemo(() => {
    const info = {};
    cards
      .filter((card) => card.course === selectedCourse)
      .forEach((card) => {
        const d = card.day || "1";
        if (!info[d]) {
          info[d] = 0;
        }
        info[d]++;
      });

    return Object.keys(info)
      .sort((a, b) => Number(a) - Number(b))
      .map((d) => ({
        day: d,
        count: info[d],
      }));
  }, [cards, selectedCourse]);

  // Current question from queue
  const currentQuestion = useMemo(() => {
    if (questionQueue.length === 0 || currentIndex >= questionQueue.length) {
      return null;
    }
    return questionQueue[currentIndex];
  }, [questionQueue, currentIndex]);

  const isAnswered = quizMode === "multipleChoice" ? selectedAnswer !== null : isAnsweredState;

  // Total correct questions count
  const correctCount = useMemo(() => {
    return answersLog.filter((item) => item.isCorrect).length;
  }, [answersLog]);

  // Calculate score on a 10-point scale
  const score10 = useMemo(() => {
    if (questionQueue.length === 0) return 0;
    const raw = (correctCount / questionQueue.length) * 10;
    return Number(raw.toFixed(1));
  }, [correctCount, questionQueue]);

  // Autofocus input on load or when moving to the next word in typing mode
  useEffect(() => {
    if (quizStatus === "playing" && quizMode === "typing" && inputRef.current) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [currentIndex, quizStatus, quizMode]);

  // Auto pronunciation when loading a new word
  useEffect(() => {
    if (quizStatus === "playing" && currentQuestion) {
      const timer = setTimeout(() => {
        try {
          speakWord(currentQuestion.word, currentQuestion.audio);
        } catch (e) {
          console.warn("Autoplay blocked or audio failed", e);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, quizStatus, currentQuestion]);

  // Tải trạng thái hoàn thành các buổi học từ Supabase
  useEffect(() => {
    if (!user) {
      setCompletionMap({});
      return;
    }

    let isMounted = true;
    async function loadCompletion() {
      if (quizStatus === "selecting") {
        setLoadingCompletion(true);
        try {
          const map = await fetchLessonCompletionMap(user.id, selectedCourse);
          if (isMounted) {
            setCompletionMap(map);
          }
        } catch (err) {
          console.error("Failed to load lesson completion map in Listening:", err);
        } finally {
          if (isMounted) {
            setLoadingCompletion(false);
          }
        }
      }
    }

    loadCompletion();
    return () => {
      isMounted = false;
    };
  }, [user, selectedCourse, quizStatus]);

  // Tự động lưu tiến độ luyện nghe lên Supabase khi hoàn thành bài học
  useEffect(() => {
    if (quizStatus === "finished") {
      if (hasSavedRef.current) return;
      hasSavedRef.current = true;

      if (!user) {
        setSaveStatus("not_logged_in");
        return;
      }

      async function saveResult() {
        setSaveStatus("saving");
        const res = await saveStudyResultToSupabase({
          user,
          courseCode: selectedCourse,
          selectedDays,
          mode: "listening",
          totalQuestions: questionQueue.length,
          correctCount: correctCount,
          wrongCount: questionQueue.length - correctCount,
          score: score10,
          answersLog
        });

        if (res.success) {
          setSaveStatus("success");
          setSaveErrorMsg("");
          try {
            const map = await fetchLessonCompletionMap(user.id, selectedCourse);
            setCompletionMap(map);
          } catch (err) {
            console.error("Failed to refresh lesson completion map in Listening background:", err);
          }
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
  }, [quizStatus, user, selectedCourse, selectedDays, questionQueue.length, correctCount, score10, answersLog]);


  // Handle course changing
  function handleSelectCourse(course) {
    if (course !== selectedCourse) {
      setSelectedCourse(course);
      setSelectedDays([]); // Clear selected days to avoid mixing days of different courses
      setIsDaysExpanded(false);
    }
  }

  // Toggle day selection
  function handleToggleDay(day) {
    if (selectedDays.includes(day)) {
      setSelectedDays((prev) => prev.filter((d) => d !== day));
    } else {
      setSelectedDays((prev) => [...prev, day]);
    }
  }

  // Select or deselect all days
  function handleToggleSelectAll() {
    if (selectedDays.length === daysInfo.length) {
      setSelectedDays([]);
    } else {
      setSelectedDays(daysInfo.map((d) => d.day));
    }
  }

  // Start listening practice
  function handleStartListening() {
    if (selectedDays.length === 0) return;

    const sessionCards = cards.filter(
      (card) => card.course === selectedCourse && selectedDays.includes(card.day)
    );

    if (sessionCards.length === 0) {
      alert("Không tìm thấy từ vựng nào thuộc các buổi học đã chọn. Vui lòng thử chọn buổi khác!");
      return;
    }

    const shuffled = shuffle(sessionCards);

    // Create question queue and generate options for multiple choice
    const queue = shuffled.map((card) => {
      return createListeningQuestion(card, sessionCards, cards);
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

  // Choose an option (Multiple Choice Mode)
  function handleSelectOption(option) {
    if (isAnswered) return;

    setSelectedAnswer(option);
    const isCorrect = option === currentQuestion.word;

    if (soundEnabled) {
      playFeedbackSound(isCorrect);
    }

    // Save to answersLog
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
        selectedAnswer: option,
        typedAnswer: "",
        correctAnswer: currentQuestion.word,
        isCorrect: isCorrect,
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

  // Check the input answer (Typing Mode)
  function handleCheckAnswer() {
    if (isAnswered) return;

    const trimmed = typedAnswer.trim();
    const normalizedUser = normalizeListeningAnswer(trimmed);
    const normalizedCorrect = normalizeListeningAnswer(currentQuestion.word);
    const isCorrect = normalizedUser === normalizedCorrect;

    if (soundEnabled) {
      playFeedbackSound(isCorrect);
    }

    setIsAnsweredState(true);

    // Save to answersLog
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
        selectedAnswer: "",
        correctAnswer: currentQuestion.word,
        isCorrect: isCorrect,
        audio: currentQuestion.audio,
        mode: "typing",
      },
    ]);
  }

  // Next question or finish
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

  // Handle back navigations
  function handleBack() {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
    }
    if (quizStatus === "playing") {
      if (confirm("Bạn có chắc muốn dừng luyện nghe và quay lại màn chọn buổi không?")) {
        setQuizStatus("selecting");
      }
    } else if (quizStatus === "finished") {
      setQuizStatus("selecting");
    } else {
      onBackHome();
    }
  }

  function getScoreMessage(score) {
    if (score >= 9) return "Xuất sắc! 🎉";
    if (score >= 7.5) return "Tuyệt vời! 👍";
    if (score >= 5) return "Khá tốt! 💪";
    return "Cần cố gắng thêm! 📚";
  }

  // 1. SELECTING SCREEN
  if (quizStatus === "selecting") {
    const showCollapsed = selectedDays.length > 0 && !isDaysExpanded;

    return (
      <div className="quiz-flow-container">
        <div className="back-nav">
          <button className="ghost-button" onClick={handleBack}>
            <ArrowLeft size={16} /> Trang chủ
          </button>
        </div>

        <section className="selection-screen card">
          <div className="screen-header">
            <Layers className="header-icon" size={32} />
            <h2>Luyện nghe từ vựng</h2>
            <p className="subtitle">
              Chọn một hoặc nhiều buổi học bằng checkbox để bắt đầu luyện nghe. Hệ thống sẽ phát âm từ tiếng Anh, nghe và trả lời chính xác.
            </p>
            {!user && (
              <p className="guest-note">
                💡 Đăng nhập để lưu tiến độ hoàn thành và đồng bộ kết quả học tập.
              </p>
            )}
          </div>

          <div className={`days-selector-container ${showCollapsed ? "mobile-collapsed" : ""}`}>
            {/* Mobile Collapsed Summary */}
            <div className="mobile-collapsed-summary">
              <div className="collapsed-info">
                <span className="collapsed-course">
                  {selectedCourse === "foundation" ? "Nền tảng" : "TOEIC 1"}
                </span>
                <span className="collapsed-days">
                  Đang chọn: {selectedDays.map((d) => `Buổi ${d}`).join(", ")}
                </span>
              </div>
              <button
                type="button"
                className="change-days-btn"
                onClick={() => setIsDaysExpanded(true)}
              >
                Đổi buổi
              </button>
            </div>

            {/* Full Selection UI */}
            <div className="full-selector-ui">
              <div className="course-selector">
                <button
                  type="button"
                  className={`course-btn ${selectedCourse === "foundation" ? "active" : ""}`}
                  onClick={() => handleSelectCourse("foundation")}
                >
                  <span className="course-btn-title">Nền tảng</span>
                  <span className="course-btn-subtitle">Foundation Course</span>
                </button>
                <button
                  type="button"
                  className={`course-btn ${selectedCourse === "toeic1" ? "active" : ""}`}
                  onClick={() => handleSelectCourse("toeic1")}
                >
                  <span className="course-btn-title">TOEIC 1</span>
                  <span className="course-btn-subtitle">TOEIC Prep 1</span>
                </button>
              </div>

              <div className="selection-controls">
                <button type="button" className="text-button" onClick={handleToggleSelectAll}>
                  {selectedDays.length === daysInfo.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </button>
                {selectedDays.length > 0 && (
                  <button
                    type="button"
                    className="text-button collapse-btn-mobile-only"
                    onClick={() => setIsDaysExpanded(false)}
                  >
                    Thu gọn
                  </button>
                )}
                <span className="selected-summary">
                  Đã chọn <strong>{selectedDays.length}</strong> / {daysInfo.length} buổi học
                </span>
              </div>

              <div className="days-grid">
                {daysInfo.map((info) => {
                  const isSelected = selectedDays.includes(info.day);
                  const completion = completionMap[info.day];
                  const isCompleted = completion?.isCompleted;
                  const bestAccuracy = completion?.bestAccuracy || 0;

                  let cardClassName = "lesson-card";
                  if (isSelected) cardClassName += " selected";
                  if (isCompleted) cardClassName += " completed";

                  return (
                    <div
                      key={info.day}
                      className={cardClassName}
                      onClick={() => handleToggleDay(info.day)}
                    >
                      <div className="lesson-card-header">
                        <input
                          type="checkbox"
                          className="day-checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleDay(info.day)}
                          onClick={(e) => e.stopPropagation()} // Chống bubble để tránh kích hoạt click của cả card
                        />
                        <span className="day-title">Buổi {info.day}</span>
                      </div>

                      <div className="lesson-card-body">
                        {isCompleted ? (
                          <div className="lesson-completed-circle">
                            <Check className="big-check-icon" size={24} />
                          </div>
                        ) : (
                          <div className="lesson-uncompleted-placeholder">
                            <Calendar className="lesson-card-icon" size={20} />
                          </div>
                        )}
                      </div>

                      <div className="lesson-card-footer">
                        <span className="day-count">{info.count} từ vựng</span>
                        {isCompleted ? (
                          <span className="day-status-text completed">Đã hoàn thành</span>
                        ) : bestAccuracy > 0 ? (
                          <div className="day-status-group">
                            <span className="day-status-text partial">Chưa hoàn thành</span>
                            <span className="day-accuracy-text">Tốt nhất {bestAccuracy}%</span>
                          </div>
                        ) : (
                          <span className="day-status-text unstarted">Chưa luyện tập</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="quiz-mode-selector-wrapper">
            <h3 className="selector-section-title">Chọn kiểu luyện nghe</h3>
            <div className="quiz-mode-options">
              <button
                type="button"
                className={`quiz-mode-btn ${quizMode === "multipleChoice" ? "active" : ""}`}
                onClick={() => setQuizMode("multipleChoice")}
              >
                <div className="quiz-mode-info">
                  <span className="quiz-mode-title">Trắc nghiệm</span>
                  <span className="quiz-mode-desc">Nghe phát âm và chọn từ tiếng Anh đúng trong 4 lựa chọn</span>
                </div>
              </button>

              <button
                type="button"
                className={`quiz-mode-btn ${quizMode === "typing" ? "active" : ""}`}
                onClick={() => setQuizMode("typing")}
              >
                <div className="quiz-mode-info">
                  <span className="quiz-mode-title">Nhập từ tiếng Anh</span>
                  <span className="quiz-mode-desc">Nghe phát âm và tự nhập lại từ tiếng Anh đã nghe</span>
                </div>
              </button>
            </div>
          </div>

          <div className="action-box">
            <button
              className="primary-button start-button"
              disabled={selectedDays.length === 0}
              onClick={handleStartListening}
            >
              <Play size={18} fill="white" /> Bắt đầu luyện nghe
            </button>
          </div>
        </section>

        {/* Sticky bottom action bar for mobile */}
        <div className="mobile-sticky-action-bar">
          <span className="sticky-summary">
            Đã chọn <strong>{selectedDays.length}</strong>/{daysInfo.length} buổi
          </span>
          <button
            type="button"
            className="primary-button sticky-start-btn"
            disabled={selectedDays.length === 0}
            onClick={handleStartListening}
          >
            Luyện nghe
          </button>
        </div>
      </div>
    );
  }

  // 2. PLAYING SCREEN
  if (quizStatus === "playing") {
    if (!currentQuestion) {
      return (
        <div className="quiz-flow-container">
          <div className="back-nav">
            <button className="ghost-button" onClick={handleBack}>
              <ArrowLeft size={16} /> Quay lại
            </button>
          </div>
          <section className="quiz card" style={{ padding: "36px", textAlign: "center" }}>
            <h3 style={{ color: "#b42318", marginBottom: "12px" }}>Không có dữ liệu</h3>
            <button className="primary-button" onClick={() => setQuizStatus("selecting")}>
              Chọn buổi học khác
            </button>
          </section>
        </div>
      );
    }

    return (
      <div className="quiz-flow-container">
        <div className="back-nav">
          <button className="ghost-button" onClick={handleBack}>
            <ArrowLeft size={16} /> Dừng học
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
              <span className="label">Số câu đúng</span>
              <strong className="correct-counter">{correctCount}</strong>
            </div>
            <div>
              <span className="label">Buổi học</span>
              <span className="badge-inline">Buổi {currentQuestion.day}</span>
            </div>
          </div>

          <div className="listening-practice-container">
            {/* Pronunciation Play Card */}
            <div className="listening-audio-box">
              <span className="label" style={{ marginBottom: "12px" }}>Hãy nghe kỹ từ tiếng Anh</span>
              <div className="listening-speaker-controls">
                <button
                  className="listening-speaker-large"
                  onClick={() => speakWord(currentQuestion.word, currentQuestion.audio)}
                  title="Nghe từ tiếng Anh"
                >
                  <Volume2 size={40} />
                  <span className="speaker-text">Nghe từ</span>
                </button>
                <button
                  className="listening-speaker-replay-btn"
                  onClick={() => speakWord(currentQuestion.word, currentQuestion.audio)}
                  title="Nghe lại"
                >
                  <RefreshCw size={16} />
                  <span>Nghe lại</span>
                </button>
              </div>
              {currentQuestion.pos && (
                <p className="typing-pos" style={{ marginTop: "14px", textAlign: "center" }}>
                  Loại từ: <strong>{currentQuestion.pos}</strong>
                </p>
              )}
            </div>

            {/* Answer Controls: Multiple Choice or Typing */}
            {quizMode === "multipleChoice" ? (
              <>
                <div className="options" style={{ marginTop: "24px" }}>
                  {currentQuestion.options.map((option, idx) => {
                    const isThisCorrect = option === currentQuestion.word;
                    const isThisSelected = option === selectedAnswer;
                    const labelLetter = ["A", "B", "C", "D"][idx] || "";

                    let className = "option";
                    if (isAnswered && isThisCorrect) className += " correct";
                    if (isAnswered && isThisSelected && !isThisCorrect) className += " wrong";

                    return (
                      <button
                        key={option}
                        className={className}
                        onClick={() => handleSelectOption(option)}
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
                  <div className="typing-result-feedback card" style={{ marginTop: "20px" }}>
                    <div className="feedback-status-header">
                      {selectedAnswer === currentQuestion.word ? (
                        <span className="status-label correct"><CheckCircle2 size={20} /> Chính xác!</span>
                      ) : (
                        <span className="status-label wrong"><XCircle size={20} /> Chưa đúng rồi!</span>
                      )}
                    </div>

                    <div className="correct-word-details">
                      <span className="label">Từ tiếng Anh đúng:</span>
                      <div className="correct-word-row">
                        <span className="word-text">{currentQuestion.word}</span>
                        {currentQuestion.pos && <span className="word-pos" style={{ background: "#f0f2f5", padding: "2px 6px", borderRadius: "6px", fontSize: "14px", fontWeight: "600" }}>{currentQuestion.pos}</span>}
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

                    <div className="correct-meaning-details">
                      <span className="label">Nghĩa tiếng Việt:</span>
                      <span className="meaning-text" style={{ fontSize: "16px", fontWeight: "600", color: "#344054" }}>{currentQuestion.answer}</span>
                    </div>

                    {selectedAnswer !== currentQuestion.word && (
                      <div className="user-typed-details">
                        <span className="label">Bạn đã chọn:</span>
                        <span className="user-typed-text" style={{ textDecoration: "line-through" }}>{selectedAnswer || "(Bỏ qua)"}</span>
                      </div>
                    )}

                    {currentQuestion.example && (
                      <div className="correct-example-details" style={{ borderTop: "1px solid #eaecf0", paddingTop: "12px", marginTop: "4px" }}>
                        <span className="label">Ví dụ minh họa:</span>
                        <p className="example" style={{ margin: "4px 0 0 0", textAlign: "left", fontSize: "15px", color: "#475467", fontStyle: "italic" }}>
                          “{currentQuestion.example}”
                        </p>
                      </div>
                    )}

                    <div className="feedback-actions">
                      {selectedAnswer !== currentQuestion.word && (
                        <button className="primary-button next-btn" onClick={handleNext}>
                          {currentIndex + 1 >= questionQueue.length ? "Xem kết quả" : "Câu tiếp theo"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Typing Input */}
                <div className="typing-input-wrapper" style={{ marginTop: "24px" }}>
                  <input
                    ref={inputRef}
                    type="text"
                    className="typing-input"
                    placeholder="Nhập từ/cụm từ tiếng Anh đã nghe..."
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

                {/* Post-Check Details */}
                {isAnswered && (
                  <div className="typing-result-feedback card" style={{ marginTop: "20px" }}>
                    <div className="feedback-status-header">
                      {normalizeListeningAnswer(typedAnswer) === normalizeListeningAnswer(currentQuestion.word) ? (
                        <span className="status-label correct"><CheckCircle2 size={20} /> Chính xác!</span>
                      ) : (
                        <span className="status-label wrong"><XCircle size={20} /> Chưa đúng rồi!</span>
                      )}
                    </div>

                    <div className="correct-word-details">
                      <span className="label">Từ tiếng Anh đúng:</span>
                      <div className="correct-word-row">
                        <span className="word-text">{currentQuestion.word}</span>
                        {currentQuestion.pos && <span className="word-pos" style={{ background: "#f0f2f5", padding: "2px 6px", borderRadius: "6px", fontSize: "14px", fontWeight: "600" }}>{currentQuestion.pos}</span>}
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

                    <div className="correct-meaning-details">
                      <span className="label">Nghĩa tiếng Việt:</span>
                      <span className="meaning-text" style={{ fontSize: "16px", fontWeight: "600", color: "#344054" }}>{currentQuestion.answer}</span>
                    </div>

                    {normalizeListeningAnswer(typedAnswer) !== normalizeListeningAnswer(currentQuestion.word) && (
                      <div className="user-typed-details">
                        <span className="label">Bạn đã nhập:</span>
                        <span className="user-typed-text">{typedAnswer || "(Trống)"}</span>
                      </div>
                    )}

                    {currentQuestion.example && (
                      <div className="correct-example-details" style={{ borderTop: "1px solid #eaecf0", paddingTop: "12px", marginTop: "4px" }}>
                        <span className="label">Ví dụ minh họa:</span>
                        <p className="example" style={{ margin: "4px 0 0 0", textAlign: "left", fontSize: "15px", color: "#475467", fontStyle: "italic" }}>
                          “{currentQuestion.example}”
                        </p>
                      </div>
                    )}

                    <div className="feedback-actions">
                      <button className="primary-button next-btn" onClick={handleNext}>
                        {currentIndex + 1 >= questionQueue.length ? "Xem kết quả" : "Câu tiếp theo"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    );
  }

  // 3. FINISHED SCREEN
  if (quizStatus === "finished") {
    return (
      <div className="quiz-flow-container">
        <div className="back-nav">
          <button className="ghost-button" onClick={handleBack}>
            <ArrowLeft size={16} /> Chọn buổi
          </button>
        </div>

        <section className="results-screen card">
          <div className="results-header">
            <Award className="award-icon" size={48} />
            <h2>Kết quả Luyện nghe</h2>
            <div className="score-display">
              <span className="score-num">{score10}</span>
              <span className="score-total">/ 10 điểm</span>
            </div>
            <p className="score-comment">{getScoreMessage(score10)}</p>
            {/* Trạng thái lưu kết quả Supabase */}
            <div className={`save-status-msg ${saveStatus}`}>
              {saveStatus === "not_logged_in" && "Đăng nhập để lưu tiến độ học."}
              {saveStatus === "saving" && "Đang lưu kết quả..."}
              {saveStatus === "success" && "Đã lưu kết quả học."}
              {saveStatus === "error" && `Không lưu được kết quả: ${saveErrorMsg}`}
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Tổng số câu</span>
              <span className="stat-val">{questionQueue.length}</span>
            </div>
            <div className="stat-card correct">
              <span className="stat-label">Đúng</span>
              <span className="stat-val">{correctCount}</span>
            </div>
            <div className="stat-card wrong">
              <span className="stat-label">Sai</span>
              <span className="stat-val">{questionQueue.length - correctCount}</span>
            </div>
          </div>

          <div className="wrong-review-box">
            <h3>Danh sách câu hỏi đã làm ({questionQueue.length} câu)</h3>
            <div className="review-table-wrapper">
              <table className="review-table">
                <thead>
                  <tr>
                    <th>Từ vựng</th>
                    <th>Loại từ</th>
                    <th>Nghĩa tiếng Việt</th>
                    <th>Bạn đã chọn/nhập</th>
                    <th>Kết quả</th>
                    <th>Nghe</th>
                  </tr>
                </thead>
                <tbody>
                  {answersLog.map((item, idx) => (
                    <tr key={idx} className="review-row">
                      <td>
                        <div className="review-word-info">
                          <span className="review-word">{item.word}</span>
                          <span className="review-ipa">{item.ipa}</span>
                        </div>
                      </td>
                      <td className="review-pos">{item.pos || ""}</td>
                      <td className="review-correct">{item.answer}</td>
                      <td>
                        {item.mode === "typing" ? (
                          item.isCorrect ? (
                            <span style={{ color: "#027a48", fontWeight: "600" }}>{item.typedAnswer || "(Trống)"}</span>
                          ) : (
                            <div className="review-typing-compare">
                              <span className="review-wrong" style={{ display: "block" }}>
                                Bạn nhập: <code className="typed-code">{item.typedAnswer || "(Trống)"}</code>
                              </span>
                              <span className="review-correct-label" style={{ display: "block", color: "#027a48", fontWeight: "600", marginTop: "4px" }}>
                                Đáp án đúng: <strong>{item.word}</strong>
                              </span>
                            </div>
                          )
                        ) : (
                          item.isCorrect ? (
                            <span style={{ color: "#027a48", fontWeight: "600" }}>{item.selectedAnswer || "(Bỏ qua)"}</span>
                          ) : (
                            <div className="review-typing-compare">
                              <span className="review-wrong" style={{ display: "block" }}>
                                Bạn chọn: <code className="typed-code">{item.selectedAnswer || "(Bỏ qua)"}</code>
                              </span>
                              <span className="review-correct-label" style={{ display: "block", color: "#027a48", fontWeight: "600", marginTop: "4px" }}>
                                Đáp án đúng: <strong>{item.word}</strong>
                              </span>
                            </div>
                          )
                        )}
                      </td>
                      <td>
                        {item.isCorrect ? (
                          <span className="status-label correct" style={{ fontSize: "14px" }}><CheckCircle2 size={16} /> Đúng</span>
                        ) : (
                          <span className="status-label wrong" style={{ fontSize: "14px" }}><XCircle size={16} /> Sai</span>
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

            {/* Mobile Cards Review Layout */}
            <div className="review-cards-list">
              {answersLog.map((item, idx) => (
                <div key={idx} className="review-card-item" style={{ borderLeft: item.isCorrect ? "4px solid #12b76a" : "4px solid #f04438" }}>
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
                      <span className="detail-label">Nghĩa tiếng Việt:</span>
                      <span className="detail-val review-correct">{item.answer}</span>
                    </div>
                    <div className="review-card-detail">
                      <div className="review-typing-compare-mobile" style={{ width: "100%" }}>
                        {item.mode === "typing" ? (
                          <>
                            <div>
                              <span className="detail-label">Bạn nhập:</span>
                              <span className={`detail-val ${item.isCorrect ? "review-correct" : "review-wrong"}`} style={{ marginLeft: "4px", textDecoration: item.isCorrect ? "none" : "line-through" }}>
                                {item.typedAnswer || "(Trống)"}
                              </span>
                            </div>
                            {!item.isCorrect && (
                              <div>
                                <span className="detail-label" style={{ color: "#027a48" }}>Đáp án đúng:</span>
                                <span className="detail-val" style={{ marginLeft: "4px", color: "#027a48", fontWeight: "bold" }}>
                                  {item.word}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="detail-label">Bạn chọn:</span>
                              <span className={`detail-val ${item.isCorrect ? "review-correct" : "review-wrong"}`} style={{ marginLeft: "4px", textDecoration: item.isCorrect ? "none" : "line-through" }}>
                                {item.selectedAnswer || "(Bỏ qua)"}
                              </span>
                            </div>
                            {!item.isCorrect && (
                              <div>
                                <span className="detail-label" style={{ color: "#027a48" }}>Đáp án đúng:</span>
                                <span className="detail-val" style={{ marginLeft: "4px", color: "#027a48", fontWeight: "bold" }}>
                                  {item.word}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="review-card-detail" style={{ marginTop: "4px" }}>
                      <span className="detail-label">Kết quả:</span>
                      {item.isCorrect ? (
                        <span className="status-label correct" style={{ fontSize: "13px", fontWeight: "700" }}><CheckCircle2 size={14} /> Đúng</span>
                      ) : (
                        <span className="status-label wrong" style={{ fontSize: "13px", fontWeight: "700" }}><XCircle size={14} /> Sai</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="results-actions">
            <button className="primary-button action-btn" onClick={handleStartListening}>
              <RefreshCw size={16} /> Luyện nghe lại
            </button>
            <button className="secondary-button action-btn" onClick={() => setQuizStatus("selecting")}>
              Chọn buổi khác
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
