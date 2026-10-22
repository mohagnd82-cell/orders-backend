const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 10000;

// Initialize SQLite Database
const db = new sqlite3.Database('orders.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create Orders Table
db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    wilaya TEXT NOT NULL,
    commune TEXT,
    product_name TEXT DEFAULT 'Cha3rati Package',
    total_price INTEGER DEFAULT 6500,
    status TEXT DEFAULT 'New',
    is_duplicate INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Middleware
app.use(cors());
app.use(express.json());

// 1. Order Receiving API Endpoint
app.post('/api/orders', (req, res) => {
  const { customer_name, phone, wilaya, commune, product_name, total_price } = req.body;

  if (!customer_name || !phone || !wilaya) {
    return res.status(400).json({ success: false, message: 'Please provide name, phone, and wilaya.' });
  }

  // Check duplicate phone in last 10 minutes
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  db.get('SELECT id FROM orders WHERE phone = ? AND created_at > ?', [phone, tenMinsAgo], (err, row) => {
    const is_duplicate = row ? 1 : 0;

    const stmt = db.prepare(`
      INSERT INTO orders (customer_name, phone, wilaya, commune, product_name, total_price, is_duplicate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      customer_name,
      phone,
      wilaya,
      commune || '',
      product_name || 'Cha3rati Package',
      total_price || 6500,
      is_duplicate
    ], function (err) {
      if (err) {
        console.error('Error saving order:', err.message);
        return res.status(500).json({ success: false, message: 'Database insert failed' });
      }

      res.json({
        success: true,
        order_id: ORD-${this.lastID},
        message: 'Order received successfully!'
      });
    });
    stmt.finalize();
  });
});

// 2. Fetch Orders
app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
    res.json({ success: true, orders: rows });
  });
});

// 3. Health Check
app.get('/', (req, res) => {
  res.send('Cha3rati Orders Backend API is running live!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(Server running on port ${PORT});
});
