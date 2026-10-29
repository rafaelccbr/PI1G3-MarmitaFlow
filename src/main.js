// MarmitaFlow - Entrada Principal com Roteamento Hash e Multi-Tenant
import './style.css';
import './refinements.css';
import { setupAccessibility, escapeHTML, clearRestaurantTheme, asyncAction } from './ui.js';
import { store, STORAGE_KEYS } from './store.js';
import { sounds } from './audio.js';

// Importação das Telas Independentes
import { renderPlatformHome } from './views/PlatformHome.js';
import { renderRestaurantMenu, resetMenuState } from './views/RestaurantMenu.js';
import { renderAdminDashboard } from './views/AdminDashboard.js';
import { renderAdminLogin } from './views/AdminLogin.js';
import { renderCreateRestaurant } from './views/CreateRestaurant.js';
import { renderKitchenView } from './views/KitchenView.js';
import { renderAboutView } from './views/AboutView.js';

let prevOrderCount = store.orders.length;

export function navigateTo(route, param) {
  if (route === 'cardapio') {
    window.location.hash = `#/cardapio/${param || 'marmita-flow'}`;
  } else if (route === 'cozinha') {
    window.location.hash = `#/cozinha/${param || 'marmita-flow'}`;
  } else if (route === 'plataforma') {
    window.location.hash = '#/plataforma';
  } else {
    window.location.hash = `#/${route}`;
  }
}

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '') || 'plataforma';
  const parts = hash.split('/').filter(Boolean);
  return {
    route: parts[0] || 'plataforma',
    param: parts[1] || null
  };
}

function initApp() {
  const app = document.getElementById('app');

  // Estrutura do App: Header Global + Área de Conteúdo
  app.innerHTML = `
    <!-- Topbar Global do MarmitaFlow -->
    <header class="app-header" id="global-header">
      <div class="header-inner">
        <a class="brand-badge" id="nav-brand-click" href="#/plataforma" aria-label="MarmitaFlow — início">
          <img src="/assets/mascote_flow.jpg" alt="MarmitaFlow Logo" />
          <div class="brand-text">
            <span class="brand-title">MarmitaFlow</span>
            <span class="brand-desc">Cardápios Digitais</span>
          </div>
        </a>

        <button class="mobile-nav-toggle btn-secondary" id="mobile-nav-toggle" aria-controls="nav-tabs-bar" aria-expanded="false">Menu <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M2 4h12M2 8h12M2 12h12"/></svg></button>

        <nav class="nav-tabs" id="nav-tabs-bar" aria-label="Navegação principal">
          <button class="nav-tab-btn" data-target="plataforma">
            Início
          </button>
          <button class="nav-tab-btn" data-target="marmita-flow">
            Ver demonstração
          </button>
          <button class="nav-tab-btn" data-target="criar-restaurante">
            Criar cardápio
          </button>
          <button class="nav-tab-btn" data-target="sobre">
            Sobre o Projeto
          </button>
        </nav>

        <div class="header-actions" id="header-actions-area">
          <!-- Renderizado dinamicamente com base na autenticação -->
        </div>
      </div>
    </header>

    <!-- Área de Exibição da Página Ativa -->
    <main id="view-root" tabindex="-1"></main>
  `;

  // Eventos de Navegação do Header
  app.querySelector('#nav-brand-click')?.addEventListener('click', () => navigateTo('plataforma'));
  const menuToggle = app.querySelector('#mobile-nav-toggle');
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(expanded));
    app.querySelector('#nav-tabs-bar').classList.toggle('is-open', expanded);
  });
  setupAccessibility(app.querySelector('#view-root'));
  document.querySelector('.skip-link')?.addEventListener('click', event => {
    event.preventDefault();
    const content = app.querySelector('#view-root');
    content.focus();
    content.scrollIntoView();
  });

  app.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target === 'marmita-flow') {
        navigateTo('cardapio', 'marmita-flow');
      } else {
        navigateTo(target);
      }
    });
  });

  // Atualizar Header & Renderizar rota ativa
  updateHeaderUI();
  renderActiveRoute();

  // Escuta alteração da rota na URL (hashchange)
  window.addEventListener('hashchange', () => {
    resetMenuState();
    menuToggle.setAttribute('aria-expanded', 'false');
    app.querySelector('#nav-tabs-bar').classList.remove('is-open');
    updateHeaderUI();
    renderActiveRoute();
    document.getElementById('view-root').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  });

  // Reatividade a mudanças no Store
  store.subscribe(() => {
    if (store.orders.length > prevOrderCount) {
      sounds.playNewOrderSound();
    }
    prevOrderCount = store.orders.length;
    updateHeaderUI();
    if (parseHash().route === 'cozinha') renderActiveRoute();
  });

  window.addEventListener('storage', (event) => {
    if (!Object.values(STORAGE_KEYS).includes(event.key) && event.key !== null) return;
    store.loadState();
    store.notify();
    const { route } = parseHash();
    if (route === 'cardapio' && !document.querySelector('input:focus, textarea:focus')) renderActiveRoute();
    if (route === 'admin' && !store.getLoggedRestaurant()) navigateTo('admin-login');
  });
  window.addEventListener('marmitaflow:sync', () => {
    const { route } = parseHash();
    if (['admin', 'cozinha'].includes(route) && !store.getLoggedRestaurant()) {
      navigateTo('admin-login');
      return;
    }
    const editing = document.querySelector('input:focus, textarea:focus, select:focus, #modal-cart-overlay, #modal-checkout-overlay, #modal-customization-overlay');
    if (!editing && ['plataforma', 'cardapio'].includes(route)) renderActiveRoute();
  });
}

function updateHeaderUI() {
  const { route, param } = parseHash();
  document.getElementById('global-header').hidden = route === 'cardapio';
  const loggedRest = store.getLoggedRestaurant();
  const actionsArea = document.getElementById('header-actions-area');

  // Atualizar abas ativas
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    const target = btn.dataset.target;
    let isActive = false;
    if (target === 'plataforma' && (route === 'plataforma' || route === '')) isActive = true;
    else if (target === 'marmita-flow' && route === 'cardapio' && (param === 'marmita-flow' || !param)) isActive = true;
    else if (target === 'criar-restaurante' && route === 'criar-restaurante') isActive = true;
    else if (target === 'sobre' && route === 'sobre') isActive = true;
    btn.classList.toggle('active', isActive);
    if (isActive) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });

  // Ações do cabeçalho
  if (actionsArea) {
    if (store.auth.loggedIn && loggedRest) {
      actionsArea.innerHTML = `
        <button class="btn-primary" id="btn-hdr-admin" style="font-size: 0.85rem; padding: 8px 16px;">
          Painel: ${escapeHTML(loggedRest.name)}
        </button>
        <button class="btn-secondary" id="btn-hdr-logout" style="font-size: 0.85rem; padding: 8px 14px; color: var(--color-danger);">
          Sair
        </button>
      `;
      actionsArea.querySelector('#btn-hdr-admin')?.addEventListener('click', () => navigateTo('admin'));
      actionsArea.querySelector('#btn-hdr-logout')?.addEventListener('click', asyncAction(async () => {
        await store.logoutAdmin();
        navigateTo('admin-login');
      }));
    } else {
      actionsArea.innerHTML = `
        <button class="btn-secondary" id="btn-hdr-login" style="font-size: 0.85rem; padding: 8px 16px;">
          Área do Dono
        </button>
        <button class="btn-primary" id="btn-hdr-create" style="font-size: 0.85rem; padding: 8px 16px;">
          Criar meu cardápio
        </button>
      `;
      actionsArea.querySelector('#btn-hdr-login')?.addEventListener('click', () => navigateTo('admin-login'));
      actionsArea.querySelector('#btn-hdr-create')?.addEventListener('click', () => navigateTo('criar-restaurante'));
    }
  }
}

function renderActiveRoute() {
  const viewRoot = document.getElementById('view-root');
  if (!viewRoot) return;

  const { route, param } = parseHash();
  document.documentElement.style.removeProperty('--color-primary');
  document.documentElement.style.removeProperty('--color-secondary');
  clearRestaurantTheme(viewRoot);
  document.body.dataset.page = route;
  const titles = { plataforma: 'Cardápios digitais para restaurantes', cardapio: 'Cardápio', admin: 'Painel do restaurante', 'admin-login': 'Área do dono', 'criar-restaurante': 'Criar meu cardápio', cozinha: 'Cozinha', sobre: 'Sobre o projeto' };
  document.title = `${titles[route] || titles.plataforma} | MarmitaFlow`;

  switch (route) {
    case 'plataforma':
      renderPlatformHome(viewRoot, navigateTo);
      break;

    case 'cardapio':
      renderRestaurantMenu(viewRoot, navigateTo, param || 'marmita-flow');
      break;

    case 'admin':
      if (!store.auth.loggedIn || !store.auth.restaurantId) {
        navigateTo('admin-login');
        return;
      }
      renderAdminDashboard(viewRoot, navigateTo);
      break;

    case 'admin-login':
      renderAdminLogin(viewRoot, navigateTo);
      break;

    case 'criar-restaurante':
      renderCreateRestaurant(viewRoot, navigateTo);
      break;

    case 'cozinha':
      if (!store.getLoggedRestaurant() || store.getLoggedRestaurant().slug !== param) {
        navigateTo('admin-login');
        return;
      }
      renderKitchenView(viewRoot, navigateTo, param || 'marmita-flow');
      break;

    case 'sobre':
      renderAboutView(viewRoot, navigateTo);
      break;

    default:
      renderPlatformHome(viewRoot, navigateTo);
      break;
  }
}

// Inicializar quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', async () => {
  const app = document.getElementById('app');
  app.textContent = 'Carregando o cardápio…';
  try {
    await store.connect();
    prevOrderCount = store.orders.length;
    initApp();
  } catch (error) {
    app.innerHTML = '<main class="auth-card"><h1>Não foi possível carregar o cardápio</h1><p id="connection-error" role="alert"></p><button class="btn-primary" id="retry-connection">Tentar novamente</button></main>';
    document.getElementById('connection-error').textContent = error.message;
    document.getElementById('retry-connection').onclick = () => location.reload();
  }
});
