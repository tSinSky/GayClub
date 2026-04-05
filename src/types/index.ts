export type SectionType = 'director' | 'cinematography' | 'motivation' | 'influence' | 'themes' | 'facts' | 'custom';

export interface Session {
  id: string;
  title: string;
  year: number;
  genre: string;
  date: string;
  host: string;
  poster_url: string;
  backdrop_url: string;
  director: string | null;
  runtime: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionSection {
  id: string;
  session_id: string;
  type: SectionType;
  title: string | null;
  icon: string | null;
  enabled: boolean;
  sort_order: number;
  content: SectionContent;
}

export type IconName =
  | 'Film' | 'Clapperboard' | 'Camera' | 'Video' | 'Projector'
  | 'BookOpen' | 'Lightbulb' | 'Sparkles' | 'Star' | 'Heart'
  | 'Award' | 'Crown' | 'Feather' | 'Eye' | 'Compass'
  | 'Target' | 'Zap' | 'Flame' | 'Moon' | 'Sun'
  | 'Music' | 'Palette' | 'Quote' | 'Bookmark';

export interface SectionContent {
  text?: string;
  images?: string[];
  videos?: VideoEmbed[];
  quotes?: Quote[];
  cards?: FactCard[];
  director?: DirectorInfo;
}

export interface DirectorInfo {
  name: string;
  photo: string;
  bio: string;
  filmography: Film[];
}

export interface Film {
  title: string;
  year: number;
  posterUrl: string;
}

export interface VideoEmbed {
  url: string;
  platform: 'youtube' | 'vimeo';
  title?: string;
}

export interface Quote {
  text: string;
  author?: string;
  imageUrl?: string;
}

export interface FactCard {
  title: string;
  description: string;
  imageUrl?: string;
}

export interface BingoItem {
  id: string;
  session_id: string;
  text: string;
  sort_order: number;
}

export interface RatingCategory {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

export interface Rating {
  id: string;
  session_id: string;
  user_id: string;
  scores: Record<string, number>;
  created_at: string;
}

export interface AdminSettings {
  key: string;
  value: string;
}

export interface BingoProgress {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  marked: boolean[];
  completed_at: string | null;
  win_lines: number[][] | null;
  created_at: string;
}

export interface BingoLeaderboardEntry {
  user_id: string;
  user_name: string;
  completed_at: string | null;
  win_lines: number[][];
}
