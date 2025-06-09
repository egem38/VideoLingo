const express = require('express');
const router = express.Router();
const { db } = require('../db');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });
// Kullanici kaydet
router.post('/', (req, res) => {
  const {
    ad,
    soyad,
    sinif,
    sube,
    okul_no,
    email,
    tel,
    rol
  } = req.body;

  const stmt = db.prepare(
    'INSERT INTO users (ad, soyad, sinif, sube, okul_no, email, tel, rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(ad, soyad, sinif, sube, okul_no, email, tel, rol || 'ogrenci', function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      ad,
      soyad,
      sinif,
      sube,
      okul_no,
      email,
      tel,
      rol: rol || 'ogrenci'
    });
  });
  stmt.finalize();
});

// Kullanici listesini getir
router.get('/', (req, res) => {
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Tum uyeleri Excel olarak indir
router.get('/export', (req, res) => {
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, 'Uyeler');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="users.xlsx"'
    );
    res.type(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.send(buf);
  });
});

// Excelden uye yukle
router.post('/import', upload.single('file'), (req, res) => {
  try {
    const wb = xlsx.readFile(req.file.path);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    const stmt = db.prepare(
      'INSERT INTO users (ad, soyad, sinif, sube, okul_no, email, tel, rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
  data.forEach(row => {
      stmt.run(
        row.ad,
        row.soyad,
        row.sinif,
        row.sube,
        row.okul_no,
        row.email,
        row.tel,
        row.rol || 'ogrenci'
      );
  });
  stmt.finalize();
  fs.unlinkSync(req.file.path);
  res.json({ message: 'Yukleme tamamlandi', count: data.length });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
