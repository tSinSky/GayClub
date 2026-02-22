import { useParams, useNavigate } from 'react-router';
import { useState } from 'react';
import { getSession } from '../../lib/storage';
import { SessionSection as SessionSectionType } from '../../types';
import { ArrowLeft, Star, Camera, BookOpen, Lightbulb, Film as FilmIcon, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import DirectorSection from '../sections/DirectorSection';
import CinematographySection from '../sections/CinematographySection';
import InfluenceSection from '../sections/InfluenceSection';
import ThemesSection from '../sections/ThemesSection';
import FactsSection from '../sections/FactsSection';
import RatingModal from '../RatingModal';

const SECTION_CONFIG = {
  director: {
    title: 'О режиссёре',
    icon: FilmIcon,
    Component: DirectorSection,
  },
  cinematography: {
    title: 'Операторская работа',
    icon: Camera,
    Component: CinematographySection,
  },
  influence: {
    title: 'Влияние и контекст',
    icon: Sparkles,
    Component: InfluenceSection,
  },
  themes: {
    title: 'Темы и символизм',
    icon: BookOpen,
    Component: ThemesSection,
  },
  facts: {
    title: 'Интересные факты',
    icon: Lightbulb,
    Component: FactsSection,
  },
};

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const session = id ? getSession(id) : null;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4 text-zinc-400">Встреча не найдена</h1>
          <Button onClick={() => navigate('/')} variant="outline">
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  const enabledSections = session.sections.filter(s => s.enabled);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Block */}
      <div className="relative h-[60vh] md:h-[70vh]">
        {/* Backdrop */}
        <div className="absolute inset-0">
          <img
            src={session.backdropUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/70 to-zinc-950" />
        </div>

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="bg-zinc-950/50 backdrop-blur-sm hover:bg-zinc-900/70 border border-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            На главную
          </Button>
        </div>

        {/* Content */}
        <div className="relative h-full max-w-7xl mx-auto px-6 flex items-end pb-12">
          <div className="flex flex-col md:flex-row gap-8 items-end w-full">
            {/* Poster */}
            <div className="flex-shrink-0">
              <img
                src={session.posterUrl}
                alt={session.title}
                className="w-56 md:w-64 rounded-lg shadow-2xl shadow-black/60 ring-1 ring-white/10"
              />
            </div>

            {/* Meta */}
            <div className="flex-1 pb-4">
              <h1 className="text-4xl md:text-5xl mb-3 tracking-tight">
                {session.title}
              </h1>
              <div className="flex flex-wrap gap-3 text-zinc-300 mb-4">
                <span className="text-amber-400">{session.year}</span>
                <span className="text-zinc-600">•</span>
                <span>{session.genre}</span>
                {session.runtime && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span>{session.runtime}</span>
                  </>
                )}
              </div>
              {session.director && (
                <p className="text-zinc-400">
                  Режиссёр: <span className="text-zinc-200">{session.director}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-20">
        {enabledSections.map((section, index) => {
          const config = SECTION_CONFIG[section.type];
          const Icon = config.icon;
          const Component = config.Component;

          return (
            <div key={section.id} className="scroll-mt-20">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-amber-500/20">
                <Icon className="w-6 h-6 text-amber-500" />
                <h2 className="text-3xl tracking-tight">{config.title}</h2>
                <div className="ml-auto text-sm text-zinc-600">
                  {index + 1} / {enabledSections.length}
                </div>
              </div>

              {/* Section Content */}
              <Component content={section.content} />
            </div>
          );
        })}
      </div>

      {/* Floating Rate Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          size="lg"
          onClick={() => setRatingModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-xl shadow-amber-500/30 rounded-full px-6 py-6"
        >
          <Star className="w-5 h-5 mr-2" />
          Оценить
        </Button>
      </div>

      {/* Rating Modal */}
      <RatingModal
        session={session}
        open={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
      />
    </div>
  );
}
