import { useMemo } from "react";
import { BookOpen, Headphones, GraduationCap, XCircle, Trophy, BookCheck, ArrowRight, Sparkles, Compass } from "lucide-react";

export function Home({ cards = [], onOpenFlashcard, onOpenVocabularyReview, onOpenListeningPractice }) {
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
            <div className="mock-card card-1">
              <div className="mock-card-header">
                <span className="mock-card-pos">verb</span>
                <span className="mock-card-topic">TOEIC 1 · Buổi 1</span>
              </div>
              <h2 className="mock-card-word">Afford</h2>
              <p className="mock-card-ipa">/əˈfɔːd/</p>
              <div className="mock-card-divider"></div>
              <p className="mock-card-meaning">Có đủ khả năng chi trả (tiền bạc, thời gian)</p>
              <p className="mock-card-example">"We can't afford to buy a new car."</p>
              <div className="mock-card-footer">
                <div className="mock-speaker-icon">
                  <BookOpen size={16} />
                </div>
                <span className="mock-card-hint">Từ vựng thông dụng</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Stats Dashboard */}
      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-card-glow"></div>
          <span className="stat-number">{stats.courses}</span>
          <span className="stat-label">Khóa học hiện có</span>
        </div>
        <div className="stat-card">
          <div className="stat-card-glow"></div>
          <span className="stat-number">{stats.words}+</span>
          <span className="stat-label">Từ vựng chất lượng</span>
        </div>
        <div className="stat-card">
          <div className="stat-card-glow"></div>
          <span className="stat-number">{stats.sessions}</span>
          <span className="stat-label">Buổi học được thiết lập</span>
        </div>
        <div className="stat-card">
          <div className="stat-card-glow"></div>
          <span className="stat-number">3 Chế độ</span>
          <span className="stat-label">Quiz, Review & Nghe</span>
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
          <div className="feature-card active-card">
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
            <button className="feature-button secondary" onClick={() => onOpenVocabularyReview()}>
              Ôn từ vựng
            </button>
          </div>

          {/* Listening Practice */}
          <div className="feature-card active-card">
            <div className="feature-card-content">
              <div className="feature-icon-wrapper listening-icon">
                <Headphones size={24} style={{ color: "#7f56d9" }} />
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

          <div className="feature-card disabled-card">
            <div className="feature-card-content">
              <div className="feature-icon-wrapper coming-icon">
                <GraduationCap size={20} />
              </div>
              <span className="badge coming-soon">Sắp ra mắt</span>
              <h3>Grammar Practice</h3>
              <p className="feature-desc">
                Học các cấu trúc ngữ pháp thông dụng qua ví dụ thực tế và bài tập điền khuyết.
              </p>
            </div>
          </div>

          <div className="feature-card disabled-card">
            <div className="feature-card-content">
              <div className="feature-icon-wrapper coming-icon">
                <XCircle size={20} />
              </div>
              <span className="badge coming-soon">Sắp ra mắt</span>
              <h3>Wrong Words</h3>
              <p className="feature-desc">
                Tổng hợp các từ bạn hay trả lời sai để luyện tập tập trung và cải thiện ghi nhớ.
              </p>
            </div>
          </div>

          <div className="feature-card disabled-card">
            <div className="feature-card-content">
              <div className="feature-icon-wrapper coming-icon">
                <Trophy size={20} />
              </div>
              <span className="badge coming-soon">Sắp ra mắt</span>
              <h3>Daily Challenge</h3>
              <p className="feature-desc">
                Thử thách hoàn thành 10 câu hỏi vựng mỗi ngày để duy trì thói quen học tập.
              </p>
            </div>
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
          <div className="step-card">
            <div className="step-number">01</div>
            <h4>Chọn khóa học</h4>
            <p>Chọn lộ trình học phù hợp với trình độ hiện tại của bạn (Nền tảng hoặc TOEIC 1).</p>
          </div>

          <div className="step-card">
            <div className="step-number">02</div>
            <h4>Chọn buổi từ vựng</h4>
            <p>Lựa chọn học theo từng buổi riêng biệt hoặc kết hợp nhiều buổi học cùng lúc.</p>
          </div>

          <div className="step-card">
            <div className="step-number">03</div>
            <h4>Làm quiz hoặc ôn lại</h4>
            <p>Luyện tập trắc nghiệm phản xạ nhanh hoặc mở danh sách xem lại để nghe phát âm chuẩn.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
