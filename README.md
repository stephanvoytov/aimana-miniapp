# aimana-miniapp — шаблон Telegram Mini App (каталог одежды)

Чистый телеграм-подобный лейаут: шапка (Назад / название / …), поиск,
чипсы категорий с фильтрами, двухколоночная сетка товаров с избраным и
бейджами, плавающая таб-панель, экран товара, корзина с оформлением заказа,
профиль. Функциональность важнее украшений — ничего лишнего.

## Стек

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (токены = CSS-переменные темы Telegram)
- shadcn-подход к UI: `cva` + radix-dialog (bottom-sheet), lucide-иконки
  — компоненты лежат в `src/components/ui/`, их можно править напрямую
- `telegram-web-app.js` + обвязка в `src/lib/telegram.ts`
  (themeParams → CSS-переменные, BackButton, haptic feedback, `sendData` боту)
- Вне Telegram всё работает в браузере: рисуется HTML-шапка как в макете,
 checkout уходит в демо-режим

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # прод-сборка в dist/
```

## Что где менять

| Задача | Файл |
|---|---|
| Название магазина, ссылка поддержки | `src/config.ts` |
| Товары, категории, бейджи | `src/data/products.ts` |
| Картинки-плейсхолдеры | `public/img/*.svg` (регенерация: `node scripts/gen-placeholders.mjs`) |
| Палитра/тема | `src/index.css` (блок `:root`) |
| Логика корзины/избранного/роутинга | `src/state/store.tsx` |
| Экраны | `src/screens/*` |

## Как подключить к боту

1. Соберите и отдайте `dist/` по **HTTPS** (Telegram пустит только https).
2. Замените плейсхолдеры на реальные фото: либо положите файлы в
   `public/img/` под теми же именами, либо впишите свои URL в поле
   `image` в `src/data/products.ts`.
3. В BotFather: `/newapp` (или «Settings → Menu button») → укажите домен.
4. Оформление заказа отправляется боту через `WebApp.sendData` — на стороне
   бота принимайте `Message.web_app_data` (`src/lib/telegram.ts: sendToBot`).
   Подпись `initData` проверяйте на сервере по ключу бота, прежде чем
   доверять данным пользователя.
5. Избранное и корзина сейчас живут в localStorage. Для продакшена
   синхронизируйте их со своим API — точки входа: `addToCart`, `toggleFav`
   в `store.tsx`.

## Особенности лейаута (по макету)

- Шапка «Назад / aimana shop / мини-приложение / …» — это интерфейс Telegram,
  сайт её не рисует. Внутри Telegram «назад» с экрана товара — нативный
  BackButton; в браузере и поверх фото есть своя круглая кнопка возврата.
- Поиск и чипсы прилипают к верху при скролле сетки.
- Карточка: фото 4:5, сердце справа сверху (filled = в избранном),
  ниже название, цена, бейджи «Бестселлер / Новинка / −N% / Мало».
- Таб-панель — плавающая «пилюля» поверх контента, бейдж количества на «Корзине».
- Экран товара: таб-панель заменяется липкой панелью «цена × количество + В корзину».
- Тёмная тема: наследуется от темы Telegram, вне Telegram — от prefers-color-scheme.


## Backend (Node.js + SQLite)

������ �������� ������� ������ � server/:

- **��**: SQLite (better-sqlite3), ����� � server/db.cjs, ��� �� data/products.json.
- **Auth**: ��������� Telegram initData (HMAC-SHA256), demo-����� ��� ��������.
- **API**: /api/products, /api/cart, /api/orders, /api/favorites, /api/me.
- **���**: �����������, polling � dev, ����������� ������ � �������.

### ������
`ash
npm run dev:server   # ������ ������ (port 3001)
npm run dev:all      # �������� + ������ ������������
npm run seed         # ��������� ���
npm run start        # ���������
`

### ���������� ���������
���������� .env.example -> .env � ���������:
- BOT_TOKEN, ADMIN_CHAT_ID, VITE_API_URL, VITE_DEMO_MODE.

### ��������
��� ��������� ������ - � src/config.ts (��� ����� VITE_* env): ��������, ������, ��������� �����, ������, ������, URL ���������.
����� ����������� � CSS-���������� ��� ������ (applyBranding()).

### ������
������ �������� - data/products.json. �������� � ������ ������ �� ����.

