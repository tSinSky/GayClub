import { SectionContent } from '../../types';

interface Props {
  content: SectionContent;
}

export default function InfluenceSection({ content }: Props) {
  const { text } = content;

  return (
    <div className="space-y-6">
      {text && (
        <div className="prose prose-invert prose-lg max-w-none">
          {text.split('\n\n').map((paragraph, index) => (
            <p
              key={index}
              className="text-lg text-zinc-300 leading-relaxed mb-6 last:mb-0"
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
