// server/routes/products.js
const { db } = require('../db.cjs');

function rowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    oldPrice: row.old_price || undefined,
    category: row.category,
    colors: JSON.parse(row.colors || "[]"),
    sizes: JSON.parse(row.sizes || "[]"),
    description: row.description,
    image: row.image,
    images: JSON.parse(row.images || "[]"),
    bestseller: !!row.bestseller,
    isNew: !!row.is_new,
    stock: row.stock,
  };
}

function listProducts(req, res) {
  const { category, q, sort, min, max, size, color, discount } = req.query;
  let sql = "SELECT * FROM products WHERE 1=1";
  const params = {};
  if (category && category !== "all") {
    sql += " AND category = @category";
    params.category = category;
  }
  if (q) {
    sql += " AND (name LIKE @q OR description LIKE @q)";
    params.q = `%${q}%`;
  }
  if (min) {
    sql += " AND price >= @min";
    params.min = Number(min);
  }
  if (max) {
    sql += " AND price <= @max";
    params.max = Number(max);
  }
  if (discount === "1") {
    sql += " AND old_price IS NOT NULL";
  }
  if (size) {
    sql += " AND sizes LIKE @size";
    params.size = `%${size}%`;
  }
  if (color) {
    sql += " AND colors LIKE @color";
    params.color = `%${color}%`;
  }
  // sort
  const sortMap = {
    "price-asc": "price ASC",
    "price-desc": "price DESC",
    new: "is_new DESC, created_at DESC",
    popular: "bestseller DESC, stock DESC",
  };
  sql += " ORDER BY " + (sortMap[sort] || "bestseller DESC, created_at DESC");
  const rows = db.prepare(sql).all(params);
  res.json(rows.map(rowToProduct));
}

function getProduct(req, res) {
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(rowToProduct(row));
}

function createProduct(req, res) {
  const p = req.body || {};
  if (!p.id || !p.name || !p.price) {
    return res.status(400).json({ error: "id, name, price required" });
  }
  db.prepare(`
    INSERT INTO products (id, name, price, old_price, category, colors, sizes, description, image, images, bestseller, is_new, stock)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    p.id, p.name, p.price, p.oldPrice || null, p.category || "clothes",
    JSON.stringify(p.colors || []), JSON.stringify(p.sizes || []),
    p.description || "", p.image || "", JSON.stringify(p.images || []),
    p.bestseller ? 1 : 0, p.isNew ? 1 : 0, p.stock || 0,
  );
  res.status(201).json(rowToProduct(db.prepare("SELECT * FROM products WHERE id=?").get(p.id)));
}

function updateProduct(req, res) {
  const p = req.body || {};
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "not found" });
  db.prepare(`
    UPDATE products SET name=@name, price=@price, old_price=@old_price, category=@category,
      colors=@colors, sizes=@sizes, description=@description, image=@image, images=@images,
      bestseller=@bestseller, is_new=@is_new, stock=@stock, updated_at=datetime('now')
    WHERE id=@id
  `).run({
    id: req.params.id,
    name: p.name ?? existing.name,
    price: p.price ?? existing.price,
    old_price: p.oldPrice !== undefined ? (p.oldPrice || null) : existing.old_price,
    category: p.category ?? existing.category,
    colors: JSON.stringify(p.colors ?? JSON.parse(existing.colors)),
    sizes: JSON.stringify(p.sizes ?? JSON.parse(existing.sizes)),
    description: p.description ?? existing.description,
    image: p.image ?? existing.image,
    images: JSON.stringify(p.images ?? JSON.parse(existing.images)),
    bestseller: p.bestseller !== undefined ? (p.bestseller ? 1 : 0) : existing.bestseller,
    is_new: p.isNew !== undefined ? (p.isNew ? 1 : 0) : existing.is_new,
    stock: p.stock !== undefined ? p.stock : existing.stock,
  });
  res.json(rowToProduct(db.prepare("SELECT * FROM products WHERE id=?").get(req.params.id)));
}

function deleteProduct(req, res) {
  const info = db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "not found" });
  res.json({ ok: true });
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };