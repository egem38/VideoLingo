const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'library.db'));

function init() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad TEXT NOT NULL,
      soyad TEXT NOT NULL,
      sinif TEXT,
      sube TEXT,
      okul_no INTEGER,
      email TEXT UNIQUE,
      tel TEXT,
      rol TEXT DEFAULT 'ogrenci'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn TEXT UNIQUE,
      baslik TEXT NOT NULL,
      yazar TEXT,
      yayinevi TEXT,
      baski_yili INTEGER,
      sayfa_sayisi INTEGER,
      resim TEXT,
      raf TEXT,
      kategori TEXT,
      mevcut INTEGER DEFAULT 1
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS borrow (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      bookId INTEGER NOT NULL,
      borrowDate TEXT DEFAULT CURRENT_TIMESTAMP,
      dueDate TEXT,
      returnDate TEXT,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(bookId) REFERENCES books(id)
    )`);
  });
}

module.exports = { db, init };
