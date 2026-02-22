'use client';

import { useRef, useCallback } from 'react';
import { Star } from 'lucide-react';
import { SECTION_CONFIG } from '@/lib/constants';
import { slugify } from '@/components/ui/markdown-content';
import type { SectionType, SectionContent } from '@/types';

interface TOCProps {
  sections: Array<{
    type: SectionType;
    content: SectionContent;
  }>;
}

interface TOCItem {
  id: string;
  label: string;
  level: number; // 0 = section, 1 = h2, 2 = h3
}

function buildTOCItems(sections: TOCProps['sections']): TOCItem[] {
  const items: TOCItem[] = [];
  // Track slug counts per-section to match MarkdownContent's uniqueSlug
  // Each MarkdownContent instance has its own counter, so we reset per section
  for (const section of sections) {
    const config = SECTION_CONFIG[section.type];
    items.push({
      id: `section-${section.type}`,
      label: config.title,
      level: 0,
    });

    // Parse markdown headings from content.text (h1/h2 → level 1, h3 → level 2)
    if (section.content.text) {
      const headingRegex = /^(#{1,3})\s+(.+)$/gm;
      let match;
      while ((match = headingRegex.exec(section.content.text)) !== null) {
        const hashes = match[1].length;
        const text = match[2].trim();
        items.push({
          id: slugify(text),
          label: text,
          level: hashes <= 2 ? 1 : 2,
        });
      }
    }
  }

  // Add ratings section
  items.push({
    id: 'ratings',
    label: 'Оценки',
    level: 0,
  });

  return items;
}

export default function TableOfContents({ sections }: TOCProps) {
  const itemsRef = useRef<TOCItem[]>([]);
  itemsRef.current = buildTOCItems(sections);

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const items = itemsRef.current;

  return (
    <nav className="hidden xl:block fixed top-1/2 -translate-y-1/2 right-6 2xl:right-10 z-40 w-56 2xl:w-64 opacity-40 hover:opacity-100 transition-opacity duration-300">
      <div className="bg-zinc-900/70 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Содержание
        </p>
        <ul className="space-y-0.5">
          {items.map((item, index) => {
            const isSection = item.level === 0;

            return (
              <li key={`${item.id}-${index}`}>
                <button
                  onClick={() => handleClick(item.id)}
                  className={[
                    'block w-full text-left transition-colors duration-200 rounded-md',
                    'border-l-2 border-transparent hover:text-zinc-300 hover:bg-zinc-800/50',
                    isSection ? 'py-1.5 pr-2' : 'py-1 pr-2',
                    item.level === 0 && 'pl-2',
                    item.level === 1 && 'pl-5',
                    item.level === 2 && 'pl-8',
                    isSection && 'text-zinc-400 font-medium',
                    item.level === 1 && 'text-zinc-400',
                    item.level === 2 && 'text-zinc-500',
                    isSection ? 'text-sm' : item.level === 1 ? 'text-xs font-medium' : 'text-xs',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  title={item.label}
                >
                  {item.level === 0 && item.id === 'ratings' ? (
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                  ) : item.level === 0 ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-60" />
                      <span className="truncate">{item.label}</span>
                    </span>
                  ) : (
                    <span className="truncate block">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
