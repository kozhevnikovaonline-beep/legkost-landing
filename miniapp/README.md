# ЛЁГКОСТЬ · Telegram Mini App

Мини-приложение онлайн-школы «ЛЁГКОСТЬ» (система А. Ветровой): 3 бесплатных урока (лид-магнит), тапалка «пёрышки», магазин гайдов и программ, квизы, профиль.

Полная документация: [../docs/05-mini-app.md](../docs/05-mini-app.md)

```bash
npm install
npm run dev      # демо в браузере: http://localhost:5173
npm test         # 15 тестов (экономика + проверка подписи initData)
npm run build    # сборка в dist/
npm run server   # бэкенд + бот (нужен server/.env)
```

Стек: Vite, React 19, TypeScript (strict), Telegram Web Apps API. Сервер на Node ≥ 22.18 без зависимостей.
