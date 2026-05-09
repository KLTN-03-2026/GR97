import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Cloud, Lock, ShieldCheck, UserRound, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { pushFlashNotice } from "../lib/flashNotice";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isTimeout = location.search.includes("reason=timeout");

  useEffect(() => {
    if (isTimeout) {
      setError(
        "Phiên đăng nhập đã hết hạn do không hoạt động trong 5 phút. Vui lòng đăng nhập lại."
      );
    }
  }, [isTimeout]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const loggedUser = await login(identifier, password, rememberMe);
      const emailNotice =
        "Bệnh nhân có thể truy cập email của mình để xem thông báo gửi về email.";

      if (loggedUser?.role !== "admin") {
        pushFlashNotice({
          title: "Thông báo email",
          message: emailNotice,
          tone: "info",
        });
      }

      setSuccess(
        loggedUser?.role === "admin"
          ? "Đăng nhập thành công! Đang chuyển hướng..."
          : `Đăng nhập thành công! ${emailNotice}`
      );

      const redirectTo =
        location.state?.from?.pathname ||
        (loggedUser?.role === "admin" ? "/admin/dashboard" : "/dashboard");

      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 1500);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const message =
        err?.response?.data?.message ||
        (err?.message === "Network Error"
          ? "Không kết nối được backend. Kiểm tra server backend và MongoDB."
          : err?.message || "Login failed");
      setError(detail ? `${message} (${detail})` : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-split">
      <aside className="auth-hero">
        <p className="badge-soft">Hệ thống Y tế Thông minh</p>
        <h1>Chăm sóc sức khỏe toàn diện cho người dân Đà Nẵng.</h1>
        <p>
          Tiếp cận dịch vụ y tế chất lượng cao, quản lý hồ sơ bệnh án điện tử và
          nhận tư vấn sức khỏe từ AI mọi lúc mọi nơi.
        </p>

        <div className="hero-feature">
          <div className="hero-icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4>Bảo mật tuyệt đối</h4>
            <p>Dữ liệu được mã hóa đầu cuối và tuân thủ tiêu chuẩn quốc tế.</p>
          </div>
        </div>
        <div className="hero-feature">
          <div className="hero-icon">
            <Cloud size={18} />
          </div>
          <div>
            <h4>Liên thông dữ liệu</h4>
            <p>Kết nối hồ sơ bệnh án giữa các bệnh viện lớn tại Đà Nẵng.</p>
          </div>
        </div>
      </aside>

      <form className="auth-card" onSubmit={onSubmit}>
        <h2>Đăng nhập.</h2>

        <label>Số điện thoại hoặc Email</label>
        <div className="input-with-icon">
          <UserRound size={16} />
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Nhập số điện thoại hoặc email"
          />
        </div>

        <label>Mật khẩu</label>
        <div className="password-input-container" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="input-with-icon" style={{ flex: 1 }}>
            <Lock size={16} />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="password-toggle"
            style={{ marginLeft: '8px' }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="remember-me-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <Link to="/forgot-password" className="forgot-password-link">
            Quên mật khẩu?
          </Link>
        </div>

        {error && <p className="error-text">{error}</p>}
        {success && (
          <p
            className="success-text"
            style={{
              color: "#22c55e",
              textAlign: "center",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <CheckCircle size={18} />
            {success}
          </p>
        )}

        <button type="submit" className="btn-primary auth-submit" disabled={loading}>
          {loading ? "Đang xử lý..." : "Đăng nhập hệ thống"}
        </button>

        <p className="auth-bottom-link">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </form>
    </section>
  );
};

export default LoginPage;
