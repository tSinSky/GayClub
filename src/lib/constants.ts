import { Camera, BookOpen, Lightbulb, Film, Sparkles } from 'lucide-react';
import type { SectionType, RatingCategory } from '@/types';

export const SECTION_CONFIG: Record<
  SectionType,
  { title: string; icon: typeof Film }
> = {
  director: {
    title: 'О режиссёре',
    icon: Film,
  },
  cinematography: {
    title: 'Операторская работа',
    icon: Camera,
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
