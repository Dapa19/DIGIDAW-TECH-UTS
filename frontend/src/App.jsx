import { Fragment, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { apiRequest, rupiah } from './api.js';

function Header() {
  const [theme, setTheme] = useState(() => localStorage.getItem('digidaw_theme') === 'dark' ? 'dark' : 'light');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('digidaw_theme', theme);
  }, [theme]);
  return <header className="site-header">
    <div className="header-inner">
      <Link to="/" className="brand"><span className="brand-mark">D</span><span>digidaw<span className="brand-light">tech</span></span></Link>
      <nav className="main-nav" aria-label="Navigasi utama">
        <NavLink to="/" end>Katalog</NavLink><NavLink to="/checkout">Checkout</NavLink><NavLink to="/track">Cek pesanan</NavLink>
      </nav>
      <button className={`theme-toggle ${theme === 'dark' ? 'is-dark' : ''}`} type="button" role="switch" aria-checked={theme === 'dark'} onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} aria-label={`Mode ${theme === 'dark' ? 'gelap' : 'terang'}`} title={`Mode ${theme === 'dark' ? 'gelap' : 'terang'}`}><span className="theme-toggle-icon" aria-hidden="true">☀</span><span className="theme-toggle-track" aria-hidden="true"><span className="theme-toggle-thumb" /></span><span className="theme-toggle-icon" aria-hidden="true">☾</span></button>
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
      <div className="hero-visual"><img className="hero-image" src="/images/pngegg%20(3).png" alt="PC desktop dan perlengkapan gaming" /></div>
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
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '' });
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(''); const [success, setSuccess] = useState(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false); const [copyError, setCopyError] = useState('');
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
    if (!showCustomerModal) { setShowCustomerModal(true); return; }
    setSubmitting(true);
    try {
      const order = await apiRequest('/orders', { method: 'POST', body: JSON.stringify({ customer, items }) });
      setSuccess(order); setShowCustomerModal(false); setCopiedOrderId(false); setCopyError(''); setQuantities({}); setCustomer({ name: '', email: '', phone: '', address: '' });
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }
  async function copyOrderId() {
    const formattedId = `#${String(success.id).padStart(4, '0')}`;
    try { await navigator.clipboard.writeText(formattedId); setCopiedOrderId(true); setCopyError(''); }
    catch (_) { setCopiedOrderId(false); setCopyError('ID belum tersalin. Silakan salin ID secara manual.'); }
  }
  if (loading) return <main className="page-shell"><Loading /></main>;
  return <main className="page-shell narrow-shell"><div className="page-title"><p className="eyebrow">SELANGKAH LAGI</p><h1>Checkout<span className="blue-period">.</span></h1><p>Pilih komponen yang ingin dipesan. Data diri diisi saat Anda melanjutkan checkout.</p></div>
    <Notice>{error}</Notice>
    {success && <div className="success-modal-backdrop"><section className="success-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-success-title">
      <button className="modal-close" type="button" aria-label="Tutup" onClick={() => setSuccess(null)}>×</button><div className="success-check">✓</div>
      <p className="eyebrow">DIGIDAW TECH / CHECKOUT</p><h2 id="checkout-success-title">Checkout berhasil</h2>
      <p>Salin ID pesanan ini untuk mengecek status transaksi Anda di menu Cek pesanan.</p>
      <div className="copy-order-id"><strong>#{String(success.id).padStart(4, '0')}</strong><button className="button button-outline" type="button" onClick={copyOrderId}>{copiedOrderId ? 'Tersalin ✓' : 'Salin ID'}</button></div>
      {copyError && <span className="copy-error">{copyError}</span>}
      <Link to="/track" className="button button-dark modal-track-link">Cek status pesanan <span>↗</span></Link>
    </section></div>}
    <form onSubmit={submitOrder} className="checkout-layout"><div className="checkout-main">
      <section className="form-section"><div className="form-section-heading"><span className="step-number">01</span><div><h2>Pilih komponen</h2><p>Harga dan ketersediaan mengikuti data terbaru.</p></div></div>
        <div className="checkout-products">{products.map((product) => <div className={`checkout-product ${Number(quantities[product.id]) > 0 ? 'selected' : ''}`} key={product.id}>
          <label className="product-check"><input type="checkbox" checked={Number(quantities[product.id]) > 0} disabled={product.stock === 0} onChange={(event) => setQuantities({ ...quantities, [product.id]: event.target.checked ? 1 : 0 })} /><span className="custom-check" /></label>
          <div className="checkout-product-thumb"><ProductArtwork product={product} /></div>
          <div className="checkout-product-info"><strong>{product.name}</strong><span>{product.category} · {rupiah(product.price)}</span></div>
          <input className="quantity-input" type="number" min="1" max={product.stock} disabled={!Number(quantities[product.id]) || product.stock === 0} value={quantities[product.id] || ''} aria-label={`Kuantitas ${product.name}`} onChange={(event) => setQuantities({ ...quantities, [product.id]: event.target.value })} />
        </div>)}</div>
      </section>
    </div><aside className="order-summary"><p className="eyebrow">RINGKASAN</p><h2>Pesananmu</h2><div className="summary-lines">{selected.map((product) => <div className="summary-line" key={product.id}><span>{product.name} × {quantities[product.id]}</span><span>{rupiah(product.price * Number(quantities[product.id]))}</span></div>)}{!selected.length && <p className="muted">Belum ada produk dipilih.</p>}</div>
      <div className="summary-total"><span>Estimasi total</span><strong>{rupiah(estimate)}</strong></div><p className="summary-note">Total final dihitung ulang oleh server dari harga di database.</p><button type="submit" className="button button-dark summary-submit" disabled={submitting || !selected.length}>{submitting ? 'Menyimpan pesanan...' : 'Lanjut checkout'} <span>→</span></button>
    </aside></form>
    {showCustomerModal && <div className="success-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setShowCustomerModal(false); }}><section className="success-modal customer-modal" role="dialog" aria-modal="true" aria-labelledby="customer-modal-title"><button className="modal-close" type="button" aria-label="Tutup" disabled={submitting} onClick={() => setShowCustomerModal(false)}>×</button><p className="eyebrow">DATA PENGIRIMAN / LANGKAH 02</p><h2 id="customer-modal-title">Informasi pelanggan</h2><p>Lengkapi data berikut untuk menyelesaikan pesanan.</p><form onSubmit={submitOrder}><div className="form-grid customer-modal-fields"><label>Nama lengkap<input name="name" value={customer.name} onChange={updateCustomer} required autoFocus placeholder="Nama Anda" /></label><label>Email<input name="email" type="email" value={customer.email} onChange={updateCustomer} required placeholder="nama@email.com" /></label><label className="full-field">Nomor telepon<input name="phone" type="tel" value={customer.phone} onChange={updateCustomer} required placeholder="08xxxxxxxxxx" /></label><label className="full-field">Alamat lengkap<textarea name="address" rows="3" value={customer.address} onChange={updateCustomer} required placeholder="Jalan, nomor rumah, kelurahan, kecamatan, kota, dan kode pos" /></label></div><button type="submit" className="button button-dark modal-track-link" disabled={submitting}>{submitting ? 'Menyimpan pesanan...' : 'Konfirmasi pesanan'} <span>→</span></button></form></section></div>}
  </main>;
}

const orderStatusLabels = { pending: 'Menunggu', processing: 'Diproses', completed: 'Selesai', cancelled: 'Dibatalkan' };

function TrackOrdersPage() {
  const [identifier, setIdentifier] = useState(''); const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  async function searchOrders(event) {
    event.preventDefault(); setLoading(true); setError(''); setOrders([]); setSearched(true);
    try {
      const matches = await apiRequest('/orders/lookup', { method: 'POST', body: JSON.stringify({ identifier }) });
      setOrders(matches);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  return <main className="page-shell track-page"><div className="page-title"><p className="eyebrow">PEMBARUAN PESANAN</p><h1>Cek pesanan<span className="blue-period">.</span></h1><p>Masukkan ID pesanan, email, atau nomor telepon yang dipakai saat checkout.</p></div>
    <form className="track-search-form" onSubmit={searchOrders}><label htmlFor="order-identifier">ID pesanan / email / nomor telepon</label><div className="track-search-controls"><input id="order-identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required placeholder="Contoh: #0007 atau nama@email.com" /><button className="button button-dark" disabled={loading}>{loading ? 'Mencari...' : 'Cari pesanan'} <span>⌕</span></button></div><p>Riwayat hanya ditampilkan untuk data yang cocok dengan pencarian Anda.</p></form>
    <Notice>{error}</Notice>
    {loading && <Loading />}
    {!loading && searched && !error && orders.length === 0 && <div className="empty-state track-empty">Pesanan tidak ditemukan. Periksa kembali ID, email, atau nomor telepon Anda.</div>}
    {!loading && orders.length > 0 && <section className="tracking-results"><div className="tracking-results-heading"><p className="eyebrow">HASIL PENCARIAN</p><span>{orders.length} pesanan ditemukan</span></div>
      {orders.map((order) => <article className="tracking-card" key={order.id}><div className="tracking-card-top"><div><span className="eyebrow">ID PESANAN</span><strong>#{String(order.id).padStart(4, '0')}</strong></div><span className={`status-pill status-${order.status}`}>{orderStatusLabels[order.status] || order.status}</span></div>
        <div className="tracking-card-meta"><span>{new Date(`${order.created_at.replace(' ', 'T')}Z`).toLocaleString('id-ID')}</span><span>{order.item_count} produk</span></div><div className="tracking-card-total"><span>Total pesanan</span><strong>{rupiah(order.total)}</strong></div>
      </article>)}
    </section>}
  </main>;
}

const emptyProduct = { name: '', category: 'Processor', description: '', price: '', stock: '', image_url: '' };
function adminRequest(path, token, options = {}) {
  return apiRequest(path, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` }
  });
}

function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('digidaw_admin_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(() => Boolean(localStorage.getItem('digidaw_admin_token')));
  const [username, setUsername] = useState(''); const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false); const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get('tab') === 'orders' ? 'orders' : 'products');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [products, setProducts] = useState([]); const [form, setForm] = useState(emptyProduct); const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const [imageFile, setImageFile] = useState(null); const [uploadingImage, setUploadingImage] = useState(false);
  const [orders, setOrders] = useState([]); const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(''); const [orderSearch, setOrderSearch] = useState(''); const [orderStatus, setOrderStatus] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState(null); const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false); const [orderDetailError, setOrderDetailError] = useState('');
  const [statusDrafts, setStatusDrafts] = useState({}); const [statusSaving, setStatusSaving] = useState(false); const [statusSaveMessage, setStatusSaveMessage] = useState('');

  function handleAdminError(err) {
    if (err.status === 401) {
      localStorage.removeItem('digidaw_admin_token'); setToken(''); setIsAuthenticated(false);
      setProducts([]); setOrders([]); setError('');
      setLoginError('Sesi admin berakhir. Silakan masuk kembali.');
      return;
    }
    setError(err.message);
  }

  async function loadProducts() {
    setLoading(true);
    try { setProducts(await apiRequest('/products')); setError(''); }
    catch (err) { handleAdminError(err); }
    finally { setLoading(false); }
  }

  async function loadOrders() {
    setOrdersLoading(true); setOrdersError(''); setSelectedOrderId(null); setSelectedOrder(null);
    try { setOrders(await adminRequest('/orders', token)); }
    catch (err) {
      if (err.status === 401) handleAdminError(err);
      else setOrdersError(err.message);
    } finally { setOrdersLoading(false); }
  }

  useEffect(() => {
    if (!token) { setCheckingSession(false); setIsAuthenticated(false); return undefined; }
    let active = true;
    setCheckingSession(true);
    adminRequest('/admin/session', token).then(() => {
      if (!active) return;
      setIsAuthenticated(true); setCheckingSession(false); loadProducts();
    }).catch((err) => {
      if (!active) return;
      localStorage.removeItem('digidaw_admin_token'); setToken(''); setIsAuthenticated(false); setCheckingSession(false);
      setLoginError(err.status === 401 ? 'Sesi admin berakhir. Silakan masuk kembali.' : err.message);
    });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && tab === 'orders') loadOrders();
  }, [isAuthenticated, tab]);

  async function signIn(event) {
    event.preventDefault(); setLoginLoading(true); setLoginError('');
    try {
      const session = await apiRequest('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      localStorage.setItem('digidaw_admin_token', session.token); setToken(session.token); setPassword('');
    } catch (err) { setLoginError(err.message); }
    finally { setLoginLoading(false); }
  }

  async function signOut() {
    try { await adminRequest('/admin/logout', token, { method: 'POST' }); } catch (_) { /* sesi tetap dihapus dari browser */ }
    localStorage.removeItem('digidaw_admin_token'); setToken(''); setIsAuthenticated(false);
    setProducts([]); setOrders([]); setSuccess(''); setError(''); setLoginError(''); resetForm();
  }

  function startEdit(product) { setEditingId(product.id); setForm({ ...product, price: String(product.price), stock: String(product.stock) }); setImageFile(null); setSuccess(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function resetForm() { setForm(emptyProduct); setEditingId(null); setImageFile(null); }

  async function saveProduct(event) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('');
    const body = { ...form, name: form.name.trim(), description: form.description.trim(), price: Number(form.price), stock: Number(form.stock) };
    try {
      if (imageFile) {
        setUploadingImage(true);
        const upload = new FormData(); upload.append('image', imageFile);
        const uploaded = await adminRequest('/admin/uploads', token, { method: 'POST', body: upload });
        body.image_url = uploaded.image_url;
      }
      await adminRequest(editingId ? `/products/${editingId}` : '/products', token, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(body) });
      setSuccess(editingId ? 'Produk berhasil diperbarui.' : 'Produk baru berhasil ditambahkan.'); resetForm(); await loadProducts();
    } catch (err) { handleAdminError(err); }
    finally { setSaving(false); setUploadingImage(false); }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Hapus produk “${product.name}”?`)) return;
    setError(''); setSuccess('');
    try { await adminRequest(`/products/${product.id}`, token, { method: 'DELETE' }); setSuccess('Produk berhasil dihapus.'); await loadProducts(); }
    catch (err) { handleAdminError(err); }
  }

  async function showOrder(orderId) {
    if (selectedOrderId === orderId) { setSelectedOrderId(null); setSelectedOrder(null); return; }
    setSelectedOrderId(orderId); setSelectedOrder(null); setOrderDetailError(''); setStatusSaveMessage(''); setOrderDetailLoading(true);
    try {
      const order = await adminRequest(`/orders/${orderId}`, token);
      setSelectedOrder(order); setStatusDrafts((current) => ({ ...current, [orderId]: order.status }));
    }
    catch (err) {
      if (err.status === 401) handleAdminError(err);
      else setOrderDetailError(err.message);
    } finally { setOrderDetailLoading(false); }
  }

  async function saveOrderStatus(orderId) {
    const status = statusDrafts[orderId] || selectedOrder?.status;
    if (!status || !selectedOrder) return;
    setStatusSaving(true); setStatusSaveMessage('');
    try {
      const result = await adminRequest(`/orders/${orderId}/status`, token, { method: 'PATCH', body: JSON.stringify({ status }) });
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status: result.status } : order));
      setSelectedOrder((current) => current ? { ...current, status: result.status } : current);
      setStatusSaveMessage('Status transaksi berhasil diperbarui.');
    } catch (err) {
      if (err.status === 401) handleAdminError(err);
      else setStatusSaveMessage(err.message);
    } finally { setStatusSaving(false); }
  }

  const searchTerm = orderSearch.trim().toLowerCase();
  const visibleOrders = orders.filter((order) => {
    const matchesStatus = orderStatus === 'all' || order.status === orderStatus;
    const matchesSearch = !searchTerm || [order.id, `#${String(order.id).padStart(4, '0')}`, order.customer_name, order.email, order.phone]
      .some((value) => String(value).toLowerCase().includes(searchTerm));
    return matchesStatus && matchesSearch;
  });

  if (checkingSession) return <main className="admin-standalone"><Loading /></main>;
  if (!isAuthenticated) return <main className="admin-standalone admin-login-shell">
    <section className="admin-login-card"><Link to="/admin" className="brand admin-login-brand"><span className="brand-mark">D</span><span>digidaw<span className="brand-light">tech</span></span></Link><p className="eyebrow">DIGIDAW TECH / ADMIN</p><h1>Selamat datang<span className="blue-period">.</span></h1>
      <p className="login-description">Masuk untuk mengelola katalog dan melihat riwayat transaksi.</p>
      <Notice>{loginError}</Notice>
      <form className="login-form" onSubmit={signIn}><label>Username<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required placeholder="Masukkan username" /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="Masukkan password" /></label>
        <button className="button button-dark" disabled={loginLoading}>{loginLoading ? 'Memeriksa...' : 'Masuk ke admin'} <span>↗</span></button>
      </form>
    </section>
  </main>;

  return <div className={`admin-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className="admin-sidebar" aria-label="Navigasi admin">
      <div className="admin-sidebar-top">
        <Link to="/admin" className="brand admin-sidebar-brand" aria-label="Digidaw Tech Admin"><span className="brand-mark">D</span><span className="admin-brand-name">digidaw<span className="brand-light">tech</span></span></Link>
        <button className="sidebar-toggle" type="button" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'} aria-expanded={!sidebarCollapsed} title={sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}><span aria-hidden="true">{sidebarCollapsed ? '›' : '‹'}</span></button>
      </div>
      <nav className="admin-sidebar-nav" role="tablist" aria-label="Bagian admin">
        <button type="button" role="tab" aria-selected={tab === 'products'} className={`admin-sidebar-link ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')} title="Kelola produk"><span className="admin-sidebar-icon" aria-hidden="true">▦</span><span className="admin-sidebar-label">Kelola produk</span></button>
        <button type="button" role="tab" aria-selected={tab === 'orders'} className={`admin-sidebar-link ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')} title="Riwayat transaksi"><span className="admin-sidebar-icon" aria-hidden="true">◷</span><span className="admin-sidebar-label">Riwayat transaksi</span><span className="admin-sidebar-count">{orders.length}</span></button>
      </nav>
      <div className="admin-sidebar-bottom"><button type="button" className="admin-sidebar-link admin-logout" onClick={() => setShowLogoutConfirm(true)} title="Keluar"><span className="admin-sidebar-icon" aria-hidden="true">↪</span><span className="admin-sidebar-label">Keluar</span></button></div>
    </aside>
    {showLogoutConfirm && <div className="success-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowLogoutConfirm(false); }}><section className="success-modal logout-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title"><button className="modal-close" type="button" aria-label="Tutup" onClick={() => setShowLogoutConfirm(false)}>×</button><p className="eyebrow">DIGIDAW TECH / ADMIN</p><h2 id="logout-confirm-title">Keluar dari admin?</h2><p>Sesi admin Anda akan diakhiri. Anda perlu masuk kembali untuk mengelola toko.</p><div className="logout-confirm-actions"><button type="button" className="button button-outline" onClick={() => setShowLogoutConfirm(false)}>Batal</button><button type="button" className="button button-dark" onClick={signOut}>Ya, keluar</button></div></section></div>}
    <main className="admin-main"><div className="admin-main-inner"><div className="page-title admin-page-title"><div><p className="eyebrow">PANEL PENGELOLAAN</p><h1>Admin<span className="blue-period">.</span></h1><p>Kelola katalog produk dan riwayat transaksi.</p></div></div>
    <Notice>{error}</Notice><Notice type="success">{success}</Notice>
    {tab === 'products' ? <div className="admin-layout"><form className="admin-form" onSubmit={saveProduct}><div className="admin-form-heading"><span className="step-number">{editingId ? '✎' : '+'}</span><div><h2>{editingId ? 'Edit produk' : 'Produk baru'}</h2><p>{editingId ? 'Perbarui informasi produk.' : 'Tambahkan produk ke katalog.'}</p></div></div>
      <label>Nama produk<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: AMD Ryzen 5 5600" /></label>
      <label>Kategori<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{['Processor', 'Motherboard', 'RAM', 'VGA', 'SSD', 'Power Supply'].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Deskripsi<textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi singkat produk" /></label>
      <div className="form-grid"><label>Harga (rupiah)<input type="number" min="0" step="1" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="1899000" /></label><label>Stok<input type="number" min="0" step="1" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="10" /></label></div>
      <label>URL gambar <span className="optional">atau unggah file</span><input type="url" value={form.image_url} onChange={(e) => { setForm({ ...form, image_url: e.target.value }); setImageFile(null); }} placeholder="https://..." /></label>
      <label className="image-upload-field">File gambar <span className="optional">JPG, PNG, WEBP, GIF · maks. 5 MB</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0] || null; if (file && file.size > 5 * 1024 * 1024) { setImageFile(null); setError('Ukuran gambar maksimal 5 MB.'); event.target.value = ''; return; } setError(''); setImageFile(file); }} />{imageFile && <span className="image-upload-name">Dipilih: {imageFile.name}</span>}{form.image_url && !imageFile && <img className="image-upload-preview" src={form.image_url} alt="Pratinjau gambar produk" />}</label>
      <div className="admin-form-actions"><button className="button button-dark" disabled={saving}>{uploadingImage ? 'Mengunggah gambar...' : saving ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Tambah produk'} <span>↗</span></button>{editingId && <button type="button" className="button button-outline" onClick={resetForm}>Batal</button>}</div>
    </form><section className="admin-list"><div className="admin-list-heading"><div><p className="eyebrow">KATALOG AKTIF</p><h2>Semua produk <span>({products.length})</span></h2></div><button className="refresh-button" onClick={loadProducts}>↻ Segarkan</button></div>
      {loading ? <Loading /> : <div className="admin-products">{products.map((product) => <article className="admin-product" key={product.id}><div className="admin-product-art"><ProductArtwork product={product} /></div><div className="admin-product-info"><strong>{product.name}</strong><span>{product.category} · {product.stock} stok</span><b>{rupiah(product.price)}</b></div><div className="admin-actions"><button onClick={() => startEdit(product)}>Edit</button><button className="delete-action" onClick={() => deleteProduct(product)}>Hapus</button></div></article>)}</div>}
    </section></div> : <section className="admin-history"><div className="history-heading"><div><p className="eyebrow">SEMUA PESANAN</p><h2>Riwayat transaksi<span className="blue-period">.</span></h2><p>Cari berdasarkan nomor pesanan atau data pelanggan, lalu filter status.</p></div><button className="refresh-button" onClick={loadOrders}>↻ Segarkan</button></div>
      <div className="history-controls"><label className="search-box"><span>⌕</span><input value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="Cari nomor, nama, email, atau telepon" /></label>
        <label className="status-filter">Status<select value={orderStatus} onChange={(event) => setOrderStatus(event.target.value)}><option value="all">Semua status</option><option value="pending">Pending</option><option value="processing">Diproses</option><option value="completed">Selesai</option><option value="cancelled">Dibatalkan</option></select></label>
        <span className="history-count">{visibleOrders.length} dari {orders.length} transaksi</span></div>
      <Notice>{ordersError}</Notice>
      {ordersLoading ? <Loading /> : orders.length === 0 ? <div className="empty-state large-empty"><span className="empty-icon">↗</span><h2>Belum ada transaksi</h2><p>Pesanan dari checkout akan tercatat di sini.</p></div> : visibleOrders.length === 0 ? <div className="empty-state">Tidak ada transaksi yang cocok dengan pencarian atau filter.</div> :
        <div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>Nomor</th><th>Pelanggan</th><th>Tanggal</th><th>Item</th><th>Total</th><th>Status</th><th>Detail</th></tr></thead><tbody>{visibleOrders.map((order) => <Fragment key={order.id}><tr><td className="order-number">#{order.id.toString().padStart(4, '0')}</td><td><strong>{order.customer_name}</strong><span className="customer-subline">{order.email} · {order.phone}</span></td><td>{new Date(`${order.created_at.replace(' ', 'T')}Z`).toLocaleString('id-ID')}</td><td>{order.item_count} produk</td><td className="table-total">{rupiah(order.total)}</td><td><span className={`status-pill status-${order.status}`}>{orderStatusLabels[order.status] || order.status}</span></td><td><button className="detail-toggle" onClick={() => showOrder(order.id)}>{selectedOrderId === order.id ? 'Tutup' : 'Lihat'}</button></td></tr>
          {selectedOrderId === order.id && <tr className="order-expanded-row"><td colSpan="7">{orderDetailLoading ? <Loading /> : orderDetailError ? <Notice>{orderDetailError}</Notice> : selectedOrder && <div className="expanded-order"><div className="expanded-order-heading"><div><span className="eyebrow">DETAIL PESANAN #{selectedOrder.id.toString().padStart(4, '0')}</span><strong>{selectedOrder.customer_name}</strong><span>{selectedOrder.email} · {selectedOrder.phone}</span><span className="expanded-address">{selectedOrder.shipping_address}</span></div>
            <div className="status-control"><label htmlFor={`status-${selectedOrder.id}`}>Status transaksi</label><select id={`status-${selectedOrder.id}`} value={statusDrafts[selectedOrder.id] || selectedOrder.status} onChange={(event) => { setStatusDrafts((current) => ({ ...current, [selectedOrder.id]: event.target.value })); setStatusSaveMessage(''); }}><option value="pending">Menunggu</option><option value="processing">Diproses</option><option value="completed">Selesai</option><option value="cancelled">Dibatalkan</option></select><button className="button button-dark" type="button" disabled={statusSaving} onClick={() => saveOrderStatus(selectedOrder.id)}>{statusSaving ? 'Menyimpan...' : 'Simpan status'}</button></div></div>
            {statusSaveMessage && <div className={`status-save-message ${statusSaveMessage.includes('berhasil') ? 'success' : 'error'}`}>{statusSaveMessage}</div>}
            <div className="expanded-items">{selectedOrder.items.map((item) => <div className="expanded-item" key={item.product_id}><span>{item.product_name} <small>{rupiah(item.unit_price)} × {item.quantity}</small></span><strong>{rupiah(item.subtotal)}</strong></div>)}</div><div className="expanded-total"><span>Total pesanan</span><strong>{rupiah(selectedOrder.total)}</strong></div></div>}</td></tr>}</Fragment>)}</tbody></table></div>}
    </section>}
    </div></main>
  </div>;
}

function Footer() {
  return <footer className="site-footer">
    <div className="footer-brand-group"><Link to="/" className="brand"><span className="brand-mark">D</span><span>digidaw<span className="brand-light">tech</span></span></Link><p>Komponen pilihan. Build your next chapter.</p></div>
    <nav className="footer-page-links" aria-label="Halaman website"><span className="footer-links-title">HALAMAN</span><Link to="/">Katalog</Link><Link to="/checkout">Checkout</Link><Link to="/track">Cek pesanan</Link></nav>
    <span className="footer-copyright">© 2026 DIGIDAW TECH</span>
  </footer>;
}

function PublicLayout() { return <><Header /><Outlet /><Footer /></>; }

export default function App() {
  return <Routes>
    <Route path="/admin/*" element={<AdminPage />} />
    <Route element={<PublicLayout />}>
      <Route path="/" element={<CatalogPage />} />
      <Route path="/products/:id" element={<ProductPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/track" element={<TrackOrdersPage />} />
      <Route path="*" element={<main className="page-shell"><h1>Halaman tidak ditemukan.</h1><Link to="/">Kembali ke katalog</Link></main>} />
    </Route>
  </Routes>;
}
