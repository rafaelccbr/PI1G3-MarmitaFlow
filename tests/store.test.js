import test from 'node:test';
import assert from 'node:assert/strict';
import { store, CUSTOMIZATION_OPTIONS } from '../src/store.js';

function withOrderFixture(run) {
  const original = { restaurants: store.restaurants, products: store.products, orders: store.orders, cart: store.cart };
  store.restaurants = [{ id: 'test', isOpen: true }];
  store.products = [
    { id: 'meal', restaurantId: 'test', category: 'Marmitas', available: true, suggestedAlternativeId: 'alternative' },
    { id: 'alternative', restaurantId: 'test', category: 'Fit', available: true },
    { id: 'same-category', restaurantId: 'test', category: 'Marmitas', available: true },
    { id: 'other-restaurant', restaurantId: 'other', category: 'Marmitas', available: true }
  ];
  store.orders = [];
  store.cart = [{ cartItemId: 'cart-meal', productId: 'meal', restaurantId: 'test', qty: 2, unitPrice: 20 }];
  try { run({ restaurantId: 'test', items: [...store.cart], subtotal: 40, deliveryFee: 0, total: 40 }); }
  finally { Object.assign(store, original); }
}

test('checkout rechecks availability and preserves cart and orders on failure', () => withOrderFixture(data => {
  store.validateOrderItems('test', data.items);
  store.products[0].available = false;
  assert.throws(() => store.createOrder(data), /indisponíveis/);
  assert.equal(store.cart.length, 1);
  assert.equal(store.orders.length, 0);
}));

test('checkout rejects removed products, closed restaurants, empty carts and foreign products', () => withOrderFixture(data => {
  store.products = store.products.filter(p => p.id !== 'meal');
  assert.throws(() => store.createOrder(data), /indisponíveis/);
  assert.throws(() => store.createOrder({ ...data, items: [{ ...data.items[0], productId: 'other-restaurant' }] }), /indisponíveis/);
  assert.throws(() => store.createOrder({ ...data, items: [] }), /vazia/);
  store.restaurants[0].isOpen = false;
  assert.throws(() => store.createOrder(data), /fechado/);
  assert.equal(store.cart.length, 1);
  assert.equal(store.orders.length, 0);
}));

test('alternatives prefer the configured dish, fall back to category and exclude unavailable or foreign dishes', () => withOrderFixture(() => {
  assert.equal(store.getAvailableAlternative('meal', 'test').id, 'alternative');
  store.products[1].available = false;
  assert.equal(store.getAvailableAlternative('meal', 'test').id, 'same-category');
  store.products[2].available = false;
  assert.equal(store.getAvailableAlternative('meal', 'test'), null);
  assert.equal(store.getAvailableAlternative('other-restaurant', 'test'), null);
  assert.equal(store.getAvailableAlternative('removed', 'test'), null);
}));

test('dispatch requires every checklist item and preserves the order until all are checked', () => withOrderFixture(data => {
  const order = store.createOrder({ ...data, items: [...data.items, { ...data.items[0], productId: 'alternative' }] });
  assert.equal(store.cart.length, 0);
  assert.throws(() => store.updateOrderStatus(order.id, 'entregue'), /etapa/);
  store.updateOrderStatus(order.id, 'preparo');
  store.updateOrderStatus(order.id, 'pronto');
  store.toggleOrderChecklist(order.id, 0);
  assert.throws(() => store.updateOrderStatus(order.id, 'entregue'), /Confira/);
  assert.equal(store.orders[0].status, 'pronto');
  store.toggleOrderChecklist(order.id, 1);
  store.toggleOrderChecklist(order.id, 0);
  assert.throws(() => store.updateOrderStatus(order.id, 'entregue'), /Confira/);
  store.toggleOrderChecklist(order.id, 0);
  store.updateOrderStatus(order.id, 'entregue');
  assert.equal(store.orders[0].status, 'entregue');
  store.toggleOrderChecklist(order.id, 0);
  assert.equal(store.orders[0].checklist[0], true);
}));

test('cart totals only include the selected restaurant', () => {
  const originalCart = store.cart;
  try {
    store.cart = [
      { restaurantId: 'a', unitPrice: 25, qty: 2 },
      { restaurantId: 'b', unitPrice: 12, qty: 1 }
    ];
    assert.deepEqual(store.getCartTotal({ id: 'a', deliveryFee: 3 }), { subtotal: 50, deliveryFee: 3, total: 53 });
    assert.deepEqual(store.getCartTotal({ id: 'b', deliveryFee: 0 }), { subtotal: 12, deliveryFee: 0, total: 12 });
    assert.deepEqual(store.getCartTotal({ id: 'c', deliveryFee: 4 }), { subtotal: 0, deliveryFee: 0, total: 0 });
  } finally { store.cart = originalCart; }
});

test('a refreshed catalog reprices the cart with its selected customization and preserves unavailable items', () => withOrderFixture(() => {
  store.products[0] = { ...store.products[0], price: 30, isCustomizable: true };
  store.cart = [
    { restaurantId: 'test', productId: 'meal', qty: 2, unitPrice: 1, size: CUSTOMIZATION_OPTIONS.sizes[1].name, protein: CUSTOMIZATION_OPTIONS.proteins[0].name, base: CUSTOMIZATION_OPTIONS.bases[0].name, beans: CUSTOMIZATION_OPTIONS.beans[0].name, addons: [CUSTOMIZATION_OPTIONS.addons[0].name] },
    { restaurantId: 'test', productId: 'removed', qty: 1, unitPrice: 9 }
  ];
  store.repriceCart();
  assert.equal(store.cart[0].unitPrice, 37);
  assert.equal(store.cart[0].qty, 2);
  assert.equal(store.cart[1].productId, 'removed');
  assert.equal(store.cart[1].unitPrice, 9);
}));

test('registration preserves free delivery and rejects duplicate administrator email', () => {
  const original = { restaurants: [...store.restaurants], products: [...store.products], auth: { ...store.auth } };
  try {
    const restaurant = store.createRestaurant({ name: 'Cozinha de teste', adminEmail: ' TESTE@example.com ', adminPass: '123456', deliveryFee: '0' });
    assert.equal(restaurant.deliveryFee, 0);
    assert.equal(restaurant.adminEmail, 'teste@example.com');
    assert.throws(() => store.createRestaurant({ name: 'Outra cozinha', adminEmail: 'TESTE@example.com', adminPass: '123456' }), /já está cadastrado/);
    assert.equal(store.restaurants.length, original.restaurants.length + 1);
  } finally { Object.assign(store, original); }
});
