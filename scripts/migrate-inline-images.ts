/**
 * One-time migration: move SectionContent.images[] into inline markdown inside content.text.
 *
 * Run: npx tsx scripts/migrate-inline-images.ts
 *
 * Idempotent: after the first run, content.images is empty/absent, so re-running is a no-op.
 *
 * Before running on production:
 *   1. Take a database snapshot: `supabase db dump -f backup.sql`
 *   2. Verify the dev run first.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

type SectionRow = {
  id: string;
  content: {
    text?: string;
    images?: string[];
    [k: string]: unknown;
  };
};

async function main() {
  console.log('Fetching all session_sections…');
  const { data, error } = await supabase.from('session_sections').select('id, content');

  if (error) {
    console.error('Fetch failed:', error);
    process.exit(1);
  }

  const rows = (data ?? []) as SectionRow[];
  console.log(`Found ${rows.length} sections total.`);

  let migratedSections = 0;
  let movedImages = 0;

  for (const row of rows) {
    const images = Array.isArray(row.content?.images) ? row.content.images : [];
    const realImages = images.filter((u) => typeof u === 'string' && u.trim().length > 0);

    if (realImages.length === 0) {
      // Nothing to migrate. If the field still exists (empty array or bad value), clean it.
      if ('images' in row.content) {
        const { images: _drop, ...rest } = row.content;
        void _drop;
        const { error: updateError } = await supabase
          .from('session_sections')
          .update({ content: rest })
          .eq('id', row.id);
        if (updateError) {
          console.error(`Failed to clean empty images on ${row.id}:`, updateError);
        }
      }
      continue;
    }

    const oldText = typeof row.content.text === 'string' ? row.content.text : '';
    const imagesMarkdown = realImages.map((url) => `![](${url})`).join('\n\n');
    const newText = oldText.trim().length > 0 ? `${oldText}\n\n${imagesMarkdown}` : imagesMarkdown;

    const { images: _drop, ...rest } = row.content;
    void _drop;
    const newContent = { ...rest, text: newText };

    const { error: updateError } = await supabase
      .from('session_sections')
      .update({ content: newContent })
      .eq('id', row.id);

    if (updateError) {
      console.error(`Failed to migrate section ${row.id}:`, updateError);
      continue;
    }

    migratedSections += 1;
    movedImages += realImages.length;
    console.log(`  migrated ${row.id}: ${realImages.length} images appended to text`);
  }

  console.log('---');
  console.log(`Done. ${migratedSections} sections migrated, ${movedImages} images moved.`);
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
