// MarmitaFlow - Cozinha Inteligente (KDS) por Restaurante
import { store } from '../store.js';
import { sounds } from '../audio.js';
import { asyncAction, escapeHTML } from '../ui.js';

export function renderKitchenView(container, navigateTo, slug = 'marmita-flow') {
  const restaurant = store.getRestaurantBySlug(slug);
  if (!restaurant) {
    navigateTo('plataforma');
    return;
  }

  const orders = store.getOrdersByRestaurant(restaurant.id);

  const colRecebidos = orders.filter(o => o.status === 'recebido');
  const colPreparo = orders.filter(o => o.status === 'preparo');
  const colProntos = orders.filter(o => o.status === 'pronto');
  const colEntregues = orders.filter(o => o.status === 'entregue');

  container.innerHTML = `
    <div class="kds-container">
      
      <!-- Cabeçalho do KDS -->
      <div class="kds-header">
        <div class="kds-title-group">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
            <button class="btn-secondary" id="btn-back-from-kds" style="background: var(--bg-surface); color: var(--text-secondary); border-color: var(--border-color); padding: 6px 14px; font-size: 0.82rem;">
              ← Voltar ao Painel
            </button>
            <h1>Cozinha · ${escapeHTML(restaurant.name)}</h1>
          </div>
          <p>Comandas em tempo real para produção e expedição com checklist de montagem.</p>
        </div>

        <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
          <div class="kds-stats-strip">
            <span class="kds-stat-pill" style="border-color: #F97316; color: var(--status-received);">
              ⚡ Pendentes: ${colRecebidos.length}
            </span>
            <span class="kds-stat-pill" style="border-color: #3B82F6; color: var(--status-info);">
              🍳 Preparando: ${colPreparo.length}
            </span>
            <span class="kds-stat-pill" style="border-color: var(--status-ready); color: var(--status-ready);">
              ✓ Prontos: ${colProntos.length}
            </span>
          </div>

          <button class="btn-secondary" id="btn-sound-test" style="background: var(--bg-surface); color: var(--text-secondary); border-color: var(--border-color);">
            🔔 Testar Sinal Sonoro
          </button>
        </div>
      </div>

      <!-- Colunas do KDS -->
      <div class="kds-columns-grid">
        
        <!-- COLUNA 1: NOVOS PEDIDOS (RECEBIDOS) -->
        <div class="kds-column">
          <div class="kds-col-header col-recebido">
            <span>1. Novos Pedidos</span>
            <span style="font-size: 0.82rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 99px;">
              ${colRecebidos.length}
            </span>
          </div>

          <div class="kds-orders-list">
            ${colRecebidos.length === 0 ? `
              <div style="text-align: center; padding: 48px 12px; color: var(--text-muted);">
                <div style="font-size: 2.2rem; margin-bottom: 8px;">⏳</div>
                <div>Aguardando novos pedidos...</div>
                <div style="font-size: 0.75rem; margin-top: 4px;">Faça um pedido no cardápio de ${escapeHTML(restaurant.name)} para vê-lo chegar aqui!</div>
              </div>
            ` : colRecebidos.map(order => renderOrderTicketHtml(order, 'recebido')).join('')}
          </div>
        </div>

        <!-- COLUNA 2: EM PREPARO -->
        <div class="kds-column">
          <div class="kds-col-header col-preparo">
            <span>2. Em Preparo no Fogão</span>
            <span style="font-size: 0.82rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 99px;">
              ${colPreparo.length}
            </span>
          </div>

          <div class="kds-orders-list">
            ${colPreparo.length === 0 ? `
              <div style="text-align: center; padding: 48px 12px; color: var(--text-muted);">
                <div style="font-size: 2.2rem; margin-bottom: 8px;">🍳</div>
                <div>Nenhuma marmita sendo montada no momento.</div>
              </div>
            ` : colPreparo.map(order => renderOrderTicketHtml(order, 'preparo')).join('')}
          </div>
        </div>

        <!-- COLUNA 3: PRONTO & EXPEDIÇÃO -->
        <div class="kds-column">
          <div class="kds-col-header col-pronto">
            <span>3. Pronto / Expedição</span>
            <span style="font-size: 0.82rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 99px;">
              ${colProntos.length}
            </span>
          </div>

          <div class="kds-orders-list">
            ${colProntos.length === 0 ? `
              <div style="text-align: center; padding: 48px 12px; color: var(--text-muted);">
                <div style="font-size: 2.2rem; margin-bottom: 8px;">🛵</div>
                <div>Nenhum pedido aguardando saída.</div>
              </div>
            ` : colProntos.map(order => renderOrderTicketHtml(order, 'pronto')).join('')}
          </div>
        </div>

      </div>

      <!-- Rodapé -->
      <div style="margin-top: 24px; padding: 14px 20px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; font-size: 0.88rem; color: var(--text-muted);">
        <span>🏁 Pedidos entregues com sucesso hoje: <strong>${colEntregues.length}</strong></span>
      </div>

    </div>
  `;

  attachKDSEvents(container, restaurant, slug, navigateTo);
}

function renderOrderTicketHtml(order, currentStatus) {
  const elapsedMinutes = Math.max(1, Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000));
  const checklist = order.checklist || {};
  const checklistComplete = store.isOrderChecklistComplete(order);
  const checkedCount = order.items.filter((_, index) => checklist[index] === true).length;

  return `
    <div class="kds-order-ticket">
      <div class="ticket-header">
        <div>
          <span class="ticket-number">#${order.orderNumber}</span>
          <span style="font-size: 0.75rem; color: var(--status-ready); font-weight: 700; margin-left: 6px;">
            ${escapeHTML(order.paymentMethod)} · Simulado
          </span>
        </div>
        <div class="ticket-time">
          ⏱️ há ${elapsedMinutes} min
        </div>
      </div>

      <div class="ticket-customer-name">
        👤 ${escapeHTML(order.customerName)}
      </div>
      <div class="ticket-delivery-address">
        📍 ${escapeHTML(order.address)}
      </div>

      <!-- Itens do Pedido -->
      <div class="ticket-items-box">
        ${order.items.map((item, idx) => {
          const isChecked = !!checklist[idx];
          return `
            <div class="ticket-item-row">
              <div class="ticket-item-title">
                ${item.qty}x ${escapeHTML(item.productName)}
              </div>

              ${item.size ? `<div class="ticket-item-specs">📏 <strong>Tamanho:</strong> ${escapeHTML(item.size.replace(/^Tamanho\s+/i, ''))}</div>` : ''}
              ${item.protein ? `<div class="ticket-item-specs">🥩 <strong>Proteína:</strong> ${escapeHTML(item.protein)}</div>` : ''}
              ${item.base ? `<div class="ticket-item-specs">🍚 <strong>Base:</strong> ${escapeHTML(item.base)} / ${escapeHTML(item.beans || '')}</div>` : ''}
              ${item.sides && item.sides.length > 0 ? `
                <div class="ticket-item-specs">🥗 <strong>Guarnições:</strong> ${escapeHTML(item.sides.join(', '))}</div>
              ` : ''}
              ${item.addons && item.addons.length > 0 ? `
                <div class="ticket-item-specs" style="color: var(--status-info);">✨ <strong>Adicionais:</strong> ${escapeHTML(item.addons.join(', '))}</div>
              ` : ''}
              ${item.notes ? `
                <div class="ticket-item-notes">
                  ⚠️ Obs: ${escapeHTML(item.notes)}
                </div>
              ` : ''}

              <!-- Checklist -->
              <label class="ticket-checklist-row">
                <input 
                  type="checkbox" 
                  class="kds-check-item" 
                  data-order-id="${order.id}" 
                  data-item-idx="${idx}" 
                  ${isChecked ? 'checked' : ''} 
                  ${currentStatus === 'entregue' ? 'disabled' : ''}
                />
                <span style="${isChecked ? 'text-decoration: line-through; color: var(--status-ready);' : ''}">
                  ${isChecked ? '✓ Conferido na embalagem' : 'Conferir item na marmita'}
                </span>
              </label>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Botões de Avanço -->
      <div class="ticket-actions-bar">
        <p class="checklist-progress" role="status">${checkedCount} de ${order.items.length} itens conferidos${!checklistComplete && currentStatus === 'pronto' ? ' · Confira todos os itens para despachar.' : ''}</p>
        ${currentStatus === 'recebido' ? `
          <button class="btn-kds-action btn-kds-orange btn-advance-order" data-id="${order.id}" data-next="preparo">
            🔥 Iniciar Preparo
          </button>
        ` : ''}

        ${currentStatus === 'preparo' ? `
          <button class="btn-kds-action btn-kds-blue btn-advance-order" data-id="${order.id}" data-next="pronto">
            📦 Pronto p/ Entrega
          </button>
        ` : ''}

        ${currentStatus === 'pronto' ? `
          <button class="btn-kds-action btn-kds-green btn-advance-order" data-id="${order.id}" data-next="entregue" ${!checklistComplete ? 'disabled' : ''}>
            🛵 Despachado / Concluir
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function attachKDSEvents(container, restaurant, slug, navigateTo) {
  container.querySelector('#btn-back-from-kds')?.addEventListener('click', () => {
    if (store.auth.loggedIn) {
      navigateTo('admin');
    } else {
      navigateTo('plataforma');
    }
  });

  container.querySelector('#btn-sound-test')?.addEventListener('click', () => {
    sounds.playNewOrderSound();
  });

  container.querySelectorAll('.btn-advance-order').forEach(btn => {
    btn.addEventListener('click', asyncAction(async () => {
      const id = btn.dataset.id;
      const nextStatus = btn.dataset.next;
      try {
        await store.updateOrderStatus(id, nextStatus);
      } catch (error) {
        const progress = btn.closest('.ticket-actions-bar').querySelector('.checklist-progress');
        progress.textContent = error.message;
        return;
      }
      renderKitchenView(container, navigateTo, slug);
    }));
  });

  container.querySelectorAll('.kds-check-item').forEach(checkbox => {
    checkbox.addEventListener('change', asyncAction(async () => {
      const orderId = checkbox.dataset.orderId;
      const idx = parseInt(checkbox.dataset.itemIdx);
      await store.toggleOrderChecklist(orderId, idx);
      renderKitchenView(container, navigateTo, slug);
    }));
  });
}
