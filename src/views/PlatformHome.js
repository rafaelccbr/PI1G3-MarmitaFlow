// MarmitaFlow - Plataforma Principal SaaS (Início)
import { store } from '../store.js';

export function renderPlatformHome(container, navigateTo) {
  const restaurants = store.restaurants;
  const marmitaFlow = store.getRestaurantBySlug('marmita-flow');

  container.innerHTML = `
    <div class="platform-container">
      
      <!-- HERO DA PLATAFORMA SAAS -->
      <section class="platform-hero-card">
        <div class="platform-hero-left">
          <div class="platform-badge-pill">
            <span>🚀 Plataforma de Cardápios Digitais</span>
          </div>
          
          <h1 class="platform-hero-title">
            Crie o cardápio digital do seu restaurante. 
            <span>Sem taxas por pedido.</span>
          </h1>

          <p class="platform-hero-subtitle">
            A solução completa para marmitarias e restaurantes: cardápio mobile-first, montagem guiada de marmitas, pagamento instantâneo via Pix e comanda digital direto na cozinha.
          </p>

          <div class="platform-hero-actions">
            <button class="btn-primary" id="btn-hero-create-rest" style="font-size: 1rem; padding: 12px 28px;">
              ✨ Criar Meu Restaurante Grátis
            </button>
            <button class="btn-secondary" id="btn-hero-login-admin" style="font-size: 1rem; padding: 12px 24px;">
              🔐 Área do Dono (Entrar)
            </button>
          </div>

          <div class="platform-stats-row">
            <div class="platform-stat">
              <strong>100%</strong>
              <span>Pix Direto p/ Dono</span>
            </div>
            <div class="platform-stat">
              <strong>Zero</strong>
              <span>Comandas de Papel</span>
            </div>
            <div class="platform-stat">
              <strong>Tempo Real</strong>
              <span>Estoque & KDS</span>
            </div>
          </div>
        </div>

        <div class="platform-hero-right">
          <img src="/assets/platform_hero.jpg" alt="Dono de restaurante com a plataforma MarmitaFlow" class="platform-hero-img" />
        </div>
      </section>

      <!-- DESTAQUE ESPECIAL: RESTAURANTE INDEPENDENTE MARMITA FLOW -->
      <section class="flagship-showcase-section">
        <div class="flagship-card">
          <div class="flagship-content">
            <div class="flagship-tag">Restaurante Oficial & Conceito</div>
            <h2>Marmita Flow</h2>
            <p>
              Conheça o restaurante oficial que deu origem à plataforma. Marmitas tradicionais, fit e gourmet montadas na hora com embalagens seladas anti-vazamento.
            </p>
            <div class="flagship-features">
              <span>🍛 Feijoada Completa</span>
              <span>🥗 Frango Fit com Legumes</span>
              <span>🥩 Salmão Orange</span>
              <span>⚡ Pix Instantâneo</span>
            </div>
            <div style="margin-top: 24px;">
              <button class="btn-primary" id="btn-open-marmita-flow" style="padding: 12px 28px; font-size: 1rem;">
                👉 Abrir Cardápio do Marmita Flow
              </button>
            </div>
          </div>
          <div class="flagship-media">
            <img src="/assets/mascote_flow.jpg" alt="Mascote Marmita Flow" class="flagship-mascot-img" />
          </div>
        </div>
      </section>

      <!-- RESTAURANTES CADASTRADOS NA PLATAFORMA -->
      <section class="restaurants-directory-section">
        <div class="section-title-wrap">
          <div>
            <span class="sub-label">Diretório de Restaurantes</span>
            <h2>Restaurantes Ativos na Plataforma</h2>
          </div>
          <button class="btn-secondary" id="btn-add-restaurant-dir">
            + Cadastrar Novo Restaurante
          </button>
        </div>

        <div class="restaurants-grid-directory">
          ${restaurants.map(rest => `
            <div class="directory-card" data-slug="${rest.slug}">
              <div class="directory-cover" style="background-image: url('${rest.bannerUrl}');">
                <span class="status-chip ${rest.isOpen ? 'open' : 'closed'}">
                  ${rest.isOpen ? '● Aberto' : '● Fechado'}
                </span>
              </div>
              <div class="directory-body">
                <div class="directory-logo-row">
                  <img src="${rest.logoUrl}" alt="${rest.name}" class="directory-logo" />
                  <div>
                    <h3 class="directory-name">${rest.name}</h3>
                    <span class="directory-rating">⭐ ${rest.rating}</span>
                  </div>
                </div>
                <p class="directory-desc">${rest.description}</p>
                <div class="directory-info-strip">
                  <span>⏱️ ${rest.deliveryTime}</span>
                  <span>🛵 Frete: ${rest.deliveryFee === 0 ? 'Grátis' : 'R$ ' + rest.deliveryFee.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="directory-actions">
                  <button class="btn-primary btn-visit-restaurant" data-slug="${rest.slug}" style="width: 100%; background: ${rest.primaryColor};">
                    Acessar Cardápio Público 🍱
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- COMO FUNCIONA A PLATAFORMA PARA QUEM DESEJA ABRIR UM RESTAURANTE -->
      <section class="how-it-works-section">
        <div style="text-align: center; max-width: 650px; margin: 0 auto 40px;">
          <span class="sub-label">Para Empreendedores</span>
          <h2 style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 900;">
            Como funciona para abrir seu restaurante?
          </h2>
          <p style="color: var(--text-muted); font-size: 1rem;">
            Qualquer pessoa pode se cadastrar e receber pedidos no mesmo dia com display de QR Code pronto.
          </p>
        </div>

        <div class="steps-three-grid">
          <div class="step-box">
            <div class="step-num">1</div>
            <h3>Cadastre sua Marca</h3>
            <p>Informe o nome, logotipo, endereço e suas cores personalizadas. Cadastre sua chave Pix para receber na hora.</p>
          </div>

          <div class="step-box">
            <div class="step-num">2</div>
            <h3>Monte seu Cardápio</h3>
            <p>Adicione suas marmitas, porções, bebidas e personalize as opções de arroz, feijão, carnes e adicionais.</p>
          </div>

          <div class="step-box">
            <div class="step-num">3</div>
            <h3>Imprima o QR Code</h3>
            <p>Gere o display de mesa ou compartilhe o link direto no WhatsApp e receba os pedidos diretamente na tela da cozinha.</p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px;">
          <button class="btn-primary" id="btn-bottom-create-rest" style="font-size: 1.05rem; padding: 14px 36px;">
            Quero Cadastrar Meu Restaurante Agora
          </button>
        </div>
      </section>

    </div>
  `;

  // Attach Listeners
  container.querySelector('#btn-hero-create-rest')?.addEventListener('click', () => navigateTo('criar-restaurante'));
  container.querySelector('#btn-bottom-create-rest')?.addEventListener('click', () => navigateTo('criar-restaurante'));
  container.querySelector('#btn-add-restaurant-dir')?.addEventListener('click', () => navigateTo('criar-restaurante'));
  container.querySelector('#btn-hero-login-admin')?.addEventListener('click', () => navigateTo('admin'));
  
  container.querySelector('#btn-open-marmita-flow')?.addEventListener('click', () => {
    navigateTo('cardapio', 'marmita-flow');
  });

  container.querySelectorAll('.btn-visit-restaurant').forEach(btn => {
    btn.addEventListener('click', () => {
      const slug = btn.dataset.slug;
      navigateTo('cardapio', slug);
    });
  });
}
