import React from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Maximize2, X } from 'lucide-react';

/**
 * The gallery. One component wherever photos are shown.
 *
 * The same gallery the tenant, vendor, landlord and V2 apps carry: a hero
 * with the label and count over it, a thumbnail strip that tracks the
 * current photo, a click into fullscreen, and arrow keys, Escape and swipe
 * there. A photo that fails to load falls back to a plain tile rather than
 * leaving a broken frame, the way the avatar falls back to initials.
 *
 * `open` / `onOpenChange` are optional: pass them when the trigger is your
 * own element — a thumbnail in a dense card, say — and you want the
 * fullscreen view without the hero.
 */
export type GalleryImage = { url: string; caption?: string } | string;

export type GalleryProps = {
  images: GalleryImage[] | null | undefined;
  title?: string;
  label?: string;
  className?: string;
  /** Hide the hero and render only the fullscreen layer. Needs `open`. */
  fullscreenOnly?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function toUrl(image: GalleryImage): string {
  return typeof image === 'string' ? image : image?.url;
}

function toCaption(image: GalleryImage): string | undefined {
  return typeof image === 'string' ? undefined : image?.caption;
}

/** One frame. Keeps its own error state so one bad URL does not affect the rest. */
function Frame({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div className={`grid place-items-center bg-gray-100 text-gray-300 ${className ?? ''}`}>
        <ImageIcon className="h-7 w-7" />
      </div>
    );
  }

  return (
    <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />
  );
}

export function Gallery({
  images,
  title = 'Photos',
  label = 'Photos',
  className,
  fullscreenOnly = false,
  open,
  onOpenChange,
}: GalleryProps) {
  const displayImages = (images ?? []).filter((image) => toUrl(image));
  const hasMultiple = displayImages.length > 1;

  const [index, setIndex] = React.useState(0);
  const [ownOpen, setOwnOpen] = React.useState(false);
  const isFullscreen = open ?? ownOpen;

  const setFullscreen = React.useCallback(
    (next: boolean) => {
      if (open === undefined) setOwnOpen(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange]
  );

  const pointerStartX = React.useRef<number | null>(null);
  const didSwipe = React.useRef(false);

  const safeIndex = Math.min(index, Math.max(displayImages.length - 1, 0));

  const select = React.useCallback(
    (next: number) => {
      if (displayImages.length === 0) return;
      setIndex((next + displayImages.length) % displayImages.length);
    },
    [displayImages.length]
  );

  const onPrev = React.useCallback(() => select(safeIndex - 1), [select, safeIndex]);
  const onNext = React.useCallback(() => select(safeIndex + 1), [select, safeIndex]);

  React.useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
      if (event.key === 'ArrowLeft') onPrev();
      if (event.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen, onNext, onPrev, setFullscreen]);

  if (displayImages.length === 0) return null;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('[data-gallery-control]')) return;
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    setFullscreen(!isFullscreen);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    pointerStartX.current = event.clientX;
    didSwipe.current = false;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (pointerStartX.current == null || !hasMultiple) return;
    const delta = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(delta) < 45) return;
    didSwipe.current = true;
    if (delta < 0) onNext();
    else onPrev();
  };

  if (fullscreenOnly && !isFullscreen) return null;

  const current = displayImages[safeIndex];
  const caption = toCaption(current);

  const chrome = (
    <>
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-white backdrop-blur-md">
          {label}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-md">
          <ImageIcon className="h-3.5 w-3.5" />
          {displayImages.length} photo{displayImages.length === 1 ? '' : 's'}
        </span>
      </div>

      <button
        data-gallery-control
        type="button"
        onClick={() => setFullscreen(!isFullscreen)}
        className="absolute right-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:scale-105 hover:bg-white hover:text-neutral-950"
        aria-label={isFullscreen ? 'Close fullscreen gallery' : 'Open fullscreen gallery'}
      >
        {isFullscreen ? <X className="h-5 w-5" /> : <Maximize2 className="h-4 w-4" />}
      </button>

      {hasMultiple ? (
        <>
          <button
            type="button"
            data-gallery-control
            onClick={onPrev}
            className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:scale-105 hover:bg-white hover:text-neutral-950"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            data-gallery-control
            onClick={onNext}
            className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:scale-105 hover:bg-white hover:text-neutral-950"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5">
        {caption ? <p className="max-w-2xl text-sm text-white/85 drop-shadow">{caption}</p> : null}

        {hasMultiple ? (
          <div
            data-gallery-control
            className="pointer-events-auto flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {displayImages.map((image, i) => (
              <button
                key={`${toUrl(image)}-${i}`}
                type="button"
                data-gallery-control
                onClick={() => select(i)}
                aria-label={`Show photo ${i + 1}`}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-neutral-900 transition duration-300 hover:-translate-y-1 ${
                  safeIndex === i
                    ? 'border-white shadow-xl'
                    : 'border-white/25 opacity-70 hover:border-white/70 hover:opacity-100'
                }`}
              >
                <Frame
                  src={toUrl(image)}
                  alt={`${title} thumbnail ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <section
      className={
        isFullscreen
          ? 'fixed inset-0 z-[120] isolate h-[100dvh] w-screen cursor-zoom-out touch-pan-y overflow-hidden bg-black'
          : `group relative isolate min-h-[320px] cursor-zoom-in touch-pan-y overflow-hidden rounded-2xl bg-neutral-950 ${className ?? ''}`
      }
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      aria-label={isFullscreen ? 'Close gallery' : 'Open gallery'}
    >
      <Frame
        src={toUrl(current)}
        alt={`${title} — photo ${safeIndex + 1}`}
        className={
          isFullscreen
            ? 'absolute inset-0 h-full w-full object-contain'
            : 'absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.018]'
        }
      />
      {!isFullscreen ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />
      ) : null}
      {chrome}
    </section>
  );
}

export default Gallery;
