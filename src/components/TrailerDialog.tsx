import { Play, X } from "lucide-react";
import { useRef, useState } from "react";
import { useI18n } from "../i18n";
import { useLightDismiss } from "../lib/use-light-dismiss";
import type { Video } from "../lib/tmdb";

// The YouTube player is created only after a click (reops/standards/security.md: embeds load on a
// click), in the privacy-enhanced domain, and removed again when the dialog closes.
export function TrailerButton({
  video,
  title,
  className = "btn btn-on-image",
}: {
  video: Video | undefined;
  title: string;
  className?: string;
}) {
  const { t, iso } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useLightDismiss(dialog);
  if (!video) return null;

  const close = () => dialog.current?.close();
  const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.key)}?autoplay=1&rel=0&modestbranding=1&hl=${iso}`;

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setOpen(true);
          dialog.current?.showModal();
        }}
      >
        <Play className="size-4 fill-current" aria-hidden="true" />
        {t.movie.playTrailer}
      </button>
      <dialog
        ref={dialog}
        aria-label={t.movie.trailerTitle(title)}
        onClose={() => setOpen(false)}
        className="m-auto w-[min(100%-2rem,72rem)] max-w-none overflow-visible bg-transparent p-0"
      >
        <div className="mb-3 flex items-center justify-between gap-4 text-[oklch(0.97_0.01_85)]">
          <p className="truncate font-display text-lg">{t.movie.trailerTitle(title)}</p>
          <button
            type="button"
            onClick={close}
            className="btn btn-on-image btn-icon shrink-0"
            aria-label={t.a11y.close}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-pop">
          {open && (
            <iframe
              src={src}
              title={t.movie.trailerTitle(title)}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="size-full"
            />
          )}
        </div>
        <p className="mt-3 text-center text-xs text-[oklch(0.8_0.01_85)]">{t.movie.trailerNote}</p>
      </dialog>
    </>
  );
}
