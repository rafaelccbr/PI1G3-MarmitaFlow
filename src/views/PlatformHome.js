import { store } from '../store.js';
import { escapeHTML } from '../ui.js';
import { menuIcon } from '../menu-icons.js';
import '../platform-home.css';

export function renderPlatformHome(container, navigateTo) {
  const demo = store.getRestaurantBySlug('marmita-flow');
  const products = demo ? store.getProductsByRestaurant(demo.id).slice(0, 3) : [];
  const demoButton = (label, className = 'platform-text-link') => `<button type="button" class="${className}" data-home-action="demo" ${demo ? '' : 'disabled'}>${label} ${menuIcon('arrow')}</button>`;

  container.innerHTML = `
    <div class="platform-home">
      <section class="platform-board" aria-label="Crie o cardápio do seu restaurante">
        <div class="platform-intro platform-tile">
          <h1>Seu cardápio.<br>Sua marca.</h1>
          <p>O MarmitaFlow é a plataforma para criar o cardápio online do seu restaurante. Coloque sua marca, cadastre os pratos e receba os pedidos organizados na cozinha.</p>
          <div class="platform-main-actions">
            <button class="platform-primary" data-home-action="create">Criar meu cardápio ${menuIcon('arrow')}</button>
            ${demoButton('Ver demonstração')}
          </div>
        </div>

        <div class="platform-preview-tile platform-tile">
          <div class="preview-editor" data-ui>
            <label for="preview-restaurant-name">Como se chama seu restaurante?</label>
            <div class="preview-name-field"><input id="preview-restaurant-name" type="text" maxlength="60" placeholder="Digite o nome aqui" autocomplete="off"><span>${menuIcon('check')}</span></div>
            <p>Experimente o nome na prévia. O cadastro vem depois.</p>
          </div>
          <div class="platform-menu-preview" data-ui aria-label="Prévia ilustrativa de um cardápio">
            <div class="preview-menu-header">
              <img src="/assets/mascote_flow.jpg" width="48" height="48" alt="Mascote de exemplo">
              <div><strong id="preview-brand-name">Seu restaurante</strong><span>Seu cardápio, com a sua identidade.</span></div>
            </div>
            <div class="preview-menu-title"><span>Exemplos de pratos</span><span>Cardápio do cliente</span></div>
            ${products.length ? products.map(product => `
              <div class="preview-menu-dish">
                <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" width="72" height="72">
                <div><strong>${escapeHTML(product.name)}</strong><span>${escapeHTML(product.category)}</span><b>${product.isCustomizable ? 'A partir de ' : ''}R$ ${product.price.toFixed(2).replace('.', ',')}</b></div>
                <span class="preview-dish-plus" aria-hidden="true">${menuIcon('plus')}</span>
              </div>
            `).join('') : '<p class="preview-empty">Seu catálogo de pratos aparecerá aqui.</p>'}
            <div class="preview-menu-footer">${menuIcon('bag')} Uma experiência simples para quem pede.</div>
          </div>
        </div>

        <div class="platform-brand-tile platform-tile">
          <h2>A marca é sua.</h2>
          <p>Nome, cores, fotos e pratos do seu restaurante. O MarmitaFlow cuida da ferramenta.</p>
        </div>
        <div class="platform-link-tile platform-tile">
          <h2>Compartilhe.<br>Receba pedidos.</h2>
          <p>Um link para enviar aos clientes. Um QR Code para a mesa ou o balcão.</p>
        </div>
      </section>

      <section class="platform-operation platform-section">
        <div class="platform-section-intro">
          <h2>Seu cardápio.<br>Sua operação.</h2>
          <p>Da escolha do cliente à conferência da embalagem, cada parte tem seu lugar.</p>
        </div>
        <div class="platform-feature-list">
          <article><h3>Um cardápio que acompanha o dia.</h3><p>Atualize os pratos, os preços e a disponibilidade pelo painel. Acabou um item? Pause a opção para os próximos pedidos.</p></article>
          <article><h3>O cliente escolhe com clareza.</h3><p>Tamanhos, acompanhamentos, adicionais e observações ficam reunidos no pedido. Cada restaurante tem seu próprio endereço de cardápio.</p></article>
          <article><h3>A cozinha recebe tudo organizado.</h3><p>Acompanhe os pedidos por etapa e confira os itens antes de despachar. Cliente e cozinha consultam as atualizações em seus dispositivos.</p></article>
        </div>
      </section>

      <section class="platform-start platform-section">
        <div class="platform-section-intro"><h2>Do cadastro ao pedido.</h2><p>Configure uma vez. Atualize sempre que precisar.</p></div>
        <ol class="platform-start-steps">
          <li><h3>Crie seu acesso</h3><p>Cadastre o restaurante e entre no seu painel de gestão.</p></li>
          <li><h3>Deixe com a sua cara</h3><p>Escolha a identidade e organize seu catálogo de pratos.</p></li>
          <li><h3>Envie seu cardápio</h3><p>Compartilhe o link ou imprima o QR Code para seus clientes.</p></li>
          <li><h3>Cuide dos pedidos</h3><p>Receba na cozinha, prepare e confira antes da entrega.</p></li>
        </ol>
      </section>

      <section class="platform-demo platform-section" aria-labelledby="platform-demo-title">
        <div class="platform-demo-copy"><h2 id="platform-demo-title">Teste antes de criar.</h2><p>Abra o restaurante de demonstração para conhecer a experiência de quem faz um pedido. Ele é um exemplo do que você pode montar para o seu negócio.</p>${demoButton('Abrir cardápio de demonstração', 'platform-primary')}</div>
        <div class="platform-demo-note"><strong>Sua marca.<br>Nosso sistema.</strong><p>O MarmitaFlow oferece o sistema. Cada proprietário administra sua marca, seu cardápio e seus pedidos.</p><p class="platform-demo-disclosure">Projeto acadêmico em demonstração. Os pagamentos são simulados e não geram cobranças.</p></div>
      </section>

      <section class="platform-faq platform-section">
        <div class="platform-section-intro"><h2>Antes de começar.</h2><p>O que você precisa saber para experimentar a plataforma.</p></div>
        <div class="platform-questions">
          <details open><summary>O cardápio fica com o nome do meu restaurante?</summary><p>Sim. Você configura o nome, a identidade visual e os pratos no painel. Seus clientes acessam a página do seu restaurante pelo link que você compartilha.</p></details>
          <details><summary>Meu cliente precisa criar uma conta?</summary><p>Não. O cliente abre o cardápio, escolhe os itens e preenche os dados do pedido. O cadastro é para o proprietário administrar o restaurante.</p></details>
          <details><summary>Posso usar no celular e no computador?</summary><p>Sim. O cardápio se adapta ao celular. O painel e a cozinha também podem ser abertos no computador, com os dados compartilhados pelo servidor.</p></details>
          <details><summary>Pix e cartão já recebem pagamentos reais?</summary><p>Ainda não. Nesta versão acadêmica, o checkout demonstra o fluxo de pagamento. Nenhum valor é cobrado e a confirmação é simulada.</p></details>
        </div>
      </section>

      <section class="platform-final platform-section">
        <h2>Seu cardápio começa aqui.</h2><button class="platform-primary" data-home-action="create">Criar meu cardápio ${menuIcon('arrow')}</button>
      </section>
      <footer class="platform-footer">
        <div><span class="platform-footer-brand">MarmitaFlow</span><p>Cardápios digitais para restaurantes.<br>Projeto acadêmico integrador.</p></div>
        <nav aria-label="Links da plataforma"><a href="#/criar-restaurante">Criar meu cardápio</a><a href="#/admin-login">Acessar meu painel</a><a href="#/cardapio/marmita-flow">Ver demonstração</a><a href="#/sobre">Sobre o projeto</a></nav>
      </footer>
    </div>`;

  container.querySelectorAll('[data-home-action]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.homeAction === 'create') navigateTo('criar-restaurante');
    else if (demo) navigateTo('cardapio', demo.slug);
  }));
  container.querySelector('#preview-restaurant-name').addEventListener('input', event => {
    container.querySelector('#preview-brand-name').textContent = event.target.value.trim() || 'Seu restaurante';
  });

  // Content stays visible without animation or when reduced motion is requested.
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('platform-arrive');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12 });
    container.querySelectorAll('.platform-tile, .platform-feature-list article, .platform-start-steps li, .platform-demo-copy, .platform-demo-note, .platform-section-intro').forEach(element => observer.observe(element));
  }
}
