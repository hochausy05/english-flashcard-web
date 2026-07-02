import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  fetchSessionStats,
  fetchWordProgressStats,
  fetchRecentSessions,
} from "../utils/progressService.js";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Target,
  Brain,
  Trophy,
  Clock,
  RefreshCw,
  LogIn,
  Sparkles,
  TrendingUp,
  CalendarClock,
  Zap,
  Award,
  XCircle
} from "lucide-react";

/**
 * Format mode label for display
 */
function formatMode(mode) {
  switch (mode) {
    case "multiple_choice":
      return "Trắc nghiệm";
    case "typing":
      return "Gõ từ";
    case "listening":
      return "Nghe";
    case "due_review":
      return "Ôn tập";
    default:
      return mode || "—";
  }
}

/**
 * Format date/time for display
 */
function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
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

/**
 * Format relative time
 */
function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  try {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return "";
  } catch {
    return "";
  }
}

export function ProgressDashboard({ onBackHome, onOpenAuth, onOpenFlashcard, onOpenDueReview, onOpenWrongWords }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    averageAccuracy: 0,
    averageScore: 0,
  });
  const [wordStats, setWordStats] = useState({
    wordsLearned: 0,
    wordsMastered: 0,
    wordsToReviewToday: 0,
  });
  const [recentSessions, setRecentSessions] = useState([]);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const [sessStats, wStats, recent] = await Promise.all([
        fetchSessionStats(user.id),
        fetchWordProgressStats(user.id),
        fetchRecentSessions(user.id, 5),
      ]);

      setSessionStats(sessStats);
      setWordStats(wStats);
      setRecentSessions(recent);
    } catch (err) {
      console.error("ProgressDashboard loadData error:", err);
      setErrorMsg("Không thể tải thông tin thống kê học tập từ Supabase. Vui lòng bấm Làm mới.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Not logged in state
  if (!user) {
    return (
      <div className="progress-dashboard" id="progress-dashboard">
        <nav className="back-nav">
          <button className="ghost-button" onClick={onBackHome}>
            <ArrowLeft size={16} /> Trang chủ
          </button>
        </nav>

        <div className="progress-login-prompt">
          <div className="progress-login-prompt-icon">
            <BarChart3 size={48} />
          </div>
          <h2>Xem tiến trình học tập</h2>
          <p>
            Đăng nhập để theo dõi tiến trình học tập, xem thống kê chi tiết và
            nhận gợi ý ôn tập cá nhân hóa.
          </p>
          <button
            className="cta-button primary"
            onClick={onOpenAuth}
            id="progress-login-btn"
          >
            <LogIn size={18} /> Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="progress-dashboard" id="progress-dashboard">
        <nav className="back-nav">
          <button className="ghost-button" onClick={onBackHome}>
            <ArrowLeft size={16} /> Trang chủ
          </button>
        </nav>

        <div className="progress-loading">
          <div className="progress-loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const hasAnyData = sessionStats.totalSessions > 0 || wordStats.wordsLearned > 0;

  return (
    <div className="progress-dashboard" id="progress-dashboard">
      {/* Back navigation */}
      <nav className="back-nav">
        <button className="ghost-button" onClick={onBackHome}>
          <ArrowLeft size={16} /> Trang chủ
        </button>
      </nav>

      {/* Header */}
      <section className="progress-header">
        <div className="eyebrow-badge-wrapper">
          <span className="eyebrow-badge">
            <Sparkles size={12} className="eyebrow-icon" />
            PROGRESS DASHBOARD
          </span>
        </div>
        <h1 className="progress-title">Tiến trình học tập</h1>
        <p className="progress-subtitle">
          Theo dõi hành trình học tiếng Anh của bạn qua các chỉ số thống kê chi
          tiết.
        </p>
        {hasAnyData && (
          <button
            className="progress-refresh-btn"
            onClick={loadData}
            title="Làm mới dữ liệu"
            id="progress-refresh-btn"
          >
            <RefreshCw size={16} /> Làm mới
          </button>
        )}
      </section>

      {/* Error alert */}
      {errorMsg && (
        <div className="card error" style={{ padding: "16px", marginBottom: "24px", color: "#b42318", background: "#fef3f2", border: "1px solid #fda29b", borderRadius: "12px", textAlign: "center" }}>
          {errorMsg}
        </div>
      )}

      {/* Empty state */}
      {!hasAnyData && (
        <div className="progress-empty-state">
          <div className="progress-empty-icon">
            <TrendingUp size={48} />
          </div>
          <h3>Chưa có dữ liệu học tập</h3>
          <p>
            Bắt đầu học để xem tiến trình của bạn tại đây. Hãy thử một phiên
            Flashcard Quiz ngay!
          </p>
          <button
            className="cta-button primary"
            onClick={() => onOpenFlashcard && onOpenFlashcard()}
            id="progress-start-learning-btn"
          >
            <BookOpen size={18} /> Bắt đầu học
          </button>
        </div>
      )}

      {/* Stats Grid */}
      {hasAnyData && (
        <>
          <section className="progress-stats-grid">
            <div className="progress-stat-card" id="stat-total-sessions">
              <div className="progress-stat-icon sessions-icon">
                <BookOpen size={22} />
              </div>
              <span className="progress-stat-number">
                {sessionStats.totalSessions || 0}
              </span>
              <span className="progress-stat-label">Phiên học</span>
            </div>

            <div className="progress-stat-card" id="stat-words-learned">
              <div className="progress-stat-icon learned-icon">
                <Brain size={22} />
              </div>
              <span className="progress-stat-number">
                {wordStats.wordsLearned || 0}
              </span>
              <span className="progress-stat-label">Từ đã học</span>
            </div>

            <div className="progress-stat-card" id="stat-average-score">
              <div className="progress-stat-icon average-score-icon" style={{ background: "rgba(2, 122, 72, 0.08)", color: "#027a48" }}>
                <Award size={22} />
              </div>
              <span className="progress-stat-number">
                {sessionStats.averageScore || 0}
              </span>
              <span className="progress-stat-label">Điểm TB /10</span>
            </div>

            <div className="progress-stat-card" id="stat-accuracy">
              <div className="progress-stat-icon accuracy-icon">
                <Zap size={22} />
              </div>
              <span className="progress-stat-number">
                {sessionStats.averageAccuracy || 0}%
              </span>
              <span className="progress-stat-label">Tỷ lệ đúng</span>
            </div>
          </section>

          {/* Action Boxes (Review & Wrong Words) */}
          <div className="progress-actions-container" style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
            {/* Review Today Card */}
            <section className="progress-review-card" id="review-today-card">
              <div className="progress-review-content">
                <div className="progress-review-icon-wrapper">
                  <CalendarClock size={28} />
                </div>
                <div className="progress-review-text">
                  <h3>Ôn tập hôm nay</h3>
                  {wordStats.wordsToReviewToday > 0 ? (
                    <p>
                      Bạn có{" "}
                      <strong>{wordStats.wordsToReviewToday} từ</strong> cần ôn
                      lại hôm nay theo lịch trình spaced repetition.
                    </p>
                  ) : (
                    <p>Hôm nay bạn không có từ nào cần ôn theo lịch. Hãy tự tin học tiếp nhé!</p>
                  )}
                </div>
              </div>
              <button
                className="progress-review-btn"
                onClick={onOpenDueReview}
                id="review-today-btn"
                disabled={wordStats.wordsToReviewToday === 0}
                style={{
                  opacity: wordStats.wordsToReviewToday === 0 ? 0.6 : 1,
                  cursor: wordStats.wordsToReviewToday === 0 ? "not-allowed" : "pointer"
                }}
              >
                Ôn ngay <Zap size={16} />
              </button>
            </section>

            {/* Wrong words review card */}
            <section className="progress-review-card wrong-words-suggestion-card" id="wrong-words-suggestion-card" style={{
              background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
              border: "1px solid rgba(244, 63, 94, 0.2)",
              boxShadow: "0 4px 20px rgba(244, 63, 94, 0.06)"
            }}>
              <div className="progress-review-content">
                <div className="progress-review-icon-wrapper" style={{ background: "rgba(244, 63, 94, 0.12)", color: "#e11d48" }}>
                  <XCircle size={28} />
                </div>
                <div className="progress-review-text">
                  <h3 style={{ color: "#9f1239" }}>Từ hay trả lời sai</h3>
                  <p style={{ color: "#be123c" }}>
                    Danh sách tổng hợp các từ bạn hay trả lời sai để ôn luyện tập trung.
                  </p>
                </div>
              </div>
              <button
                className="progress-review-btn"
                onClick={onOpenWrongWords}
                id="wrong-words-dashboard-btn"
                style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)", boxShadow: "0 4px 12px rgba(244, 63, 94, 0.2)" }}
              >
                Xem từ sai <ArrowLeft size={16} style={{ transform: "rotate(180deg)" }} />
              </button>
            </section>
          </div>

          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <section className="progress-history">
              <div className="progress-history-header">
                <Clock size={20} />
                <h2>Phiên học gần đây</h2>
              </div>

              <div className="progress-session-list">
                {recentSessions.map((session, idx) => {
                  const accuracy =
                    session.total_questions > 0
                      ? Math.round(
                          (session.correct_count / session.total_questions) * 100
                        )
                      : 0;

                  return (
                    <div
                      className="progress-session-item"
                      key={session.id || idx}
                      style={{ animationDelay: `${idx * 0.06}s` }}
                    >
                      <div className="session-item-left">
                        <div className={`session-mode-badge mode-${session.mode || "unknown"}`}>
                          {formatMode(session.mode)}
                        </div>
                        <div className="session-item-details">
                          <span className="session-datetime">
                            {formatDateTime(session.finished_at)}
                          </span>
                          <span className="session-relative-time">
                            {formatRelativeTime(session.finished_at)}
                          </span>
                        </div>
                      </div>

                      <div className="session-item-right">
                        <div className="session-score-badge">
                          <span className="session-score-value">
                            {session.score != null
                              ? Number(session.score).toFixed(1)
                              : "—"}
                          </span>
                          <span className="session-score-label">/10</span>
                        </div>
                        <div className="session-accuracy-ring">
                          <svg viewBox="0 0 36 36" className="accuracy-svg">
                            <path
                              className="accuracy-bg"
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="accuracy-fill"
                              strokeDasharray={`${accuracy}, 100`}
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="accuracy-text">{accuracy}%</span>
                        </div>
                        <span className="session-question-count">
                          {session.correct_count}/{session.total_questions} câu
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
