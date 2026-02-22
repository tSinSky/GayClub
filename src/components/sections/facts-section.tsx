'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import MarkdownContent from '@/components/ui/markdown-content';
import type { SectionContent } from '@/types';

interface Props {
  content: SectionContent;
}

const COLLAPSE_THRESHOLD = 300; // characters

function FactCard({ card, wide }: { card: { title: string; description: string; imageUrl?: string }; wide: boolean }) {
  const isLong = card.description.length > COLLAPSE_THRESHOLD;
  const [expanded, setExpanded] = useState(!isLong);

  return (
    <div className={`group relative bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-800 hover:border-amber-500/30 transition-all duration-300 ${wide ? 'md:col-span-2' : ''}`}>
      {card.imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={card.imageUrl}
            alt={card.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900/80" />
        </div>
      )}
      <div className={card.imageUrl ? 'p-6' : 'p-8'}>
        <h3 className="text-xl mb-3 text-amber-400 group-hover:text-amber-300 transition-colors font-medium">
          {card.title}
        </h3>
        <div className="relative">
          <div
            className={`overflow-hidden transition-all duration-300 ${
              !expanded ? 'max-h-32' : ''
            }`}
          >
            <MarkdownContent className="prose-sm prose-p:text-zinc-400">
              {card.description}
            </MarkdownContent>
          </div>
          {isLong && !expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-900/90 to-transparent" />
          )}
        </div>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-sm text-amber-500 hover:text-amber-400 transition-colors"
          >
            {expanded ? 'Свернуть' : 'Читать далее'}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}

export default function FactsSection({ content }: Props) {
  const { cards } = content;

  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {cards.map((card, index) => (
        <FactCard key={index} card={card} wide={card.description.length > COLLAPSE_THRESHOLD} />
      ))}
    </div>
  );
}
