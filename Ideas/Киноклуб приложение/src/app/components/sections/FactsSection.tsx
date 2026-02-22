import { SectionContent } from '../../types';

interface Props {
  content: SectionContent;
}

export default function FactsSection({ content }: Props) {
  const { cards } = content;

  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="group relative bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-800 hover:border-amber-500/30 transition-all duration-300"
        >
          {card.imageUrl && (
            <div className="relative h-48 overflow-hidden">
              <img
                src={card.imageUrl}
                alt={card.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900/80" />
            </div>
          )}
          <div className={card.imageUrl ? 'p-6' : 'p-8'}>
            <h3 className="text-xl mb-3 text-amber-400 group-hover:text-amber-300 transition-colors">
              {card.title}
            </h3>
            <p className="text-zinc-400 leading-relaxed">
              {card.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
