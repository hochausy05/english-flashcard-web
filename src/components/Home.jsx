import { useMemo, useState, useEffect } from "react";
import { BookOpen, Headphones, GraduationCap, XCircle, Trophy, BookCheck, ArrowRight, Sparkles, Compass, User, LogOut, LogIn, BarChart3, Settings, Menu, X, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getStudyRecommendation } from "../utils/continueStudyService.js";

const SAMPLE_HERO_WORDS = [
  {
    word: "Afford",
    ipa: "/əˈfɔːd/",
    pos: "verb",
    answer: "Có đủ khả năng chi trả (tiền bạc, thời gian)",
    example: "We can't afford to buy a new car.",
    label: "TOEIC 1 · Buổi 1"
  },
  {
    word: "Require",
    ipa: "/rɪˈkwaɪə(r)/",
    pos: "verb",
    answer: "Yêu cầu, đòi hỏi",
    example: "These rules require everyone to register.",
    label: "Nền tảng · Buổi 2"
  },
  {
    word: "Promise",
    ipa: "/ˈprɒmɪs/",
    pos: "verb / noun",
    answer: "Hứa hẹn, lời hứa",
    example: "He promised to help me with my homework.",
    label: "TOEIC 1 · Buổi 3"
  },
  {
    word: "Protect",
    ipa: "/prəˈtekt/",
    pos: "verb",
    answer: "Bảo vệ, che chở",
    example: "You should wear sunglasses to protect your eyes.",
    label: "Nền tảng · Buổi 4"
  },
  {
    word: "Compare",
    ipa: "/kəmˈpeə(r)/",
    pos: "verb",
    answer: "So sánh, đối chiếu",
    example: "It is difficult to compare these two products.",
    label: "TOEIC 1 · Buổi 5"
  }
];

export function Home(props) {
  const { user, profile, isAdmin, signOut, getDisplayName } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    cards = [],
    onOpenFlashcard,
    onOpenVocabularyReview,
    onOpenListeningPractice,
    onOpenAuth,
    onOpenProgress,
    onOpenWrongWords,
    onOpenAdmin,
    onNavigate
  } = props;

  // Hero card rotation
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [loadingRec, setLoadingRec] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchRec() {
      setLoadingRec(true);
      try {
        const rec = await getStudyRecommendation(user ? user.id : null, cards);
        if (isMounted) {
          setRecommendation(rec);
        }
      } catch (err) {
        console.error("Failed to load today study recommendation:", err);
      } finally {
        if (isMounted) {
          setLoadingRec(false);
        }
      }
    }
    fetchRec();
    return () => {
      isMounted = false;
    };
  }, [user, cards]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return;
    }

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentWordIdx((prevIdx) => (prevIdx + 1) % SAMPLE_HERO_WORDS.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentHeroWord = SAMPLE_HERO_WORDS[currentWordIdx];

  // 1. Calculate dynamic statistics
  const stats = useMemo(() => {
    if (!cards || cards.length === 0) {
      return { courses: 2, words: 567, sessions: 36 };
    }
    // Unique courses
    const coursesList = [...new Set(cards.map((c) => c.course).filter(Boolean))];
    const coursesCount = coursesList.length || 2;
    
    // Total words
    const wordsCount = cards.length;
    
    // Total sessions (unique course + day combination)
    const sessionKeys = new Set();
    cards.forEach((c) => {
      if (c.course && c.day) {
        sessionKeys.add(`${c.course}-${c.day}`);
      }
    });
    const sessionsCount = sessionKeys.size || 36;

    return {
      courses: coursesCount,
      words: wordsCount,
      sessions: sessionsCount,
    };
  }, [cards]);

  return (
    <div className="home-container">
      {/* Auth Status Header */}
      <header className="home-auth-header">
        <div className="header-top-row">
          <div className="auth-status-info">
            {user ? (
              <div className="auth-user-info-badge">
                <User size={16} className="auth-user-icon" />
                <span className="auth-user-email">Xin chào, <strong>{getDisplayName(user, profile)}</strong></span>
              </div>
            ) : (
              <span className="auth-user-guest">Bạn chưa đăng nhập</span>
            )}
          </div>

          {/* Desktop actions - shown inline on desktop */}
          <div className="auth-status-actions desktop-nav">
            {user && isAdmin === true && (
              <button
                type="button"
                className="auth-action-btn admin-btn"
                onClick={() => {
                  if (typeof props.onOpenAdmin === "function") {
                    props.onOpenAdmin();
                  } else if (typeof props.onNavigate === "function") {
                    props.onNavigate("admin");
                  }
                }}
              >
                <Settings size={16} /> Quản trị
              </button>
            )}
            <button className="home-leaderboard-btn" onClick={() => onNavigate("leaderboard")} id="home-leaderboard-btn">
              <Trophy size={16} /> Xếp hạng
            </button>
            {user && (
              <button className="home-progress-btn" onClick={onOpenProgress} id="home-progress-btn">
                <BarChart3 size={16} /> Tiến trình
              </button>
            )}
            {user ? (
              <button className="auth-btn logout" onClick={signOut}>
                <LogOut size={14} /> Đăng xuất
              </button>
            ) : (
              <button className="auth-btn login" onClick={onOpenAuth}>
                <LogIn size={14} /> Đăng nhập
              </button>
            )}
          </div>

          {/* Mobile hamburger toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile dropdown nav */}
        {mobileMenuOpen && (
          <nav className="mobile-nav-dropdown">
            {user && isAdmin === true && (
              <button
                type="button"
                className="mobile-nav-item"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (typeof props.onOpenAdmin === "function") props.onOpenAdmin();
                  else if (typeof props.onNavigate === "function") props.onNavigate("admin");
                }}
              >
                <Settings size={18} /> Quản trị
              </button>
            )}
            <button className="mobile-nav-item" onClick={() => { setMobileMenuOpen(false); onNavigate("leaderboard"); }}>
              <Trophy size={18} /> Bảng xếp hạng
            </button>
            {user && (
              <button className="mobile-nav-item" onClick={() => { setMobileMenuOpen(false); onOpenProgress(); }}>
                <BarChart3 size={18} /> Tiến trình học tập
              </button>
            )}
            {user ? (
              <button className="mobile-nav-item mobile-nav-danger" onClick={() => { setMobileMenuOpen(false); signOut(); }}>
                <LogOut size={18} /> Đăng xuất
              </button>
            ) : (
              <button className="mobile-nav-item mobile-nav-primary" onClick={() => { setMobileMenuOpen(false); onOpenAuth(); }}>
                <LogIn size={18} /> Đăng nhập
              </button>
            )}
          </nav>
        )}
      </header>


      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="eyebrow-badge-wrapper">
            <span className="eyebrow-badge">
              <Sparkles size={12} className="eyebrow-icon" />
              ENGLISH LEARNING HUB
            </span>
          </div>
          <h1 className="hero-title">
            Học tiếng Anh<br />mỗi ngày
          </h1>
          <p className="hero-subtitle">
            Luyện từ vựng, ôn tập và kiểm tra nhanh theo từng lộ trình học được cá nhân hóa cho bạn.
          </p>
          <div className="hero-cta">
            <button className="cta-button primary" onClick={() => onOpenFlashcard()}>
              Bắt đầu học <ArrowRight size={16} />
            </button>
            <button className="cta-button secondary" onClick={() => onOpenVocabularyReview()}>
              Ôn từ vựng
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="mock-card-stack">
            <div className="mock-card card-3"></div>
            <div className="mock-card card-2"></div>
            <div className={`mock-card card-1 ${isTransitioning ? "transitioning" : ""}`}>
              <div className="mock-card-inner">
                <div className="mock-card-header">
                  <span className="mock-card-pos">{currentHeroWord.pos}</span>
                  <span className="mock-card-topic">{currentHeroWord.label}</span>
                </div>
                <h2 className="mock-card-word">{currentHeroWord.word}</h2>
                <p className="mock-card-ipa">{currentHeroWord.ipa}</p>
                <div className="mock-card-divider"></div>
                <p className="mock-card-meaning">{currentHeroWord.answer}</p>
                <p className="mock-card-example">"{currentHeroWord.example}"</p>
                <div className="mock-card-footer">
                  <div className="mock-speaker-icon">
                    <BookOpen size={16} />
                  </div>
                  <span className="mock-card-hint">Từ vựng thông dụng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Stats Dashboard */}
      <section className="stats-section">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-glow"></div>
          <span className="stat-number">{stats.courses}</span>
          <span className="stat-label">Khóa học hiện có</span>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-glow"></div>
          <span className="stat-number">{stats.words}+</span>
          <span className="stat-label">Từ vựng chất lượng</span>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-glow"></div>
          <span className="stat-number">{stats.sessions}</span>
          <span className="stat-label">Buổi học được thiết lập</span>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-glow"></div>
          <span className="stat-number">3 Chế độ</span>
          <span className="stat-label">Quiz, Review & Nghe</span>
        </div>
      </section>

      {/* Personalized Study Recommendation Card */}
      <section className="recommendation-section">
        <div className="recommendation-card card">
          <div className="rec-glow-bg"></div>
          {loadingRec ? (
            <div className="rec-loading">
              <RefreshCw className="spinner-icon" size={20} />
              <span>Đang tìm lộ trình phù hợp...</span>
            </div>
          ) : recommendation ? (
            <div className="rec-content-layout">
              {recommendation.type === "due" && (
                <div className="rec-inner-box">
                  <div className="rec-badge warning">
                    <RefreshCw size={12} /> Lịch ôn tập hôm nay
                  </div>
                  <div className="rec-main-row">
                    <div className="rec-info-group">
                      <h3 className="rec-card-title">Học hôm nay</h3>
                      <p className="rec-card-desc">
                        Bạn có <strong className="highlight-text">{recommendation.dueCount}</strong> từ đến hạn cần ôn tập hôm nay.
                      </p>
                      <p className="rec-card-subtext">
                        Ôn tập định kỳ giúp ghi nhớ từ vựng dài hạn hơn.
                      </p>
                    </div>
                    <div className="rec-actions-group">
                      <button className="cta-button primary" onClick={() => onNavigate && onNavigate("dueReview")}>
                        Ôn hôm nay <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {recommendation.type === "wrong" && (
                <div className="rec-inner-box">
                  <div className="rec-badge danger">
                    <XCircle size={12} /> Khắc phục điểm yếu
                  </div>
                  <div className="rec-main-row">
                    <div className="rec-info-group">
                      <h3 className="rec-card-title">Học hôm nay</h3>
                      <p className="rec-card-desc">
                        Bạn có <strong className="highlight-text">{recommendation.wrongCount}</strong> từ hay trả lời sai nên luyện tập lại.
                      </p>
                      <p className="rec-card-subtext">
                        Tập trung ôn luyện lại những từ hay trả lời sai để cải thiện phản xạ.
                      </p>
                    </div>
                    <div className="rec-actions-group">
                      <button className="cta-button primary" onClick={() => onOpenWrongWords && onOpenWrongWords()}>
                        Ôn từ sai <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {recommendation.type === "continue" && recommendation.continueData && (
                <div className="rec-inner-box">
                  <div className="rec-badge primary">
                    <Compass size={12} /> Lộ trình học tập cá nhân
                  </div>
                  <div className="rec-main-row">
                    <div className="rec-info-group">
                      <h3 className="rec-card-title">Tiếp tục học</h3>
                      {recommendation.continueData.isCourseCompleted ? (
                        <>
                          <p className="rec-card-desc">
                            Bạn đã hoàn thành khóa học <strong className="highlight-text">{recommendation.continueData.courseName}</strong>! 🎉
                          </p>
                          <p className="rec-card-subtext">
                            Hãy chuyển sang khóa học tiếp theo hoặc ôn luyện lại các buổi cũ.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="rec-card-desc">
                            Gợi ý tiếp theo: <strong className="highlight-text">{recommendation.continueData.courseName} - {recommendation.continueData.lessonName}</strong>
                          </p>
                          <p className="rec-card-subtext">
                            Bài học gồm <strong className="highlight-count">{recommendation.continueData.totalWords}</strong> từ vựng.
                          </p>
                        </>
                      )}

                      {/* Progress Bar */}
                      <div className="rec-progress-container">
                        <div className="rec-progress-info">
                          <span>Tiến độ khóa học</span>
                          <strong className="rec-progress-text">
                            {recommendation.continueData.completedLessons}/{recommendation.continueData.totalLessons} buổi hoàn thành
                          </strong>
                        </div>
                        <div className="rec-progress-bar-bg">
                          <div
                            className="rec-progress-bar-fill"
                            style={{
                              width: `${
                                recommendation.continueData.totalLessons > 0
                                  ? Math.max(
                                      3,
                                      (recommendation.continueData.completedLessons /
                                        recommendation.continueData.totalLessons) *
                                        100
                                    )
                                  : 3
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="rec-actions-group">
                      {recommendation.continueData.isCourseCompleted ? (
                        <button
                          className="cta-button primary"
                          onClick={() =>
                            onOpenFlashcard &&
                            onOpenFlashcard(
                              recommendation.continueData.courseCode === "foundation"
                                ? "toeic1"
                                : "foundation"
                            )
                          }
                        >
                          Học khóa tiếp theo <ArrowRight size={16} />
                        </button>
                      ) : (
                        <button
                          className="cta-button primary"
                          onClick={() =>
                            onOpenFlashcard &&
                            onOpenFlashcard(
                              recommendation.continueData.courseCode,
                              recommendation.continueData.lessonNumber
                            )
                          }
                        >
                          Học tiếp <ArrowRight size={16} />
                        </button>
                      )}
                      {!recommendation.continueData.isCourseCompleted && (
                        <button
                          className="cta-button secondary text-btn"
                          onClick={() => onOpenFlashcard && onOpenFlashcard(recommendation.continueData.courseCode)}
                        >
                          Chọn buổi khác
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!user && (
                <div className="rec-guest-footer-bar">
                  <span className="guest-footer-text">💡 Đăng nhập để lưu và tiếp tục lộ trình học tập của riêng bạn.</span>
                  <button className="rec-guest-login-btn" onClick={onOpenAuth}>
                    Đăng nhập ngay
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rec-error">Không thể xác định lộ trình học.</div>
          )}
        </div>
      </section>

      {/* 3. Feature Cards (Chức năng) */}
      <section className="features-section">
        <div className="section-header">
          <h2>Chế độ học tập</h2>
          <p>Lựa chọn phương pháp học phù hợp nhất với mục tiêu của bạn.</p>
        </div>

        <div className="features-grid">
          {/* Flashcard Quiz */}
          <div className="feature-card active-card bento-2col">
            <div className="feature-card-content">
              <div className="feature-icon-wrapper quiz-icon">
                <BookOpen size={24} />
              </div>
              <span className="badge active">Trắc nghiệm</span>
              <h3>Flashcard Quiz</h3>
              <p className="feature-desc">
                Học từ vựng qua thẻ ghi nhớ và chọn đáp án trắc nghiệm sinh động từ kho từ CSV.
              </p>
            </div>
            <button className="feature-button primary" onClick={() => onOpenFlashcard()}>
              Bắt đầu ngay
            </button>
          </div>

          {/* Vocabulary Review */}
          <div className="feature-card active-card">
            <div className="feature-card-content">
              <div className="feature-icon-wrapper review-icon">
                <BookCheck size={24} />
              </div>
              <span className="badge active">Ôn tập</span>
              <h3>Vocabulary Review</h3>
              <p className="feature-desc">
                Xem lại từ vựng theo khóa học và buổi học trước khi kiểm tra. Tìm kiếm và nghe phát âm.
              </p>
            </div>
            <button className="feature-button primary" onClick={() => onOpenVocabularyReview()}>
              Ôn từ vựng
            </button>
          </div>

          {/* Listening Practice */}
          <div className="feature-card active-card">
            <div className="feature-card-content">
              <div className="feature-icon-wrapper listening-icon">
                <Headphones size={24} />
              </div>
              <span className="badge active">Luyện nghe</span>
              <h3>Listening Practice</h3>
              <p className="feature-desc">
                Nghe từ vựng và nhập lại từ tiếng Anh tương ứng. So sánh đáp án chuẩn xác.
              </p>
            </div>
            <button className="feature-button primary" onClick={() => onOpenListeningPractice()}>
              Luyện nghe
            </button>
          </div>

          <div className="feature-card disabled-card bento-2col">
            <div className="feature-card-content">
              <div className="feature-icon-wrapper coming-icon">
                <GraduationCap size={24} />
              </div>
              <span className="badge coming-soon">Sắp ra mắt</span>
              <h3>Grammar Practice</h3>
              <p className="feature-desc">
                Học các cấu trúc ngữ pháp thông dụng qua ví dụ thực tế và bài tập điền khuyết.
              </p>
            </div>
            <button className="feature-button disabled-btn" disabled>
              Sắp ra mắt
            </button>
          </div>

          <div className="feature-card active-card">
            <div className="feature-card-content">
              <div className="feature-icon-wrapper wrong-words-icon">
                <XCircle size={24} />
              </div>
              <span className="badge danger">Từ hay sai</span>
              <h3>Wrong Words</h3>
              <p className="feature-desc">
                Tổng hợp các từ bạn hay trả lời sai để luyện tập tập trung và cải thiện ghi nhớ.
              </p>
            </div>
            <button className="feature-button primary" onClick={onOpenWrongWords}>
              Xem từ sai
            </button>
          </div>

          <div className="feature-card active-card">
            <div className="feature-card-content">
              <div className="feature-icon-wrapper leaderboard-icon">
                <Trophy size={24} />
              </div>
              <span className="badge active">Đua Top</span>
              <h3>Leaderboard</h3>
              <p className="feature-desc">
                Xem bảng xếp hạng học tập giữa các thành viên và thi đua nâng cao thứ hạng của bạn.
              </p>
            </div>
            <button className="feature-button primary" onClick={() => onNavigate("leaderboard")}>
              Xem xếp hạng
            </button>
          </div>
        </div>
      </section>

      {/* 4. Learning Paths (Lộ trình học) */}
      <section className="learning-paths-section">
        <div className="section-header">
          <h2>Lộ trình hiện có</h2>
          <p>Các lộ trình học tập được thiết kế khoa học giúp bạn học tập có hệ thống hơn.</p>
        </div>

        <div className="learning-paths-grid">
          {/* Nền tảng */}
          <div className="path-card">
            <div className="path-card-header">
              <div className="path-icon-wrapper">
                <Compass size={22} />
              </div>
              <span className="path-badge">18 Buổi</span>
            </div>
            <h3>Khóa học Nền tảng</h3>
            <p className="path-desc">
              Tập trung ôn luyện các từ vựng cơ bản và thông dụng nhất trong giao tiếp hàng ngày. Phù hợp cho người mới bắt đầu.
            </p>
            <div className="path-actions">
              <button className="path-btn primary-btn" onClick={() => onOpenFlashcard("foundation")}>
                Học ngay
              </button>
              <button className="path-btn secondary-btn" onClick={() => onOpenVocabularyReview("foundation")}>
                Ôn từ
              </button>
            </div>
          </div>

          {/* TOEIC 1 */}
          <div className="path-card">
            <div className="path-card-header">
              <div className="path-icon-wrapper">
                <Trophy size={22} />
              </div>
              <span className="path-badge">18 Buổi</span>
            </div>
            <h3>Khóa học TOEIC 1</h3>
            <p className="path-desc">
              Cung cấp vốn từ vựng TOEIC theo từng chủ đề công sở, kinh doanh và giao dịch thương mại giai đoạn đầu.
            </p>
            <div className="path-actions">
              <button className="path-btn primary-btn" onClick={() => onOpenFlashcard("toeic1")}>
                Học ngay
              </button>
              <button className="path-btn secondary-btn" onClick={() => onOpenVocabularyReview("toeic1")}>
                Ôn từ
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How to Learn (Cách học) */}
      <section className="steps-section">
        <div className="section-header">
          <h2>Cách học hiệu quả</h2>
          <p>Tối ưu hóa khả năng ghi nhớ từ vựng tiếng Anh qua 3 bước đơn giản.</p>
        </div>

        <div className="steps-grid">
          {/* Step 1 */}
          <div className="step-card">
            <div className="step-header">
              <span className="step-number">01</span>
              <div className="step-icon-wrapper">
                <Compass size={18} />
              </div>
            </div>
            <h4>Chọn mục tiêu</h4>
            <p>Chọn lộ trình học phù hợp với trình độ hiện tại của bạn (Nền tảng hoặc TOEIC 1).</p>
            <div className="step-outcome">
              <span className="outcome-label">Kết quả:</span>
              <span className="outcome-value">Biết hôm nay cần học gì</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="step-card">
            <div className="step-header">
              <span className="step-number">02</span>
              <div className="step-icon-wrapper">
                <BookOpen size={18} />
              </div>
            </div>
            <h4>Học chủ động</h4>
            <p>Luyện tập đa dạng qua các chế độ: trắc nghiệm phản xạ, gõ từ tiếng Anh và nghe phát âm.</p>
            <div className="step-outcome">
              <span className="outcome-label">Kết quả:</span>
              <span className="outcome-value">Ghi nhớ qua nghe, chọn, nhập</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="step-card">
            <div className="step-header">
              <span className="step-number">03</span>
              <div className="step-icon-wrapper">
                <RefreshCw size={18} />
              </div>
            </div>
            <h4>Ôn lại đúng lúc</h4>
            <p>Hệ thống tự động theo dõi các từ bạn hay làm sai hoặc đến hạn ôn tập để nhắc nhở học lại.</p>
            <div className="step-outcome">
              <span className="outcome-label">Kết quả:</span>
              <span className="outcome-value">Ôn lại từ hay sai và từ đến hạn</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
