// MarmitaFlow - Painel Administrativo Protegido do Proprietário
import { store } from '../store.js';
import QRCode from 'qrcode';
import { applyRestaurantTheme, restaurantMenuUrl, escapeHTML } from '../ui.js';

let activeAdminTab = 'branding'; // 'branding', 'menu', 'stock', 'qrcode'
let editingProductId = null;
let isProductModalOpen = false;

const PRESET_COLORS = [
  { name: 'Laranja MarmitaFlow', hex: '#FF6B00' },
  { name: 'Vermelho Brasa', hex: '#DC2626' },
  { name: 'Verde Salada & Saúde', hex: '#059669' },
  { name: 'Azul Bistrô Marinho', hex: '#0284C7' },
  { name: 'Roxo Açaí & Poke', hex: '#7C3AED' },
  { name: 'Amarelo Ouro', hex: '#D97706' },
  { name: 'Dark Sofisticado', hex: '#0F172A' }
];

export function renderAdminDashboard(container, navigateTo) {
  // Guarda de Rota: se não estiver autenticado, vai para a tela de login
  if (!store.auth.loggedIn || !store.auth.restaurantId) {
    navigateTo('admin-login');
    return;
  }

  const restaurant = store.getLoggedRestaurant();
  if (!restaurant) {
    store.logoutAdmin();
    navigateTo('admin-login');
    return;
  }

  const products = store.getProductsByRestaurant(restaurant.id);
  applyRestaurantTheme(container, restaurant);
  const publicUrl = restaurantMenuUrl(restaurant.slug);
  const orders = store.getOrdersByRestaurant(restaurant.id);
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  container.innerHTML = `
    <div class="admin-dashboard-wrapper">
      
      <!-- CABEÇALHO DO PAINEL PROTEGIDO -->
      <div class="admin-topbar">
        <div class="admin-topbar-brand">
          <img src="${restaurant.logoUrl}" alt="${restaurant.name}" class="admin-topbar-logo" />
          <div>
            <div class="admin-topbar-title">
              <h1>${restaurant.name}</h1>
              <span class="admin-badge-protected">🔒 Painel do Proprietário</span>
            </div>
            <p class="admin-topbar-user">
              Administrador: <strong>${store.auth.ownerName || 'Dono'}</strong> (${store.auth.userEmail})
            </p>
            <p class="admin-topbar-user">${orders.filter(order => order.status !== 'entregue').length} pedidos em andamento · ${products.filter(product => !product.available).length} itens esgotados</p>
          </div>
        </div>

        <div class="admin-topbar-actions">
          <a class="btn-primary" id="btn-admin-view-menu" href="${escapeHTML(publicUrl)}" target="_blank" rel="noopener">Ver página do restaurante ↗</a>
          <button class="btn-secondary" id="btn-admin-view-kds">
            👨‍🍳 Abrir Cozinha (KDS)
          </button>
          <button class="btn-secondary" id="btn-admin-logout" style="color: var(--color-danger); border-color: #FECACA;">
            🚪 Sair
          </button>
        </div>
      </div>

      <section class="restaurant-share-panel" aria-labelledby="share-heading">
        <div>
          <h2 id="share-heading">Seu link para receber pedidos</h2>
          <p>O cliente abre direto o cardápio, com a sua marca e seus pratos.</p>
        </div>
        <div class="restaurant-share-actions">
          <label class="sr-only" for="restaurant-public-link">Link do cardápio do restaurante</label>
          <input class="form-input" id="restaurant-public-link" value="${escapeHTML(publicUrl)}" readonly />
          <button class="btn-primary" id="btn-copy-public-menu">Copiar link</button>
        </div>
        <p class="share-demo-note">Nesta demonstração, cadastros, alterações e pedidos ficam neste navegador. Para receber pedidos de outras pessoas, será necessário conectar um banco de dados compartilhado e publicar o site.</p>
      </section>

      <!-- MÉTRICAS DO RESTAURANTE -->
      <div class="admin-metrics-grid">
        <div class="metric-card">
          <div class="metric-icon" style="background: rgba(255, 107, 0, 0.1); color: var(--color-primary);">📋</div>
          <div>
            <div class="metric-val">${orders.length}</div>
            <div class="metric-label">Pedidos Recebidos</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--color-secondary);">💰</div>
          <div>
            <div class="metric-val">R$ ${totalRevenue.toFixed(2).replace('.', ',')}</div>
            <div class="metric-label">Faturamento Total</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon" style="background: rgba(59, 130, 246, 0.1); color: #3B82F6;">🍱</div>
          <div>
            <div class="metric-val">${products.length}</div>
            <div class="metric-label">Pratos no Cardápio</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon" style="background: ${restaurant.isOpen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${restaurant.isOpen ? 'var(--color-secondary)' : 'var(--color-danger)'};">
            ${restaurant.isOpen ? '🟢' : '🔴'}
          </div>
          <div>
            <div class="metric-val" style="font-size: 1.2rem;">${restaurant.isOpen ? 'Aberto' : 'Fechado'}</div>
            <div class="metric-label">Status da Loja</div>
          </div>
        </div>
      </div>

      <!-- ABAS DO PAINEL -->
      <div class="owner-tabs-nav">
        <button class="owner-tab-item ${activeAdminTab === 'branding' ? 'active' : ''}" data-tab="branding">
          🎨 Minha Marca & Configurações
        </button>
        <button class="owner-tab-item ${activeAdminTab === 'menu' ? 'active' : ''}" data-tab="menu">
          🍱 Gerenciar Cardápio (${products.length})
        </button>
        <button class="owner-tab-item ${activeAdminTab === 'stock' ? 'active' : ''}" data-tab="stock">
          📦 Estoque em Tempo Real
        </button>
        <button class="owner-tab-item ${activeAdminTab === 'qrcode' ? 'active' : ''}" data-tab="qrcode">
          🖨️ Display de Mesa & QR Code
        </button>
      </div>

      <!-- ABA 1: CONFIGURAÇÕES DA MARCA & PIX -->
      ${activeAdminTab === 'branding' ? `
        <div class="owner-card-panel">
          <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 6px;">
            Personalize a Identidade de ${restaurant.name}
          </h3>
          <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 24px;">
            As alterações feitas aqui atualizam imediatamente o cardápio público dos seus clientes.
          </p>

          <form id="admin-branding-form">
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Nome do Estabelecimento</label>
                <input type="text" id="dash-name-input" class="form-input" value="${restaurant.name}" required />
              </div>

              <div class="form-group">
                <label class="form-label">Slogan ou Descrição Curta</label>
                <input type="text" id="dash-tagline-input" class="form-input" value="${restaurant.tagline}" />
              </div>
            </div>

            <!-- Cores -->
            <div class="form-group" style="margin-bottom: 24px;">
              <label class="form-label">Cor Principal da Marca (Muda o tema do seu cardápio)</label>
              <div class="color-picker-grid">
                ${PRESET_COLORS.map(c => `
                  <button 
                    type="button" 
                    class="color-swatch-btn ${restaurant.primaryColor.toUpperCase() === c.hex.toUpperCase() ? 'active' : ''}" 
                    style="background: ${c.hex};" 
                    data-hex="${c.hex}" 
                    title="${c.name}"
                  ></button>
                `).join('')}
                
                <label class="custom-color-button" title="Clique para escolher qualquer cor">
                  <input type="color" id="dash-custom-color" value="${restaurant.primaryColor}" />
                  <span>🎨 Outra cor</span>
                </label>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Sua Chave Pix para Recebimento</label>
                <input type="text" id="dash-pix-input" class="form-input" value="${restaurant.pixKey}" placeholder="CNPJ, Celular, E-mail ou Chave Aleatória" required />
              </div>

              <div class="form-group">
                <label class="form-label">WhatsApp para Notificações</label>
                <input type="text" id="dash-phone-input" class="form-input" value="${restaurant.phone}" placeholder="(11) 98765-4321" />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Taxa de Entrega (R$)</label>
                <input type="number" step="0.50" id="dash-fee-input" class="form-input" value="${restaurant.deliveryFee}" />
              </div>

              <div class="form-group">
                <label class="form-label">Tempo Médio Estimado</label>
                <input type="text" id="dash-time-input" class="form-input" value="${restaurant.deliveryTime}" placeholder="Ex: 30-45 min" />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">URL da Foto de Logo</label>
                <input type="text" id="dash-logo-input" class="form-input" value="${restaurant.logoUrl}" />
              </div>

              <div class="form-group">
                <label class="form-label">URL do Banner de Capa</label>
                <input type="text" id="dash-banner-input" class="form-input" value="${restaurant.bannerUrl}" />
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
              <label class="form-label">Endereço Completo</label>
              <input type="text" id="dash-address-input" class="form-input" value="${restaurant.address}" />
            </div>

            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 24px;">
              <label class="toggle-switch">
                <input type="checkbox" id="dash-isopen-input" ${restaurant.isOpen ? 'checked' : ''} />
                <span class="toggle-slider"></span>
              </label>
              <span style="font-weight: 700; font-size: 0.95rem;">
                Restaurante Aberto para Receber Pedidos Agora
              </span>
            </div>

            <button type="submit" class="btn-primary" style="padding: 12px 30px;">
              Salvar Alterações do Restaurante
            </button>
          </form>
        </div>
      ` : ''}

      <!-- ABA 2: GESTÃO DO CARDÁPIO -->
      ${activeAdminTab === 'menu' ? `
        <div class="owner-card-panel">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 style="font-family: var(--font-heading); font-size: 1.3rem;">Pratos do Seu Cardápio</h3>
              <p style="font-size: 0.88rem; color: var(--text-muted);">Itens exibidos publicamente para seus clientes.</p>
            </div>
            <button class="btn-primary" id="btn-admin-add-product">
              + Novo Prato / Marmita
            </button>
          </div>

          <div style="overflow-x: auto;">
            <table class="products-admin-table">
              <thead>
                <tr>
                  <th>Prato / Foto</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${products.map(prod => `
                  <tr>
                    <td>
                      <div class="table-product-cell">
                        <img src="${prod.image || '/assets/feijoada_flow.jpg'}" alt="${prod.name}" class="table-product-thumb" />
                        <div>
                          <div style="font-weight: 700; color: var(--text-main);">${prod.name}</div>
                          ${prod.badge ? `<span style="font-size: 0.72rem; color: var(--color-primary); font-weight: 700;">${prod.badge}</span>` : ''}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style="background: #F1F5F9; padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 600;">
                        ${prod.category}
                      </span>
                    </td>
                    <td style="font-weight: 800; color: var(--color-primary);">
                      R$ ${prod.price.toFixed(2).replace('.', ',')}
                    </td>
                    <td>
                      <span style="font-size: 0.8rem; color: var(--text-muted);">
                        ${prod.isCustomizable ? '🍱 Montável' : '📦 Item Pronto'}
                      </span>
                    </td>
                    <td>
                      <span style="font-size: 0.78rem; font-weight: 700; padding: 3px 8px; border-radius: var(--radius-full); background: ${prod.available ? 'var(--color-secondary-light)' : 'var(--color-danger-light)'}; color: ${prod.available ? 'var(--color-secondary-hover)' : 'var(--color-danger)'};">
                        ${prod.available ? 'Disponível' : 'Esgotado'}
                      </span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 8px;">
                        <button class="btn-secondary btn-dash-edit-prod" data-id="${prod.id}" style="padding: 6px 12px; font-size: 0.8rem;">
                          Editar
                        </button>
                        <button class="btn-secondary btn-dash-delete-prod" data-id="${prod.id}" style="padding: 6px 10px; color: var(--color-danger); border-color: #FECACA; font-size: 0.8rem;">
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- ABA 3: CONTROLE DE ESTOQUE EM TEMPO REAL -->
      ${activeAdminTab === 'stock' ? `
        <div class="owner-card-panel">
          <div style="margin-bottom: 24px;">
            <h3 style="font-family: var(--font-heading); font-size: 1.3rem;">Estoque ao Vivo da Cozinha</h3>
            <p style="font-size: 0.88rem; color: var(--text-muted);">
              Acabou algum item na cozinha? Desative com 1 clique aqui. O cardápio dos seus clientes bloqueia imediatamente e sugere alternativas!
            </p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
            ${products.map(prod => `
              <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 14px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <img src="${prod.image || '/assets/feijoada_flow.jpg'}" alt="${prod.name}" style="width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: cover;" />
                  <div>
                    <div style="font-weight: 700; font-size: 0.92rem;">${prod.name}</div>
                    <div style="font-size: 0.78rem; color: ${prod.available ? 'var(--color-secondary-hover)' : 'var(--color-danger)'}; font-weight: 700;">
                      ${prod.available ? '🟢 Em Estoque' : '🔴 Esgotado na Cozinha'}
                    </div>
                  </div>
                </div>

                <label class="toggle-switch">
                  <input type="checkbox" class="dash-stock-toggle" data-id="${prod.id}" ${prod.available ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- ABA 4: QR CODE & DISPLAY DE MESA -->
      ${activeAdminTab === 'qrcode' ? `
        <div class="owner-card-panel">
          <div style="text-align: center; max-width: 600px; margin: 0 auto 32px;">
            <h3 style="font-family: var(--font-heading); font-size: 1.4rem; margin-bottom: 8px;">
              Display de Mesa para ${restaurant.name}
            </h3>
            <p style="font-size: 0.9rem; color: var(--text-muted);">
              Imprima este totem e cole nas mesas do seu salão ou no balcão para os clientes acessarem seu cardápio direto pelo celular!
            </p>
          </div>

          <div class="table-tent-preview-card" id="admin-table-tent">
            <div class="table-tent-brand">
              <img src="${restaurant.logoUrl}" alt="Logo" />
              <div class="table-tent-title">${restaurant.name}</div>
              <div style="font-size: 0.85rem; color: var(--text-muted);">${restaurant.tagline}</div>
            </div>

            <div class="table-tent-instruction" style="color: ${restaurant.primaryColor};">
              📱 Aponte a câmera e peça agora!
            </div>

            <canvas id="dash-qr-canvas" style="width: 220px; height: 220px; margin: 0 auto 16px; background: #fff; padding: 12px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.06);"></canvas>

            <div style="font-size: 0.85rem; font-weight: 700; color: #64748B;">
              Mesa 01 • Cardápio Digital Oficial
            </div>
            <div style="font-size: 0.75rem; color: #94A3B8; margin-top: 4px;">
              Powered by MarmitaFlow Platform
            </div>
          </div>

          <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            <button class="btn-primary" id="btn-dash-print-tent">
              🖨️ Imprimir Display de Mesa
            </button>
            <button class="btn-secondary" id="btn-dash-copy-link">
              📋 Copiar Link do Cardápio
            </button>
          </div>
        </div>
      ` : ''}

    </div>

    <!-- MODAL DE CRIAR/EDITAR PRATO DO DONO -->
    ${isProductModalOpen ? renderProductModalHtml(editingProductId, restaurant) : ''}
  `;

  attachAdminEvents(container, restaurant, navigateTo);
}

function renderProductModalHtml(editId, restaurant) {
  const prod = editId ? store.products.find(p => p.id === editId) : null;

  return `
    <div class="modal-overlay" id="modal-product-overlay">
      <div class="modal-content-card" style="max-width: 500px;">
        <div class="modal-header-bar">
          <h3>${prod ? 'Editar Prato' : 'Adicionar Novo Prato'}</h3>
          <button class="modal-close-btn" id="btn-close-prod-modal">&times;</button>
        </div>

        <form id="dash-product-form">
          <div class="modal-scroll-body">
            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">Nome do Prato</label>
              <input type="text" id="m-prod-name" class="form-input" value="${prod?.name || ''}" placeholder="Ex: Marmita de Costela com Mandioca" required />
            </div>

            <div class="form-grid-2" style="margin-bottom: 14px;">
              <div class="form-group">
                <label class="form-label">Categoria</label>
                <select id="m-prod-category" class="form-select">
                  <option value="Marmitas Tradicionais" ${prod?.category === 'Marmitas Tradicionais' ? 'selected' : ''}>Marmitas Tradicionais</option>
                  <option value="Linha Fit & Equilíbrio" ${prod?.category === 'Linha Fit & Equilíbrio' ? 'selected' : ''}>Linha Fit & Equilíbrio</option>
                  <option value="Marmitas Gourmet" ${prod?.category === 'Marmitas Gourmet' ? 'selected' : ''}>Marmitas Gourmet</option>
                  <option value="Personalizável" ${prod?.category === 'Personalizável' ? 'selected' : ''}>Personalizável</option>
                  <option value="Bebidas" ${prod?.category === 'Bebidas' ? 'selected' : ''}>Bebidas</option>
                  <option value="Sobremesas" ${prod?.category === 'Sobremesas' ? 'selected' : ''}>Sobremesas</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Preço (R$)</label>
                <input type="number" step="0.10" id="m-prod-price" class="form-input" value="${prod?.price || 28.00}" required />
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">Descrição Apetite</label>
              <textarea id="m-prod-desc" class="form-textarea" style="height: 70px; resize: none;" placeholder="Descreva os ingredientes saborosos deste prato...">${prod?.description || ''}</textarea>
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">Foto do Prato</label>
              <input type="text" id="m-prod-image" class="form-input" value="${prod?.image || '/assets/feijoada_flow.jpg'}" />
              <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
                <span class="btn-secondary btn-quick-photo" data-url="/assets/feijoada_flow.jpg" style="padding: 2px 8px; font-size: 0.72rem; cursor: pointer;">Feijoada</span>
                <span class="btn-secondary btn-quick-photo" data-url="/assets/frango_grelhado.jpg" style="padding: 2px 8px; font-size: 0.72rem; cursor: pointer;">Frango</span>
                <span class="btn-secondary btn-quick-photo" data-url="/assets/salmao_orange.jpg" style="padding: 2px 8px; font-size: 0.72rem; cursor: pointer;">Salmão</span>
                <span class="btn-secondary btn-quick-photo" data-url="/assets/marmita_custom.jpg" style="padding: 2px 8px; font-size: 0.72rem; cursor: pointer;">Marmita</span>
                <span class="btn-secondary btn-quick-photo" data-url="/assets/suco_laranja.jpg" style="padding: 2px 8px; font-size: 0.72rem; cursor: pointer;">Suco</span>
                <span class="btn-secondary btn-quick-photo" data-url="/assets/brownie.jpg" style="padding: 2px 8px; font-size: 0.72rem; cursor: pointer;">Brownie</span>
              </div>
            </div>

            <div class="form-grid-2" style="margin-bottom: 14px;">
              <div class="form-group">
                <label class="form-label">Badge de Destaque</label>
                <input type="text" id="m-prod-badge" class="form-input" value="${prod?.badge || ''}" placeholder="Ex: Mais Vendido 🔥, Fit 🥗" />
              </div>

              <div class="form-group">
                <label class="form-label">Tipo de Item</label>
                <select id="m-prod-customizable" class="form-select">
                  <option value="true" ${prod?.isCustomizable !== false ? 'selected' : ''}>Marmita Montável (Arroz, feijão, guarnições)</option>
                  <option value="false" ${prod?.isCustomizable === false ? 'selected' : ''}>Item Direto (Bebida, sobremesa)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-footer-bar">
            <button type="button" class="btn-secondary" id="btn-cancel-modal-prod">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar no Cardápio</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function attachAdminEvents(container, restaurant, navigateTo) {
  // Troca de abas
  container.querySelectorAll('.owner-tab-item').forEach(btn => {
    btn.addEventListener('click', () => {
      activeAdminTab = btn.dataset.tab;
      renderAdminDashboard(container, navigateTo);
    });
  });

  // Ações do cabeçalho
  const copyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(restaurantMenuUrl(restaurant.slug));
      showDashToast('Link do cardápio copiado!');
    } catch {
      const input = container.querySelector('#restaurant-public-link');
      input.focus();
      input.select();
      showDashToast('Selecione e copie o link no campo do cardápio.');
    }
  };
  container.querySelector('#btn-copy-public-menu')?.addEventListener('click', copyPublicLink);
  container.querySelector('#btn-dash-copy-link')?.addEventListener('click', copyPublicLink);

  container.querySelector('#btn-admin-view-kds')?.addEventListener('click', () => {
    navigateTo('cozinha', restaurant.slug);
  });

  container.querySelector('#btn-admin-logout')?.addEventListener('click', () => {
    store.logoutAdmin();
    navigateTo('admin-login');
  });

  // Aba 1: Branding
  if (activeAdminTab === 'branding') {
    let chosenColor = restaurant.primaryColor;

    container.querySelectorAll('.color-swatch-btn').forEach(swatch => {
      swatch.addEventListener('click', () => {
        chosenColor = swatch.dataset.hex;
        container.querySelectorAll('.color-swatch-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.hex.toUpperCase() === chosenColor.toUpperCase());
        });
        const customColor = container.querySelector('#dash-custom-color');
        if (customColor) customColor.value = chosenColor;
        applyRestaurantTheme(container, restaurant, chosenColor);
      });
    });

    const customColor = container.querySelector('#dash-custom-color');
    customColor?.addEventListener('input', (e) => {
      chosenColor = e.target.value;
      container.querySelectorAll('.color-swatch-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.hex.toUpperCase() === chosenColor.toUpperCase());
      });
      applyRestaurantTheme(container, restaurant, chosenColor);
    });

    container.querySelector('#admin-branding-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      store.updateRestaurant(restaurant.id, {
        name: container.querySelector('#dash-name-input').value,
        tagline: container.querySelector('#dash-tagline-input').value,
        primaryColor: chosenColor,
        pixKey: container.querySelector('#dash-pix-input').value,
        phone: container.querySelector('#dash-phone-input').value,
        deliveryFee: parseFloat(container.querySelector('#dash-fee-input').value) || 0,
        deliveryTime: container.querySelector('#dash-time-input').value,
        logoUrl: container.querySelector('#dash-logo-input').value,
        bannerUrl: container.querySelector('#dash-banner-input').value,
        address: container.querySelector('#dash-address-input').value,
        isOpen: container.querySelector('#dash-isopen-input').checked
      });

      showDashToast('✓ Configurações salvas com sucesso!');
      renderAdminDashboard(container, navigateTo);
    });
  }

  // Aba 2: Menu CRUD
  if (activeAdminTab === 'menu') {
    container.querySelector('#btn-admin-add-product')?.addEventListener('click', () => {
      editingProductId = null;
      isProductModalOpen = true;
      renderAdminDashboard(container, navigateTo);
    });

    container.querySelectorAll('.btn-dash-edit-prod').forEach(btn => {
      btn.addEventListener('click', () => {
        editingProductId = btn.dataset.id;
        isProductModalOpen = true;
        renderAdminDashboard(container, navigateTo);
      });
    });

    container.querySelectorAll('.btn-dash-delete-prod').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm('Deseja realmente remover este prato do seu cardápio?')) {
          store.deleteProduct(id);
          showDashToast('Prato removido.');
          renderAdminDashboard(container, navigateTo);
        }
      });
    });
  }

  // Aba 3: Estoque
  if (activeAdminTab === 'stock') {
    container.querySelectorAll('.dash-stock-toggle').forEach(input => {
      input.addEventListener('change', () => {
        const id = input.dataset.id;
        store.toggleStock(id);
        const prod = store.products.find(p => p.id === id);
        showDashToast(`${prod.name}: ${prod.available ? 'Em estoque' : 'Marcado como ESGOTADO'}`);
        renderAdminDashboard(container, navigateTo);
      });
    });
  }

  // Aba 4: QR Code
  if (activeAdminTab === 'qrcode') {
    const canvas = container.querySelector('#dash-qr-canvas');
    if (canvas) {
      const menuUrl = restaurantMenuUrl(restaurant.slug);
      QRCode.toCanvas(canvas, menuUrl, { width: 200, margin: 1, color: { dark: '#0F172A', light: '#FFFFFF' } }, (err) => {
        if (err) console.error(err);
      });
    }

    container.querySelector('#btn-dash-print-tent')?.addEventListener('click', () => {
      window.print();
    });

  }

  // Modal de Produto
  if (isProductModalOpen) {
    container.querySelector('#btn-close-prod-modal')?.addEventListener('click', () => {
      isProductModalOpen = false;
      renderAdminDashboard(container, navigateTo);
    });

    container.querySelector('#modal-product-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-product-overlay') {
        isProductModalOpen = false;
        renderAdminDashboard(container, navigateTo);
      }
    });

    container.querySelector('#btn-cancel-modal-prod')?.addEventListener('click', () => {
      isProductModalOpen = false;
      renderAdminDashboard(container, navigateTo);
    });

    container.querySelectorAll('.btn-quick-photo').forEach(tag => {
      tag.addEventListener('click', () => {
        const input = container.querySelector('#m-prod-image');
        if (input) input.value = tag.dataset.url;
      });
    });

    container.querySelector('#dash-product-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const productData = {
        restaurantId: restaurant.id,
        name: container.querySelector('#m-prod-name').value,
        category: container.querySelector('#m-prod-category').value,
        price: parseFloat(container.querySelector('#m-prod-price').value) || 0,
        description: container.querySelector('#m-prod-desc').value,
        image: container.querySelector('#m-prod-image').value,
        badge: container.querySelector('#m-prod-badge').value,
        isCustomizable: container.querySelector('#m-prod-customizable').value === 'true'
      };

      if (editingProductId) {
        store.updateProduct(editingProductId, productData);
        showDashToast('✓ Prato atualizado no cardápio!');
      } else {
        store.addProduct(productData);
        showDashToast('✓ Novo prato cadastrado no cardápio!');
      }

      isProductModalOpen = false;
      renderAdminDashboard(container, navigateTo);
    });
  }
}

function showDashToast(msg) {
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
