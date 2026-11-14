// server/routes/cart.js
const { db } = require('../db.cjs');

function getCart(userId) {
  const items = db
    .prepare(
      `SELECT ci.*, p.name, p.price, p.image, p.stock
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?`,
    )
    .all(userId);
  return items.map((r) => ({
    lineId: `${r.product_id}:${r.size}:${r.color}`,
    productId: r.product_id,
    size: r.size,
    color: r.color,
    qty: r.qty,
    name: r.name,
    price: r.price,
    image: r.image,
    stock: r.stock,
  }));
}

function getCartRoute(req, res) {
  res.json({ items: getCart(req.user.id) });
}

function addItem(req, res) {
  const { productId, size, color, qty } = req.body || {};
  if (!productId || !size || !color) {
    return res.status(400).json({ error: "productId, size, color required" });
  }
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId);
  if (!product) return res.status(404).json({ error: "product not found" });
  const q = Math.max(1, Math.min(qty || 1, product.stock));
  db.prepare(
    `INSERT INTO cart_items (user_id, product_id, size, color, qty) VALUES (?,?,?,?,?)
     ON CONFLICT(user_id, product_id, size, color) DO UPDATE SET qty = MIN(?, qty + ?)`,
  ).run(req.user.id, productId, size, color, q, product.stock, q);
  // update cart timestamp
  db.prepare(
    "INSERT INTO carts (user_id) VALUES (?) ON CONFLICT(user_id) DO UPDATE SET updated_at=datetime('now')",
  ).run(req.user.id);
  res.json({ items: getCart(req.user.id) });
}

function updateItem(req, res) {
  const { qty } = req.body || {};
  const lineId = req.params.lineId;
  // lineId format: productId:size:color
  const parts = lineId.split(":");
  if (parts.length < 3) return res.status(400).json({ error: "bad lineId" });
  const [productId, size, color] = parts;
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId);
  if (!product) return res.status(404).json({ error: "product not found" });
  const newQty = Math.max(0, Math.min(qty || 0, product.stock));
  if (newQty === 0) {
    db.prepare(
      "DELETE FROM cart_items WHERE user_id=? AND product_id=? AND size=? AND color=?",
    ).run(req.user.id, productId, size, color);
  } else {
    db.prepare(
      "UPDATE cart_items SET qty=? WHERE user_id=? AND product_id=? AND size=? AND color=?",
    ).run(newQty, req.user.id, productId, size, color);
  }
  db.prepare(
    "INSERT INTO carts (user_id) VALUES (?) ON CONFLICT(user_id) DO UPDATE SET updated_at=datetime('now')",
  ).run(req.user.id);
  res.json({ items: getCart(req.user.id) });
}

function clearCartRoute(req, res) {
  db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(req.user.id);
  res.json({ items: [] });
}

module.exports = { getCartRoute, addItem, updateItem, clearCartRoute, getCart };