import {
  Film, Clapperboard, Camera, Video, Projector,
  BookOpen, Lightbulb, Sparkles, Star, Heart,
  Award, Crown, Feather, Eye, Compass,
  Target, Zap, Flame, Moon, Sun,
  Music, Palette, Quote, Bookmark,
  type LucideIcon,
} from 'lucide-react';
import type { SectionType, RatingCategory } from '@/types';

export const ICON_LIBRARY = {
  Film, Clapperboard, Camera, Video, Projector,
  BookOpen, Lightbulb, Sparkles, Star, Heart,
  Award, Crown, Feather, Eye, Compass,
  Target, Zap, Flame, Moon, Sun,
  Music, Palette, Quote, Bookmark,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICON_LIBRARY;

export const DEFAULT_CUSTOM_ICON: IconName = 'Bookmark';

export const SECTION_CONFIG: Record<
  Exclude<SectionType, 'custom'>,
  { title: string; iconName: IconName }
> = {
  director:       { title: 'О режиссёре',        iconName: 'Film' },
  motivation:     { title: 'Почему этот фильм',  iconName: 'Clapperboard' },
  cinematography: { title: 'О сюжете',           iconName: 'BookOpen' },
  influence:      { title: 'Влияние и контекст', iconName: 'Sparkles' },
  themes:         { title: 'Темы и символизм',   iconName: 'BookOpen' },
  facts:          { title: 'Интересные факты',   iconName: 'Lightbulb' },
};

export const BUILTIN_SECTION_TYPES: Array<Exclude<SectionType, 'custom'>> = [
  'director', 'motivation', 'cinematography', 'influence', 'themes', 'facts',
];

// Kept for backward compat with any code that still imports SECTION_TYPES.
// Contains only built-ins — customs are per-session and dynamic.
export const SECTION_TYPES: Array<Exclude<SectionType, 'custom'>> = BUILTIN_SECTION_TYPES;

export const MAX_CUSTOM_SECTIONS_PER_SESSION = 10;

export const DEFAULT_CATEGORIES: Omit<RatingCategory, 'sort_order'>[] = [
  { id: 'story', name: 'Сюжет', icon: null },
  { id: 'cinematography', name: 'Операторская работа', icon: null },
  { id: 'acting', name: 'Актёрская игра', icon: null },
  { id: 'direction', name: 'Режиссура', icon: null },
  { id: 'overall', name: 'Общее впечатление', icon: null },
];
