
const Database = require('better-sqlite3');
const admin    = require('firebase-admin');
const path     = require('path');

// ── CẤU HÌNH ────────────────────────────────────────────────────────────────
const DB_PATH          = 'D:\\dream_project\\daily_mate_code\\daily_mate_all\\database\\recipe.db';
const SERVICE_ACCOUNT  = path.join(__dirname, 'firebase-service-account.json');
const PROJECT_ID       = 'jpdweb-9d3d3';
const COLLECTION_NAME  = 'ingredients_ref';
const BATCH_SIZE       = 400; // Firestore giới hạn 500 writes/batch
// ────────────────────────────────────────────────────────────────────────────

// Khởi tạo Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require(SERVICE_ACCOUNT)),
  projectId:  PROJECT_ID,
});
const firestore = admin.firestore();

async function migrate() {
  console.log('📂 Mở SQLite:', DB_PATH);
  const db = new Database(DB_PATH, { readonly: true });

  // Đọc chỉ 4 cột cần thiết
  const rows = db.prepare(`
    SELECT id, name, name_en, category
    FROM ingredients
    ORDER BY id ASC
  `).all();

  console.log(`✅ Đọc được ${rows.length} ingredients từ SQLite`);
  db.close();

  if (rows.length === 0) {
    console.log('⚠️  Không có data, dừng.');
    return;
  }

  // Đẩy lên Firestore theo batch
  let totalWritten = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const batch = firestore.batch();

    for (const row of chunk) {
      // Dùng id SQLite làm document ID cho dễ tra cứu
      const docRef = firestore
        .collection(COLLECTION_NAME)
        .doc(String(row.id));

      batch.set(docRef, {
        id:       row.id,
        name:     row.name     || '',
        name_en:  row.name_en  || '',
        category: row.category || '',
      });
    }

    await batch.commit();
    totalWritten += chunk.length;
    console.log(`📤 Đã đẩy ${totalWritten}/${rows.length} documents...`);
  }

  console.log(`🎉 Hoàn thành! ${totalWritten} ingredients đã lên Firestore → ${COLLECTION_NAME}`);
}

migrate().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});