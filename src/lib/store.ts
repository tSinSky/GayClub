// In-memory data store for development without Supabase
// When NEXT_PUBLIC_SUPABASE_URL is set to a real URL, this module is not used.

import type { Session, SessionSection, BingoItem, RatingCategory, Rating, AdminSettings, BingoProgress } from '@/types';

function uuid() {
  return crypto.randomUUID();
}

// --- Seed Data ---

const SEED_SESSION_ID = '00000000-0000-0000-0000-000000000001';

const seedSessions: Session[] = [
  {
    id: SEED_SESSION_ID,
    title: 'Blade Runner 2049',
    year: 2017,
    genre: 'Научная фантастика, Нео-нуар',
    date: '2026-03-01',
    host: 'Александр',
    poster_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
    backdrop_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200',
    director: 'Дени Вильнёв',
    runtime: '164 мин',
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const seedSections: SessionSection[] = [
  {
    id: uuid(),
    session_id: SEED_SESSION_ID,
    type: 'director',
    enabled: true,
    sort_order: 0,
    content: {
      text: 'Дени Вильнёв — канадский режиссёр, известный своим визуальным стилем и глубокими философскими темами. Его фильмы исследуют природу человечности, память и восприятие реальности.',
      director: {
        name: 'Дени Вильнёв',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
        bio: 'Дени Вильнёв родился в Квебеке в 1967 году. Начинал карьеру с независимого кино, постепенно став одним из самых влиятельных режиссёров современности.',
        filmography: [
          { title: 'Прибытие', year: 2016, posterUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=200' },
          { title: 'Дюна', year: 2021, posterUrl: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=200' },
          { title: 'Враг', year: 2013, posterUrl: 'https://images.unsplash.com/photo-1574267432644-f371a5bb90b8?w=200' },
        ],
      },
    },
  },
  {
    id: uuid(),
    session_id: SEED_SESSION_ID,
    type: 'cinematography',
    enabled: true,
    sort_order: 1,
    content: {
      text: 'Оператор Роджер Дикинс создал незабываемую визуальную атмосферу через использование тумана, неона и контрастного освещения. Каждый кадр — произведение искусства.',
      images: [
        'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600',
        'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600',
        'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600',
      ],
      videos: [
        { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', platform: 'youtube', title: 'Анализ операторской работы' },
      ],
    },
  },
  {
    id: uuid(),
    session_id: SEED_SESSION_ID,
    type: 'influence',
    enabled: true,
    sort_order: 2,
    content: {
      text: 'Blade Runner 2049 переосмыслил научно-фантастическое кино, вернув фокус на визуальное повествование и философские вопросы. Фильм повлиял на эстетику множества последующих проектов, от киберпанк-игр до музыкальных клипов.\n\nИсторический контекст: Вышедший спустя 35 лет после оригинального Blade Runner, фильм отразил современные тревоги о климате, памяти и идентичности в эпоху цифровых технологий.',
    },
  },
  {
    id: uuid(),
    session_id: SEED_SESSION_ID,
    type: 'themes',
    enabled: true,
    sort_order: 3,
    content: {
      text: 'Фильм исследует темы памяти, человечности и что значит быть «настоящим». Символизм воды, дерева и пчёл подчёркивает вопросы о жизни и воспроизводстве.',
      quotes: [
        { text: 'Умереть за правое дело — самая человечная вещь, которую мы можем сделать.', author: 'Лав', imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400' },
        { text: 'Все лучшие воспоминания — обман.', author: 'Ана Стеллайн' },
      ],
    },
  },
  {
    id: uuid(),
    session_id: SEED_SESSION_ID,
    type: 'facts',
    enabled: true,
    sort_order: 4,
    content: {
      cards: [
        { title: 'Реальные декорации', description: 'Большинство сцен снято на реальных локациях с минимальным использованием CGI. Вильнёв предпочитает практические эффекты.', imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300' },
        { title: 'Роджер Дикинс и Оскар', description: 'После 13 номинаций Роджер Дикинс наконец получил Оскар за операторскую работу в этом фильме.' },
        { title: 'Миниатюры вместо CGI', description: 'Для сцен с городскими пейзажами использовались детализированные миниатюры, снятые специальными камерами.', imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300' },
      ],
    },
  },
];

const seedBingoItems: BingoItem[] = [
  'Неоновый свет в кадре', 'Дождь или снег', 'Крупный план глаз', 'Голограмма',
  'Пустынный пейзаж', 'Персонаж смотрит в окно', 'Оранжевый/жёлтый тон', 'Минимальный диалог >1 мин',
  'Отражение в воде/стекле', 'Силуэт персонажа', 'Медленная панорама', 'Музыка Hans Zimmer усиливается',
  'Кто-то произносит «baseline»', 'Вид сверху на город', 'Воспоминание или флешбек', 'Кадр дольше 10 секунд без монтажа',
  'Дым или туман', 'Робот/репликант не понимает эмоцию', 'Старая фотография', 'Архитектура брутализм',
].map((text, i) => ({
  id: uuid(),
  session_id: SEED_SESSION_ID,
  text,
  sort_order: i,
}));

const seedCategories: RatingCategory[] = [
  { id: 'story', name: 'Сюжет', icon: null, sort_order: 0 },
  { id: 'depth', name: 'Глубина сюжета', icon: null, sort_order: 1 },
  { id: 'acting', name: 'Актёрская игра', icon: null, sort_order: 2 },
  { id: 'direction', name: 'Режиссура', icon: null, sort_order: 3 },
  { id: 'overall', name: 'Общее впечатление', icon: null, sort_order: 4 },
];

// --- In-Memory Store (singleton across hot reloads via globalThis) ---

interface Store {
  sessions: Session[];
  sections: SessionSection[];
  bingoItems: BingoItem[];
  bingoProgress: BingoProgress[];
  categories: RatingCategory[];
  ratings: Rating[];
  settings: AdminSettings[];
}

const globalStore = globalThis as unknown as { __kinoclub_store?: Store };

function getStore(): Store {
  if (!globalStore.__kinoclub_store) {
    globalStore.__kinoclub_store = {
      sessions: [...seedSessions],
      sections: [...seedSections],
      bingoItems: [...seedBingoItems],
      bingoProgress: [],
      categories: [...seedCategories],
      ratings: [],
      settings: [],
    };
  }
  return globalStore.__kinoclub_store;
}

// --- Public API ---

export const store = {
  // Sessions
  getSessions(): Session[] {
    return [...getStore().sessions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  getPublishedSessions(): Session[] {
    return getStore()
      .sessions.filter((s) => s.published)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  getSession(id: string): Session | null {
    return getStore().sessions.find((s) => s.id === id) || null;
  },

  createSession(session: Omit<Session, 'id' | 'created_at' | 'updated_at'>): Session {
    const now = new Date().toISOString();
    const newSession: Session = {
      ...session,
      id: uuid(),
      created_at: now,
      updated_at: now,
    };
    getStore().sessions.push(newSession);
    return newSession;
  },

  updateSession(id: string, updates: Partial<Session>): Session | null {
    const s = getStore();
    const idx = s.sessions.findIndex((sess) => sess.id === id);
    if (idx === -1) return null;
    s.sessions[idx] = { ...s.sessions[idx], ...updates, updated_at: new Date().toISOString() };
    return s.sessions[idx];
  },

  deleteSession(id: string): boolean {
    const s = getStore();
    const before = s.sessions.length;
    s.sessions = s.sessions.filter((sess) => sess.id !== id);
    s.sections = s.sections.filter((sec) => sec.session_id !== id);
    s.bingoItems = s.bingoItems.filter((b) => b.session_id !== id);
    s.ratings = s.ratings.filter((r) => r.session_id !== id);
    return s.sessions.length < before;
  },

  // Sections
  getSessionSections(sessionId: string): SessionSection[] {
    return getStore()
      .sections.filter((s) => s.session_id === sessionId)
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  upsertSection(
    sessionId: string,
    type: string,
    content: SessionSection['content'],
    enabled: boolean,
    sortOrder: number
  ): SessionSection {
    const s = getStore();
    const idx = s.sections.findIndex(
      (sec) => sec.session_id === sessionId && sec.type === type
    );
    if (idx !== -1) {
      s.sections[idx] = { ...s.sections[idx], content, enabled, sort_order: sortOrder };
      return s.sections[idx];
    }
    const newSection: SessionSection = {
      id: uuid(),
      session_id: sessionId,
      type: type as SessionSection['type'],
      content,
      enabled,
      sort_order: sortOrder,
    };
    s.sections.push(newSection);
    return newSection;
  },

  toggleSection(sessionId: string, type: string, enabled: boolean): boolean {
    const s = getStore();
    const sec = s.sections.find(
      (sec) => sec.session_id === sessionId && sec.type === type
    );
    if (!sec) return false;
    sec.enabled = enabled;
    return true;
  },

  // Bingo
  getBingoItems(sessionId: string): BingoItem[] {
    return getStore()
      .bingoItems.filter((b) => b.session_id === sessionId)
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  saveBingoItems(sessionId: string, items: { text: string; sort_order: number }[]): void {
    const s = getStore();
    s.bingoItems = s.bingoItems.filter((b) => b.session_id !== sessionId);
    for (const item of items) {
      s.bingoItems.push({
        id: uuid(),
        session_id: sessionId,
        text: item.text,
        sort_order: item.sort_order,
      });
    }
  },

  // Bingo Progress
  getBingoProgress(sessionId: string, userId: string): BingoProgress | null {
    return getStore().bingoProgress.find(
      (p) => p.session_id === sessionId && p.user_id === userId
    ) || null;
  },

  upsertBingoProgress(
    sessionId: string,
    userId: string,
    userName: string,
    marked: boolean[],
    completedAt: string | null,
    winLines: number[][] | null
  ): BingoProgress {
    const s = getStore();
    const idx = s.bingoProgress.findIndex(
      (p) => p.session_id === sessionId && p.user_id === userId
    );
    if (idx !== -1) {
      s.bingoProgress[idx] = {
        ...s.bingoProgress[idx],
        marked,
        completed_at: s.bingoProgress[idx].completed_at || completedAt,
        win_lines: winLines || s.bingoProgress[idx].win_lines,
      };
      return s.bingoProgress[idx];
    }
    const newProgress: BingoProgress = {
      id: uuid(),
      session_id: sessionId,
      user_id: userId,
      user_name: userName,
      marked,
      completed_at: completedAt,
      win_lines: winLines,
      created_at: new Date().toISOString(),
    };
    s.bingoProgress.push(newProgress);
    return newProgress;
  },

  getBingoLeaderboard(sessionId: string): BingoProgress[] {
    return getStore()
      .bingoProgress.filter((p) => p.session_id === sessionId && p.win_lines && p.win_lines.length > 0);
  },

  resetBingoProgress(sessionId: string, userId: string): void {
    const s = getStore();
    s.bingoProgress = s.bingoProgress.filter(
      (p) => !(p.session_id === sessionId && p.user_id === userId)
    );
  },

  // Categories
  getRatingCategories(): RatingCategory[] {
    return [...getStore().categories].sort((a, b) => a.sort_order - b.sort_order);
  },

  saveRatingCategories(categories: RatingCategory[]): void {
    getStore().categories = [...categories];
  },

  // Ratings
  getSessionRatings(sessionId: string): Rating[] {
    return getStore().ratings.filter((r) => r.session_id === sessionId);
  },

  upsertRating(sessionId: string, userId: string, scores: Record<string, number>): Rating {
    const s = getStore();
    const idx = s.ratings.findIndex(
      (r) => r.session_id === sessionId && r.user_id === userId
    );
    if (idx !== -1) {
      s.ratings[idx] = { ...s.ratings[idx], scores };
      return s.ratings[idx];
    }
    const newRating: Rating = {
      id: uuid(),
      session_id: sessionId,
      user_id: userId,
      scores,
      created_at: new Date().toISOString(),
    };
    s.ratings.push(newRating);
    return newRating;
  },

  // Settings
  getSetting(key: string): string | null {
    return getStore().settings.find((s) => s.key === key)?.value || null;
  },

  setSetting(key: string, value: string): void {
    const s = getStore();
    const idx = s.settings.findIndex((setting) => setting.key === key);
    if (idx !== -1) {
      s.settings[idx].value = value;
    } else {
      s.settings.push({ key, value });
    }
  },
};
