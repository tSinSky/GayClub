'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
  children: string;
  className?: string;
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLDivElement>(null);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    setScale((prev) => {
      const next = prev * (e.deltaY < 0 ? 1.15 : 1 / 1.15);
      return Math.min(Math.max(next, 0.5), 8);
    });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale !== 1) {
      resetView();
    } else {
      setScale(3);
    }
  }, [scale, resetView]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      style={{ cursor: scale > 1 ? 'grab' : 'zoom-in' }}
      onClick={handleBackdropClick}
      onWheel={handleWheel}
    >
      {/* Close hint */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {scale !== 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); resetView(); }}
            className="px-3 py-1.5 rounded-lg bg-zinc-900/80 text-zinc-400 text-sm hover:text-zinc-200 transition-colors"
          >
            {Math.round(scale * 100)}% — сбросить
          </button>
        )}
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-lg bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center text-xl"
        >
          ×
        </button>
      </div>

      <div
        ref={imgRef}
        className="animate-in zoom-in-90 duration-200"
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          cursor: dragging.current ? 'grabbing' : undefined,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="max-h-[90vh] max-w-[90vw] rounded-xl ring-1 ring-white/10 object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}

export default function MarkdownContent({ children, className }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  const close = useCallback(() => setLightbox(null), []);

  return (
    <>
      <div
        className={[
          'prose prose-invert max-w-none',
          'prose-headings:text-zinc-100 prose-headings:font-medium',
          'prose-p:text-zinc-300 prose-p:leading-relaxed',
          'prose-strong:text-zinc-200',
          'prose-em:text-zinc-300',
          'prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline',
          'prose-ul:text-zinc-300 prose-ol:text-zinc-300',
          'prose-li:marker:text-amber-500',
          'prose-blockquote:border-amber-500 prose-blockquote:text-zinc-400',
          'prose-code:text-amber-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none',
          'prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800',
          'prose-hr:border-zinc-800',
          'prose-img:rounded-lg prose-img:ring-1 prose-img:ring-white/10 prose-img:cursor-zoom-in prose-img:transition-opacity hover:prose-img:opacity-80',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <ReactMarkdown
          components={{
            img: ({ src, alt }) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt || ''}
                className="rounded-lg ring-1 ring-white/10 cursor-zoom-in transition-opacity hover:opacity-80"
                onClick={() => src && typeof src === 'string' && setLightbox(src)}
              />
            ),
          }}
        >
          {children}
        </ReactMarkdown>
      </div>

      {lightbox && <Lightbox src={lightbox} onClose={close} />}
    </>
  );
}
