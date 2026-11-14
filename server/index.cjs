// server/index.js — Express API + Telegram bot (polling in dev)
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const path = require("path");
const { authMiddleware } = require('./auth.cjs');
const products = require('./routes/products.cjs');
const cart = require('./routes/cart.cjs');
const orders = require('./routes/orders.cjs');
const favorites = require('./routes/favorites.cjs');
const admin = require('./routes/admin.cjs');
const { adminMiddleware } = require('./middleware/admin.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// Health
app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Products (public read, admin write)
app.get("/api/products", products.listProducts);
app.get("/api/products/:id", products.getProduct);
app.post("/api/products", adminMiddleware, products.createProduct);
app.put("/api/products/:id", adminMiddleware, products.updateProduct);
app.delete("/api/products/:id", adminMiddleware, products.deleteProduct);

// Admin endpoints
app.get("/api/admin/stats", adminMiddleware, admin.stats);
app.get("/api/admin/orders", adminMiddleware, admin.listOrders);
app.get("/api/admin/users", adminMiddleware, admin.listUsers);
app.put("/api/orders/:id/status", adminMiddleware, admin.updateOrderStatus);

// Authenticated routes
app.get("/api/me", authMiddleware, (req, res) => res.json(req.user));
app.get("/api/cart", authMiddleware, cart.getCartRoute);
app.post("/api/cart/items", authMiddleware, cart.addItem);
app.put("/api/cart/items/:lineId", authMiddleware, cart.updateItem);
app.delete("/api/cart", authMiddleware, cart.clearCartRoute);
app.get("/api/orders", authMiddleware, orders.listOrders);
app.post("/api/orders", authMiddleware, orders.createOrder);
app.get("/api/favorites", authMiddleware, favorites.listFavorites);
app.post("/api/favorites/toggle", authMiddleware, favorites.toggleFavorite);

// Serve frontend build in production
const distDir = path.join(__dirname, "..", "dist");
const fs = require("fs");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    if (fs.existsSync(distDir)) {
      res.sendFile(path.join(distDir, "index.html"));
    } else {
      next();
    }
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal error" });
});

const server = app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

// Telegram bot (optional, polling in dev)
const BOT_TOKEN = process.env.BOT_TOKEN;
if (BOT_TOKEN) {
  try {
    const { Bot } = require("node-telegram-bot-api");
    const bot = new Bot(BOT_TOKEN);
    const ADMIN_CHAT = process.env.ADMIN_CHAT_ID;
    const WEBAPP_URL = process.env.WEBAPP_URL || process.env.VITE_WEBAPP_URL || "";

    bot.command("start", (ctx) => {
      const chatId = ctx.chat && ctx.chat.id;
      if (!chatId) return;
      console.log(`[bot] /start from chat ${chatId}`);
      const text = "Добро пожаловать в магазин Aimana! Откройте Mini App кнопкой ниже.";
      if (WEBAPP_URL) {
        ctx
          .reply(text, {
            reply_markup: {
              inline_keyboard: [[{ text: "Открыть магазин", web_app: { url: WEBAPP_URL } }]],
            },
          })
          .catch(() => {});
      } else {
        ctx.reply(text).catch(() => {});
      }
    });

    // совместимость со старым кодом уведомлений о заказах
    app.locals.bot = {
      sendMessage: (chatId, text) =>
        bot.api.sendMessage({ chat_id: chatId, text }).catch(() => {}),
    };
    app.locals.adminChat = ADMIN_CHAT;

    bot
      .startPolling()
      .then(() => console.log("Telegram bot started (polling)"))
      .catch((e) => console.warn("Bot polling failed:", e && e.message));

    if (!ADMIN_CHAT) {
      console.warn("ADMIN_CHAT_ID is not set: order notifications are disabled");
    }
    if (!WEBAPP_URL) {
      console.warn("WEBAPP_URL is not set: /start will not open the Mini App");
    }
  } catch (e) {
    console.warn("Bot failed to start:", e && e.message);
  }
}

// graceful shutdown
process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
