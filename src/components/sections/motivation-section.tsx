import MarkdownContent from '@/components/ui/markdown-content';
import type { SectionContent } from '@/types';

interface Props {
  content: SectionContent;
}

export default function MotivationSection({ content }: Props) {
  const { text } = content;

  return (
    <div className="space-y-6">
      {text && (
        <MarkdownContent className="prose-lg">{text}</MarkdownContent>
      )}
    </div>
  );
}
