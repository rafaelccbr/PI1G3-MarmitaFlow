import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../server/index.js';
import { CUSTOMIZATION_OPTIONS } from '../src/data/catalog.js';

// Run the Worker's SQL against SQLite, including transactions, constraints and JSON functions.
function database() {
  const sqlite = new DatabaseSync(':memory:');
  for (const name of ['0001_schema.sql', '0002_demo_catalog.sql']) sqlite.exec(readFileSync(new URL('../migrations/' + name, import.meta.url), 'utf8'));
  const db = {
    prepare(sql) {
      let args = [];
      return {
        bind(...values) { args = values; return this; },
        async first() { return sqlite.prepare(sql).get(...args) || null; },
        async all() { return { results: sqlite.prepare(sql).all(...args), meta: {} }; },
        async run() { const result = sqlite.prepare(sql).run(...args); return { results: [], meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } }; }
      };
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const result = [];
        for (const statement of statements) result.push(await statement.all());
        sqlite.exec('COMMIT'); return result;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
  };
  return { db, sqlite };
}
function client(db) {
  const jar = new Map();
  return async (path, method = 'GET', data, extraHeaders = {}) => {
    const response = await worker.fetch(new Request('https://marmita.test/api' + path, {
      method, headers: { Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join('; '), ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}), ...extraHeaders },
      ...(data !== undefined ? { body: JSON.stringify(data) } : {})
    }), { DB: db });
    for (const value of response.headers.getSetCookie()) {
      const [pair] = value.split(';'); const at = pair.indexOf('='); jar.set(pair.slice(0,at), pair.slice(at+1));
    }
    return { status: response.status, data: await response.json(), headers: response.headers };
  };
}
const login = (api, email = 'admin@marmitaflow.com') => api('/auth/login', 'POST', { email, password: '123456' });
const meal = () => ({
  productId: 'prod-mf-frango', qty: 1, unitPrice: 0,
  size: CUSTOMIZATION_OPTIONS.sizes[1].name, protein: CUSTOMIZATION_OPTIONS.proteins[0].name,
  base: CUSTOMIZATION_OPTIONS.bases[0].name, beans: CUSTOMIZATION_OPTIONS.beans[0].name,
  sides: [CUSTOMIZATION_OPTIONS.sides[0].name], addons: []
});
const orderData = (overrides = {}) => ({ restaurantId: 'rest-marmita-flow', requestId: crypto.randomUUID(), customerName: 'Cliente teste', customerPhone: '11999999999', address: 'Rua de teste, 10', orderType: 'delivery', paymentMethod: 'Pix', total: 34.9, items: [meal()], ...overrides });

test('API hides credentials and orders, validates login and revokes sessions on logout', async () => {
  const { db, sqlite } = database();
  try {
    const api = client(db);
    const publicState = await api('/state');
    assert.equal(publicState.status, 200);
    assert.equal(publicState.data.restaurants.length, 2);
    assert.equal(JSON.stringify(publicState.data).includes('password'), false);
    assert.equal(publicState.data.restaurants[0].adminEmail, undefined);
    assert.equal((await api('/auth/login', 'POST', { email: 'admin@marmitaflow.com', password: 'wrong' })).status, 401);
    const signedIn = await login(api);
    assert.equal(signedIn.status, 200);
    assert.match(signedIn.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
    assert.equal((await api('/state')).data.auth.restaurantId, 'rest-marmita-flow');
    await api('/auth/logout', 'POST', {});
    assert.equal((await api('/state')).data.auth.loggedIn, false);
    assert.equal(sqlite.prepare('SELECT count(*) AS n FROM sessions').get().n, 0);
  } finally { sqlite.close(); }
});

test('API registration stores only salted hashes and isolates each owner', async () => {
  const { db, sqlite } = database();
  try {
    const api = client(db);
    const data = { name: 'Cozinha nova', ownerName: 'Dona Ana', adminEmail: 'nova@example.com', adminPass: 'senha-nova', deliveryFee: 0 };
    const result = await api('/restaurants', 'POST', data);
    assert.equal(result.status, 200);
    assert.equal(result.data.restaurant.deliveryFee, 0);
    assert.equal((await api('/state')).data.auth.restaurantId, result.data.restaurant.id);
    const row = sqlite.prepare('SELECT * FROM restaurants WHERE email=?').get(data.adminEmail);
    assert.notEqual(row.password_hash, data.adminPass);
    assert.equal(row.data.includes(data.adminPass), false);
    assert.equal((await api('/restaurants', 'POST', data)).status, 409);
    assert.equal((await api('/restaurants/rest-marmita-flow', 'PATCH', { name: 'Invadido' })).status, 403);
    assert.equal((await api('/products/prod-mf-frango', 'DELETE')).status, 403);
    assert.equal((await api('/products/prod-mf-frango', 'PATCH', { available: false })).status, 403);
    assert.equal((await api('/restaurants/' + row.id, 'PATCH', { name: 'Atualizado', adminPass: 'ignored' })).status, 200);
  } finally { sqlite.close(); }
});

test('API recomputes prices, rejects unavailable dishes and deduplicates checkout retries', async () => {
  const { db, sqlite } = database();
  try {
    const customer = client(db), owner = client(db), stranger = client(db);
    await customer('/state'); await login(owner);
    assert.equal((await customer('/orders', 'POST', orderData({ total: 0 }))).status, 409);
    const payload = orderData();
    const placed = await customer('/orders', 'POST', payload);
    assert.equal(placed.status, 200);
    assert.equal(placed.data.order.items[0].unitPrice, 31.9);
    assert.equal(placed.data.order.paymentStatus, 'Simulado');
    assert.equal((await customer('/orders', 'POST', payload)).data.order.id, placed.data.order.id);
    assert.equal(sqlite.prepare('SELECT count(*) AS n FROM orders').get().n, 1);
    assert.equal((await stranger('/state')).data.orders.length, 0);
    assert.equal((await customer('/state')).data.orders.length, 1);
    assert.equal((await owner('/state')).data.orders.length, 1);
    await owner('/products/prod-mf-frango', 'PATCH', { available: false });
    assert.equal((await customer('/orders', 'POST', orderData())).status, 409);
    await owner('/products/prod-mf-frango', 'PATCH', { available: true });
    await owner('/restaurants/rest-marmita-flow', 'PATCH', { isOpen: false });
    assert.equal((await customer('/orders', 'POST', orderData())).status, 409);
    assert.equal(sqlite.prepare('SELECT count(*) AS n FROM orders').get().n, 1);
  } finally { sqlite.close(); }
});

test('API kitchen enforces transitions, ownership and a complete immutable dispatch checklist', async () => {
  const { db, sqlite } = database();
  try {
    const customer = client(db), owner = client(db), other = client(db);
    await customer('/state'); await login(owner); await login(other, 'nona@cantina.com');
    const { data } = await customer('/orders', 'POST', orderData({ items: [meal(), meal()], total: 66.8 }));
    const path = '/orders/' + data.order.id;
    assert.equal((await customer(path + '/status', 'PATCH', { status: 'preparo' })).status, 401);
    assert.equal((await other(path + '/status', 'PATCH', { status: 'preparo' })).status, 403);
    assert.equal((await owner(path + '/status', 'PATCH', { status: 'entregue' })).status, 409);
    assert.equal((await owner(path + '/status', 'PATCH', { status: 'preparo' })).status, 200);
    assert.equal((await owner(path + '/status', 'PATCH', { status: 'pronto' })).status, 200);
    await owner(path + '/checklist', 'PATCH', { itemIdx: 0, checked: true });
    assert.equal((await owner(path + '/status', 'PATCH', { status: 'entregue' })).status, 409);
    await owner(path + '/checklist', 'PATCH', { itemIdx: 1, checked: true });
    assert.equal((await owner(path + '/status', 'PATCH', { status: 'entregue' })).status, 200);
    assert.equal((await customer('/state')).data.orders[0].status, 'entregue');
    assert.equal((await owner(path + '/checklist', 'PATCH', { itemIdx: 0, checked: false })).status, 409);
  } finally { sqlite.close(); }
});

test('API rejects foreign origins, invalid quantities and unknown customization options', async () => {
  const { db, sqlite } = database();
  try {
    const api = client(db);
    assert.equal((await api('/auth/login', 'POST', { email: 'admin@marmitaflow.com', password: '123456' }, { Origin: 'https://another.test' })).status, 403);
    assert.equal((await api('/orders', 'POST', orderData({ items: [{ ...meal(), qty: -2 }] }))).status, 400);
    assert.equal((await api('/orders', 'POST', orderData({ items: [{ ...meal(), protein: 'Inventada' }] }))).status, 400);
    assert.equal((await api('/orders', 'POST', orderData({ items: [{ ...meal(), productId: 'prod-cn-frango' }] }))).status, 409);
  } finally { sqlite.close(); }
});
