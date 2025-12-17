const mongoose = require('mongoose');

// Kết nối MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/comics_library';

mongoose.connect(MONGODB_URI).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  console.log('💡 Đảm bảo MongoDB đang chạy hoặc dùng MongoDB Atlas');
});

// ========== SCHEMAS ==========

const ComicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  thumbnail: String,
  rating: { type: Number, default: 0 },
  year: Number,
  genre: String,
  description: String,
  total_chapters: { type: Number, default: 0 },
  status: String,
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
}, {
  timestamps: true,
});

const ChapterSchema = new mongoose.Schema({
  comic_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Comic', required: true },
  number: { type: Number, required: true },
  title: { type: String, required: true },
  pages: { type: Number, default: 0 },
  release_date: String,
}, {
  timestamps: true,
});

ChapterSchema.index({ comic_id: 1, number: 1 }, { unique: true });

const ChapterPageSchema = new mongoose.Schema({
  chapter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  page_number: { type: Number, required: true },
  image_url: { type: String, required: true },
});

const AccessKeySchema = new mongoose.Schema({
  key_value: { type: String, required: true, unique: true },
  user_name: String,
  user_email: String,
  expires_at: Date,
  is_active: { type: Boolean, default: true },
  last_used_at: Date,
}, {
  timestamps: true,
});

const ReadingHistorySchema = new mongoose.Schema({
  key_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessKey', required: true },
  comic_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Comic', required: true },
  chapter_number: { type: Number, required: true },
}, {
  timestamps: true,
});

ReadingHistorySchema.index({ key_id: 1, comic_id: 1, chapter_number: 1 });

const BookmarkSchema = new mongoose.Schema({
  key_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessKey', required: true },
  comic_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Comic', required: true },
  chapter_number: Number,
}, {
  timestamps: true,
});

BookmarkSchema.index({ key_id: 1, comic_id: 1, chapter_number: 1 }, { unique: true });

const CommentSchema = new mongoose.Schema({
  comic_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Comic', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessKey', required: true },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  is_approved: { type: Boolean, default: true },
}, {
  timestamps: true,
});

CommentSchema.index({ comic_id: 1, createdAt: -1 });
CommentSchema.index({ user_id: 1 });

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  full_name: String,
  phone: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['pending', 'active', 'banned'], default: 'pending' },
  key_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessKey', default: null },
  registered_at: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// ========== MODELS ==========

const Comic = mongoose.model('Comic', ComicSchema);
const Chapter = mongoose.model('Chapter', ChapterSchema);
const ChapterPage = mongoose.model('ChapterPage', ChapterPageSchema);
const AccessKey = mongoose.model('AccessKey', AccessKeySchema);
const ReadingHistory = mongoose.model('ReadingHistory', ReadingHistorySchema);
const Bookmark = mongoose.model('Bookmark', BookmarkSchema);
const Comment = mongoose.model('Comment', CommentSchema);
const User = mongoose.model('User', UserSchema);

// ========== HELPER FUNCTIONS ==========

const dbHelpers = {
  // Comics
  getAllComics: async () => {
    return await Comic.find().sort({ createdAt: -1 });
  },

  getComicById: async (id) => {
    return await Comic.findById(id);
  },

  searchComics: async (query) => {
    const searchTerm = new RegExp(query, 'i');
    return await Comic.find({
      $or: [
        { title: searchTerm },
        { author: searchTerm },
        { genre: searchTerm },
        { description: searchTerm },
      ],
    }).sort({ rating: -1 });
  },

  createComic: async (comicData) => {
    const comic = new Comic(comicData);
    await comic.save();
    return comic._id.toString();
  },

  updateComic: async (id, updateData) => {
    return await Comic.findByIdAndUpdate(id, updateData, { new: true });
  },

  deleteComic: async (id) => {
    // Xóa chapters và pages khi xóa comic
    const chapters = await Chapter.find({ comic_id: id });
    for (const chapter of chapters) {
      await ChapterPage.deleteMany({ chapter_id: chapter._id });
    }
    await Chapter.deleteMany({ comic_id: id });
    return await Comic.findByIdAndDelete(id);
  },

  // Chapters
  getChaptersByComicId: async (comicId) => {
    return await Chapter.find({ comic_id: comicId }).sort({ number: 1 });
  },

  getChapterByNumber: async (comicId, chapterNumber) => {
    return await Chapter.findOne({ comic_id: comicId, number: chapterNumber });
  },

  createChapter: async (chapterData) => {
    const chapter = new Chapter(chapterData);
    await chapter.save();
    // Update total_chapters trong comic
    const comic = await Comic.findById(chapterData.comic_id);
    if (comic) {
      const chapterCount = await Chapter.countDocuments({ comic_id: chapterData.comic_id });
      comic.total_chapters = chapterCount;
      await comic.save();
    }
    return chapter._id.toString();
  },

  // Chapter Pages
  getChapterPages: async (chapterId) => {
    return await ChapterPage.find({ chapter_id: chapterId }).sort({ page_number: 1 });
  },

  createChapterPage: async (pageData) => {
    const page = new ChapterPage(pageData);
    await page.save();
    // Update pages count trong chapter
    const chapter = await Chapter.findById(pageData.chapter_id);
    if (chapter) {
      const pageCount = await ChapterPage.countDocuments({ chapter_id: pageData.chapter_id });
      chapter.pages = pageCount;
      await chapter.save();
    }
  },

  // Access Keys
  validateKey: async (keyValue) => {
    const key = await AccessKey.findOne({ key_value: keyValue, is_active: true });
    if (!key) return null;

    // Check if expired
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return null;
    }

    // Update last_used_at
    key.last_used_at = new Date();
    await key.save();
    return key;
  },

  createKey: async (keyData) => {
    const key = new AccessKey(keyData);
    await key.save();
    return key._id.toString();
  },

  getAllKeys: async () => {
    return await AccessKey.find().sort({ createdAt: -1 });
  },

  extendKeyExpiration: async (keyId, days) => {
    const key = await AccessKey.findById(keyId);
    if (!key) return null;

    const currentExpiry = key.expires_at ? new Date(key.expires_at) : new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + days);

    key.expires_at = newExpiry;
    await key.save();
    return key;
  },

  // Reading History
  saveReadingHistory: async (keyId, comicId, chapterNumber) => {
    const existing = await ReadingHistory.findOne({
      key_id: keyId,
      comic_id: comicId,
      chapter_number: chapterNumber,
    });

    if (existing) {
      existing.updatedAt = new Date();
      await existing.save();
    } else {
      const history = new ReadingHistory({
        key_id: keyId,
        comic_id: comicId,
        chapter_number: chapterNumber,
      });
      await history.save();
    }
  },

  getReadingHistory: async (keyId) => {
    return await ReadingHistory.find({ key_id: keyId })
      .populate('comic_id', 'title thumbnail')
      .sort({ updatedAt: -1 })
      .limit(20);
  },

  // Bookmarks
  addBookmark: async (keyId, comicId, chapterNumber = null) => {
    try {
      const bookmark = new Bookmark({
        key_id: keyId,
        comic_id: comicId,
        chapter_number: chapterNumber,
      });
      await bookmark.save();
      return true;
    } catch (err) {
      // Already bookmarked
      return false;
    }
  },

  removeBookmark: async (keyId, comicId, chapterNumber = null) => {
    const query = {
      key_id: keyId,
      comic_id: comicId,
    };
    if (chapterNumber !== null) {
      query.chapter_number = chapterNumber;
    } else {
      query.chapter_number = null;
    }
    await Bookmark.deleteOne(query);
  },

  getBookmarks: async (keyId) => {
    return await Bookmark.find({ key_id: keyId })
      .populate('comic_id', 'title thumbnail')
      .sort({ createdAt: -1 });
  },

  isBookmarked: async (keyId, comicId, chapterNumber = null) => {
    const query = {
      key_id: keyId,
      comic_id: comicId,
    };
    if (chapterNumber !== null) {
      query.chapter_number = chapterNumber;
    } else {
      query.chapter_number = null;
    }
    const result = await Bookmark.findOne(query);
    return !!result;
  },

  // Users
  createUser: async (userData) => {
    const user = new User(userData);
    await user.save();
    return user;
  },

  getUserByUsername: async (username) => {
    return await User.findOne({ username });
  },

  getUserByEmail: async (email) => {
    return await User.findOne({ email });
  },

  getUserById: async (id) => {
    return await User.findById(id);
  },

  getAllUsers: async () => {
    return await User.find().sort({ createdAt: -1 });
  },

  updateUser: async (id, updateData) => {
    return await User.findByIdAndUpdate(id, updateData, { new: true });
  },

  assignKeyToUser: async (userId, keyId) => {
    return await User.findByIdAndUpdate(userId, { key_id: keyId, status: 'active' }, { new: true });
  },

  // Comments
  createComment: async (commentData) => {
    const comment = new Comment(commentData);
    await comment.save();
    return comment;
  },

  getCommentsByComic: async (comicId, limit = 50) => {
    return await Comment.find({ comic_id: comicId, is_approved: true })
      .populate('user_id', 'username')
      .populate('key_id', 'key_value')
      .sort({ createdAt: -1 })
      .limit(limit);
  },

  getAllComments: async () => {
    return await Comment.find()
      .populate('comic_id', 'title')
      .populate('user_id', 'username email')
      .populate('key_id', 'key_value')
      .sort({ createdAt: -1 });
  },

  deleteComment: async (commentId) => {
    return await Comment.findByIdAndDelete(commentId);
  },

  updateCommentApproval: async (commentId, isApproved) => {
    return await Comment.findByIdAndUpdate(commentId, { is_approved: isApproved }, { new: true });
  },

  getCommentStats: async () => {
    // Top users by comments
    const topUsers = await Comment.aggregate([
      { $group: { _id: '$user_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { username: '$user.username', email: '$user.email', commentCount: '$count' } },
    ]);

    // Top comics by comments
    const topComics = await Comment.aggregate([
      { $group: { _id: '$comic_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'comics', localField: '_id', foreignField: '_id', as: 'comic' } },
      { $unwind: '$comic' },
      { $project: { title: '$comic.title', genre: '$comic.genre', commentCount: '$count' } },
    ]);

    // Top genres by comments
    const topGenres = await Comment.aggregate([
      { $lookup: { from: 'comics', localField: 'comic_id', foreignField: '_id', as: 'comic' } },
      { $unwind: '$comic' },
      { $group: { _id: '$comic.genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { genre: '$_id', commentCount: '$count' } },
    ]);

    // Average rating per comic
    const avgRatings = await Comment.aggregate([
      { $group: { _id: '$comic_id', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      { $sort: { avgRating: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'comics', localField: '_id', foreignField: '_id', as: 'comic' } },
      { $unwind: '$comic' },
      { $project: { title: '$comic.title', avgRating: { $round: ['$avgRating', 1] }, ratingCount: '$count' } },
    ]);

    return {
      topUsers,
      topComics,
      topGenres,
      avgRatings,
    };
  },

  getReadingStats: async () => {
    // Top comics by views
    const topComicsByViews = await Comic.find().sort({ views: -1 }).limit(10).select('title genre views');

    // Top comics by reading history
    const topComicsByReads = await ReadingHistory.aggregate([
      { $group: { _id: '$comic_id', readCount: { $sum: 1 } } },
      { $sort: { readCount: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'comics', localField: '_id', foreignField: '_id', as: 'comic' } },
      { $unwind: '$comic' },
      { $project: { title: '$comic.title', genre: '$comic.genre', readCount: '$readCount' } },
    ]);

    // Top genres by reads
    const topGenresByReads = await ReadingHistory.aggregate([
      { $lookup: { from: 'comics', localField: 'comic_id', foreignField: '_id', as: 'comic' } },
      { $unwind: '$comic' },
      { $group: { _id: '$comic.genre', readCount: { $sum: 1 } } },
      { $sort: { readCount: -1 } },
      { $project: { genre: '$_id', readCount: '$readCount' } },
    ]);

    // Most active users (by reading history)
    const topUsersByReads = await ReadingHistory.aggregate([
      { $group: { _id: '$key_id', readCount: { $sum: 1 } } },
      { $sort: { readCount: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'accesskeys', localField: '_id', foreignField: '_id', as: 'key' } },
      { $unwind: '$key' },
      { $lookup: { from: 'users', localField: 'key._id', foreignField: 'access_key_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { username: '$user.username', email: '$user.email', readCount: '$readCount' } },
    ]);

    return {
      topComicsByViews,
      topComicsByReads,
      topGenresByReads,
      topUsersByReads,
    };
  },
};

module.exports = { mongoose, dbHelpers, Comic, Chapter, ChapterPage, AccessKey, ReadingHistory, Bookmark, User, Comment };
