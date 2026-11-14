// server/routes/favorites.js
const { db } = require('../db.cjs');

function listFavorites(req, res) {
  const rows = db
    .prepare("SELECT product_id FROM favorites WHERE user_id = ?")
    .all(req.user.id);
  res.json(rows.map((r) => r.product_id));
}

function toggleFavorite(req, res) {
  const { productId } = req.body || {};
  if (!productId) return res.status(400).json({ error: "productId required" });
  const existing = db
    .prepare("SELECT 1 FROM favorites WHERE user_id = ? AND product_id = ?")
    .get(req.user.id, productId);
  if (existing) {
    db.prepare("DELETE FROM favorites WHERE user_id = ? AND product_id = ?").run(
      req.user.id,
      productId,
    );
    res.json({ fav: false });
  } else {
    db.prepare("INSERT INTO favorites (user_id, product_id) VALUES (?,?)").run(
      req.user.id,
      productId,
    );
    res.json({ fav: true });
  }
}

module.exports = { listFavorites, toggleFavorite };