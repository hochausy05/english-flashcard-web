import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchLeaderboard } from "../utils/leaderboardService.js";
import {
  Trophy,
  Medal,
  Award,
  RefreshCw,
  ArrowLeft,
  LogIn,
  Sparkles,
  BookOpen,
  CheckCircle,
  Target,
  Brain,
  ChevronRight
} from "lucide-react";

export function Leaderboard({ onBackHome, onOpenAuth }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [leaderboardData, setLeaderboardData] = useState([]);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetchLeaderboard(20);
      if (res.success) {
        setLeaderboardData(res.data);
      } else {
        setErrorMsg(res.error || "Không tải được bảng xếp hạng. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Leaderboard loadData error:", err);
      setErrorMsg("Không thể kết nối đến máy chủ. Vui lòng bấm Làm mới.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Guest Prompt Screen
  if (!user) {
    return (
      <div className="leaderboard-container guest-mode" id="leaderboard-container">
        <nav className="back-nav">
          <button className="ghost-button" onClick={onBackHome}>
            <ArrowLeft size={16} /> Trang chủ
          </button>
        </nav>

        <div className="leaderboard-login-prompt card">
          <div className="leaderboard-login-prompt-icon">
            <Trophy size={48} className="gold-trophy" />
          </div>
          <h2>Bảng xếp hạng từ vựng</h2>
          <p>
            Đăng nhập để xem vị trí của bạn trên bảng xếp hạng, đua top học tập
            và đồng bộ kết quả từ vựng cùng cộng đồng.
          </p>
          <button
            className="cta-button primary"
            onClick={onOpenAuth}
            id="leaderboard-login-btn"
          >
            <LogIn size={18} /> Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  // Helper to render Top 3 Rank Visual indicators
  const renderRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <div className="rank-badge gold-badge">
            <Trophy size={18} className="rank-icon-svg" />
            <span>#1</span>
          </div>
        );
      case 2:
        return (
          <div className="rank-badge silver-badge">
            <Medal size={18} className="rank-icon-svg" />
            <span>#2</span>
          </div>
        );
      case 3:
        return (
          <div className="rank-badge bronze-badge">
            <Award size={18} className="rank-icon-svg" />
            <span>#3</span>
          </div>
        );
      default:
        return <span className="normal-rank">#{rank}</span>;
    }
  };

  return (
    <div className="leaderboard-container" id="leaderboard-container">
      {/* Back Nav and Refresh */}
      <nav className="leaderboard-nav">
        <button className="ghost-button" onClick={onBackHome}>
          <ArrowLeft size={16} /> Trang chủ
        </button>
        
        {user && !loading && (
          <button className="refresh-btn ghost-button sm" onClick={loadData} title="Làm mới bảng xếp hạng">
            <RefreshCw size={14} className={loading ? "spinner-icon" : ""} /> Làm mới
          </button>
        )}
      </nav>

      {/* Header Info */}
      <section className="leaderboard-header">
        <div className="eyebrow-badge-wrapper">
          <span className="eyebrow-badge">
            <Sparkles size={12} className="eyebrow-icon" />
            BẢNG VÀNG VINH DANH
          </span>
        </div>
        <h1 className="leaderboard-title">Bảng xếp hạng từ vựng</h1>
        <p className="leaderboard-subtitle">
          Xếp hạng người học theo số từ đã học, buổi hoàn thành và tỷ lệ đúng.
        </p>
      </section>

      {/* Main Content Area */}
      {loading ? (
        <div className="leaderboard-loading card">
          <div className="skeleton-rowheader"></div>
          <div className="skeleton-row"></div>
          <div className="skeleton-row"></div>
          <div className="skeleton-row"></div>
          <div className="skeleton-row"></div>
          <p>Đang tải dữ liệu xếp hạng...</p>
        </div>
      ) : errorMsg ? (
        <div className="leaderboard-error card">
          <div className="error-icon">⚠️</div>
          <p>{errorMsg}</p>
          <button className="cta-button primary" onClick={loadData}>
            Thử lại
          </button>
        </div>
      ) : leaderboardData.length === 0 ? (
        <div className="leaderboard-empty card">
          <div className="empty-icon">🏆</div>
          <h3>Bảng xếp hạng trống</h3>
          <p>Chưa có dữ liệu xếp hạng. Hãy hoàn thành vài bài học để xuất hiện tại đây.</p>
          <button className="cta-button primary" onClick={onBackHome}>
            Học ngay
          </button>
        </div>
      ) : (
        <>
          {/* Top 3 Visual Highlights */}
          <div className="leaderboard-podium">
            {leaderboardData.slice(0, 3).map((player) => (
              <div 
                key={player.rank} 
                className={`podium-card card rank-${player.rank}`}
              >
                <div className="podium-glow"></div>
                <div className="podium-rank-tag">{renderRankBadge(player.rank)}</div>
                
                <h3 className="podium-name">{player.displayName}</h3>
                
                <div className="podium-score">
                  <span className="score-val">{player.leaderboardScore}</span>
                  <span className="score-lbl">Điểm xếp hạng</span>
                </div>

                <div className="podium-stats-grid">
                  <div className="podium-stat-item" title="Số từ vựng đã học">
                    <Brain size={14} className="stat-icon vocab" />
                    <span>{player.learnedWords} từ</span>
                  </div>
                  <div className="podium-stat-item" title="Tỷ lệ trả lời đúng">
                    <Target size={14} className="stat-icon accuracy" />
                    <span>{player.accuracy}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Leaderboard Table */}
          <div className="leaderboard-table-wrapper card desktop-only">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Người học</th>
                  <th className="text-center">Từ đã học</th>
                  <th className="text-center">Buổi hoàn thành</th>
                  <th className="text-center">Tỷ lệ đúng</th>
                  <th className="text-center">Phiên học</th>
                  <th className="text-right">Điểm xếp hạng</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((player) => (
                  <tr 
                    key={player.rank} 
                    className={`table-row rank-row-${player.rank} ${player.displayName.includes("Tôi") ? "my-row" : ""}`}
                  >
                    <td>
                      <div className="rank-cell">
                        {renderRankBadge(player.rank)}
                      </div>
                    </td>
                    <td>
                      <span className="player-name">{player.displayName}</span>
                    </td>
                    <td className="text-center font-semibold">{player.learnedWords}</td>
                    <td className="text-center font-semibold">
                      {player.completedLessons > 0 ? (
                        <span className="completed-badge">
                          <CheckCircle size={12} /> {player.completedLessons}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-center font-semibold">
                      <span className={`accuracy-indicator ${player.accuracy >= 80 ? "high" : player.accuracy >= 50 ? "medium" : "low"}`}>
                        {player.accuracy}%
                      </span>
                    </td>
                    <td className="text-center text-muted">{player.totalSessions}</td>
                    <td className="text-right score-cell">{player.leaderboardScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Leaderboard List */}
          <div className="leaderboard-mobile-list mobile-only">
            {leaderboardData.map((player) => (
              <div 
                key={player.rank}
                className={`leaderboard-mobile-card card rank-card-${player.rank}`}
              >
                <div className="m-card-header">
                  <div className="m-rank-group">
                    {renderRankBadge(player.rank)}
                    <span className="m-player-name">{player.displayName}</span>
                  </div>
                  <div className="m-score-badge">
                    <span>{player.leaderboardScore}đ</span>
                  </div>
                </div>

                <div className="m-card-body">
                  <div className="m-stat-col">
                    <span className="m-stat-lbl">Đã học</span>
                    <span className="m-stat-val">{player.learnedWords} từ</span>
                  </div>
                  <div className="m-stat-col">
                    <span className="m-stat-lbl">Buổi học</span>
                    <span className="m-stat-val">{player.completedLessons} buổi</span>
                  </div>
                  <div className="m-stat-col">
                    <span className="m-stat-lbl">Chính xác</span>
                    <span className="m-stat-val">{player.accuracy}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer disclaimer */}
          <footer className="leaderboard-footer">
            <p className="disclaimer-text">💡 Admin không tham gia bảng xếp hạng.</p>
          </footer>
        </>
      )}
    </div>
  );
}
