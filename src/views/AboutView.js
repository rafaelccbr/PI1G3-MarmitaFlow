// MarmitaFlow - Página Institucional Sobre o Projeto e Equipe Acadêmica
import { store } from '../store.js';

export function renderAboutView(container, navigateTo) {
  container.innerHTML = `
    <div class="about-container">
      
      <!-- HERO INSTITUCIONAL -->
      <section class="about-hero">
        <div class="about-hero-badge">
          <span>🎓 Projeto Acadêmico Integrador</span>
        </div>
        <h1 class="about-title">
          A revolução digital das marmitarias e restaurantes.
        </h1>
        <p class="about-subtitle">
          Nascido da necessidade real do setor gastronômico de eliminar comandas de papel amassadas, cardápios rasurados e erros de pedidos. O <strong>MarmitaFlow</strong> unifica pedido, estoque, pagamento e cozinha em uma experiência fluida.
        </p>
      </section>

      <!-- OS PILARES DO MARMITAFLOW -->
      <section class="about-pillars-grid">
        <div class="pillar-card">
          <div class="pillar-icon">📄🚫</div>
          <h3>Zero Rasuras & Menus Físicos</h3>
          <p>
            Alimentos e insumos mudam diariamente. Com o MarmitaFlow, o proprietário pausa itens esgotados com 1 clique e altera preços em tempo real, sem reimpressões caras.
          </p>
        </div>

        <div class="pillar-card">
          <div class="pillar-icon">🍱⚡</div>
          <h3>Montagem Guiada Inteligente</h3>
          <p>
            O cliente monta a marmita passo a passo: tamanho, proteína, base de arroz, feijão, guarnições e adicionais. Adeus pedidos truncados por áudio de WhatsApp.
          </p>
        </div>

        <div class="pillar-card">
          <div class="pillar-icon">💰📱</div>
          <h3>Pix Direto na Conta do Dono</h3>
          <p>
            Geração instantânea de QR Code dinâmico e código copia-e-cola. O dinheiro vai direto para a chave Pix do proprietário, sem intermediários ou taxas abusivas por transação.
          </p>
        </div>

        <div class="pillar-card">
          <div class="pillar-icon">👨‍🍳📋</div>
          <h3>Comanda Digital na Cozinha (KDS)</h3>
          <p>
            Os pedidos caem instantaneamente na tela da cozinha com checklist de itens, aviso sonoro e controle de status: Recebido ➔ Em Preparo ➔ Pronto ➔ Entregue.
          </p>
        </div>
      </section>

      <!-- RESTAURANTE CONCEITO: MARMITA FLOW -->
      <section class="flagship-story-card">
        <div class="flagship-story-content">
          <span class="story-tag">O Restaurante Modelo</span>
          <h2>Conheça o Marmita Flow Oficial</h2>
          <p>
            O <strong>Marmita Flow</strong> é o nosso restaurante modelo operando dentro da plataforma SaaS. Ele demonstra na prática como uma marmitaria de alta demanda gerencia seus pratos diários (como a famosa Feijoada Completa e o Frango Fit), oferece personalização aos clientes e otimiza sua operação com zero atrito.
          </p>
          <div class="story-actions">
            <button class="btn-primary" id="btn-about-visit-mf">
              🍱 Acessar Cardápio do Marmita Flow
            </button>
            <button class="btn-secondary" id="btn-about-create-rest">
              ✨ Quero Abrir Meu Restaurante
            </button>
          </div>
        </div>
        <div class="flagship-story-media">
          <img src="/assets/feijoada_flow.jpg" alt="Marmita Flow Prato Oficial" />
        </div>
      </section>

      <!-- EQUIPE DO PROJETO -->
      <section class="team-section">
        <div class="section-header" style="text-align: center; margin-bottom: 32px;">
          <h2 style="font-size: 1.8rem; font-weight: 800; color: #1E293B;">Equipe de Desenvolvimento</h2>
          <p style="color: #64748B; font-size: 1rem;">Estudantes responsáveis pela concepção, UX/UI e arquitetura do MarmitaFlow</p>
        </div>

        <div class="team-grid">
          <div class="team-card">
            <div class="team-avatar">VS</div>
            <h4>Vinícius Spejo da Silva</h4>
            <span class="team-role">Desenvolvimento & Produto</span>
          </div>

          <div class="team-card featured">
            <div class="team-avatar highlight">RM</div>
            <h4>Rafael Miquelin</h4>
            <span class="team-role">Arquitetura de Software & Full Stack</span>
          </div>

          <div class="team-card">
            <div class="team-avatar">MN</div>
            <h4>Matheus Nery</h4>
            <span class="team-role">UX/UI & Design System</span>
          </div>

          <div class="team-card">
            <div class="team-avatar">JS</div>
            <h4>João Vitor dos Santos</h4>
            <span class="team-role">Qualidade & Regras de Negócio</span>
          </div>
        </div>
      </section>

      <!-- TECNOLOGIAS UTILIZADAS -->
      <section class="tech-stack-card">
        <h3>Tecnologias & Arquitetura Utilizada</h3>
        <div class="tech-tags">
          <span class="tech-tag">JavaScript Moderno (ES6+)</span>
          <span class="tech-tag">Vite & HMR</span>
          <span class="tech-tag">Vanilla CSS Modular</span>
          <span class="tech-tag">Web Audio API (Sons de Cozinha)</span>
          <span class="tech-tag">QRCode Generator Dinâmico</span>
          <span class="tech-tag">Canvas Confetti</span>
          <span class="tech-tag">Multi-Tenant Reactive Store</span>
          <span class="tech-tag">LocalStorage Persistence</span>
        </div>
      </section>

      <!-- CTA FINAL -->
      <div class="about-cta-footer">
        <h2>Pronto para transformar a gestão de cardápios?</h2>
        <p>Crie um restaurante independente ou faça um pedido demonstrativo agora mesmo.</p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
          <button class="btn-primary" id="btn-cta-create">Cadastrar Restaurante</button>
          <button class="btn-secondary" id="btn-cta-explore">Ver Todos os Restaurantes</button>
        </div>
      </div>

    </div>
  `;

  // Listeners
  container.querySelector('#btn-about-visit-mf')?.addEventListener('click', () => {
    navigateTo('cardapio', 'marmita-flow');
  });

  container.querySelector('#btn-about-create-rest')?.addEventListener('click', () => {
    navigateTo('criar-restaurante');
  });

  container.querySelector('#btn-cta-create')?.addEventListener('click', () => {
    navigateTo('criar-restaurante');
  });

  container.querySelector('#btn-cta-explore')?.addEventListener('click', () => {
    navigateTo('plataforma');
  });
}
