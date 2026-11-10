// Початкові дані для бази (перенесені зі статичних сторінок ЛР1)

const genres = [
  { name: 'Фантастика', slug: 'scifi' },
  { name: 'Драма', slug: 'drama' },
  { name: 'Комедія', slug: 'comedy' },
  { name: 'Бойовик', slug: 'action' },
  { name: 'Жахи', slug: 'horror' },
  { name: 'Детектив', slug: 'detective' },
  { name: 'Мелодрама', slug: 'romance' },
  { name: 'Анімація', slug: 'animation' },
  { name: 'Трилер', slug: 'thriller' },
];

const movies = [
  {
    title: 'Дюна: Частина друга', original_title: 'Dune: Part Two', year: 2024, duration_min: 166,
    country: 'США', director: 'Дені Вільньов', genre: 'scifi',
    poster_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkp5c7bmT8bctBBi8hAY8R_fw4ArfMgWRlJNa6q7N4JQ&s=10',
    description: "Пол Атрейдес об'єднується з Чані та фременами, розпочинаючи шлях помсти проти змовників, які знищили його родину. Стикаючись із вибором між любов'ю та долею Всесвіту, він намагається запобігти жахливому майбутньому, яке бачить лише він.",
  },
  {
    title: 'Оппенгеймер', original_title: 'Oppenheimer', year: 2023, duration_min: 180,
    country: 'США, Велика Британія', director: 'Крістофер Нолан', genre: 'drama',
    poster_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3nXcIbcc9M7UDFbQBgrjXTGqaNSBCofj4051AO_8SZA&s=10',
    description: 'Історія фізика Роберта Оппенгеймера, який очолив Мангеттенський проєкт зі створення атомної бомби, і ціни, яку він заплатив за своє відкриття.',
  },
  {
    title: 'Дедпул і Росомаха', original_title: 'Deadpool & Wolverine', year: 2024, duration_min: 128,
    country: 'США', director: 'Шон Леві', genre: 'comedy',
    poster_url: 'https://upload.wikimedia.org/wikipedia/uk/4/49/%D0%94%D0%B5%D0%B4%D0%BF%D1%83%D0%BB_%D1%96_%D0%A0%D0%BE%D1%81%D0%BE%D0%BC%D0%B0%D1%85%D0%B0_%28%D0%BF%D0%BE%D1%81%D1%82%D0%B5%D1%80%29.jpg',
    description: 'Дедпул отримує шанс врятувати свій світ, але для цього йому доведеться обʼєднатися з дуже неохочим Росомахою.',
  },
  {
    title: 'Веном', original_title: 'Venom', year: 2018, duration_min: 112,
    country: 'США', director: 'Рубен Флейшер', genre: 'action',
    poster_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2lpTGwTNKDVk_hkFr415LaAoTzLQO4e3EvPSSg4djBQ&s=10',
    description: 'Журналіст Едді Брок стає носієм інопланетного симбіота Венома, який дарує йому надлюдські можливості та власний характер.',
  },
  {
    title: 'Ножі наголо: Прокинься, покійнику', original_title: 'Wake Up Dead Man: A Knives Out Mystery', year: 2025, duration_min: 144,
    country: 'США', director: 'Раян Джонсон', genre: 'detective',
    poster_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4fONuSe16jjSYU3hLOrC0gpDekJi5Ayy8TS0KNBL2hg&s=10',
    description: 'Детектив Бенуа Блан береться за нову заплутану справу, у якій кожен підозрюваний має що приховувати.',
  },
  {
    title: 'Мумія Лі Кроніна', original_title: "Lee Cronin's The Mummy", year: 2026, duration_min: 133,
    country: 'США', director: 'Лі Кронін', genre: 'horror',
    poster_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAEkC-JZSGZb9H1eULo8NDWXUMwS57ABwLeiYni6K4rQ-kGc_drbYL_N8&s=10',
    description: 'Нове моторошне прочитання класичної історії про мумію від режисера фільму «Зловісні мерці: Повстання».',
  },
];

// Акторський склад (для «Дюни», як на сторінці movie.html з ЛР1)
const cast = {
  'Дюна: Частина друга': [
    ['Тімоті Шаламе', 'Пол Атрейдес', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUEPeFkVhUCjK33wHiF0VwZH9GEbpoPh-gBPb6rf-_sCrkXo2H-Om5ooIXDxjEhp-OWZGPywumlKeRvCXhRjycaM7VmQiJbPFPA-kxCw&s=10'],
    ['Зендея', 'Чані', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdX8VNuyQT-oTj7UGl5q9EaT5sVNowUHTiuBZSddI9Cw1NUvevbKuIgKIycCvJ1-pNg-jN8c9sc0jkJV4RoBWCvAWPYyeyPo_llqMa1CTO&s=10'],
    ['Остін Батлер', 'Федд-Рота', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqpCyhWOTdB7d_PsJ7ENb9-E7omvXnxfbyKiEXrGKTytIYo9GuUJuBaeRLJRlCv_lrbpXtubUxPZgtAOufR0R357Z5oJtriOgChKbrWL1PIw&s=10'],
    ["Флоренс П'ю", 'Принцеса Іруллан', 'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcTWXOvPKhoYQ9-yoJyCQxdUZSer88ubVNS0GHHYgfsCr_S4nGZLre_UM9gyRwTRqwwsyZB9zu8fxemsK5xUa3KF4JG7MkXjhdSOcLSzXBhRlhwj6L1_zP2t4vt3pHOj-OZZPhC01Ea0f_tk&s=19'],
    ['Джош Бролін', 'Гурні Халлек', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-rRQ_MFD2KxT53uIS22ok2lc721yKnNi9ueFycNFoTxErXtlTJUBChvOor7ZffDL--bZkNCSE4UA-fl_HUjEq9qL0I09tKjb43RhIQyG37A&s=10'],
    ['Хав\'єр Бардем', 'Стілгар', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQk33tN8jylWwfKzNFISb1MaRfrfSPAL6IfpWXoLjsUpQ&s=10'],
    ['Крістофер Вокен', 'Імператор Шаддам IV', 'https://filmua.org/uploads/posts/2026-03/5955843de8_2.webp'],
    ['Леа Сейду', 'Леді Марго Феринг', 'https://filmua.org/uploads/posts/2026-09/person-19456.jpg'],
  ],
};

// Демо-користувачі (паролі хешуються bcrypt під час ініціалізації)
const users = [
  { name: 'Олександр', username: 'shredder', email: 'shredder@example.com', password: 'Password123', favorite: 'scifi' },
  { name: 'Алекс', username: 'alex', email: 'alex@example.com', password: 'Password123', favorite: 'drama' },
];

const reviews = [
  { movie: 'Дюна: Частина друга', user: 'shredder', rating: 10, text: 'Абсолют сінема. Чую, часто переглядатиму.' },
  { movie: 'Дюна: Частина друга', user: 'alex', rating: 8, text: 'Щоб зрозуміти цю дилогію, варто прочитати книгу. Після оригіналу фільм дивиться зовсім інакше — 8 із 10.' },
  { movie: 'Оппенгеймер', user: 'alex', rating: 9, text: 'Три години пролітають непомітно. Сильна гра і звук.' },
  { movie: 'Дедпул і Росомаха', user: 'shredder', rating: 8, text: 'Смішно, швидко, багато відсилок для фанатів.' },
  { movie: 'Веном', user: 'alex', rating: 6, text: 'Легкий фільм на вечір, не більше.' },
];

module.exports = { genres, movies, cast, users, reviews };
