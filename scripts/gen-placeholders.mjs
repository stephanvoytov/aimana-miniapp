// Генератор плейсхолдеров: public/img/*.svg
// Запуск: node scripts/gen-placeholders.mjs
// Каждый файл — сплошная пастельная заливка без рисунка. В продакшене
// замените эти файлы на реальные фото товаров и постеры.
import { mkdirSync, writeFileSync } from "node:fs";

const flat = (w, h, fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="${fill}"/>
</svg>
`;

const shade = (hex, t) => {
  const n = parseInt(hex.slice(1), 16);
  const target = t < 0 ? 0 : 255;
  const p = Math.abs(t);
  const ch = (c) => Math.round(c + (target - c) * p);
  return `#${[ch((n >> 16) & 255), ch((n >> 8) & 255), ch(n & 255)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
};

// 800×1000 — карточка товара
const ITEMS = [
  ["eclipse", "#e7e2da"],
  ["nova", "#dfe3e6"],
  ["vogue", "#eadfd7"],
  ["classic", "#e3e4df"],
  ["linen", "#efe6d5"],
  ["hoodie", "#e2dfe9"],
  ["coat", "#e7dcd3"],
  ["pima", "#e9e7e1"],
  ["jeans", "#dce2e8"],
  ["skirt", "#ebd9d6"],
  ["tote", "#e5dccf"],
  ["belt", "#e0ddd6"],
  ["cap", "#e6e2d6"],
  ["scarf", "#e1e3e6"],
  ["earrings", "#ede3d0"],
];

// 1200×460 — постер витрины
const POSTERS = [
  ["poster-1", "#e8e1d5"],
  ["poster-2", "#e4dce7"],
  ["poster-3", "#dce4e1"],
];

mkdirSync(new URL("../public/img", import.meta.url), { recursive: true });

for (const [name, color] of ITEMS) {
  const shades = [color, shade(color, 0.35), shade(color, -0.1)];
  shades.forEach((fill, i) => {
    const file = i === 0 ? name : `${name}-${i + 1}`;
    writeFileSync(
      new URL(`../public/img/${file}.svg`, import.meta.url),
      flat(800, 1000, fill),
    );
  });
}

for (const [name, color] of POSTERS) {
  writeFileSync(
    new URL(`../public/img/${name}.svg`, import.meta.url),
    flat(1200, 460, color),
  );
}

console.log(
  "generated",
  ITEMS.length * 3 + POSTERS.length,
  "pastel placeholders -> public/img/",
);