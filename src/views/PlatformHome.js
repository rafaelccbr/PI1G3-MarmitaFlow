// MarmitaFlow - Plataforma Principal SaaS (Início)
// Refatorado sob as regras do design-taste-frontend (split-stage, sem clichês de IA)
import { store } from '../store.js';
import QRCode from 'qrcode';
import { escapeHTML, restaurantMenuUrl } from '../ui.js';

export function renderPlatformHome(container, navigateTo) {
  const restaurants = store.restaurants;

  // Estado interativo do Simulador de Marmita (The Live Thing)
  let simState = {
    size: 'M',
    price: 24,
    protein: 'Feijoada Nobre',
    base: 'Arroz branco + Feijão preto',
    notes: 'Sem cebola'
  };

  // Estado da aba de documentos (Showcase)
  let activeSheet = 'kds';

  // Estado das etapas (How It Works)
  let activeStage = 1;

  container.innerHTML = `
    <div class="platform-stage-wrapper">
      
      <!-- HERO: THE SPLIT STAGE -->
      <section class="split-stage-hero">
        <div class="split-hero-media">
          <div class="hero-photo-frame">
            <img src="/assets/platform_hero.jpg" alt="Proprietário de marmitaria operando pedidos pelo smartphone no balcão" class="split-hero-photo" width="1200" height="1500" loading="eager" />
            <div class="hero-live-badge">
              <span class="live-pulse-dot"></span>
              Do cardápio à cozinha
            </div>
          </div>
          <p class="media-caption">Um cardápio para escolher. Uma comanda para preparar.</p>
        </div>

        <div class="split-hero-content">
          <h1 class="split-hero-title">
            Cardápios digitais para marmitarias.
          </h1>

          <p class="split-hero-standfirst">
            Seu cliente monta a marmita. Você recebe o pedido organizado e acompanha o preparo na cozinha. Experimente o fluxo completo nesta demonstração.
          </p>

          <div class="split-hero-actions">
            <button class="btn-primary" id="btn-hero-create-rest">
              Criar restaurante grátis
            </button>
            <button class="btn-text-action" id="btn-hero-login-admin">
              Acessar área do dono →
            </button>
          </div>

          <div class="split-hero-facts">
            <span>0% de comissão por venda</span>
            <span>Chave Pix própria</span>
            <span>Comanda KDS na tela</span>
          </div>
        </div>
      </section>

      <!-- SEÇÃO 2: SHOWCASE — TRÊS DOCUMENTOS QUE O SISTEMA GERA -->
      <section class="showcase-output-section">
        <div class="section-heading-block">
          <h2 class="section-title">Três saídas geradas a cada pedido.</h2>
          <p class="section-lead">A operação roda sem atrito entre o balcão, a cozinha e a conta bancária.</p>
        </div>

        <div class="showcase-split-grid">
          <div class="showcase-index-column">
            <button class="showcase-tab-btn active" data-sheet="kds">
              <span class="tab-index-num">1</span>
              <span class="tab-index-text">Comanda digital da cozinha</span>
            </button>
            <button class="showcase-tab-btn" data-sheet="display">
              <span class="tab-index-num">2</span>
              <span class="tab-index-text">Display de mesa e balcão</span>
            </button>
            <button class="showcase-tab-btn" data-sheet="pix">
              <span class="tab-index-num">3</span>
              <span class="tab-index-text">Exemplo de pagamento Pix</span>
            </button>
          </div>

          <div class="showcase-sheet-stage" id="showcase-sheet-target">
            <!-- Renderizado dinamicamente via JS -->
          </div>
        </div>
      </section>

      <!-- SEÇÃO 3: THE LIVE THING — SIMULADOR INTERATIVO DE MONTAGEM E COMANDA -->
      <section class="live-simulator-section">
        <div class="section-heading-block">
          <h2 class="section-title">Simulador de montagem ao vivo.</h2>
          <p class="section-lead">Altere qualquer opção para ver a comanda digital ser formatada instantaneamente.</p>
        </div>

        <div class="simulator-split-grid">
          <div class="simulator-ticket-column">
            <div class="live-kds-sheet" data-ui id="live-ticket-preview">
              <!-- Renderizado dinamicamente -->
            </div>
            <p class="ticket-status-note">Comanda sincronizada em tempo real com a tela de preparo.</p>
          </div>

          <div class="simulator-controls-column">
            <div class="control-group">
              <label class="control-label">Tamanho da porção</label>
              <div class="control-segmented" id="control-sizes">
                <button class="segment-btn" data-size="P" data-price="18">P (R$ 18,00)</button>
                <button class="segment-btn active" data-size="M" data-price="24">M (R$ 24,00)</button>
                <button class="segment-btn" data-size="G" data-price="30">G (R$ 30,00)</button>
              </div>
            </div>

            <div class="control-group">
              <label class="control-label">Proteína principal</label>
              <div class="control-segmented" id="control-proteins">
                <button class="segment-btn active" data-protein="Feijoada Nobre">Feijoada Nobre</button>
                <button class="segment-btn" data-protein="Frango Grelhado">Frango Grelhado</button>
                <button class="segment-btn" data-protein="Salmão Executivo">Salmão Executivo</button>
              </div>
            </div>

            <div class="control-group">
              <label class="control-label">Base e feijão</label>
              <div class="control-segmented" id="control-bases">
                <button class="segment-btn active" data-base="Arroz branco + Feijão preto">Arroz branco + Feijão preto</button>
                <button class="segment-btn" data-base="Arroz integral + Feijão carioca">Arroz integral + Feijão carioca</button>
              </div>
            </div>

            <div class="control-group">
              <label class="control-label">Observação especial</label>
              <div class="control-segmented" id="control-notes">
                <button class="segment-btn active" data-note="Sem cebola">Sem cebola</button>
                <button class="segment-btn" data-note="Farofa da casa extra">Farofa extra</button>
                <button class="segment-btn" data-note="Molho picante à parte">Molho à parte</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SEÇÃO 4: COMO FUNCIONA (HOW IT WORKS SLIDER) -->
      <section class="stages-workflow-section">
        <div class="section-heading-block">
          <h2 class="section-title">Operação no ar em quatro etapas.</h2>
          <p class="section-lead">Da configuração inicial ao primeiro pedido na cozinha.</p>
        </div>

        <div class="stages-slider-container">
          <div class="stages-nav-pills" id="stages-nav-buttons">
            <button class="stage-nav-item active" data-stage="1">1. Cadastro e Pix</button>
            <button class="stage-nav-item" data-stage="2">2. QR Code de balcão</button>
            <button class="stage-nav-item" data-stage="3">3. Cliente monta</button>
            <button class="stage-nav-item" data-stage="4">4. Cozinha despacha</button>
          </div>

          <div class="stage-display-card" id="stage-display-content" data-ui>
            <!-- Renderizado dinamicamente via JS -->
          </div>
        </div>
      </section>

      <!-- SEÇÃO 5: DIRETÓRIO DE RESTAURANTES (TWO-ENDED ROWS) -->
      <section class="directory-list-section">
        <div class="section-heading-block">
          <h2 class="section-title">Restaurantes ativos na plataforma.</h2>
          <p class="section-lead">Acesse os cardápios digitais em funcionamento agora mesmo.</p>
        </div>

        <div class="directory-grid-layout">
          <div class="directory-col">
            <div class="directory-group-header">Restaurante Conceito Oficial</div>
            <div class="directory-row" data-slug="marmita-flow">
              <div class="directory-row-left">
                <img src="/assets/mascote_flow.jpg" alt="Marmita Flow Oficial" class="directory-row-avatar" />
                <div>
                  <span class="directory-row-name">Marmita Flow Oficial</span>
                  <span class="directory-row-desc">Feijoada tradicional, opções fit e executivas seladas</span>
                </div>
              </div>
              <div class="directory-row-right">
              <span class="directory-row-meta">${escapeHTML(restaurants.find(rest => rest.slug === 'marmita-flow')?.deliveryTime || '30–45 min')} · Entrega R$ ${(restaurants.find(rest => rest.slug === 'marmita-flow')?.deliveryFee ?? 3).toFixed(2).replace('.', ',')}</span>
                <button class="btn-table-action btn-visit-rest" data-slug="marmita-flow">
                  Abrir cardápio →
                </button>
              </div>
            </div>
          </div>

          <div class="directory-col">
            <div class="directory-group-header">Marmitarias Cadastradas</div>
            ${restaurants.filter(r => r.slug !== 'marmita-flow').map(rest => `
              <div class="directory-row" data-slug="${rest.slug}">
                <div class="directory-row-left">
                  <img src="${escapeHTML(rest.logoUrl)}" alt="${escapeHTML(rest.name)}" class="directory-row-avatar" loading="lazy" />
                  <div>
                    <span class="directory-row-name">${escapeHTML(rest.name)}</span>
                    <span class="directory-row-desc">${escapeHTML(rest.description)}</span>
                  </div>
                </div>
                <div class="directory-row-right">
                  <span class="directory-row-meta">${rest.deliveryTime} · ${rest.deliveryFee === 0 ? 'Grátis' : 'R$ ' + rest.deliveryFee.toFixed(2).replace('.', ',')}</span>
                  <button class="btn-table-action btn-visit-rest" data-slug="${rest.slug}">
                    Abrir cardápio →
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- SEÇÃO 6: CTA (PLAIN SENTENCE, ONE ACTION) -->
      <section class="cta-quiet-section">
        <p class="cta-statement">
          Seu próximo pedido pode começar por aqui.
        </p>
        <div class="cta-button-wrap">
          <button class="btn-primary" id="btn-bottom-create-rest">
            Cadastrar restaurante agora
          </button>
        </div>
      </section>

      <!-- SEÇÃO 7: FOOTER (SPLIT PHOTOGRAPH & LARGE MENU) -->
      <footer class="split-footer-section">
        <div class="footer-photo-half">
          <img src="/assets/marmita_custom.jpg" alt="Marmita selada pronta para entrega" class="footer-photo-img" />
          <p class="footer-photo-caption">Marmita selada anti-vazamento, montada e despachada na hora.</p>
        </div>

        <div class="footer-menu-half">
          <div class="footer-wordmark">MarmitaFlow</div>
          <nav class="footer-large-nav">
            <a href="#/plataforma" class="footer-nav-link">Início</a>
            <a href="#/cardapio/marmita-flow" class="footer-nav-link">Restaurante Oficial</a>
            <a href="#/criar-restaurante" class="footer-nav-link">Abrir Restaurante</a>
            <a href="#/sobre" class="footer-nav-link">Sobre o Projeto</a>
            <a href="#/admin" class="footer-nav-link">Área do Dono</a>
          </nav>

          <div class="footer-bottom-info">
            <p class="footer-legal">
              MarmitaFlow · Plataforma de Gestão de Cardápios e Cozinha · Projeto Integrador Universitário.
            </p>
          </div>
        </div>
      </footer>

    </div>
  `;

  // Renderizador do Showcase
  function renderShowcaseSheet() {
    const target = container.querySelector('#showcase-sheet-target');
    if (!target) return;

    if (activeSheet === 'kds') {
      target.innerHTML = `
        <div class="sheet-paper sheet-kds" data-ui>
          <div class="kds-sheet-header">
            <div>
              <span class="kds-sheet-title">Comanda Cozinha</span>
              <span class="kds-sheet-ref">#1042 · Mesa 4</span>
            </div>
            <span class="kds-sheet-time">11:42</span>
          </div>
          <div class="kds-sheet-divider"></div>
          <div class="kds-sheet-body">
            <div class="kds-dish-preview-row">
              <img src="/assets/feijoada_flow.jpg" alt="Feijoada Nobre" class="kds-dish-thumb" />
              <div class="kds-dish-meta-info">
                <span class="kds-dish-badge">Prato Principal</span>
                <strong class="kds-dish-heading">1× Marmita M · Feijoada Nobre</strong>
              </div>
            </div>
            <ul class="kds-ingredients-list">
              <li>Proteína: Feijoada Completa com carnes nobres</li>
              <li>Base: Arroz branco fresquinho</li>
              <li>Feijão: Caldo encorpado de feijão preto</li>
              <li>Acompanhamento: Couve manteiga refogada e farofa</li>
              <li class="kds-obs-highlight">Obs: Sem cebola no refogado</li>
            </ul>
          </div>
          <div class="kds-sheet-divider"></div>
          <div class="kds-sheet-footer">
            <span class="kds-pix-status">Demonstração · pagamento simulado</span>
            <span class="kds-status-badge">Pronto para preparo</span>
          </div>
        </div>
      `;
    } else if (activeSheet === 'display') {
      target.innerHTML = `
        <div class="sheet-paper sheet-display" data-ui>
          <div class="display-stand-inner">
            <span class="stand-store-name">Marmita Flow Oficial</span>
            <span class="stand-tagline">Cardápio digital na mesa</span>
            <div class="stand-qr-box" id="stand-qr-canvas-holder">
              <canvas id="stand-qr-canvas"></canvas>
            </div>
            <p class="stand-instructions">Aponte a câmera do seu celular para abrir o cardápio e pagar no Pix.</p>
          </div>
        </div>
      `;
      setTimeout(() => {
        const canvas = target.querySelector('#stand-qr-canvas');
        if (canvas) {
          QRCode.toCanvas(canvas, restaurantMenuUrl('marmita-flow'), {
            width: 160,
            margin: 1,
            color: { dark: '#111111', light: '#ffffff' }
          });
        }
      }, 20);
    } else if (activeSheet === 'pix') {
      target.innerHTML = `
        <div class="sheet-paper sheet-pix" data-ui>
          <div class="pix-confirm-header">
            <span class="pix-confirm-status">Exemplo de confirmação Pix · simulação</span>
            <span class="pix-confirm-value">R$ 24,00</span>
          </div>
          <div class="pix-confirm-details">
            <div class="pix-line"><span>Destinatário:</span> <strong>Restaurante Marmita Flow</strong></div>
            <div class="pix-line"><span>Chave Pix:</span> <strong>marmitaflow@banco.com.br</strong></div>
            <div class="pix-line"><span>Transação ID:</span> <strong>E9048102938102938102</strong></div>
            <div class="pix-line"><span>Taxa de intermediação:</span> <strong>R$ 0,00 (0%)</strong></div>
            <div class="pix-line"><span>Liquidação:</span> <strong>Instantânea na sua conta</strong></div>
          </div>
        </div>
      `;
    }
  }

  // Renderizador do Simulador (The Live Thing)
  function renderLiveTicket() {
    const ticketTarget = container.querySelector('#live-ticket-preview');
    if (!ticketTarget) return;

    const dishPhotos = {
      'Feijoada Nobre': '/assets/feijoada_flow.jpg',
      'Frango Grelhado': '/assets/frango_grelhado.jpg',
      'Salmão Executivo': '/assets/salmao_orange.jpg'
    };
    const currentPhoto = dishPhotos[simState.protein] || '/assets/feijoada_flow.jpg';

    ticketTarget.innerHTML = `
      <div class="ticket-header-strip">
        <span class="ticket-title">Comanda Digital ao Vivo</span>
        <span class="ticket-id">#901 · Balcão</span>
      </div>
      <div class="ticket-dish-preview">
        <img src="${currentPhoto}" alt="${simState.protein}" class="ticket-dish-img" />
        <div class="ticket-dish-info">
          <span class="ticket-dish-badge">Prato Selecionado</span>
          <span class="ticket-dish-name">${simState.protein}</span>
        </div>
      </div>
      <div class="ticket-main-item">
        <span class="ticket-item-name">Marmita Tamanho ${simState.size}</span>
        <span class="ticket-item-val">R$ ${simState.price.toFixed(2).replace('.', ',')}</span>
      </div>
      <div class="ticket-details-box">
        <div class="ticket-detail-line"><strong>Proteína:</strong> ${simState.protein}</div>
        <div class="ticket-detail-line"><strong>Base:</strong> ${simState.base}</div>
        <div class="ticket-detail-line"><strong>Observação:</strong> ${simState.notes}</div>
      </div>
      <div class="ticket-footer-strip">
        <span>Total a pagar via Pix</span>
        <strong class="ticket-price-val">R$ ${simState.price.toFixed(2).replace('.', ',')}</strong>
      </div>
    `;
  }

  // Renderizador das Etapas (How It Works)
  function renderStageContent() {
    const stageTarget = container.querySelector('#stage-display-content');
    if (!stageTarget) return;

    const stagesData = [
      {
        num: 1,
        title: "Cadastre seus pratos e sua chave Pix",
        desc: "Defina os tamanhos de marmita, proteínas do dia, feijões, acompanhamentos e informe sua chave Pix para receber os pagamentos sem intermediários.",
        uiPreview: `
          <div class="stage-sample-row">
            <span>Chave Pix registrada:</span>
            <strong>financeiro@suamarmitaria.com.br</strong>
          </div>
          <div class="stage-sample-row">
            <span>Taxa retida pela plataforma:</span>
            <strong>R$ 0,00 por pedido</strong>
          </div>
        `
      },
      {
        num: 2,
        title: "Imprima seu QR Code para balcão e WhatsApp",
        desc: "O sistema gera automaticamente o display de mesa pronto para impressão e o link curto para colocar na bio do Instagram e no WhatsApp.",
        uiPreview: `
          <div class="stage-sample-row">
            <span>Link do seu cardápio:</span>
            <strong>marmitaflow.pages.dev/#/cardapio/seu-restaurante</strong>
          </div>
          <div class="stage-sample-row">
            <span>Display impresso:</span>
            <strong>Pronto em formato A5 e display acrílico</strong>
          </div>
        `
      },
      {
        num: 3,
        title: "O cliente monta o pedido direto no celular",
        desc: "O cliente escolhe tamanho, base, proteína e adicionais passo a passo com fotos reais. Não há comandas rasuradas ou erros de anotação.",
        uiPreview: `
          <div class="stage-sample-row">
            <span>Passo 1: Tamanho</span>
            <strong>Marmita M (700g)</strong>
          </div>
          <div class="stage-sample-row">
            <span>Passo 2: Proteína</span>
            <strong>Feijoada Completa com Couve</strong>
          </div>
        `
      },
      {
        num: 4,
        title: "A cozinha recebe o pedido em tempo real",
        desc: "Os pedidos caem instantaneamente no monitor da cozinha com sinal sonoro e checklist de montagem, organizados por ordem de chegada.",
        uiPreview: `
          <div class="stage-sample-row">
            <span>Notificação sonora:</span>
            <strong>Alerta de novo pedido emitido na hora</strong>
          </div>
          <div class="stage-sample-row">
            <span>Status da esteira:</span>
            <strong>Aguardando Preparo → Em Montagem → Concluído</strong>
          </div>
        `
      }
    ];

    const current = stagesData[activeStage - 1];
    stageTarget.innerHTML = `
      <div class="stage-info-column">
        <span class="stage-index-badge">Etapa ${current.num} de 4</span>
        <h3 class="stage-title">${current.title}</h3>
        <p class="stage-desc">${current.desc}</p>
      </div>
      <div class="stage-preview-column">
        ${current.uiPreview}
      </div>
    `;
  }

  // Inicializar renderizações dinâmicas
  renderShowcaseSheet();
  renderLiveTicket();
  renderStageContent();

  // Eventos do Showcase
  container.querySelectorAll('.showcase-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.showcase-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSheet = btn.dataset.sheet;
      renderShowcaseSheet();
    });
  });

  // Eventos do Simulador (The Live Thing)
  container.querySelectorAll('#control-sizes .segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#control-sizes .segment-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      simState.size = btn.dataset.size;
      simState.price = parseInt(btn.dataset.price, 10);
      renderLiveTicket();
    });
  });

  container.querySelectorAll('#control-proteins .segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#control-proteins .segment-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      simState.protein = btn.dataset.protein;
      renderLiveTicket();
    });
  });

  container.querySelectorAll('#control-bases .segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#control-bases .segment-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      simState.base = btn.dataset.base;
      renderLiveTicket();
    });
  });

  container.querySelectorAll('#control-notes .segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#control-notes .segment-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      simState.notes = btn.dataset.note;
      renderLiveTicket();
    });
  });

  // Eventos das Etapas
  container.querySelectorAll('.stage-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.stage-nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStage = parseInt(btn.dataset.stage, 10);
      renderStageContent();
    });
  });

  // Eventos de Navegação
  container.querySelector('#btn-hero-create-rest')?.addEventListener('click', () => navigateTo('criar-restaurante'));
  container.querySelector('#btn-bottom-create-rest')?.addEventListener('click', () => navigateTo('criar-restaurante'));
  container.querySelector('#btn-hero-login-admin')?.addEventListener('click', () => navigateTo('admin'));

  container.querySelectorAll('.btn-visit-rest').forEach(btn => {
    btn.addEventListener('click', () => {
      const slug = btn.dataset.slug;
      navigateTo('cardapio', slug);
    });
  });
}
