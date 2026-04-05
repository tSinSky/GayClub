import { SECTION_CONFIG, ICON_LIBRARY, DEFAULT_CUSTOM_ICON, type IconName } from './constants';
import type { SessionSection, SectionType } from '@/types';
import type { LucideIcon } from 'lucide-react';

type SectionDisplayable = Pick<SessionSection, 'type' | 'title' | 'icon'>;

/**
 * Resolves the display title for a section:
 *   1. Per-session override (`section.title`), trimmed non-empty
 *   2. Default from SECTION_CONFIG for built-in types
 *   3. Generic fallback 'Раздел' for custom sections without title
 *   4. Empty string as last resort (shouldn't happen if data is valid)
 */
export function getSectionTitle(section: SectionDisplayable): string {
  if (section.title && section.title.trim()) return section.title;
  if (section.type === 'custom') return 'Раздел';
  const builtin = section.type as Exclude<SectionType, 'custom'>;
  return SECTION_CONFIG[builtin]?.title ?? '';
}

/**
 * Resolves the icon name for a section, validating that it exists in
 * ICON_LIBRARY. Unknown names silently fall back to defaults — this
 * keeps rendering robust if the library is ever trimmed.
 */
export function getSectionIconName(section: SectionDisplayable): IconName {
  if (section.icon && section.icon in ICON_LIBRARY) {
    return section.icon as IconName;
  }
  if (section.type === 'custom') return DEFAULT_CUSTOM_ICON;
  const builtin = section.type as Exclude<SectionType, 'custom'>;
  return SECTION_CONFIG[builtin]?.iconName ?? DEFAULT_CUSTOM_ICON;
}

/**
 * Resolves the actual Lucide component for a section.
 */
export function getSectionIcon(section: SectionDisplayable): LucideIcon {
  return ICON_LIBRARY[getSectionIconName(section)];
}
