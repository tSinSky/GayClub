import { Camera, BookOpen, Lightbulb, Film, Sparkles, Clapperboard } from 'lucide-react';
import type { SectionType, RatingCategory } from '@/types';

export const SECTION_CONFIG: Record<
  SectionType,
  { title: string; icon: typeof Film }
> = {
  director: {
    title: 'О режиссёре',
    icon: Film,
  },
  motivation: {
    title: 'Почему этот фильм',
    icon: Clapperboard,
  },
  cinematography: {
    title: 'О сюжете',
    icon: BookOpen,
  },
  influence: {
    title: 'Влияние и контекст',
    icon: Sparkles,
  },
  themes: {
    title: 'Темы и символизм',
    icon: BookOpen,
  },
  facts: {
    title: 'Интересные факты',
    icon: Lightbulb,
  },
};

export const SECTION_TYPES: SectionType[] = [
  'director',
  'motivation',
  'cinematography',
  'influence',
  'themes',
  'facts',
];

export const DEFAULT_CATEGORIES: Omit<RatingCategory, 'sort_order'>[] = [
  { id: 'story', name: 'Сюжет', icon: null },
  { id: 'cinematography', name: 'Операторская работа', icon: null },
  { id: 'acting', name: 'Актёрская игра', icon: null },
  { id: 'direction', name: 'Режиссура', icon: null },
  { id: 'overall', name: 'Общее впечатление', icon: null },
];
