import { CUSTOMIZATION_OPTIONS } from '../src/data/catalog.js';
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function text(value, field, max = 200, required = true) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new HttpError(400, `Revise o campo ${field}.`);
  return value.trim();
}
export function money(value, field) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100000) throw new HttpError(400, `Revise ${field}.`);
  return Math.round(n * 100) / 100;
}
export function imageURL(value) {
  const url = text(value, 'imagem', 2000, false);
  if (!url || /^\/assets\/[a-z0-9_.\/-]+$/i.test(url)) return url;
  try { const parsed = new URL(url); if (parsed.protocol === 'https:') return parsed.href; } catch {}
  throw new HttpError(400, 'Use uma imagem HTTPS ou um arquivo da pasta assets.');
}
export function restaurantUpdates(input) {
  const output = {};
  for (const key of ['name', 'tagline', 'description', 'pixKey', 'pixKeyType', 'phone', 'address', 'deliveryTime']) {
    if (key in input) output[key] = text(input[key], key, key === 'description' ? 2000 : 200, key === 'name');
  }
  for (const key of ['primaryColor', 'secondaryColor']) {
    if (key in input) {
      if (!/^#[\da-f]{6}$/i.test(input[key])) throw new HttpError(400, 'Cor inválida.');
      output[key] = input[key];
    }
  }
  for (const key of ['logoUrl', 'bannerUrl']) if (key in input) output[key] = imageURL(input[key]);
  if ('deliveryFee' in input) output.deliveryFee = money(input.deliveryFee, 'a taxa de entrega');
  if ('isOpen' in input) {
    if (typeof input.isOpen !== 'boolean') throw new HttpError(400, 'Status da loja inválido.');
    output.isOpen = input.isOpen;
  }
  return output;
}
export function productUpdates(input, existing = {}) {
  const output = { ...existing };
  for (const key of ['name', 'category', 'description', 'badge']) {
    if (key in input) output[key] = text(input[key], key, key === 'description' ? 2000 : 200, ['name', 'category'].includes(key));
  }
  if ('price' in input) output.price = money(input.price, 'o preço');
  if ('image' in input) output.image = imageURL(input.image);
  for (const key of ['isCustomizable', 'available']) if (key in input) {
    if (typeof input[key] !== 'boolean') throw new HttpError(400, 'Disponibilidade inválida.');
    output[key] = input[key];
  }
  if (!output.name || !output.category || !Number.isFinite(output.price)) throw new HttpError(400, 'Preencha nome, categoria e preço do prato.');
  return output;
}
export function priceOrderItems(items, products, restaurantId) {
  if (!Array.isArray(items) || !items.length || items.length > 50) throw new HttpError(400, 'Revise os itens da sacola.');
  return items.map(item => {
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) throw new HttpError(400, 'Quantidade inválida.');
    const product = products.find(p => p.id === item.productId && p.restaurantId === restaurantId);
    if (!product?.available) throw new HttpError(409, 'Há itens indisponíveis na sacola. Remova ou escolha uma alternativa.');
    let cents = Math.round(product.price * 100);
    const result = { productId: product.id, productName: product.name, restaurantId, qty: item.qty };
    if (product.isCustomizable) {
      for (const [key, group] of [['size', 'sizes'], ['protein', 'proteins'], ['base', 'bases'], ['beans', 'beans']]) {
        const option = CUSTOMIZATION_OPTIONS[group].find(o => o.name === item[key]);
        if (!option) throw new HttpError(400, 'Escolha as opções de montagem da marmita.');
        result[key] = option.name;
        cents += Math.round((option.price || 0) * 100);
      }
      for (const [key, max] of [['sides', 2], ['addons', CUSTOMIZATION_OPTIONS.addons.length]]) {
        if (!Array.isArray(item[key]) || item[key].length > max || new Set(item[key]).size !== item[key].length) throw new HttpError(400, 'Revise os acompanhamentos e adicionais.');
        result[key] = item[key].map(name => {
          const option = CUSTOMIZATION_OPTIONS[key].find(o => o.name === name);
          if (!option) throw new HttpError(400, 'Opção de montagem inválida.');
          cents += Math.round((option.price || 0) * 100);
          return option.name;
        });
      }
    }
    result.notes = text(item.notes ?? '', 'observações', 1000, false);
    result.unitPrice = cents / 100;
    return result;
  });
}
