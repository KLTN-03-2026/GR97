import React, { useEffect, useState } from 'react';
import { ADMIN_TOKEN_KEY, api, setAdminToken } from './lib/api';
import { User, Doctor, OverviewStats, AIInsights, DoctorFormData } from './types';
import Toast from './components/Toast';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';

// Icons
const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconDoctors = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconRevenue = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconUnlock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconKey = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const initialDoctorForm: DoctorFormData = {
  fullName: '',
  title: 'BS. CKI',
  specialty: '',
  hospital: '',
  experienceYears: '5',
  rating: '4.7',
  bio: '',
  avatarUrl: '',
  avatarColor: '#2b7edb',
  timeSlots: '08:00, 09:30, 14:00',
  username: '',
  email: '',
  phone: '',
  tempPassword: '',
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không đọc được file ảnh.'));
    reader.readAsDataURL(file);
  });

const getAiRatingMeta = (rating?: string) => {
  const normalized = String(rating || '').trim().toLowerCase();
  const sanitized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (sanitized === 'tot') {
    return {
      label: 'Tot',
      tone: 'good',
      note: 'He thong dang van hanh on dinh va co tin hieu tich cuc.',
    };
  }

  if (sanitized === 'trung binh') {
    return {
      label: 'Trung binh',
      tone: 'medium',
      note: 'Co mot so diem can theo doi de tranh suy giam hieu qua.',
    };
  }

  return {
    label: normalized ? rating : 'Can chu y',
    tone: 'critical',
    note: 'Nen uu tien ra soat cac diem nghen va rui ro van hanh.',
  };
};

const App = () => {
  const [token, setToken] = useState<string>(localStorage.getItem(ADMIN_TOKEN_KEY) || '');
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<string>('overview');
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [stats, setStats] = useState<Partial<OverviewStats> | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showAddDoctor, setShowAddDoctor] = useState<boolean>(false);
  const [doctorForm, setDoctorForm] = useState<DoctorFormData>(initialDoctorForm);
  const [savingDoctor, setSavingDoctor] = useState<boolean>(false);
  const [searchDoctor, setSearchDoctor] = useState<string>('');
  const [confirmLock, setConfirmLock] = useState<Doctor | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiGeneratedAt, setAiGeneratedAt] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const logout = () => {
    setAdminToken('');
    setToken('');
    setUser(null);
    setOverview(null);
    setStats(null);
    setDoctors([]);
    setAiInsights(null);
    setAiError(null);
    setAiGeneratedAt(null);
  };

  const onLogin = (nextToken: string, nextUser: User) => {
    setAdminToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, statsRes, doctorsRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/appointments/stats'),
        api.get('/doctors'),
      ]);
      setOverview(overviewRes.data);
      setStats(statsRes.data);
      setDoctors(doctorsRes.data.doctors || []);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        logout();
        return;
      }
      showToast(err?.response?.data?.message || 'Không tải được dữ liệu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const { data } = await api.post('/admin/ai-analytics', {
        type: 'overview',
      });
      setAiInsights(data.insights);
      setAiGeneratedAt(new Date().toISOString());
    } catch (err: any) {
      console.error('Failed to fetch AI insights:', err);
      setAiError(err.response?.data?.message || 'Không thể tải phân tích AI');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  const createDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDoctor(true);
    try {
      const payload = {
        fullName: doctorForm.fullName.trim(),
        title: doctorForm.title.trim(),
        specialty: doctorForm.specialty.trim(),
        hospital: doctorForm.hospital.trim(),
        experienceYears: Number(doctorForm.experienceYears) || 0,
        rating: Number(doctorForm.rating) || 4.7,
        bio: doctorForm.bio.trim(),
        avatarUrl: doctorForm.avatarUrl.trim(),
        avatarColor: doctorForm.avatarColor.trim() || '#2b7edb',
        timeSlots: doctorForm.timeSlots
          .split(/[,\n]/)
          .map((item) => item.trim())
          .filter(Boolean),
        account: {
          username: doctorForm.username.trim(),
          email: doctorForm.email.trim(),
          phone: doctorForm.phone.trim(),
          tempPassword: doctorForm.tempPassword.trim(),
          isActive: true,
        },
      };
      await api.post('/admin/doctors', payload);
      setShowAddDoctor(false);
      setDoctorForm(initialDoctorForm);
      showToast('Đã thêm bác sĩ mới thành công!');
      await loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không tạo được bác sĩ.', 'error');
    } finally {
      setSavingDoctor(false);
    }
  };

  const handleAvatarFromDevice = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('File không hợp lệ. Vui lòng chọn file ảnh.', 'error');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      showToast('Ảnh quá lớn. Vui lòng chọn ảnh <= 2MB.', 'error');
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setDoctorForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
      showToast('Đã tải ảnh từ máy tính.');
    } catch (err: any) {
      showToast(err?.message || 'Không tải được ảnh.', 'error');
    }
  };

  const doToggleDoctorActive = async (doctor: Doctor) => {
    const nextActive = !(doctor.account?.isActive ?? true);
    try {
      await api.patch(`/admin/doctors/${doctor._id}/account`, { isActive: nextActive });
      setDoctors((prev) =>
        prev.map((item) =>
          item._id === doctor._id
            ? { ...item, account: { ...(item.account || {}), isActive: nextActive } }
            : item
        )
      );
      showToast(nextActive ? 'Đã mở khóa tài khoản bác sĩ.' : 'Đã khóa tài khoản bác sĩ.');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không cập nhật được tài khoản.', 'error');
    } finally {
      setConfirmLock(null);
    }
  };

  const filteredDoctors = doctors.filter((d) => {
    if (!searchDoctor.trim()) return true;
    const q = searchDoctor.toLowerCase();
    return (
      d.fullName?.toLowerCase().includes(q) ||
      d.specialty?.toLowerCase().includes(q) ||
      d.hospital?.toLowerCase().includes(q)
    );
  });

  const aiRatingMeta = getAiRatingMeta(aiInsights?.overallRating);
  const aiGeneratedLabel = aiGeneratedAt
    ? new Date(aiGeneratedAt).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Chưa tạo';
  const aiQuickStats = [
    { label: 'Xu hướng trọng tâm', value: aiInsights?.trends?.length ?? 0, tone: 'blue' },
    { label: 'Cảnh báo cần xử lý', value: aiInsights?.alerts?.length ?? 0, tone: 'red' },
    { label: 'Đề xuất cải thiện', value: aiInsights?.recommendations?.length ?? 0, tone: 'purple' },
    { label: 'Dự báo xu hướng', value: aiInsights?.prediction ? 1 : 0, tone: 'green' },
  ];

  if (!token) return <LoginForm onLogin={onLogin} />;

  return (
    <div className={`app-layout${sidebarOpen ? ' sidebar-open' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#1d6fe8" />
              <path d="M20 10v20M10 20h20" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <div>
              <div className="sidebar-brand">HealthyAI</div>
              <div className="sidebar-role">Admin Portal</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-item${tab === 'overview' ? ' active' : ''}`}
            onClick={() => { setTab('overview'); setSidebarOpen(false); }}
          >
            <IconDashboard />
            <span>Tổng quan</span>
          </button>
          <button
            type="button"
            className={`nav-item${tab === 'doctors' ? ' active' : ''}`}
            onClick={() => { setTab('doctors'); setSidebarOpen(false); }}
          >
            <IconDoctors />
            <span>Quản lý bác sĩ</span>
          </button>
          <button
            type="button"
            className={`nav-item${tab === 'accounts' ? ' active' : ''}`}
            onClick={() => { setTab('accounts'); setSidebarOpen(false); }}
          >
            <IconKey />
            <span>Tài khoản bác sĩ</span>
          </button>
          <button
            type="button"
            className={`nav-item${tab === 'stats' ? ' active' : ''}`}
            onClick={() => { setTab('stats'); setSidebarOpen(false); }}
          >
            <span>Thống kê AI</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{(user?.fullName || 'A')[0].toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.fullName || 'Admin'}</div>
              <div className="user-tag">Administrator</div>
            </div>
          </div>
          <button type="button" className="btn-icon-ghost" onClick={logout} title="Đăng xuất">
            <IconLogout />
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="main-content">
        <header className="topbar">
          <button
            type="button"
            className="hamburger"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
          <div className="topbar-title">
            {tab === 'overview' ? 'Tổng quan hệ thống' : tab === 'doctors' ? 'Quản lý bác sĩ' : tab === 'accounts' ? 'Tài khoản bác sĩ' : 'Thống kê AI'}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={loadData}
            title="Làm mới dữ liệu"
          >
            <IconRefresh />
            <span className="hide-xs">Làm mới</span>
          </button>
        </header>

        <div className="page-body">
          {loading && (
            <div className="loading-state">
              <div className="spinner-lg" />
              <p>Đang tải dữ liệu...</p>
            </div>
          )}

          {!loading && tab === 'overview' && <Dashboard overview={overview} stats={stats} />}

          {!loading && tab === 'doctors' && (
            <div className="doctors-page">
              <div className="page-toolbar">
                <div className="search-box">
                  <IconSearch />
                  <input
                    className="search-input"
                    type="search"
                    placeholder="Tìm bác sĩ theo tên, chuyên khoa, bệnh viện..."
                    value={searchDoctor}
                    onChange={(e) => setSearchDoctor(e.target.value)}
                  />
                </div>
                <button type="button" className="btn btn-primary" onClick={() => setShowAddDoctor(true)}>
                  <IconPlus />
                  Thêm bác sĩ
                </button>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h3>Danh sách bác sĩ</h3>
                  <span className="badge-count">{filteredDoctors.length} bác sĩ</span>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bác sĩ</th>
                        <th>Chuyên khoa</th>
                        <th>Bệnh viện</th>
                        <th>Đánh giá</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDoctors.map((doctor) => {
                        const isActive = doctor.account?.isActive !== false;
                        const initials = doctor.fullName
                          ?.split(' ')
                          .slice(-2)
                          .map((w) => w[0])
                          .join('')
                          .toUpperCase() || 'BS';
                        return (
                          <tr key={doctor._id}>
                            <td>
                              <div className="doctor-cell">
                                {doctor.avatarUrl ? (
                                  <img className="doc-avatar" src={doctor.avatarUrl} alt={doctor.fullName} />
                                ) : (
                                  <div
                                    className="doc-avatar doc-avatar-initials"
                                    style={{ background: doctor.avatarColor || '#2b7edb' }}
                                  >
                                    {initials}
                                  </div>
                                )}
                                <div>
                                  <div className="doc-name">{doctor.fullName}</div>
                                  <div className="doc-title">{doctor.title}</div>
                                </div>
                              </div>
                            </td>
                            <td>{doctor.specialty}</td>
                            <td>{doctor.hospital}</td>
                            <td>
                              <span className="rating-badge">★ {doctor.rating}</span>
                            </td>
                            <td>
                              <span className={`account-badge ${isActive ? 'active' : 'locked'}`}>
                                {isActive ? 'Đang hoạt động' : 'Đã khóa'}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={`btn btn-sm ${isActive ? 'btn-danger-outline' : 'btn-success-outline'}`}
                                onClick={() => setConfirmLock(doctor)}
                              >
                                {isActive ? <><IconLock /> Khóa</> : <><IconUnlock /> Mở khóa</>}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredDoctors.length === 0 && (
                        <tr>
                          <td colSpan={6} className="empty-row">
                            {searchDoctor ? 'Không tìm thấy bác sĩ phù hợp.' : 'Chưa có bác sĩ nào.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!loading && tab === 'accounts' && (
            <div className="doctors-page">
              <div className="panel">
                <div className="panel-header">
                  <h3>Tài khoản đăng nhập bác sĩ</h3>
                  <span className="badge-count">{doctors.length} tài khoản</span>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bác sĩ</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctors.map((doctor) => {
                        const isActive = doctor.account?.isActive !== false;
                        const initials = doctor.fullName
                          ?.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase() || 'BS';
                        return (
                          <tr key={doctor._id}>
                            <td>
                              <div className="doctor-cell">
                                {doctor.avatarUrl ? (
                                  <img className="doc-avatar" src={doctor.avatarUrl} alt={doctor.fullName} />
                                ) : (
                                  <div
                                    className="doc-avatar doc-avatar-initials"
                                    style={{ background: doctor.avatarColor || '#2b7edb' }}
                                  >
                                    {initials}
                                  </div>
                                )}
                                <div>
                                  <div className="doc-name">{doctor.fullName}</div>
                                  <div className="doc-title">{doctor.title}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="code-tag">{doctor.account?.username || '-'}</span>
                            </td>
                            <td>{doctor.account?.email || '-'}</td>
                            <td>{doctor.account?.phone || '-'}</td>
                            <td>
                              <span className={`account-badge ${isActive ? 'active' : 'locked'}`}>
                                {isActive ? 'Đang hoạt động' : 'Đã khóa'}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={`btn btn-sm ${isActive ? 'btn-danger-outline' : 'btn-success-outline'}`}
                                onClick={() => setConfirmLock(doctor)}
                              >
                                {isActive ? <><IconLock /> Khóa</> : <><IconUnlock /> Mở khóa</>}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {doctors.length === 0 && (
                        <tr>
                          <td colSpan={6} className="empty-row">Chưa có tài khoản nào.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!loading && tab === 'stats' && (
            <div className="stats-page">
              <div className="ai-command-hero">
                <div className="ai-command-copy">
                  <span className="ai-command-eyebrow">AI analytics control center</span>
                  <h2>Phân tích AI cho toàn hệ thống</h2>
                  <p>
                    Tổng hợp xu hướng vận hành, cảnh báo và đề xuất cải thiện để admin ra quyết định nhanh hơn.
                  </p>
                </div>
                <div className="ai-command-actions">
                  <div className="ai-command-meta">
                    <span>Lần cập nhật gần nhất</span>
                    <strong>{aiGeneratedLabel}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary ai-command-btn"
                    onClick={fetchAIInsights}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <span className="btn-loading"><span className="spinner" />Đang phân tích...</span>
                    ) : (
                      <><IconRefresh /> Tạo phân tích AI</>
                    )}
                  </button>
                </div>
              </div>

              {aiLoading && (
                <div className="ai-feedback-panel is-loading">
                  <div className="spinner-lg" />
                  <div>
                    <h3>AI đang tổng hợp tín hiệu hệ thống</h3>
                    <p>Vui lòng chờ trong giây lát để nhận báo cáo minh bạch và có thể hành động.</p>
                  </div>
                </div>
              )}

              {aiError && (
                <div className="ai-feedback-panel is-error">
                  <div>
                    <span className="ai-command-eyebrow">AI feedback</span>
                    <h3>Không thể tạo phân tích</h3>
                    <p>{aiError}</p>
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={fetchAIInsights}>
                    Thử lại
                  </button>
                </div>
              )}

              {!aiLoading && !aiError && !aiInsights && (
                <div className="ai-empty-state">
                  <span className="ai-command-eyebrow">AI workspace</span>
                  <h3>Chưa có báo cáo phân tích</h3>
                  <p>
                    Nhấn nút &ldquo;Tạo phân tích AI&rdquo; để tóm tắt sức khỏe vận hành, nhận diện cảnh báo và ưu tiên việc cần xử lý.
                  </p>
                  <div className="ai-empty-checklist">
                    <span>Tổng quan xu hướng đặt lịch</span>
                    <span>Cảnh báo rủi ro hệ thống</span>
                    <span>Đề xuất cải thiện có thể hành động</span>
                  </div>
                </div>
              )}

              {aiInsights && !aiLoading && (
                <>
                  <div className="ai-overview-grid">
                    <section className={`ai-scorecard tone-${aiRatingMeta.tone}`}>
                      <div className="ai-scorecard-top">
                        <div>
                          <span className="ai-command-eyebrow">Executive summary</span>
                          <h3>Đánh giá tổng thể</h3>
                        </div>
                        <div className={`ai-rating-pill tone-${aiRatingMeta.tone}`}>
                          {aiRatingMeta.label}
                        </div>
                      </div>

                      <div className="ai-scorecard-main">
                        <div className="ai-score-display">
                          <strong>{aiInsights.ratingScore || 0}</strong>
                          <span>/100</span>
                        </div>
                        <div className="ai-scorecopy">
                          <p>{aiRatingMeta.note}</p>
                          <div className="ai-score-meter">
                            <div
                              className="ai-score-meter-fill"
                              style={{ width: `${Math.max(0, Math.min(aiInsights.ratingScore || 0, 100))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {aiInsights.summary && (
                        <div className="ai-summary-card">
                          <p>{aiInsights.summary}</p>
                        </div>
                      )}
                    </section>

                    <div className="ai-kpi-grid">
                      {aiQuickStats.map((item) => (
                        <div key={item.label} className={`ai-kpi-card tone-${item.tone}`}>
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="ai-analysis-grid">
                    <div className="ai-analysis-main">
                      {aiInsights.trends && aiInsights.trends.length > 0 && (
                        <section className="ai-section-card">
                          <div className="ai-section-head">
                            <div>
                              <span className="ai-command-eyebrow">Signals</span>
                              <h3>Xu hướng chính</h3>
                            </div>
                            <span className="ai-section-count">{aiInsights.trends.length}</span>
                          </div>
                          <ul className="ai-insight-list">
                            {aiInsights.trends.map((trend, index) => (
                              <li key={`trend_${index}`}>{trend}</li>
                            ))}
                          </ul>
                        </section>
                      )}

                      {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                        <section className="ai-section-card">
                          <div className="ai-section-head">
                            <div>
                              <span className="ai-command-eyebrow">Action plan</span>
                              <h3>Đề xuất cải thiện</h3>
                            </div>
                            <span className="ai-section-count">{aiInsights.recommendations.length}</span>
                          </div>
                          <ul className="ai-insight-list">
                            {aiInsights.recommendations.map((rec, index) => (
                              <li key={`rec_${index}`}>{rec}</li>
                            ))}
                          </ul>
                        </section>
                      )}
                    </div>

                    <aside className="ai-analysis-rail">
                      {aiInsights.alerts && aiInsights.alerts.length > 0 && (
                        <section className="ai-section-card tone-red">
                          <div className="ai-section-head">
                            <div>
                              <span className="ai-command-eyebrow">Risk watch</span>
                              <h3>Cảnh báo</h3>
                            </div>
                            <span className="ai-section-count">{aiInsights.alerts.length}</span>
                          </div>
                          <ul className="ai-insight-list is-compact">
                            {aiInsights.alerts.map((alert, index) => (
                              <li key={`alert_${index}`}>{alert}</li>
                            ))}
                          </ul>
                        </section>
                      )}

                      {aiInsights.prediction && (
                        <section className="ai-section-card tone-green">
                          <div className="ai-section-head">
                            <div>
                              <span className="ai-command-eyebrow">Forecast</span>
                              <h3>Dự báo xu hướng</h3>
                            </div>
                          </div>
                          <div className="ai-prediction-card">
                            <p>{aiInsights.prediction}</p>
                          </div>
                        </section>
                      )}
                    </aside>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm lock modal */}
      {confirmLock && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setConfirmLock(null)}
        >
          <div className="modal modal-sm">
            <div className="modal-header">
              <h3>
                {confirmLock.account?.isActive !== false ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
              </h3>
              <button type="button" className="btn-icon" onClick={() => setConfirmLock(null)}>
                <IconClose />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Bạn có chắc muốn {confirmLock.account?.isActive !== false ? 'khóa' : 'mở khóa'} tài khoản của bác sĩ{' '}
                <strong>{confirmLock.fullName}</strong>?
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setConfirmLock(null)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => doToggleDoctorActive(confirmLock)}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Doctor modal */}
      {showAddDoctor && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setShowAddDoctor(false)}
        >
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>Thêm bác sĩ mới</h3>
              <button type="button" className="btn-icon" onClick={() => setShowAddDoctor(false)}>
                <IconClose />
              </button>
            </div>
            <form className="modal-body" onSubmit={createDoctor}>
              <div className="form-grid">
                <div className="field-group">
                  <label className="field-label">Họ tên</label>
                  <input
                    className="field-input"
                    value={doctorForm.fullName}
                    onChange={(e) => setDoctorForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Chức danh</label>
                  <input
                    className="field-input"
                    value={doctorForm.title}
                    onChange={(e) => setDoctorForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="BS. CKI"
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Chuyên khoa</label>
                  <input
                    className="field-input"
                    value={doctorForm.specialty}
                    onChange={(e) => setDoctorForm((prev) => ({ ...prev, specialty: e.target.value }))}
                    placeholder="Nội khoa"
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Bệnh viện</label>
                  <input
                    className="field-input"
                    value={doctorForm.hospital}
                    onChange={(e) => setDoctorForm((prev) => ({ ...prev, hospital: e.target.value }))}
                    placeholder="Bệnh viện Việt Đức"
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Kinh nghiệm (năm)</label>
                  <input
                    className="field-input"
                    type="number"
                    value={doctorForm.experienceYears}
                    onChange={(e) => setDoctorForm((prev) => ({ ...prev, experienceYears: e.target.value }))}
                    placeholder="5"
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Đánh giá</label>
                  <input
                    className="field-input"
                    type="number"
                    step="0.1"
                    value={doctorForm.rating}
                    onChange={(e) => setDoctorForm((prev) => ({ ...prev, rating: e.target.value }))}
                    placeholder="4.7"
                  />
                </div>
                <div className="field-group field-group-full">
                  <label className="field-label">Giới thiệu</label>
                  <textarea
                    className="field-input"
                    value={doctorForm.bio}
                    onChange={(e) => setDoctorForm((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Giới thiệu về bác sĩ..."
                    rows={3}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Khung giờ làm việc</label>
                  <textarea
                    className="field-input"
                    value={doctorForm.timeSlots}
                    onChange={(e) => setDoctorForm((prev) => ({ ...prev, timeSlots: e.target.value }))}
                    placeholder="08:00, 09:30, 14:00"
                    rows={2}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Avatar màu</label>
                  <input
                    className="field-input"
                    type="color"
                    value={doctorForm.avatarColor}
                    onChange={(e) => setDoctorForm((prev) => ({ ...prev, avatarColor: e.target.value }))}
                  />
                </div>
                <div className="field-group field-group-full">
                  <label className="field-label">Ảnh đại diện (tùy chọn)</label>
                  <input
                    className="field-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFromDevice}
                  />
                  {doctorForm.avatarUrl && (
                    <div className="avatar-preview">
                      <img src={doctorForm.avatarUrl} alt="Preview" style={{ width: 50, height: 50, borderRadius: '50%' }} />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h4>Thông tin tài khoản</h4>
                <div className="form-grid">
                  <div className="field-group">
                    <label className="field-label">Username</label>
                    <input
                      className="field-input"
                      value={doctorForm.username}
                      onChange={(e) => setDoctorForm((prev) => ({ ...prev, username: e.target.value }))}
                      placeholder="nguyenvana"
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Email</label>
                    <input
                      className="field-input"
                      type="email"
                      value={doctorForm.email}
                      onChange={(e) => setDoctorForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="nguyenvana@example.com"
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Số điện thoại</label>
                    <input
                      className="field-input"
                      value={doctorForm.phone}
                      onChange={(e) => setDoctorForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="0912345678"
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Mật khẩu tạm thời</label>
                    <input
                      className="field-input"
                      type="password"
                      value={doctorForm.tempPassword}
                      onChange={(e) => setDoctorForm((prev) => ({ ...prev, tempPassword: e.target.value }))}
                      placeholder="password123"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAddDoctor(false)}
                  disabled={savingDoctor}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingDoctor}>
                  {savingDoctor ? (
                    <span className="btn-loading">
                      <span className="spinner" />
                      Đang tạo...
                    </span>
                  ) : (
                    'Thêm bác sĩ'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;