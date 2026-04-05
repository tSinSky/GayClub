import { notFound } from 'next/navigation';
import Link from 'next/link';
import SessionHero from '@/components/session-hero';
import FloatingRateButton from '@/components/floating-rate-button';
import DirectorSection from '@/components/sections/director-section';
import CinematographySection from '@/components/sections/cinematography-section';
import MotivationSection from '@/components/sections/motivation-section';
import InfluenceSection from '@/components/sections/influence-section';
import ThemesSection from '@/components/sections/themes-section';
import FactsSection from '@/components/sections/facts-section';
import { Button } from '@/components/ui/button';
import { Dices } from 'lucide-react';
import TableOfContents from '@/components/table-of-contents';
import { SECTION_CONFIG, ICON_LIBRARY } from '@/lib/constants';
import SessionRatings from '@/components/session-ratings';
import { getSession } from '@/lib/actions/sessions';
import { getSessionSections } from '@/lib/actions/sections';
import { getRatingCategories } from '@/lib/actions/categories';
import { getSessionRatings } from '@/lib/actions/ratings';
import { getBingoItems } from '@/lib/actions/bingo';
import type { SectionType, SectionContent } from '@/types';

const SECTION_COMPONENTS: Record<SectionType, React.ComponentType<{ content: SectionContent }>> = {
  director: DirectorSection,
  cinematography: CinematographySection,
  motivation: MotivationSection,
  influence: InfluenceSection,
  themes: ThemesSection,
  facts: FactsSection,
};

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, sections, categories, bingoItems, ratings] = await Promise.all([
    getSession(id),
    getSessionSections(id),
    getRatingCategories(),
    getBingoItems(id),
    getSessionRatings(id),
  ]);

  if (!session) {
    notFound();
  }

  const enabledSections = sections.filter(s => s.enabled);

  return (
    <div className="min-h-screen pb-20">
      <SessionHero session={session} />

      {/* Bingo link */}
      {bingoItems.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pt-10">
          <Link href={`/session/${id}/bingo`}>
            <Button
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 w-full py-4"
            >
              <Dices className="w-5 h-5 mr-2" />
              Открыть Кино-Бинго
            </Button>
          </Link>
        </div>
      )}

      {/* Sections */}
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-20">
        {enabledSections.map((section, index) => {
          const config = SECTION_CONFIG[section.type as Exclude<SectionType, 'custom'>];
          const Icon = ICON_LIBRARY[config.iconName];
          const Component = SECTION_COMPONENTS[section.type];

          return (
            <div key={section.id} id={`section-${section.type}`} className="scroll-mt-20">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-amber-500/20">
                <Icon className="w-6 h-6 text-amber-500" />
                <h2 className="text-3xl tracking-tight font-bold">{config.title}</h2>
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

      {/* Ratings */}
      <div id="ratings" className="max-w-5xl mx-auto px-6 pb-16 scroll-mt-20">
        <SessionRatings
          sessionId={session.id}
          categories={categories}
          initialRatings={ratings}
        />
      </div>

      {/* Table of Contents */}
      <TableOfContents sections={enabledSections.map(s => ({ type: s.type, content: s.content }))} />

      {/* Floating Rate Button */}
      <FloatingRateButton
        sessionId={session.id}
        sessionTitle={session.title}
        categories={categories}
      />
    </div>
  );
}
