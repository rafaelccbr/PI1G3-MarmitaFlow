import assert from 'node:assert/strict';
import { CUSTOMIZATION_OPTIONS } from '../src/data/catalog.js';

const base = process.env.MARMITAFLOW_URL || 'http://127.0.0.1:5173';
function client() {
  const cookies = new Map();
  return async (path, method = 'GET', body) => {
    const res = await fetch(base + '/api' + path, {
      method, headers: { Cookie: [...cookies].map(([k,v]) => `${k}=${v}`).join('; '), ...(body ? { 'Content-Type': 'application/json', Origin: new URL(base).origin } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    for (const value of res.headers.getSetCookie()) {
      const [pair] = value.split(';'); const i = pair.indexOf('='); cookies.set(pair.slice(0,i),pair.slice(i+1));
    }
    return { status: res.status, data: await res.json() };
  };
}
const owner = client(), customer = client(), stranger = client();
assert.equal((await customer('/health')).data.storage, 'd1');
assert.equal((await customer('/state')).data.restaurants.length >= 2, true);
assert.equal((await owner('/auth/login', 'POST', { email: 'admin@marmitaflow.com', password: '123456' })).status, 200);
const payload = {
  restaurantId: 'rest-marmita-flow', customerName: 'Verificação da integração D1', customerPhone: '', address: 'Retirada no Balcão',
  orderType: 'pickup', paymentMethod: 'Pix', total: 31.9, requestId: crypto.randomUUID(),
  items: [{ productId: 'prod-mf-frango', qty: 1, size: CUSTOMIZATION_OPTIONS.sizes[1].name,
    protein: CUSTOMIZATION_OPTIONS.proteins[0].name, base: CUSTOMIZATION_OPTIONS.bases[0].name,
    beans: CUSTOMIZATION_OPTIONS.beans[0].name, sides: [], addons: [] }]
};
const placed = await customer('/orders', 'POST', payload);
assert.equal(placed.status, 200, JSON.stringify(placed.data));
const id = placed.data.order.id;
assert.equal((await customer('/orders', 'POST', payload)).data.order.id, id);
assert.equal((await owner('/state')).data.orders.some(o => o.id === id), true);
assert.equal((await stranger('/state')).data.orders.some(o => o.id === id), false);
for (const status of ['preparo', 'pronto']) assert.equal((await owner(`/orders/${id}/status`, 'PATCH', { status })).status, 200);
assert.equal((await owner(`/orders/${id}/status`, 'PATCH', { status: 'entregue' })).status, 409);
assert.equal((await owner(`/orders/${id}/checklist`, 'PATCH', { itemIdx: 0, checked: true })).status, 200);
assert.equal((await owner(`/orders/${id}/status`, 'PATCH', { status: 'entregue' })).status, 200);
assert.equal((await customer('/state')).data.orders.find(o => o.id === id).status, 'entregue');
await owner('/auth/logout', 'POST', {});
assert.equal((await owner('/state')).data.auth.loggedIn, false);
console.log('API validada em ' + base + ': login, pedido persistido, sessões isoladas, idempotência e expedição conferida.');
