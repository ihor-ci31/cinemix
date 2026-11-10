# Cinemix 🎬

Навчальний проєкт з дисципліни **«Технології розробки web-орієнтованих систем»**
КПІ ім. Ігоря Сікорського, 2026

## Тема
Каталог фільмів та серіалів

## Склад бригади
- Григор'єв Ігор Павлович
- Карпишина Еліна Ярославівна
- Остапчук Денис Владиславович

## Що зроблено
| ЛР | Зміст |
|---|---|
| ЛР1 | Статичний адаптивний сайт: головна, каталог, сторінка фільму, «Про нас», форма реєстрації з HTML5-валідацією |
| ЛР2 | База даних SQLite (6 таблиць, 3НФ), сервер Node.js/Express, REST API з CRUD, реєстрація та вхід (bcrypt + JWT), сторінки отримують дані з API через `fetch` |

## Технічний стек
- **Клієнт:** HTML5, CSS3 (Flexbox, Grid, Media Queries), ванільний JavaScript (`fetch`)
- **Сервер:** Node.js ≥ 22.13, Express 5
- **СУБД:** SQLite (вбудований модуль `node:sqlite`, окремо встановлювати нічого не треба)
- **Безпека:** `bcryptjs` — хешування паролів, `jsonwebtoken` — JWT-токени, власна серверна валідація

## Структура проєкту
```
cinemix/
├── client/                 # фронтенд (сторінки ЛР1, переведені на API)
│   ├── index.html, catalog.html, movie.html, about.html
│   ├── register.html, login.html, admin.html
│   ├── css/                # style.css, catalog.css, forms.css, admin.css
│   ├── js/
│   │   ├── api.js          # обгортка над fetch, токен, стани завантаження/помилок
│   │   ├── layout.js       # бургер-меню, стан входу в шапці
│   │   └── home.js, catalog.js, movie.js, register.js, login.js, admin.js
│   └── img/
├── server/
│   ├── server.js           # точка входу
│   ├── app.js              # Express: маршрути /api + статичний client/
│   ├── config.js           # налаштування з .env
│   ├── db.js               # підключення до SQLite
│   ├── db/
│   │   ├── schema.sql      # таблиці, ключі, обмеження
│   │   ├── seed-data.js    # початкові дані
│   │   └── init.js         # npm run db:init
│   ├── middleware/         # auth.js (JWT, ролі), errors.js (404/500, формат помилок)
│   ├── validators/         # validate.js (тип, обов'язковість, межі)
│   └── routes/             # auth, movies, reviews, genres, stats
├── docs/
│   ├── API.md              # документація API
│   ├── er-diagram.md       # ER-діаграма та опис 3НФ
│   ├── cinemix.postman_collection.json
│   └── screenshots/
├── .env.example
└── package.json
```

## Розгортання

### 1. Вимоги
- [Node.js](https://nodejs.org/) **22.13 або новіший** (перевірити: `node -v`). Окремий сервер БД не потрібен — SQLite зберігається у файлі `data/cinemix.db`.

### 2. Встановлення
```bash
git clone https://github.com/ihor-ci31/cinemix.git
cd cinemix
npm install
```

### 3. Налаштування
Скопіюйте приклад файлу налаштувань і вкажіть власний секрет для JWT:
```bash
cp .env.example .env
```
У Windows PowerShell: `Copy-Item .env.example .env`

| Змінна | Призначення | За замовчуванням |
|---|---|---|
| `PORT` | порт сервера | `3000` |
| `DB_FILE` | шлях до файлу бази | `data/cinemix.db` |
| `JWT_SECRET` | секрет для підпису токенів (**обов'язково змінити**) | — |
| `JWT_EXPIRES_IN` | час життя токена | `7d` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | обліковий запис адміністратора, який створює `db:init` | `admin@cinemix.local` / `Admin12345` |

Згенерувати випадковий секрет:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Створення бази даних
```bash
npm run db:init
```
Команда створює таблиці за `server/db/schema.sql` і заповнює їх: 9 жанрів, 6 фільмів, акторський склад, 3 користувачі, 5 відгуків. Повторний запуск **перестворює** базу з нуля.

### 5. Запуск
```bash
npm start
```
- Сайт: http://localhost:3000
- API: http://localhost:3000/api (перевірка: http://localhost:3000/api/health)

Для розробки з автоперезапуском: `npm run dev`.

> Після ЛР2 сторінки потрібно відкривати через сервер, а не подвійним кліком по `index.html`: дані завантажуються з API.

### Демо-акаунти
| Роль | Логін | Пароль |
|---|---|---|
| admin | `admin` або `admin@cinemix.local` | `Admin12345` (з `.env`) |
| user | `shredder` | `Password123` |
| user | `alex` | `Password123` |

## REST API
Повна документація з прикладами запитів і відповідей — у [docs/API.md](docs/API.md).

| Ресурс | Ендпоінти |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Movies | `GET /api/movies`, `GET/PUT/PATCH/DELETE /api/movies/:id`, `POST /api/movies` |
| Reviews | `GET/POST /api/movies/:id/reviews`, `GET/PUT/PATCH/DELETE /api/reviews/:id` |
| Genres | `GET/POST /api/genres`, `GET/PUT/PATCH/DELETE /api/genres/:id` |
| Stats | `GET /api/stats` |

Ручне тестування: імпортуйте [docs/cinemix.postman_collection.json](docs/cinemix.postman_collection.json) у Postman.

## База даних
ER-діаграма, опис сутностей і обґрунтування 3НФ — у [docs/er-diagram.md](docs/er-diagram.md).

Таблиці: `users`, `genres`, `movies`, `actors`, `movie_actors`, `reviews`.

## Автентифікація
- Паролі зберігаються лише як bcrypt-хеш (10 раундів, із сіллю).
- Після реєстрації або входу сервер повертає JWT (`HS256`, термін — `JWT_EXPIRES_IN`).
- Клієнт зберігає токен у `localStorage` і додає заголовок `Authorization: Bearer <token>` до запитів.
- Сервер не тримає сесій (stateless): кожен запит перевіряється за підписом токена.
- Ролі: `user` — відгуки (змінювати можна лише свої); `admin` — CRUD фільмів і жанрів, модерація відгуків.

## Перевірка валідності
- [W3C Validator HTML](https://validator.w3.org/)
- [W3C CSS Validator](https://jigsaw.w3.org/css-validator/)
