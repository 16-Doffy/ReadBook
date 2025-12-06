import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authStyles = {
  page: {
    minHeight: '100vh',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Poppins", sans-serif',
  },
  background: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url(https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'brightness(0.7)',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(15,23,42,0.4), rgba(30,41,59,0.6))',
  },
  container: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '450px',
    padding: '20px',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '32px',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '14px',
    color: '#0f172a',
    background: '#fff',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  },
  inputFocus: {
    outline: 'none',
    borderColor: '#38bdf8',
    boxShadow: '0 0 0 3px rgba(56,189,248,0.1)',
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    fontSize: '20px',
    color: '#64748b',
  },
  rememberForgot: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    fontSize: '14px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  checkboxInput: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  forgotLink: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontWeight: 500,
  },
  primaryButton: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: '#0f172a',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '20px',
  },
  primaryButtonHover: {
    background: '#1e293b',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(15,23,42,0.3)',
  },
  signupLink: {
    textAlign: 'center',
    marginBottom: '24px',
    fontSize: '14px',
    color: '#64748b',
  },
  signupLinkA: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontWeight: 600,
  },
  separator: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '24px',
    color: '#94a3b8',
    fontSize: '14px',
  },
  separatorLine: {
    flex: 1,
    height: '1px',
    background: '#e2e8f0',
  },
  separatorText: {
    padding: '0 16px',
  },
  socialButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    background: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '12px',
    transition: 'all 0.2s',
    color: '#0f172a',
  },
  socialButtonHover: {
    borderColor: '#cbd5e1',
    background: '#f8fafc',
  },
};

export function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await res.json();

      if (result.success) {
        if (result.data.user.role === 'admin') {
          localStorage.setItem('adminToken', result.data.token);
          navigate('/admin');
        } else {
          localStorage.setItem('userToken', result.data.token);
          localStorage.setItem('userData', JSON.stringify(result.data.user));
          if (onLogin) onLogin(result.data);
          navigate('/');
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authStyles.page}>
      <div style={authStyles.background}></div>
      <div style={authStyles.overlay}></div>
      <div style={authStyles.container}>
        <div style={authStyles.card}>
          <h1 style={authStyles.title}>Welcome Back!</h1>
          <p style={authStyles.subtitle}>Đăng nhập để đọc truyện tranh</p>
          
          <form onSubmit={handleSubmit}>
            <div style={authStyles.inputGroup}>
              <label style={authStyles.label}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập username của bạn"
                required
                style={authStyles.input}
                onFocus={(e) => Object.assign(e.target.style, authStyles.inputFocus)}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={authStyles.inputGroup}>
              <label style={authStyles.label}>Password</label>
              <div style={authStyles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập password của bạn"
                  required
                  style={authStyles.input}
                  onFocus={(e) => Object.assign(e.target.style, authStyles.inputFocus)}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                <span
                  style={authStyles.eyeIcon}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </span>
              </div>
            </div>

            <div style={authStyles.rememberForgot}>
              <label style={authStyles.checkbox}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={authStyles.checkboxInput}
                />
                <span>Remember me</span>
              </label>
              <a href="#" style={authStyles.forgotLink}>Quên password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...authStyles.primaryButton,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div style={authStyles.signupLink}>
            Chưa có tài khoản?{' '}
            <Link to="/register" style={authStyles.signupLinkA}>
              Đăng ký ngay
            </Link>
          </div>

          <div style={authStyles.separator}>
            <div style={authStyles.separatorLine}></div>
            <span style={authStyles.separatorText}>OR</span>
            <div style={authStyles.separatorLine}></div>
          </div>

          <button
            type="button"
            style={authStyles.socialButton}
            onClick={() => alert('Tính năng đang phát triển')}
          >
            <span>🔵</span>
            Continue with Google
          </button>
          <button
            type="button"
            style={authStyles.socialButton}
            onClick={() => alert('Tính năng đang phát triển')}
          >
            <span>⚫</span>
            Continue with Apple
          </button>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Password và Confirm Password không khớp');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
        }),
      });

      const result = await res.json();

      if (result.success) {
        alert('Đăng ký thành công! Vui lòng đợi admin cấp key.');
        navigate('/login');
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authStyles.page}>
      <div style={authStyles.background}></div>
      <div style={authStyles.overlay}></div>
      <div style={authStyles.container}>
        <div style={authStyles.card}>
          <h1 style={authStyles.title}>Tạo tài khoản mới</h1>
          <p style={authStyles.subtitle}>Đăng ký để bắt đầu đọc truyện tranh</p>
          
          <form onSubmit={handleSubmit}>
            <div style={authStyles.inputGroup}>
              <label style={authStyles.label}>Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Nhập username"
                required
                style={authStyles.input}
                onFocus={(e) => Object.assign(e.target.style, authStyles.inputFocus)}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={authStyles.inputGroup}>
              <label style={authStyles.label}>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
                required
                style={authStyles.input}
                onFocus={(e) => Object.assign(e.target.style, authStyles.inputFocus)}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={authStyles.inputGroup}>
              <label style={authStyles.label}>Password *</label>
              <div style={authStyles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  minLength={6}
                  style={authStyles.input}
                  onFocus={(e) => Object.assign(e.target.style, authStyles.inputFocus)}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                <span
                  style={authStyles.eyeIcon}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </span>
              </div>
            </div>

            <div style={authStyles.inputGroup}>
              <label style={authStyles.label}>Confirm Password *</label>
              <div style={authStyles.passwordWrapper}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Nhập lại password"
                  required
                  style={authStyles.input}
                  onFocus={(e) => Object.assign(e.target.style, authStyles.inputFocus)}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                <span
                  style={authStyles.eyeIcon}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </span>
              </div>
            </div>

            <div style={authStyles.inputGroup}>
              <label style={authStyles.label}>Họ tên</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Họ và tên của bạn"
                style={authStyles.input}
                onFocus={(e) => Object.assign(e.target.style, authStyles.inputFocus)}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={authStyles.inputGroup}>
              <label style={authStyles.label}>Số điện thoại</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0123456789"
                style={authStyles.input}
                onFocus={(e) => Object.assign(e.target.style, authStyles.inputFocus)}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...authStyles.primaryButton,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <div style={authStyles.signupLink}>
            Đã có tài khoản?{' '}
            <Link to="/login" style={authStyles.signupLinkA}>
              Đăng nhập
            </Link>
          </div>

          <div style={authStyles.separator}>
            <div style={authStyles.separatorLine}></div>
            <span style={authStyles.separatorText}>OR</span>
            <div style={authStyles.separatorLine}></div>
          </div>

          <button
            type="button"
            style={authStyles.socialButton}
            onClick={() => alert('Tính năng đang phát triển')}
          >
            <span>🔵</span>
            Continue with Google
          </button>
          <button
            type="button"
            style={authStyles.socialButton}
            onClick={() => alert('Tính năng đang phát triển')}
          >
            <span>⚫</span>
            Continue with Apple
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await res.json();

      if (result.success) {
        if (result.data.user.role === 'admin') {
          localStorage.setItem('adminToken', result.data.token);
          navigate('/admin');
        } else {
          alert(`Bạn không có quyền admin. Role hiện tại: ${result.data.user.role}`);
        }
      } else {
        alert(result.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Lỗi kết nối server. Kiểm tra console để xem chi tiết.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authStyles.page}>
      <div style={authStyles.background}></div>
      <div style={authStyles.overlay}></div>
      <div style={authStyles.container}>
        <div style={authStyles.card}>
          <h1 style={authStyles.title}>🔐 Admin Login</h1>
          <p style={authStyles.subtitle}>Đăng nhập với quyền quản trị</p>
          
          <form onSubmit={handleSubmit}>
            <div style={authStyles.inputGroup}>
              <label style={authStyles.label}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                style={authStyles.input}
                onFocus={(e) => Object.assign(e.target.style, authStyles.inputFocus)}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={authStyles.inputGroup}>
              <label style={authStyles.label}>Password</label>
              <div style={authStyles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={authStyles.input}
                  onFocus={(e) => Object.assign(e.target.style, authStyles.inputFocus)}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                <span
                  style={authStyles.eyeIcon}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...authStyles.primaryButton,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '16px', opacity: 0.7, fontSize: '12px', color: '#64748b' }}>
            Default: admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
