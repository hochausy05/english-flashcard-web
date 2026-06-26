import { useMemo, useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, X, Volume2, BookOpen, Calendar, Layers } from "lucide-react";
import { speakWord } from "../utils/speech.js";

// Helper to determine if the card's POS matches the selected quick filter
function matchesPos(cardPos, filter) {
  if (filter === "all") return true;
  const p = (cardPos || "").trim().toLowerCase();
  
  if (filter === "n") {
    return p === "n" || p === "noun" || p.split("/").map(x => x.trim()).includes("n") || p.split("/").map(x => x.trim()).includes("noun");
  }
  if (filter === "v") {
    return p === "v" || p === "verb" || p.split("/").map(x => x.trim()).includes("v") || p.split("/").map(x => x.trim()).includes("verb");
  }
  if (filter === "adj") {
    return p === "adj" || p === "adjective" || p.split("/").map(x => x.trim()).includes("adj") || p.split("/").map(x => x.trim()).includes("adjective");
  }
  if (filter === "adv") {
    return p === "adv" || p === "adverb" || p.split("/").map(x => x.trim()).includes("adv") || p.split("/").map(x => x.trim()).includes("adverb");
  }
  if (filter === "phrase") {
    return p === "phrase" || p.split("/").map(x => x.trim()).includes("phrase");
  }
  return false;
}

export function VocabularyReview({ cards, onBackHome, initialCourse }) {
  const [selectedCourse, setSelectedCourse] = useState(initialCourse || "foundation");
  const [selectedDays, setSelectedDays] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosFilter, setSelectedPosFilter] = useState("all");
  const [isDaysExpanded, setIsDaysExpanded] = useState(false);
  const vocabListRef = useRef(null);

  const prevSelectedCountRef = useRef(0);
  const prevExpandedRef = useRef(false);

  // Auto-scroll on mobile when days are selected or collapsed
  useEffect(() => {
    const currentCount = selectedDays.length;
    const prevCount = prevSelectedCountRef.current;
    prevSelectedCountRef.current = currentCount;

    if (currentCount > 0 && prevCount === 0 && window.innerWidth < 768) {
      const timer = setTimeout(() => {
        vocabListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedDays]);

  useEffect(() => {
    if (!isDaysExpanded && prevExpandedRef.current && selectedDays.length > 0 && window.innerWidth < 768) {
      const timer = setTimeout(() => {
        vocabListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
      return () => clearTimeout(timer);
    }
    prevExpandedRef.current = isDaysExpanded;
  }, [isDaysExpanded, selectedDays]);

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

  // Handle course changing
  function handleSelectCourse(course) {
    if (course !== selectedCourse) {
      setSelectedCourse(course);
      setSelectedDays([]); // Reset day selection when course changes
      setSearchQuery(""); // Reset search query
      setSelectedPosFilter("all"); // Reset POS filter
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

  // Select/deselect all days in current course
  function handleToggleSelectAll() {
    if (selectedDays.length === daysInfo.length) {
      setSelectedDays([]);
    } else {
      setSelectedDays(daysInfo.map((d) => d.day));
    }
  }

  // Filtered cards list
  const filteredCards = useMemo(() => {
    const courseAndDayFiltered = cards.filter(
      (card) => card.course === selectedCourse && selectedDays.includes(card.day)
    );

    const query = searchQuery.trim().toLowerCase();
    return courseAndDayFiltered.filter((card) => {
      const matchesSearch = !query ||
        card.word.toLowerCase().includes(query) ||
        card.answer.toLowerCase().includes(query) ||
        card.example.toLowerCase().includes(query);

      const matchesPosFilter = matchesPos(card.pos, selectedPosFilter);

      return matchesSearch && matchesPosFilter;
    });
  }, [cards, selectedCourse, selectedDays, searchQuery, selectedPosFilter]);

  // Total cards in selected course and days (before search/POS filtering)
  const totalInSessions = useMemo(() => {
    return cards.filter(
      (card) => card.course === selectedCourse && selectedDays.includes(card.day)
    ).length;
  }, [cards, selectedCourse, selectedDays]);

  const isFiltered = searchQuery.trim() !== "" || selectedPosFilter !== "all";
  const showCollapsed = selectedDays.length > 0 && !isDaysExpanded;

  // Build the POS / IPA subtext line
  function renderPosIpa(card) {
    const hasPos = !!card.pos;
    const hasIpa = !!card.ipa;

    if (!hasPos && !hasIpa) return null;
    if (hasPos && hasIpa) {
      return `${card.pos} · ${card.ipa}`;
    }
    return card.pos || card.ipa;
  }

  const posFilters = [
    { label: "Tất cả", value: "all" },
    { label: "Noun / n", value: "n" },
    { label: "Verb / v", value: "v" },
    { label: "Adjective / adj", value: "adj" },
    { label: "Adverb / adv", value: "adv" },
    { label: "Phrase / phrase", value: "phrase" },
  ];

  return (
    <div className="quiz-flow-container">
      <div className="back-nav">
        <button className="ghost-button" onClick={onBackHome}>
          <ArrowLeft size={16} /> Trang chủ
        </button>
      </div>

      <section className="selection-screen card">
        <div className="screen-header">
          <BookOpen className="header-icon" size={32} />
          <h2>Vocabulary Review</h2>
          <p className="subtitle">
            Xem lại danh sách từ vựng theo khóa học và các buổi học trước khi làm bài tập trắc nghiệm.
          </p>
        </div>

        {/* Course selection */}
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

        {/* Days/Sessions selection */}
        <div className={`days-selector-container ${showCollapsed ? "mobile-collapsed" : ""}`}>
          {/* Mobile Collapsed Summary */}
          <div className="mobile-collapsed-summary">
            <div className="collapsed-info">
              <span className="collapsed-days">
                Đang xem: {selectedDays.map((d) => `Buổi ${d}`).join(", ")}
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

          <div className="full-selector-ui">
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
                        onClick={(e) => e.stopPropagation()}
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

        {/* Search and Filters Section */}
        {selectedDays.length > 0 && (
          <div ref={vocabListRef} className="review-list-section" style={{ borderTop: "1px solid #e3e8f2", paddingTop: "24px", marginTop: "12px" }}>
            
            {/* Search Input */}
            <div className="search-container">
              <Search className="search-icon-left" size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo từ, nghĩa hoặc ví dụ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => setSearchQuery("")}>
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Quick POS filters */}
            <div className="pos-filters-container">
              {posFilters.map((filter) => (
                <button
                  key={filter.value}
                  className={`pos-filter-btn ${selectedPosFilter === filter.value ? "active" : ""}`}
                  onClick={() => setSelectedPosFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Vocabulary Count */}
            <div className="vocab-count-bar">
              <span>
                {isFiltered 
                  ? `Đang hiển thị: ${filteredCards.length} / ${totalInSessions} từ`
                  : `Đang hiển thị: ${totalInSessions} từ`
                }
              </span>
            </div>

            {/* Vocabulary list */}
            {filteredCards.length > 0 ? (
              <div className="vocab-cards-grid">
                {filteredCards.map((card) => {
                  const posIpaText = renderPosIpa(card);
                  return (
                    <div key={card.id} className="vocab-card">
                      <div>
                        <div className="vocab-card-header">
                          <div className="vocab-card-word-group">
                            <span className="vocab-card-word">{card.word}</span>
                            {posIpaText && (
                              <span className="vocab-card-meta">{posIpaText}</span>
                            )}
                          </div>
                        </div>
                        <div className="vocab-card-answer">{card.answer}</div>
                        {card.example && (
                          <div className="vocab-card-example">{card.example}</div>
                        )}
                      </div>
                      <div className="vocab-card-actions">
                        <button
                          className="speaker-mini-btn"
                          onClick={() => speakWord(card.word, card.audio)}
                          title={`Nghe phát âm: ${card.word}`}
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#667085" }}>
                Không tìm thấy từ vựng nào khớp với điều kiện tìm kiếm.
              </div>
            )}
          </div>
        )}

        {selectedDays.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#667085", borderTop: "1px solid #e3e8f2", paddingTop: "24px", marginTop: "12px" }}>
            Vui lòng chọn ít nhất một buổi học để hiển thị danh sách từ vựng.
          </div>
        )}
      </section>
    </div>
  );
}
