-- Default rating categories
INSERT INTO rating_categories (id, name, icon, sort_order) VALUES
  ('story', 'Сюжет', NULL, 0),
  ('cinematography', 'Операторская работа', NULL, 1),
  ('acting', 'Актёрская игра', NULL, 2),
  ('direction', 'Режиссура', NULL, 3),
  ('overall', 'Общее впечатление', NULL, 4)
ON CONFLICT (id) DO NOTHING;

-- Default admin password hash (cinema123)
-- bcrypt hash of 'cinema123': $2a$10$...
-- We store it in admin_settings, but the actual hash should be generated at setup time
INSERT INTO admin_settings (key, value) VALUES
  ('admin_password_hash', '$2b$10$2R/awlgZgJKs83eOZR8FjOa0x0loJfeHbgleoh3Gg9x6jcYHe5pL.')
ON CONFLICT (key) DO NOTHING;

-- Sample session: Blade Runner 2049
INSERT INTO sessions (id, title, year, genre, date, host, poster_url, backdrop_url, director, runtime, published) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Blade Runner 2049', 2017, 'Научная фантастика, Нео-нуар', '2026-03-01', 'Александр',
   'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
   'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200',
   'Дени Вильнёв', '164 мин', true);

-- Director section
INSERT INTO session_sections (session_id, type, enabled, sort_order, content) VALUES
  ('00000000-0000-0000-0000-000000000001', 'director', true, 0, '{
    "text": "Дени Вильнёв — канадский режиссёр, известный своим визуальным стилем и глубокими философскими темами. Его фильмы исследуют природу человечества, память и восприятие реальности.",
    "director": {
      "name": "Дени Вильнёв",
      "photo": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300",
      "bio": "Дени Вильнёв родился в Квебеке в 1967 году. Начинал карьеру с независимого кино, постепенно став одним из самых влиятельных режиссёров современности.",
      "filmography": [
        {"title": "Прибытие", "year": 2016, "posterUrl": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=200"},
        {"title": "Дюна", "year": 2021, "posterUrl": "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=200"},
        {"title": "Враг", "year": 2013, "posterUrl": "https://images.unsplash.com/photo-1574267432644-f371a5bb90b8?w=200"}
      ]
    }
  }');

-- Cinematography section
INSERT INTO session_sections (session_id, type, enabled, sort_order, content) VALUES
  ('00000000-0000-0000-0000-000000000001', 'cinematography', true, 1, '{
    "text": "Оператор Роджер Дикинс создал незабываемую визуальную атмосферу через использование тумана, неона и контрастного освещения. Каждый кадр — произведение искусства.",
    "images": [
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600",
      "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600",
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600"
    ],
    "videos": [
      {"url": "https://www.youtube.com/embed/dQw4w9WgXcQ", "platform": "youtube", "title": "Анализ операторской работы"}
    ]
  }');

-- Influence section
INSERT INTO session_sections (session_id, type, enabled, sort_order, content) VALUES
  ('00000000-0000-0000-0000-000000000001', 'influence', true, 2, '{
    "text": "Blade Runner 2049 переосмыслил научно-фантастическое кино, вернув фокус на визуальное повествование и философские вопросы. Фильм повлиял на эстетику множества последующих проектов, от киберпанк-игр до музыкальных клипов.\n\nИсторический контекст: Вышедший спустя 35 лет после оригинального Blade Runner, фильм отразил современные тревоги о климате, памяти и идентичности в эпоху цифровых технологий."
  }');

-- Themes section
INSERT INTO session_sections (session_id, type, enabled, sort_order, content) VALUES
  ('00000000-0000-0000-0000-000000000001', 'themes', true, 3, '{
    "text": "Фильм исследует темы памяти, человечности и что значит быть «настоящим». Символизм воды, дерева и пчёл подчёркивает вопросы о жизни и воспроизводстве.",
    "quotes": [
      {"text": "Умереть за правое дело — самая человечная вещь, которую мы можем сделать.", "author": "Лав", "imageUrl": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400"},
      {"text": "Все лучшие воспоминания — обман.", "author": "Ана Стеллайн"}
    ]
  }');

-- Facts section
INSERT INTO session_sections (session_id, type, enabled, sort_order, content) VALUES
  ('00000000-0000-0000-0000-000000000001', 'facts', true, 4, '{
    "cards": [
      {"title": "Реальные декорации", "description": "Большинство сцен снято на реальных локациях с минимальным использованием CGI. Вильнёв предпочитает практические эффекты.", "imageUrl": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300"},
      {"title": "Роджер Дикинс и Оскар", "description": "После 13 номинаций Роджер Дикинс наконец получил Оскар за операторскую работу в этом фильме."},
      {"title": "Миниатюры вместо CGI", "description": "Для сцен с городскими пейзажами использовались детализированные миниатюры, снятые специальными камерами.", "imageUrl": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300"}
    ]
  }');

-- Sample bingo items for Blade Runner 2049
INSERT INTO bingo_items (session_id, text, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Неоновый свет в кадре', 0),
  ('00000000-0000-0000-0000-000000000001', 'Дождь или снег', 1),
  ('00000000-0000-0000-0000-000000000001', 'Крупный план глаз', 2),
  ('00000000-0000-0000-0000-000000000001', 'Голограмма', 3),
  ('00000000-0000-0000-0000-000000000001', 'Пустынный пейзаж', 4),
  ('00000000-0000-0000-0000-000000000001', 'Персонаж смотрит в окно', 5),
  ('00000000-0000-0000-0000-000000000001', 'Оранжевый/жёлтый тон', 6),
  ('00000000-0000-0000-0000-000000000001', 'Минимальный диалог >1 мин', 7),
  ('00000000-0000-0000-0000-000000000001', 'Отражение в воде/стекле', 8),
  ('00000000-0000-0000-0000-000000000001', 'Силуэт персонажа', 9),
  ('00000000-0000-0000-0000-000000000001', 'Медленная панорама', 10),
  ('00000000-0000-0000-0000-000000000001', 'Музыка Hans Zimmer усиливается', 11),
  ('00000000-0000-0000-0000-000000000001', 'Кто-то произносит «baseline»', 12),
  ('00000000-0000-0000-0000-000000000001', 'Вид сверху на город', 13),
  ('00000000-0000-0000-0000-000000000001', 'Воспоминание или флешбек', 14),
  ('00000000-0000-0000-0000-000000000001', 'Кадр дольше 10 секунд без монтажа', 15),
  ('00000000-0000-0000-0000-000000000001', 'Дым или туман', 16),
  ('00000000-0000-0000-0000-000000000001', 'Робот/репликант не понимает эмоцию', 17),
  ('00000000-0000-0000-0000-000000000001', 'Старая фотография', 18),
  ('00000000-0000-0000-0000-000000000001', 'Архитектура брутализм', 19);
