const { dbHelpers, AccessKey, Comic, Chapter, Bookmark, ReadingHistory } = require('./database');

async function viewData() {
  console.log('📊 XEM DỮ LIỆU TRONG MONGODB\n');
  console.log('='.repeat(60));

  try {
    // 1. Xem tất cả truyện
    console.log('\n📚 DANH SÁCH TRUYỆN:');
    const comics = await dbHelpers.getAllComics();
    console.log(`Tổng số: ${comics.length} truyện\n`);
    comics.forEach((comic, index) => {
      console.log(`${index + 1}. ${comic.title}`);
      console.log(`   Tác giả: ${comic.author}`);
      console.log(`   Genre: ${comic.genre} | Rating: ${comic.rating} | Chapters: ${comic.total_chapters}`);
      console.log(`   ID: ${comic._id}\n`);
    });

    // 2. Xem keys
    console.log('\n🔑 DANH SÁCH KEYS:');
    const keys = await dbHelpers.getAllKeys();
    console.log(`Tổng số: ${keys.length} keys\n`);
    keys.forEach((key, index) => {
      console.log(`${index + 1}. Key: ${key.key_value}`);
      console.log(`   User: ${key.user_name || 'N/A'} | Email: ${key.user_email || 'N/A'}`);
      console.log(`   Active: ${key.is_active ? '✅' : '❌'} | Expires: ${key.expires_at || 'Không hết hạn'}`);
      console.log(`   Last used: ${key.last_used_at || 'Chưa dùng'}\n`);
    });

    // 3. Xem chapters của truyện đầu tiên (nếu có)
    if (comics.length > 0) {
      const firstComic = comics[0];
      console.log(`\n📖 CHAPTERS CỦA "${firstComic.title}":`);
      const chapters = await dbHelpers.getChaptersByComicId(firstComic._id.toString());
      console.log(`Tổng số: ${chapters.length} chapters\n`);
      chapters.slice(0, 5).forEach((ch, index) => {
        console.log(`  ${index + 1}. ${ch.title} (${ch.pages} trang)`);
      });
      if (chapters.length > 5) {
        console.log(`  ... và ${chapters.length - 5} chapters khác`);
      }
    }

    // 4. Xem bookmarks
    console.log('\n🔖 BOOKMARKS:');
    const bookmarks = await Bookmark.find()
      .populate('comic_id', 'title thumbnail')
      .populate('key_id', 'key_value');
    console.log(`Tổng số: ${bookmarks.length} bookmarks\n`);
    if (bookmarks.length > 0) {
      bookmarks.forEach((bm, index) => {
        console.log(`${index + 1}. ${bm.comic_id?.title || 'N/A'} (Key: ${bm.key_id?.key_value || 'N/A'})`);
      });
    } else {
      console.log('  Chưa có bookmark nào');
    }

    // 5. Xem lịch sử đọc
    console.log('\n📖 LỊCH SỬ ĐỌC:');
    const history = await ReadingHistory.find()
      .populate('comic_id', 'title thumbnail')
      .populate('key_id', 'key_value')
      .sort({ updatedAt: -1 })
      .limit(10);
    console.log(`Hiển thị 10 mục gần nhất:\n`);
    if (history.length > 0) {
      history.forEach((h, index) => {
        console.log(`${index + 1}. ${h.comic_id?.title || 'N/A'} - Chapter ${h.chapter_number}`);
        console.log(`   Key: ${h.key_id?.key_value || 'N/A'} | Đọc lúc: ${h.updatedAt}`);
      });
    } else {
      console.log('  Chưa có lịch sử đọc');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n💡 Để xem chi tiết hơn, bạn có thể:');
    console.log('   1. Dùng MongoDB Compass: https://www.mongodb.com/products/compass');
    console.log('   2. Hoặc dùng MongoDB shell: mongosh');
    console.log('   3. Database name: comics_library\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Chờ MongoDB connect rồi mới chạy
setTimeout(() => {
  viewData();
}, 2000);
