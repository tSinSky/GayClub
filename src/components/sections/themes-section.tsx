import Image from 'next/image';
import { Quote as QuoteIcon } from 'lucide-react';
import MarkdownContent from '@/components/ui/markdown-content';
import type { SectionContent } from '@/types';

interface Props {
  content: SectionContent;
}

export default function ThemesSection({ content }: Props) {
  const { text, quotes } = content;

  return (
    <div className="space-y-10">
      {text && (
        <MarkdownContent className="prose-lg">{text}</MarkdownContent>
      )}

      {/* Quotes */}
      {quotes && quotes.length > 0 && (
        <div className="space-y-6 mt-10">
          {quotes.map((quote, index) => (
            <div key={index} className="relative">
              {quote.imageUrl ? (
                // Quote with image
                <div className="relative overflow-hidden rounded-lg h-80">
                  <Image
                    src={quote.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
                  <div className="absolute inset-0 flex items-end p-8">
                    <div className="max-w-3xl">
                      <QuoteIcon className="w-8 h-8 text-amber-500 mb-4" />
                      <blockquote className="text-2xl mb-3 leading-relaxed">
                        {quote.text}
                      </blockquote>
                      {quote.author && (
                        <cite className="text-zinc-400 not-italic">
                          — {quote.author}
                        </cite>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Quote without image
                <div className="border-l-4 border-amber-500 pl-6 py-2">
                  <blockquote className="text-xl text-zinc-200 mb-2 leading-relaxed italic">
                    &ldquo;{quote.text}&rdquo;
                  </blockquote>
                  {quote.author && (
                    <cite className="text-zinc-400 not-italic">
                      — {quote.author}
                    </cite>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
