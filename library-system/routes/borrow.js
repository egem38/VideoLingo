const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Kitap odunc al
router.post('/', (req, res) => {
  const { okul_no, isbn, borrowDate, dueDate, returnDate } = req.body;

  db.get('SELECT id FROM users WHERE okul_no = ?', [okul_no], (err, userRow) => {
    if (err || !userRow) {
      return res.status(400).json({ error: 'Kullanici bulunamadi' });
    }

  db.get('SELECT id, mevcut FROM books WHERE isbn = ?', [isbn], (err2, bookRow) => {
    if (err2 || !bookRow) {
      return res.status(400).json({ error: 'Kitap bulunamadi' });
    }

    if (bookRow.mevcut <= 0) {
      return res.status(400).json({ error: 'Kitap mevcut degil' });
    }

      const stmt = db.prepare(
        'INSERT INTO borrow (userId, bookId, borrowDate, dueDate, returnDate) VALUES (?, ?, ?, ?, ?)'
      );
      stmt.run(
        userRow.id,
        bookRow.id,
        borrowDate || new Date().toISOString(),
        dueDate || null,
        returnDate || null,
        function (err3) {
          if (err3) {
            return res.status(400).json({ error: err3.message });
          }
          res.status(201).json({
            id: this.lastID,
            userId: userRow.id,
            bookId: bookRow.id,
            borrowDate: borrowDate || new Date().toISOString(),
            dueDate,
            returnDate
          });
          db.run('UPDATE books SET mevcut = mevcut - 1 WHERE id = ?', [bookRow.id]);
        }
      );
      stmt.finalize();
    });
  });
});

// Odunc kayitlarini listele
router.get('/', (req, res) => {
  const query = `SELECT b.id, b.userId, b.bookId, b.borrowDate, b.dueDate, b.returnDate,
    u.ad || ' ' || u.soyad AS kullanici,
    bo.baslik AS kitap
    FROM borrow b
    LEFT JOIN users u ON b.userId = u.id
    LEFT JOIN books bo ON b.bookId = bo.id`;
  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Kitabi iade et
router.put('/:id/return', (req, res) => {
  const { id } = req.params;
  const returnDate = new Date().toISOString();

  db.get('SELECT bookId, returnDate FROM borrow WHERE id = ?', [id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'Kayit bulunamadi' });
    }
    if (row.returnDate) {
      return res.status(400).json({ error: 'Kitap zaten iade edilmis' });
    }
    db.run('UPDATE borrow SET returnDate = ? WHERE id = ?', [returnDate, id], err2 => {
      if (err2) {
        return res.status(400).json({ error: err2.message });
      }
      db.run('UPDATE books SET mevcut = mevcut + 1 WHERE id = ?', [row.bookId]);
      res.json({ id: parseInt(id, 10), returnDate });
    });
  });
});

module.exports = router;
