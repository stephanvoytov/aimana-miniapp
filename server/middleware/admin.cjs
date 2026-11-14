// server/middleware/admin.js
function adminMiddleware(req, res, next) {
  const token = req.header("X-Admin-Token") || req.query.adminToken || "";
  const expected = process.env.ADMIN_TOKEN || "";
  if (!expected || token !== expected) {
    return res.status(403).json({ error: "admin token required" });
  }
  return next();
}

module.exports = { adminMiddleware };