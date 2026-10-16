import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useParams } from 'react-router-dom';
import { apiRequest, rupiah } from './api.js';

function Header() {
  return <header className="site-header">
    <div className="header-inner">
      <Link to="/" className="brand"><span className="brand-mark">D</span><span>digidaw<span className="brand-light">tech</span></span></Link>
      <nav className="main-nav" aria-label="Navigasi utama">
        <NavLink to="/" end>Katalog</NavLink><NavLink to="/checkout">Checkout</NavLink>
        <NavLink to="/orders">Pesanan</NavLink><NavLink to="/admin">Admin</NavLink>
      </nav>
      <Link className="header-cta" to="/checkout">Mulai belanja <span aria-hidden="true">↗</span></Link>
    </div>
  </header>;
}

function Notice({ type = 'error', children }) {
  if (!children) return null;
  return <div className={`notice ${type}`} role="status">{children}</div>;
}

function Loading() { return <div className="loading"><span className="spinner" />Memuat data...</div>; }

function ProductArtwork({ product, large = false }) {
  const category = product.category.toLowerCase();
  return <div className={`product-art ${large ? 'large' : ''} art-${category.replace(/\s+/g, '-')}`}>
    {product.image_url ? <img src={product.image_url} alt={product.name} /> : <>
      <span className="art-label">{product.category}</span>
      <span className="art-name">{product.name.split(' ').slice(0, 3).join(' ')}</span>
      <span className="art-symbol">{category === 'processor' ? '◉' : category === 'ram' ? '▥' : category === 'ssd' ? '▰' : category === 'vga' ? '▰' : category === 'motherboard' ? '⌘' : 'ϟ'}</span>
      <span className="art-foot">DIGIDAW SELECT · 2026</span>
    </>}
  </div>;
}

function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('Semua');
  const [query, setQuery] = useState('');
  const categories = ['Semua', ...new Set(products.map((item) => item.category))];
  async function loadProducts() {
    setLoading(true); setError('');
    try { setProducts(await apiRequest('/products')); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadProducts(); }, []);
  const visible = products.filter((product) => (category === 'Semua' || product.category === category)
    && product.name.toLowerCase().includes(query.toLowerCase()));
  return <>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow"><span className="blue-dot" /> KOMPONEN PC, DIKURASI</p>
        <h1>Build your<br /><span>next chapter.</span></h1>
        <p className="hero-text">Komponen pilihan untuk rakitan yang terasa pas. Performa andal, harga transparan, tanpa ribet.</p>
        <a className="button button-dark" href="#catalog">Jelajahi katalog <span>↓</span></a>
      </div>
      <div className="hero-visual"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
        <div className="chip-card"><span className="chip-top">DD / COMPONENTS</span><span className="chip-icon">D</span><span className="chip-bottom">BUILT FOR WHAT'S NEXT</span></div>
        <div className="hero-side-note">EST. 2024 <span>—</span> PC PARTS, SIMPLIFIED</div>
      </div>
      <div className="hero-index"><span>01</span> / 04</div>
    </section>
    <section className="catalog-section section-wrap" id="catalog">
      <div className="section-heading"><div><p className="eyebrow">TEMUKAN KOMPONENMU</p><h2>Shop the essentials<span className="blue-period">.</span></h2></div>
        <span className="result-count">{products.length.toString().padStart(2, '0')} produk tersedia</span></div>
      <div className="catalog-controls"><div className="filter-list">{categories.map((item) => <button key={item} className={`filter-chip ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk" /></label></div>
      {loading ? <Loading /> : error ? <><Notice>{error}</Notice><button className="button button-outline" onClick={loadProducts}>Coba lagi</button></> : visible.length === 0 ? <div className="empty-state">Tidak ada produk yang cocok.</div> :
        <div className="product-grid">{visible.map((product) => <article className="product-card" key={product.id}>
          <Link to={`/products/${product.id}`} className="product-art-link"><ProductArtwork product={product} /></Link>
          <div className="product-meta"><span>{product.category}</span><span className={product.stock > 0 ? 'stock' : 'stock out'}>{product.stock > 0 ? `${product.stock} tersedia` : 'Stok habis'}</span></div>
          <Link to={`/products/${product.id}`} className="product-name">{product.name}</Link>
          <div className="product-bottom"><strong>{rupiah(product.price)}</strong><Link to={`/products/${product.id}`} className="arrow-link" aria-label={`Detail ${product.name}`}>↗</Link></div>
        </article>)}</div>}
    </section>
    <section className="trust-strip"><span>01 / KURASI KOMPONEN</span><span>02 / HARGA TRANSPARAN</span><span>03 / CHECKOUT MUDAH</span></section>
  </>;
}

function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { apiRequest(`/products/${id}`).then(setProduct).catch((err) => setError(err.message)).finally(() => setLoading(false)); }, [id]);
  if (loading) return <main className="page-shell"><Loading /></main>;
  if (error) return <main className="page-shell"><Notice>{error}</Notice><Link to="/" className="text-link">← Kembali ke katalog</Link></main>;
  return <main className="page-shell"><Link to="/" className="back-link">← Kembali ke katalog</Link><section className="product-detail">
    <ProductArtwork product={product} large />
    <div className="detail-copy"><p className="eyebrow">{product.category.toUpperCase()} / DIGIDAW SELECT</p><h1>{product.name}</h1><p className="detail-price">{rupiah(product.price)}</p>
      <p className="detail-description">{product.description || 'Komponen pilihan untuk melengkapi rakitan PC Anda.'}</p>
      <div className="detail-stock"><span className={product.stock > 0 ? 'stock-dot' : 'stock-dot out'} />{product.stock > 0 ? `${product.stock} unit tersedia` : 'Stok habis'}</div>
      <Link to={`/checkout?product=${product.id}`} className={`button button-dark ${product.stock === 0 ? 'disabled' : ''}`}>Lanjut ke checkout <span>↗</span></Link>
    </div>
  </section></main>;
}

function CheckoutPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialProductId = searchParams.get('product') || '';
  const [products, setProducts] = useState([]); const [quantities, setQuantities] = useState({});
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(''); const [success, setSuccess] = useState(null);
  useEffect(() => { apiRequest('/products').then((data) => {
    setProducts(data); if (initialProductId) setQuantities({ [initialProductId]: 1 });
  }).catch((err) => setError(err.message)).finally(() => setLoading(false)); }, []);
  const selected = products.filter((product) => Number(quantities[product.id]) > 0);
  const estimate = selected.reduce((sum, product) => sum + product.price * Number(quantities[product.id]), 0);
  function updateCustomer(event) { setCustomer({ ...customer, [event.target.name]: event.target.value }); }
  async function submitOrder(event) {
    event.preventDefault(); setError(''); setSuccess(null);
    const items = selected.map((product) => ({ product_id: product.id, quantity: Number(quantities[product.id]) }));
    if (!items.length) { setError('Pilih setidaknya satu produk untuk checkout.'); return; }
    setSubmitting(true);
    try {
      const order = await apiRequest('/orders', { method: 'POST', body: JSON.stringify({ customer, items }) });
      setSuccess(order); setQuantities({}); setCustomer({ name: '', email: '', phone: '' });
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }
  if (loading) return <main className="page-shell"><Loading /></main>;
  return <main className="page-shell narrow-shell"><div className="page-title"><p className="eyebrow">SELANGKAH LAGI</p><h1>Checkout<span className="blue-period">.</span></h1><p>Isi detail kontak dan pilih komponen yang ingin dipesan.</p></div>
    {success && <Notice type="success">Pesanan #{success.id} berhasil disimpan. <Link to={`/orders/${success.id}`}>Lihat detail pesanan ↗</Link></Notice>}
    <Notice>{error}</Notice>
    <form onSubmit={submitOrder} className="checkout-layout"><div className="checkout-main">
      <section className="form-section"><div className="form-section-heading"><span className="step-number">01</span><div><h2>Informasi pelanggan</h2><p>Data ini digunakan untuk detail pesanan.</p></div></div>
        <div className="form-grid"><label>Nama lengkap<input name="name" value={customer.name} onChange={updateCustomer} required placeholder="Nama Anda" /></label>
          <label>Email<input name="email" type="email" value={customer.email} onChange={updateCustomer} required placeholder="nama@email.com" /></label>
          <label className="full-field">Nomor telepon<input name="phone" type="tel" value={customer.phone} onChange={updateCustomer} required placeholder="08xxxxxxxxxx" /></label></div>
      </section>
      <section className="form-section"><div className="form-section-heading"><span className="step-number">02</span><div><h2>Pilih komponen</h2><p>Harga dan ketersediaan mengikuti data terbaru.</p></div></div>
        <div className="checkout-products">{products.map((product) => <div className={`checkout-product ${Number(quantities[product.id]) > 0 ? 'selected' : ''}`} key={product.id}>
          <label className="product-check"><input type="checkbox" checked={Number(quantities[product.id]) > 0} disabled={product.stock === 0} onChange={(event) => setQuantities({ ...quantities, [product.id]: event.target.checked ? 1 : 0 })} /><span className="custom-check" /></label>
          <div className="checkout-product-info"><strong>{product.name}</strong><span>{product.category} · {rupiah(product.price)}</span></div>
          <input className="quantity-input" type="number" min="1" max={product.stock} disabled={!Number(quantities[product.id]) || product.stock === 0} value={quantities[product.id] || ''} aria-label={`Kuantitas ${product.name}`} onChange={(event) => setQuantities({ ...quantities, [product.id]: event.target.value })} />
        </div>)}</div>
      </section>
    </div><aside className="order-summary"><p className="eyebrow">RINGKASAN</p><h2>Pesananmu</h2><div className="summary-lines">{selected.map((product) => <div className="summary-line" key={product.id}><span>{product.name} × {quantities[product.id]}</span><span>{rupiah(product.price * Number(quantities[product.id]))}</span></div>)}{!selected.length && <p className="muted">Belum ada produk dipilih.</p>}</div>
      <div className="summary-total"><span>Estimasi total</span><strong>{rupiah(estimate)}</strong></div><p className="summary-note">Total final dihitung ulang oleh server dari harga di database.</p><button className="button button-dark summary-submit" disabled={submitting}>{submitting ? 'Menyimpan pesanan...' : 'Buat pesanan'} <span>↗</span></button>
    </aside></form>
  </main>;
}

function OrdersPage() {
  const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  async function load() { setLoading(true); setError(''); try { setOrders(await apiRequest('/orders')); } catch (err) { setError(err.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  return <main className="page-shell"><div className="page-title"><p className="eyebrow">RIWAYAT TRANSAKSI</p><h1>Pesanan<span className="blue-period">.</span></h1><p>Semua pesanan yang berhasil disimpan akan muncul di sini.</p></div>
    {loading ? <Loading /> : error ? <><Notice>{error}</Notice><button className="button button-outline" onClick={load}>Coba lagi</button></> : !orders.length ? <div className="empty-state large-empty"><span className="empty-icon">↗</span><h2>Belum ada pesanan</h2><p>Pesanan pertama Anda akan tampil di halaman ini.</p><Link className="button button-dark" to="/">Lihat katalog</Link></div> :
      <div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>Nomor</th><th>Pelanggan</th><th>Tanggal</th><th>Item</th><th>Total</th><th>Status</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td className="order-number">#{order.id.toString().padStart(4, '0')}</td><td>{order.customer_name}</td><td>{new Date(`${order.created_at.replace(' ', 'T')}Z`).toLocaleString('id-ID')}</td><td>{order.item_count} produk</td><td className="table-total">{rupiah(order.total)}</td><td><span className="status-pill">{order.status}</span></td><td><Link className="arrow-link" to={`/orders/${order.id}`}>↗</Link></td></tr>)}</tbody></table></div>}
  </main>;
}

function OrderDetailPage() {
  const { id } = useParams(); const [order, setOrder] = useState(null); const [error, setError] = useState('');
  useEffect(() => { apiRequest(`/orders/${id}`).then(setOrder).catch((err) => setError(err.message)); }, [id]);
  if (error) return <main className="page-shell"><Notice>{error}</Notice><Link to="/orders" className="text-link">← Kembali ke pesanan</Link></main>;
  if (!order) return <main className="page-shell"><Loading /></main>;
  return <main className="page-shell narrow-shell"><Link to="/orders" className="back-link">← Semua pesanan</Link><div className="page-title order-detail-title"><p className="eyebrow">PESANAN BERHASIL TERSIMPAN</p><h1>#{order.id.toString().padStart(4, '0')}<span className="blue-period">.</span></h1><p>{new Date(`${order.created_at.replace(' ', 'T')}Z`).toLocaleString('id-ID')}</p></div>
    <section className="order-detail-card"><div className="order-customer"><div><span className="eyebrow">PELANGGAN</span><strong>{order.customer_name}</strong><span>{order.email} · {order.phone}</span></div><span className="status-pill">{order.status}</span></div>
      <div className="detail-items">{order.items.map((item) => <div className="detail-item" key={item.product_id}><div><strong>{item.product_name}</strong><span>{rupiah(item.unit_price)} × {item.quantity}</span></div><strong>{rupiah(item.subtotal)}</strong></div>)}</div>
      <div className="detail-order-total"><span>Total pesanan</span><strong>{rupiah(order.total)}</strong></div>
    </section>
  </main>;
}

const emptyProduct = { name: '', category: 'Processor', description: '', price: '', stock: '', image_url: '' };
function AdminPage() {
  const [products, setProducts] = useState([]); const [form, setForm] = useState(emptyProduct); const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  async function loadProducts() { setLoading(true); try { setProducts(await apiRequest('/products')); setError(''); } catch (err) { setError(err.message); } finally { setLoading(false); } }
  useEffect(() => { loadProducts(); }, []);
  function startEdit(product) { setEditingId(product.id); setForm({ ...product, price: String(product.price), stock: String(product.stock) }); setSuccess(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function resetForm() { setForm(emptyProduct); setEditingId(null); }
  async function saveProduct(event) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('');
    const body = { ...form, name: form.name.trim(), description: form.description.trim(), price: Number(form.price), stock: Number(form.stock) };
    try {
      await apiRequest(editingId ? `/products/${editingId}` : '/products', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(body) });
      setSuccess(editingId ? 'Produk berhasil diperbarui.' : 'Produk baru berhasil ditambahkan.'); resetForm(); await loadProducts();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  async function deleteProduct(product) {
    if (!window.confirm(`Hapus produk “${product.name}”?`)) return;
    setError(''); setSuccess('');
    try { await apiRequest(`/products/${product.id}`, { method: 'DELETE' }); setSuccess('Produk berhasil dihapus.'); await loadProducts(); }
    catch (err) { setError(err.message); }
  }
  return <main className="page-shell"><div className="page-title"><p className="eyebrow">PENGELOLAAN KATALOG</p><h1>Admin<span className="blue-period">.</span></h1><p>Tambah dan kelola produk yang tampil di katalog.</p></div>
    <Notice>{error}</Notice><Notice type="success">{success}</Notice>
    <div className="admin-layout"><form className="admin-form" onSubmit={saveProduct}><div className="admin-form-heading"><span className="step-number">{editingId ? '✎' : '+'}</span><div><h2>{editingId ? 'Edit produk' : 'Produk baru'}</h2><p>{editingId ? 'Perbarui informasi produk.' : 'Tambahkan produk ke katalog.'}</p></div></div>
      <label>Nama produk<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: AMD Ryzen 5 5600" /></label>
      <label>Kategori<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{['Processor', 'Motherboard', 'RAM', 'VGA', 'SSD', 'Power Supply'].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Deskripsi<textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi singkat produk" /></label>
      <div className="form-grid"><label>Harga (rupiah)<input type="number" min="0" step="1" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="1899000" /></label><label>Stok<input type="number" min="0" step="1" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="10" /></label></div>
      <label>URL gambar <span className="optional">opsional</span><input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></label>
      <div className="admin-form-actions"><button className="button button-dark" disabled={saving}>{saving ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Tambah produk'} <span>↗</span></button>{editingId && <button type="button" className="button button-outline" onClick={resetForm}>Batal</button>}</div>
    </form><section className="admin-list"><div className="admin-list-heading"><div><p className="eyebrow">KATALOG AKTIF</p><h2>Semua produk <span>({products.length})</span></h2></div><button className="refresh-button" onClick={loadProducts}>↻ Segarkan</button></div>
      {loading ? <Loading /> : <div className="admin-products">{products.map((product) => <article className="admin-product" key={product.id}><div className="admin-product-art"><ProductArtwork product={product} /></div><div className="admin-product-info"><strong>{product.name}</strong><span>{product.category} · {product.stock} stok</span><b>{rupiah(product.price)}</b></div><div className="admin-actions"><button onClick={() => startEdit(product)}>Edit</button><button className="delete-action" onClick={() => deleteProduct(product)}>Hapus</button></div></article>)}</div>}
    </section></div>
  </main>;
}

function Footer() { return <footer className="site-footer"><Link to="/" className="brand"><span className="brand-mark">D</span><span>digidaw<span className="brand-light">tech</span></span></Link><span>Komponen pilihan. Build your next chapter.</span><span>© 2026 DIGIDAW TECH</span></footer>; }

export default function App() {
  return <><Header /><Routes><Route path="/" element={<CatalogPage />} /><Route path="/products/:id" element={<ProductPage />} /><Route path="/checkout" element={<CheckoutPage />} /><Route path="/orders" element={<OrdersPage />} /><Route path="/orders/:id" element={<OrderDetailPage />} /><Route path="/admin" element={<AdminPage />} /><Route path="*" element={<main className="page-shell"><h1>Halaman tidak ditemukan.</h1><Link to="/">Kembali ke katalog</Link></main>} /></Routes><Footer /></>;
}
