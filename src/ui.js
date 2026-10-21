export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

const themeProperties = ['--color-primary', '--color-primary-light', '--color-primary-dark', '--color-primary-hover', '--color-accent', '--color-secondary'];

export function clearRestaurantTheme(container) {
  themeProperties.forEach(property => container.style.removeProperty(property));
}

export function applyRestaurantTheme(container, restaurant, color = restaurant.primaryColor) {
  const primary = /^#[\da-f]{6}$/i.test(color || '') ? color : '#FF6B00';
  container.style.setProperty('--color-primary', primary);
  container.style.setProperty('--color-primary-dark', primary);
  container.style.setProperty('--color-primary-hover', primary);
  container.style.setProperty('--color-accent', primary);
  container.style.setProperty('--color-primary-light', `color-mix(in srgb, ${primary} 18%, var(--bg-surface))`);
  container.style.setProperty('--color-secondary', restaurant.secondaryColor || '#047857');
}

export function restaurantMenuUrl(slug) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = `/cardapio/${encodeURIComponent(slug)}`;
  return url.href;
}

// Existing views replace their markup; keep names and dialog behavior consistent after each render.
export function setupAccessibility(root) {
  let dialogId = null;
  let previousFocus = null;
  let focusedControl = null;
  root.addEventListener('focusin', event => {
    const control = event.target;
    focusedControl = { id: control.id, name: control.name };
  });
  const focusable = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]';
  const enhance = () => {
    root.querySelectorAll('.form-group, .control-group').forEach(group => {
      const label = group.querySelector('label');
      const input = group.querySelector('input:not([type="hidden"]), select, textarea');
      if (label && input?.id) label.htmlFor = input.id;
    });
    root.querySelectorAll('input, textarea, select').forEach(input => {
      if (!input.labels?.length && !input.hasAttribute('aria-label')) {
        const label = input.closest('label, .cust-option-item')?.textContent.trim();
        input.setAttribute('aria-label', label || input.placeholder || input.id || 'Selecionar opção');
      }
    });
    root.querySelectorAll('.modal-close-btn, .btn-clear-search').forEach(button => button.setAttribute('aria-label', button.classList.contains('btn-clear-search') ? 'Limpar busca' : 'Fechar janela'));
    root.querySelectorAll('.segment-btn, .stage-nav-item, .showcase-tab-btn, .cat-nav-btn, .owner-tab-item, .color-swatch-btn').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
      if (button.title) button.setAttribute('aria-label', button.title);
    });
    const dialog = root.querySelector('.modal-overlay');
    if (dialog) {
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-label', dialog.querySelector('h3, h2')?.textContent || 'Detalhes do pedido');
      if (dialog.id !== dialogId) {
        if (!dialogId) previousFocus = document.activeElement;
        dialogId = dialog.id;
        dialog.querySelector(focusable)?.focus({ preventScroll: true });
      } else if (document.activeElement === document.body) {
        const control = focusedControl?.id ? dialog.querySelector(`#${CSS.escape(focusedControl.id)}`)
          : focusedControl?.name ? dialog.querySelector(`[name="${CSS.escape(focusedControl.name)}"]:checked`) : null;
        (control || dialog.querySelector(focusable))?.focus({ preventScroll: true });
      }
    } else if (dialogId) {
      dialogId = null;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    }
    document.body.classList.toggle('has-dialog', Boolean(dialog));
  };
  new MutationObserver(enhance).observe(root, { childList: true, subtree: true });
  root.addEventListener('keydown', event => {
    const dialog = root.querySelector('.modal-overlay');
    if (!dialog) return;
    if (event.key === 'Escape') dialog.querySelector('.modal-close-btn')?.click();
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll(focusable)].filter(element => element.getClientRects().length);
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  enhance();
}
