# Cinemix REST API

Базова адреса: `http://localhost:3000/api`
Формат даних: JSON (`Content-Type: application/json`).
Автентифікація: заголовок `Authorization: Bearer <JWT>`. Токен видають `POST /auth/register` і `POST /auth/login`.

Ролі: **guest** (без токена), **user**, **admin**. Адміністратор створюється командою `npm run db:init` (дані — у `.env`).

## Формат помилок

Усі помилки повертаються в одному форматі:

```json
{
  "error": "Помилка валідації",
  "details": {
    "year": "Поле «Рік» має бути не менше 1888",
    "poster_url": "Поле «Постер (URL)» має бути посиланням http(s)"
  }
}
```

| Код | Коли |
|---|---|
| 200 OK | успішне читання / оновлення |
| 201 Created | ресурс створено (заголовок `Location` вказує на нього) |
| 204 No Content | ресурс видалено |
| 400 Bad Request | помилка валідації, некоректний `id`, параметр запиту чи JSON |
| 401 Unauthorized | немає токена, токен недійсний/прострочений, невірний логін або пароль |
| 403 Forbidden | немає прав (не admin або чужий відгук) |
| 404 Not Found | ресурсу чи маршруту не існує |
| 409 Conflict | дублікат (email, нікнейм, жанр, повторний відгук) або видалення жанру з фільмами |
| 500 Internal Server Error | непередбачена помилка сервера |

## Таблиця ендпоінтів

| Метод | URL | Доступ | Опис | Успіх |
|---|---|---|---|---|
| POST | `/auth/register` | guest | Реєстрація | 201 |
| POST | `/auth/login` | guest | Вхід за email або нікнеймом | 200 |
| GET | `/auth/me` | user | Поточний користувач | 200 |
| GET | `/movies` | guest | Список фільмів (фільтр, пошук, сортування, пагінація) | 200 |
| GET | `/movies/:id` | guest | Фільм з акторським складом | 200 |
| POST | `/movies` | admin | Створити фільм | 201 |
| PUT | `/movies/:id` | admin | Повністю замінити фільм | 200 |
| PATCH | `/movies/:id` | admin | Частково оновити фільм | 200 |
| DELETE | `/movies/:id` | admin | Видалити фільм (відгуки й склад — каскадно) | 204 |
| GET | `/movies/:id/reviews` | guest | Відгуки фільму | 200 |
| POST | `/movies/:id/reviews` | user | Додати відгук (один на фільм) | 201 |
| GET | `/reviews/:id` | guest | Один відгук | 200 |
| PUT | `/reviews/:id` | автор / admin | Замінити відгук | 200 |
| PATCH | `/reviews/:id` | автор / admin | Частково змінити відгук | 200 |
| DELETE | `/reviews/:id` | автор / admin | Видалити відгук | 204 |
| GET | `/genres` | guest | Жанри з кількістю фільмів | 200 |
| GET | `/genres/:id` | guest | Один жанр | 200 |
| POST | `/genres` | admin | Створити жанр | 201 |
| PUT / PATCH | `/genres/:id` | admin | Змінити жанр | 200 |
| DELETE | `/genres/:id` | admin | Видалити жанр (лише без фільмів, інакше 409) | 204 |
| GET | `/stats` | guest | Кількість фільмів, користувачів, відгуків | 200 |
| GET | `/health` | guest | Перевірка, що сервер працює | 200 |

---

## Auth

### POST /auth/register

Правила валідації збігаються з HTML5-атрибутами форми `register.html`.

| Поле | Тип | Обмеження |
|---|---|---|
| `name` | string | обов'язкове, 2–50 символів |
| `username` | string | обов'язкове, 3–20 символів, `[a-zA-Z0-9_]`, унікальне |
| `email` | string | обов'язкове, формат email, унікальне |
| `password` | string | обов'язкове, 8–72 символи |
| `genre` | string | необов'язкове, slug існуючого жанру |
| `terms` | boolean | обов'язкове, має бути `true` |

Запит:
```json
{
  "name": "Ігор",
  "username": "igor_demo",
  "email": "igor@example.com",
  "password": "Password123",
  "genre": "scifi",
  "terms": true
}
```

Відповідь `201`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 4, "name": "Ігор", "username": "igor_demo", "email": "igor@example.com",
    "role": "user", "created_at": "2026-11-10 17:53:16",
    "favorite_genre": { "id": 1, "name": "Фантастика", "slug": "scifi" }
  }
}
```

Помилки: `400` (валідація), `409` (`{"error":"Користувач уже існує","details":{"username":"Цей нікнейм уже зайнятий"}}`).

### POST /auth/login

Запит:
```json
{ "login": "igor@example.com", "password": "Password123" }
```
`login` — email або нікнейм. Відповідь `200` — як у реєстрації (`token` + `user`).
Помилка `401`: `{"error":"Невірний email/нікнейм або пароль"}` (однакова для неіснуючого користувача і неправильного пароля).

### GET /auth/me

Заголовок `Authorization: Bearer <token>`. Відповідь `200` — об'єкт `user`. Без токена — `401`.

---

## Movies

### GET /movies

Параметри запиту:

| Параметр | Значення | За замовчуванням |
|---|---|---|
| `genre` | slug (`scifi`) або id жанру | усі |
| `q` | пошук за назвою, оригінальною назвою, режисером, актором (до 100 символів, без урахування регістру, кирилиця підтримується) | — |
| `sort` | `title`, `rating`, `year`, `new` | `title` |
| `limit` | 1–100 | 50 |
| `offset` | ≥ 0 | 0 |

Приклад: `GET /movies?genre=scifi&q=дюна&sort=rating&limit=10`

Відповідь `200`:
```json
{
  "items": [
    {
      "id": 1,
      "title": "Дюна: Частина друга",
      "original_title": "Dune: Part Two",
      "year": 2024,
      "duration_min": 166,
      "country": "США",
      "director": "Дені Вільньов",
      "description": "Пол Атрейдес об'єднується з Чані та фременами...",
      "poster_url": "https://...",
      "created_at": "2026-11-10 11:53:16",
      "rating": 9,
      "reviews_count": 2,
      "genre": { "id": 1, "name": "Фантастика", "slug": "scifi" }
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```
`rating` — середня оцінка з відгуків (`null`, якщо відгуків немає).

### GET /movies/:id

Як елемент списку, плюс акторський склад:
```json
{
  "id": 1, "title": "Дюна: Частина друга", "...": "...",
  "cast": [
    { "id": 1, "name": "Тімоті Шаламе", "photo_url": "https://...", "role_name": "Пол Атрейдес" }
  ]
}
```
`404` — фільму немає, `400` — `id` не є додатним цілим числом.

### POST /movies (admin)

| Поле | Тип | Обмеження |
|---|---|---|
| `title` | string | обов'язкове, 1–200 |
| `original_title` | string | до 200 |
| `year` | integer | обов'язкове, 1888 – (поточний рік + 10) |
| `duration_min` | integer | обов'язкове, 1–1000 |
| `genre_id` | integer | обов'язкове, існуючий жанр |
| `country`, `director` | string | до 100 |
| `description` | string | до 3000 |
| `poster_url` | string | посилання `http(s)://` |

Запит:
```json
{
  "title": "Інтерстеллар",
  "original_title": "Interstellar",
  "year": 2014,
  "duration_min": 169,
  "country": "США",
  "director": "Крістофер Нолан",
  "genre_id": 1
}
```
Відповідь `201` — створений фільм, заголовок `Location: /api/movies/7`.
Помилки: `401`, `403`, `400` (з `details` по полях).

### PUT /movies/:id (admin)

Повна заміна: потрібні всі обов'язкові поля; необов'язкові, яких немає в тілі, очищуються. Відповідь `200`.

### PATCH /movies/:id (admin)

Часткове оновлення лише переданих полів:
```json
{ "duration_min": 170 }
```
Порожнє тіло → `400 {"error":"Не передано жодного поля для оновлення"}`.

### DELETE /movies/:id (admin)

`204` без тіла. Відгуки та записи акторського складу видаляються каскадно (`ON DELETE CASCADE`).

---

## Reviews

### GET /movies/:id/reviews

Відповідь `200`:
```json
[
  {
    "id": 2, "movie_id": 1, "rating": 8,
    "text": "Щоб зрозуміти цю дилогію, варто прочитати книгу...",
    "created_at": "2026-11-10 17:53:16", "updated_at": null,
    "user": { "id": 3, "username": "alex", "name": "Алекс" }
  }
]
```

### POST /movies/:id/reviews (user)

```json
{ "rating": 9, "text": "Дуже сильний фільм, музика неймовірна." }
```
`rating` — ціле 1–10, `text` — 3–2000 символів. Відповідь `201`.
Повторний відгук того ж користувача на фільм → `409`. Без токена → `401`.

### PUT / PATCH /reviews/:id (автор або admin)

PATCH: `{ "rating": 10 }`; PUT: потрібні `rating` і `text`. Відповідь `200`, поле `updated_at` заповнюється. Чужий відгук → `403`.

### DELETE /reviews/:id (автор або admin)

`204`.

---

## Genres

`GET /genres` → `200`:
```json
[ { "id": 1, "name": "Фантастика", "slug": "scifi", "movies_count": 1 } ]
```
`POST /genres` (admin): `{ "name": "Вестерн", "slug": "western" }` → `201`; дублікат → `409`.
`DELETE /genres/:id` для жанру, до якого прив'язані фільми → `409`.

## Stats

`GET /stats` → `200`:
```json
{ "movies": 6, "users": 3, "reviews": 5, "new_this_month": 6 }
```

## Тестування в Postman

Імпортуйте [`cinemix.postman_collection.json`](cinemix.postman_collection.json) (File → Import). У колекції 36 запитів у 5 папках; кожен має тест на очікуваний статус-код. Токени (`token`, `adminToken`) та id створених ресурсів зберігаються у змінні колекції автоматично, тому запити можна запускати по черзі або через **Run collection**.
