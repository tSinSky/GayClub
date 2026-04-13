'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown, type MarkdownStorage } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

// tiptap-core's default attribute parser runs `getAttribute(name)` through a
// `fromString` helper that coerces purely-numeric strings to `Number` and
// `"true"/"false"` to booleans. For image `alt` like `![1](url)` the alt
// becomes the number `1`, which then crashes prosemirror-markdown's serializer
// with `alt.replace is not a function` on the next getMarkdown() call. Keep
// these as raw strings.
const StringAttrImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: { default: null, parseHTML: (el) => el.getAttribute('alt') },
      title: { default: null, parseHTML: (el) => el.getAttribute('title') },
    };
  },
});

// tiptap-markdown 0.9.0 does not augment @tiptap/core's Storage interface,
// so `editor.storage.markdown` is untyped under TipTap v3. Add the
// augmentation here so the rest of the codebase gets typed access.
declare module '@tiptap/core' {
  interface Storage {
    markdown: MarkdownStorage;
  }
}
import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote as QuoteIcon,
  ImagePlus,
} from 'lucide-react';
import {
  uploadAndInsertImage,
  extractImageFilesFromClipboard,
  extractImageFilesFromDataTransfer,
} from './rich-editor-image-handler';

export type RichEditorFeature =
  | 'bold'
  | 'italic'
  | 'link'
  | 'list'
  | 'heading'
  | 'blockquote'
  | 'image';

export interface RichEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  features: RichEditorFeature[];
  placeholder?: string;
  className?: string;
  /** Used to namespace uploaded images in Supabase Storage. Undefined = drafts/. */
  sessionId?: string;
}

export function RichEditor({
  value,
  onChange,
  features,
  placeholder,
  className,
  sessionId,
}: RichEditorProps) {
  const has = useMemo(
    () => (f: RichEditorFeature) => features.includes(f),
    [features]
  );

  // Keep latest sessionId in a ref so paste/drop handlers always see current value
  // without re-creating the editor.
  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const editor = useEditor({
    immediatelyRender: false, // required for Next.js SSR
    extensions: [
      StarterKit.configure({
        heading: has('heading') ? { levels: [2, 3] } : false,
        blockquote: has('blockquote') ? {} : false,
        bulletList: has('list') ? {} : false,
        orderedList: has('list') ? {} : false,
        listItem: has('list') ? {} : false,
        // We register our own Link extension below (with custom options), so
        // disable StarterKit's auto-registered link in v3 to avoid duplicates.
        link: false,
        horizontalRule: false,
        codeBlock: false,
        code: false,
        strike: false,
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
        linkify: false,
        breaks: false,
      }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
      ...(has('link')
        ? [
            Link.configure({
              openOnClick: false,
              autolink: false,
              HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
            }),
          ]
        : []),
      ...(has('image') ? [StringAttrImage.configure({ inline: false, allowBase64: false })] : []),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
  });

  // External value changes (e.g. form reset) → push into editor without emitting onUpdate
  useEffect(() => {
    if (!editor) return;
    const current = editor.storage.markdown.getMarkdown();
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  // Attach drop/paste listeners for image upload
  useEffect(() => {
    if (!editor || !has('image')) return;
    const dom = editor.view.dom;

    const onPaste = (event: ClipboardEvent) => {
      const files = extractImageFilesFromClipboard(event.clipboardData?.items ?? null);
      if (files.length === 0) return;
      event.preventDefault();
      for (const file of files) {
        void uploadAndInsertImage(editor, file, sessionIdRef.current);
      }
    };

    const onDrop = (event: DragEvent) => {
      const files = extractImageFilesFromDataTransfer(event.dataTransfer);
      if (files.length === 0) return;
      event.preventDefault();
      const coords = editor.view.posAtCoords({
        left: event.clientX,
        top: event.clientY,
      });
      for (const file of files) {
        void uploadAndInsertImage(editor, file, sessionIdRef.current, coords?.pos);
      }
    };

    dom.addEventListener('paste', onPaste);
    dom.addEventListener('drop', onDrop);
    return () => {
      dom.removeEventListener('paste', onPaste);
      dom.removeEventListener('drop', onDrop);
    };
  }, [editor, has]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        'rounded-md border border-zinc-800 bg-zinc-950/60 focus-within:border-amber-500/40 focus-within:ring-2 focus-within:ring-amber-500/20',
        className
      )}
    >
      <Toolbar editor={editor} features={features} />
      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-invert prose-sm max-w-none px-4 py-3 text-base sm:text-[13px] text-zinc-100',
          '[&_.ProseMirror]:min-h-[80px] [&_.ProseMirror]:outline-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child]:before:pointer-events-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child]:before:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child]:before:h-0',
          '[&_.ProseMirror_p.is-editor-empty:first-child]:before:text-zinc-600',
          "[&_.ProseMirror_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
          '[&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:ring-1 [&_.ProseMirror_img]:ring-white/10 [&_.ProseMirror_img]:max-h-96'
        )}
      />
    </div>
  );
}

/* --------------------------- Toolbar --------------------------- */

function ToolbarButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Button
      size="icon-sm"
      type="button"
      variant="ghost"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'size-7 rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
        active && 'bg-amber-500/15 text-amber-300'
      )}
    >
      <Icon className="size-3.5" />
    </Button>
  );
}

function Separator() {
  return <span className="mx-1 h-5 w-px bg-zinc-800" />;
}

function Toolbar({
  editor,
  features,
}: {
  editor: Editor;
  features: RichEditorFeature[];
}) {
  const has = (f: RichEditorFeature) => features.includes(f);

  const promptLink = () => {
    const previous = (editor.getAttributes('link').href as string) ?? '';
    const url = window.prompt('URL ссылки:', previous);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const promptImage = () => {
    const url = window.prompt('URL картинки:');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-800/80 px-2 py-1.5">
      {has('bold') && (
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={Bold}
          label="Жирный (Cmd+B)"
        />
      )}
      {has('italic') && (
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={Italic}
          label="Курсив (Cmd+I)"
        />
      )}

      {has('link') && (
        <>
          <Separator />
          <ToolbarButton
            active={editor.isActive('link')}
            onClick={promptLink}
            icon={LinkIcon}
            label="Ссылка"
          />
        </>
      )}

      {has('list') && (
        <>
          <Separator />
          <ToolbarButton
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            icon={List}
            label="Маркированный список"
          />
          <ToolbarButton
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            icon={ListOrdered}
            label="Нумерованный список"
          />
        </>
      )}

      {has('heading') && (
        <>
          <Separator />
          <ToolbarButton
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            icon={Heading2}
            label="Заголовок 2"
          />
          <ToolbarButton
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            icon={Heading3}
            label="Заголовок 3"
          />
        </>
      )}

      {has('blockquote') && (
        <>
          <Separator />
          <ToolbarButton
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            icon={QuoteIcon}
            label="Цитата"
          />
        </>
      )}

      {has('image') && (
        <>
          <Separator />
          <ToolbarButton
            onClick={promptImage}
            icon={ImagePlus}
            label="Картинка (drag&drop, Cmd+V или URL)"
          />
        </>
      )}
    </div>
  );
}

export default RichEditor;
