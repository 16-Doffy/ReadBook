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

// Helper: Gửi request với authentication
const apiRequest = async (url, options = {}) => {
  const keyId = localStorage.getItem('keyId');
  const headers = {
    'Content-Type': 'application/json',
    ...(keyId && { 'x-key-id': keyId }),
    ...options.headers,
  };
  return fetch(`${API_URL}${url}`, { ...options, headers });
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
  const [bookmarks, setBookmarks] = useState([]);
  const [readingHistory, setReadingHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('userToken');
    const savedUserData = localStorage.getItem('userData');
    
    if (token && savedUserData) {
      const user = JSON.parse(savedUserData);
      setUserData(user);
      setInputKey(user.key?.key_value || '');
      
      // If user has key, auto unlock
      if (user.key && user.key.key_value) {
        handleUnlockWithKey(user.key.key_value);
      }
    } else {
      // Not logged in, redirect to login
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
  }, []);

  // Load bookmarks và history khi unlock
  useEffect(() => {
    if (isUnlocked) {
      loadBookmarks();
      loadHistory();
    }
  }, [isUnlocked]);

  // Check bookmark status khi chọn comic
  useEffect(() => {
    if (selectedComic && isUnlocked) {
      checkBookmark();
    }
  }, [selectedComic, isUnlocked]);

  const loadBookmarks = async () => {
    try {
      const res = await apiRequest('/api/bookmarks');
      const result = await res.json();
      if (result.success) {
        setBookmarks(result.data);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await apiRequest('/api/history');
      const result = await res.json();
      if (result.success) {
        setReadingHistory(result.data);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const checkBookmark = async () => {
    if (!selectedComic) return;
    try {
      const res = await apiRequest(`/api/bookmark/check?comicId=${selectedComic.id}`);
      const result = await res.json();
      if (result.success) {
        setIsBookmarked(result.data.isBookmarked);
      }
    } catch (error) {
      console.error('Error checking bookmark:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!selectedComic) return;
    try {
      if (isBookmarked) {
        await apiRequest('/api/bookmark', {
          method: 'DELETE',
          body: JSON.stringify({ comicId: selectedComic.id }),
        });
        setIsBookmarked(false);
      } else {
        await apiRequest('/api/bookmark', {
          method: 'POST',
          body: JSON.stringify({ comicId: selectedComic.id }),
        });
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
    if (!searchQuery.trim()) {
      const res = await apiRequest('/api/comics');
      const result = await res.json();
      if (result.success) {
        setComics(result.data);
      }
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/comics/search?q=${encodeURIComponent(searchQuery)}`);
      const result = await res.json();
      if (result.success) {
        setComics(result.data);
      }
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
    const currentChapterNum = selectedChapter.number;
    if (currentChapterNum > 1) {
      handleSelectChapter(selectedComic.id, currentChapterNum - 1);
    }
  };

  const handleNextChapter = () => {
    if (!selectedComic || !selectedChapter) return;
    const currentChapterNum = selectedChapter.number;
    const totalChapters = selectedComic.totalChapters;
    if (currentChapterNum < totalChapters) {
      handleSelectChapter(selectedComic.id, currentChapterNum + 1);
    }
  };

  const handleHistoryClick = (historyItem) => {
    handleSelectComic(historyItem.comic_id);
    setTimeout(() => {
      handleSelectChapter(historyItem.comic_id, historyItem.chapter_number);
    }, 500);
    setShowHistory(false);
  };

  // Render danh sách truyện tranh
  const renderComicList = () => {
    if (comics.length === 0) return <div style={{ textAlign: 'center', padding: '40px' }}>Không tìm thấy truyện</div>;
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '28px' }}>📚 Thư viện truyện tranh</h2>
          <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '500px' }}>
            <input
              type="text"
              placeholder="Tìm kiếm truyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(148,163,184,0.4)',
                background: 'rgba(15,23,42,0.5)',
                color: '#fff',
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: '#38bdf8',
                color: '#0f172a',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔍
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '20px' }}>
          {comics.map((comic) => {
            const isActive = selectedComic?.id === comic.id;
            return (
              <button
                key={comic.id}
                onClick={() => handleSelectComic(comic.id)}
                style={{
                  textAlign: 'left',
                  borderRadius: '18px',
                  padding: '12px',
                  background: isActive ? 'rgba(56,189,248,0.2)' : 'rgba(15,23,42,0.5)',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: isActive ? '2px solid #38bdf8' : '1px solid rgba(148,163,184,0.2)',
                }}
              >
                <img
                  src={comic.thumbnail}
                  alt={comic.title}
                  style={{ width: '100%', borderRadius: '12px', marginBottom: '10px', height: '240px', objectFit: 'cover' }}
                />
                <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>{comic.title}</div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>{comic.author}</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  ⭐ {comic.rating} • {comic.totalChapters} chapters • {comic.status}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render thông tin chi tiết truyện
  const renderComicDetail = () => {
    if (!selectedComic) return null;
    return (
      <div style={{ ...appStyles.card, marginTop: '32px' }}>
        <button
          onClick={() => {
            setSelectedComic(null);
            setSelectedChapter(null);
            setChapterContent(null);
          }}
          style={{
            marginBottom: '20px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(148,163,184,0.4)',
            background: 'rgba(148,163,184,0.1)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          ← Quay lại danh sách
        </button>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
          <img
            src={selectedComic.thumbnail}
            alt={selectedComic.title}
            style={{ width: '280px', borderRadius: '20px', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '28px' }}>{selectedComic.title}</h2>
              <button
                onClick={toggleBookmark}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(148,163,184,0.4)',
                  background: isBookmarked ? 'rgba(239,68,68,0.2)' : 'rgba(148,163,184,0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '20px',
                }}
                title={isBookmarked ? 'Bỏ bookmark' : 'Thêm bookmark'}
              >
                {isBookmarked ? '🔖' : '📑'}
              </button>
            </div>
            <p style={{ opacity: 0.8, fontSize: '16px', marginBottom: '12px' }}>
              Tác giả: {selectedComic.author} • {selectedComic.genre} • {selectedComic.year} • ⭐ {selectedComic.rating}
            </p>
            <p style={{ lineHeight: 1.6, marginBottom: '16px' }}>{selectedComic.description}</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '14px', opacity: 0.8 }}>
              <span>📖 {selectedComic.totalChapters} chapters</span>
              <span>👁️ {selectedComic.views?.toLocaleString() || 0} views</span>
              <span>❤️ {selectedComic.likes?.toLocaleString() || 0} likes</span>
              <span>📊 {selectedComic.status}</span>
            </div>
          </div>
        </div>

        {/* Danh sách chapters */}
        <div>
          <h3 style={{ marginBottom: '16px', fontSize: '20px' }}>Danh sách chapters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '12px' }}>
            {selectedComic.chapters.map((chapter) => {
              const isActive = selectedChapter?.number === chapter.number;
              return (
                <button
                  key={chapter.id}
                  onClick={() => handleSelectChapter(selectedComic.id, chapter.number)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: isActive ? '2px solid #38bdf8' : '1px solid rgba(148,163,184,0.3)',
                    background: isActive ? 'rgba(56,189,248,0.2)' : 'rgba(15,23,42,0.4)',
                    color: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{chapter.title}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                    {chapter.pages} trang • {chapter.releaseDate}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render reader
  const renderReader = () => {
    if (!selectedChapter || !chapterContent) return null;
    const currentChapterNum = selectedChapter.number;
    const totalChapters = selectedComic?.totalChapters || 0;
    const hasPrevious = currentChapterNum > 1;
    const hasNext = currentChapterNum < totalChapters;

    const navButtonStyle = {
      padding: '12px 24px',
      borderRadius: '12px',
      border: '1px solid rgba(148,163,184,0.4)',
      background: 'rgba(56,189,248,0.2)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
    };

    const disabledButtonStyle = {
      ...navButtonStyle,
      opacity: 0.4,
      cursor: 'not-allowed',
      background: 'rgba(148,163,184,0.1)',
    };

    return (
      <div style={{ ...appStyles.card, marginTop: '32px' }}>
        <button
          onClick={() => {
            setSelectedChapter(null);
            setChapterContent(null);
          }}
          style={{
            marginBottom: '20px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(148,163,184,0.4)',
            background: 'rgba(148,163,184,0.1)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          ← Quay lại danh sách chapters
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
          <button
            onClick={handlePreviousChapter}
            disabled={!hasPrevious}
            style={hasPrevious ? navButtonStyle : disabledButtonStyle}
          >
            ← Chapter trước ({currentChapterNum > 1 ? currentChapterNum - 1 : '-'})
          </button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '24px' }}>{selectedChapter.title}</h2>
            <p style={{ opacity: 0.7, marginTop: '8px', fontSize: '14px' }}>
              {selectedComic?.title} • Chapter {currentChapterNum}/{totalChapters}
            </p>
          </div>
          <button
            onClick={handleNextChapter}
            disabled={!hasNext}
            style={hasNext ? navButtonStyle : disabledButtonStyle}
          >
            Chapter tiếp ({currentChapterNum < totalChapters ? currentChapterNum + 1 : '-'}) →
          </button>
        </div>

        {isLoadingChapter ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              {chapterContent.map((page, index) => (
                <img
                  key={index}
                  src={page.imageUrl}
                  alt={`Page ${page.pageNumber}`}
                  style={{
                    width: '100%',
                    maxWidth: '800px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', gap: '12px' }}>
              <button
                onClick={handlePreviousChapter}
                disabled={!hasPrevious}
                style={hasPrevious ? navButtonStyle : disabledButtonStyle}
              >
                ← Chapter trước ({currentChapterNum > 1 ? currentChapterNum - 1 : '-'})
              </button>
              <button
                onClick={() => {
                  setSelectedChapter(null);
                  setChapterContent(null);
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: '1px solid rgba(148,163,184,0.4)',
                  background: 'rgba(148,163,184,0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                📚 Danh sách chapters
              </button>
              <button
                onClick={handleNextChapter}
                disabled={!hasNext}
                style={hasNext ? navButtonStyle : disabledButtonStyle}
              >
                Chapter tiếp ({currentChapterNum < totalChapters ? currentChapterNum + 1 : '-'}) →
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  if (!userData) {
    return <div style={appStyles.page}>Đang tải...</div>;
  }

  return (
    <div style={appStyles.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>Comic Library</div>
          <h1 style={{ margin: 0, fontSize: '32px' }}>Thư viện truyện tranh</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ opacity: 0.7 }}>{userData.username}</span>
          {isUnlocked && (
            <>
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(148,163,184,0.4)',
                  background: showHistory ? 'rgba(56,189,248,0.2)' : 'rgba(148,163,184,0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                📖 Lịch sử ({readingHistory.length})
              </button>
            </>
          )}
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
      </div>

      {/* Reading History Sidebar */}
      {showHistory && isUnlocked && (
        <div style={{
          position: 'fixed',
          right: 0,
          top: 0,
          width: '320px',
          height: '100vh',
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(20px)',
          padding: '24px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>📖 Lịch sử đọc</h3>
            <button
              onClick={() => setShowHistory(false)}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(148,163,184,0.2)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
          {readingHistory.length === 0 ? (
            <p style={{ opacity: 0.7, textAlign: 'center' }}>Chưa có lịch sử đọc</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {readingHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleHistoryClick(item)}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(148,163,184,0.3)',
                    background: 'rgba(15,23,42,0.5)',
                    color: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.comic_title}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>Chapter {item.chapter_number}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!isUnlocked && preview && (
        <div style={{ ...appStyles.card, marginBottom: '32px' }}>
          <h2>{preview.title}</h2>
          <p>{preview.content}</p>
          {preview.image_url && (
            <img
              src={preview.image_url}
              alt="preview"
              style={{ width: '100%', borderRadius: '16px', marginTop: '12px', objectFit: 'cover' }}
            />
          )}
          <div style={{ marginTop: '20px' }}>
            {userData.key ? (
              <>
                <h3>🔑 Key của bạn: <code>{userData.key.key_value}</code></h3>
                <p>Key đã được admin cấp. Nhấn nút bên dưới để mở khóa.</p>
                <button
                  onClick={handleUnlock}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#38bdf8',
                    color: '#0f172a',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minWidth: '160px',
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xử lý...' : 'Mở khóa ngay'}
                </button>
              </>
            ) : (
              <>
                <h3>🔒 Nhập key để mở khóa</h3>
                <p>Bạn có thể nhập key đã được admin cấp hoặc đợi admin cấp key.</p>
                <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '16px' }}>Status: {userData.status}</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Nhập key để mở khóa..."
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                    style={{
                      flex: '1 1 250px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(148,163,184,0.4)',
                      background: 'rgba(15,23,42,0.5)',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                  <button
                    onClick={handleUnlock}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#38bdf8',
                      color: '#0f172a',
                      fontWeight: 600,
                      cursor: 'pointer',
                      minWidth: '160px',
                    }}
                    disabled={isLoading || !inputKey.trim()}
                  >
                    {isLoading ? 'Đang xử lý...' : 'Mở khóa ngay'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isUnlocked && (
        <>
          {!selectedComic && renderComicList()}
          {selectedComic && !selectedChapter && renderComicDetail()}
          {selectedChapter && renderReader()}
        </>
      )}
    </div>
  );
}

export default ComicLibrary;

