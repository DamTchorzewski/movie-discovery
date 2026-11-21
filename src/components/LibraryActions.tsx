import { Bookmark, BookmarkCheck, Check, Eye, NotebookPen, Star, Trash2, X } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { useI18n } from "../i18n";
import { useLightDismiss } from "../lib/use-light-dismiss";
import { libraryActions, useLibraryEntry } from "../lib/library";
import { NOTE_MAX, type LibraryEntry } from "../lib/library-schema";
import type { MovieDetails, MovieSummary } from "../lib/tmdb";
import { toast } from "./Toasts";

export function removeWithUndo(id: number, title: string, t: ReturnType<typeof useI18n>["t"]) {
  const removed = libraryActions.remove(id);
  if (removed) {
    toast(t.library.removed(title), {
      label: t.library.undo,
      run: () => libraryActions.restore(removed),
    });
  }
}

export function LibraryActions({
  movie,
  onImage = false,
}: {
  movie: MovieDetails | MovieSummary;
  onImage?: boolean;
}) {
  const { t } = useI18n();
  const entry = useLibraryEntry(movie.id);
  const base = onImage ? "btn btn-on-image" : "btn btn-ghost";
  const watchlisted = entry?.status === "watchlist";
  const watched = entry?.status === "watched";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        aria-pressed={watchlisted}
        className={`${base} aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-on-accent`}
        onClick={() => {
          if (watchlisted) removeWithUndo(movie.id, movie.title, t);
          else {
            libraryActions.set(movie, "watchlist");
            toast(t.library.addedWatchlist(movie.title));
          }
        }}
      >
        {watchlisted ? (
          <BookmarkCheck className="size-4" aria-hidden="true" />
        ) : (
          <Bookmark className="size-4" aria-hidden="true" />
        )}
        {watchlisted ? t.library.onWatchlist : t.library.addWatchlist}
      </button>
      <button
        type="button"
        aria-pressed={watched}
        className={`${base} aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-on-accent`}
        onClick={() => {
          if (watched) removeWithUndo(movie.id, movie.title, t);
          else {
            libraryActions.set(movie, "watched");
            toast(t.library.addedWatched(movie.title));
          }
        }}
      >
        {watched ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
        {watched ? t.library.isWatched : t.library.markWatched}
      </button>
      {watched && entry && <ReviewButton entry={entry} className={base} />}
    </div>
  );
}

export function ReviewButton({ entry, className }: { entry: LibraryEntry; className: string }) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  useLightDismiss(dialog);
  return (
    <>
      <button type="button" className={className} onClick={() => dialog.current?.showModal()}>
        {entry.rating ? (
          <>
            <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
            <span className="sr-only">{t.library.yourRating}:</span> {entry.rating}/10
          </>
        ) : (
          <>
            <NotebookPen className="size-4" aria-hidden="true" />
            {t.library.rate}
          </>
        )}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={`review-${entry.id}`}
        className="m-auto w-[min(100%-2rem,32rem)] max-w-none rounded-3xl border border-line bg-surface p-0 shadow-pop"
      >
        <ReviewForm entry={entry} onDone={() => dialog.current?.close()} />
      </dialog>
    </>
  );
}

function ReviewForm({ entry, onDone }: { entry: LibraryEntry; onDone: () => void }) {
  const { t } = useI18n();
  const [rating, setRating] = useState<number | null>(entry.rating);
  const [note, setNote] = useState(entry.note);
  const [date, setDate] = useState((entry.watchedAt ?? new Date().toISOString()).slice(0, 10));
  const noteId = useId();
  const dateId = useId();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    libraryActions.update(entry.id, {
      rating,
      note: note.trim().slice(0, NOTE_MAX),
      watchedAt: date ? new Date(`${date}T12:00:00Z`).toISOString() : entry.watchedAt,
    });
    toast(t.library.saved);
    onDone();
  };

  return (
    <form onSubmit={submit} className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{t.library.editReview}</p>
          <h2 id={`review-${entry.id}`} className="mt-1 text-2xl font-semibold">
            {entry.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="btn btn-icon -mt-1 -mr-2 text-muted"
          aria-label={t.a11y.close}
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-semibold">{t.library.yourRating}</legend>
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <label
              key={n}
              className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-line-strong text-base font-semibold transition-colors hover:bg-raised has-checked:border-accent has-checked:bg-accent has-checked:text-on-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-text"
            >
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="sr-only"
                aria-label={t.library.ratingValue(n)}
              />
              <span aria-hidden="true">{n}</span>
            </label>
          ))}
        </div>
        <button
          type="button"
          className="mt-2 inline-flex min-h-6 items-center gap-1 text-sm text-muted underline-offset-4 hover:underline"
          onClick={() => setRating(null)}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          {t.library.clearRating}
        </button>
      </fieldset>

      <label htmlFor={dateId} className="mt-5 block text-sm font-semibold">
        {t.library.watchedOn}
      </label>
      <input
        id={dateId}
        type="date"
        value={date}
        max={new Date().toISOString().slice(0, 10)}
        onChange={(e) => setDate(e.target.value)}
        className="field mt-2"
      />

      <label htmlFor={noteId} className="mt-5 block text-sm font-semibold">
        {t.library.note}
      </label>
      <textarea
        id={noteId}
        value={note}
        maxLength={NOTE_MAX}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t.library.notePlaceholder}
        rows={4}
        className="field mt-2 resize-y py-3"
      />

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          {t.library.cancel}
        </button>
        <button type="submit" className="btn btn-primary">
          {t.library.save}
        </button>
      </div>
    </form>
  );
}
