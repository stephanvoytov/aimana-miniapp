// server/auth.js — Telegram initData validation + user upsert
const crypto = require("crypto");
const { db } = require('./db.cjs');

const BOT_TOKEN = process.env.BOT_TOKEN || "";

function validateInitData(initData) {
  if (!initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  if (hmac !== hash) return null;
  // check auth_date freshness (optional, 1 day)
  const authDate = Number(params.get("auth_date") || 0);
  if (authDate && Date.now() / 1000 - authDate > 86400) return null;
  let user = null;
  try {
    user = JSON.parse(params.get("user") || "null");
  } catch {
    return null;
  }
  return user;
}

function upsertUser(tgUser) {
  if (!tgUser || !tgUser.id) return null;
  const existing = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(tgUser.id);
  if (existing) {
    db.prepare(
      "UPDATE users SET username=?, first_name=?, last_name=?, photo_url=? WHERE id=?",
    ).run(
      tgUser.username || null,
      tgUser.first_name || null,
      tgUser.last_name || null,
      tgUser.photo_url || null,
      existing.id,
    );
    return db.prepare("SELECT * FROM users WHERE id = ?").get(existing.id);
  }
  const info = db
    .prepare(
      "INSERT INTO users (telegram_id, username, first_name, last_name, photo_url) VALUES (?,?,?,?,?)",
    )
    .run(
      tgUser.id,
      tgUser.username || null,
      tgUser.first_name || null,
      tgUser.last_name || null,
      tgUser.photo_url || null,
    );
  return db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
}

// Express middleware: resolves req.user (or null in demo mode)
function authMiddleware(req, res, next) {
  const initData = req.header("X-Telegram-Init-Data") || req.query.initData || "";
  if (initData) {
    const tgUser = validateInitData(initData);
    if (!tgUser) {
      return res.status(401).json({ error: "invalid initData" });
    }
    req.user = upsertUser(tgUser);
    if (!req.user) return res.status(401).json({ error: "user not found" });
    return next();
  }
  // Demo / browser mode
  if (process.env.DEMO_MODE === "1" || process.env.NODE_ENV !== "production") {
    // find or create a demo user
    let demo = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(0);
    if (!demo) {
      const info = db
        .prepare("INSERT INTO users (telegram_id, username, first_name) VALUES (?,?,?)")
        .run(0, "demo", "Demo");
      demo = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    }
    req.user = demo;
    return next();
  }
  return res.status(401).json({ error: "initData required" });
}

module.exports = { validateInitData, upsertUser, authMiddleware };