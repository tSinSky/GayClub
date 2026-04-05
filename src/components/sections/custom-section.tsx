import MarkdownContent from '@/components/ui/markdown-content';
import type { SectionContent } from '@/types';

interface Props {
  content: SectionContent;
}

export default function CustomSection({ content }: Props) {
  if (!content.text?.trim()) return null;

  return (
    <div className="space-y-6">
      <MarkdownContent className="prose-lg">{content.text}</MarkdownContent>
    </div>
  );
}
