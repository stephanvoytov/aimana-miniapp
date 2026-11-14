// server/routes/orders.js
const { db } = require('../db.cjs');
const { getCart } = require('./cart.cjs');

function createOrder(req, res) {
  const { customer, clearCart: doClear } = req.body || {};
  const items = getCart(req.user.id);
  if (!items || items.length === 0) {
    return res.status(400).json({ error: "cart is empty" });
  }
  const total = items.reduce((s, l) => s + l.price * l.qty, 0);
  const discount = items.reduce((s, l) => {
    // discount computed on frontend; accept from body if provided
    return s;
  }, 0);
  const orderId = "№" + String(Date.now()).slice(-4);
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO orders (id, user_id, total, discount, customer_name, customer_phone, customer_comment)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(
      orderId,
      req.user.id,
      total,
      req.body?.discount || 0,
      customer?.name || null,
      customer?.phone || null,
      customer?.comment || null,
    );
    const insertItem = db.prepare(
      "INSERT INTO order_items (order_id, product_id, name, size, color, qty, price) VALUES (?,?,?,?,?,?,?)",
    );
    for (const l of items) {
      insertItem.run(orderId, l.productId, l.name, l.size, l.color, l.qty, l.price);
    }
    if (doClear !== false) {
      db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(req.user.id);
    }
  });
  tx();
  // уведомление админу в Telegram (если бот запущен)
  const bot = req.app.locals && req.app.locals.bot;
  const adminChat = req.app.locals && req.app.locals.adminChat;
  if (bot && adminChat) {
    const text = `Новый заказ ${orderId}\nСумма: ${total} ₽\nПозиций: ${items.length}\nКлиент: ${customer?.name || "—"}\nТелефон: ${customer?.phone || "—"}`;
    bot.sendMessage(adminChat, text).catch(() => {});
  }
  res.status(201).json({ id: orderId, total, items });
}

function listOrders(req, res) {
  const orders = db
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50")
    .all(req.user.id);
  const result = orders.map((o) => {
    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(o.id);
    return {
      id: o.id,
      date: o.created_at,
      count: items.reduce((s, i) => s + i.qty, 0),
      total: o.total,
      status: o.status,
      items: items.map((i) => ({
        name: i.name,
        size: i.size,
        color: i.color,
        qty: i.qty,
        price: i.price,
      })),
    };
  });
  res.json(result);
}

module.exports = { createOrder, listOrders };