const ADMIN_USERNAME = "09945827021";
const ADMIN_PASSWORD = "amir1389";

const STORAGE_KEYS = {
  products: "tahririno.products.v1",
  cart: "tahririno.cart.v1",
  orders: "tahririno.orders.v1",
  admin: "tahririno.admin.v1",
};

const gradients = [
  "linear-gradient(135deg, #ff4ecd, #8b5cf6)",
  "linear-gradient(135deg, #31f5c7, #7c3aed)",
  "linear-gradient(135deg, #ffd166, #ef476f)",
  "linear-gradient(135deg, #06d6a0, #118ab2)",
  "linear-gradient(135deg, #f97316, #ec4899)",
  "linear-gradient(135deg, #a7f3d0, #60a5fa)",
];

const emojis = ["✏️", "🖊️", "📒", "📚", "📐", "🖌️", "🎨", "🗂️", "✨", "🎁"];

const defaultProducts = [];


const giftIdeas = [
  { emoji: "🖊️", title: "ست کلاسیک مشکی", text: "خودکار ژله‌ای، دفتر ساده و جامدادی مینیمال برای دفتر کار" },
  { emoji: "🎨", title: "ست هنری رنگی", text: "مدادرنگی، مارکر و دفتر اسکچ برای آدم‌های خلاق" },
  { emoji: "📚", title: "ست دانشجویی هوشمند", text: "دفتر کلاسوری، هایلایتر و برگه چسبان برای جزوه‌های مرتب" },
  { emoji: "🎁", title: "ست هدیه پریمیوم", text: "روان‌نویس شیک، دفتر چرمی و کارت پیام اختصاصی" },
];

let products = loadFromStorage(STORAGE_KEYS.products, defaultProducts);
let cart = loadFromStorage(STORAGE_KEYS.cart, []);
let orders = loadFromStorage(STORAGE_KEYS.orders, []);
let isAdmin = localStorage.getItem(STORAGE_KEYS.admin) === "true";
let activeFilter = "همه";
let searchTerm = "";
let toastTimer;

const els = {
  body: document.body,
  productGrid: document.getElementById("productGrid"),
  filterChips: document.getElementById("filterChips"),
  searchInput: document.getElementById("searchInput"),
  loginTrigger: document.getElementById("loginTrigger"),
  loginTriggerText: document.getElementById("loginTriggerText"),
  loginModal: document.getElementById("loginModal"),
  loginForm: document.getElementById("loginForm"),
  loginMessage: document.getElementById("loginMessage"),
  logoutBtn: document.getElementById("logoutBtn"),
  cartTrigger: document.getElementById("cartTrigger"),
  cartDrawer: document.getElementById("cartDrawer"),
  closeCart: document.getElementById("closeCart"),
  drawerBackdrop: document.getElementById("drawerBackdrop"),
  cartCount: document.getElementById("cartCount"),
  cartItems: document.getElementById("cartItems"),
  cartTotal: document.getElementById("cartTotal"),
  checkoutBtn: document.getElementById("checkoutBtn"),
  toast: document.getElementById("toast"),
  surpriseBtn: document.getElementById("surpriseBtn"),
  giftIdeaBtn: document.getElementById("giftIdeaBtn"),
  giftPreview: document.getElementById("giftPreview"),
  productForm: document.getElementById("productForm"),
  productImagePreview: document.getElementById("productImagePreview"),
  metricProducts: document.getElementById("metricProducts"),
  metricStock: document.getElementById("metricStock"),
  metricOrders: document.getElementById("metricOrders"),
  metricRevenue: document.getElementById("metricRevenue"),
  adminLiveProducts: document.getElementById("adminLiveProducts"),
  ordersList: document.getElementById("ordersList"),
};

function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : structuredClone(fallback);
  } catch (error) {
    console.warn(`Storage reset for ${key}`, error);
    return structuredClone(fallback);
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function toFaNumber(value) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function formatMoney(value) {
  return `${toFaNumber(value)} تومان`;
}

function safe(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderProductMedia(product, options = {}) {
  const { lazy = true } = options;

  if (product.image) {
    return `<img src="${safe(product.image)}" alt="${safe(product.name)}" ${lazy ? 'loading="lazy"' : ""} />`;
  }

  return safe(product.emoji || "✏️");
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("عکس محصول خوانده نشد."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("فرمت عکس محصول معتبر نیست."));
    image.src = dataUrl;
  });
}

async function compressImageFile(file) {
  if (!file || !file.size) {
    throw new Error("لطفاً عکس محصول را انتخاب کن.");
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("فرمت عکس باید JPG، PNG یا WEBP باشد.");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("حجم عکس خیلی زیاد است؛ لطفاً عکس کمتر از ۸ مگابایت انتخاب کن.");
  }

  const originalDataUrl = await readFileAsDataURL(file);
  const image = await loadImage(originalDataUrl);
  const maxSide = 720;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.78);
}

function resetProductImagePreview() {
  if (!els.productImagePreview) return;

  els.productImagePreview.innerHTML = `
    <span>🖼️</span>
    <small>هنوز عکسی انتخاب نشده</small>
  `;
}

function previewProductImage(file) {
  if (!els.productImagePreview) return;

  if (!file) {
    resetProductImagePreview();
    return;
  }

  if (!file.type.startsWith("image/")) {
    resetProductImagePreview();
    showToast("لطفاً فقط فایل عکس انتخاب کن.");
    return;
  }

  const previewUrl = URL.createObjectURL(file);
  els.productImagePreview.innerHTML = `
    <img src="${safe(previewUrl)}" alt="پیش‌نمایش عکس محصول" />
    <small>${safe(file.name)}</small>
  `;
}

function persistProducts() {
  saveToStorage(STORAGE_KEYS.products, products);
}

function persistCart() {
  saveToStorage(STORAGE_KEYS.cart, cart);
}

function persistOrders() {
  saveToStorage(STORAGE_KEYS.orders, orders);
}

function getVisibleProducts() {
  return products.filter((product) => {
    const matchesFilter = activeFilter === "همه" || product.flavor === activeFilter;
    const normalized = `${product.name} ${product.flavor} ${product.desc}`.toLowerCase();
    const matchesSearch = normalized.includes(searchTerm.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  });
}

function renderFilters() {
  const flavors = ["همه", ...new Set(products.map((product) => product.flavor))];
  if (!flavors.includes(activeFilter)) activeFilter = "همه";
  els.filterChips.innerHTML = flavors
    .map(
      (flavor) => `
        <button class="chip ${flavor === activeFilter ? "active" : ""}" type="button" data-filter="${safe(flavor)}">
          ${safe(flavor)}
        </button>
      `,
    )
    .join("");
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();

  if (!products.length) {
    els.productGrid.innerHTML = `
      <div class="empty-state">
        <strong>فعلاً هیچ محصولی در فروشگاه نیست.</strong>
        <p>ادمین می‌تواند از پنل مدیریت محصول جدید اضافه کند.</p>
      </div>
    `;
    return;
  }

  if (!visibleProducts.length) {
    els.productGrid.innerHTML = `
      <div class="empty-state">
        <strong>هیچ محصولی پیدا نشد.</strong>
        <p>فیلتر یا متن جستجو را تغییر بده تا قفسه دوباره پر شود.</p>
      </div>
    `;
    return;
  }

  els.productGrid.innerHTML = visibleProducts
    .map(
      (product) => `
        <article class="product-card reveal visible" style="--product-gradient: ${safe(product.gradient)}; --glow: ${safe(product.glow || "#ff4ecd")}">
          <span class="product-badge">${safe(product.badge || "خاص")}</span>
          <div class="product-visual">${renderProductMedia(product)}</div>
          <div class="product-meta">
            <div class="product-topline">
              <span class="tag">${safe(product.flavor)}</span>
              <span class="rating">⭐ ${toFaNumber(product.rating || 4.5)}</span>
            </div>
            <h3>${safe(product.name)}</h3>
            <p>${safe(product.desc)}</p>
            <div class="product-bottom">
              <div class="product-price">
                <strong>${formatMoney(product.price)}</strong>
                ${product.oldPrice ? `<del>${formatMoney(product.oldPrice)}</del>` : ""}
                <span class="stock-pill">موجودی: ${toFaNumber(product.stock)}</span>
              </div>
              <div class="product-actions">
                <button class="add-btn" type="button" data-add="${safe(product.id)}" aria-label="افزودن ${safe(product.name)} به سبد">+</button>
                <button class="admin-delete-btn" type="button" data-delete="${safe(product.id)}" aria-label="حذف ${safe(product.name)}">×</button>
              </div>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function getCartDetails() {
  return cart
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.id);
      return product ? { ...item, product, lineTotal: product.price * item.qty } : null;
    })
    .filter(Boolean);
}

function updateCart() {
  const details = getCartDetails();
  const count = details.reduce((sum, item) => sum + item.qty, 0);
  const total = details.reduce((sum, item) => sum + item.lineTotal, 0);

  els.cartCount.textContent = toFaNumber(count);
  els.cartTotal.textContent = formatMoney(total);

  if (!details.length) {
    els.cartItems.innerHTML = `
      <div class="empty-state">
        <strong>سبد خرید خالی است.</strong>
        <p>یک محصول لوازم تحریر انتخاب کن تا سبد خریدت آماده شود.</p>
      </div>
    `;
    els.checkoutBtn.disabled = true;
    els.checkoutBtn.style.opacity = "0.55";
    return;
  }

  els.checkoutBtn.disabled = false;
  els.checkoutBtn.style.opacity = "1";
  els.cartItems.innerHTML = details
    .map(
      ({ product, qty, lineTotal }) => `
        <article class="cart-item">
          <span class="cart-item-emoji">${renderProductMedia(product, { lazy: false })}</span>
          <div>
            <h4>${safe(product.name)}</h4>
            <p>${formatMoney(lineTotal)}</p>
          </div>
          <div class="qty-controls" aria-label="تعداد ${safe(product.name)}">
            <button type="button" data-qty-minus="${safe(product.id)}">−</button>
            <strong>${toFaNumber(qty)}</strong>
            <button type="button" data-qty-plus="${safe(product.id)}">+</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function addToCart(productId) {
  const product = products.find((candidate) => candidate.id === productId);
  if (!product) return;

  const existing = cart.find((item) => item.id === productId);
  const currentQty = existing?.qty || 0;

  if (currentQty >= product.stock) {
    showToast("موجودی این محصول برای تعداد بیشتر کافی نیست.");
    return;
  }

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: productId, qty: 1 });
  }

  persistCart();
  updateCart();
  showToast(`${product.name} به سبد خرید اضافه شد.`);
}

function changeQty(productId, delta) {
  const item = cart.find((candidate) => candidate.id === productId);
  const product = products.find((candidate) => candidate.id === productId);
  if (!item || !product) return;

  const nextQty = item.qty + delta;
  if (nextQty > product.stock) {
    showToast("بیشتر از موجودی نمی‌شود اضافه کرد.");
    return;
  }

  if (nextQty <= 0) {
    cart = cart.filter((candidate) => candidate.id !== productId);
  } else {
    item.qty = nextQty;
  }

  persistCart();
  updateCart();
}

function deleteProduct(productId) {
  if (!isAdmin) return;
  const product = products.find((candidate) => candidate.id === productId);
  if (!product) return;

  const accepted = confirm(`محصول «${product.name}» حذف شود؟`);
  if (!accepted) return;

  products = products.filter((candidate) => candidate.id !== productId);
  cart = cart.filter((item) => item.id !== productId);
  persistProducts();
  persistCart();
  renderAll();
  showToast("محصول از فروشگاه حذف شد.");
}

function openCart() {
  els.cartDrawer.classList.add("open");
  els.drawerBackdrop.classList.add("open");
  els.cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  els.cartDrawer.classList.remove("open");
  els.drawerBackdrop.classList.remove("open");
  els.cartDrawer.setAttribute("aria-hidden", "true");
}

function openLoginModal() {
  els.loginModal.classList.add("open");
  els.loginModal.setAttribute("aria-hidden", "false");
  els.loginMessage.textContent = "";
  els.loginMessage.classList.remove("success");
  setTimeout(() => document.getElementById("username")?.focus(), 80);
}

function closeLoginModal() {
  els.loginModal.classList.remove("open");
  els.loginModal.setAttribute("aria-hidden", "true");
  els.loginForm.reset();
}

function setAdminMode(value) {
  isAdmin = value;
  localStorage.setItem(STORAGE_KEYS.admin, String(value));
  els.body.classList.toggle("admin-mode", value);
  els.loginTriggerText.textContent = value ? "پنل ادمین" : "ورود ادمین";
  els.loginTrigger.setAttribute("aria-label", value ? "رفتن به پنل ادمین" : "ورود ادمین");
  renderAll();
}

function renderAdminMetrics() {
  const productCount = products.length;
  const totalStock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  els.metricProducts.textContent = toFaNumber(productCount);
  els.metricStock.textContent = toFaNumber(totalStock);
  els.metricOrders.textContent = toFaNumber(orders.length);
  els.metricRevenue.textContent = formatMoney(revenue);
  els.adminLiveProducts.textContent = toFaNumber(productCount);

  if (!orders.length) {
    els.ordersList.innerHTML = `
      <div class="empty-state">
        هنوز سفارشی ثبت نشده. از سبد خرید یک سفارش نمایشی بساز.
      </div>
    `;
    return;
  }

  els.ordersList.innerHTML = orders
    .slice()
    .reverse()
    .map(
      (order) => `
        <article class="order-item">
          <strong>سفارش #${safe(order.id)}</strong>
          <span>${formatMoney(order.total)} · ${toFaNumber(order.items.length)} قلم</span>
          <small>${safe(order.createdAt)}</small>
        </article>
      `,
    )
    .join("");
}

function checkout() {
  const details = getCartDetails();
  if (!details.length) return;

  for (const item of details) {
    const product = products.find((candidate) => candidate.id === item.id);
    if (product) product.stock = Math.max(0, product.stock - item.qty);
  }

  const total = details.reduce((sum, item) => sum + item.lineTotal, 0);
  const order = {
    id: Math.random().toString(36).slice(2, 7).toUpperCase(),
    createdAt: new Date().toLocaleString("fa-IR"),
    total,
    items: details.map(({ product, qty, lineTotal }) => ({
      id: product.id,
      name: product.name,
      qty,
      lineTotal,
    })),
  };

  orders.push(order);
  cart = [];
  persistProducts();
  persistOrders();
  persistCart();
  renderAll();
  closeCart();
  showToast("سفارش نمایشی ثبت شد. در پنل ادمین قابل مشاهده است.");
}

async function addProductFromForm(form) {
  const formData = new FormData(form);
  const name = formData.get("name").toString().trim();
  const flavor = formData.get("flavor").toString();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const imageFile = formData.get("image");
  const desc = formData.get("desc").toString().trim();

  if (!name || !flavor || !price || Number.isNaN(stock) || !desc) {
    showToast("همه فیلدهای محصول را کامل کن.");
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "در حال ذخیره عکس...";
  }

  try {
    const image = await compressImageFile(imageFile);
    const randomIndex = Math.floor(Math.random() * gradients.length);

    const newProduct = {
      id: `p-${Date.now()}`,
      name,
      flavor,
      price,
      oldPrice: Math.round(price * 1.16),
      stock,
      rating: 4.8,
      badge: "ادمین‌ساز",
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      image,
      gradient: gradients[randomIndex],
      glow: ["#ff4ecd", "#31f5c7", "#ffd166", "#60a5fa"][randomIndex % 4],
      desc,
    };

    products.unshift(newProduct);

    try {
      persistProducts();
    } catch (error) {
      products = products.filter((product) => product.id !== newProduct.id);
      showToast("حجم عکس برای ذخیره زیاد است؛ لطفاً عکس کوچک‌تری انتخاب کن.");
      return;
    }

    form.reset();
    resetProductImagePreview();
    renderAll();
    showToast("محصول جدید همراه عکس به فروشگاه لوازم تحریر اضافه شد.");
  } catch (error) {
    showToast(error.message || "عکس محصول ذخیره نشد.");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "اضافه کن ✨";
    }
  }
}

function surpriseMe() {
  if (!products.length) {
    showToast("فعلاً محصولی برای پیشنهاد شانسی وجود ندارد.");
    return;
  }
  const candidates = getVisibleProducts().length ? getVisibleProducts() : products;
  const product = candidates[Math.floor(Math.random() * candidates.length)];
  addToCart(product.id);
  openCart();
}

function generateGiftIdea() {
  const idea = giftIdeas[Math.floor(Math.random() * giftIdeas.length)];
  els.giftPreview.classList.remove("pulse");
  els.giftPreview.innerHTML = `
    <span>${safe(idea.emoji)}</span>
    <strong>${safe(idea.title)}</strong>
    <small>${safe(idea.text)}</small>
  `;
  els.giftPreview.animate(
    [
      { transform: "scale(0.96) rotate(-1deg)", filter: "saturate(1.3)" },
      { transform: "scale(1.02) rotate(1deg)", filter: "saturate(1.8)" },
      { transform: "scale(1) rotate(0)", filter: "saturate(1)" },
    ],
    { duration: 620, easing: "cubic-bezier(.2,.8,.2,1)" },
  );
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2800);
}

function renderAll() {
  renderFilters();
  renderProducts();
  updateCart();
  renderAdminMetrics();
}

function setupRevealAnimation() {
  const revealItems = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 },
  );

  revealItems.forEach((item) => observer.observe(item));
}

function bindEvents() {
  els.filterChips.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeFilter = button.dataset.filter;
    renderFilters();
    renderProducts();
  });

  els.searchInput.addEventListener("input", (event) => {
    searchTerm = event.target.value;
    renderProducts();
  });

  els.productGrid.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add]");
    const deleteButton = event.target.closest("[data-delete]");

    if (addButton) addToCart(addButton.dataset.add);
    if (deleteButton) deleteProduct(deleteButton.dataset.delete);
  });

  els.cartItems.addEventListener("click", (event) => {
    const plus = event.target.closest("[data-qty-plus]");
    const minus = event.target.closest("[data-qty-minus]");

    if (plus) changeQty(plus.dataset.qtyPlus, 1);
    if (minus) changeQty(minus.dataset.qtyMinus, -1);
  });

  els.cartTrigger.addEventListener("click", openCart);
  els.closeCart.addEventListener("click", closeCart);
  els.drawerBackdrop.addEventListener("click", closeCart);
  els.checkoutBtn.addEventListener("click", checkout);
  els.surpriseBtn.addEventListener("click", surpriseMe);
  els.giftIdeaBtn.addEventListener("click", generateGiftIdea);

  els.loginTrigger.addEventListener("click", () => {
    if (isAdmin) {
      document.getElementById("adminPanel")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    openLoginModal();
  });

  els.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(els.loginForm);
    const username = formData.get("username").toString().trim();
    const password = formData.get("password").toString();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      els.loginMessage.textContent = "ورود موفق؛ حالت ادمین روشن شد.";
      els.loginMessage.classList.add("success");
      setAdminMode(true);
      setTimeout(() => {
        closeLoginModal();
        document.getElementById("adminPanel")?.scrollIntoView({ behavior: "smooth" });
      }, 520);
      showToast("به پنل ادمین تحریرینو خوش آمدی.");
    } else {
      els.loginMessage.textContent = "نام کاربری یا رمز عبور اشتباه است.";
      els.loginMessage.classList.remove("success");
    }
  });

  els.loginModal.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-modal]")) closeLoginModal();
  });

  els.logoutBtn.addEventListener("click", () => {
    setAdminMode(false);
    showToast("از حالت ادمین خارج شدی.");
  });

  els.productForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await addProductFromForm(els.productForm);
  });

  els.productForm.querySelector('input[name="image"]').addEventListener("change", (event) => {
    previewProductImage(event.target.files?.[0]);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCart();
      closeLoginModal();
    }
  });
}

function init() {
  bindEvents();
  setAdminMode(isAdmin);
  setupRevealAnimation();
}

init();
