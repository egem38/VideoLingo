const express = require('express');
const router = express.Router();
const { db } = require('../db');
const multer = require('multer');
const xlsx = require('xlsx');
const fetch = require('node-fetch');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

// Yeni kitap ekle
router.post('/', (req, res) => {
  const {
    isbn,
    baslik,
    yazar,
    yayinevi,
    baski_yili,
    sayfa_sayisi,
    resim,
    raf,
    kategori,
    mevcut
  } = req.body;

  const stmt = db.prepare(
    `INSERT INTO books (isbn, baslik, yazar, yayinevi, baski_yili, sayfa_sayisi, resim, raf, kategori, mevcut)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  stmt.run(
    isbn,
    baslik,
    yazar,
    yayinevi,
    baski_yili,
    sayfa_sayisi,
    resim,
    raf,
    kategori,
    mevcut || 1,
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        isbn,
        baslik,
        yazar,
        yayinevi,
        baski_yili,
        sayfa_sayisi,
        resim,
        raf,
        kategori,
        mevcut: mevcut || 1
      });
    }
  );
  stmt.finalize();
});

// Tum kitaplari listele
router.get('/', (req, res) => {
  db.all('SELECT * FROM books', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Tum kitaplari Excel olarak indir
router.get('/export', (req, res) => {
  db.all('SELECT * FROM books', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, 'Kitaplar');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="books.xlsx"'
    );
    res.type(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.send(buf);
  });
});

// Excelden kitap yukle
router.post('/import', upload.single('file'), (req, res) => {
  try {
    const wb = xlsx.readFile(req.file.path);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    const stmt = db.prepare(
      `INSERT INTO books (isbn, baslik, yazar, yayinevi, baski_yili, sayfa_sayisi, resim, raf, kategori, mevcut) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    data.forEach(row => {
      stmt.run(
        row.isbn,
        row.baslik,
        row.yazar,
        row.yayinevi,
        row.baski_yili,
        row.sayfa_sayisi,
        row.resim,
        row.raf,
        row.kategori,
        row.mevcut || 1
      );
    });
    stmt.finalize();
    fs.unlinkSync(req.file.path);
    res.json({ message: 'Yukleme tamamlandi', count: data.length });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ISBN ile Google Books/Open Library'den veri cek
router.get('/fetch/:isbn', async (req, res) => {
  const { isbn } = req.params;
  try {
    let info = null;
    const google = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    ).then(r => r.json());
    if (google.totalItems > 0) {
      const volume = google.items[0].volumeInfo;
      info = {
        baslik: volume.title,
        yazar: (volume.authors || []).join(', '),
        yayinevi: volume.publisher,
        baski_yili: volume.publishedDate,
        sayfa_sayisi: volume.pageCount,
        resim: volume.imageLinks ? volume.imageLinks.thumbnail : null
      };
    } else {
      const ol = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`
      ).then(r => r.json());
      const record = ol[`ISBN:${isbn}`];
      if (record) {
        info = {
          baslik: record.title,
          yazar: record.authors ? record.authors.map(a => a.name).join(', ') : '',
          yayinevi: record.publishers ? record.publishers.map(p => p.name).join(', ') : '',
          baski_yili: record.publish_date,
          sayfa_sayisi: record.number_of_pages,
          resim: record.cover ? record.cover.medium : null
        };
      }
    }
    if (!info) {
      return res.status(404).json({ error: 'Kayit bulunamadi' });
    }
    res.json(info);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
