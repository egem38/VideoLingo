const express = require('express');
const bodyParser = require('body-parser');
const { init } = require('./db');

const bookRoutes = require('./routes/books');
const userRoutes = require('./routes/users');
const borrowRoutes = require('./routes/borrow');

const app = express();
const PORT = process.env.PORT || 3000;

// SQLite veritabani tablolari olusturuluyor
init();

app.use(bodyParser.json());
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/borrow', borrowRoutes);

app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda calisiyor`));
