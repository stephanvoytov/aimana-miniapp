// server/routes/admin.cjs — admin-only reads and order updates
const { db } = require("../db.cjs");

const ORDER_STATUSES = ["new", "processing", "shipped", "delivered", "cancelled"];
const RANGE_DAYS = [7, 30, 90];
const DAY_MS = 24 * 60 * 60 * 1000;

/** SQLite хранит datetime('now') в UTC без суффикса. */
function isoFromSqlite(value) {
  if (!value) return null;
  return value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
}

function sqliteFromDate(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function percentChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function stats(req, res) {
  const requested = Number(req.query.days);
  const days = RANGE_DAYS.includes(requested) ? requested : 30;

  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const currentStart = new Date(
    todayStart.getTime() - (days - 1) * DAY_MS,
  );
  const previousStart = new Date(currentStart.getTime() - days * DAY_MS);

  const currentStartSql = sqliteFromDate(currentStart);
  const previousStartSql = sqliteFromDate(previousStart);
  const nowSql = sqliteFromDate(now);

  const series = [];
  const seriesByDay = new Map();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(currentStart.getTime() + i * DAY_MS);
    const point = { date: dayKey(date), revenue: 0, orders: 0 };
    series.push(point);
    seriesByDay.set(point.date, point);
  }

  const orders = db
    .prepare("SELECT total, status, created_at FROM orders")
    .all();

  let revenue = 0;
  let paidOrders = 0;
  let currentOrders = 0;
  let previousRevenue = 0;
  let previousPaidOrders = 0;
  let previousOrders = 0;

  for (const order of orders) {
    const createdAt = order.created_at;
    if (createdAt >= currentStartSql && createdAt <= nowSql) {
      currentOrders += 1;
      const paid = order.status !== "cancelled";
      if (paid) {
        revenue += order.total;
        paidOrders += 1;
      }
      const point = seriesByDay.get(createdAt.slice(0, 10));
      if (point) {
        point.orders += 1;
        if (paid) point.revenue += order.total;
      }
    } else if (createdAt >= previousStartSql && createdAt < currentStartSql) {
      previousOrders += 1;
      if (order.status !== "cancelled") {
        previousRevenue += order.total;
        previousPaidOrders += 1;
      }
    }
  }

  const averageCheck = paidOrders > 0 ? revenue / paidOrders : 0;
  const previousAverageCheck =
    previousPaidOrders > 0 ? previousRevenue / previousPaidOrders : 0;

  const users = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
  const usersNew = db
    .prepare(
      "SELECT COUNT(*) AS c FROM users WHERE created_at >= ? AND created_at <= ?",
    )
    .get(currentStartSql, nowSql).c;
  const products = db.prepare("SELECT COUNT(*) AS c FROM products").get().c;
  const lowStock = db
    .prepare("SELECT COUNT(*) AS c FROM products WHERE stock <= 3")
    .get().c;
  const newOrders = db
    .prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'new'")
    .get().c;

  res.json({
    days,
    revenue,
    orders: currentOrders,
    averageCheck,
    users,
    usersNew,
    products,
    lowStock,
    newOrders,
    revenueDelta: percentChange(revenue, previousRevenue),
    ordersDelta: percentChange(currentOrders, previousOrders),
    averageCheckDelta: percentChange(averageCheck, previousAverageCheck),
    series,
  });
}

function listOrders(req, res) {
  const rows = db
    .prepare(
      `SELECT o.*, u.telegram_id, u.username, u.first_name, u.last_name
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC
       LIMIT 500`,
    )
    .all();
  const itemsStmt = db.prepare(
    `SELECT product_id, name, size, color, qty, price
     FROM order_items WHERE order_id = ?`,
  );

  res.json(
    rows.map((order) => {
      const items = itemsStmt.all(order.id);
      const customer =
        order.customer_name || order.customer_phone || order.customer_comment
          ? {
              name: order.customer_name || undefined,
              phone: order.customer_phone || undefined,
              comment: order.customer_comment || undefined,
            }
          : undefined;
      return {
        id: order.id,
        date: isoFromSqlite(order.created_at),
        count: items.reduce((sum, item) => sum + item.qty, 0),
        total: order.total,
        discount: order.discount || 0,
        status: order.status,
        items: items.map((item) => ({
          productId: item.product_id || undefined,
          name: item.name,
          size: item.size || undefined,
          color: item.color || undefined,
          qty: item.qty,
          price: item.price,
        })),
        customer,
        user: order.user_id
          ? {
              telegramId: order.telegram_id,
              username: order.username || undefined,
              name:
                [order.first_name, order.last_name]
                  .filter(Boolean)
                  .join(" ") || undefined,
            }
          : undefined,
      };
    }),
  );
}

function listUsers(req, res) {
  const rows = db
    .prepare(
      `SELECT u.*,
              COUNT(o.id) AS orders_count,
              COALESCE(
                SUM(CASE WHEN o.status <> 'cancelled' THEN o.total ELSE 0 END),
                0
              ) AS total_spent,
              MAX(o.created_at) AS last_order_at
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
    )
    .all();

  res.json(
    rows.map((user) => ({
      id: user.id,
      telegramId: user.telegram_id,
      username: user.username || undefined,
      firstName: user.first_name || undefined,
      lastName: user.last_name || undefined,
      name:
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        user.username ||
        `Пользователь ${user.id}`,
      photoUrl: user.photo_url || undefined,
      createdAt: isoFromSqlite(user.created_at),
      ordersCount: user.orders_count,
      totalSpent: user.total_spent,
      lastOrderAt: isoFromSqlite(user.last_order_at),
    })),
  );
}

function updateOrderStatus(req, res) {
  const { status } = req.body || {};
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: "bad status" });
  }
  const info = db
    .prepare("UPDATE orders SET status = ? WHERE id = ?")
    .run(status, req.params.id);
  if (info.changes === 0) {
    return res.status(404).json({ error: "not found" });
  }
  res.json({ ok: true, status });
}

module.exports = {
  stats,
  listOrders,
  listUsers,
  updateOrderStatus,
};
