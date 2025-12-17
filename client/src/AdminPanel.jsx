import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const appStyles = {
  page: {
    minHeight: '100vh',
    padding: '32px',
    background: 'linear-gradient(135deg,#0f172a,#1e293b)',
    fontFamily: '"Poppins", sans-serif',
    color: '#fff',
  },
  card: {
    borderRadius: '24px',
    padding: '24px',
    background: 'rgba(15,23,42,0.6)',
    boxShadow: '0 20px 40px rgba(2,6,23,0.6)',
    backdropFilter: 'blur(20px)',
  },
};

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAssignKey, setShowAssignKey] = useState(false);
  const [keyValue, setKeyValue] = useState('');
  const [expiresDays, setExpiresDays] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'comments', 'stats'
  const [comments, setComments] = useState([]);
  const [commentStats, setCommentStats] = useState(null);
  const [readingStats, setReadingStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadUsers();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'comments') {
      loadComments();
    } else if (activeTab === 'stats') {
      loadStats();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setUsers(result.data);
      } else {
        alert('Không thể tải danh sách users');
      }
    } catch (error) {
      alert('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignKey = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/admin/users/${selectedUser.id}/assign-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          key_value: keyValue || null,
          expires_days: expiresDays ? parseInt(expiresDays) : null,
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert(`Đã cấp key ${result.data.key.key_value} cho user ${result.data.user.username}`);
        setShowAssignKey(false);
        setKeyValue('');
        setExpiresDays('');
        setSelectedUser(null);
        loadUsers();
      } else {
        alert(result.message || 'Không thể cấp key');
      }
    } catch (error) {
      alert('Lỗi kết nối server');
    }
  };

  const handleUpdateStatus = async (userId, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const result = await res.json();
      if (result.success) {
        loadUsers();
      } else {
        alert(result.message || 'Không thể cập nhật');
      }
    } catch (error) {
      alert('Lỗi kết nối server');
    }
  };

  const loadComments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/admin/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setComments(result.data);
      }
    } catch (error) {
      alert('Lỗi tải comments');
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const [commentRes, readingRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats/comments`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/admin/stats/reading`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);
      
      const commentResult = await commentRes.json();
      const readingResult = await readingRes.json();
      
      if (commentResult.success) {
        setCommentStats(commentResult.data);
      }
      if (readingResult.success) {
        setReadingStats(readingResult.data);
      }
    } catch (error) {
      alert('Lỗi tải thống kê');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Bạn có chắc muốn xóa comment này?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await res.json();
      if (result.success) {
        loadComments();
      } else {
        alert(result.message || 'Không thể xóa comment');
      }
    } catch (error) {
      alert('Lỗi kết nối server');
    }
  };

  const handleToggleCommentApproval = async (commentId, isApproved) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/admin/comments/${commentId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ is_approved: !isApproved }),
      });
      
      const result = await res.json();
      if (result.success) {
        loadComments();
      } else {
        alert(result.message || 'Không thể cập nhật');
      }
    } catch (error) {
      alert('Lỗi kết nối server');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  if (loading) {
    return (
      <div style={appStyles.page}>
        <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div style={appStyles.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px' }}>🔐 Admin Panel</h1>
          <p style={{ opacity: 0.7, marginTop: '8px' }}>Quản lý users, comments và thống kê</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(148,163,184,0.4)',
            background: 'rgba(239,68,68,0.2)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Đăng xuất
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {['users', 'comments', 'stats'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: '1px solid rgba(148,163,184,0.4)',
              background: activeTab === tab ? 'rgba(56,189,248,0.2)' : 'rgba(15,23,42,0.4)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {tab === 'users' ? '👥 Users' : tab === 'comments' ? '💬 Comments' : '📊 Thống kê'}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div style={appStyles.card}>
          <h2 style={{ marginTop: 0 }}>Danh sách Users ({users.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.3)' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Username</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Key</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                  <td style={{ padding: '12px' }}>{user.username}</td>
                  <td style={{ padding: '12px' }}>{user.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        background:
                          user.status === 'active'
                            ? 'rgba(34,197,94,0.2)'
                            : user.status === 'pending'
                            ? 'rgba(251,191,36,0.2)'
                            : 'rgba(239,68,68,0.2)',
                        color: '#fff',
                      }}
                    >
                      {user.status === 'active' ? '✅ Active' : user.status === 'pending' ? '⏳ Pending' : '❌ Banned'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {user.key ? (
                      <div>
                        <code style={{ background: 'rgba(15,23,42,0.5)', padding: '4px 8px', borderRadius: '4px', display: 'block', marginBottom: '4px' }}>
                          {user.key.key_value}
                        </code>
                        {user.key.expires_at ? (
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>
                            Hết hạn: {new Date(user.key.expires_at).toLocaleDateString('vi-VN')}
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', opacity: 0.7, color: '#22c55e' }}>
                            Không hết hạn
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ opacity: 0.5 }}>Chưa có key</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!user.key && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowAssignKey(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#38bdf8',
                            color: '#0f172a',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          Cấp Key
                        </button>
                      )}
                      {user.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(user.id, 'active')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(34,197,94,0.2)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Kích hoạt
                        </button>
                      )}
                      {user.status === 'active' && (
                        <button
                          onClick={() => handleUpdateStatus(user.id, 'banned')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(239,68,68,0.2)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Ban
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div style={appStyles.card}>
          <h2 style={{ marginTop: 0 }}>Quản lý Comments ({comments.length})</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.3)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Truyện</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Rating</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Nội dung</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((comment) => (
                  <tr key={comment.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                    <td style={{ padding: '12px' }}>{comment.comic_title}</td>
                    <td style={{ padding: '12px' }}>
                      <div>{comment.username}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>{comment.email}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} style={{ color: star <= comment.rating ? '#fbbf24' : '#64748b' }}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px', maxWidth: '300px' }}>
                      <div style={{ fontSize: '14px' }}>{comment.content}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                        {new Date(comment.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          background: comment.is_approved ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)',
                          color: '#fff',
                        }}
                      >
                        {comment.is_approved ? '✅ Đã duyệt' : '⏳ Chờ duyệt'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleToggleCommentApproval(comment.id, comment.is_approved)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: comment.is_approved ? 'rgba(251,191,36,0.2)' : 'rgba(34,197,94,0.2)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          {comment.is_approved ? 'Ẩn' : 'Duyệt'}
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(239,68,68,0.2)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div>
          {/* Comment Stats */}
          {commentStats && (
            <div style={{ ...appStyles.card, marginBottom: '24px' }}>
              <h2 style={{ marginTop: 0 }}>📊 Thống kê Comments</h2>
              
              <div style={{ marginBottom: '24px' }}>
                <h3>👥 Top Users đánh giá nhiều nhất</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
                  {commentStats.topUsers?.map((user, idx) => (
                    <div key={idx} style={{ padding: '12px', background: 'rgba(15,23,42,0.4)', borderRadius: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{user.username}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>{user.email}</div>
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#38bdf8' }}>
                        {user.commentCount} comments
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3>📚 Top Truyện được đánh giá nhiều nhất</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
                  {commentStats.topComics?.map((comic, idx) => (
                    <div key={idx} style={{ padding: '12px', background: 'rgba(15,23,42,0.4)', borderRadius: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{comic.title}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>{comic.genre}</div>
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#38bdf8' }}>
                        {comic.commentCount} comments
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3>🏷️ Top Thể loại được đánh giá</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginTop: '12px' }}>
                  {commentStats.topGenres?.map((genre, idx) => (
                    <div key={idx} style={{ padding: '12px', background: 'rgba(15,23,42,0.4)', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 600 }}>{genre.genre || 'Unknown'}</div>
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#38bdf8' }}>
                        {genre.commentCount} comments
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3>⭐ Top Truyện có rating cao nhất</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
                  {commentStats.avgRatings?.map((comic, idx) => (
                    <div key={idx} style={{ padding: '12px', background: 'rgba(15,23,42,0.4)', borderRadius: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{comic.title}</div>
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#fbbf24' }}>
                        ⭐ {comic.avgRating} ({comic.ratingCount} đánh giá)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reading Stats */}
          {readingStats && (
            <div style={appStyles.card}>
              <h2 style={{ marginTop: 0 }}>📖 Thống kê Đọc truyện</h2>
              
              <div style={{ marginBottom: '24px' }}>
                <h3>👁️ Top Truyện có lượt xem nhiều nhất</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
                  {readingStats.topComicsByViews?.map((comic, idx) => (
                    <div key={idx} style={{ padding: '12px', background: 'rgba(15,23,42,0.4)', borderRadius: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{comic.title}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>{comic.genre}</div>
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#38bdf8' }}>
                        {comic.views?.toLocaleString() || 0} views
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3>📚 Top Truyện được đọc nhiều nhất</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
                  {readingStats.topComicsByReads?.map((comic, idx) => (
                    <div key={idx} style={{ padding: '12px', background: 'rgba(15,23,42,0.4)', borderRadius: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{comic.title}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>{comic.genre}</div>
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#38bdf8' }}>
                        {comic.readCount} lần đọc
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3>🏷️ Top Thể loại được đọc nhiều nhất</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginTop: '12px' }}>
                  {readingStats.topGenresByReads?.map((genre, idx) => (
                    <div key={idx} style={{ padding: '12px', background: 'rgba(15,23,42,0.4)', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 600 }}>{genre.genre || 'Unknown'}</div>
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#38bdf8' }}>
                        {genre.readCount} lần đọc
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3>👤 Top Users đọc nhiều nhất</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
                  {readingStats.topUsersByReads?.map((user, idx) => (
                    <div key={idx} style={{ padding: '12px', background: 'rgba(15,23,42,0.4)', borderRadius: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{user.username}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>{user.email}</div>
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#38bdf8' }}>
                        {user.readCount} lần đọc
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal cấp key */}
      {showAssignKey && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAssignKey(false)}
        >
          <div
            style={appStyles.card}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Cấp Key cho {selectedUser?.username}</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Key (để trống để tự động tạo):</label>
              <input
                type="text"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder="KEY_USER_001 hoặc để trống"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(148,163,184,0.4)',
                  background: 'rgba(15,23,42,0.5)',
                  color: '#fff',
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Thời hạn (ngày, để trống = không hết hạn):</label>
              <input
                type="number"
                value={expiresDays}
                onChange={(e) => setExpiresDays(e.target.value)}
                placeholder="30"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(148,163,184,0.4)',
                  background: 'rgba(15,23,42,0.5)',
                  color: '#fff',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleAssignKey}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#38bdf8',
                  color: '#0f172a',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cấp Key
              </button>
              <button
                onClick={() => {
                  setShowAssignKey(false);
                  setKeyValue('');
                  setExpiresDays('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(148,163,184,0.4)',
                  background: 'rgba(148,163,184,0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;

