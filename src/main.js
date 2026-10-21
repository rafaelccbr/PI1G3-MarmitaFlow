// MarmitaFlow - Entrada Principal com Roteamento Hash e Multi-Tenant
import './style.css';
import { store } from './store.js';
import { sounds } from './audio.js';

// Importação das Telas Independentes
import { renderPlatformHome } from './views/PlatformHome.js';
import { renderRestaurantMenu } from './views/RestaurantMenu.js';
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
      <div class="brand-badge" id="nav-brand-click">
        <img src="/assets/mascote_flow.jpg" alt="MarmitaFlow Logo" />
        <div class="brand-text">
          <h1>Marmita<span>Flow</span></h1>
          <p>Plataforma de Cardápios Digitais</p>
        </div>
      </div>

      <nav class="nav-tabs" id="nav-tabs-bar">
        <button class="nav-tab-btn" data-target="plataforma">
          🌐 Início (Plataforma)
        </button>
        <button class="nav-tab-btn" data-target="marmita-flow">
          🍱 Marmita Flow (Oficial)
        </button>
        <button class="nav-tab-btn" data-target="criar-restaurante">
          ✨ Abrir Restaurante
        </button>
        <button class="nav-tab-btn" data-target="sobre">
          🎓 Sobre o Projeto
        </button>
      </nav>

      <div class="header-actions" id="header-actions-area">
        <!-- Renderizado dinamicamente com base na autenticação -->
      </div>
    </header>

    <!-- Área de Exibição da Página Ativa -->
    <main id="view-root"></main>
  `;

  // Eventos de Navegação do Header
  app.querySelector('#nav-brand-click')?.addEventListener('click', () => navigateTo('plataforma'));

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
    updateHeaderUI();
    renderActiveRoute();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Reatividade a mudanças no Store
  store.subscribe(() => {
    if (store.orders.length > prevOrderCount) {
      sounds.playNewOrderSound();
    }
    prevOrderCount = store.orders.length;
    updateHeaderUI();
  });
}

function updateHeaderUI() {
  const { route, param } = parseHash();
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
  });

  // Ações do cabeçalho
  if (actionsArea) {
    if (store.auth.loggedIn && loggedRest) {
      actionsArea.innerHTML = `
        <button class="btn-primary" id="btn-hdr-admin" style="font-size: 0.85rem; padding: 8px 16px;">
          ⚙️ Painel: ${loggedRest.name}
        </button>
        <button class="btn-secondary" id="btn-hdr-logout" style="font-size: 0.85rem; padding: 8px 14px; color: var(--color-danger);">
          Sair
        </button>
      `;
      actionsArea.querySelector('#btn-hdr-admin')?.addEventListener('click', () => navigateTo('admin'));
      actionsArea.querySelector('#btn-hdr-logout')?.addEventListener('click', () => {
        store.logoutAdmin();
        navigateTo('admin-login');
      });
    } else {
      actionsArea.innerHTML = `
        <button class="btn-secondary" id="btn-hdr-login" style="font-size: 0.85rem; padding: 8px 16px;">
          🔐 Área do Dono
        </button>
        <button class="btn-primary" id="btn-hdr-create" style="font-size: 0.85rem; padding: 8px 16px;">
          ✨ Cadastrar Loja
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
window.addEventListener('DOMContentLoaded', () => {
  initApp();
});
