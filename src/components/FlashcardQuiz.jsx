import { useMemo, useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, CheckCircle2, XCircle, ArrowLeft, Play, Calendar, Award, RefreshCw, Layers } from "lucide-react";
import { createQuestion } from "../utils/createQuestion.js";
import { speakWord } from "../utils/speech.js";
import { playFeedbackSound } from "../utils/feedbackSound.js";

// Hàm helper để xáo trộn mảng dùng Fisher-Yates
function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Hàm normalize đáp án nhập tiếng Anh
function normalizeTypingAnswer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ");
}

// Hàm ẩn từ cần đoán trong câu ví dụ
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

export function FlashcardQuiz({ cards, onBackHome, initialCourse }) {
  const [quizStatus, setQuizStatus] = useState("selecting"); // "selecting" | "playing" | "finished"
  const [selectedCourse, setSelectedCourse] = useState(initialCourse || "foundation");
  const [selectedDays, setSelectedDays] = useState([]);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersLog, setAnswersLog] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isDaysExpanded, setIsDaysExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("flashcard_feedback_sound_enabled");
    return saved !== null ? saved === "true" : true;
  });

  const [quizMode, setQuizMode] = useState("multipleChoice"); // "multipleChoice" | "typing"
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isAnsweredState, setIsAnsweredState] = useState(false);
  const inputRef = useRef(null);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("flashcard_feedback_sound_enabled", String(next));
      return next;
    });
  };

  // Tự động focus vào ô input khi chuyển sang câu mới ở chế độ gõ
  useEffect(() => {
    if (quizStatus === "playing" && quizMode === "typing" && inputRef.current) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [currentIndex, quizStatus, quizMode]);


  // Gom nhóm các từ vựng theo buổi học (day) thuộc course đang chọn để hiển thị ở màn chọn buổi
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

  const isAnswered = quizMode === "multipleChoice" ? selectedAnswer !== null : isAnsweredState;

  // Lấy câu hỏi hiện tại từ questionQueue
  const currentQuestion = useMemo(() => {
    if (questionQueue.length === 0 || currentIndex >= questionQueue.length) {
      return null;
    }
    return questionQueue[currentIndex];
  }, [questionQueue, currentIndex]);

  // Lấy số câu đúng hiện tại
  const correctCount = useMemo(() => {
    return answersLog.filter((item) => item.isCorrect).length;
  }, [answersLog]);

  // Lọc các từ trả lời sai để hiển thị ôn tập ở màn kết quả
  const incorrectAnswers = useMemo(() => {
    return answersLog.filter((item) => !item.isCorrect);
  }, [answersLog]);

  // Tính điểm hệ 10
  const score10 = useMemo(() => {
    if (questionQueue.length === 0) return 0;
    const raw = (correctCount / questionQueue.length) * 10;
    return Number(raw.toFixed(1)); // Làm tròn 1 chữ số thập phân, tự động rút gọn số nguyên như 10.0 -> 10
  }, [correctCount, questionQueue]);

  // Hàm chuyển đổi toggle chọn bộ học
  function handleSelectCourse(course) {
    if (course !== selectedCourse) {
      setSelectedCourse(course);
      setSelectedDays([]); // Xóa các ngày đã chọn để không lẫn lộn giữa các bộ học
      setIsDaysExpanded(false);
    }
  }

  // Hàm chuyển đổi toggle chọn buổi
  function handleToggleDay(day) {
    if (selectedDays.includes(day)) {
      setSelectedDays((prev) => prev.filter((d) => d !== day));
    } else {
      setSelectedDays((prev) => [...prev, day]);
    }
  }

  // Chọn hoặc bỏ chọn toàn bộ
  function handleToggleSelectAll() {
    if (selectedDays.length === daysInfo.length) {
      setSelectedDays([]);
    } else {
      setSelectedDays(daysInfo.map((d) => d.day));
    }
  }

  // Khởi động lượt học từ các buổi được chọn
  function handleStartQuiz() {
    if (selectedDays.length === 0) return;

    // Lọc ra các card thuộc course và buổi học được chọn
    const sessionCards = cards.filter(
      (card) => card.course === selectedCourse && selectedDays.includes(card.day)
    );

    if (sessionCards.length === 0) {
      alert("Không tìm thấy từ vựng nào thuộc các buổi học đã chọn. Vui lòng tải lại trang để cập nhật hoặc chọn buổi khác!");
      return;
    }

    // Xáo trộn danh sách câu hỏi chính một lần duy nhất
    const shuffledSession = shuffle(sessionCards);

    // Tạo queue câu hỏi, tính toán trước 4 phương án cho mỗi câu để tránh shuffle lại khi render
    const queue = shuffledSession.map((card) => {
      return createQuestion(card, sessionCards, cards);
    });

    setQuestionQueue(queue);
    setCurrentIndex(0);
    setAnswersLog([]);
    setSelectedAnswer(null);
    setTypedAnswer("");
    setIsAnsweredState(false);
    setQuizStatus("playing");
  }

  // Chọn một đáp án (Chế độ trắc nghiệm)
  function handleSelect(option) {
    if (isAnswered) return;

    setSelectedAnswer(option);
    const isCorrect = option === currentQuestion.answer;

    if (soundEnabled) {
      playFeedbackSound(isCorrect);
    }

    // Lưu vào answersLog
    setAnswersLog((prev) => [
      ...prev,
      {
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
  }

  // Kiểm tra đáp án nhập (Chế độ gõ)
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

    // Lưu vào answersLog
    setAnswersLog((prev) => [
      ...prev,
      {
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

  // Chuyển câu hỏi hoặc kết thúc
  function handleNext() {
    if (currentIndex + 1 >= questionQueue.length) {
      setQuizStatus("finished");
    } else {
      setSelectedAnswer(null);
      setTypedAnswer("");
      setIsAnsweredState(false);
      setCurrentIndex((prev) => prev + 1);
    }
  }

  // Nút quay lại của từng màn hình
  function handleBack() {
    if (quizStatus === "playing") {
      if (confirm("Bạn có chắc muốn dừng bài học và quay lại màn chọn buổi không?")) {
        setQuizStatus("selecting");
      }
    } else if (quizStatus === "finished") {
      setQuizStatus("selecting");
    } else {
      onBackHome();
    }
  }

  // Trả về thông điệp nhận xét theo điểm số
  function getScoreMessage(score) {
    if (score >= 9) return "Xuất sắc! 🎉";
    if (score >= 7.5) return "Tuyệt vời! 👍";
    if (score >= 5) return "Khá tốt! 💪";
    return "Cần cố gắng thêm! 📚";
  }

  // --- RENDERING SCREENS ---

  // 1. Màn hình chọn buổi học (Selecting Screen)
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
            <h2>Chọn buổi học từ vựng</h2>
            <p className="subtitle">
              Chọn một hoặc nhiều buổi học bằng checkbox để bắt đầu ôn luyện. Hệ thống sẽ trộn câu hỏi từ các buổi đã chọn.
            </p>
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
                  return (
                    <div
                      key={info.day}
                      className={`day-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleToggleDay(info.day)}
                    >
                      <div className="day-card-left">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleDay(info.day)}
                          onClick={(e) => e.stopPropagation()} // Chống bubble để tránh kích hoạt click của cả card
                        />
                        <div className="day-info">
                          <span className="day-title">Buổi {info.day}</span>
                          <span className="day-count">{info.count} từ vựng</span>
                        </div>
                      </div>
                      <Calendar className="day-card-icon" size={20} />
                    </div>
                  );
                })}
              </div>
            </div>
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
              disabled={selectedDays.length === 0}
              onClick={handleStartQuiz}
            >
              <Play size={18} fill="white" /> Bắt đầu học
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
            onClick={handleStartQuiz}
          >
            Bắt đầu học
          </button>
        </div>
      </div>
    );
  }

  // 2. Màn hình ôn luyện (Playing Quiz Screen)
  if (quizStatus === "playing") {
    if (!currentQuestion) {
      return (
        <div className="quiz-flow-container">
          <div className="back-nav">
            <button className="ghost-button" onClick={handleBack}>
              <ArrowLeft size={16} /> Quay lại
            </button>
          </div>
          <section className="quiz card" style={{ padding: '36px', textAlign: 'center' }}>
            <h3 style={{ color: '#b42318', marginBottom: '12px' }}>Không có dữ liệu câu hỏi</h3>
            <p style={{ color: '#475467', marginBottom: '24px' }}>
              Không tìm thấy từ vựng nào thuộc các buổi học đã chọn. Vui lòng thử tải lại trang hoặc chọn buổi học khác.
            </p>
            <button className="primary-button" onClick={() => setQuizStatus("selecting")}>
              Chọn buổi học khác
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

          {quizMode === "multipleChoice" ? (
            <>
              <div className="word-box">
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

              <p className="example">“{currentQuestion.example || "Chưa có câu ví dụ."}”</p>

              <div className="options">
                {currentQuestion.options.map((option) => {
                  const isThisCorrect = option === currentQuestion.answer;
                  const isThisSelected = option === selectedAnswer;

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
                      <span>{option}</span>
                      {isAnswered && isThisCorrect && <CheckCircle2 size={20} />}
                      {isAnswered && isThisSelected && !isThisCorrect && <XCircle size={20} />}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div className="result-box">
                  <p className={isCorrect ? "result correct-text" : "result wrong-text"}>
                    {isCorrect ? "Chính xác." : `Sai rồi. Đáp án đúng là: ${currentQuestion.answer}`}
                  </p>
                  <button className="primary-button" onClick={handleNext}>
                    {currentIndex + 1 >= questionQueue.length ? "Xem kết quả" : "Câu tiếp theo"}
                  </button>
                </div>
              )}
            </>
          ) : (
            // Chế độ gõ nhập tiếng Anh
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

  // 3. Màn hình kết quả (Finished/Result Screen)
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
            <h2>Kết quả buổi học</h2>
            <div className="score-display">
              <span className="score-num">{score10}</span>
              <span className="score-total">/ 10 điểm</span>
            </div>
            <p className="score-comment">{getScoreMessage(score10)}</p>
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
              <span className="stat-val">{incorrectAnswers.length}</span>
            </div>
          </div>

          {incorrectAnswers.length > 0 && (
            <div className="wrong-review-box">
              <h3>Danh sách từ làm sai cần ôn tập ({incorrectAnswers.length} từ)</h3>
              <div className="review-table-wrapper">
                <table className="review-table">
                  <thead>
                    <tr>
                      <th>Từ vựng</th>
                      <th>Loại từ</th>
                      <th>{quizMode === "typing" ? "Nghĩa tiếng Việt" : "Nghĩa chuẩn"}</th>
                      <th>{quizMode === "typing" ? "Kết quả nhập" : "Lựa chọn của bạn"}</th>
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

              {/* Giao diện danh sách card cho mobile */}
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
            <button className="primary-button action-btn" onClick={handleStartQuiz}>
              <RefreshCw size={16} /> Học lại buổi này
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
