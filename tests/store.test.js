import test from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../src/store.js';

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
