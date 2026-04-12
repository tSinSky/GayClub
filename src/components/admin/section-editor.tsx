'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RichEditor } from '@/components/ui/rich-editor';
import {
  Plus,
  Trash2,
  Film,
  User,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Quote as QuoteIcon,
  FileText,
  BookOpen,
  Lightbulb,
  Type,
} from 'lucide-react';
import type {
  SectionType,
  SectionContent,
  DirectorInfo,
  Film as FilmType,
  Quote,
  FactCard,
} from '@/types';

interface Props {
  type: SectionType;
  content: SectionContent;
  onChange: (content: SectionContent) => void;
  sessionId?: string;
}

/* ================================================================== */
/* Reusable building blocks                                            */
/* ================================================================== */

function SubsectionHeader({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60">
          <Icon className="size-3.5 text-amber-400/80" />
        </div>
        <div>
          <div className="text-[13px] font-semibold tracking-tight text-zinc-100">{title}</div>
          {hint && <div className="text-[11px] leading-tight text-zinc-500">{hint}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

function AddButton({ onClick, label = 'Добавить' }: { onClick: () => void; label?: string }) {
  return (
    <Button
      size="sm"
      variant="outline"
      type="button"
      onClick={onClick}
      className="h-8 gap-1.5 rounded-lg border-zinc-800 bg-zinc-900/60 px-3 text-[11px] font-medium text-zinc-300 transition-all hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-300"
    >
      <Plus className="size-3" />
      {label}
    </Button>
  );
}

function DeleteIconButton({
  onClick,
  label = 'Удалить',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      type="button"
      onClick={onClick}
      aria-label={label}
      className="size-8 shrink-0 rounded-lg text-zinc-500 transition-all hover:bg-red-500/10 hover:text-red-400"
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}

function FieldWrap({
  label,
  icon: Icon,
  children,
  className = '',
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">
        {Icon && <Icon className="size-3" />}
        {label}
      </Label>
      {children}
    </div>
  );
}

/* Icon-prefixed input */
function IconInput({
  icon: Icon,
  className = '',
  ...props
}: React.ComponentProps<typeof Input> & {
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
      <Input
        {...props}
        className={`h-10 border-zinc-800 bg-zinc-950/60 pl-9 text-base sm:text-[13px] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20 ${className}`}
      />
    </div>
  );
}

/* Empty state for list-style subsections */
function EmptyList({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800/70 bg-zinc-950/30 px-6 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60">
        <Icon className="size-4 text-zinc-600" />
      </div>
      <p className="text-[11px] text-zinc-500">{label}</p>
    </div>
  );
}

/* ================================================================== */
/* Main editor                                                         */
/* ================================================================== */

export default function SectionEditor({ type, content, onChange, sessionId }: Props) {
  const updateText = (text: string) => {
    onChange({ ...content, text });
  };

  /* --- Director helpers --- */
  const updateDirector = (updates: Partial<DirectorInfo>) => {
    const currentDirector = content.director || { name: '', photo: '', bio: '', filmography: [] };
    onChange({ ...content, director: { ...currentDirector, ...updates } });
  };

  const addFilm = () => {
    const films = content.director?.filmography || [];
    updateDirector({
      filmography: [...films, { title: '', year: new Date().getFullYear(), posterUrl: '' }],
    });
  };

  const updateFilm = (index: number, updates: Partial<FilmType>) => {
    const films = [...(content.director?.filmography || [])];
    films[index] = { ...films[index], ...updates };
    updateDirector({ filmography: films });
  };

  const removeFilm = (index: number) => {
    const films = (content.director?.filmography || []).filter((_, i) => i !== index);
    updateDirector({ filmography: films });
  };

  /* --- Video helpers --- */
  const addVideo = () => {
    onChange({
      ...content,
      videos: [...(content.videos || []), { url: '', platform: 'youtube' }],
    });
  };

  const updateVideo = (index: number, url: string) => {
    const videos = [...(content.videos || [])];
    videos[index] = { ...videos[index], url };
    onChange({ ...content, videos });
  };

  const removeVideo = (index: number) => {
    onChange({
      ...content,
      videos: (content.videos || []).filter((_, i) => i !== index),
    });
  };

  /* --- Quote helpers --- */
  const addQuote = () => {
    onChange({ ...content, quotes: [...(content.quotes || []), { text: '', author: '' }] });
  };

  const updateQuote = (index: number, field: keyof Quote, value: string) => {
    const quotes = [...(content.quotes || [])];
    quotes[index] = { ...quotes[index], [field]: value };
    onChange({ ...content, quotes });
  };

  const removeQuote = (index: number) => {
    onChange({
      ...content,
      quotes: (content.quotes || []).filter((_, i) => i !== index),
    });
  };

  /* --- Card helpers --- */
  const addCard = () => {
    onChange({ ...content, cards: [...(content.cards || []), { title: '', description: '' }] });
  };

  const updateCard = (index: number, field: keyof FactCard, value: string) => {
    const cards = [...(content.cards || [])];
    cards[index] = { ...cards[index], [field]: value };
    onChange({ ...content, cards });
  };

  const removeCard = (index: number) => {
    onChange({
      ...content,
      cards: (content.cards || []).filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/* Main text                                                     */}
      {/* ============================================================ */}
      <div>
        <Label className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">
          <Type className="size-3" />
          Основной текст
        </Label>
        <RichEditor
          value={content.text || ''}
          onChange={updateText}
          features={['bold', 'italic', 'link', 'list', 'heading', 'blockquote', 'image']}
          placeholder="Основной текст раздела…"
          className="min-h-36"
          sessionId={sessionId}
        />
      </div>

      {/* ============================================================ */}
      {/* Director-specific                                             */}
      {/* ============================================================ */}
      {type === 'director' && (
        <div className="space-y-6 rounded-2xl border border-zinc-800/70 bg-zinc-950/30 p-4 sm:p-5 md:p-6">
          <div className="flex items-center gap-3 border-b border-zinc-800/60 pb-4">
            <div className="flex size-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/5">
              <User className="size-4 text-amber-400/80" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-100">Информация о режиссёре</div>
              <div className="text-[11px] text-zinc-500">
                Персональные данные, биография и фильмография
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
            <FieldWrap label="Имя" icon={User}>
              <IconInput
                icon={User}
                value={content.director?.name || ''}
                onChange={(e) => updateDirector({ name: e.target.value })}
                placeholder="Дени Вильнёв"
              />
            </FieldWrap>

            <FieldWrap label="Фото URL" icon={ImageIcon}>
              <IconInput
                icon={ImageIcon}
                value={content.director?.photo || ''}
                onChange={(e) => updateDirector({ photo: e.target.value })}
                placeholder="https://…"
                className="font-mono"
              />
            </FieldWrap>
          </div>

          <FieldWrap label="Биография" icon={FileText}>
            <RichEditor
              value={content.director?.bio || ''}
              onChange={(md) => updateDirector({ bio: md })}
              features={['bold', 'italic', 'link', 'list', 'image']}
              placeholder="Биография режиссёра…"
              className="min-h-28"
              sessionId={sessionId}
            />
          </FieldWrap>

          {/* Filmography list */}
          <div>
            <SubsectionHeader
              icon={Film}
              title="Фильмография"
              hint="Ключевые работы режиссёра"
              action={<AddButton onClick={addFilm} label="Добавить фильм" />}
            />

            {(content.director?.filmography || []).length === 0 ? (
              <EmptyList icon={Film} label="Пока нет добавленных фильмов" />
            ) : (
              <div className="space-y-2.5">
                {(content.director?.filmography || []).map((film, i) => (
                  <div
                    key={i}
                    className="group/row rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-2.5 transition-colors hover:border-zinc-700/70"
                  >
                    <div className="flex items-start gap-2">
                      {/* Poster thumbnail */}
                      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                        {film.posterUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={film.posterUrl}
                            alt={film.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Film className="size-4 text-zinc-700" />
                        )}
                      </div>

                      <div className="grid min-w-0 flex-1 grid-cols-[1fr_80px] gap-2 md:grid-cols-[1fr_90px_1.2fr]">
                        <Input
                          value={film.title}
                          onChange={(e) => updateFilm(i, { title: e.target.value })}
                          placeholder="Название"
                          className="h-10 border-zinc-800 bg-zinc-950/60 text-base sm:text-[13px] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
                        />
                        <Input
                          type="number"
                          value={film.year}
                          onChange={(e) => updateFilm(i, { year: parseInt(e.target.value) || 0 })}
                          placeholder="Год"
                          className="h-10 border-zinc-800 bg-zinc-950/60 text-base sm:text-[13px] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
                        />
                        <Input
                          value={film.posterUrl}
                          onChange={(e) => updateFilm(i, { posterUrl: e.target.value })}
                          placeholder="URL постера"
                          className="col-span-2 h-10 border-zinc-800 bg-zinc-950/60 font-mono text-base sm:text-[12px] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20 md:col-span-1"
                        />
                      </div>

                      <DeleteIconButton onClick={() => removeFilm(i)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Cinematography / Plot — images + videos                       */}
      {/* ============================================================ */}
      {type === 'cinematography' && (
        <div className="space-y-6">
          {/* Videos */}
          <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/30 p-4 sm:p-5 md:p-6">
            <SubsectionHeader
              icon={Video}
              title="Видео"
              hint="YouTube, Vimeo — embed-ссылки"
              action={<AddButton onClick={addVideo} />}
            />
            {(content.videos || []).length === 0 ? (
              <EmptyList icon={Video} label="Видео не добавлены" />
            ) : (
              <div className="space-y-2.5">
                {(content.videos || []).map((vid, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-2 transition-colors hover:border-zinc-700/70"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950">
                      <Video className="size-4 text-zinc-600" />
                    </div>
                    <IconInput
                      icon={LinkIcon}
                      value={vid.url}
                      onChange={(e) => updateVideo(i, e.target.value)}
                      placeholder="https://www.youtube.com/embed/…"
                      className="font-mono"
                    />
                    <DeleteIconButton onClick={() => removeVideo(i)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Themes — quotes                                               */}
      {/* ============================================================ */}
      {type === 'themes' && (
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/30 p-4 sm:p-5 md:p-6">
          <SubsectionHeader
            icon={QuoteIcon}
            title="Цитаты"
            hint="Запоминающиеся реплики из фильма"
            action={<AddButton onClick={addQuote} label="Добавить цитату" />}
          />

          {(content.quotes || []).length === 0 ? (
            <EmptyList icon={QuoteIcon} label="Цитат пока нет" />
          ) : (
            <div className="space-y-3">
              {(content.quotes || []).map((quote, i) => (
                <div
                  key={i}
                  className="group/quote relative overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-700"
                >
                  <QuoteIcon className="pointer-events-none absolute -right-2 -top-2 size-16 text-amber-500/[0.04]" />

                  <div className="relative space-y-3">
                    <div>
                      <Label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                        <QuoteIcon className="size-3" />
                        Текст цитаты
                      </Label>
                      <RichEditor
                        value={quote.text}
                        onChange={(md) => updateQuote(i, 'text', md)}
                        features={['bold', 'italic']}
                        placeholder="«Всё, что я видел, исчезнет во времени, как слёзы под дождём…»"
                        className="min-h-20"
                        sessionId={sessionId}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <FieldWrap label="Автор" icon={User}>
                        <IconInput
                          icon={User}
                          value={quote.author || ''}
                          onChange={(e) => updateQuote(i, 'author', e.target.value)}
                          placeholder="Рой Батти"
                        />
                      </FieldWrap>
                      <FieldWrap label="URL изображения" icon={ImageIcon}>
                        <IconInput
                          icon={ImageIcon}
                          value={quote.imageUrl || ''}
                          onChange={(e) => updateQuote(i, 'imageUrl', e.target.value)}
                          placeholder="https://…"
                          className="font-mono"
                        />
                      </FieldWrap>
                    </div>
                  </div>

                  <div className="relative mt-4 flex justify-end border-t border-zinc-800/60 pt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => removeQuote(i)}
                      className="h-7 gap-1.5 rounded-md px-2.5 text-[11px] text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="size-3" />
                      Удалить цитату
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* Facts — knowledge cards                                       */}
      {/* ============================================================ */}
      {type === 'facts' && (
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/30 p-4 sm:p-5 md:p-6">
          <SubsectionHeader
            icon={Lightbulb}
            title="Карточки фактов"
            hint="Интересные факты о фильме и его создании"
            action={<AddButton onClick={addCard} label="Добавить карточку" />}
          />

          {(content.cards || []).length === 0 ? (
            <EmptyList icon={Lightbulb} label="Карточек пока нет" />
          ) : (
            <div className="space-y-3">
              {(content.cards || []).map((card, i) => (
                <div
                  key={i}
                  className="group/card relative overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-700"
                >
                  {/* Corner index */}
                  <div className="pointer-events-none absolute right-4 top-4 hidden font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700 sm:block">
                    № {String(i + 1).padStart(2, '0')}
                  </div>

                  <div className="space-y-3 sm:pr-16">
                    <FieldWrap label="Заголовок" icon={BookOpen}>
                      <IconInput
                        icon={BookOpen}
                        value={card.title}
                        onChange={(e) => updateCard(i, 'title', e.target.value)}
                        placeholder="Неожиданный факт"
                      />
                    </FieldWrap>

                    <FieldWrap label="Описание" icon={FileText}>
                      <RichEditor
                        value={card.description}
                        onChange={(md) => updateCard(i, 'description', md)}
                        features={['bold', 'italic', 'link', 'list', 'image']}
                        placeholder="Опишите факт…"
                        className="min-h-24"
                        sessionId={sessionId}
                      />
                    </FieldWrap>

                    <FieldWrap label="URL изображения (опционально)" icon={ImageIcon}>
                      <IconInput
                        icon={ImageIcon}
                        value={card.imageUrl || ''}
                        onChange={(e) => updateCard(i, 'imageUrl', e.target.value)}
                        placeholder="https://…"
                        className="font-mono"
                      />
                    </FieldWrap>
                  </div>

                  <div className="mt-4 flex justify-end border-t border-zinc-800/60 pt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => removeCard(i)}
                      className="h-7 gap-1.5 rounded-md px-2.5 text-[11px] text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="size-3" />
                      Удалить карточку
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
