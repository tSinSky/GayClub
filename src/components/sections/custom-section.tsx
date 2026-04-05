import MarkdownContent from '@/components/ui/markdown-content';
import type { SectionContent } from '@/types';

export default function CustomSection({ content }: { content: SectionContent }) {
  if (!content.text?.trim()) return null;
  return <MarkdownContent>{content.text}</MarkdownContent>;
}
