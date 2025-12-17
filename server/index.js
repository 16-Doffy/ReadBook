require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbHelpers, AccessKey, User, Comment } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow frontend origins to talk to the API.
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in dev mode, restrict in production
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

// Seed database với dữ liệu Faker nếu chưa có
async function seedDatabase() {
  try {
    const existingComics = await dbHelpers.getAllComics();
    if (existingComics.length > 0) {
      console.log('✅ Database already has comics, skipping seed');
      return;
    }

    console.log('🌱 Seeding database with Faker data...');
    const genres = ['Action', 'Romance', 'Comedy', 'Fantasy', 'Horror', 'Drama', 'Sci-Fi', 'Mystery', 'Adventure', 'Supernatural'];
    const statuses = ['Đang cập nhật', 'Hoàn thành', 'Tạm ngưng'];

    // Tạo 10 truyện
    for (let i = 0; i < 10; i++) {
      const chapterCount = faker.number.int({ min: 15, max: 30 });
      
      const comicId = await dbHelpers.createComic({
        title: faker.lorem.words(3),
        author: faker.person.fullName(),
        thumbnail: faker.image.url({ width: 300, height: 400 }),
        rating: parseFloat((Math.random() * 3 + 6).toFixed(1)),
        year: faker.date.past({ years: 5 }).getFullYear(),
        genre: faker.helpers.arrayElement(genres),
        description: faker.lorem.paragraph(),
        total_chapters: chapterCount,
        status: faker.helpers.arrayElement(statuses),
        views: faker.number.int({ min: 1000, max: 100000 }),
        likes: faker.number.int({ min: 100, max: 10000 }),
      });

      // Tạo chapters cho mỗi truyện
      for (let ch = 1; ch <= chapterCount; ch++) {
        const pages = faker.number.int({ min: 15, max: 30 });
        const chapterId = await dbHelpers.createChapter({
          comic_id: comicId,
          number: ch,
          title: `Chapter ${ch}: ${faker.lorem.words(3)}`,
          pages: pages,
          release_date: faker.date.past({ years: 2 }).toISOString().split('T')[0],
        });

        // Tạo pages cho mỗi chapter
        for (let p = 1; p <= pages; p++) {
          await dbHelpers.createChapterPage({
            chapter_id: chapterId,
            page_number: p,
            image_url: faker.image.url({ width: 800, height: 1200 }),
          });
        }
      }
    }

    // Tạo admin user mặc định
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await dbHelpers.createUser({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      full_name: 'Administrator',
      role: 'admin',
      status: 'active',
    });

    // Tạo key mặc định cho admin
    const adminKeyId = await dbHelpers.createKey({
      key_value: process.env.SECRET_KEY || 'MONERO_123',
      user_name: 'Admin',
      user_email: 'admin@example.com',
      expires_at: null,
      is_active: true,
    });

    await dbHelpers.assignKeyToUser(adminUser._id.toString(), adminKeyId);

    console.log('✅ Database seeded successfully!');
    console.log('👤 Admin user:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Key: MONERO_123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

// Helper: Format comic với chapters
async function formatComicWithChapters(comic) {
  const chapters = await dbHelpers.getChaptersByComicId(comic._id.toString());
  return {
    id: comic._id.toString(),
    title: comic.title,
    author: comic.author,
    thumbnail: comic.thumbnail,
    rating: comic.rating,
    year: comic.year,
    genre: comic.genre,
    description: comic.description,
    totalChapters: comic.total_chapters,
    status: comic.status,
    views: comic.views,
    likes: comic.likes,
    chapters: chapters.map(ch => ({
      id: ch._id.toString(),
      number: ch.number,
      title: ch.title,
      pages: ch.pages,
      releaseDate: ch.release_date,
    })),
  };
}

// Helper: Format chapter với pages
async function formatChapterWithPages(chapter) {
  const pages = await dbHelpers.getChapterPages(chapter._id.toString());
  return {
    id: chapter._id.toString(),
    number: chapter.number,
    title: chapter.title,
    pages: chapter.pages,
    releaseDate: chapter.release_date,
    pages_content: pages.map(p => ({
      pageNumber: p.page_number,
      imageUrl: p.image_url,
    })),
  };
}

// ========== API ENDPOINTS ==========

// Preview (public)
app.get('/api/preview', (_req, res) => {
  res.json({
    success: true,
    data: {
      title: 'Thư viện truyện tranh đang khóa',
      content: 'Nhập key để mở khóa và đọc toàn bộ truyện tranh độc quyền.',
      image_url: 'https://picsum.photos/id/1015/600/320',
    },
  });
});

// Unlock với key validation
app.post('/api/unlock', async (req, res) => {
  try {
    const { unlockKey } = req.body;
    
    if (!unlockKey) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập key',
      });
    }

    const keyData = await dbHelpers.validateKey(unlockKey);
    
    if (!keyData) {
      return res.status(403).json({
        success: false,
        message: 'Sai mã mở khóa hoặc key đã hết hạn! Vui lòng Donate để nhận mã.',
      });
    }

    // Lấy tất cả truyện
    const comics = await dbHelpers.getAllComics();
    const formattedComics = await Promise.all(comics.map(formatComicWithChapters));

    res.json({
      success: true,
      data: {
        comics: formattedComics,
        keyId: keyData._id.toString(),
      },
    });
  } catch (error) {
    console.error('Unlock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Lấy tất cả truyện (cần key)
app.get('/api/comics', async (req, res) => {
  try {
    const keyId = req.headers['x-key-id'];
    if (!keyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const comics = await dbHelpers.getAllComics();
    const formattedComics = await Promise.all(comics.map(formatComicWithChapters));
    res.json({
      success: true,
      data: formattedComics,
    });
  } catch (error) {
    console.error('Get comics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Tìm kiếm truyện
app.get('/api/comics/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query required' });
    }

    const comics = await dbHelpers.searchComics(q);
    const formattedComics = await Promise.all(comics.map(formatComicWithChapters));
    res.json({
      success: true,
      data: formattedComics,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Lấy thông tin chi tiết truyện
app.get('/api/comic/:comicId', async (req, res) => {
  try {
    const { comicId } = req.params;
    const comic = await dbHelpers.getComicById(comicId);
    
    if (!comic) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy truyện',
      });
    }

    const formatted = await formatComicWithChapters(comic);
    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Get comic error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Lấy nội dung chapter
app.get('/api/comic/:comicId/chapter/:chapterNumber', async (req, res) => {
  try {
    const { comicId, chapterNumber } = req.params;
    const keyId = req.headers['x-key-id'];

    const comic = await dbHelpers.getComicById(comicId);
    if (!comic) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy truyện',
      });
    }

    const chapter = await dbHelpers.getChapterByNumber(comicId, parseInt(chapterNumber));
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chapter',
      });
    }

    // Lưu lịch sử đọc
    if (keyId) {
      await dbHelpers.saveReadingHistory(keyId, comicId, parseInt(chapterNumber));
    }

    const formatted = await formatChapterWithPages(chapter);
    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Get chapter error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Lịch sử đọc
app.get('/api/history', async (req, res) => {
  try {
    const keyId = req.headers['x-key-id'];
    if (!keyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const history = await dbHelpers.getReadingHistory(keyId);
    const formatted = history.map(h => ({
      id: h._id.toString(),
      comic_id: h.comic_id._id.toString(),
      comic_title: h.comic_id.title,
      comic_thumbnail: h.comic_id.thumbnail,
      chapter_number: h.chapter_number,
      last_read_at: h.updatedAt,
    }));
    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bookmarks
app.get('/api/bookmarks', async (req, res) => {
  try {
    const keyId = req.headers['x-key-id'];
    if (!keyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const bookmarks = await dbHelpers.getBookmarks(keyId);
    const formatted = bookmarks.map(b => ({
      id: b._id.toString(),
      comic_id: b.comic_id._id.toString(),
      comic_title: b.comic_id.title,
      comic_thumbnail: b.comic_id.thumbnail,
      chapter_number: b.chapter_number,
      created_at: b.createdAt,
    }));
    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/bookmark', async (req, res) => {
  try {
    const keyId = req.headers['x-key-id'];
    const { comicId, chapterNumber } = req.body;

    if (!keyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const success = await dbHelpers.addBookmark(keyId, comicId, chapterNumber || null);
    res.json({
      success: true,
      message: success ? 'Đã thêm bookmark' : 'Đã có trong bookmark',
    });
  } catch (error) {
    console.error('Add bookmark error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/bookmark', async (req, res) => {
  try {
    const keyId = req.headers['x-key-id'];
    const { comicId, chapterNumber } = req.body;

    if (!keyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await dbHelpers.removeBookmark(keyId, comicId, chapterNumber || null);
    res.json({
      success: true,
      message: 'Đã xóa bookmark',
    });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/bookmark/check', async (req, res) => {
  try {
    const keyId = req.headers['x-key-id'];
    const { comicId, chapterNumber } = req.query;

    if (!keyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const isBookmarked = await dbHelpers.isBookmarked(keyId, comicId, chapterNumber || null);
    res.json({
      success: true,
      data: { isBookmarked },
    });
  } catch (error) {
    console.error('Check bookmark error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========== AUTH API ==========

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware để verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Middleware để check admin
const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, full_name, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email và password là bắt buộc',
      });
    }

    // Check if user exists
    const existingUser = await dbHelpers.getUserByUsername(username) || await dbHelpers.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username hoặc email đã tồn tại',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await dbHelpers.createUser({
      username,
      email,
      password: hashedPassword,
      full_name: full_name || null,
      phone: phone || null,
      role: 'user',
      status: 'pending', // Chờ admin cấp key
    });

    res.json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng đợi admin cấp key.',
      data: {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username và password là bắt buộc',
      });
    }

    // Find user
    const user = await dbHelpers.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username hoặc password không đúng',
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Username hoặc password không đúng',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Get key info if exists
    let keyInfo = null;
    if (user.key_id) {
      const key = await AccessKey.findById(user.key_id);
      if (key) {
        keyInfo = {
          key_value: key.key_value,
          is_active: key.is_active,
          expires_at: key.expires_at,
          key_id: key._id.toString(),
        };
      }
    }

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          status: user.status,
          key: keyInfo,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Gia hạn key (User)
app.post('/api/user/extend-key', verifyToken, async (req, res) => {
  try {
    const { days } = req.body;
    const userId = req.userId;

    if (!days || days <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số ngày gia hạn phải lớn hơn 0',
      });
    }

    const user = await dbHelpers.getUserById(userId);
    if (!user || !user.key_id) {
      return res.status(404).json({
        success: false,
        message: 'User không có key',
      });
    }

    const extendedKey = await dbHelpers.extendKeyExpiration(user.key_id, parseInt(days));
    if (!extendedKey) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy key',
      });
    }

    res.json({
      success: true,
      message: `Đã gia hạn key thêm ${days} ngày`,
      data: {
        expires_at: extendedKey.expires_at,
        new_expiry_date: new Date(extendedKey.expires_at).toLocaleDateString('vi-VN'),
      },
    });
  } catch (error) {
    console.error('Extend key error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get current user info
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await dbHelpers.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let keyInfo = null;
    if (user.key_id) {
      const key = await AccessKey.findById(user.key_id);
      if (key) {
        keyInfo = {
          key_value: key.key_value,
          is_active: key.is_active,
          expires_at: key.expires_at,
          key_id: key._id.toString(),
        };
      }
    }

    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        key: keyInfo,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update current user profile
app.put('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const { full_name, phone } = req.body;

    const user = await dbHelpers.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.full_name = full_name ?? user.full_name;
    user.phone = phone ?? user.phone;
    await user.save();

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========== ADMIN API - QUẢN LÝ USERS ==========

// Lấy danh sách tất cả users
app.get('/api/admin/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await dbHelpers.getAllUsers();
    const formatted = await Promise.all(users.map(async (u) => {
      let keyInfo = null;
      if (u.key_id) {
        const key = await AccessKey.findById(u.key_id);
        if (key) {
          keyInfo = {
            key_value: key.key_value,
            is_active: key.is_active,
            expires_at: key.expires_at,
            key_id: key._id.toString(),
          };
        }
      }
      return {
        id: u._id.toString(),
        username: u.username,
        email: u.email,
        full_name: u.full_name,
        phone: u.phone,
        role: u.role,
        status: u.status,
        key: keyInfo,
        registered_at: u.registered_at,
        created_at: u.createdAt,
      };
    }));
    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Cấp key cho user
app.post('/api/admin/users/:userId/assign-key', verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { key_value, expires_days } = req.body;

    const user = await dbHelpers.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    // Nếu user đã có key, tạo key mới hoặc dùng key có sẵn
    let keyId;
    if (key_value) {
      // Dùng key có sẵn
      const existingKey = await AccessKey.findOne({ key_value });
      if (!existingKey) {
        return res.status(404).json({ success: false, message: 'Key không tồn tại' });
      }
      keyId = existingKey._id;
    } else {
      // Tạo key mới
      const newKeyValue = `KEY_${user.username.toUpperCase()}_${Date.now()}`;
      let expires_at = null;
      if (expires_days) {
        expires_at = new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000);
      }
      keyId = await dbHelpers.createKey({
        key_value: newKeyValue,
        user_name: user.full_name || user.username,
        user_email: user.email,
        expires_at,
        is_active: true,
      });
    }

    // Assign key to user
    await dbHelpers.assignKeyToUser(userId, keyId);

    const key = await AccessKey.findById(keyId);

    res.json({
      success: true,
      message: 'Đã cấp key cho user thành công',
      data: {
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
        },
        key: {
          key_value: key.key_value,
          is_active: key.is_active,
          expires_at: key.expires_at,
        },
      },
    });
  } catch (error) {
    console.error('Assign key error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user status
app.put('/api/admin/users/:userId', verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, role } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (role) updateData.role = role;

    const user = await dbHelpers.updateUser(userId, updateData);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    res.json({
      success: true,
      message: 'Đã cập nhật user thành công',
      data: {
        id: user._id.toString(),
        username: user.username,
        status: user.status,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========== ADMIN API - QUẢN LÝ KEYS ==========

// Lấy danh sách tất cả keys (Admin only - cần thêm authentication sau)
app.get('/api/admin/keys', async (req, res) => {
  try {
    // TODO: Thêm admin authentication
    const keys = await dbHelpers.getAllKeys();
    const formatted = keys.map(k => ({
      id: k._id.toString(),
      key_value: k.key_value,
      user_name: k.user_name,
      user_email: k.user_email,
      is_active: k.is_active,
      expires_at: k.expires_at,
      last_used_at: k.last_used_at,
      created_at: k.createdAt,
    }));
    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Get keys error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Tạo key mới
app.post('/api/admin/keys', async (req, res) => {
  try {
    // TODO: Thêm admin authentication
    const { key_value, user_name, user_email, expires_days } = req.body;

    if (!key_value) {
      return res.status(400).json({ success: false, message: 'key_value is required' });
    }

    let expires_at = null;
    if (expires_days) {
      expires_at = new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000);
    }

    const keyId = await dbHelpers.createKey({
      key_value,
      user_name: user_name || null,
      user_email: user_email || null,
      expires_at,
      is_active: true,
    });

    res.json({
      success: true,
      message: 'Đã tạo key thành công',
      data: { keyId },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Key đã tồn tại' });
    }
    console.error('Create key error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Tạo nhiều keys tự động
app.post('/api/admin/keys/bulk', async (req, res) => {
  try {
    // TODO: Thêm admin authentication
    const { count = 10, prefix = 'KEY', expires_days } = req.body;

    const keys = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i <= count; i++) {
      const key_value = `${prefix}_${String(i).padStart(4, '0')}`;
      let expires_at = null;
      if (expires_days) {
        expires_at = new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000);
      }

      try {
        const keyId = await dbHelpers.createKey({
          key_value,
          user_name: `User ${i}`,
          user_email: `user${i}@example.com`,
          expires_at,
          is_active: true,
        });
        keys.push({ key_value, keyId });
        successCount++;
      } catch (error) {
        if (error.code !== 11000) {
          errorCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Đã tạo ${successCount} keys thành công`,
      data: {
        created: successCount,
        errors: errorCount,
        keys: keys.map(k => k.key_value),
      },
    });
  } catch (error) {
    console.error('Bulk create keys error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Deactivate/Activate key
app.put('/api/admin/keys/:keyId', async (req, res) => {
  try {
    // TODO: Thêm admin authentication
    const { keyId } = req.params;
    const { is_active } = req.body;

    const key = await AccessKey.findByIdAndUpdate(
      keyId,
      { is_active: is_active !== undefined ? is_active : false },
      { new: true }
    );

    if (!key) {
      return res.status(404).json({ success: false, message: 'Key không tồn tại' });
    }

    res.json({
      success: true,
      message: `Key đã được ${key.is_active ? 'kích hoạt' : 'vô hiệu hóa'}`,
      data: {
        key_value: key.key_value,
        is_active: key.is_active,
      },
    });
  } catch (error) {
    console.error('Update key error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Xóa key
app.delete('/api/admin/keys/:keyId', async (req, res) => {
  try {
    // TODO: Thêm admin authentication
    const { keyId } = req.params;

    const key = await AccessKey.findByIdAndDelete(keyId);

    if (!key) {
      return res.status(404).json({ success: false, message: 'Key không tồn tại' });
    }

    res.json({
      success: true,
      message: 'Đã xóa key thành công',
    });
  } catch (error) {
    console.error('Delete key error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Seed database sau khi MongoDB connect
// ========== COMMENTS API ==========

// Lấy comments của một truyện
app.get('/api/comic/:comicId/comments', async (req, res) => {
  try {
    const { comicId } = req.params;
    const comments = await dbHelpers.getCommentsByComic(comicId);
    const formatted = comments.map(c => ({
      id: c._id.toString(),
      username: c.user_id?.username || 'Unknown',
      content: c.content,
      rating: c.rating,
      createdAt: c.createdAt,
    }));
    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Tạo comment mới
app.post('/api/comic/:comicId/comment', async (req, res) => {
  try {
    const { comicId } = req.params;
    const { content, rating } = req.body;
    const keyId = req.headers['x-key-id'];

    if (!keyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!content || !rating) {
      return res.status(400).json({ success: false, message: 'Content và rating là bắt buộc' });
    }

    // Get user from key
    const key = await AccessKey.findById(keyId);
    if (!key) {
      return res.status(401).json({ success: false, message: 'Invalid key' });
    }

    const user = await User.findOne({ key_id: keyId });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Chỉ cho phép 1 đánh giá / user / truyện (dựa trên key + user)
    const existing = await Comment.findOne({ comic_id: comicId, key_id: keyId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá truyện này rồi. Mỗi tài khoản chỉ được đánh giá 1 lần.',
      });
    }

    const comment = await dbHelpers.createComment({
      comic_id: comicId,
      user_id: user._id,
      key_id: keyId,
      content,
      rating: parseInt(rating),
    });

    res.json({
      success: true,
      message: 'Đã thêm comment thành công',
      data: {
        id: comment._id.toString(),
        username: user.username,
        content: comment.content,
        rating: comment.rating,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========== ADMIN API - QUẢN LÝ COMMENTS ==========

// Lấy tất cả comments (admin)
app.get('/api/admin/comments', verifyToken, isAdmin, async (req, res) => {
  try {
    const comments = await dbHelpers.getAllComments();
    const formatted = comments.map(c => ({
      id: c._id.toString(),
      comic_title: c.comic_id?.title || 'Unknown',
      username: c.user_id?.username || 'Unknown',
      email: c.user_id?.email || 'Unknown',
      content: c.content,
      rating: c.rating,
      is_approved: c.is_approved,
      createdAt: c.createdAt,
    }));
    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Get all comments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Xóa comment (admin)
app.delete('/api/admin/comments/:commentId', verifyToken, isAdmin, async (req, res) => {
  try {
    const { commentId } = req.params;
    await dbHelpers.deleteComment(commentId);
    res.json({
      success: true,
      message: 'Đã xóa comment',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Duyệt/không duyệt comment (admin)
app.put('/api/admin/comments/:commentId/approve', verifyToken, isAdmin, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { is_approved } = req.body;
    await dbHelpers.updateCommentApproval(commentId, is_approved);
    res.json({
      success: true,
      message: is_approved ? 'Đã duyệt comment' : 'Đã ẩn comment',
    });
  } catch (error) {
    console.error('Update comment approval error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========== ADMIN API - THỐNG KÊ ==========

// Thống kê comments
app.get('/api/admin/stats/comments', verifyToken, isAdmin, async (req, res) => {
  try {
    const stats = await dbHelpers.getCommentStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get comment stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Thống kê đọc truyện
app.get('/api/admin/stats/reading', verifyToken, isAdmin, async (req, res) => {
  try {
    const stats = await dbHelpers.getReadingStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get reading stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

setTimeout(() => {
  seedDatabase();
}, 2000);

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại port ${PORT}`);
  console.log(`📚 Database: MongoDB`);
  console.log(`💡 MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/comics_library'}`);
});
