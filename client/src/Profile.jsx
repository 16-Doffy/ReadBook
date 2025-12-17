import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('info'); // info | history | bookmarks
  const [theme, setTheme] = useState(localStorage.getItem('readerTheme') || 'dark');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }
    loadUser();
    loadBookmarks();
    loadHistory();
  }, [navigate]);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('userToken') || ''}`,
    'Content-Type': 'application/json',
  });

  const withKeyHeaders = () => {
    const keyId = localStorage.getItem('keyId');
    return {
      'Content-Type': 'application/json',
      ...(keyId && { 'x-key-id': keyId }),
      Authorization: `Bearer ${localStorage.getItem('userToken') || ''}`,
    };
  };

  const loadUser = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: authHeaders(),
      });
      const result = await res.json();
      if (result.success) {
        setUser(result.data);
        setForm({
          full_name: result.data.full_name || '',
          phone: result.data.phone || '',
        });
      }
    } catch {
      // ignore
    }
  };

  const loadBookmarks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/bookmarks`, {
        headers: withKeyHeaders(),
      });
      const result = await res.json();
      if (result.success) setBookmarks(result.data);
    } catch {
      // ignore
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/history`, {
        headers: withKeyHeaders(),
      });
      const result = await res.json();
      if (result.success) setHistory(result.data);
    } catch {
      // ignore
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone,
        }),
      });
      const result = await res.json();
      if (result.success) {
        alert('Đã lưu thông tin cá nhân');
        setUser((prev) => ({ ...prev, ...result.data }));
        const stored = localStorage.getItem('userData');
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem(
            'userData',
            JSON.stringify({ ...parsed, full_name: result.data.full_name, phone: result.data.phone }),
          );
        }
      } else {
        alert(result.message || 'Không thể cập nhật');
      }
    } catch {
      alert('Lỗi kết nối server');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="app-shell">Đang tải...</div>;
  }

  const themeClass = theme === 'light' ? 'theme-light' : theme === 'sepia' ? 'theme-sepia' : '';

  return (
    <div className={`app-shell ${themeClass}`}>
      <header className="app-topbar glass">
        <div className="brand">
          <span>📘</span>
          <span>WebTruyen</span>
        </div>
        <div className="topbar-actions">
          <div className="pill-select" style={{ paddingInline: 10 }}>
            <button
              className={`btn ${theme === 'dark' ? 'primary' : 'ghost'}`}
              style={{ padding: '6px 10px' }}
              onClick={() => {
                setTheme('dark');
                localStorage.setItem('readerTheme', 'dark');
              }}
            >
              🌙
            </button>
            <button
              className={`btn ${theme === 'light' ? 'primary' : 'ghost'}`}
              style={{ padding: '6px 10px' }}
              onClick={() => {
                setTheme('light');
                localStorage.setItem('readerTheme', 'light');
              }}
            >
              🔆
            </button>
            <button
              className={`btn ${theme === 'sepia' ? 'primary' : 'ghost'}`}
              style={{ padding: '6px 10px' }}
              onClick={() => {
                setTheme('sepia');
                localStorage.setItem('readerTheme', 'sepia');
              }}
            >
              📜
            </button>
          </div>
          <button className="btn ghost" onClick={() => navigate('/')}>
            ← Về kho truyện
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar glass content-card">
          <h3 style={{ marginTop: 0 }}>Hồ sơ cá nhân</h3>
          <p style={{ color: 'var(--muted)', marginBottom: 16 }}>{user.username}</p>
          <div className="filter-group">
            {[
              { id: 'info', label: 'Thông tin' },
              { id: 'history', label: 'Lịch sử đọc' },
              { id: 'bookmarks', label: 'Truyện yêu thích' },
            ].map((tab) => (
              <div
                key={tab.id}
                className={`filter-chip ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </div>
            ))}
          </div>
        </aside>

        <main>
          {activeTab === 'info' && (
            <div className="content-card glass">
              <h2>Thông tin tài khoản</h2>
              <form onSubmit={handleSave} style={{ maxWidth: 480, marginTop: 16 }}>
                <div className="filter-group">
                  <label>Họ tên</label>
                  <input
                    className="input"
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="Nhập họ tên"
                  />
                </div>
                <div className="filter-group">
                  <label>Số điện thoại</label>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="0123456789"
                  />
                </div>
                <button className="btn primary" type="submit" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="content-card glass">
              <h2>Lịch sử đọc</h2>
              {history.length === 0 && <p style={{ color: 'var(--muted)' }}>Chưa có lịch sử đọc</p>}
              <div className="section">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="comment-card"
                    style={{ marginBottom: 8, cursor: 'pointer' }}
                    onClick={() => navigate('/', { state: { fromHistory: item } })}
                  >
                    <div style={{ fontWeight: 600 }}>{item.comic_title}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>Chapter {item.chapter_number}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div className="content-card glass">
              <h2>Truyện yêu thích</h2>
              {bookmarks.length === 0 && <p style={{ color: 'var(--muted)' }}>Bạn chưa bookmark truyện nào</p>}
              <div className="comic-grid">
                {bookmarks.map((b) => (
                  <div
                    key={b.comic_id}
                    className="comic-card"
                    onClick={() => navigate('/', { state: { openComicId: b.comic_id } })}
                  >
                    <img src={b.thumbnail} alt={b.title} className="comic-thumb" />
                    <div className="comic-body">
                      <div style={{ fontWeight: 600 }}>{b.title}</div>
                      <div className="comic-meta">
                        <span>Chương {b.last_chapter_number || b.total_chapters}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Profile;


