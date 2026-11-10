# ER-діаграма бази даних Cinemix

```mermaid
erDiagram
    GENRES ||--o{ MOVIES : "має"
    GENRES ||--o{ USERS : "улюблений жанр"
    MOVIES ||--o{ MOVIE_ACTORS : "має склад"
    ACTORS ||--o{ MOVIE_ACTORS : "грає у"
    MOVIES ||--o{ REVIEWS : "отримує"
    USERS  ||--o{ REVIEWS : "пише"

    GENRES {
        INTEGER id PK
        TEXT name UK
        TEXT slug UK
    }
    USERS {
        INTEGER id PK
        TEXT name
        TEXT username UK
        TEXT email UK
        TEXT password_hash
        TEXT role "user | admin"
        INTEGER favorite_genre_id FK
        TEXT created_at
    }
    MOVIES {
        INTEGER id PK
        TEXT title
        TEXT original_title
        INTEGER year
        INTEGER duration_min
        TEXT country
        TEXT director
        TEXT description
        TEXT poster_url
        INTEGER genre_id FK
        TEXT created_at
    }
    ACTORS {
        INTEGER id PK
        TEXT name
        TEXT photo_url
    }
    MOVIE_ACTORS {
        INTEGER movie_id PK,FK
        INTEGER actor_id PK,FK
        TEXT role_name
    }
    REVIEWS {
        INTEGER id PK
        INTEGER movie_id FK
        INTEGER user_id FK
        INTEGER rating "1..10"
        TEXT text
        TEXT created_at
        TEXT updated_at
    }
```

## Сутності

| Таблиця | Призначення | Ключі та обмеження |
|---|---|---|
| `genres` | Довідник жанрів | PK `id`; `name`, `slug` — UNIQUE |
| `users` | Зареєстровані користувачі | PK `id`; `username`, `email` — UNIQUE (без урахування регістру); `role` ∈ {user, admin}; FK `favorite_genre_id` → `genres.id` (ON DELETE SET NULL) |
| `movies` | Фільми каталогу | PK `id`; FK `genre_id` → `genres.id` (ON DELETE RESTRICT); CHECK `year` 1888–2100, `duration_min` 1–1000 |
| `actors` | Актори | PK `id` |
| `movie_actors` | Акторський склад (зв'язок M:N) | складений PK (`movie_id`, `actor_id`); обидва FK з ON DELETE CASCADE; `role_name` — атрибут зв'язку |
| `reviews` | Відгуки й оцінки | PK `id`; FK `movie_id`, `user_id` (CASCADE); CHECK `rating` 1–10; UNIQUE (`movie_id`, `user_id`) — один відгук від користувача на фільм |

## Зв'язки

- **genres 1 : N movies** — кожен фільм належить одному основному жанру.
- **genres 1 : N users** — необов'язковий улюблений жанр користувача (поле з форми реєстрації ЛР1).
- **movies M : N actors** через `movie_actors` (з роллю актора у фільмі).
- **users 1 : N reviews** і **movies 1 : N reviews**.

## Нормалізація (3НФ)

- **1НФ:** усі атрибути атомарні, повторюваних груп немає (актори винесені в окрему таблицю, а не перелічені в рядку фільму).
- **2НФ:** у таблиці зі складеним ключем `movie_actors` єдиний неключовий атрибут `role_name` залежить від усього ключа (роль конкретного актора в конкретному фільмі).
- **3НФ:** транзитивних залежностей немає — назва жанру зберігається лише в `genres`, а у фільмі та користувачі є тільки `genre_id`. Середній рейтинг фільму та кількість оцінок **не зберігаються**, а обчислюються запитом `AVG(rating)` / `COUNT(*)` по `reviews`, тому не можуть розійтися з даними.
