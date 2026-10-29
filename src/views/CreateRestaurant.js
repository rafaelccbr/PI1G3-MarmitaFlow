// MarmitaFlow - Cadastro de Novo Restaurante Independente
import { store } from '../store.js';

const PRESET_COLORS = [
  { name: 'Laranja Clássico', hex: '#FF6B00' },
  { name: 'Vermelho Brasa', hex: '#DC2626' },
  { name: 'Verde Salada & Saúde', hex: '#059669' },
  { name: 'Azul Bistrô Marinho', hex: '#0284C7' },
  { name: 'Roxo Poke & Açaí', hex: '#7C3AED' },
  { name: 'Amarelo Ouro', hex: '#D97706' },
  { name: 'Dark Sofisticado', hex: '#0F172A' }
];

let selectedColor = '#FF6B00';

export function renderCreateRestaurant(container, navigateTo) {
  selectedColor = '#FF6B00';
  container.innerHTML = `
    <div class="auth-page-container" style="max-width: 780px;">
      <div class="auth-card" style="max-width: 100%;">
        
        <div class="auth-header">
          <div class="auth-logo-badge">
            <span>✨</span>
          </div>
          <h1>Seu restaurante no digital.</h1>
          <p>Crie seu cardápio digital independente em minutos na plataforma MarmitaFlow</p>
        </div>

        <form id="create-restaurant-form" class="auth-form">
          <p class="demo-notice">Seu restaurante e seus pedidos são salvos no servidor. Os pagamentos desta versão continuam demonstrativos.</p>
          <div id="register-error" class="login-error-alert" role="alert" hidden></div>
          <div style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: var(--color-primary); letter-spacing: 1px; margin-bottom: 12px;">
            1. Dados do Seu Estabelecimento
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Nome do Restaurante / Marmitaria</label>
              <input type="text" id="new-rest-name" class="form-input" placeholder="Ex: Sabor & Saúde Marmitas" required />
            </div>

            <div class="form-group">
              <label class="form-label">Seu Nome Completo (Proprietário)</label>
              <input type="text" id="new-rest-owner" class="form-input" placeholder="Ex: Carlos Eduardo Silva" required />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">WhatsApp para Pedidos</label>
              <input type="tel" autocomplete="tel" id="new-rest-phone" class="form-input" placeholder="(11) 99876-5432" required />
            </div>

            <div class="form-group">
              <label class="form-label">Sua Chave Pix (Para receber pagamentos)</label>
              <input type="text" id="new-rest-pix" class="form-input" placeholder="CNPJ, Celular ou E-mail Pix" required />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Endereço da Loja ou Bairro</label>
              <input type="text" id="new-rest-address" class="form-input" placeholder="Rua das Flores, 120 - Centro" required />
            </div>

            <div class="form-group">
              <label class="form-label">Taxa de Entrega Padrão (R$)</label>
              <input type="number" min="0" step="0.01" id="new-rest-fee" class="form-input" value="4.00" required />
            </div>
          </div>

          <!-- Cor da Marca -->
          <div class="form-group" style="margin: 16px 0 24px;">
            <label class="form-label">Escolha a Cor Principal da Sua Marca</label>
            <div class="color-picker-grid">
              ${PRESET_COLORS.map(c => `
                <button 
                  type="button" 
                  class="color-swatch-btn ${selectedColor.toUpperCase() === c.hex.toUpperCase() ? 'active' : ''}" 
                  style="background: ${c.hex};" 
                  data-hex="${c.hex}" 
                  title="${c.name}"
                ></button>
              `).join('')}
              
              <label class="custom-color-button" title="Clique para escolher qualquer cor">
                <input type="color" id="new-custom-color" value="${selectedColor}" />
                <span>🎨 Outra cor</span>
              </label>
            </div>
          </div>

          <div style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: var(--color-primary); letter-spacing: 1px; margin-bottom: 12px; border-top: 1px solid var(--border-color); padding-top: 18px;">
            2. Criar Acesso do Administrador
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">E-mail para Acessar seu Painel</label>
              <input type="email" autocomplete="username" id="new-admin-email" class="form-input" placeholder="dono@meurestaurante.com" required />
            </div>

            <div class="form-group">
              <label class="form-label">Crie uma Senha Segura</label>
              <input type="password" autocomplete="new-password" minlength="6" id="new-admin-pass" class="form-input" placeholder="No mínimo 6 caracteres" required />
            </div>
          </div>

          <button type="submit" class="btn-primary" style="width: 100%; padding: 14px; font-size: 1.05rem; margin-top: 24px;">
            🚀 Criar Restaurante & Abrir Meu Cardápio
          </button>
        </form>

        <div class="auth-footer-links">
          <span>Já tem uma conta de restaurante?</span>
          <button class="link-btn" id="btn-go-login">Fazer login no painel do dono →</button>
        </div>

      </div>
    </div>
  `;

  // Seletor de cores
  container.querySelectorAll('.color-swatch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedColor = btn.dataset.hex;
      container.querySelectorAll('.color-swatch-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.hex.toUpperCase() === selectedColor.toUpperCase());
      });
      const customColorInput = container.querySelector('#new-custom-color');
      if (customColorInput) customColorInput.value = selectedColor;
    });
  });

  const customColorInput = container.querySelector('#new-custom-color');
  customColorInput?.addEventListener('input', (e) => {
    selectedColor = e.target.value;
    container.querySelectorAll('.color-swatch-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.hex.toUpperCase() === selectedColor.toUpperCase());
    });
  });

  // Envio do formulário
  container.querySelector('#create-restaurant-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = container.querySelector('#new-rest-name').value.trim();
    const ownerName = container.querySelector('#new-rest-owner').value.trim();
    const phone = container.querySelector('#new-rest-phone').value;
    const pixKey = container.querySelector('#new-rest-pix').value;
    const address = container.querySelector('#new-rest-address').value;
    const deliveryFee = container.querySelector('#new-rest-fee').value;
    const adminEmail = container.querySelector('#new-admin-email').value;
    const adminPass = container.querySelector('#new-admin-pass').value;

    const error = container.querySelector('#register-error');
    error.hidden = true;
    if (!name || !ownerName || adminPass.trim().length < 6) {
      error.textContent = 'Preencha o nome do restaurante, seu nome e uma senha com pelo menos 6 caracteres.';
      error.hidden = false;
      return;
    }
    try {
      const submit = e.currentTarget.querySelector('[type="submit"]');
      if (submit.disabled) return;
      submit.disabled = true;
      await store.createRestaurant({
        name,
        ownerName,
        phone,
        pixKey,
        address,
        deliveryFee,
        primaryColor: selectedColor,
        adminEmail,
        adminPass
      });
    } catch (reason) {
      error.textContent = reason.message;
      error.hidden = false;
      return;
    } finally {
      const submit = container.querySelector('[type="submit"]');
      if (submit) submit.disabled = false;
    }

    // Redireciona diretamente para o painel de administração dele
    navigateTo('admin');
  });

  container.querySelector('#btn-go-login')?.addEventListener('click', () => navigateTo('admin-login'));
}
