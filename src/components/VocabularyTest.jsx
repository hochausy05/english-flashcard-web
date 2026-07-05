import { useState, useMemo, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  Volume2, 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  BookOpen, 
  ChevronRight, 
  RefreshCw, 
  Home as HomeIcon,
  Search,
  Filter,
  Grid
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getTestQuestions, checkVietnameseAnswer } from "../utils/vocabularyTestService.js";
import { saveStudyResultToSupabase } from "../utils/studyResultService.js";
import { speakWord } from "../utils/speech.js";

// Fixed Tests Configuration
const FIXED_TESTS = [
  {
    id: "foundation_mid",
    title: "Nền tảng - Giữa kỳ",
    courseCode: "foundation",
    startDay: 1,
    endDay: 9,
    description: "Kiểm tra toàn bộ từ vựng nửa đầu khóa Nền tảng.",
    badge: "9 Buổi",
    daysCount: 9,
  },
  {
    id: "foundation_final",
    title: "Nền tảng - Cuối kỳ",
    courseCode: "foundation",
    startDay: 1,
    endDay: 18,
    description: "Kiểm tra toàn bộ từ vựng khóa Nền tảng.",
    badge: "18 Buổi",
    daysCount: 18,
  },
  {
    id: "toeic1_mid",
    title: "TOEIC 1 - Giữa kỳ",
    courseCode: "toeic1",
    startDay: 1,
    endDay: 9,
    description: "Kiểm tra toàn bộ từ vựng nửa đầu khóa TOEIC 1.",
    badge: "9 Buổi",
    daysCount: 9,
  },
  {
    id: "toeic1_final",
    title: "TOEIC 1 - Cuối kỳ",
    courseCode: "toeic1",
    startDay: 1,
    endDay: 18,
    description: "Kiểm tra toàn bộ từ vựng khóa TOEIC 1.",
    badge: "18 Buổi",
    daysCount: 18,
  }
];

export function VocabularyTest({ cards = [], onBackHome, onOpenAuth }) {
  const { user } = useAuth();
  
  // Navigation states: "selecting" | "playing" | "finished"
  const [testStatus, setTestStatus] = useState("selecting");
  const [selectedTest, setSelectedTest] = useState(null);
  
  // Gameplay states
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({}); // card.id -> user typed string
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [showMobileNav, setShowMobileNav] = useState(false);
  
  // Results states
  const [results, setResults] = useState({
    total: 0,
    correct: 0,
    wrong: 0,
    blank: 0,
    score: 0,
    percentage: 0,
    details: [] // Array of { word, ipa, pos, userAnswer, correctAnswer, isCorrect, isBlank }
  });
  const [resultsFilter, setResultsFilter] = useState("all"); // "all" | "wrong" | "blank"

  // Pre-calculate word counts for all 4 tests in the selection screen
  const testsWithCounts = useMemo(() => {
    return FIXED_TESTS.map(test => {
      const testCards = getTestQuestions(cards, test.courseCode, test.startDay, test.endDay);
      return {
        ...test,
        wordCount: testCards.length
      };
    });
  }, [cards]);

  // Handle entering a test
  const handleStartTest = (test) => {
    const testQuestions = getTestQuestions(cards, test.courseCode, test.startDay, test.endDay);
    if (testQuestions.length === 0) return;
    
    setSelectedTest(test);
    setQuestions(testQuestions);
    
    // Initialize answers
    const initialAnswers = {};
    testQuestions.forEach(q => {
      initialAnswers[q.id] = "";
    });
    setUserAnswers(initialAnswers);
    setActiveQuestionIndex(0);
    setShowMobileNav(false);
    setTestStatus("playing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Scroll to question helper
  const scrollToQuestion = (index) => {
    setActiveQuestionIndex(index);
    
    const isFinished = testStatus === "finished";
    
    if (isFinished) {
      const item = results.details[index];
      if (!item) return;
      
      // If the clicked question is hidden under current filter, switch to 'all'
      let needsFilterReset = false;
      if (resultsFilter === "wrong" && (item.isCorrect || item.isBlank)) {
        needsFilterReset = true;
      } else if (resultsFilter === "blank" && !item.isBlank) {
        needsFilterReset = true;
      }
      
      if (needsFilterReset) {
        setResultsFilter("all");
        setTimeout(() => {
          const rowId = `review-row-${index}`;
          const mobCardId = `review-mob-card-${index}`;
          const isMobile = window.innerWidth <= 768;
          const targetId = isMobile ? mobCardId : rowId;
          const element = document.getElementById(targetId);
          if (element) {
            const headerOffset = isMobile ? 80 : 100;
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
          }
        }, 50);
        return;
      }
    }
    
    const rowId = isFinished ? `review-row-${index}` : `question-row-${index}`;
    const mobCardId = isFinished ? `review-mob-card-${index}` : `question-mob-card-${index}`;
    const isMobile = window.innerWidth <= 768;
    const targetId = isMobile ? mobCardId : rowId;
    const element = document.getElementById(targetId);
    
    if (element) {
      const headerOffset = isMobile ? 80 : 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      
      // If playing, focus the input field
      if (!isFinished) {
        const inputId = isMobile ? `mob-input-${index}` : `input-${index}`;
        const inputEl = document.getElementById(inputId);
        if (inputEl) {
          inputEl.focus({ preventScroll: true });
        }
      }
    }
  };

  // Input change handler
  const handleInputChange = (cardId, value) => {
    setUserAnswers(prev => ({
      ...prev,
      [cardId]: value
    }));
  };

  // Keyboard navigation: Enter moves focus to next input
  const handleKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextIdx = index + 1;
      if (nextIdx < questions.length) {
        scrollToQuestion(nextIdx);
      } else {
        // Focus submit button or blur
        const submitBtn = document.getElementById("submit-test-btn");
        if (submitBtn) {
          submitBtn.focus();
          submitBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  };

  // Count how many questions have been filled
  const filledCount = useMemo(() => {
    return Object.values(userAnswers).filter(ans => String(ans || "").trim().length > 0).length;
  }, [userAnswers]);

  // Submit trigger
  const handlePreSubmit = () => {
    const blankCount = questions.length - filledCount;
    if (blankCount > 0) {
      setShowConfirmModal(true);
    } else {
      processSubmission();
    }
  };

  // Evaluate & Save results
  const processSubmission = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    
    const details = [];
    let correct = 0;
    let wrong = 0;
    let blank = 0;
    const answersLog = [];

    questions.forEach((q, idx) => {
      const rawAns = userAnswers[q.id] || "";
      const isBlank = rawAns.trim().length === 0;
      const isCorrect = !isBlank && checkVietnameseAnswer(rawAns, q.answer);
      
      if (isCorrect) correct++;
      else if (isBlank) blank++;
      else wrong++;

      details.push({
        stt: idx + 1,
        id: q.id,
        word: q.word,
        ipa: q.ipa,
        pos: q.pos,
        audio: q.audio,
        userAnswer: rawAns,
        correctAnswer: q.answer,
        isCorrect,
        isBlank
      });

      // Prepare payload for study_answers
      answersLog.push({
        vocab_item_id: q.vocab_item_id || q.id,
        id: q.id,
        word: q.word,
        answer: q.answer,
        typedAnswer: rawAns,
        isCorrect: isCorrect
      });
    });

    const total = questions.length;
    const score = total > 0 ? Number(((correct / total) * 10).toFixed(1)) : 0;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    setResults({
      total,
      correct,
      wrong,
      blank,
      score,
      percentage,
      details
    });

    // Save session to cloud (if logged in)
    if (user && selectedTest) {
      // selectedDays array: e.g. ["1", "2", ..., "9"]
      const selectedDays = Array.from(
        { length: selectedTest.endDay - selectedTest.startDay + 1 },
        (_, i) => String(selectedTest.startDay + i)
      );

      try {
        await saveStudyResultToSupabase({
          user,
          courseCode: selectedTest.courseCode,
          selectedDays,
          mode: "vocabulary_test",
          totalQuestions: total,
          correctCount: correct,
          wrongCount: wrong,
          score,
          answersLog
        });
      } catch (err) {
        console.error("Failed to save test session:", err);
      }
    }

    setActiveQuestionIndex(0);
    setTestStatus("finished");
    setIsSubmitting(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset test state to do it again
  const handleRetakeTest = () => {
    if (!selectedTest) return;
    handleStartTest(selectedTest);
  };

  // Back to selection screen
  const handleBackToSelection = () => {
    setTestStatus("selecting");
    setSelectedTest(null);
    setQuestions([]);
    setUserAnswers({});
    setResultsFilter("all");
    setActiveQuestionIndex(0);
    setShowMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filtered results
  const filteredDetails = useMemo(() => {
    if (resultsFilter === "wrong") {
      return results.details.filter(d => !d.isCorrect && !d.isBlank);
    }
    if (resultsFilter === "blank") {
      return results.details.filter(d => d.isBlank);
    }
    return results.details;
  }, [results.details, resultsFilter]);

  return (
    <div className="vocab-test-container" id="vocab-test-component">
      
      {/* ====================================================================
         1. SELECTION STATE
         ==================================================================== */}
      {testStatus === "selecting" && (
        <>
          <header className="vocab-test-header">
            <button className="ghost-button back-btn" onClick={onBackHome}>
              <ArrowLeft size={16} /> Trang chủ
            </button>
            <div className="vocab-test-title-section">
              <div className="eyebrow-badge-wrapper">
                <span className="eyebrow-badge">
                  <Sparkles size={12} className="eyebrow-icon" />
                  KỲ THI ĐÁNH GIÁ NĂNG LỰC
                </span>
              </div>
              <h1 className="vocab-test-title">Kiểm tra từ vựng</h1>
              <p className="vocab-test-subtitle">
                Đánh giá vốn từ vựng bằng cách tự nhập nghĩa tiếng Việt. Chọn bài thi tương ứng bên dưới.
              </p>
            </div>
          </header>

          <main className="test-selection-grid">
            {testsWithCounts.map((test) => {
              const hasData = test.wordCount > 0;
              return (
                <div key={test.id} className="test-card-shell">
                  <div className="test-card-core">
                    <div className="test-card-header">
                      <span className="test-card-badge">{test.title.includes("Giữa kỳ") ? "Giữa kỳ" : "Cuối kỳ"}</span>
                      <span className="test-card-scope-badge">{test.badge}</span>
                    </div>
                    
                    <h3 className="test-card-title">{test.title}</h3>
                    <p className="test-card-description">{test.description}</p>
                    
                    <div className="test-card-meta">
                      <BookOpen size={16} className="test-card-meta-icon" />
                      <span>
                        Dự kiến: {hasData ? `${test.wordCount} từ vựng` : "Chưa tải từ vựng"}
                      </span>
                    </div>

                    {!hasData && (
                      <div className="test-card-warning">
                        <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                        Chưa có dữ liệu từ vựng cho bài kiểm tra này.
                      </div>
                    )}

                    <button
                      className="cta-button primary test-card-btn"
                      onClick={() => handleStartTest(test)}
                      disabled={!hasData}
                    >
                      Bắt đầu kiểm tra <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </main>
        </>
      )}

      {/* ====================================================================
         2. PLAYING STATE (GAMEPLAY)
         ==================================================================== */}
      {testStatus === "playing" && selectedTest && (
        <>
          <header className="vocab-test-header">
            <button className="ghost-button back-btn" onClick={handleBackToSelection}>
              <ArrowLeft size={16} /> Đổi bài kiểm tra
            </button>
            <div className="vocab-test-title-section">
              <h1 className="vocab-test-title">{selectedTest.title}</h1>
              <p className="vocab-test-subtitle">
                Phạm vi: {selectedTest.title.includes("Nền tảng") ? "Khóa Nền tảng" : "Khóa TOEIC 1"} (Buổi {selectedTest.startDay} đến Buổi {selectedTest.endDay})
              </p>
            </div>
          </header>
 
          <div className="test-gameplay-meta-bar">
            <div className="test-meta-info-item">
              <Clock size={16} className="text-muted" />
              <span>Thời gian làm bài: <strong>Không giới hạn</strong></span>
            </div>
            <div className="test-meta-info-item">
              <span>Đã nhập: <strong className="test-progress-pill">{filledCount} / {questions.length}</strong> từ vựng</span>
            </div>
          </div>

          <div className="test-taking-layout">
            
            {/* Desktop Left Sidebar: Question Navigator */}
            <aside className="test-question-sidebar">
              <div className="test-sidebar-card">
                <h3 className="test-sidebar-title">Bản đồ câu hỏi</h3>
                <div className="test-sidebar-grid">
                  {questions.map((q, idx) => {
                    const isAnswered = String(userAnswers[q.id] || "").trim().length > 0;
                    const isActive = activeQuestionIndex === idx;
                    let className = "test-nav-box";
                    if (isActive) className += " active";
                    else if (isAnswered) className += " answered";
                    
                    return (
                      <button
                        key={q.id}
                        type="button"
                        className={className}
                        onClick={() => scrollToQuestion(idx)}
                        title={`Câu ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="test-sidebar-legend">
                  <div className="legend-item">
                    <span className="legend-dot active"></span>
                    <span>Đang xem</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot answered"></span>
                    <span>Đã điền</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot blank"></span>
                    <span>Chưa điền</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right main content area */}
            <div className="test-main-content">
              {/* Desktop Table View */}
              <div className="test-table-wrapper">
                <table className="test-table">
                  <thead>
                    <tr>
                      <th className="test-cell-stt">STT</th>
                      <th>Từ tiếng Anh</th>
                      <th>Nghĩa tiếng Việt bạn nhập</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q, idx) => (
                      <tr 
                        key={q.id} 
                        id={`question-row-${idx}`}
                        className={activeQuestionIndex === idx ? "active-review-row" : ""}
                      >
                        <td className="test-cell-stt">{idx + 1}</td>
                        <td className="test-cell-word">
                          <div className="test-word-main">
                            <span>{q.word}</span>
                            {q.audio && (
                              <button 
                                className="test-audio-trigger" 
                                title="Nghe phát âm"
                                onClick={() => speakWord(q.word, q.audio)}
                              >
                                <Volume2 size={16} />
                              </button>
                            )}
                          </div>
                          <div className="test-word-meta">
                            {q.ipa && <span className="test-ipa">{q.ipa}</span>}
                            {q.pos && <span className="test-pos">({q.pos})</span>}
                          </div>
                        </td>
                        <td className="test-cell-input">
                          <input
                            id={`input-${idx}`}
                            type="text"
                            className="test-meaning-input"
                            placeholder="Nhập nghĩa tiếng Việt..."
                            value={userAnswers[q.id] || ""}
                            onChange={(e) => handleInputChange(q.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            onFocus={() => setActiveQuestionIndex(idx)}
                            autoComplete="off"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="test-mobile-list">
                {questions.map((q, idx) => (
                  <div 
                    key={q.id} 
                    id={`question-mob-card-${idx}`}
                    className={`test-mobile-card ${activeQuestionIndex === idx ? "active-review-card" : ""}`}
                  >
                    <div className="test-mobile-card-header">
                      <span className="test-mobile-stt">Từ {idx + 1} / {questions.length}</span>
                      {q.audio && (
                        <button 
                          className="test-audio-trigger" 
                          onClick={() => speakWord(q.word, q.audio)}
                        >
                          <Volume2 size={18} /> Nghe
                        </button>
                      )}
                    </div>
                    <div className="test-mobile-word-box" style={{ marginBottom: '12px' }}>
                      <h3 className="test-word-main" style={{ fontSize: '18px' }}>{q.word}</h3>
                      <div className="test-word-meta">
                        {q.ipa && <span className="test-ipa">{q.ipa}</span>}
                        {q.pos && <span className="test-pos">({q.pos})</span>}
                      </div>
                    </div>
                    <input
                      id={`mob-input-${idx}`}
                      type="text"
                      className="test-meaning-input"
                      placeholder="Nhập nghĩa tiếng Việt..."
                      value={userAnswers[q.id] || ""}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const nextIdx = idx + 1;
                          if (nextIdx < questions.length) {
                            scrollToQuestion(nextIdx);
                          } else {
                            document.getElementById("submit-test-btn")?.focus();
                          }
                        }
                      }}
                      onFocus={() => setActiveQuestionIndex(idx)}
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Bar */}
          <div className="test-sticky-bar">
            <div className="test-sticky-content">
              <div className="test-sticky-status-group">
                <div className="test-sticky-status">
                  Tiến độ: <strong>{filledCount} / {questions.length}</strong> từ đã nhập
                </div>
                <button 
                  type="button"
                  className="mobile-nav-toggle-btn"
                  onClick={() => setShowMobileNav(true)}
                  title="Mở bản đồ câu hỏi"
                >
                  <Grid size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Bản đồ câu
                </button>
              </div>
              <button 
                id="submit-test-btn"
                className="cta-button primary test-submit-btn"
                onClick={handlePreSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang chấm điểm..." : "Nộp bài"}
              </button>
            </div>
          </div>

          {/* Mobile Drawer Overlay */}
          {showMobileNav && (
            <div className="mobile-nav-overlay" onClick={() => setShowMobileNav(false)}>
              <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="mobile-nav-drawer-header">
                  <h3>Bản đồ câu hỏi</h3>
                  <button className="mobile-nav-close-btn" onClick={() => setShowMobileNav(false)}>✕</button>
                </div>
                <div className="mobile-nav-drawer-body">
                  <div className="test-sidebar-grid">
                    {questions.map((q, idx) => {
                      const isAnswered = String(userAnswers[q.id] || "").trim().length > 0;
                      const isActive = activeQuestionIndex === idx;
                      let className = "test-nav-box";
                      if (isActive) className += " active";
                      else if (isAnswered) className += " answered";
                      
                      return (
                        <button
                          key={q.id}
                          type="button"
                          className={className}
                          onClick={() => {
                            scrollToQuestion(idx);
                            setShowMobileNav(false);
                          }}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div className="test-sidebar-legend">
                    <div className="legend-item">
                      <span className="legend-dot active"></span>
                      <span>Đang xem</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot answered"></span>
                      <span>Đã điền</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot blank"></span>
                      <span>Chưa điền</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Unsaved Warning Confirm Modal */}
          {showConfirmModal && (
            <div className="test-modal-overlay" onClick={() => setShowConfirmModal(false)}>
              <div className="test-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="test-modal-icon-wrapper">
                  <AlertCircle size={24} />
                </div>
                <h3 className="test-modal-title">Chưa hoàn thành bài thi</h3>
                <p className="test-modal-desc">
                  Bạn còn <strong>{questions.length - filledCount}</strong> từ chưa nhập nghĩa tiếng Việt. Bạn vẫn muốn nộp bài chứ?
                </p>
                <div className="test-modal-actions">
                  <button className="secondary-button" onClick={() => setShowConfirmModal(false)}>
                    Làm tiếp
                  </button>
                  <button className="primary-button" style={{ background: 'var(--color-primary)' }} onClick={processSubmission}>
                    Vẫn nộp bài
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ====================================================================
         3. FINISHED STATE (RESULTS)
         ==================================================================== */}
      {testStatus === "finished" && selectedTest && (
        <>
          <header className="vocab-test-header">
            <button className="ghost-button back-btn" onClick={handleBackToSelection}>
              <ArrowLeft size={16} /> Về trang chọn bài
            </button>
            <div className="vocab-test-title-section">
              <h1 className="vocab-test-title">Kết quả kiểm tra</h1>
              <p className="vocab-test-subtitle">
                Bài kiểm tra: {selectedTest.title} (Buổi {selectedTest.startDay} - {selectedTest.endDay})
              </p>
            </div>
          </header>

          <div className="test-results-card-shell">
            <div className="test-results-card">
              <div className="test-results-layout">
                
                <div className="test-score-section">
                  <div className="test-score-circle">
                    <span className="test-score-val">{results.score}</span>
                    <span className="test-score-lbl">Điểm số</span>
                  </div>
                  <span className="test-score-percentage">Tỷ lệ đúng: {results.percentage}%</span>
                </div>

                <div className="test-stats-grid">
                  <div className="test-stat-pill">
                    <span className="test-stat-pill-num">{results.total}</span>
                    <span className="test-stat-pill-lbl">Tổng số từ</span>
                  </div>
                  <div className="test-stat-pill">
                    <span className="test-stat-pill-num correct">{results.correct}</span>
                    <span className="test-stat-pill-lbl">Trả lời đúng</span>
                  </div>
                  <div className="test-stat-pill">
                    <span className="test-stat-pill-num wrong">{results.wrong}</span>
                    <span className="test-stat-pill-lbl">Trả lời sai</span>
                  </div>
                  <div className="test-stat-pill">
                    <span className="test-stat-pill-num blank">{results.blank}</span>
                    <span className="test-stat-pill-lbl">Bỏ trống</span>
                  </div>
                </div>

              </div>

              {!user && (
                <div className="test-guest-banner" style={{ marginTop: '24px' }}>
                  💡 Đăng nhập để lưu kết quả kiểm tra lên tài khoản và theo dõi biểu đồ tiến trình.
                  <button 
                    className="ghost-button" 
                    onClick={onOpenAuth}
                    style={{ fontSize: '13px', marginLeft: '12px', padding: '6px 12px', color: 'var(--color-warning)' }}
                  >
                    Đăng nhập
                  </button>
                </div>
              )}

              <div className="test-result-actions" style={{ marginTop: '24px' }}>
                <button className="primary-button" onClick={handleRetakeTest} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={16} /> Làm lại bài kiểm tra
                </button>
                <button className="secondary-button" onClick={onBackHome} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HomeIcon size={16} /> Về trang chủ
                </button>
              </div>
            </div>
          </div>

          {/* Details review list */}
          <h2 className="test-review-section-title">Chi tiết bài thi</h2>

          <div className="test-taking-layout">
            
            {/* Desktop Left Sidebar: Results Navigator */}
            <aside className="test-question-sidebar">
              <div className="test-sidebar-card">
                <h3 className="test-sidebar-title">Bản đồ kết quả</h3>
                <div className="test-sidebar-grid">
                  {results.details.map((item, idx) => {
                    const isActive = activeQuestionIndex === idx;
                    let className = "test-nav-box";
                    if (isActive) className += " active";
                    if (item.isCorrect) className += " correct";
                    else if (item.isBlank) className += " blank";
                    else className += " wrong";
                    
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={className}
                        onClick={() => scrollToQuestion(idx)}
                        title={`Câu ${item.stt}: ${item.word}`}
                      >
                        {item.stt}
                      </button>
                    );
                  })}
                </div>
                <div className="test-sidebar-legend">
                  <div className="legend-item">
                    <span className="legend-dot correct"></span>
                    <span>Đúng</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot wrong"></span>
                    <span>Sai</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot blank"></span>
                    <span>Bỏ trống</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right content area */}
            <div className="test-main-content">
              <div className="test-filter-bar">
                <button 
                  className={`test-filter-btn ${resultsFilter === "all" ? "active" : ""}`}
                  onClick={() => setResultsFilter("all")}
                >
                  Tất cả ({results.details.length})
                </button>
                <button 
                  className={`test-filter-btn ${resultsFilter === "wrong" ? "active" : ""}`}
                  onClick={() => setResultsFilter("wrong")}
                >
                  Chỉ câu sai ({results.details.filter(d => !d.isCorrect && !d.isBlank).length})
                </button>
                <button 
                  className={`test-filter-btn ${resultsFilter === "blank" ? "active" : ""}`}
                  onClick={() => setResultsFilter("blank")}
                >
                  Chỉ câu bỏ trống ({results.details.filter(d => d.isBlank).length})
                </button>
              </div>

              {/* Desktop Table View */}
              <div className="test-table-wrapper" style={{ marginBottom: '40px' }}>
                <table className="test-table">
                  <thead>
                    <tr>
                      <th className="test-cell-stt">STT</th>
                      <th>Từ tiếng Anh</th>
                      <th>Nghĩa bạn nhập</th>
                      <th>Đáp án đúng</th>
                      <th>Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDetails.map((item) => {
                      const idx = item.stt - 1;
                      return (
                        <tr 
                          key={item.id}
                          id={`review-row-${idx}`}
                          className={activeQuestionIndex === idx ? "active-review-row" : ""}
                          onClick={() => setActiveQuestionIndex(idx)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="test-cell-stt">{item.stt}</td>
                          <td className="test-cell-word">
                            <div className="test-word-main">
                              <span>{item.word}</span>
                              {item.audio && (
                                <button 
                                  className="test-audio-trigger" 
                                  onClick={(e) => { e.stopPropagation(); speakWord(item.word, item.audio); }}
                                >
                                  <Volume2 size={14} />
                                </button>
                              )}
                            </div>
                            <div className="test-word-meta">
                              {item.ipa && <span className="test-ipa">{item.ipa}</span>}
                              {item.pos && <span className="test-pos">({item.pos})</span>}
                            </div>
                          </td>
                          <td>
                            {item.isBlank ? (
                              <span className="text-muted" style={{ fontStyle: 'italic' }}>(Bỏ trống)</span>
                            ) : (
                              <span className={item.isCorrect ? "text-success-meaning" : "text-error-meaning"}>
                                {item.userAnswer}
                              </span>
                            )}
                          </td>
                          <td>{item.correctAnswer}</td>
                          <td>
                            {item.isCorrect ? (
                              <span className="test-status-badge correct">Đúng</span>
                            ) : item.isBlank ? (
                              <span className="test-status-badge blank">Bỏ trống</span>
                            ) : (
                              <span className="test-status-badge wrong">Sai</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredDetails.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-light)' }}>
                          Không có câu trả lời nào khớp với bộ lọc này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Detailed Answers List */}
              <div className="test-mobile-list" style={{ display: results.details.length > 0 ? undefined : 'none', marginBottom: '40px' }}>
                {filteredDetails.map((item) => {
                  const idx = item.stt - 1;
                  return (
                    <div 
                      key={item.id} 
                      id={`review-mob-card-${idx}`}
                      className={`test-mobile-card ${activeQuestionIndex === idx ? "active-review-card" : ""}`}
                      onClick={() => setActiveQuestionIndex(idx)}
                      style={{ 
                        borderLeft: item.isCorrect ? '4px solid var(--color-success)' : (item.isBlank ? '4px solid var(--color-text-light)' : '4px solid var(--color-error)'),
                        cursor: 'pointer'
                      }}
                    >
                      <div className="test-mobile-card-header">
                        <span className="test-mobile-stt">Từ {item.stt}</span>
                        {item.isCorrect ? (
                          <span className="test-status-badge correct">Đúng</span>
                        ) : item.isBlank ? (
                          <span className="test-status-badge blank">Bỏ trống</span>
                        ) : (
                          <span className="test-status-badge wrong">Sai</span>
                        )}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <h4 className="test-word-main" style={{ fontSize: '16px' }}>
                          {item.word}
                          {item.audio && (
                            <button 
                              className="test-audio-trigger" 
                              onClick={(e) => { e.stopPropagation(); speakWord(item.word, item.audio); }} 
                              style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: '4px' }}
                            >
                              <Volume2 size={14} />
                            </button>
                          )}
                        </h4>
                        <div className="test-word-meta">
                          {item.ipa && <span className="test-ipa">{item.ipa}</span>}
                          {item.pos && <span className="test-pos">({item.pos})</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                        <div><strong>Bạn nhập:</strong> {item.isBlank ? <span className="text-muted" style={{ fontStyle: 'italic' }}>(Bỏ trống)</span> : <span className={item.isCorrect ? "text-success-meaning" : "text-error-meaning"}>{item.userAnswer}</span>}</div>
                        <div><strong>Đáp án đúng:</strong> {item.correctAnswer}</div>
                      </div>
                    </div>
                  );
                })}
                {filteredDetails.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-light)' }}>
                    Không có câu trả lời nào khớp với bộ lọc này.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Floating Map Button for Finished Screen */}
          <button 
            type="button"
            className="mobile-floating-map-btn"
            onClick={() => setShowMobileNav(true)}
            title="Xem bản đồ kết quả"
          >
            <Grid size={20} />
          </button>

          {/* Mobile Drawer Overlay for Finished Screen */}
          {showMobileNav && (
            <div className="mobile-nav-overlay" onClick={() => setShowMobileNav(false)}>
              <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="mobile-nav-drawer-header">
                  <h3>Bản đồ kết quả</h3>
                  <button className="mobile-nav-close-btn" onClick={() => setShowMobileNav(false)}>✕</button>
                </div>
                <div className="mobile-nav-drawer-body">
                  <div className="test-sidebar-grid">
                    {results.details.map((item, idx) => {
                      const isActive = activeQuestionIndex === idx;
                      let className = "test-nav-box";
                      if (isActive) className += " active";
                      if (item.isCorrect) className += " correct";
                      else if (item.isBlank) className += " blank";
                      else className += " wrong";
                      
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={className}
                          onClick={() => {
                            scrollToQuestion(idx);
                            setShowMobileNav(false);
                          }}
                        >
                          {item.stt}
                        </button>
                      );
                    })}
                  </div>
                  <div className="test-sidebar-legend">
                    <div className="legend-item">
                      <span className="legend-dot correct"></span>
                      <span>Đúng</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot wrong"></span>
                      <span>Sai</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot blank"></span>
                      <span>Bỏ trống</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
