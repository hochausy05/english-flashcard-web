import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient";
import { Mail, Lock, LogIn, UserPlus, ArrowLeft, AlertCircle, Sparkles, User } from "lucide-react";

export function AuthPanel({ onBackHome }) {
  const { user, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [message, setMessage] = useState({ type: "", text: "" }); // type: "error" | "success"
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically redirect if user is already logged in
  useEffect(() => {
    if (user) {
      onBackHome();
    }
  }, [user, onBackHome]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setMessage({ type: "error", text: "Vui lòng nhập đầy đủ email và mật khẩu." });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu phải chứa ít nhất 6 ký tự." });
      return;
    }

    setMessage({ type: "", text: "" });
    setIsSubmitting(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password
        });
        if (error) {
          let errMsg = error.message;
          const status = error.status;
          if (status === 429 || errMsg?.includes("429") || errMsg?.toLowerCase().includes("rate limit")) {
            errMsg = "Bạn thao tác quá nhanh. Vui lòng chờ vài phút rồi thử lại.";
          } else if (status === 400 || errMsg?.includes("400") || errMsg?.toLowerCase().includes("invalid login") || errMsg?.toLowerCase().includes("not confirmed") || errMsg?.toLowerCase().includes("invalid credentials")) {
            errMsg = "Email hoặc mật khẩu không đúng, hoặc tài khoản chưa được xác nhận.";
          }
          setMessage({ type: "error", text: errMsg });
        } else {
          setMessage({ type: "success", text: "Đăng nhập thành công! Đang chuyển hướng..." });
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              display_name: displayName || trimmedEmail
            }
          }
        });
        if (error) {
          let errMsg = error.message;
          const status = error.status;
          if (status === 429 || errMsg?.includes("429") || errMsg?.toLowerCase().includes("rate limit")) {
            errMsg = "Bạn thao tác quá nhanh. Vui lòng chờ vài phút rồi thử lại.";
          } else if (status === 400 || errMsg?.includes("400")) {
            errMsg = "Email hoặc mật khẩu không đúng, hoặc tài khoản chưa được xác nhận.";
          }
          setMessage({ type: "error", text: errMsg });
        } else {
          if (data?.session) {
            setMessage({ type: "success", text: "Tạo tài khoản và đăng nhập thành công!" });
          } else {
            setMessage({
              type: "success",
              text: "Tạo tài khoản thành công! Vui lòng kiểm tra email của bạn để xác thực tài khoản."
            });
          }
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: "Đã xảy ra lỗi không xác định. Vui lòng thử lại." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-panel-container">
      {/* Back button */}
      <div className="back-nav-container">
        <button className="ghost-button" onClick={onBackHome}>
          <ArrowLeft size={16} /> Quay lại trang chủ
        </button>
      </div>

      <div className="auth-card card">
        <div className="auth-card-glow"></div>
        <div className="auth-card-header">
          <div className="auth-icon-wrapper">
            <Sparkles size={24} className="auth-icon-sparkle" />
          </div>
          <h2>{mode === "signin" ? "Chào mừng trở lại" : "Tạo tài khoản mới"}</h2>
          <p>
            {mode === "signin"
              ? "Đăng nhập để đồng bộ và lưu tiến độ học của bạn."
              : "Bắt đầu hành trình chinh phục tiếng Anh ngay hôm nay."}
          </p>
        </div>

        {message.text && (
          <div className={`auth-message-box ${message.type}`}>
            <AlertCircle size={18} className="message-icon" />
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Địa chỉ Email</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {mode === "signup" && (
            <div className="input-group">
              <label htmlFor="displayName">Tên hiển thị (Tùy chọn)</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="displayName"
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? (
              <span className="spinner"></span>
            ) : mode === "signin" ? (
              <>
                <LogIn size={18} /> Đăng nhập
              </>
            ) : (
              <>
                <UserPlus size={18} /> Đăng ký
              </>
            )}
          </button>
        </form>

        <div className="auth-card-footer">
          {mode === "signin" ? (
            <p>
              Chưa có tài khoản?{" "}
              <button
                type="button"
                className="toggle-mode-btn"
                onClick={() => {
                  setMode("signup");
                  setMessage({ type: "", text: "" });
                }}
              >
                Đăng ký ngay
              </button>
            </p>
          ) : (
            <p>
              Đã có tài khoản?{" "}
              <button
                type="button"
                className="toggle-mode-btn"
                onClick={() => {
                  setMode("signin");
                  setMessage({ type: "", text: "" });
                }}
              >
                Đăng nhập
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
