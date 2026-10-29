CREATE TABLE restaurants (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  data TEXT NOT NULL CHECK(json_valid(data))
);
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
  data TEXT NOT NULL CHECK(json_valid(data))
);
CREATE INDEX products_restaurant ON products(restaurant_id);
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE orders (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
  customer_hash TEXT NOT NULL,
  request_id TEXT NOT NULL,
  data TEXT NOT NULL CHECK(json_valid(data)),
  UNIQUE(customer_hash, request_id)
);
CREATE INDEX orders_restaurant ON orders(restaurant_id, sequence DESC);
CREATE INDEX orders_customer ON orders(customer_hash, sequence DESC);
CREATE TABLE auth_attempts (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
