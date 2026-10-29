import { writeFileSync } from 'node:fs';
import { INITIAL_RESTAURANTS, INITIAL_PRODUCTS } from '../src/data/catalog.js';
import { passwordHash, randomToken } from '../server/security.js';
const sqlString = value => "'" + String(value).replaceAll("'", "''") + "'";
const statements = ['-- Dados de demonstração. Senhas de contas reais são criadas apenas pela API.'];
for (const restaurant of INITIAL_RESTAURANTS) {
  const { adminPass, adminEmail, ...publicData } = restaurant;
  const salt = randomToken();
  const hash = await passwordHash(adminPass, salt);
  statements.push(`INSERT INTO restaurants(id,slug,email,password_hash,password_salt,data) VALUES(${[restaurant.id, restaurant.slug, adminEmail, hash, salt, JSON.stringify(publicData)].map(sqlString).join(',')});`);
}
for (const product of INITIAL_PRODUCTS) {
  statements.push(`INSERT INTO products(id,restaurant_id,data) VALUES(${[product.id, product.restaurantId, JSON.stringify(product)].map(sqlString).join(',')});`);
}
writeFileSync('migrations/0002_demo_catalog.sql', statements.join('\n') + '\n');
console.log('Catálogo de demonstração gerado.');
