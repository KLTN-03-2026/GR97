import React, { useState, memo } from 'react';
import { api } from '../lib/api';
import { LoginFormProps } from '../types';

const LoginForm: React.FC<LoginFormProps> = memo(({ onLogin }) => {
  const [identifier, setIdentifier] = useState('admin@booking.com');
  const [password, setPassword] = useState('Admin123!@#');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!identifier.trim()) {
      setError('Vui lòng nhập email hoặc số điện thoại.');
      return false;
    }
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu.');
      return false;
    }
    if (password.length < 12) {
      setError('Mật khẩu phải có ít nhất 12 ký tự.');
      return false;
    }
    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasNonalphas) {
      setError('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.');
      return false;
    }
    return true;
  };

  const sanitizeInput = (input: string) => {
    return input.trim().replace(/[<>]/g, '');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const sanitizedIdentifier = sanitizeInput(identifier);
    const sanitizedPassword = sanitizeInput(password);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post('/auth/login', {
        identifier: sanitizedIdentifier,
        password: sanitizedPassword
      });
      if (data?.user?.role !== 'admin') {
        setError('Tài khoản này không có quyền admin.');
        return;
      }
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-shell">
      <div className="login-brand">
        <div className="login-logo">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="12" fill="#1d6fe8" />
            <path
              d="M20 8v24M8 20h24"
              stroke="#fff"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <span>HealthyAI</span>
        </div>
        <p>Admin Portal</p>
      </div>
      <form className="login-card" onSubmit={submit}>
        <h2>Đăng nhập.</h2>
        <p className="login-subtitle">Quản lý hệ thống HealthyAI</p>
        <div className="field-group">
          <label className="field-label" htmlFor="identifier">Email / Số điện thoại</label>
          <input
            id="identifier"
            className="field-input"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="admin@booking.com"
            aria-describedby={error ? "login-error" : undefined}
            autoComplete="username"
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            className="field-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            aria-describedby={error ? "login-error" : undefined}
            autoComplete="current-password"
          />
        </div>
        {error && <div id="login-error" className="alert alert-error" role="alert">{error}</div>}
        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading}
          aria-label={loading ? "Đang đăng nhập" : "Đăng nhập"}
        >
          {loading ? (
            <span className="btn-loading">
              <span className="spinner" aria-hidden="true" />
              Đang đăng nhập...
            </span>
          ) : (
            'Đăng nhập'
          )}
        </button>
      </form>
    </main>
  );
});

export default LoginForm;