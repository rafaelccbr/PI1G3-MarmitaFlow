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

// Restaurante conceito independente oficial: Marmita Flow
export const INITIAL_RESTAURANTS = [
  {
    id: 'rest-marmita-flow',
    slug: 'marmita-flow',
    name: 'Marmita Flow',
    tagline: 'Comida caseira no capricho, quentinha e sem rasuras',
    description: 'Especialista em marmitas completas, ingredientes frescos do dia e opções saudáveis balanceadas.',
    primaryColor: '#FF6B00',
    secondaryColor: '#10B981',
    logoUrl: '/assets/mascote_flow.jpg',
    bannerUrl: '/assets/feijoada_flow.jpg',
    pixKey: 'financeiro@marmitaflow.com.br',
    pixKeyType: 'E-mail',
    phone: '(11) 98765-4321',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    deliveryFee: 3.00,
    deliveryTime: '30-45 min',
    rating: '4.9 (184 avaliações)',
    isOpen: true,
    adminEmail: 'admin@marmitaflow.com',
    adminPass: '123456',
    ownerName: 'Rafael Miquelin'
  },
  {
    id: 'rest-cantina-nona',
    slug: 'cantina-da-nona',
    name: 'Cantina da Nona',
    tagline: 'O verdadeiro sabor da comida caseira da vó',
    description: 'Receitas tradicionais italianas e brasileiras, molho artesanal e carnes assadas na brasa.',
    primaryColor: '#DC2626',
    secondaryColor: '#16A34A',
    logoUrl: '/assets/marmita_custom.jpg',
    bannerUrl: '/assets/marmita_custom.jpg',
    pixKey: 'contato@cantinadanona.com.br',
    pixKeyType: 'E-mail',
    phone: '(11) 97711-2233',
    address: 'Rua dos Pinheiros, 450 - Pinheiros, São Paulo - SP',
    deliveryFee: 4.50,
    deliveryTime: '40-55 min',
    rating: '4.8 (92 avaliações)',
    isOpen: true,
    adminEmail: 'nona@cantina.com',
    adminPass: '123456',
    ownerName: 'Dona Carmela'
  }
];

// Pratos associados aos seus respectivos restaurantes independentes
export const INITIAL_PRODUCTS = [
  // --- Pratos do Marmita Flow ---
  {
    id: 'prod-mf-feijoada',
    restaurantId: 'rest-marmita-flow',
    name: 'Feijoada Flow Completa',
    category: 'Marmitas Tradicionais',
    price: 29.90,
    description: 'Feijoada completa com arroz soltinho, feijão preto encorpado, couve refogada no alho, farofa crocante de milho com bacon, fatias de laranja e torresmo pururuca.',
    image: '/assets/feijoada_flow.jpg',
    badge: 'Mais Vendido 🔥',
    isCustomizable: true,
    available: true,
    suggestedAlternativeId: 'prod-mf-frango'
  },
  {
    id: 'prod-mf-frango',
    restaurantId: 'rest-marmita-flow',
    name: 'Frango Grelhado com Legumes',
    category: 'Linha Fit & Equilíbrio',
    price: 27.90,
    description: 'Filé de peito de frango grelhado marinado com ervas finas, arroz integral com sementes, feijão preto, legumes salteados no azeite e saladinha fresca.',
    image: '/assets/frango_grelhado.jpg',
    badge: 'Fit Saudável 🥗',
    isCustomizable: true,
    available: true,
    suggestedAlternativeId: 'prod-mf-feijoada'
  },
  {
    id: 'prod-mf-salmao',
    restaurantId: 'rest-marmita-flow',
    name: 'Salmão Orange Gourmet',
    category: 'Marmitas Gourmet',
    price: 32.90,
    description: 'Filé de salmão grelhado regado com redução cítrica de laranja e ervas frescas, arroz com brócolis aromático e cenouras baby salteadas na manteiga de ervas.',
    image: '/assets/salmao_orange.jpg',
    badge: 'Chef Especial 🌟',
    isCustomizable: true,
    available: true,
    suggestedAlternativeId: 'prod-mf-frango'
  },
  {
    id: 'prod-mf-custom',
    restaurantId: 'rest-marmita-flow',
    name: 'Monte Sua Marmita Artesanal',
    category: 'Personalizável',
    price: 26.90,
    description: 'Crie sua refeição perfeita: escolha o tamanho, 1 proteína nobre, 1 base, 1 tipo de feijão, 2 acompanhamentos frescos e adicionais ao seu gosto.',
    image: '/assets/marmita_custom.jpg',
    badge: '100% Você 🎯',
    isCustomizable: true,
    available: true,
    suggestedAlternativeId: 'prod-mf-feijoada'
  },
  {
    id: 'prod-mf-suco-laranja',
    restaurantId: 'rest-marmita-flow',
    name: 'Suco de Laranja Natural 500ml',
    category: 'Bebidas',
    price: 8.00,
    description: '100% fruta espremida na hora com gelo e fatia de laranja, super refrescante e sem conservantes.',
    image: '/assets/suco_laranja.jpg',
    badge: 'Natural 🍊',
    isCustomizable: false,
    available: true
  },
  {
    id: 'prod-mf-refrigerante',
    restaurantId: 'rest-marmita-flow',
    name: 'Refrigerante em Lata 350ml',
    category: 'Bebidas',
    price: 6.00,
    description: 'Gelado na temperatura perfeita (Guaraná, Coca-Cola ou Soda).',
    image: '/assets/refrigerante.jpg',
    badge: 'Gelado 🧊',
    isCustomizable: false,
    available: true
  },
  {
    id: 'prod-mf-brownie',
    restaurantId: 'rest-marmita-flow',
    name: 'Brownie Artesanal com Nozes',
    category: 'Sobremesas',
    price: 9.50,
    description: 'Massa cremosa e molhadinha com pedaços de nozes crocantes e chocolate nobre.',
    image: '/assets/brownie.jpg',
    badge: 'Doce Paixão 🍫',
    isCustomizable: false,
    available: true
  },

  // --- Pratos da Cantina da Nona ---
  {
    id: 'prod-cn-lasanha',
    restaurantId: 'rest-cantina-nona',
    name: 'Lasanha Bolonhesa da Nona',
    category: 'Massas Caseiras',
    price: 31.90,
    description: 'Massa artesanal recheada com carne nobre cozida lentamente no molho de tomate rústico e queijo gratinado.',
    image: '/assets/marmita_custom.jpg',
    badge: 'Receita de Família 👵',
    isCustomizable: true,
    available: true
  },
  {
    id: 'prod-cn-frango',
    restaurantId: 'rest-cantina-nona',
    name: 'Polenta com Frango Caipira',
    category: 'Marmitas Tradicionais',
    price: 28.50,
    description: 'Polenta cremosa com queijo e galinha caipira desfiada ao molho com ervas frescas.',
    image: '/assets/frango_grelhado.jpg',
    badge: 'Clássico 🍲',
    isCustomizable: true,
    available: true
  }
];

export const CUSTOMIZATION_OPTIONS = {
  sizes: [
    { id: 'size-p', name: 'Tamanho P (400g - Individual Leve)', price: 0 },
    { id: 'size-m', name: 'Tamanho M (600g - Porção Padrão)', price: 4.00, default: true },
    { id: 'size-g', name: 'Tamanho G (800g - Super Reforçado)', price: 8.00 }
  ],
  proteins: [
    { id: 'prot-frango', name: 'Filé de Frango Grelhado Suculento', price: 0, default: true },
    { id: 'prot-feijoada', name: 'Carnes Nobres da Feijoada (Costelinha, Paio e Carne Seca)', price: 3.50 },
    { id: 'prot-picanha', name: 'Tiras de Picanha Grelhada na Manteiga', price: 7.00 },
    { id: 'prot-salmao', name: 'Filé de Salmão com Molho de Laranja', price: 8.00 },
    { id: 'prot-omelete', name: 'Omelete com Queijo e Tomate (Vegetariano)', price: 0 }
  ],
  bases: [
    { id: 'base-arroz-branco', name: 'Arroz Branco Soltinho e Temperado', price: 0, default: true },
    { id: 'base-arroz-integral', name: 'Arroz Integral com Chia e Linhaça', price: 0 },
    { id: 'base-arroz-brocolis', name: 'Arroz com Brócolis Fresco Picado', price: 2.00 },
    { id: 'base-sem-arroz', name: 'Sem Arroz (Aumentar Legumes)', price: 0 }
  ],
  beans: [
    { id: 'bean-preto', name: 'Feijão Preto Encorpado com Louro e Alho', price: 0, default: true },
    { id: 'bean-carioca', name: 'Feijão Carioca Clássico Cremoso', price: 0 },
    { id: 'bean-sem', name: 'Sem Feijão', price: 0 }
  ],
  sides: [
    { id: 'side-farofa', name: 'Farofa Crocante de Milho com Bacon' },
    { id: 'side-couve', name: 'Couve Manteiga Refogada no Azeite' },
    { id: 'side-legumes', name: 'Legumes Salteados (Brócolis, Cenoura, Abobrinha)' },
    { id: 'side-banana', name: 'Banana da Terra Grelhada Caramelizada' },
    { id: 'side-batata', name: 'Batata Rústica Assada com Alecrim' },
    { id: 'side-salada', name: 'Salada de Folhas com Tomatinho Sweet Grape' }
  ],
  addons: [
    { id: 'addon-ovo', name: 'Ovo Frito com Gema Mole Perfeita', price: 3.00 },
    { id: 'addon-torresmo', name: 'Porção Extra de Torresmo Pururuca Crocante', price: 5.50 },
    { id: 'addon-vinagrete', name: 'Pote de Vinagrete Fresco Artesanal', price: 3.50 },
    { id: 'addon-molho-pimenta', name: 'Molho de Pimenta da Casa (Leve)', price: 2.00 }
  ]
};

class MultiTenantStore {
  constructor() {
    this.listeners = [];
    this.loadState();
  }

  loadState() {
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

  notify() {
    this.listeners.forEach(listener => listener());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marmitaflow_multi_state_change'));
    }
  }

  // --- Helpers de Restaurantes ---
  getRestaurantBySlug(slug) {
    return this.restaurants.find(r => r.slug === slug) || this.restaurants[0];
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
    this.restaurants = this.restaurants.map(r => r.id === restaurantId ? { ...r, ...updates } : r);
    safeStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(this.restaurants));
    this.notify();
  }

  // --- Gestão de Pratos (CRUD do Dono) ---
  addProduct(productData) {
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
    this.products = this.products.map(p => p.id === productId ? { ...p, ...updates } : p);
    safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
    this.notify();
  }

  deleteProduct(productId) {
    this.products = this.products.filter(p => p.id !== productId);
    safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
    this.notify();
  }

  toggleStock(productId) {
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
  createOrder(orderData) {
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
    this.orders = this.orders.map(o => o.id === orderId ? { ...o, status } : o);
    safeStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
    this.notify();
  }

  toggleOrderChecklist(orderId, itemIdx) {
    this.orders = this.orders.map(o => {
      if (o.id === orderId) {
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
}

export const store = new MultiTenantStore();
