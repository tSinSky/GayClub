import { Session, Rating, RatingCategory } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'cinema_club_sessions',
  RATINGS: 'cinema_club_ratings',
  CATEGORIES: 'cinema_club_categories',
  ADMIN_PASSWORD: 'cinema_club_admin_password',
  GEMINI_API_KEY: 'cinema_club_gemini_key',
};

// Sessions
export function getSessions(): Session[] {
  const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return data ? JSON.parse(data) : [];
}

export function getSession(id: string): Session | null {
  const sessions = getSessions();
  return sessions.find(s => s.id === id) || null;
}

export function saveSession(session: Session): void {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

// Ratings
export function getRatings(sessionId: string): Rating[] {
  const data = localStorage.getItem(STORAGE_KEYS.RATINGS);
  const allRatings: Rating[] = data ? JSON.parse(data) : [];
  return allRatings.filter(r => r.sessionId === sessionId);
}

export function saveRating(rating: Rating): void {
  const data = localStorage.getItem(STORAGE_KEYS.RATINGS);
  const ratings: Rating[] = data ? JSON.parse(data) : [];
  const index = ratings.findIndex(
    r => r.sessionId === rating.sessionId && r.userId === rating.userId
  );
  if (index >= 0) {
    ratings[index] = rating;
  } else {
    ratings.push(rating);
  }
  localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratings));
}

// Rating Categories
export function getRatingCategories(): RatingCategory[] {
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  return data ? JSON.parse(data) : getDefaultCategories();
}

export function saveRatingCategories(categories: RatingCategory[]): void {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

function getDefaultCategories(): RatingCategory[] {
  return [
    { id: 'story', name: 'Сюжет', icon: 'BookOpen' },
    { id: 'cinematography', name: 'Операторская работа', icon: 'Camera' },
    { id: 'acting', name: 'Актёрская игра', icon: 'Users' },
    { id: 'direction', name: 'Режиссура', icon: 'Clapperboard' },
    { id: 'overall', name: 'Общее впечатление', icon: 'Star' },
  ];
}

// Admin
export function checkAdminPassword(password: string): boolean {
  const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD);
  if (!stored) {
    // Default password on first use
    const defaultPassword = 'cinema123';
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, defaultPassword);
    return password === defaultPassword;
  }
  return password === stored;
}

export function setAdminPassword(password: string): void {
  localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, password);
}

// Gemini API Key
export function getGeminiApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
}

export function saveGeminiApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key);
}
