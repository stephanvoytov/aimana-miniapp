// Загрузка стоковых фото из Wikimedia Commons в public/img/.
// Запуск: node scripts/fetch-stock.mjs
// Фото — CC-лицензии, пригодны для демо. В продакшене клиент заменит
// их на свои.
import { mkdirSync, writeFileSync, existsSync, createWriteStream } from "node:fs";
import https from "node:https";

const OUT = new URL("../public/img/", import.meta.url);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "aimana-miniapp/1.0", "Accept": "application/json" } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error("timeout"));
    });
  });
}

function searchCommons(query, limit = 30) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
    "&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1200" +
    "&generator=search" +
    "&gsrsearch=" + encodeURIComponent(query) +
    "&gsrnamespace=6&gsrlimit=" + limit;
  return getJson(url).then((j) => (j.query && j.query.pages) || {});
}

function isPortrait(ii) {
  return ii.mime === "image/jpeg" && ii.width >= 500 && ii.height >= ii.width;
}

function isLandscape(ii) {
  return ii.mime === "image/jpeg" && ii.width >= 800 && ii.width >= ii.height * 1.5;
}

function pickImage(pages, predicate, used) {
  for (const p of Object.values(pages)) {
    const ii = p.imageinfo && p.imageinfo[0];
    if (!ii || used.has(ii.thumburl)) continue;
    if (predicate(ii)) return ii;
  }
  return null;
}

async function downloadWithRetry(url, outPath, retries = 5) {
  for (let i = 0; i <= retries; i++) {
    try {
      await download(url, outPath);
      return;
    } catch (e) {
      if (i === retries) throw e;
      const wait = 2500 * (i + 1);
      console.warn("  retry in", wait, "ms:", e.message);
      await sleep(wait);
    }
  }
}

function download(url, outPath) {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(outPath);
    let redirects = 0;
    const request = (u) => {
      https
        .get(u, { headers: { "User-Agent": "aimana-miniapp/1.0" } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            if (redirects++ > 5) {
              reject(new Error("too many redirects"));
              return;
            }
            request(new URL(res.headers.location, u).href);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error("HTTP " + res.statusCode + " for " + u));
            return;
          }
          res.pipe(stream);
          stream.on("finish", () => stream.close(resolve));
        })
        .on("error", reject);
    };
    request(url);
  });
}

async function collectProductImages(queries) {
  const result = [];
  const used = new Set();
  for (const q of queries) {
    if (result.length >= 3) break;
    let pages = {};
    try {
      pages = await searchCommons(q);
    } catch (e) {
      console.warn("search failed:", q, e.message);
      continue;
    }
    await sleep(500);
    while (result.length < 3) {
      const ii = pickImage(pages, isPortrait, used);
      if (!ii) break;
      result.push(ii);
      used.add(ii.thumburl);
    }
  }
  // запасные запросы, если не набрали 3 кадра
  const fallbacks = ["clothing fashion", "apparel product", "fashion model"];
  let guard = 0;
  while (result.length < 3 && guard < 8) {
    guard++;
    const q = fallbacks[guard % fallbacks.length];
    let pages = {};
    try {
      pages = await searchCommons(q);
    } catch (e) {
      console.warn("fallback search failed:", q, e.message);
      break;
    }
    await sleep(500);
    const ii = pickImage(pages, (x) => x.mime === "image/jpeg" && x.width >= 400, used);
    if (!ii) break;
    result.push(ii);
    used.add(ii.thumburl);
  }
  return result;
}

async function collectPosters() {
  const result = [];
  const used = new Set();
  const queries = ["fashion editorial", "fashion lookbook", "clothing store"];
  for (const q of queries) {
    if (result.length >= 3) break;
    let pages = {};
    try {
      pages = await searchCommons(q);
    } catch (e) {
      console.warn("search failed:", q, e.message);
      continue;
    }
    await sleep(500);
    while (result.length < 3) {
      const ii = pickImage(pages, isLandscape, used);
      if (!ii) break;
      result.push(ii);
      used.add(ii.thumburl);
    }
  }
  // запасной вариант: любой jpeg нужной ширины
  let guard = 0;
  while (result.length < 3 && guard < 8) {
    guard++;
    let pages = {};
    try {
      pages = await searchCommons("fashion");
    } catch (e) {
      break;
    }
    await sleep(500);
    const ii = pickImage(pages, (x) => x.mime === "image/jpeg" && x.width >= 800, used);
    if (!ii) break;
    result.push(ii);
    used.add(ii.thumburl);
  }
  return result.slice(0, 3);
}

const PRODUCTS = [
  { id: "eclipse", q: ["sunglasses product", "aviator sunglasses", "eyeglasses frames"] },
  { id: "nova", q: ["sunglasses", "spectacles", "reading glasses"] },
  { id: "vogue", q: ["cat eye sunglasses", "sunglasses fashion", "eyewear"] },
  { id: "classic", q: ["vintage sunglasses", "retro glasses", "round sunglasses"] },
  { id: "linen-shirt", q: ["linen shirt", "white shirt", "dress shirt"] },
  { id: "heavy-hoodie", q: ["hoodie", "sweatshirt", "fleece hoodie"] },
  { id: "wool-coat", q: ["wool coat", "winter coat", "overcoat"] },
  { id: "pima-tee", q: ["t-shirt", "basic tee", "cotton tshirt"] },
  { id: "straight-jeans", q: ["jeans", "denim jeans", "straight jeans"] },
  { id: "satin-skirt", q: ["satin skirt", "midi skirt", "skirt fashion"] },
  { id: "tote-bag", q: ["tote bag", "leather tote", "handbag"] },
  { id: "gaucho-belt", q: ["leather belt", "woven belt", "mens belt"] },
  { id: "canvas-cap", q: ["baseball cap", "canvas cap", "hat"] },
  { id: "cashmere-scarf", q: ["cashmere scarf", "scarf", "wool scarf"] },
  { id: "hoop-earrings", q: ["hoop earrings", "gold earrings", "jewelry"] },
];

mkdirSync(OUT, { recursive: true });

let ok = 0;
for (const p of PRODUCTS) {
  console.log("fetching", p.id);
  await sleep(1500);
  const imgs = await collectProductImages(p.q);
  if (imgs.length < 3) {
    console.warn("  only", imgs.length, "images for", p.id);
  }
  const names = [p.id, p.id + "-2", p.id + "-3"];
  for (let i = 0; i < 3; i++) {
    const ii = imgs[i];
    if (!ii) continue;
    const outPath = new URL(names[i] + ".jpg", OUT);
    if (existsSync(outPath)) {
      console.log("  exists", names[i] + ".jpg");
      continue;
    }
    try {
      await downloadWithRetry(ii.thumburl, outPath);
      ok++;
      manifest[names[i] + ".jpg"] = { source: ii.thumburl, width: ii.width, height: ii.height };
      console.log("  saved", names[i] + ".jpg", ii.width + "x" + ii.height);
    } catch (e) {
      console.warn("  download failed", names[i], e.message);
    }
    await sleep(1000);
  }
}

console.log("fetching posters");
const posters = await collectPosters();
for (let i = 0; i < 3; i++) {
  const ii = posters[i];
  if (!ii) {
    console.warn("  no poster", i + 1);
    continue;
  }
  const outPath = new URL("poster-" + (i + 1) + ".jpg", OUT);
  if (existsSync(outPath)) {
    console.log("  exists poster-" + (i + 1) + ".jpg");
    continue;
  }
  try {
    await downloadWithRetry(ii.thumburl, outPath);
    ok++;
    manifest["poster-" + (i + 1) + ".jpg"] = { source: ii.thumburl, width: ii.width, height: ii.height };
    console.log("  saved poster-" + (i + 1) + ".jpg", ii.width + "x" + ii.height);
  } catch (e) {
    console.warn("  download failed poster", i + 1, e.message);
  }
  await sleep(1000);
}

const manifest = {};

// ... (rest of script)

// At the end, before console.log done:
writeFileSync(new URL("manifest.json", OUT), JSON.stringify(manifest, null, 2));