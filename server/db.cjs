// server/db.js — SQLite (better-sqlite3) + schema + seed
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "shop.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  old_price INTEGER,
  category TEXT NOT NULL,
  colors TEXT NOT NULL DEFAULT '[]',
  sizes TEXT NOT NULL DEFAULT '[]',
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  images TEXT NOT NULL DEFAULT '[]',
  bestseller INTEGER NOT NULL DEFAULT 0,
  is_new INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS carts (
  user_id INTEGER PRIMARY KEY,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE (user_id, product_id, size, color)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  total INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  customer_name TEXT,
  customer_phone TEXT,
  customer_comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  product_id TEXT,
  name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  qty INTEGER NOT NULL,
  price INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
`);

function seedProducts() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM products").get().c;
  if (count > 0) return false;
  const seedPath = path.join(__dirname, "..", "data", "products.json");
  if (!fs.existsSync(seedPath)) {
    console.warn("seed file not found:", seedPath);
    return false;
  }
  const products = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const insert = db.prepare(`
    INSERT INTO products (id, name, price, old_price, category, colors, sizes, description, image, images, bestseller, is_new, stock)
    VALUES (@id, @name, @price, @oldPrice, @category, @colors, @sizes, @description, @image, @images, @bestseller, @isNew, @stock)
  `);
  const tx = db.transaction((rows) => {
    for (const p of rows) {
      insert.run({
        id: p.id,
        name: p.name,
        price: p.price,
        oldPrice: p.oldPrice || null,
        category: p.category,
        colors: JSON.stringify(p.colors || []),
        sizes: JSON.stringify(p.sizes || []),
        description: p.description || "",
        image: p.image || "",
        images: JSON.stringify(p.images || []),
        bestseller: p.bestseller ? 1 : 0,
        isNew: p.isNew ? 1 : 0,
        stock: p.stock || 0,
      });
    }
  });
  tx(products);
  console.log("Seeded", products.length, "products");
  return true;
}

seedProducts();

module.exports = { db };