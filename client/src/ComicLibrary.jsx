import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiRequest = async (url, options = {}) => {
  const keyId = localStorage.getItem('keyId');
  const headers = {
    'Content-Type': 'application/json',
    ...(keyId && { 'x-key-id': keyId }),
    ...options.headers,
  };
  return fetch(`${API_URL}${url}`, { ...options, headers });
};

const statusBadges = {
  completed: { text: 'Hoàn thành', tone: 'success' },
  ongoing: { text: 'Đang tiến hành', tone: 'warning' },
  draft: { text: 'Mới', tone: '' },
};

function ComicLibrary() {
  const [preview, setPreview] = useState(null);
  const [comics, setComics] = useState([]);
  const [selectedComic, setSelectedComic] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapterContent, setChapterContent] = useState(null);
  const [inputKey, setInputKey] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authorQuery, setAuthorQuery] = useState('');
  const [bookmarks, setBookmarks] = useState([]);
  const [readingHistory, setReadingHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userData, setUserData] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({ content: '', rating: 5 });
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showExtendKey, setShowExtendKey] = useState(false);
  const [extendDays, setExtendDays] = useState('30');
  const [theme, setTheme] = useState(localStorage.getItem('readerTheme') || 'dark');
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('readerFontSize') || '18', 10));
  const [fontFamily, setFontFamily] = useState(localStorage.getItem('readerFontFamily') || 'serif');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [sortOption, setSortOption] = useState('recent');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const savedUserData = localStorage.getItem('userData');

    if (token && savedUserData) {
      const user = JSON.parse(savedUserData);
      setUserData(user);
      setInputKey(user.key?.key_value || '');
      if (user.key?.key_value) {
        handleUnlockWithKey(user.key.key_value);
      }
    } else {
      navigate('/login');
    }

    fetch(`${API_URL}/api/preview`)
      .then((res) => res.json())
      .then((response) => setPreview(response.data))
      .catch(() => {
        setPreview({
          title: 'Không thể tải dữ liệu',
          content: 'Kiểm tra lại kết nối với server backend.',
          image_url: '',
        });
      });
  }, [navigate]);

  // Handle redirects from Profile (open comic or history item)
  useEffect(() => {
    if (!location.state) return;
    const { openComicId, fromHistory } = location.state;
    if (openComicId) {
      handleSelectComic(openComicId);
    } else if (fromHistory) {
      handleSelectComic(fromHistory.comic_id);
      setTimeout(() => handleSelectChapter(fromHistory.comic_id, fromHistory.chapter_number), 300);
    }
  }, [location.state]);

  useEffect(() => {
    if (isUnlocked) {
      loadBookmarks();
      loadHistory();
    }
  }, [isUnlocked]);

  useEffect(() => {
    if (selectedComic && isUnlocked) {
      checkBookmark();
      loadComments();
    }
  }, [selectedComic, isUnlocked]);

  useEffect(() => {
    localStorage.setItem('readerTheme', theme);
    localStorage.setItem('readerFontSize', String(fontSize));
    localStorage.setItem('readerFontFamily', fontFamily);
  }, [theme, fontSize, fontFamily]);

  const loadBookmarks = async () => {
    try {
      const res = await apiRequest('/api/bookmarks');
      const result = await res.json();
      if (result.success) setBookmarks(result.data);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await apiRequest('/api/history');
      const result = await res.json();
      if (result.success) setReadingHistory(result.data);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const checkBookmark = async () => {
    if (!selectedComic) return;
    try {
      const res = await apiRequest(`/api/bookmark/check?comicId=${selectedComic.id}`);
      const result = await res.json();
      if (result.success) setIsBookmarked(result.data.isBookmarked);
    } catch (error) {
      console.error('Error checking bookmark:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!selectedComic) return;
    try {
      if (isBookmarked) {
        await apiRequest('/api/bookmark', { method: 'DELETE', body: JSON.stringify({ comicId: selectedComic.id }) });
        setIsBookmarked(false);
      } else {
        await apiRequest('/api/bookmark', { method: 'POST', body: JSON.stringify({ comicId: selectedComic.id }) });
        setIsBookmarked(true);
      }
      loadBookmarks();
    } catch (error) {
      alert('Không thể cập nhật bookmark');
    }
  };

  const handleUnlockWithKey = async (keyValue) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unlockKey: keyValue }),
      });
      const result = await res.json();
      if (result.success) {
        setComics(result.data.comics || []);
        setIsUnlocked(true);
        localStorage.setItem('keyId', result.data.keyId);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Không thể kết nối server, thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async () => {
    await handleUnlockWithKey(inputKey);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('keyId');
    setIsUnlocked(false);
    setComics([]);
    setSelectedComic(null);
    setSelectedChapter(null);
    setChapterContent(null);
    setInputKey('');
    setBookmarks([]);
    setReadingHistory([]);
    setUserData(null);
    navigate('/login');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && !authorQuery.trim()) {
      const res = await apiRequest('/api/comics');
      const result = await res.json();
      if (result.success) setComics(result.data);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/comics/search?q=${encodeURIComponent(searchQuery)}&author=${encodeURIComponent(authorQuery)}`);
      const result = await res.json();
      if (result.success) setComics(result.data);
    } catch (error) {
      alert('Không thể tìm kiếm');
    }
  };

  const handleSelectComic = async (comicId) => {
    try {
      const res = await fetch(`${API_URL}/api/comic/${comicId}`);
      const result = await res.json();
      if (result.success) {
        setSelectedComic(result.data);
        setSelectedChapter(null);
        setChapterContent(null);
      }
    } catch (error) {
      alert('Không thể tải thông tin truyện.');
    }
  };

  const handleSelectChapter = async (comicId, chapterNumber) => {
    setIsLoadingChapter(true);
    try {
      const res = await apiRequest(`/api/comic/${comicId}/chapter/${chapterNumber}`);
      const result = await res.json();
      if (result.success) {
        setSelectedChapter(result.data);
        setChapterContent(result.data.pages_content);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadHistory();
      }
    } catch (error) {
      alert('Không thể tải nội dung chapter.');
    } finally {
      setIsLoadingChapter(false);
    }
  };

  const handlePreviousChapter = () => {
    if (!selectedComic || !selectedChapter) return;
    if (selectedChapter.number > 1) {
      handleSelectChapter(selectedComic.id, selectedChapter.number - 1);
    }
  };

  const handleNextChapter = () => {
    if (!selectedComic || !selectedChapter) return;
    if (selectedChapter.number < selectedComic.totalChapters) {
      handleSelectChapter(selectedComic.id, selectedChapter.number + 1);
    }
  };

  const handleHistoryClick = (historyItem) => {
    handleSelectComic(historyItem.comic_id);
    setTimeout(() => handleSelectChapter(historyItem.comic_id, historyItem.chapter_number), 300);
    setShowHistory(false);
  };

  const loadComments = async () => {
    if (!selectedComic) return;
    try {
      const res = await fetch(`${API_URL}/api/comic/${selectedComic.id}/comments`);
      const result = await res.json();
      if (result.success) setComments(result.data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!selectedComic || !newComment.content.trim()) return;
    try {
      const res = await apiRequest(`/api/comic/${selectedComic.id}/comment`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment.content, rating: newComment.rating }),
      });
      const result = await res.json();
      if (result.success) {
        setComments([result.data, ...comments]);
        setNewComment({ content: '', rating: 5 });
        setShowCommentForm(false);
        alert('Đã thêm đánh giá thành công!');
      } else {
        alert(result.message || 'Không thể thêm comment');
      }
    } catch (error) {
      alert('Lỗi kết nối server');
    }
  };

  const handleExtendKey = async () => {
    if (!extendDays || parseInt(extendDays, 10) <= 0) {
      alert('Vui lòng nhập số ngày hợp lệ');
      return;
    }
    try {
      const token = localStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/user/extend-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ days: parseInt(extendDays, 10) }),
      });
      const result = await res.json();
      if (result.success) {
        alert(`Đã gia hạn key thêm ${extendDays} ngày! Hết hạn mới: ${result.data.new_expiry_date}`);
        const userRes = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        const userResult = await userRes.json();
        if (userResult.success) {
          setUserData(userResult.data);
          localStorage.setItem('userData', JSON.stringify(userResult.data));
        }
        setShowExtendKey(false);
        setExtendDays('30');
      } else {
        alert(result.message || 'Không thể gia hạn key');
      }
    } catch (error) {
      alert('Lỗi kết nối server');
    }
  };

  const getExpiryStatus = (expiresAt) => {
    if (!expiresAt) return { text: 'Không hết hạn', color: '#22c55e', status: 'unlimited' };
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: 'Đã hết hạn', color: '#ef4444', status: 'expired' };
    if (diffDays <= 7) return { text: `Còn ${diffDays} ngày`, color: '#f59e0b', status: 'warning' };
    return { text: `Còn ${diffDays} ngày`, color: '#22c55e', status: 'active' };
  };

  const genres = useMemo(() => {
    const fromComics = comics.map((c) => c.genre).filter(Boolean);
    return ['all', ...Array.from(new Set(fromComics))];
  }, [comics]);

  const filteredComics = useMemo(() => {
    let result = [...comics];
    if (statusFilter !== 'all') result = result.filter((c) => (statusFilter === 'completed' ? c.status === 'completed' : c.status !== 'completed'));
    if (genreFilter !== 'all') result = result.filter((c) => c.genre === genreFilter);
    if (searchQuery.trim()) result = result.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (authorQuery.trim()) result = result.filter((c) => c.author?.toLowerCase().includes(authorQuery.toLowerCase()));
    switch (sortOption) {
      case 'views':
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        result.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
    return result;
  }, [comics, statusFilter, genreFilter, searchQuery, authorQuery, sortOption]);

  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(filteredComics.length / pageSize));
  const pagedComics = filteredComics.slice((page - 1) * pageSize, page * pageSize);

  const ratingStats = useMemo(() => {
    if (comments.length === 0) return { avg: 0, total: 0, breakdown: [0, 0, 0, 0, 0] };
    const breakdown = [0, 0, 0, 0, 0];
    let sum = 0;
    comments.forEach((c) => {
      const idx = Math.min(5, Math.max(1, c.rating || 0)) - 1;
      breakdown[idx] += 1;
      sum += c.rating || 0;
    });
    const total = comments.length;
    const avg = (sum / total).toFixed(1);
    return { avg, total, breakdown };
  }, [comments]);

  const recommended = useMemo(() => filteredComics.slice(0, 3), [filteredComics]);

  const renderStatusBadge = (status) => {
    const badge = statusBadges[status] || statusBadges.draft;
    return <span className={`badge ${badge.tone}`}>{badge.text}</span>;
  };

  const renderComicList = () => (
    <div className="content-card glass">
      <div className="content-header">
        <div>
          <div className="badge-pill">Hiện có {filteredComics.length} kết quả</div>
          <h2 style={{ margin: '6px 0 0' }}>Kho Truyện</h2>
        </div>
        <div className="pill-select">
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Sắp xếp theo:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="input"
            style={{ width: 160, background: 'transparent', border: 'none', padding: 0 }}
          >
            <option value="recent">Mới cập nhật</option>
            <option value="views">Lượt xem</option>
            <option value="rating">Đánh giá cao</option>
          </select>
        </div>
      </div>

      <div className="comic-grid">
        {pagedComics.map((comic) => (
          <div key={comic.id} className="comic-card" onClick={() => handleSelectComic(comic.id)}>
            {renderStatusBadge(comic.status)}
            <img src={comic.thumbnail} alt={comic.title} className="comic-thumb" />
            <div className="comic-body">
              <div style={{ fontWeight: 700, fontSize: 15 }}>{comic.title}</div>
              <div className="comic-meta" style={{ margin: '6px 0 8px' }}>
                <span className="tag">Chương {comic.totalChapters}</span>
                <span className="tag">⭐ {comic.rating || '4.8'}</span>
              </div>
              <div className="comic-meta">
                <span>✍ {comic.author}</span>
                <span>👁 {comic.views?.toLocaleString() || '—'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pagination">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            className={`page-btn ${page === idx + 1 ? 'active' : ''}`}
            onClick={() => setPage(idx + 1)}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );

  const renderComicDetail = () => {
    if (!selectedComic) return null;
    const latestChapters = selectedComic.chapters?.slice(0, 6) || [];
    return (
      <div className="content-card glass" style={{ marginTop: 12 }}>
        <div className="detail-hero">
          <div>
            <img src={selectedComic.thumbnail} alt={selectedComic.title} className="detail-cover" />
          </div>
          <div>
            <div className="detail-header">
              <div>
                <div className="badge-pill" style={{ marginBottom: 8 }}>
                  {renderStatusBadge(selectedComic.status)}
                  <span>•</span>
                  <span>{selectedComic.totalChapters} chương</span>
                </div>
                <h1 style={{ margin: 0 }}>{selectedComic.title}</h1>
                <div className="comic-meta" style={{ marginTop: 6 }}>
                  <span>✍ {selectedComic.author}</span>
                  <span>⭐ {selectedComic.rating}</span>
                  <span>👁 {selectedComic.views?.toLocaleString() || 0}</span>
                </div>
              </div>
              <div className="actions">
                <button className="btn primary" onClick={() => handleSelectChapter(selectedComic.id, 1)}>
                  📖 Đọc ngay
                </button>
                <button className="btn" onClick={toggleBookmark}>
                  {isBookmarked ? '🔖 Bỏ lưu' : '📑 Thêm vào tủ sách'}
                </button>
                <button className="btn ghost" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                  ↗ Chia sẻ
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              <span className="pill">Tiên Hiệp</span>
              <span className="pill">{selectedComic.genre}</span>
              <span className="pill">Xuyên Không</span>
              <span className="pill">Hài Hước</span>
            </div>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginTop: 12 }}>{selectedComic.description}</p>
          </div>
        </div>

        <div className="section">
          <div className="section-title">
            <h3 style={{ margin: 0 }}>Danh sách chương</h3>
            <button className="btn ghost" onClick={() => handleSelectChapter(selectedComic.id, 1)}>
              Xem tất cả
            </button>
          </div>
          <table className="chapter-table">
            <tbody>
              {latestChapters.map((chapter) => (
                <tr key={chapter.id}>
                  <td style={{ width: '40%', fontWeight: 600 }}>
                    <button className="btn ghost" onClick={() => handleSelectChapter(selectedComic.id, chapter.number)}>
                      Chương {chapter.number}: {chapter.title}
                    </button>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{chapter.releaseDate || 'Hôm nay'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="pill">Đủ dịch</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section">
          <div className="section-title">
            <h3 style={{ margin: 0 }}>Đánh giá & Bình luận</h3>
            <button className="btn ghost" onClick={() => setShowCommentForm((v) => !v)}>
              {showCommentForm ? 'Ẩn form' : 'Viết đánh giá'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, flexWrap: 'wrap' }}>
            <div className="glass" style={{ padding: 14 }}>
              <div style={{ fontSize: 34, fontWeight: 700 }}>{ratingStats.avg}</div>
              <div className="rating-stars">★★★★★</div>
              <p style={{ color: 'var(--muted)' }}>{ratingStats.total} đánh giá</p>
              {ratingStats.breakdown
                .slice()
                .reverse()
                .map((count, idx) => {
                  const star = 5 - idx;
                  const percent = ratingStats.total ? Math.round((count / ratingStats.total) * 100) : 0;
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ width: 30 }}>{star}★</span>
                      <div className="rating-bar" style={{ flex: 1 }}>
                        <span style={{ width: `${percent}%` }} />
                      </div>
                      <span style={{ width: 34, textAlign: 'right', color: 'var(--muted)' }}>{percent}%</span>
                    </div>
                  );
                })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {showCommentForm && (
                <div className="comment-card">
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className="btn ghost"
                        style={{ color: star <= newComment.rating ? '#fbbf24' : 'var(--muted)', padding: '8px 10px' }}
                        onClick={() => setNewComment({ ...newComment, rating: star })}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newComment.content}
                    onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Chia sẻ cảm nhận của bạn..."
                    style={{ resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button className="btn primary" disabled={!newComment.content.trim()} onClick={handleSubmitComment}>
                      Gửi bình luận
                    </button>
                  </div>
                </div>
              )}
              {comments.length === 0 && <p style={{ color: 'var(--muted)' }}>Chưa có bình luận</p>}
              {comments.map((comment) => (
                <div key={comment.id} className="comment-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{comment.username}</strong>
                      <div className="rating-stars" style={{ color: '#fbbf24' }}>
                        {'★★★★★'.slice(0, comment.rating)}
                      </div>
                    </div>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0 0', lineHeight: 1.6 }}>{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="section">
          <h3 style={{ marginTop: 0 }}>Có thể bạn thích</h3>
          <div className="comic-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {recommended.map((comic) => (
              <div key={comic.id} className="comic-card" onClick={() => handleSelectComic(comic.id)}>
                <img src={comic.thumbnail} alt={comic.title} className="comic-thumb" />
                <div className="comic-body">
                  <div style={{ fontWeight: 600 }}>{comic.title}</div>
                  <div className="comic-meta" style={{ marginTop: 6 }}>
                    <span>⭐ {comic.rating}</span>
                    <span>Chương {comic.totalChapters}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderReader = () => {
    if (!selectedChapter || !chapterContent) return null;
    const hasPrevious = selectedChapter.number > 1;
    const hasNext = selectedChapter.number < selectedComic.totalChapters;
    const readerStyle = {
      '--reader-size': `${fontSize}px`,
      '--reader-font': fontFamily === 'serif' ? `'Playfair Display', serif` : `'Be Vietnam Pro', sans-serif`,
    };
    return (
      <div className="reader-shell">
        <div className="reader-toolbar glass">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn ghost" onClick={() => setSelectedChapter(null)}>
              ← Danh sách chương
            </button>
            <div className="pill-select">
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>Chế độ:</span>
              {['dark', 'light', 'sepia'].map((t) => (
                <button
                  key={t}
                  className={`btn ${theme === t ? 'primary' : 'ghost'}`}
                  onClick={() => setTheme(t)}
                  style={{ padding: '8px 12px' }}
                >
                  {t === 'dark' ? '🌙' : t === 'light' ? '🔆' : '📜'}
                </button>
              ))}
            </div>
            <div className="pill-select">
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>Font:</span>
              <button className={`btn ${fontFamily === 'serif' ? 'primary' : 'ghost'}`} onClick={() => setFontFamily('serif')}>
                Serif
              </button>
              <button className={`btn ${fontFamily === 'sans' ? 'primary' : 'ghost'}`} onClick={() => setFontFamily('sans')}>
                Sans
              </button>
            </div>
            <div className="pill-select">
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>Cỡ chữ</span>
              <input
                type="range"
                min="16"
                max="22"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              />
              <span style={{ width: 30, textAlign: 'right' }}>{fontSize}px</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" disabled={!hasPrevious} onClick={handlePreviousChapter}>
              ← Chương trước
            </button>
            <button className="btn primary" disabled={!hasNext} onClick={handleNextChapter}>
              Chương tiếp →
            </button>
          </div>
        </div>

        <div className="reader-body glass" style={readerStyle}>
          <div className="comic-meta" style={{ marginBottom: 12 }}>
            <span>{selectedComic.title}</span>
            <span>Chương {selectedChapter.number}</span>
          </div>
          <h1 style={{ marginTop: 0 }}>{selectedChapter.title}</h1>
          {isLoadingChapter && <p>Đang tải...</p>}
          {!isLoadingChapter &&
            chapterContent.map((page, idx) => {
              if (page.imageUrl) {
                return (
                  <img
                    key={idx}
                    src={page.imageUrl}
                    alt={`Page ${page.pageNumber}`}
                    style={{ width: '100%', borderRadius: 12, margin: '12px 0' }}
                  />
                );
              }
              return (
                <p key={idx} style={{ margin: '16px 0' }}>
                  {page.text || page.content || ''}
                </p>
              );
            })}
          <div className="reader-quote">“Kẻ mạnh không phải là kẻ giẫm đạp lên người khác, mà là kẻ giúp đỡ người khác đứng lên.”</div>
        </div>

        <div className="reader-toolbar glass" style={{ marginTop: 14 }}>
          <button className="btn" disabled={!hasPrevious} onClick={handlePreviousChapter}>
            ← Chương trước
          </button>
          <button className="btn ghost" onClick={() => setSelectedChapter(null)}>
            Mục lục
          </button>
          <button className="btn primary" disabled={!hasNext} onClick={handleNextChapter}>
            Chương tiếp →
          </button>
        </div>
      </div>
    );
  };

  if (!userData) return <div className="app-shell">Đang tải...</div>;

  const themeClass = theme === 'light' ? 'theme-light' : theme === 'sepia' ? 'theme-sepia' : '';

  return (
    <div className={`app-shell ${themeClass}`}>
      <header className="app-topbar glass">
        <div className="brand">
          <span>📘</span>
          <span>WebTruyen</span>
          <nav className="nav-links">
            <span className="nav-pill active">Kho Truyện</span>
            <span className="nav-pill">Xếp hạng</span>
            <span className="nav-pill">Tủ sách</span>
          </nav>
        </div>
        <div className="topbar-actions">
          <div className="search-box">
            <span>🔍</span>
            <input
              placeholder="Tìm kiếm truyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="pill-select" style={{ paddingInline: 10 }}>
            <button
              className={`btn ${theme === 'dark' ? 'primary' : 'ghost'}`}
              style={{ padding: '6px 10px' }}
              onClick={() => setTheme('dark')}
            >
              🌙
            </button>
            <button
              className={`btn ${theme === 'light' ? 'primary' : 'ghost'}`}
              style={{ padding: '6px 10px' }}
              onClick={() => setTheme('light')}
            >
              🔆
            </button>
            <button
              className={`btn ${theme === 'sepia' ? 'primary' : 'ghost'}`}
              style={{ padding: '6px 10px' }}
              onClick={() => setTheme('sepia')}
            >
              📜
            </button>
          </div>
          <img className="avatar" src="https://i.pravatar.cc/100" alt="avatar" onClick={() => navigate('/profile')} />
          <button className="btn ghost" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar glass content-card">
          <div className="filter-group">
            <h4>Tìm kiếm theo tác giả</h4>
            <input
              className="input"
              placeholder="Nhập tên tác giả..."
              value={authorQuery}
              onChange={(e) => setAuthorQuery(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <h4>Trạng thái</h4>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'ongoing', label: 'Đang tiến hành' },
              { id: 'completed', label: 'Đã hoàn thành' },
            ].map((item) => (
              <label
                key={item.id}
                className={`filter-chip ${statusFilter === item.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(item.id)}
              >
                <input type="radio" checked={statusFilter === item.id} readOnly /> {item.label}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <h4>Thể loại</h4>
            {genres.slice(0, 8).map((g) => (
              <span
                key={g}
                className={`filter-chip ${genreFilter === g ? 'active' : ''}`}
                onClick={() => setGenreFilter(g)}
              >
                {g === 'all' ? 'Tất cả' : g}
              </span>
            ))}
          </div>
          <button className="primary-btn" onClick={handleSearch}>
            Áp dụng bộ lọc
          </button>
        </aside>

        <main>
          {!isUnlocked && preview && (
            <div className="content-card glass" style={{ marginBottom: 14 }}>
              <h2>{preview.title}</h2>
              <p style={{ color: 'var(--muted)' }}>{preview.content}</p>
              {preview.image_url && <img src={preview.image_url} alt="preview" style={{ width: '100%', borderRadius: 12 }} />}
              <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  className="input"
                  placeholder="Nhập key để mở khóa..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
                <button className="btn primary" disabled={isLoading || !inputKey.trim()} onClick={handleUnlock}>
                  {isLoading ? 'Đang xử lý...' : 'Mở khóa ngay'}
                </button>
                {userData?.key?.expires_at && (
                  <button className="btn" onClick={() => setShowExtendKey(true)}>
                    Gia hạn key
                  </button>
                )}
              </div>
            </div>
          )}

          {isUnlocked && !selectedComic && renderComicList()}
          {selectedComic && !selectedChapter && renderComicDetail()}
          {selectedChapter && renderReader()}
        </main>
      </div>

      {showHistory && isUnlocked && (
        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            width: 320,
            height: '100vh',
            background: 'rgba(11,18,32,0.95)',
            padding: 20,
            overflowY: 'auto',
            zIndex: 1000,
          }}
          className="glass"
        >
          <div className="section-title" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>📖 Lịch sử đọc</h3>
            <button className="btn ghost" onClick={() => setShowHistory(false)}>
              ✕
            </button>
          </div>
          {readingHistory.length === 0 && <p style={{ color: 'var(--muted)' }}>Chưa có lịch sử đọc</p>}
          {readingHistory.map((item) => (
            <div key={item.id} className="comment-card" onClick={() => handleHistoryClick(item)} style={{ cursor: 'pointer' }}>
              <div style={{ fontWeight: 600 }}>{item.comic_title}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Chapter {item.chapter_number}</div>
            </div>
          ))}
        </div>
      )}

      {showExtendKey && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
          }}
          onClick={() => setShowExtendKey(false)}
        >
          <div className="content-card glass" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
            <h3>Gia hạn Key</h3>
            <p style={{ color: 'var(--muted)' }}>
              Key hiện tại: <code>{userData.key?.key_value}</code>
            </p>
            <input
              className="input"
              type="number"
              min="1"
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
              placeholder="30"
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="btn primary" onClick={handleExtendKey}>
                Gia hạn
              </button>
              <button className="btn ghost" onClick={() => setShowExtendKey(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComicLibrary;

