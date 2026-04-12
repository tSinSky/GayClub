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
  { id: 'scenario', name: 'Сценарий', description: 'Насколько история логична, интересна и хорошо выстроена: сюжет, диалоги, конфликты, мотивация персонажей.', icon: null },
  { id: 'direction', name: 'Режиссура', description: 'Насколько уверенно фильм поставлен: работа с актёрами, ритм сцен, подача материала и цельность видения.', icon: null },
  { id: 'acting', name: 'Актёрская игра', description: 'Насколько убедительно актёры исполняют роли: эмоции, естественность, глубина и взаимодействие между персонажами.', icon: null },
  { id: 'cinematography', name: 'Операторская работа', description: 'Насколько выразительно фильм снят: композиция кадра, свет, движение камеры, ракурсы и визуальная подача.', icon: null },
  { id: 'editing', name: 'Монтаж', description: 'Насколько хорошо фильм собран по темпу и ритму: плавность сцен, динамика, напряжение и удобство восприятия.', icon: null },
  { id: 'sound', name: 'Звук / музыка', description: 'Насколько качественно звук и музыка усиливают атмосферу, эмоции и общее впечатление от фильма.', icon: null },
  { id: 'visual_style', name: 'Визуальный стиль', description: 'Насколько цельно и выразительно выглядит фильм: цвет, декорации, костюмы, дизайн мира и общая эстетика.', icon: null },
  { id: 'themes', name: 'Тематика / смысл', description: 'Насколько фильм поднимает важные идеи, передаёт смысл и оставляет пищу для размышлений.', icon: null },
  { id: 'originality', name: 'Оригинальность', description: 'Насколько фильм ощущается свежим, самобытным и не сводится к набору знакомых решений.', icon: null },
  { id: 'overall', name: 'Общее впечатление', description: 'Итоговое личное восприятие фильма с учётом всех его сильных и слабых сторон.', icon: null },
];
