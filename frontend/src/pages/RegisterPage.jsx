import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, Fingerprint, Phone, UserRound, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    birthDate: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!/^\d{8,15}$/.test(form.phone.trim())) {
        throw new Error("Số điện thoại không hợp lệ (8-15 số).");
      }
      if (form.password && form.password.length < 6) {
        throw new Error("Mật khẩu phải từ 6 ký tự nếu bạn tự đặt.");
      }

      const payload = { ...form };
      if (!payload.email?.trim()) delete payload.email;
      if (!payload.password?.trim()) delete payload.password;
      if (!payload.birthDate?.trim()) delete payload.birthDate;

      const result = await register(payload);
      if (result?.generatedPassword) {
        setSuccess(`Đăng ký tài khoản thành công! Mật khẩu tạm thời: ${result.generatedPassword}`);
      } else {
        setSuccess("Đăng ký tài khoản thành công!");
      }
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const message =
        err?.response?.data?.message ||
        (err?.message === "Network Error"
          ? "Không kết nối được backend. Kiểm tra server backend và MongoDB."
          : err?.message || "Registration failed");
      setError(detail ? `${message} (${detail})` : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="register-shell">
      <form className="register-card" onSubmit={onSubmit}>
        <h2>Đăng ký thành viên.</h2>
        <p className="muted">
          Trở thành thành viên hệ thống sức khỏe thông minh tại Đà Nẵng để nhận được sự chăm sóc tốt nhất.
        </p>


        <label>Họ và tên</label>
        <div className="input-with-icon">
          <UserRound size={16} />
          <input
            required
            value={form.fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            placeholder="Nguyễn Văn A"
          />
        </div>

        <label>Ngày sinh</label>
        <div className="input-with-icon">
          <Calendar size={16} />
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => onChange("birthDate", e.target.value)}
          />
        </div>



        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="Tùy chọn (you@example.com)"
        />

        <label>Mật khẩu (tùy chọn)</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => onChange("password", e.target.value)}
          placeholder="Bỏ trống để tạo mật khẩu tạm thời"
        />

        <label>Số điện thoại</label>
        <div className="input-with-icon">
          <Phone size={16} />
          <input
            required
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="0901234567"
          />
        </div>

        {error && <p className="error-text">{error}</p>}
        {success && (
          <p className="success-text" style={{ color: "#22c55e", textAlign: "center", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <CheckCircle size={18} />
            {success}
          </p>
        )}

        <button type="submit" className="btn-primary auth-submit" disabled={loading}>
          {loading ? "Đang xử lý..." : "Tiếp tục"} <ArrowRight size={16} />
        </button>

        <p className="register-note">
          Bằng cách đăng ký, bạn đồng ý với <Link to="#">Điều khoản dịch vụ</Link> và{" "}
          <Link to="#">Chính sách bảo mật</Link> của HealthAI Đà Nẵng.
        </p>
      </form>
    </section>
  );
};

export default RegisterPage;
