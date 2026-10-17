const express = require('express');
const cors = require('cors');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { all, database, get, initializeDatabase, run } = require('./db');

const app = express();
const port = Number(process.env.PORT) || 3000;
const uploadDirectory = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });
app.use('/uploads', express.static(uploadDirectory));

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '100kb' }));

// Seluruh request API mengakses satu koneksi SQLite. Antrekan request agar
// query dari request lain tidak ikut masuk ke tengah transaksi checkout.
let apiRequestTail = Promise.resolve();
app.use('/api', (request, response, next) => {
  const previousRequest = apiRequestTail;
  let releaseRequest;
  apiRequestTail = new Promise((resolve) => { releaseRequest = resolve; });
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    releaseRequest();
  };
  response.once('finish', release);
  response.once('close', release);
  previousRequest.then(() => next(), next);
});

function sendError(response, status, message) {
  return response.status(status).json({ success: false, message });
}

const adminUsername = 'superadmin';
const adminPassword = 'admin123';
const adminSessions = new Set();

function requireAdmin(request, response, next) {
  const authorization = request.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !adminSessions.has(token)) {
    return sendError(response, 401, 'Silakan masuk sebagai admin untuk melanjutkan.');
  }
  request.adminToken = token;
  return next();
}

app.post('/api/admin/login', (request, response) => {
  const { username, password } = request.body || {};
  if (username !== adminUsername || password !== adminPassword) {
    return sendError(response, 401, 'Username atau password tidak sesuai.');
  }
  const token = randomBytes(32).toString('hex');
  adminSessions.add(token);
  return response.json({ success: true, data: { token, username: adminUsername } });
});

app.get('/api/admin/session', requireAdmin, (request, response) => {
  response.json({ success: true, data: { username: adminUsername } });
});

app.post('/api/admin/logout', requireAdmin, (request, response) => {
  adminSessions.delete(request.adminToken);
  response.json({ success: true, data: { message: 'Anda sudah keluar dari admin.' } });
});

app.post('/api/admin/uploads', requireAdmin, (request, response) => {
  const contentType = request.get('content-type') || '';
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundary || !contentType.toLowerCase().startsWith('multipart/form-data')) return sendError(response, 400, 'Format upload gambar tidak valid.');
  const marker = Buffer.from(`--${boundary[1] || boundary[2]}`);
  const chunks = [];
  let size = 0;
  request.on('data', (chunk) => {
    size += chunk.length;
    if (size <= 5 * 1024 * 1024 + 65536) chunks.push(chunk);
  });
  request.on('end', () => {
    if (size > 5 * 1024 * 1024 + 65536) return sendError(response, 413, 'Ukuran gambar maksimal 5 MB.');
    const body = Buffer.concat(chunks);
    const start = body.indexOf(marker);
    const headerStart = body.indexOf(Buffer.from('\r\n\r\n'), start);
    const end = body.indexOf(Buffer.from(`\r\n${marker}`), headerStart + 4);
    if (start < 0 || headerStart < 0 || end < 0) return sendError(response, 400, 'File gambar tidak ditemukan.');
    const headers = body.subarray(start, headerStart).toString('utf8');
    const mime = headers.match(/content-type:\s*(image\/(?:jpeg|png|webp|gif))/i)?.[1]?.toLowerCase();
    const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
    if (!mime) return sendError(response, 400, 'Format gambar harus JPG, PNG, WEBP, atau GIF.');
    const fileName = `${randomBytes(16).toString('hex')}${extensions[mime]}`;
    fs.writeFile(path.join(uploadDirectory, fileName), body.subarray(headerStart + 4, end), (error) => {
      if (error) return sendError(response, 500, 'Gambar gagal disimpan.');
      return response.status(201).json({ success: true, data: { image_url: `${request.protocol}://${request.get('host')}/uploads/${fileName}` } });
    });
  });
});

function validProduct(body) {
  return body && typeof body.name === 'string' && body.name.trim()
    && typeof body.category === 'string' && body.category.trim()
    && typeof body.description === 'string'
    && Number.isSafeInteger(body.price) && body.price >= 0
    && Number.isSafeInteger(body.stock) && body.stock >= 0
    && (body.image_url === undefined || typeof body.image_url === 'string');
}

function productValues(body) {
  return [body.name.trim(), body.category.trim(), body.description.trim(), body.price, body.stock, (body.image_url || '').trim()];
}

app.get('/api/products', async (request, response, next) => {
  try {
    const products = await all('SELECT * FROM products ORDER BY id DESC');
    response.json({ success: true, data: products });
  } catch (error) { next(error); }
});

app.get('/api/products/:id', async (request, response, next) => {
  try {
    const product = await get('SELECT * FROM products WHERE id = ?', [request.params.id]);
    if (!product) return sendError(response, 404, 'Produk tidak ditemukan.');
    response.json({ success: true, data: product });
  } catch (error) { next(error); }
});

app.post('/api/products', requireAdmin, async (request, response, next) => {
  try {
    if (!validProduct(request.body)) return sendError(response, 400, 'Data produk tidak valid. Pastikan nama, kategori, harga, dan stok terisi dengan benar.');
    const result = await run(
      'INSERT INTO products (name, category, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      productValues(request.body)
    );
    const product = await get('SELECT * FROM products WHERE id = ?', [result.lastID]);
    response.status(201).json({ success: true, data: product });
  } catch (error) { next(error); }
});

app.put('/api/products/:id', requireAdmin, async (request, response, next) => {
  try {
    if (!validProduct(request.body)) return sendError(response, 400, 'Data produk tidak valid.');
    const result = await run(
      'UPDATE products SET name = ?, category = ?, description = ?, price = ?, stock = ?, image_url = ? WHERE id = ?',
      [...productValues(request.body), request.params.id]
    );
    if (!result.changes) return sendError(response, 404, 'Produk tidak ditemukan.');
    const product = await get('SELECT * FROM products WHERE id = ?', [request.params.id]);
    response.json({ success: true, data: product });
  } catch (error) { next(error); }
});

app.delete('/api/products/:id', requireAdmin, async (request, response, next) => {
  try {
    const result = await run('DELETE FROM products WHERE id = ?', [request.params.id]);
    if (!result.changes) return sendError(response, 404, 'Produk tidak ditemukan.');
    response.json({ success: true, data: { id: Number(request.params.id) } });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') return sendError(response, 409, 'Produk sudah tercatat pada pesanan dan tidak dapat dihapus.');
    next(error);
  }
});

app.post('/api/orders', async (request, response, next) => {
  const customer = request.body && request.body.customer;
  const items = request.body && request.body.items;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!customer || typeof customer.name !== 'string' || !customer.name.trim()
      || typeof customer.email !== 'string' || !emailPattern.test(customer.email.trim())
      || typeof customer.phone !== 'string' || !customer.phone.trim()
      || typeof customer.address !== 'string' || !customer.address.trim()) {
    return sendError(response, 400, 'Nama, email valid, nomor telepon, dan alamat wajib diisi.');
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return sendError(response, 400, 'Pilih minimal satu produk (maksimal 50 jenis produk).');
  }
  const seen = new Set();
  for (const item of items) {
    if (!item || !Number.isSafeInteger(item.product_id) || item.product_id < 1
        || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 10000
        || seen.has(item.product_id)) {
      return sendError(response, 400, 'Daftar produk atau kuantitas tidak valid. Setiap produk hanya boleh muncul satu kali.');
    }
    seen.add(item.product_id);
  }

  try {
    await run('BEGIN IMMEDIATE');
    let total = 0;
    const selected = [];
    for (const item of items) {
      const product = await get('SELECT id, name, price, stock FROM products WHERE id = ?', [item.product_id]);
      if (!product) {
        await run('ROLLBACK');
        return sendError(response, 404, `Produk dengan ID ${item.product_id} tidak ditemukan.`);
      }
      if (product.stock < item.quantity) {
        await run('ROLLBACK');
        return sendError(response, 400, `Stok ${product.name} tidak mencukupi. Stok tersedia: ${product.stock}.`);
      }
      total += product.price * item.quantity;
      if (!Number.isSafeInteger(total)) {
        await run('ROLLBACK');
        return sendError(response, 400, 'Total pesanan melebihi batas yang didukung.');
      }
      selected.push({ ...item, product });
    }

    const customerEmail = customer.email.trim().toLowerCase();
    await run(
      `INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET name = excluded.name, phone = excluded.phone`,
      [customer.name.trim(), customerEmail, customer.phone.trim()]
    );
    const savedCustomer = await get('SELECT id FROM customers WHERE email = ?', [customerEmail]);
    const orderResult = await run(
      'INSERT INTO orders (customer_id, total, shipping_address) VALUES (?, ?, ?)',
      [savedCustomer.id, total, customer.address.trim()]
    );

    for (const item of selected) {
      await run(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderResult.lastID, item.product.id, item.quantity, item.product.price]
      );
      await run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product.id]);
    }
    await run('COMMIT');

    const order = await get(
      `SELECT orders.id, orders.customer_id, customers.name AS customer_name, customers.email,
              customers.phone, orders.shipping_address, orders.total, orders.status, orders.created_at
       FROM orders JOIN customers ON customers.id = orders.customer_id WHERE orders.id = ?`,
      [orderResult.lastID]
    );
    response.status(201).json({ success: true, data: order });
  } catch (error) {
    try { await run('ROLLBACK'); } catch (_) { /* transaksi mungkin sudah selesai */ }
    next(error);
  }
});

app.post('/api/orders/lookup', async (request, response, next) => {
  const identifier = typeof request.body?.identifier === 'string' ? request.body.identifier.trim() : '';
  if (!identifier) return sendError(response, 400, 'Masukkan ID pesanan, email, atau nomor telepon.');

  try {
    const orderSummaryQuery = `SELECT orders.id, orders.total, orders.status, orders.created_at,
                                      COUNT(order_items.id) AS item_count
                               FROM orders JOIN customers ON customers.id = orders.customer_id
                               LEFT JOIN order_items ON order_items.order_id = orders.id`;
    let orders;
    const numericIdentifier = /^\d+$/.test(identifier);
    const isOrderId = /^#\d+$/.test(identifier) || (numericIdentifier && identifier.length <= 9);
    if (isOrderId) {
      const orderId = Number(identifier.replace('#', ''));
      if (!Number.isSafeInteger(orderId) || orderId < 1) return response.json({ success: true, data: [] });
      orders = await all(
        `${orderSummaryQuery} WHERE orders.id = ? GROUP BY orders.id ORDER BY orders.id DESC`,
        [orderId]
      );
    } else if (identifier.includes('@')) {
      orders = await all(
        `${orderSummaryQuery} WHERE lower(customers.email) = lower(?) GROUP BY orders.id ORDER BY orders.id DESC`,
        [identifier]
      );
    } else {
      const phone = identifier.replace(/\D/g, '');
      if (phone.length < 6) return sendError(response, 400, 'Nomor telepon harus berisi minimal 6 angka.');
      const normalizedPhone = `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(customers.phone, ' ', ''), '-', ''), '+', ''), '(', ''), ')', ''), '.', '')`;
      orders = await all(
        `${orderSummaryQuery} WHERE ${normalizedPhone} = ? GROUP BY orders.id ORDER BY orders.id DESC`,
        [phone]
      );
    }
    response.json({ success: true, data: orders });
  } catch (error) { next(error); }
});

app.get('/api/orders', requireAdmin, async (request, response, next) => {
  try {
    const orders = await all(
      `SELECT orders.id, customers.name AS customer_name, customers.email, customers.phone,
              orders.total, orders.status, orders.created_at, COUNT(order_items.id) AS item_count
       FROM orders JOIN customers ON customers.id = orders.customer_id
       LEFT JOIN order_items ON order_items.order_id = orders.id
       GROUP BY orders.id ORDER BY orders.id DESC`
    );
    response.json({ success: true, data: orders });
  } catch (error) { next(error); }
});

app.patch('/api/orders/:id/status', requireAdmin, async (request, response, next) => {
  const allowedStatuses = ['pending', 'processing', 'completed', 'cancelled'];
  if (!allowedStatuses.includes(request.body?.status)) {
    return sendError(response, 400, 'Status pesanan tidak valid.');
  }
  try {
    const result = await run('UPDATE orders SET status = ? WHERE id = ?', [request.body.status, request.params.id]);
    if (!result.changes) return sendError(response, 404, 'Pesanan tidak ditemukan.');
    response.json({ success: true, data: { id: Number(request.params.id), status: request.body.status } });
  } catch (error) { next(error); }
});

app.get('/api/orders/:id', requireAdmin, async (request, response, next) => {
  try {
    const order = await get(
      `SELECT orders.id, orders.customer_id, customers.name AS customer_name, customers.email,
              customers.phone, orders.shipping_address, orders.total, orders.status, orders.created_at
       FROM orders JOIN customers ON customers.id = orders.customer_id WHERE orders.id = ?`,
      [request.params.id]
    );
    if (!order) return sendError(response, 404, 'Pesanan tidak ditemukan.');
    order.items = await all(
      `SELECT order_items.product_id, products.name AS product_name, order_items.quantity,
              order_items.unit_price, (order_items.quantity * order_items.unit_price) AS subtotal
       FROM order_items JOIN products ON products.id = order_items.product_id WHERE order_items.order_id = ?`,
      [request.params.id]
    );
    response.json({ success: true, data: order });
  } catch (error) { next(error); }
});

app.use((request, response) => sendError(response, 404, 'Endpoint tidak ditemukan.'));
app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  if (error instanceof SyntaxError && 'body' in error) return sendError(response, 400, 'Format JSON tidak valid.');
  console.error(error);
  return sendError(response, 500, 'Terjadi kesalahan pada server.');
});

initializeDatabase()
  .then(() => {
    app.listen(port, () => console.log(`Digidaw Tech API berjalan di http://localhost:${port}/api`));
  })
  .catch((error) => {
    console.error('Gagal menyiapkan database:', error);
    database.close();
    process.exit(1);
  });
