// MarmitaFlow - Cardápio Independente do Restaurante (Página Pública do Cliente)
import { store, CUSTOMIZATION_OPTIONS } from '../store.js';
import { sounds } from '../audio.js';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';

let activeCategory = 'Todos';
let searchQuery = '';
let selectedProductForCustomization = null;
let currentCustomization = null;
let isCartOpen = false;
let isCheckoutOpen = false;
let activeOrderTrackingId = null;
let viewFormat = 'desktop'; // 'desktop' ou 'mobile'
let discountPercent = 0;
let couponCode = '';
let orderType = 'delivery'; // 'delivery' ou 'pickup'

export function renderRestaurantMenu(container, navigateTo, slug = 'marmita-flow') {
  const restaurant = store.getRestaurantBySlug(slug);
  if (!restaurant) {
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 20px;">
        <h2>Restaurante não encontrado</h2>
        <button class="btn-primary" id="btn-back-platform" style="margin-top: 16px;">Voltar à Plataforma</button>
      </div>
    `;
    container.querySelector('#btn-back-platform')?.addEventListener('click', () => navigateTo('plataforma'));
    return;
  }

  // Aplica as cores do restaurante ativo na página
  document.documentElement.style.setProperty('--color-primary', restaurant.primaryColor || '#FF6B00');
  document.documentElement.style.setProperty('--color-secondary', restaurant.secondaryColor || '#10B981');

  // Carrega apenas os pratos deste restaurante
  const products = store.getProductsByRestaurant(restaurant.id);
  const cart = store.cart.filter(item => item.restaurantId === restaurant.id);
  const cartSummary = store.getCartTotal(restaurant);
  const effectiveDeliveryFee = orderType === 'pickup' ? 0 : restaurant.deliveryFee;
  const subtotalWithDiscount = cartSummary.subtotal * (1 - discountPercent / 100);
  const finalTotal = Math.max(0, subtotalWithDiscount + effectiveDeliveryFee);

  // Categorias do restaurante
  const categories = ['Todos', ...new Set(products.map(p => p.category))];

  // Filtro
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  container.innerHTML = `
    <div class="restaurant-site-wrapper ${viewFormat === 'mobile' ? 'format-mobile' : 'format-desktop'}">
      
      <!-- Barra Superior com Navegação e Formato -->
      <div class="site-format-bar">
        <div class="format-bar-info">
          <button class="btn-secondary" id="btn-back-to-platform" style="padding: 6px 14px; font-size: 0.82rem;">
            ← Ver Outros Restaurantes
          </button>
          <span>Cardápio Oficial de: <strong>${restaurant.name}</strong></span>
          ${restaurant.isOpen ? '<span class="status-badge-inline open">● Aberto Agora</span>' : '<span class="status-badge-inline closed">● Fechado</span>'}
        </div>
        
        <div class="format-bar-actions">
          <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">Visualização:</span>
          <div class="format-toggle-btns">
            <button class="format-btn ${viewFormat === 'desktop' ? 'active' : ''}" id="btn-format-desktop">
              💻 Site Completo
            </button>
            <button class="format-btn ${viewFormat === 'mobile' ? 'active' : ''}" id="btn-format-mobile">
              📱 Celular (App)
            </button>
          </div>
        </div>
      </div>

      <!-- Container do Cardápio do Restaurante -->
      <div class="site-cardapio-container ${viewFormat === 'mobile' ? 'mobile-mockup-frame' : ''}">
        
        ${viewFormat === 'mobile' ? `
          <div class="mockup-header-notch">
            <span>9:41</span>
            <div class="notch-pill"></div>
            <span>5G 🔋</span>
          </div>
        ` : ''}

        <!-- BANNER DE CAPA DO RESTAURANTE -->
        <header class="restaurant-hero-banner">
          <img src="${restaurant.bannerUrl || '/assets/feijoada_flow.jpg'}" alt="Capa ${restaurant.name}" class="restaurant-banner-image" />
          <div class="restaurant-banner-gradient"></div>

          <div class="restaurant-banner-content">
            <div class="restaurant-brand-row">
              <img src="${restaurant.logoUrl || '/assets/mascote_flow.jpg'}" alt="${restaurant.name}" class="restaurant-logo-circle" />
              <div class="restaurant-main-info">
                <div class="restaurant-title-line">
                  <h1>${restaurant.name}</h1>
                  <span class="restaurant-status-chip ${restaurant.isOpen ? 'open' : 'closed'}">
                    ${restaurant.isOpen ? 'Aberto para Pedidos' : 'Fechado no Momento'}
                  </span>
                </div>
                <p class="restaurant-bio">${restaurant.tagline}</p>
                <div class="restaurant-badges-strip">
                  <span class="badge-item">⭐ <strong>${restaurant.rating}</strong></span>
                  <span class="badge-item">⏱️ ${restaurant.deliveryTime}</span>
                  <span class="badge-item">🛵 Entrega: ${restaurant.deliveryFee === 0 ? 'Grátis' : 'R$ ' + restaurant.deliveryFee.toFixed(2).replace('.', ',')}</span>
                  <span class="badge-item">📍 ${restaurant.address}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- TOOLBAR DE BUSCA & SACOLA -->
        <div class="restaurant-toolbar-sticky">
          <div class="toolbar-inner">
            <div class="search-box-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                id="search-dishes-input" 
                placeholder="Buscar no cardápio de ${restaurant.name}..." 
                value="${searchQuery}"
              />
              ${searchQuery ? `<button class="btn-clear-search" id="btn-clear-search">&times;</button>` : ''}
            </div>

            <!-- Botão Ver Carrinho -->
            <button class="btn-cart-trigger" id="btn-top-cart">
              <span class="cart-icon">🛒</span>
              <span>Sacola</span>
              <span class="cart-pill-count">${cart.reduce((sum, item) => sum + item.qty, 0)}</span>
              ${cart.length > 0 ? `<span class="cart-pill-total">R$ ${finalTotal.toFixed(2).replace('.', ',')}</span>` : ''}
            </button>
          </div>

          <!-- Pílulas de Categorias -->
          <nav class="categories-nav-scroll">
            ${categories.map(cat => `
              <button class="cat-nav-btn ${activeCategory === cat ? 'active' : ''}" data-cat="${cat}">
                ${getCategoryEmoji(cat)} ${cat}
              </button>
            `).join('')}
          </nav>
        </div>

        <!-- PRATOS DO RESTAURANTE -->
        <main class="menu-content-area">
          <div class="menu-section-header">
            <div>
              <h2>${activeCategory === 'Todos' ? 'Cardápio Completo' : activeCategory}</h2>
              <p>Itens preparados na hora com os melhores ingredientes da cozinha.</p>
            </div>
            <span class="items-count-tag">${filteredProducts.length} itens</span>
          </div>

          ${filteredProducts.length === 0 ? `
            <div class="no-results-box">
              <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
              <h3>Nenhum prato encontrado para "${searchQuery}"</h3>
              <p>Tente buscar por outro termo ou navegue por outras categorias.</p>
              <button class="btn-primary" id="btn-reset-filters" style="margin-top: 14px;">Ver Todos os Itens</button>
            </div>
          ` : `
            <div class="dishes-grid">
              ${filteredProducts.map(prod => `
                <div class="dish-card ${!prod.available ? 'dish-out-of-stock' : ''}" data-id="${prod.id}">
                  <div class="dish-image-wrapper">
                    <img src="${prod.image || '/assets/feijoada_flow.jpg'}" alt="${prod.name}" loading="lazy" />
                    ${prod.badge ? `<span class="dish-badge-pill">${prod.badge}</span>` : ''}
                    ${!prod.available ? `<div class="dish-stock-overlay">Esgotado</div>` : ''}
                  </div>

                  <div class="dish-body">
                    <div class="dish-category-label">${prod.category}</div>
                    <h3 class="dish-name">${prod.name}</h3>
                    <p class="dish-desc">${prod.description}</p>

                    <div class="dish-card-footer">
                      <div class="dish-price-group">
                        <span class="dish-currency">R$</span>
                        <span class="dish-price-val">${prod.price.toFixed(2).replace('.', ',')}</span>
                      </div>

                      ${prod.available ? `
                        <button class="btn-add-dish" data-id="${prod.id}">
                          ${prod.isCustomizable ? 'Montar 🍱' : 'Adicionar +'}
                        </button>
                      ` : `
                        <button class="btn-dish-unavailable" data-id="${prod.id}">
                          Indisponível
                        </button>
                      `}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </main>

        <!-- RODAPÉ DO RESTAURANTE -->
        <footer class="restaurant-page-footer">
          <div class="footer-restaurant-details">
            <img src="${restaurant.logoUrl || '/assets/mascote_flow.jpg'}" alt="${restaurant.name}" class="footer-logo" />
            <div>
              <h3>${restaurant.name}</h3>
              <p>${restaurant.address} • WhatsApp: ${restaurant.phone}</p>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Horário: Seg a Sáb das 10h30 às 15h30 e das 18h30 às 22h30</p>
            </div>
          </div>
        </footer>

      </div>

      <!-- BOTÃO FLUTUANTE EM DISPOSITIVO MÓVEL -->
      ${cart.length > 0 && viewFormat === 'mobile' ? `
        <div class="mobile-floating-cart-pill" id="btn-mobile-open-cart">
          <div class="m-cart-left">
            <span class="m-cart-badge">${cart.reduce((s, i) => s + i.qty, 0)}</span>
            <span>Ver Sacola</span>
          </div>
          <span class="m-cart-price">R$ ${finalTotal.toFixed(2).replace('.', ',')}</span>
        </div>
      ` : ''}

    </div>

    <!-- MODAL 1: Personalização Guiada da Marmita -->
    ${selectedProductForCustomization ? renderCustomizationModalHtml(selectedProductForCustomization) : ''}

    <!-- MODAL 2: Sacola / Carrinho -->
    ${isCartOpen ? renderCartModalHtml(cart, cartSummary, finalTotal, effectiveDeliveryFee, restaurant) : ''}

    <!-- MODAL 3: Checkout Pix / Cartão -->
    ${isCheckoutOpen ? renderCheckoutModalHtml(finalTotal, restaurant) : ''}

    <!-- MODAL 4: Acompanhamento de Pedido em Tempo Real -->
    ${activeOrderTrackingId ? renderOrderTrackerModalHtml(activeOrderTrackingId, restaurant, navigateTo) : ''}
  `;

  attachMenuEvents(container, restaurant, slug, navigateTo);
}

function getCategoryEmoji(cat) {
  if (cat.includes('Tradicionais')) return '🍲';
  if (cat.includes('Fit')) return '🥗';
  if (cat.includes('Gourmet')) return '🥩';
  if (cat.includes('Personalizável')) return '🍱';
  if (cat.includes('Bebidas')) return '🥤';
  if (cat.includes('Sobremesas')) return '🍫';
  if (cat.includes('Massas')) return '🍝';
  return '🍽️';
}

function renderCustomizationModalHtml(product) {
  const custom = currentCustomization;

  return `
    <div class="modal-overlay" id="modal-customization-overlay">
      <div class="modal-content-card modal-lg">
        <div class="modal-header-bar">
          <div>
            <h3>Monte Sua Marmita: ${product.name}</h3>
            <span style="font-size: 0.82rem; color: var(--text-muted);">Escolha suas preferências para prepararmos no capricho</span>
          </div>
          <button class="modal-close-btn" id="btn-close-custom-modal">&times;</button>
        </div>

        <div class="modal-scroll-body">
          
          <!-- Tamanho -->
          <div class="cust-step-box">
            <div class="cust-step-header">
              <span class="cust-step-title">1. Escolha o Tamanho da Marmita</span>
              <span class="cust-step-required">Obrigatório</span>
            </div>
            <div class="cust-options-list">
              ${CUSTOMIZATION_OPTIONS.sizes.map(size => `
                <div class="cust-option-item ${custom.size.id === size.id ? 'selected' : ''}" data-type="size" data-id="${size.id}">
                  <span class="cust-option-label">
                    <input type="radio" name="size" ${custom.size.id === size.id ? 'checked' : ''} />
                    <strong>${size.name}</strong>
                  </span>
                  <span class="cust-option-price">${size.price > 0 ? '+ R$ ' + size.price.toFixed(2).replace('.', ',') : 'Incluso'}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Proteína -->
          <div class="cust-step-box">
            <div class="cust-step-header">
              <span class="cust-step-title">2. Escolha a Proteína Principal</span>
              <span class="cust-step-required">Obrigatório</span>
            </div>
            <div class="cust-options-list">
              ${CUSTOMIZATION_OPTIONS.proteins.map(prot => `
                <div class="cust-option-item ${custom.protein.id === prot.id ? 'selected' : ''}" data-type="protein" data-id="${prot.id}">
                  <span class="cust-option-label">
                    <input type="radio" name="protein" ${custom.protein.id === prot.id ? 'checked' : ''} />
                    <strong>${prot.name}</strong>
                  </span>
                  <span class="cust-option-price">${prot.price > 0 ? '+ R$ ' + prot.price.toFixed(2).replace('.', ',') : 'Incluso'}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Base -->
          <div class="cust-step-box">
            <div class="cust-step-header">
              <span class="cust-step-title">3. Escolha o Arroz / Base</span>
              <span class="cust-step-required">Obrigatório</span>
            </div>
            <div class="cust-options-list">
              ${CUSTOMIZATION_OPTIONS.bases.map(base => `
                <div class="cust-option-item ${custom.base.id === base.id ? 'selected' : ''}" data-type="base" data-id="${base.id}">
                  <span class="cust-option-label">
                    <input type="radio" name="base" ${custom.base.id === base.id ? 'checked' : ''} />
                    <strong>${base.name}</strong>
                  </span>
                  <span class="cust-option-price">${base.price > 0 ? '+ R$ ' + base.price.toFixed(2).replace('.', ',') : 'Incluso'}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Feijão -->
          <div class="cust-step-box">
            <div class="cust-step-header">
              <span class="cust-step-title">4. Tipo de Feijão</span>
              <span class="cust-step-required">Obrigatório</span>
            </div>
            <div class="cust-options-list">
              ${CUSTOMIZATION_OPTIONS.beans.map(bean => `
                <div class="cust-option-item ${custom.beans.id === bean.id ? 'selected' : ''}" data-type="beans" data-id="${bean.id}">
                  <span class="cust-option-label">
                    <input type="radio" name="beans" ${custom.beans.id === bean.id ? 'checked' : ''} />
                    <strong>${bean.name}</strong>
                  </span>
                  <span class="cust-option-price">Incluso</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Guarnições (até 2) -->
          <div class="cust-step-box">
            <div class="cust-step-header">
              <span class="cust-step-title">5. Acompanhamentos (Escolha até 2)</span>
              <span style="font-size: 0.78rem; font-weight: 700; color: var(--color-primary);">${custom.sides.length}/2 selecionados</span>
            </div>
            <div class="cust-options-list">
              ${CUSTOMIZATION_OPTIONS.sides.map(side => {
                const isSelected = custom.sides.some(s => s.id === side.id);
                return `
                  <div class="cust-option-item ${isSelected ? 'selected' : ''}" data-type="side" data-id="${side.id}">
                    <span class="cust-option-label">
                      <input type="checkbox" ${isSelected ? 'checked' : ''} />
                      ${side.name}
                    </span>
                    <span class="cust-option-price">Incluso</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Adicionais Extras -->
          <div class="cust-step-box">
            <div class="cust-step-header">
              <span class="cust-step-title">6. Adicionais Especiais</span>
              <span style="font-size: 0.72rem; color: var(--text-muted);">Opcional</span>
            </div>
            <div class="cust-options-list">
              ${CUSTOMIZATION_OPTIONS.addons.map(addon => {
                const isSelected = custom.addons.some(a => a.id === addon.id);
                return `
                  <div class="cust-option-item ${isSelected ? 'selected' : ''}" data-type="addon" data-id="${addon.id}">
                    <span class="cust-option-label">
                      <input type="checkbox" ${isSelected ? 'checked' : ''} />
                      ${addon.name}
                    </span>
                    <span class="cust-option-price">+ R$ ${addon.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Observações -->
          <div class="cust-step-box">
            <div class="cust-step-header">
              <span class="cust-step-title">7. Observações para a Cozinha</span>
            </div>
            <textarea 
              id="cust-notes-input" 
              class="form-textarea" 
              style="width: 100%; height: 75px; resize: none;" 
              placeholder="Ex: Marmita bem quente, sem cebola, salada fresca..."
            >${custom.notes || ''}</textarea>
          </div>

        </div>

        <div class="modal-footer-bar">
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">Subtotal da Marmita:</div>
            <div style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: var(--color-primary);">
              R$ ${calculateCurrentCustomizationPrice(product, custom).toFixed(2).replace('.', ',')}
            </div>
          </div>
          <button class="btn-primary" id="btn-confirm-add-cart" style="padding: 12px 24px;">
            <span>Adicionar ao Carrinho</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderCartModalHtml(cart, cartSummary, finalTotal, deliveryFee, restaurant) {
  return `
    <div class="modal-overlay" id="modal-cart-overlay">
      <div class="modal-content-card">
        <div class="modal-header-bar">
          <div>
            <h3>Sua Sacola</h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${restaurant.name}</span>
          </div>
          <button class="modal-close-btn" id="btn-close-cart-modal">&times;</button>
        </div>

        <div class="modal-scroll-body">
          <div class="order-type-selector">
            <button class="order-type-btn ${orderType === 'delivery' ? 'active' : ''}" id="btn-type-delivery">
              🛵 Entrega (${restaurant.deliveryFee === 0 ? 'Grátis' : 'R$ ' + restaurant.deliveryFee.toFixed(2).replace('.', ',')})
            </button>
            <button class="order-type-btn ${orderType === 'pickup' ? 'active' : ''}" id="btn-type-pickup">
              🏪 Retirar no Balcão (Grátis)
            </button>
          </div>

          ${cart.length === 0 ? `
            <div style="text-align: center; padding: 48px 16px; color: var(--text-muted);">
              <div style="font-size: 3.5rem; margin-bottom: 12px;">🧺</div>
              <h4 style="font-family: var(--font-heading); font-size: 1.15rem; color: var(--text-main); margin-bottom: 6px;">Sua sacola está vazia</h4>
              <p style="font-size: 0.88rem;">Escolha seus pratos favoritos no cardápio de ${restaurant.name}!</p>
            </div>
          ` : `
            <div class="cart-items-list">
              ${cart.map(item => `
                <div class="cart-item-card">
                  <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.productName}</h4>
                    ${item.size ? `<div class="cart-spec">📏 ${item.size}</div>` : ''}
                    ${item.protein ? `<div class="cart-spec">🥩 ${item.protein}</div>` : ''}
                    ${item.base ? `<div class="cart-spec">🍚 ${item.base}</div>` : ''}
                    ${item.sides && item.sides.length > 0 ? `<div class="cart-spec">🥗 ${item.sides.join(', ')}</div>` : ''}
                    ${item.addons && item.addons.length > 0 ? `<div class="cart-spec">✨ ${item.addons.join(', ')}</div>` : ''}
                    ${item.notes ? `<div class="cart-spec cart-note">📝 Obs: ${item.notes}</div>` : ''}
                    <div class="cart-item-price">
                      R$ ${(item.unitPrice * item.qty).toFixed(2).replace('.', ',')}
                    </div>
                  </div>

                  <div class="cart-qty-controls">
                    <button class="qty-btn" data-action="decrease" data-id="${item.cartItemId}">−</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn" data-action="increase" data-id="${item.cartItemId}">+</button>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Cupom -->
            <div class="coupon-box">
              <div style="font-size: 0.82rem; font-weight: 700; margin-bottom: 6px;">Cupom de Desconto:</div>
              <div style="display: flex; gap: 8px;">
                <input 
                  type="text" 
                  id="coupon-input" 
                  class="form-input" 
                  placeholder="Ex: MARMITA10" 
                  value="${couponCode}"
                  style="text-transform: uppercase;"
                />
                <button class="btn-secondary" id="btn-apply-coupon" style="padding: 8px 16px;">Aplicar</button>
              </div>
              ${discountPercent > 0 ? `
                <div style="color: var(--color-secondary); font-size: 0.8rem; font-weight: 700; margin-top: 6px;">
                  ✓ Cupom MARMITA10 aplicado: 10% OFF!
                </div>
              ` : `
                <div style="color: var(--text-muted); font-size: 0.72rem; margin-top: 4px;">
                  Dica: use <strong>MARMITA10</strong> para testar 10% de desconto.
                </div>
              `}
            </div>

            <!-- Resumo -->
            <div class="cart-summary-box">
              <div class="summary-line">
                <span>Subtotal</span>
                <span>R$ ${cartSummary.subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              ${discountPercent > 0 ? `
                <div class="summary-line discount">
                  <span>Desconto (10%)</span>
                  <span>- R$ ${(cartSummary.subtotal * (discountPercent / 100)).toFixed(2).replace('.', ',')}</span>
                </div>
              ` : ''}
              <div class="summary-line">
                <span>Taxa de Entrega</span>
                <span>${deliveryFee === 0 ? 'Grátis' : 'R$ ' + deliveryFee.toFixed(2).replace('.', ',')}</span>
              </div>
              <div class="summary-line total">
                <span>Total a Pagar</span>
                <span class="val-total">R$ ${finalTotal.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          `}
        </div>

        <div class="modal-footer-bar">
          <button class="btn-secondary" id="btn-clear-cart" ${cart.length === 0 ? 'disabled' : ''}>
            Limpar
          </button>
          <button class="btn-primary" id="btn-proceed-checkout" ${cart.length === 0 ? 'disabled' : ''}>
            Finalizar Pedido →
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderCheckoutModalHtml(finalTotal, restaurant) {
  return `
    <div class="modal-overlay" id="modal-checkout-overlay">
      <div class="modal-content-card">
        <div class="modal-header-bar">
          <div>
            <h3>Pagamento Seguro</h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Pedido enviado direto para a cozinha de ${restaurant.name}</span>
          </div>
          <button class="modal-close-btn" id="btn-close-checkout">&times;</button>
        </div>

        <div class="modal-scroll-body">
          <div style="margin-bottom: 24px;">
            <h4 style="font-family: var(--font-heading); font-size: 1rem; font-weight: 800; margin-bottom: 12px;">
              📍 Seus Dados para Entrega
            </h4>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <input type="text" id="cust-name-input" class="form-input" placeholder="Seu nome completo" value="Rafael Miquelin" required />
              <input type="text" id="cust-phone-input" class="form-input" placeholder="WhatsApp para confirmação" value="(11) 98765-4321" required />
              <input type="text" id="cust-address-input" class="form-input" placeholder="Endereço de entrega (Rua, Número, Apto)" value="Av. Paulista, 1000 - Apto 82" required />
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h4 style="font-family: var(--font-heading); font-size: 1rem; font-weight: 800; margin-bottom: 12px;">
              💳 Forma de Pagamento
            </h4>
            
            <div style="display: flex; gap: 10px; margin-bottom: 14px;">
              <button class="btn-secondary" id="btn-tab-pix" style="flex: 1; border-color: var(--color-secondary); background: var(--color-secondary-light); color: var(--color-secondary-hover); font-weight: 700;">
                ⚡ Pix Instantâneo
              </button>
              <button class="btn-secondary" id="btn-tab-card" style="flex: 1; font-weight: 700;">
                💳 Cartão
              </button>
            </div>

            <!-- Pix -->
            <div id="checkout-pix-box" class="pix-container-box">
              <div style="font-size: 0.88rem; font-weight: 700; color: var(--color-secondary-hover); margin-bottom: 4px;">
                Chave Pix de ${restaurant.name}: ${restaurant.pixKey}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 14px;">
                Escaneie o QR Code ou use a chave Copia e Cola
              </div>

              <canvas id="pix-qr-canvas" class="pix-qr-canvas"></canvas>

              <div class="pix-copy-box">
                <input 
                  type="text" 
                  id="pix-code-field" 
                  class="pix-code-input" 
                  readonly 
                  value="00020126580014BR.GOV.BCB.PIX0136${restaurant.pixKey}520400005303986540${finalTotal.toFixed(2)}5802BR5915${restaurant.name.toUpperCase().replace(/\s+/g, '')}6009SAOPAULO62070503***6304" 
                />
                <button class="btn-copy-pix" id="btn-copy-pix">Copiar Pix</button>
              </div>

              <button class="btn-primary" id="btn-simulate-pix-paid" style="width: 100%; background: var(--color-secondary); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35); padding: 12px;">
                ✓ Confirmar Pagamento Pix (R$ ${finalTotal.toFixed(2).replace('.', ',')})
              </button>
            </div>

            <!-- Cartão -->
            <div id="checkout-card-box" style="display: none; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px;">
              <div class="form-group" style="margin-bottom: 10px;">
                <label class="form-label">Número do Cartão</label>
                <input type="text" class="form-input" placeholder="0000 0000 0000 0000" value="4532 9901 8823 4410" />
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
                <div class="form-group">
                  <label class="form-label">Validade</label>
                  <input type="text" class="form-input" placeholder="MM/AA" value="12/29" />
                </div>
                <div class="form-group">
                  <label class="form-label">CVV</label>
                  <input type="text" class="form-input" placeholder="123" value="789" />
                </div>
              </div>
              <button class="btn-primary" id="btn-simulate-card-paid" style="width: 100%; padding: 12px;">
                Pagar R$ ${finalTotal.toFixed(2).replace('.', ',')} no Cartão
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  `;
}

function renderOrderTrackerModalHtml(orderId, restaurant, navigateTo) {
  const order = store.orders.find(o => o.id === orderId) || store.orders[0];
  if (!order) return '';

  const steps = [
    { key: 'recebido', label: 'Pedido Confirmado', desc: 'Recebido pelo restaurante e enviado à cozinha', icon: '📝' },
    { key: 'preparo', label: 'Em Preparo no Fogão', desc: 'Montando as marmitas na linha de produção', icon: '🍳' },
    { key: 'pronto', label: 'Pronto / Saiu para Entrega', desc: 'Checklist conferido, marmita selada', icon: '🛵' },
    { key: 'entregue', label: 'Entregue com Sucesso', desc: 'Bom apetite!', icon: '✨' }
  ];

  const currentIdx = steps.findIndex(s => s.key === order.status);

  return `
    <div class="modal-overlay" id="modal-tracker-overlay">
      <div class="modal-content-card" style="max-width: 540px;">
        <div class="modal-header-bar" style="background: var(--color-primary-light);">
          <div>
            <div style="font-size: 0.75rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase;">
              Acompanhamento ao Vivo
            </div>
            <h3 style="color: var(--text-main);">Pedido #${order.orderNumber} • ${restaurant.name}</h3>
          </div>
          <button class="modal-close-btn" id="btn-close-tracker">&times;</button>
        </div>

        <div class="modal-scroll-body">
          <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
            ${steps.map((st, i) => {
              const isPassed = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return `
                <div style="display: flex; gap: 14px; position: relative;">
                  <div style="
                    width: 40px; 
                    height: 40px; 
                    border-radius: 50%; 
                    background: ${isCurrent ? 'var(--color-primary)' : isPassed ? 'var(--color-secondary)' : '#E2E8F0'}; 
                    color: ${isPassed || isCurrent ? '#fff' : '#64748B'}; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-size: 1.15rem;
                    flex-shrink: 0;
                    box-shadow: ${isCurrent ? '0 4px 15px rgba(255, 107, 0, 0.4)' : 'none'};
                  ">
                    ${st.icon}
                  </div>
                  <div style="flex: 1;">
                    <div style="font-family: var(--font-heading); font-size: 0.98rem; font-weight: 800; color: ${isCurrent ? 'var(--color-primary)' : isPassed ? 'var(--text-main)' : 'var(--text-muted)'};">
                      ${st.label} ${isCurrent ? '<span style="font-size: 0.72rem; background: var(--color-primary-light); color: var(--color-primary); padding: 2px 8px; border-radius: 99px; margin-left: 6px;">Atual</span>' : ''}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">
                      ${st.desc}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 18px;">
            <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">
              Itens do Pedido:
            </div>
            ${order.items.map(it => `
              <div style="margin-bottom: 8px; font-size: 0.88rem;">
                <strong>${it.qty}x ${it.productName}</strong>
                ${it.size ? `<span style="color: var(--text-muted); font-size: 0.78rem;"> • ${it.size}</span>` : ''}
              </div>
            `).join('')}
            <div style="border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px; display: flex; justify-content: space-between; font-weight: 800;">
              <span>Total Pago (${order.paymentMethod}):</span>
              <span style="color: var(--color-primary);">R$ ${order.total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer-bar">
          <button class="btn-secondary" id="btn-new-order-flow" style="width: 100%;">
            Fazer Novo Pedido
          </button>
        </div>
      </div>
    </div>
  `;
}

function calculateCurrentCustomizationPrice(product, custom) {
  let total = product.price;
  if (custom.size?.price) total += custom.size.price;
  if (custom.protein?.price) total += custom.protein.price;
  if (custom.base?.price) total += custom.base.price;
  if (custom.addons && custom.addons.length > 0) {
    custom.addons.forEach(a => total += (a.price || 0));
  }
  return total;
}

function attachMenuEvents(container, restaurant, slug, navigateTo) {
  // Voltar à plataforma
  container.querySelector('#btn-back-to-platform')?.addEventListener('click', () => navigateTo('plataforma'));

  // Toggle de formato
  container.querySelector('#btn-format-desktop')?.addEventListener('click', () => {
    viewFormat = 'desktop';
    renderRestaurantMenu(container, navigateTo, slug);
  });
  container.querySelector('#btn-format-mobile')?.addEventListener('click', () => {
    viewFormat = 'mobile';
    renderRestaurantMenu(container, navigateTo, slug);
  });

  // Busca
  const searchInput = container.querySelector('#search-dishes-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderRestaurantMenu(container, navigateTo, slug);
      const newSearch = container.querySelector('#search-dishes-input');
      if (newSearch) {
        newSearch.focus();
        newSearch.selectionStart = newSearch.selectionEnd = newSearch.value.length;
      }
    });
  }

  container.querySelector('#btn-clear-search')?.addEventListener('click', () => {
    searchQuery = '';
    renderRestaurantMenu(container, navigateTo, slug);
  });

  container.querySelector('#btn-reset-filters')?.addEventListener('click', () => {
    searchQuery = '';
    activeCategory = 'Todos';
    renderRestaurantMenu(container, navigateTo, slug);
  });

  // Categorias
  container.querySelectorAll('.cat-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      renderRestaurantMenu(container, navigateTo, slug);
    });
  });

  // Abrir Sacola
  container.querySelector('#btn-top-cart')?.addEventListener('click', () => {
    isCartOpen = true;
    renderRestaurantMenu(container, navigateTo, slug);
  });
  container.querySelector('#btn-mobile-open-cart')?.addEventListener('click', () => {
    isCartOpen = true;
    renderRestaurantMenu(container, navigateTo, slug);
  });

  // Clicar em prato
  container.querySelectorAll('.dish-card').forEach(card => {
    card.addEventListener('click', () => {
      const prodId = card.dataset.id;
      const product = store.products.find(p => p.id === prodId);
      if (!product || !product.available) return;

      if (product.isCustomizable) {
        selectedProductForCustomization = product;
        currentCustomization = {
          size: CUSTOMIZATION_OPTIONS.sizes.find(s => s.default) || CUSTOMIZATION_OPTIONS.sizes[0],
          protein: CUSTOMIZATION_OPTIONS.proteins.find(p => p.default) || CUSTOMIZATION_OPTIONS.proteins[0],
          base: CUSTOMIZATION_OPTIONS.bases.find(b => b.default) || CUSTOMIZATION_OPTIONS.bases[0],
          beans: CUSTOMIZATION_OPTIONS.beans.find(b => b.default) || CUSTOMIZATION_OPTIONS.beans[0],
          sides: [CUSTOMIZATION_OPTIONS.sides[0]],
          addons: [],
          notes: ''
        };
        renderRestaurantMenu(container, navigateTo, slug);
      } else {
        store.addToCart({
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          qty: 1
        }, restaurant.id);
        showMenuToast(`✓ ${product.name} adicionado à sacola!`);
        renderRestaurantMenu(container, navigateTo, slug);
      }
    });
  });

  // Customização Modal
  if (selectedProductForCustomization) {
    container.querySelector('#btn-close-custom-modal')?.addEventListener('click', () => {
      selectedProductForCustomization = null;
      renderRestaurantMenu(container, navigateTo, slug);
    });
    container.querySelector('#modal-customization-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-customization-overlay') {
        selectedProductForCustomization = null;
        renderRestaurantMenu(container, navigateTo, slug);
      }
    });

    container.querySelectorAll('.cust-option-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.type;
        const id = item.dataset.id;

        if (type === 'size') {
          currentCustomization.size = CUSTOMIZATION_OPTIONS.sizes.find(s => s.id === id);
        } else if (type === 'protein') {
          currentCustomization.protein = CUSTOMIZATION_OPTIONS.proteins.find(p => p.id === id);
        } else if (type === 'base') {
          currentCustomization.base = CUSTOMIZATION_OPTIONS.bases.find(b => b.id === id);
        } else if (type === 'beans') {
          currentCustomization.beans = CUSTOMIZATION_OPTIONS.beans.find(b => b.id === id);
        } else if (type === 'side') {
          const exists = currentCustomization.sides.some(s => s.id === id);
          if (exists) {
            currentCustomization.sides = currentCustomization.sides.filter(s => s.id !== id);
          } else {
            if (currentCustomization.sides.length < 2) {
              const sideObj = CUSTOMIZATION_OPTIONS.sides.find(s => s.id === id);
              if (sideObj) currentCustomization.sides.push(sideObj);
            } else {
              showMenuToast('Máximo de 2 acompanhamentos permitidos!');
            }
          }
        } else if (type === 'addon') {
          const exists = currentCustomization.addons.some(a => a.id === id);
          if (exists) {
            currentCustomization.addons = currentCustomization.addons.filter(a => a.id !== id);
          } else {
            const addonObj = CUSTOMIZATION_OPTIONS.addons.find(a => a.id === id);
            if (addonObj) currentCustomization.addons.push(addonObj);
          }
        }

        const notesField = container.querySelector('#cust-notes-input');
        if (notesField) currentCustomization.notes = notesField.value;

        renderRestaurantMenu(container, navigateTo, slug);
      });
    });

    container.querySelector('#btn-confirm-add-cart')?.addEventListener('click', () => {
      const notesField = container.querySelector('#cust-notes-input');
      const notes = notesField ? notesField.value : '';
      const unitPrice = calculateCurrentCustomizationPrice(selectedProductForCustomization, currentCustomization);

      store.addToCart({
        productId: selectedProductForCustomization.id,
        productName: selectedProductForCustomization.name,
        size: currentCustomization.size.name,
        protein: currentCustomization.protein.name,
        base: currentCustomization.base.name,
        beans: currentCustomization.beans.name,
        sides: currentCustomization.sides.map(s => s.name),
        addons: currentCustomization.addons.map(a => a.name),
        notes: notes,
        unitPrice: unitPrice,
        qty: 1
      }, restaurant.id);

      showMenuToast(`✓ ${selectedProductForCustomization.name} adicionada à sacola!`);
      selectedProductForCustomization = null;
      renderRestaurantMenu(container, navigateTo, slug);
    });
  }

  // Carrinho
  if (isCartOpen) {
    container.querySelector('#btn-close-cart-modal')?.addEventListener('click', () => {
      isCartOpen = false;
      renderRestaurantMenu(container, navigateTo, slug);
    });
    container.querySelector('#modal-cart-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-cart-overlay') {
        isCartOpen = false;
        renderRestaurantMenu(container, navigateTo, slug);
      }
    });

    container.querySelector('#btn-type-delivery')?.addEventListener('click', () => {
      orderType = 'delivery';
      renderRestaurantMenu(container, navigateTo, slug);
    });

    container.querySelector('#btn-type-pickup')?.addEventListener('click', () => {
      orderType = 'pickup';
      renderRestaurantMenu(container, navigateTo, slug);
    });

    container.querySelector('#btn-clear-cart')?.addEventListener('click', () => {
      store.clearCart();
      isCartOpen = false;
      renderRestaurantMenu(container, navigateTo, slug);
    });

    container.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const delta = btn.dataset.action === 'increase' ? 1 : -1;
        store.updateCartQty(id, delta);
        renderRestaurantMenu(container, navigateTo, slug);
      });
    });

    container.querySelector('#btn-apply-coupon')?.addEventListener('click', () => {
      const code = container.querySelector('#coupon-input')?.value.trim().toUpperCase();
      couponCode = code;
      if (code === 'MARMITA10') {
        discountPercent = 10;
        showMenuToast('Cupom MARMITA10 aplicado com 10% OFF! 🎉');
      } else if (code === '') {
        discountPercent = 0;
      } else {
        showMenuToast('Cupom inválido. Tente MARMITA10');
      }
      renderRestaurantMenu(container, navigateTo, slug);
    });

    container.querySelector('#btn-proceed-checkout')?.addEventListener('click', () => {
      isCartOpen = false;
      isCheckoutOpen = true;
      renderRestaurantMenu(container, navigateTo, slug);
    });
  }

  // Checkout
  if (isCheckoutOpen) {
    container.querySelector('#btn-close-checkout')?.addEventListener('click', () => {
      isCheckoutOpen = false;
      renderRestaurantMenu(container, navigateTo, slug);
    });
    container.querySelector('#modal-checkout-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-checkout-overlay') {
        isCheckoutOpen = false;
        renderRestaurantMenu(container, navigateTo, slug);
      }
    });

    const canvas = container.querySelector('#pix-qr-canvas');
    if (canvas) {
      const pixCode = container.querySelector('#pix-code-field')?.value || 'pix_code';
      QRCode.toCanvas(canvas, pixCode, { width: 180, margin: 1, color: { dark: '#0F172A', light: '#FFFFFF' } }, (err) => {
        if (err) console.error(err);
      });
    }

    container.querySelector('#btn-copy-pix')?.addEventListener('click', () => {
      const field = container.querySelector('#pix-code-field');
      if (field) {
        navigator.clipboard.writeText(field.value);
        showMenuToast('Código Pix copiado! 📋');
      }
    });

    const tabPix = container.querySelector('#btn-tab-pix');
    const tabCard = container.querySelector('#btn-tab-card');
    const pixBox = container.querySelector('#checkout-pix-box');
    const cardBox = container.querySelector('#checkout-card-box');

    tabPix?.addEventListener('click', () => {
      pixBox.style.display = 'block';
      cardBox.style.display = 'none';
      tabPix.style.background = 'var(--color-secondary-light)';
      tabPix.style.color = 'var(--color-secondary-hover)';
      tabCard.style.background = '#F1F5F9';
      tabCard.style.color = 'var(--text-main)';
    });

    tabCard?.addEventListener('click', () => {
      pixBox.style.display = 'none';
      cardBox.style.display = 'block';
      tabCard.style.background = 'var(--color-primary-light)';
      tabCard.style.color = 'var(--color-primary)';
      tabPix.style.background = '#F1F5F9';
      tabPix.style.color = 'var(--text-main)';
    });

    const handleCompletePayment = (method) => {
      const name = container.querySelector('#cust-name-input')?.value || 'Cliente MarmitaFlow';
      const phone = container.querySelector('#cust-phone-input')?.value || '';
      const address = container.querySelector('#cust-address-input')?.value || 'Retirada no Balcão';
      const cartSummary = store.getCartTotal(restaurant);
      const effectiveFee = orderType === 'pickup' ? 0 : restaurant.deliveryFee;
      const total = Math.max(0, (cartSummary.subtotal * (1 - discountPercent / 100)) + effectiveFee);

      const newOrder = store.createOrder({
        restaurantId: restaurant.id,
        customerName: name,
        customerPhone: phone,
        address: orderType === 'pickup' ? 'Retirada no Balcão' : address,
        paymentMethod: method,
        subtotal: cartSummary.subtotal,
        deliveryFee: effectiveFee,
        total: total,
        items: store.cart.filter(item => item.restaurantId === restaurant.id)
      });

      sounds.playSuccessSound();
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });

      isCheckoutOpen = false;
      activeOrderTrackingId = newOrder.id;
      renderRestaurantMenu(container, navigateTo, slug);
      showMenuToast(`🎉 Pedido #${newOrder.orderNumber} realizado com sucesso! Enviado à cozinha!`);
    };

    container.querySelector('#btn-simulate-pix-paid')?.addEventListener('click', () => handleCompletePayment('Pix'));
    container.querySelector('#btn-simulate-card-paid')?.addEventListener('click', () => handleCompletePayment('Cartão'));
  }

  // Rastreador
  if (activeOrderTrackingId) {
    container.querySelector('#btn-close-tracker')?.addEventListener('click', () => {
      activeOrderTrackingId = null;
      renderRestaurantMenu(container, navigateTo, slug);
    });

    container.querySelector('#modal-tracker-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-tracker-overlay') {
        activeOrderTrackingId = null;
        renderRestaurantMenu(container, navigateTo, slug);
      }
    });

    container.querySelector('#btn-new-order-flow')?.addEventListener('click', () => {
      activeOrderTrackingId = null;
      renderRestaurantMenu(container, navigateTo, slug);
    });
  }
}

function showMenuToast(msg) {
  const existing = document.querySelector('.toast-notice');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notice';
  toast.innerHTML = `<span>${msg}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
