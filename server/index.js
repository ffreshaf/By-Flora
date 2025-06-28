const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to SQLite
const db = new sqlite3.Database('database/database.db', (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to SQLite database.');
});

// Example route
/* 
app.get('/api/dogs', (req, res) => {
  db.all('SELECT * FROM dogs', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}); */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
