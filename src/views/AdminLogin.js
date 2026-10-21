// MarmitaFlow - Login do Administrador do Restaurante (Área Restrita)
import { store } from '../store.js';

export function renderAdminLogin(container, navigateTo) {
  // Se já estiver logado, redireciona diretamente para o painel
  if (store.auth.loggedIn && store.auth.restaurantId) {
    navigateTo('admin');
    return;
  }

  container.innerHTML = `
    <div class="auth-page-container auth-layout">
      <aside class="auth-intro">
        <p class="intro-label">Sua operação, em um só lugar</p>
        <h2>Mais tempo para<br>o que sai da cozinha.</h2>
        <p>Atualize o cardápio, acompanhe os pedidos e organize o preparo. Entre para cuidar do seu restaurante.</p>
        <img src="/assets/feijoada_flow.jpg" alt="Feijoada com arroz, couve e acompanhamentos" width="600" height="400" />
      </aside>
      <div class="auth-card">
        
        <div class="auth-header">
          <div class="auth-logo-badge">
            <span>🔐</span>
          </div>
          <h1>Bem-vindo de volta.</h1>
          <p>Acesse o painel administrativo exclusivo do seu restaurante</p>
        </div>

        <form id="admin-login-form" class="auth-form">
          <div id="login-error-alert" class="login-error-alert" role="alert" style="display: none;"></div>

          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label">E-mail do Administrador</label>
            <input 
              type="email" 
              autocomplete="username"
              id="admin-email-input" 
              class="form-input" 
              placeholder="exemplo@restaurante.com" 
              value="admin@marmitaflow.com" 
              required 
            />
          </div>

          <div class="form-group" style="margin-bottom: 24px;">
            <label class="form-label">Senha de Acesso</label>
            <input 
              type="password" 
              autocomplete="current-password"
              id="admin-pass-input" 
              class="form-input" 
              placeholder="••••••••" 
              value="123456" 
              required 
            />
          </div>

          <button type="submit" class="btn-primary" style="width: 100%; padding: 12px; font-size: 1rem;">
            Entrar no painel →
          </button>
        </form>

        <!-- Atalhos rápidos para testar a demonstração -->
        <div class="demo-logins-box">
          <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px;">
            Explore uma conta de demonstração
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="btn-secondary btn-quick-login" data-email="admin@marmitaflow.com" data-pass="123456" style="justify-content: flex-start; text-align: left;">
              🍱 <strong>Marmita Flow</strong> (admin@marmitaflow.com)
            </button>
            <button class="btn-secondary btn-quick-login" data-email="nona@cantina.com" data-pass="123456" style="justify-content: flex-start; text-align: left;">
              🍝 <strong>Cantina da Nona</strong> (nona@cantina.com)
            </button>
          </div>
        </div>

        <div class="auth-footer-links">
          <span>Ainda não cadastrou seu restaurante?</span>
          <button class="link-btn" id="btn-go-register">Cadastre seu restaurante grátis →</button>
        </div>

      </div>
    </div>
  `;

  // Listener de Submit
  container.querySelector('#admin-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = container.querySelector('#admin-email-input').value;
    const pass = container.querySelector('#admin-pass-input').value;

    const res = store.loginAdmin(email, pass);
    if (res.success) {
      navigateTo('admin');
    } else {
      const alert = container.querySelector('#login-error-alert');
      if (alert) {
        alert.textContent = res.message || 'Dados inválidos. Verifique e-mail e senha.';
        alert.style.display = 'block';
      }
    }
  });

  // Atalhos rápidos
  container.querySelectorAll('.btn-quick-login').forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.dataset.email;
      const pass = btn.dataset.pass;
      container.querySelector('#admin-email-input').value = email;
      container.querySelector('#admin-pass-input').value = pass;
      
      const res = store.loginAdmin(email, pass);
      if (res.success) {
        navigateTo('admin');
      }
    });
  });

  container.querySelector('#btn-go-register')?.addEventListener('click', () => navigateTo('criar-restaurante'));
}
