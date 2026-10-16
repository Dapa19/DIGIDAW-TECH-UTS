const fs = require('node:fs');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

const dataDirectory = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDirectory, { recursive: true });

const database = new sqlite3.Database(path.join(dataDirectory, 'digidaw.sqlite'));

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    database.run(sql, params, function onRun(error) {
      if (error) reject(error);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    database.get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    database.all(sql, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });
}

async function initializeDatabase() {
  await run('PRAGMA foreign_keys = ON');
  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      category TEXT NOT NULL CHECK (length(trim(category)) > 0),
      description TEXT NOT NULL DEFAULT '',
      price INTEGER NOT NULL CHECK (price >= 0),
      stock INTEGER NOT NULL CHECK (stock >= 0),
      image_url TEXT NOT NULL DEFAULT ''
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      email TEXT NOT NULL UNIQUE CHECK (length(trim(email)) > 0),
      phone TEXT NOT NULL CHECK (length(trim(phone)) > 0)
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      total INTEGER NOT NULL CHECK (total >= 0),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    )
  `);

  const count = await get('SELECT COUNT(*) AS count FROM products');
  if (count.count === 0) {
    const seedProducts = [
      ['AMD Ryzen 5 5600', 'Processor', '6 core, 12 thread. Pilihan solid untuk gaming dan produktivitas harian.', 1899000, 12, ''],
      ['Intel Core i5-12400F', 'Processor', '6 core, 12 thread dengan performa responsif untuk rakitan kelas menengah.', 2199000, 9, ''],
      ['MSI B550M PRO-VDH WIFI', 'Motherboard', 'Motherboard AM4 Micro-ATX dengan Wi-Fi terintegrasi dan dukungan PCIe 4.0.', 1699000, 7, ''],
      ['Corsair Vengeance LPX 16GB', 'RAM', 'Kit 2x8GB DDR4 3200MHz dengan heatsink low-profile.', 649000, 18, ''],
      ['ASUS Dual GeForce RTX 4060', 'VGA', 'Kartu grafis 8GB GDDR6 yang efisien untuk gaming 1080p.', 5299000, 4, ''],
      ['Samsung 990 EVO 1TB', 'SSD', 'SSD NVMe 1TB untuk booting cepat dan penyimpanan game.', 1599000, 11, ''],
      ['Cooler Master MWE 650 Bronze V2', 'Power Supply', 'PSU 650W 80 Plus Bronze dengan kabel flat hitam.', 899000, 8, '']
    ];
    for (const product of seedProducts) {
      await run(
        'INSERT INTO products (name, category, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        product
      );
    }
  }
}

module.exports = { all, database, get, initializeDatabase, run };
