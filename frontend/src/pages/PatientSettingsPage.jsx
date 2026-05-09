import { useEffect, useState } from "react";
import { Bell, Lock, ShieldCheck, UserRound } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const defaultNotifications = {
  appointmentReminders: true,
  labResults: true,
  healthNews: false,
};

const defaultPrivacy = {
  shareRecords: true,
  hideContactInDocs: true,
};

const PatientSettingsPage = () => {
  const { user, refreshUser, setUser } = useAuth();
  const [loading, setLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [privacy, setPrivacy] = useState(defaultPrivacy);
  const [status, setStatus] = useState({
    profile: "",
    password: "",
    notifications: "",
    privacy: "",
  });
  const [error, setError] = useState({
    profile: "",
    password: "",
    notifications: "",
    privacy: "",
  });
  const [saving, setSaving] = useState({
    profile: false,
    password: false,
    notifications: false,
    privacy: false,
  });

  const setSectionState = ({ section, nextError = "", nextStatus = "", nextSaving }) => {
    setError((prev) => ({ ...prev, [section]: nextError }));
    setStatus((prev) => ({ ...prev, [section]: nextStatus }));
    if (typeof nextSaving === "boolean") {
      setSaving((prev) => ({ ...prev, [section]: nextSaving }));
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/users/settings");
        const profile = data.profile || user || {};

        setProfileForm({
          fullName: profile.fullName || "",
          email: profile.email || "",
          phone: profile.phone || "",
        });
        setNotifications({ ...defaultNotifications, ...(data.notifications || {}) });
        setPrivacy({ ...defaultPrivacy, ...(data.privacy || {}) });
      } catch {
        setProfileForm({
          fullName: user?.fullName || "",
          email: user?.email || "",
          phone: user?.phone || "",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const saveProfile = async () => {
    setSectionState({ section: "profile", nextSaving: true });
    try {
      const payload = {
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
      };
      const { data } = await api.patch("/users/profile", payload);
      if (data.user) setUser((prev) => ({ ...(prev || {}), ...data.user }));
      await refreshUser();
      setSectionState({
        section: "profile",
        nextStatus: "Đã lưu thông tin tài khoản.",
        nextSaving: false,
      });
    } catch (err) {
      setSectionState({
        section: "profile",
        nextError: err?.response?.data?.message || "Không lưu được thông tin tài khoản.",
        nextSaving: false,
      });
    }
  };

  const savePassword = async () => {
    setSectionState({ section: "password", nextSaving: true });
    try {
      await api.patch("/users/password", passwordForm);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSectionState({
        section: "password",
        nextStatus: "Đã cập nhật mật khẩu.",
        nextSaving: false,
      });
    } catch (err) {
      setSectionState({
        section: "password",
        nextError: err?.response?.data?.message || "Không cập nhật được mật khẩu.",
        nextSaving: false,
      });
    }
  };

  const saveNotifications = async () => {
    setSectionState({ section: "notifications", nextSaving: true });
    try {
      await api.patch("/users/preferences", { notifications });
      setSectionState({
        section: "notifications",
        nextStatus: "Đã lưu cài đặt thông báo.",
        nextSaving: false,
      });
    } catch (err) {
      setSectionState({
        section: "notifications",
        nextError: err?.response?.data?.message || "Không lưu được cài đặt thông báo.",
        nextSaving: false,
      });
    }
  };

  const savePrivacy = async () => {
    setSectionState({ section: "privacy", nextSaving: true });
    try {
      await api.patch("/users/preferences", { privacy });
      setSectionState({
        section: "privacy",
        nextStatus: "Đã lưu cài đặt riêng tư.",
        nextSaving: false,
      });
    } catch (err) {
      setSectionState({
        section: "privacy",
        nextError: err?.response?.data?.message || "Không lưu được cài đặt riêng tư.",
        nextSaving: false,
      });
    }
  };

  return (
    <section className="stack-md">
      <div>
        <h1>Cài đặt tài khoản.</h1>
        <p className="muted">
          Quản lý thông tin cá nhân, mật khẩu và các tùy chọn bảo mật dữ liệu.
        </p>
      </div>

      {loading ? <p className="muted">Đang tải cài đặt...</p> : null}

      <div className="settings-grid">
        <article className="settings-card">
          <h2>
            <UserRound size={20} /> Thông tin tài khoản
          </h2>
          <div className="stack-sm">
            <label>Họ và tên</label>
            <input
              value={profileForm.fullName}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))
              }
            />
            <label>Email</label>
            <input
              value={profileForm.email}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <label>Số điện thoại</label>
            <input
              value={profileForm.phone}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <button type="button" className="btn-primary" onClick={saveProfile} disabled={saving.profile}>
            {saving.profile ? "Đang lưu..." : "Lưu thông tin"}
          </button>
          {status.profile ? <p className="success-text">{status.profile}</p> : null}
          {error.profile ? <p className="error-text">{error.profile}</p> : null}
        </article>

        <article className="settings-card">
          <h2>
            <Lock size={20} /> Bảo mật
          </h2>
          <div className="stack-sm">
            <label>Mật khẩu hiện tại</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
              }
            />
            <label>Mật khẩu mới</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
              }
            />
            <label>Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
            />
          </div>
          <button type="button" className="btn-secondary" onClick={savePassword} disabled={saving.password}>
            {saving.password ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </button>
          {status.password ? <p className="success-text">{status.password}</p> : null}
          {error.password ? <p className="error-text">{error.password}</p> : null}
        </article>

        <article className="settings-card">
          <h2>
            <Bell size={20} /> Thông báo
          </h2>
          <div className="toggle-list">
            <label>
              <input
                type="checkbox"
                checked={notifications.appointmentReminders}
                onChange={(e) =>
                  setNotifications((prev) => ({
                    ...prev,
                    appointmentReminders: e.target.checked,
                  }))
                }
              />
              Nhắc lịch khám
            </label>
            <label>
              <input
                type="checkbox"
                checked={notifications.labResults}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, labResults: e.target.checked }))
                }
              />
              Cập nhật kết quả xét nghiệm
            </label>
            <label>
              <input
                type="checkbox"
                checked={notifications.healthNews}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, healthNews: e.target.checked }))
                }
              />
              Tin tức sức khỏe
            </label>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={saveNotifications}
            disabled={saving.notifications}
          >
            {saving.notifications ? "Đang lưu..." : "Lưu thông báo"}
          </button>
          {status.notifications ? <p className="success-text">{status.notifications}</p> : null}
          {error.notifications ? <p className="error-text">{error.notifications}</p> : null}
        </article>

        <article className="settings-card">
          <h2>
            <ShieldCheck size={20} /> Quyền riêng tư
          </h2>
          <p className="muted">
            Quản lý cách dữ liệu sức khỏe của bạn được chia sẻ giữa các cơ sở y tế.
          </p>
          <div className="toggle-list">
            <label>
              <input
                type="checkbox"
                checked={privacy.shareRecords}
                onChange={(e) =>
                  setPrivacy((prev) => ({ ...prev, shareRecords: e.target.checked }))
                }
              />
              Cho phép liên thông hồ sơ
            </label>
            <label>
              <input
                type="checkbox"
                checked={privacy.hideContactInDocs}
                onChange={(e) =>
                  setPrivacy((prev) => ({ ...prev, hideContactInDocs: e.target.checked }))
                }
              />
              Ẩn thông tin liên hệ trên tài liệu
            </label>
          </div>
          <button type="button" className="btn-secondary" onClick={savePrivacy} disabled={saving.privacy}>
            {saving.privacy ? "Đang lưu..." : "Lưu cài đặt riêng tư"}
          </button>
          {status.privacy ? <p className="success-text">{status.privacy}</p> : null}
          {error.privacy ? <p className="error-text">{error.privacy}</p> : null}
        </article>
      </div>
    </section>
  );
};

export default PatientSettingsPage;
