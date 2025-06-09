const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());

let books = [];
let students = [];
let loans = [];
let nextBookId = 1;
let nextStudentId = 1;

// CRUD for books
app.get('/books', (req, res) => {
  res.json(books);
});

app.post('/books', (req, res) => {
  const book = { id: nextBookId++, ...req.body, available: true };
  books.push(book);
  res.status(201).json(book);
});

// Search books by title or author
app.get('/books/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const results = books.filter(b =>
    b.title.toLowerCase().includes(q) ||
    (b.author && b.author.toLowerCase().includes(q))
  );
  res.json(results);
});

// List only available books
app.get('/books/available', (req, res) => {
  res.json(books.filter(b => b.available));
});

app.put('/books/:id', (req, res) => {
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).send('Book not found');
  Object.assign(book, req.body);
  res.json(book);
});

app.delete('/books/:id', (req, res) => {
  const index = books.findIndex(b => b.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).send('Book not found');
  books.splice(index, 1);
  res.status(204).send();
});

// CRUD for students
app.get('/students', (req, res) => {
  res.json(students);
});

app.post('/students', (req, res) => {
  const student = { id: nextStudentId++, ...req.body };
  students.push(student);
  res.status(201).json(student);
});

// Update student information
app.put('/students/:id', (req, res) => {
  const student = students.find(s => s.id === parseInt(req.params.id));
  if (!student) return res.status(404).send('Student not found');
  Object.assign(student, req.body);
  res.json(student);
});

// Borrow a book
app.post('/borrow', (req, res) => {
  const { bookId, studentId, dueDate } = req.body;
  const book = books.find(b => b.id === bookId);
  const student = students.find(s => s.id === studentId);
  if (!book || !student) return res.status(404).send('Book or student not found');
  if (!book.available) return res.status(400).send('Book not available');
  book.available = false;
  const date = dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  loans.push({ bookId, studentId, dueDate: date });
  res.status(201).send('Borrowed');
});

// Return a book
app.post('/return', (req, res) => {
  const { bookId, studentId } = req.body;
  const book = books.find(b => b.id === bookId);
  if (!book) return res.status(404).send('Book not found');
  const loanIndex = loans.findIndex(l => l.bookId === bookId && l.studentId === studentId);
  if (loanIndex === -1) return res.status(404).send('Loan not found');
  book.available = true;
  loans.splice(loanIndex, 1);
  res.status(200).send('Returned');
});

// List all active loans
app.get('/loans', (req, res) => {
  const detailed = loans.map(l => ({
    book: books.find(b => b.id === l.bookId),
    student: students.find(s => s.id === l.studentId),
    dueDate: l.dueDate
  }));
  res.json(detailed);
});

// List overdue books
app.get('/overdue', (req, res) => {
  const now = new Date();
  const overdue = loans.filter(l => l.dueDate < now).map(l => ({
    book: books.find(b => b.id === l.bookId),
    student: students.find(s => s.id === l.studentId),
    dueDate: l.dueDate
  }));
  res.json(overdue);
});

app.listen(port, () => {
  console.log(`Library system listening on port ${port}`);
});
