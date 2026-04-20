// ============================================
// Agri Force — Main Application Logic
// ============================================

// --- CART SYSTEM ---
const Cart = {
  KEY: 'gh_cart',
  get() { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); },
  save(items) { localStorage.setItem(this.KEY, JSON.stringify(items)); this.updateBadge(); },
  add(product, qty = 1, weight = null) {
    const items = this.get();
    const key = `${product.id}_${weight || product.weight[0]}`;
    const existing = items.find(i => i.key === key);
    if (existing) { existing.qty += qty; }
    else { items.push({ key, id: product.id, name: product.name, price: product.price, image: product.image, weight: weight || product.weight[0], qty }); }
    this.save(items);
    showToast(`${product.name} added to cart! 🛒`);
  },
  remove(key) { this.save(this.get().filter(i => i.key !== key)); },
  updateQty(key, delta) {
    const items = this.get();
    const item = items.find(i => i.key === key);
    if (item) { item.qty = Math.max(1, item.qty + delta); this.save(items); }
  },
  clear() { this.save([]); },
  count() { return this.get().reduce((s, i) => s + i.qty, 0); },
  total() { return this.get().reduce((s, i) => s + i.price * i.qty, 0); },
  updateBadge() {
    document.querySelectorAll('.cart-badge').forEach(b => {
      const c = this.count(); b.textContent = c; b.classList.toggle('hidden', c === 0);
    });
  }
};

// --- AUTH SYSTEM ---
const Auth = {
  KEY: 'gh_user',
  getUser() { return JSON.parse(localStorage.getItem(this.KEY) || 'null'); },
  login(email, name) { localStorage.setItem(this.KEY, JSON.stringify({ email, name, ts: Date.now() })); },
  logout() { localStorage.removeItem(this.KEY); },
  isLoggedIn() { return !!this.getUser(); }
};

// --- TOAST ---
function showToast(msg, dur = 2500) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.innerHTML = msg; t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), dur);
}

// --- RENDER STORIES ---
function renderStories(container) {
  if (!container || typeof STORIES === 'undefined') return;
  container.innerHTML = STORIES.map(s => `
    <div class="story-item" data-category="${s.name.toLowerCase()}" onclick="filterByStory('${s.name.toLowerCase()}')">
      <div class="story-circle"><div class="story-circle-inner">${s.emoji}</div></div>
      <span class="story-name">${s.name}</span>
    </div>`).join('');
}

function filterByStory(name) {
  const map = { 'fresh today': 'Fresh Today', 'seasonal': 'Seasonal', 'organic': 'Organic', 'best sellers': 'Best Seller', 'fruits': 'fruits', 'vegetables': 'vegetables', 'grains': 'grains', 'dairy': 'dairy' };
  const catKeys = ['fruits','vegetables','grains','dairy'];
  if (catKeys.includes(name)) { filterProducts(name); }
  else {
    const badge = map[name];
    const filtered = PRODUCTS.filter(p => p.badge === badge);
    renderProducts(document.getElementById('productGrid'), filtered.length ? filtered : PRODUCTS);
  }
  document.querySelectorAll('.story-item').forEach(s => s.classList.toggle('active', s.dataset.category === name));
}

// --- RENDER CATEGORY PILLS ---
function renderCategories(container) {
  if (!container || typeof CATEGORIES === 'undefined') return;
  container.innerHTML = CATEGORIES.map(c => `
    <button class="cat-pill${c.key === 'all' ? ' active' : ''}" onclick="filterProducts('${c.key}')">${c.icon} ${c.label}</button>`).join('');
}

function filterProducts(cat) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.toggle('active', p.textContent.toLowerCase().includes(cat === 'all' ? 'all' : cat)));
  const filtered = cat === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === cat);
  renderProducts(grid, filtered);
}

// --- BADGE CLASS ---
function badgeClass(badge) {
  if (!badge) return '';
  const map = { 'Best Seller':'badge-best','Organic':'badge-organic','Seasonal':'badge-seasonal','Fresh Today':'badge-fresh','Premium':'badge-premium','Summer Special':'badge-summer','Farm Made':'badge-farm','Sold Out':'badge-soldout' };
  return map[badge] || 'badge-organic';
}

// --- RENDER PRODUCTS ---
function renderProducts(container, products) {
  if (!container) return;
  container.innerHTML = products.map(p => {
    const disc = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    return `
    <div class="product-card fade-in${!p.stock ? ' stock-out' : ''}" data-id="${p.id}">
      <div class="product-img-wrap">
        <img class="main-img" src="${p.image}" alt="${p.name}" loading="lazy">
        <img class="hover-img" src="${p.imageHover}" alt="${p.name} hover" loading="lazy">
        ${p.badge ? `<span class="product-badge ${badgeClass(p.badge)}">${p.badge}</span>` : ''}
        <button class="wishlist-btn" onclick="event.stopPropagation();this.classList.toggle('liked')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <div class="product-overlay">
          <span class="overlay-price">₹${p.price}</span>
          ${p.stock ? `<button class="overlay-cart-btn" onclick="event.stopPropagation();addToCart(${p.id})">+ Add</button>` : ''}
        </div>
      </div>
      <div class="product-info" onclick="goToProduct(${p.id})">
        <div class="product-name">${p.name}</div>
        <div class="product-meta">
          <span class="product-rating">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5-Math.floor(p.rating))}</span>
          <span class="product-reviews">(${p.reviews})</span>
        </div>
        <div class="product-pricing">
          <span class="current-price">₹${p.price}</span>
          ${p.oldPrice ? `<span class="old-price">₹${p.oldPrice}</span>` : ''}
          ${disc > 0 ? `<span class="discount-tag">${disc}% OFF</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
  observeFadeIn();
}

// --- INTERSECTION OBSERVER FOR FADE-IN ---
function observeFadeIn() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in:not(.visible)').forEach(el => obs.observe(el));
}

// --- ADD TO CART ---
function addToCart(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (p && p.stock) Cart.add(p);
}

// --- NAVIGATE TO PRODUCT ---
function goToProduct(id) { window.location.href = `product.html?id=${id}`; }

// --- RENDER CART PAGE ---
function renderCartPage() {
  const container = document.getElementById('cartItems');
  const summary = document.getElementById('cartSummary');
  if (!container) return;
  const items = Cart.get();
  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🛒</div><h3>Your cart is empty</h3><p>Explore our fresh farm products!</p><a href="index.html"><button class="btn-primary" style="max-width:200px;margin:0 auto">Shop Now</button></a></div>`;
    if (summary) summary.style.display = 'none';
    return;
  }
  container.innerHTML = items.map(i => `
    <div class="cart-item">
      <img src="${i.image}" alt="${i.name}" class="cart-item-img">
      <div class="cart-item-info">
        <div class="cart-item-name">${i.name}</div>
        <div style="font-size:.8rem;color:var(--text-light)">${i.weight}</div>
        <div class="cart-item-price">₹${i.price * i.qty}</div>
        <div class="cart-qty">
          <button onclick="Cart.updateQty('${i.key}',-1);renderCartPage()">−</button>
          <span>${i.qty}</span>
          <button onclick="Cart.updateQty('${i.key}',1);renderCartPage()">+</button>
          <span class="cart-remove" onclick="Cart.remove('${i.key}');renderCartPage()">Remove</span>
        </div>
      </div>
    </div>`).join('');
  if (summary) {
    const total = Cart.total(); const delivery = total > 500 ? 0 : 40;
    summary.innerHTML = `
      <div class="cart-summary-row"><span>Subtotal</span><span>₹${total}</span></div>
      <div class="cart-summary-row"><span>Delivery</span><span>${delivery === 0 ? 'FREE' : '₹' + delivery}</span></div>
      ${delivery === 0 ? '<div style="font-size:.75rem;color:var(--green);padding:4px 0">🎉 Free delivery on orders above ₹500!</div>' : ''}
      <div class="cart-summary-row total"><span>Total</span><span>₹${total + delivery}</span></div>
      <a href="checkout.html"><button class="checkout-btn">Proceed to Checkout →</button></a>`;
    summary.style.display = 'block';
  }
}

// --- RENDER PRODUCT DETAIL ---
function renderProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) { document.getElementById('productDetail').innerHTML = '<div class="empty-state"><div class="icon">🔍</div><h3>Product not found</h3><a href="index.html"><button class="btn-primary" style="max-width:200px;margin:0 auto">Back to Shop</button></a></div>'; return; }
  let qty = 1, selWeight = p.weight[0];
  const el = document.getElementById('productDetail');
  function render() {
    el.innerHTML = `
      <div class="product-gallery"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
      <div class="detail-info">
        ${p.badge ? `<span class="product-badge ${badgeClass(p.badge)}" style="position:static;display:inline-block;margin-bottom:12px">${p.badge}</span>` : ''}
        <h1 class="detail-name">${p.name}</h1>
        <div class="product-meta"><span class="product-rating" style="font-size:1rem">${'★'.repeat(Math.floor(p.rating))}</span><span class="product-reviews" style="font-size:.9rem">${p.rating} (${p.reviews} reviews)</span></div>
        <div class="detail-pricing">
          <span class="detail-current">₹${p.price}</span>
          ${p.oldPrice ? `<span class="detail-old">₹${p.oldPrice}</span><span class="discount-tag">${Math.round((1-p.price/p.oldPrice)*100)}% OFF</span>` : ''}
        </div>
        <p style="color:var(--text-light);margin-bottom:16px;line-height:1.7">${p.description}</p>
        <div style="font-weight:600;font-size:.85rem;margin-bottom:8px">Select Weight:</div>
        <div class="weight-options">${p.weight.map(w => `<button class="weight-opt${w===selWeight?' selected':''}" onclick="document.querySelectorAll('.weight-opt').forEach(x=>x.classList.remove('selected'));this.classList.add('selected')">${w}</button>`).join('')}</div>
        <div style="font-weight:600;font-size:.85rem;margin-bottom:8px">Quantity:</div>
        <div class="qty-selector">
          <button id="qtyMinus">−</button><span id="qtyVal">${qty}</span><button id="qtyPlus">+</button>
        </div>
        ${p.stock ? `<button class="add-to-cart-btn" id="addCartBtn">🛒 Add to Cart — ₹${p.price * qty}</button>` : `<button class="add-to-cart-btn" style="background:#6B7280;cursor:not-allowed">Sold Out</button>`}
      </div>`;
    if (p.stock) {
      document.getElementById('qtyPlus').onclick = () => { qty++; render(); };
      document.getElementById('qtyMinus').onclick = () => { if(qty>1)qty--; render(); };
      document.getElementById('addCartBtn').onclick = () => {
        const sw = document.querySelector('.weight-opt.selected');
        Cart.add(p, qty, sw ? sw.textContent : p.weight[0]);
      };
    }
  }
  render();
}

// --- CHECKOUT ---
function initCheckout() {
  const items = Cart.get();
  const total = Cart.total();
  const delivery = total > 500 ? 0 : 40;
  const orderSummary = document.getElementById('orderSummary');
  if (orderSummary) {
    orderSummary.innerHTML = items.map(i => `<div class="cart-summary-row"><span>${i.name} × ${i.qty}</span><span>₹${i.price*i.qty}</span></div>`).join('') +
      `<div class="cart-summary-row"><span>Delivery</span><span>${delivery===0?'FREE':'₹'+delivery}</span></div>` +
      `<div class="cart-summary-row total"><span>Total</span><span>₹${total+delivery}</span></div>`;
  }
  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.onclick = () => { document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected')); opt.classList.add('selected'); };
  });
  const placeOrderBtn = document.getElementById('placeOrder');
  if (placeOrderBtn) {
    placeOrderBtn.onclick = (e) => {
      e.preventDefault();
      const name = document.getElementById('fullName')?.value;
      const phone = document.getElementById('phone')?.value;
      const address = document.getElementById('address')?.value;
      if (!name || !phone || !address) { showToast('Please fill all delivery details ⚠️'); return; }
      const orders = JSON.parse(localStorage.getItem('gh_orders')||'[]');
      orders.push({ id: 'ORD'+Date.now(), items: Cart.get(), total: total+delivery, customer:{name,phone,address}, status:'pending', date:new Date().toISOString() });
      localStorage.setItem('gh_orders', JSON.stringify(orders));
      Cart.clear();
      document.getElementById('successModal').classList.add('show');
    };
  }
}

// --- HERO SLIDER ---
function initHero() {
  const heroSection = document.getElementById('heroSection');
  if (!heroSection || typeof HERO_SLIDES === 'undefined') return;
  
  const slidesHtml = HERO_SLIDES.map((s, i) => `
    <div class="hero-slide ${i === 0 ? 'active' : ''}" style="background:${s.bg}">
      <div class="hero-content">
        <span class="hero-tag">🌱 Premium Quality Seeds</span>
        <h1 class="hero-title">${s.title}</h1>
        <p class="hero-sub">${s.subtitle}</p>
        <a href="${s.ctaLink}" class="hero-cta">${s.cta} →</a>
      </div>
      <div class="hero-emoji">${s.emoji}</div>
    </div>
  `).join('');
  
  const currentSlides = heroSection.querySelectorAll('.hero-slide');
  currentSlides.forEach(el => el.remove());
  heroSection.insertAdjacentHTML('afterbegin', slidesHtml);

  const dotsContainer = document.getElementById('heroDots');
  if (dotsContainer) {
    dotsContainer.innerHTML = HERO_SLIDES.map((_, i) => `<div class="hero-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></div>`).join('');
    dotsContainer.querySelectorAll('.hero-dot').forEach(dot => {
      dot.onclick = () => {
        clearInterval(heroTimer);
        currentSlide = parseInt(dot.dataset.idx);
        showSlide(currentSlide);
        startHeroTimer();
      };
    });
  }

  let currentSlide = 0;
  let heroTimer;
  const slides = heroSection.querySelectorAll('.hero-slide');
  const dots = dotsContainer ? dotsContainer.querySelectorAll('.hero-dot') : [];
  
  function showSlide(idx) {
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }
  
  function nextSlide() {
    currentSlide = (currentSlide + 1) % HERO_SLIDES.length;
    showSlide(currentSlide);
  }
  
  function startHeroTimer() { heroTimer = setInterval(nextSlide, 5000); }
  if (HERO_SLIDES.length > 1) startHeroTimer();
}

// --- TRUST BADGES ---
function renderTrustBadges() {
  const container = document.getElementById('trustBadges');
  if (!container || typeof TRUST_BADGES === 'undefined') return;
  container.innerHTML = TRUST_BADGES.map(b => `
    <div class="trust-badge fade-in">
      <div class="trust-icon">${b.icon}</div>
      <div class="trust-info">
        <h3>${b.title}</h3>
        <p>${b.desc}</p>
      </div>
    </div>
  `).join('');
}

// --- TESTIMONIALS ---
function renderTestimonials() {
  const container = document.getElementById('testimonialsGrid');
  if (!container || typeof TESTIMONIALS === 'undefined') return;
  container.innerHTML = TESTIMONIALS.slice(0, 3).map(t => `
    <div class="testimonial-card fade-in">
      <div class="testi-header">
        <div class="testi-avatar">${t.avatar}</div>
        <div class="testi-info">
          <h4>${t.name}</h4>
          <span class="testi-loc">${t.location}</span>
        </div>
        <div class="testi-rating" style="margin-left:auto">${'★'.repeat(t.rating)}</div>
      </div>
      <p class="testi-text">"${t.text}"</p>
    </div>
  `).join('');
}

// --- SEARCH ---
function initSearch() {
  const input = document.querySelector('.search-bar input');
  if (!input) return;
  input.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.category.includes(q));
    renderProducts(document.getElementById('productGrid'), filtered);
  });
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();
  renderStories(document.getElementById('storiesBar'));
  renderCategories(document.getElementById('categoryBar'));
  if (document.getElementById('productGrid')) renderProducts(document.getElementById('productGrid'), PRODUCTS);
  if (document.getElementById('cartItems')) renderCartPage();
  if (document.getElementById('productDetail')) renderProductDetail();
  if (document.getElementById('placeOrder')) initCheckout();
  
  initHero();
  renderTrustBadges();
  renderTestimonials();
  initSearch();
  
  observeFadeIn();
});
