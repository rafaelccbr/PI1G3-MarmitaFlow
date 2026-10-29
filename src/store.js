// MarmitaFlow - Multi-Tenant State Store com Autenticação e Restaurantes Independentes

export const STORAGE_KEYS = {
  RESTAURANTS: 'marmitaflow_restaurants_v2',
  PRODUCTS: 'marmitaflow_products_v2',
  ORDERS: 'marmitaflow_orders_v2',
  CART: 'marmitaflow_cart_v2',
  AUTH: 'marmitaflow_auth_v2'
};

const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
      return null;
    } catch {
      return null;
    }
  },
  setItem: (key, val) => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, val);
    } catch {}
  },
  removeItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch {}
  }
};

import { INITIAL_RESTAURANTS, INITIAL_PRODUCTS, CUSTOMIZATION_OPTIONS } from './data/catalog.js';
import { apiRequest } from './api.js';
export { INITIAL_RESTAURANTS, INITIAL_PRODUCTS, CUSTOMIZATION_OPTIONS } from './data/catalog.js';

class MultiTenantStore {
  constructor() {
    this.listeners = [];
    this.remote = typeof window !== 'undefined';
    this.loadState();
  }

  loadState() {
    if (this.remote) {
      this.restaurants ??= [];
      this.products ??= [];
      this.orders ??= [];
      this.auth ??= { loggedIn: false, restaurantId: null };
      try { this.cart = JSON.parse(safeStorage.getItem(STORAGE_KEYS.CART) || '[]'); }
      catch { this.cart = []; }
      return;
    }
    try {
      const restJson = safeStorage.getItem(STORAGE_KEYS.RESTAURANTS);
      this.restaurants = restJson ? JSON.parse(restJson) : [...INITIAL_RESTAURANTS];

      const prodJson = safeStorage.getItem(STORAGE_KEYS.PRODUCTS);
      this.products = prodJson ? JSON.parse(prodJson) : [...INITIAL_PRODUCTS];

      const ordJson = safeStorage.getItem(STORAGE_KEYS.ORDERS);
      this.orders = ordJson ? JSON.parse(ordJson) : [];

      const cartJson = safeStorage.getItem(STORAGE_KEYS.CART);
      this.cart = cartJson ? JSON.parse(cartJson) : [];

      const authJson = safeStorage.getItem(STORAGE_KEYS.AUTH);
      this.auth = authJson ? JSON.parse(authJson) : { loggedIn: false, restaurantId: null };
    } catch (e) {
      console.error('Erro ao ler estado do storage', e);
      this.restaurants = [...INITIAL_RESTAURANTS];
      this.products = [...INITIAL_PRODUCTS];
      this.orders = [];
      this.cart = [];
      this.auth = { loggedIn: false, restaurantId: null };
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  async refresh() {
    if (!this.remote) return;
    if (this.refreshing) return this.refreshing;
    this.refreshing = (async () => {
      const data = await apiRequest('/state');
      const changed = JSON.stringify([this.restaurants, this.products, this.orders, this.auth]) !== JSON.stringify([data.restaurants, data.products, data.orders, data.auth]);
      Object.assign(this, data);
      this.repriceCart();
      if (changed) {
        this.notify();
        window.dispatchEvent(new Event('marmitaflow:sync'));
      }
    })();
    try { await this.refreshing; } finally { this.refreshing = null; }
  }

  async connect() {
    await this.refresh();
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible') this.refresh().catch(() => {});
    }, 8000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.refresh().catch(() => {});
    });
  }

  repriceCart() {
    let changed = false;
    this.cart = this.cart.map(item => {
      const product = this.products.find(p => p.id === item.productId && p.restaurantId === item.restaurantId);
      if (!product) return item;
      let cents = Math.round(product.price * 100);
      if (product.isCustomizable) {
        for (const [key, group] of [['size', 'sizes'], ['protein', 'proteins'], ['base', 'bases'], ['beans', 'beans']]) {
          const option = CUSTOMIZATION_OPTIONS[group].find(o => o.name === item[key]);
          if (!option) return item;
          cents += Math.round((option.price || 0) * 100);
        }
        for (const name of item.addons || []) {
          const option = CUSTOMIZATION_OPTIONS.addons.find(o => o.name === name);
          if (!option) return item;
          cents += Math.round(option.price * 100);
        }
      }
      if (item.unitPrice === cents / 100) return item;
      changed = true;
      return { ...item, unitPrice: cents / 100 };
    });
    if (changed) safeStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(this.cart));
  }

  async mutate(path, method, body) {
    // Wait for any poll to finish so an older response cannot overwrite this mutation.
    if (this.refreshing) await this.refreshing.catch(() => {});
    const result = await apiRequest(path, { method, body });
    await this.refresh();
    return result;
  }

  notify() {
    this.listeners.forEach(listener => listener());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marmitaflow_multi_state_change'));
    }
  }

  // --- Helpers de Restaurantes ---
  getRestaurantBySlug(slug) {
    return this.restaurants.find(r => r.slug === slug) || null;
  }

  getRestaurantById(id) {
    return this.restaurants.find(r => r.id === id) || null;
  }

  getProductsByRestaurant(restaurantId) {
    return this.products.filter(p => p.restaurantId === restaurantId);
  }

  getOrdersByRestaurant(restaurantId) {
    return this.orders.filter(o => o.restaurantId === restaurantId);
  }

  // --- Autenticação do Administrador ---
  loginAdmin(email, password) {
    if (this.remote) return this.mutate('/auth/login', 'POST', { email, password }).then(() => ({ success: true, restaurant: this.getLoggedRestaurant() }));
    const rest = this.restaurants.find(r => r.adminEmail.toLowerCase() === email.trim().toLowerCase() && r.adminPass === password.trim());
    if (rest) {
      this.auth = {
        loggedIn: true,
        restaurantId: rest.id,
        userEmail: rest.adminEmail,
        ownerName: rest.ownerName
      };
      safeStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(this.auth));
      this.notify();
      return { success: true, restaurant: rest };
    }
    return { success: false, message: 'E-mail ou senha incorretos' };
  }

  logoutAdmin() {
    if (this.remote) return this.mutate('/auth/logout', 'POST', {});
    this.auth = { loggedIn: false, restaurantId: null };
    safeStorage.removeItem(STORAGE_KEYS.AUTH);
    this.notify();
  }

  getLoggedRestaurant() {
    if (!this.auth.loggedIn || !this.auth.restaurantId) return null;
    return this.getRestaurantById(this.auth.restaurantId);
  }

  // --- Criar Novo Restaurante Independente ---
  createRestaurant(data) {
    if (this.remote) return this.mutate('/restaurants', 'POST', data).then(result => result.restaurant);
    const email = data.adminEmail.toLowerCase().trim();
    if (this.restaurants.some(restaurant => restaurant.adminEmail === email)) {
      throw new Error('Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.');
    }
    const slug = data.name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Math.floor(Math.random() * 1000);

    const newRestaurant = {
      id: 'rest-' + Date.now(),
      slug: slug,
      name: data.name,
      tagline: data.tagline || 'Cardápio digital conectado e sem rasuras',
      description: data.description || 'Comida caseira preparada com carinho e agilidade.',
      primaryColor: data.primaryColor || '#FF6B00',
      secondaryColor: data.secondaryColor || '#10B981',
      logoUrl: data.logoUrl || '/assets/mascote_flow.jpg',
      bannerUrl: data.bannerUrl || '/assets/feijoada_flow.jpg',
      pixKey: data.pixKey || 'pix@restaurante.com.br',
      pixKeyType: data.pixKeyType || 'Chave Aleatória',
      phone: data.phone || '(11) 99999-8888',
      address: data.address || 'São Paulo - SP',
      deliveryFee: Number.isFinite(Number(data.deliveryFee)) ? Math.max(0, Number(data.deliveryFee)) : 3.00,
      deliveryTime: data.deliveryTime || '30-45 min',
      rating: '5.0 (Novo)',
      isOpen: true,
      adminEmail: data.adminEmail.toLowerCase().trim(),
      adminPass: data.adminPass.trim(),
      ownerName: data.ownerName || 'Proprietário'
    };

    this.restaurants.push(newRestaurant);
    safeStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(this.restaurants));

    // Adiciona pratos iniciais de demonstração para o novo restaurante
    const initialDishes = [
      {
        id: 'prod-' + Date.now() + '-1',
        restaurantId: newRestaurant.id,
        name: 'Prato Especial do Chefe',
        category: 'Marmitas Tradicionais',
        price: 28.00,
        description: 'Deliciosa refeição com arroz, feijão caseiro, proteína do dia e acompanhamentos frescos.',
        image: '/assets/feijoada_flow.jpg',
        badge: 'Destaque da Casa ⭐',
        isCustomizable: true,
        available: true
      },
      {
        id: 'prod-' + Date.now() + '-2',
        restaurantId: newRestaurant.id,
        name: 'Suco Natural da Fruta 500ml',
        category: 'Bebidas',
        price: 7.50,
        description: 'Feito na hora, gelado e refrescante.',
        image: '/assets/suco_laranja.jpg',
        badge: 'Natural 🍊',
        isCustomizable: false,
        available: true
      }
    ];

    this.products.push(...initialDishes);
    safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));

    // Faz login automático no restaurante recém-criado
    this.loginAdmin(newRestaurant.adminEmail, newRestaurant.adminPass);
    this.notify();
    return newRestaurant;
  }

  // --- Atualizar Restaurante ---
  updateRestaurant(restaurantId, updates) {
    if (this.remote) return this.mutate(`/restaurants/${encodeURIComponent(restaurantId)}`, 'PATCH', updates);
    this.restaurants = this.restaurants.map(r => r.id === restaurantId ? { ...r, ...updates } : r);
    safeStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(this.restaurants));
    this.notify();
  }

  // --- Gestão de Pratos (CRUD do Dono) ---
  addProduct(productData) {
    if (this.remote) return this.mutate('/products', 'POST', productData).then(result => result.product);
    const newProd = {
      ...productData,
      id: 'prod-' + Date.now(),
      available: productData.available ?? true
    };
    this.products.push(newProd);
    safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
    this.notify();
    return newProd;
  }

  updateProduct(productId, updates) {
    if (this.remote) return this.mutate(`/products/${encodeURIComponent(productId)}`, 'PATCH', updates);
    this.products = this.products.map(p => p.id === productId ? { ...p, ...updates } : p);
    safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
    this.notify();
  }

  deleteProduct(productId) {
    if (this.remote) return this.mutate(`/products/${encodeURIComponent(productId)}`, 'DELETE');
    this.products = this.products.filter(p => p.id !== productId);
    safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
    this.notify();
  }

  toggleStock(productId) {
    if (this.remote) {
      const product = this.products.find(p => p.id === productId);
      if (!product) return Promise.reject(new Error('Prato não encontrado.'));
      return this.updateProduct(productId, { available: !product.available });
    }
    this.products = this.products.map(p => p.id === productId ? { ...p, available: !p.available } : p);
    safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
    this.notify();
  }

  // --- Carrinho do Cliente (Isolado por Restaurante) ---
  addToCart(item, restaurantId) {
    // Se o cliente tentar adicionar de outro restaurante, limpa o carrinho anterior
    if (this.cart.length > 0 && this.cart[0].restaurantId !== restaurantId) {
      this.cart = [];
    }
    const cartItem = {
      ...item,
      restaurantId,
      cartItemId: 'citem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
    };
    this.cart.push(cartItem);
    safeStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(this.cart));
    this.notify();
  }

  removeFromCart(cartItemId) {
    this.cart = this.cart.filter(c => c.cartItemId !== cartItemId);
    safeStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(this.cart));
    this.notify();
  }

  updateCartQty(cartItemId, delta) {
    this.cart = this.cart.map(c => {
      if (c.cartItemId === cartItemId) {
        const newQty = c.qty + delta;
        return newQty > 0 ? { ...c, qty: newQty } : null;
      }
      return c;
    }).filter(Boolean);
    safeStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(this.cart));
    this.notify();
  }

  clearCart() {
    this.cart = [];
    safeStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(this.cart));
    this.notify();
  }

  getCartTotal(restaurant) {
    const items = restaurant ? this.cart.filter(item => item.restaurantId === restaurant.id) : this.cart;
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
    const deliveryFee = items.length > 0 && restaurant ? restaurant.deliveryFee : 0;
    return {
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee
    };
  }

  // --- Pedidos & Cozinha KDS ---
  getAvailableAlternative(productId, restaurantId) {
    const product = this.products.find(p => p.id === productId && p.restaurantId === restaurantId);
    if (!product) return null;
    const candidates = this.products.filter(p => p.restaurantId === restaurantId && p.id !== productId && p.available);
    return candidates.find(p => p.id === product.suggestedAlternativeId)
      || candidates.find(p => p.category === product.category)
      || null;
  }

  validateOrderItems(restaurantId, items) {
    const restaurant = this.getRestaurantById(restaurantId);
    if (!restaurant?.isOpen) throw new Error('O restaurante está fechado no momento.');
    if (!Array.isArray(items) || items.length === 0) throw new Error('Sua sacola está vazia.');
    const unavailable = items.filter(item => !this.products.some(product =>
      product.id === item.productId && product.restaurantId === restaurantId && product.available
    ));
    if (unavailable.length) throw new Error('Há itens indisponíveis na sacola. Remova ou escolha uma alternativa para continuar.');
    if (items.some(item => item.restaurantId !== restaurantId || !Number.isInteger(item.qty) || item.qty < 1)) {
      throw new Error('Revise os itens e as quantidades da sacola.');
    }
  }

  isOrderChecklistComplete(order) {
    return !!order?.items?.length && order.items.every((_, index) => order.checklist?.[index] === true);
  }

  createOrder(orderData) {
    if (this.remote) return this.createRemoteOrder(orderData);
    this.validateOrderItems(orderData.restaurantId, orderData.items);
    const restOrders = this.getOrdersByRestaurant(orderData.restaurantId);
    const nextNum = 100 + restOrders.length + 1;

    const newOrder = {
      id: 'ord-' + Date.now(),
      orderNumber: nextNum,
      restaurantId: orderData.restaurantId,
      customerName: orderData.customerName || 'Cliente Anônimo',
      customerPhone: orderData.customerPhone || '',
      address: orderData.address || 'Retirada no Balcão',
      status: 'recebido', // 'recebido' -> 'preparo' -> 'pronto' -> 'entregue'
      createdAt: new Date().toISOString(),
      paymentMethod: orderData.paymentMethod || 'Pix',
      paymentStatus: 'Aprovado',
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      total: orderData.total,
      items: orderData.items,
      checklist: {}
    };

    this.orders.unshift(newOrder);
    safeStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
    this.clearCart();
    this.notify();
    return newOrder;
  }

  updateOrderStatus(orderId, status) {
    if (this.remote) return this.mutate(`/orders/${encodeURIComponent(orderId)}/status`, 'PATCH', { status });
    const order = this.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Pedido não encontrado.');
    const nextStatus = { recebido: 'preparo', preparo: 'pronto', pronto: 'entregue' };
    if (nextStatus[order.status] !== status) throw new Error('Avance o pedido uma etapa por vez.');
    if (status === 'entregue' && !this.isOrderChecklistComplete(order)) {
      throw new Error('Confira todos os itens antes de despachar o pedido.');
    }
    this.orders = this.orders.map(o => o.id === orderId ? { ...o, status } : o);
    safeStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
    this.notify();
  }

  toggleOrderChecklist(orderId, itemIdx) {
    if (this.remote) {
      const order = this.orders.find(o => o.id === orderId);
      return this.mutate(`/orders/${encodeURIComponent(orderId)}/checklist`, 'PATCH', { itemIdx, checked: !order?.checklist?.[itemIdx] });
    }
    this.orders = this.orders.map(o => {
      if (o.id === orderId) {
        if (o.status === 'entregue' || !Number.isInteger(itemIdx) || !o.items[itemIdx]) return o;
        const cur = o.checklist || {};
        return {
          ...o,
          checklist: { ...cur, [itemIdx]: !cur[itemIdx] }
        };
      }
      return o;
    });
    safeStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
    this.notify();
  }

  resetAllToDefaults() {
    if (this.remote) throw new Error('O banco compartilhado não pode ser apagado pelo navegador.');
    safeStorage.removeItem(STORAGE_KEYS.RESTAURANTS);
    safeStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    safeStorage.removeItem(STORAGE_KEYS.ORDERS);
    safeStorage.removeItem(STORAGE_KEYS.CART);
    safeStorage.removeItem(STORAGE_KEYS.AUTH);
    this.restaurants = [...INITIAL_RESTAURANTS];
    this.products = [...INITIAL_PRODUCTS];
    this.orders = [];
    this.cart = [];
    this.auth = { loggedIn: false, restaurantId: null };
    this.notify();
  }

  async createRemoteOrder(orderData) {
    const fingerprint = JSON.stringify(orderData);
    if (this.orderPending) throw new Error('Seu pedido já está sendo enviado. Aguarde.');
    let attempt;
    try { attempt = JSON.parse(safeStorage.getItem('marmitaflow_order_attempt') || 'null'); } catch {}
    if (!attempt || attempt.fingerprint !== fingerprint) attempt = { fingerprint, requestId: crypto.randomUUID() };
    safeStorage.setItem('marmitaflow_order_attempt', JSON.stringify(attempt));
    this.orderPending = true;
    try {
      const { order } = await apiRequest('/orders', { method: 'POST', body: { ...orderData, requestId: attempt.requestId } });
      this.orders = [order, ...this.orders.filter(o => o.id !== order.id)];
      this.clearCart();
      safeStorage.removeItem('marmitaflow_order_attempt');
      return order;
    } catch (error) {
      await this.refresh().catch(() => {});
      throw error;
    } finally { this.orderPending = false; }
  }
}

export const store = new MultiTenantStore();
