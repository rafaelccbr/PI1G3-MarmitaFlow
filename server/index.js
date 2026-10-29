import { HttpError, text, restaurantUpdates, productUpdates, priceOrderItems } from './validation.js';
import { randomToken, hashToken, passwordHash, constantTimeEqual, cookieValue, cookie } from './security.js';

const SESSION_SECONDS = 60 * 60 * 24 * 7;
const CUSTOMER_SECONDS = 60 * 60 * 24 * 30;
const profile = row => row ? JSON.parse(row.data) : null;
const orderJSON = row => ({ ...profile(row), orderNumber: 100 + row.sequence });
const changes = result => result.meta.changes;
const stmt = (db, sql, ...args) => db.prepare(sql).bind(...args);

async function body(request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new HttpError(415, 'Envie os dados em JSON.');
  const raw = await request.text();
  if (raw.length > 65536) throw new HttpError(413, 'Os dados enviados são muito grandes.');
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new HttpError(400, 'Dados inválidos.'); }
}

async function currentOwner(request, db) {
  const token = cookieValue(request, 'mf_session');
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return stmt(db, `SELECT r.* FROM sessions s JOIN restaurants r ON r.id=s.restaurant_id
    WHERE s.token_hash=? AND s.expires_at>?`, await hashToken(token), Date.now()).first();
}
function requireOwner(owner, restaurantId) {
  if (!owner) throw new HttpError(401, 'Entre na sua conta para continuar.');
  if (owner.id !== restaurantId) throw new HttpError(403, 'Você não tem acesso a este restaurante.');
}
async function createSession(request, db, restaurantId, headers) {
  const token = randomToken();
  const old = cookieValue(request, 'mf_session');
  const queries = [stmt(db, 'DELETE FROM sessions WHERE expires_at<=?', Date.now())];
  if (old) queries.push(stmt(db, 'DELETE FROM sessions WHERE token_hash=?', await hashToken(old)));
  queries.push(stmt(db, 'INSERT INTO sessions(token_hash,restaurant_id,expires_at) VALUES(?,?,?)', await hashToken(token), restaurantId, Date.now() + SESSION_SECONDS * 1000));
  await db.batch(queries);
  headers.append('Set-Cookie', cookie(request, 'mf_session', token, SESSION_SECONDS));
}
async function throttle(request, db, label) {
  const key = await hashToken(label + ':' + (request.headers.get('CF-Connecting-IP') || 'local'));
  const now = Date.now();
  const row = await stmt(db, `INSERT INTO auth_attempts(key,attempts,expires_at) VALUES(?,1,?)
    ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN expires_at<=? THEN 1 ELSE attempts+1 END,
    expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING attempts`, key, now + 900000, now, now).first();
  if (row.attempts > 30) throw new HttpError(429, 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.');
}
async function snapshot(db, owner, customerHash) {
  const results = await db.batch([
    db.prepare('SELECT data FROM restaurants ORDER BY rowid'),
    db.prepare('SELECT data FROM products ORDER BY rowid'),
    stmt(db, 'SELECT sequence,data FROM orders WHERE restaurant_id=? OR customer_hash=? ORDER BY sequence DESC', owner?.id || '', customerHash)
  ]);
  return {
    restaurants: results[0].results.map(profile), products: results[1].results.map(profile),
    orders: results[2].results.map(orderJSON),
    auth: owner ? { loggedIn: true, restaurantId: owner.id, userEmail: owner.email, ownerName: profile(owner).ownerName } : { loggedIn: false, restaurantId: null }
  };
}

async function api(request, env, headers) {
  const url = new URL(request.url);
  const path = url.pathname;
  const db = env.DB;
  if (!db) throw new HttpError(503, 'O banco de dados ainda não foi conectado.');
  if (!['GET', 'HEAD'].includes(request.method)) {
    const origin = request.headers.get('Origin');
    if ((origin && origin !== url.origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site') throw new HttpError(403, 'Origem da solicitação inválida.');
  }
  let customer = cookieValue(request, 'mf_customer');
  if (!/^[a-f0-9]{64}$/.test(customer)) {
    customer = randomToken();
    headers.append('Set-Cookie', cookie(request, 'mf_customer', customer, CUSTOMER_SECONDS));
  }
  const customerHash = await hashToken(customer);
  const owner = await currentOwner(request, db);
  if (path === '/api/state' && request.method === 'GET') return snapshot(db, owner, customerHash);
  if (path === '/api/health' && request.method === 'GET') {
    await db.prepare('SELECT id FROM restaurants LIMIT 1').first();
    return { ok: true, storage: 'd1', paymentMode: 'simulation' };
  }
  if (path === '/api/auth/login' && request.method === 'POST') {
    await throttle(request, db, 'login');
    const input = await body(request);
    const email = text(input.email, 'e-mail', 254).toLowerCase();
    const password = text(input.password, 'senha', 200);
    const row = await stmt(db, 'SELECT * FROM restaurants WHERE email=?', email).first();
    const candidate = await passwordHash(password, row?.password_salt || 'invalid-account-salt');
    if (!row || !constantTimeEqual(candidate, row.password_hash)) throw new HttpError(401, 'E-mail ou senha incorretos.');
    await createSession(request, db, row.id, headers);
    return { success: true };
  }
  if (path === '/api/auth/logout' && request.method === 'POST') {
    await body(request);
    const token = cookieValue(request, 'mf_session');
    if (token) await stmt(db, 'DELETE FROM sessions WHERE token_hash=?', await hashToken(token)).run();
    headers.append('Set-Cookie', cookie(request, 'mf_session', '', 0));
    return { success: true };
  }
  if (path === '/api/restaurants' && request.method === 'POST') {
    await throttle(request, db, 'register');
    const input = await body(request);
    const name = text(input.name, 'nome do restaurante');
    const ownerName = text(input.ownerName, 'nome do proprietário');
    const email = text(input.adminEmail, 'e-mail', 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'E-mail inválido.');
    const password = text(input.adminPass, 'senha', 200);
    if (password.length < 6) throw new HttpError(400, 'Use uma senha com pelo menos 6 caracteres.');
    const id = 'rest-' + crypto.randomUUID();
    const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0,70) + '-' + crypto.randomUUID().slice(0,8);
    const restaurant = {
      id, slug, name, ownerName, tagline: 'Comida caseira preparada com carinho.', description: '',
      primaryColor: '#FF6B00', secondaryColor: '#10B981', logoUrl: '/assets/mascote_flow.jpg', bannerUrl: '/assets/feijoada_flow.jpg',
      pixKey: '', pixKeyType: 'Chave Aleatória', phone: '', address: '', deliveryFee: 0, deliveryTime: '30-45 min', rating: 'Novo', isOpen: true,
      ...restaurantUpdates(input)
    };
    const salt = randomToken();
    const hash = await passwordHash(password, salt);
    const products = [
      { id: 'prod-' + crypto.randomUUID(), restaurantId: id, name: 'Prato Especial do Chefe', category: 'Marmitas Tradicionais', price: 28, description: 'Arroz, feijão, proteína do dia e acompanhamentos.', image: '/assets/feijoada_flow.jpg', badge: '', isCustomizable: true, available: true },
      { id: 'prod-' + crypto.randomUUID(), restaurantId: id, name: 'Suco Natural 500ml', category: 'Bebidas', price: 7.5, description: 'Feito na hora, gelado e refrescante.', image: '/assets/suco_laranja.jpg', badge: '', isCustomizable: false, available: true }
    ];
    try {
      await db.batch([
        stmt(db, 'INSERT INTO restaurants(id,slug,email,password_hash,password_salt,data) VALUES(?,?,?,?,?,?)', id, slug, email, hash, salt, JSON.stringify(restaurant)),
        ...products.map(product => stmt(db, 'INSERT INTO products(id,restaurant_id,data) VALUES(?,?,?)', product.id, id, JSON.stringify(product)))
      ]);
    } catch (error) {
      if (/UNIQUE constraint failed: restaurants.email/.test(error.message)) throw new HttpError(409, 'Este e-mail já está cadastrado.');
      throw error;
    }
    await createSession(request, db, id, headers);
    return { restaurant };
  }
  const restMatch = path.match(/^\/api\/restaurants\/([^/]+)$/);
  if (restMatch && request.method === 'PATCH') {
    requireOwner(owner, restMatch[1]);
    const updates = restaurantUpdates(await body(request));
    // json_patch applies only the changed fields, preserving concurrent changes.
    await stmt(db, 'UPDATE restaurants SET data=json_patch(data,?) WHERE id=?', JSON.stringify(updates), owner.id).run();
    return { success: true };
  }
  if (path === '/api/products' && request.method === 'POST') {
    const input = await body(request);
    requireOwner(owner, input.restaurantId);
    const product = { ...productUpdates(input), id: 'prod-' + crypto.randomUUID(), restaurantId: owner.id, available: true };
    await stmt(db, 'INSERT INTO products(id,restaurant_id,data) VALUES(?,?,?)', product.id, owner.id, JSON.stringify(product)).run();
    return { product };
  }
  const productMatch = path.match(/^\/api\/products\/([^/]+)$/);
  if (productMatch && ['PATCH', 'DELETE'].includes(request.method)) {
    if (!owner) throw new HttpError(401, 'Entre na sua conta para continuar.');
    const row = await stmt(db, 'SELECT * FROM products WHERE id=?', productMatch[1]).first();
    if (!row) throw new HttpError(404, 'Prato não encontrado.');
    requireOwner(owner, row.restaurant_id);
    if (request.method === 'DELETE') await stmt(db, 'DELETE FROM products WHERE id=?', row.id).run();
    else {
      const input = await body(request);
      const product = productUpdates(input, profile(row));
      const result = await stmt(db, 'UPDATE products SET data=? WHERE id=? AND data=?', JSON.stringify(product), row.id, row.data).run();
      if (!changes(result)) throw new HttpError(409, 'O prato foi atualizado em outra tela. Atualize e tente novamente.');
    }
    return { success: true };
  }
  if (path === '/api/orders' && request.method === 'POST') {
    const input = await body(request);
    const requestId = text(input.requestId, 'identificação do pedido', 80);
    const previous = await stmt(db, 'SELECT * FROM orders WHERE customer_hash=? AND request_id=?', customerHash, requestId).first();
    if (previous) return { order: orderJSON(previous) };
    const rest = await stmt(db, 'SELECT * FROM restaurants WHERE id=?', text(input.restaurantId, 'restaurante')).first();
    if (!rest || !profile(rest).isOpen) throw new HttpError(409, 'O restaurante está fechado no momento.');
    const productRows = (await stmt(db, 'SELECT * FROM products WHERE restaurant_id=?', rest.id).all()).results;
    const items = priceOrderItems(input.items, productRows.map(profile), rest.id);
    if (!['delivery', 'pickup'].includes(input.orderType)) throw new HttpError(400, 'Escolha entrega ou retirada.');
    if (!['Pix', 'Cartão'].includes(input.paymentMethod)) throw new HttpError(400, 'Forma de pagamento inválida.');
    const coupon = String(input.couponCode || '').toUpperCase();
    if (coupon && coupon !== 'MARMITA10') throw new HttpError(400, 'Cupom inválido.');
    const subtotalCents = items.reduce((sum, item) => sum + Math.round(item.unitPrice * 100) * item.qty, 0);
    const deliveryFee = input.orderType === 'pickup' ? 0 : profile(rest).deliveryFee;
    const totalCents = Math.round(subtotalCents * (coupon ? 0.9 : 1)) + Math.round(deliveryFee * 100);
    if (Math.round(Number(input.total) * 100) !== totalCents) throw new HttpError(409, 'O preço foi atualizado. Revise a sacola antes de confirmar.');
    const order = {
      id: 'ord-' + crypto.randomUUID(), restaurantId: rest.id,
      customerName: text(input.customerName || 'Cliente MarmitaFlow', 'nome', 200),
      customerPhone: text(input.customerPhone || '', 'telefone', 80, false),
      address: input.orderType === 'pickup' ? 'Retirada no Balcão' : text(input.address, 'endereço', 500),
      status: 'recebido', createdAt: new Date().toISOString(), paymentMethod: input.paymentMethod,
      paymentStatus: 'Simulado', subtotal: subtotalCents / 100, deliveryFee, total: totalCents / 100, items, checklist: {}
    };
    // A single conditional INSERT ensures the store and dishes still match the validated snapshot.
    const usedRows = productRows.filter(row => items.some(item => item.productId === row.id));
    const guards = usedRows.map(() => 'EXISTS(SELECT 1 FROM products WHERE id=? AND data=?)');
    await stmt(db, `INSERT INTO orders(id,restaurant_id,customer_hash,request_id,data)
      SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM restaurants WHERE id=? AND data=?) AND ${guards.join(' AND ')}
      ON CONFLICT(customer_hash,request_id) DO NOTHING`,
      order.id, rest.id, customerHash, requestId, JSON.stringify(order), rest.id, rest.data, ...usedRows.flatMap(row => [row.id, row.data])).run();
    const saved = await stmt(db, 'SELECT * FROM orders WHERE customer_hash=? AND request_id=?', customerHash, requestId).first();
    if (!saved) throw new HttpError(409, 'O cardápio mudou. Revise a sacola e tente novamente.');
    return { order: orderJSON(saved) };
  }
  const orderMatch = path.match(/^\/api\/orders\/([^/]+)\/(status|checklist)$/);
  if (orderMatch && request.method === 'PATCH') {
    if (!owner) throw new HttpError(401, 'Entre na sua conta para continuar.');
    const row = await stmt(db, 'SELECT * FROM orders WHERE id=?', orderMatch[1]).first();
    if (!row) throw new HttpError(404, 'Pedido não encontrado.');
    requireOwner(owner, row.restaurant_id);
    const order = profile(row);
    const input = await body(request);
    if (orderMatch[2] === 'status') {
      const next = { recebido: 'preparo', preparo: 'pronto', pronto: 'entregue' };
      if (next[order.status] !== input.status) throw new HttpError(409, 'Avance o pedido uma etapa por vez.');
      if (input.status === 'entregue' && !order.items.every((_, index) => order.checklist[index] === true)) throw new HttpError(409, 'Confira todos os itens antes de despachar o pedido.');
      const result = await stmt(db, `UPDATE orders SET data=json_set(data,'$.status',?) WHERE id=? AND data=?`, input.status, row.id, row.data).run();
      if (!changes(result)) throw new HttpError(409, 'O pedido mudou em outra tela. Atualize e tente novamente.');
    } else {
      if (order.status === 'entregue') throw new HttpError(409, 'O pedido já foi concluído.');
      if (!Number.isInteger(input.itemIdx) || !order.items[input.itemIdx] || typeof input.checked !== 'boolean') throw new HttpError(400, 'Item de conferência inválido.');
      const result = await stmt(db, `UPDATE orders SET data=json_set(data,?,json(?)) WHERE id=? AND json_extract(data,'$.status')!='entregue'`, `$.checklist."${input.itemIdx}"`, JSON.stringify(input.checked), row.id).run();
      if (!changes(result)) throw new HttpError(409, 'O pedido já foi concluído.');
    }
    return { success: true };
  }
  throw new HttpError(404, 'Endereço da API não encontrado.');
}

export default {
  async fetch(request, env) {
    if (!new URL(request.url).pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    try { return new Response(JSON.stringify(await api(request, env, headers)), { headers }); }
    catch (error) {
      if (!error.status) console.error('API:', error.message);
      return new Response(JSON.stringify({ message: error.status ? error.message : 'Não foi possível salvar ou carregar os dados. Tente novamente.' }), { status: error.status || 500, headers });
    }
  }
};
