import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useI18n } from "../i18n";

// A horizontal row with scroll-snap: swipe on a phone, arrow buttons and the keyboard elsewhere.
export function Rail({
  title,
  actions,
  children,
  itemClass = "w-[9.5rem] md:w-44 xl:w-48",
  count,
}: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode[];
  itemClass?: string;
  count?: string;
}) {
  const { t } = useI18n();
  const list = useRef<HTMLUListElement>(null);
  const headingId = useId();
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = list.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft < 8,
      end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update, children.length]);

  const scroll = (direction: 1 | -1) => {
    const el = list.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section aria-labelledby={headingId} className="mt-14 first:mt-0">
      <div className="container-page flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex items-baseline gap-3">
          <h2 id={headingId} className="text-2xl font-semibold sm:text-[1.75rem]">
            {title}
          </h2>
          {count && <span className="text-sm text-muted">{count}</span>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <div className="hidden gap-2 md:flex">
            <button
              type="button"
              className="btn btn-ghost btn-icon disabled:opacity-35"
              onClick={() => scroll(-1)}
              disabled={edges.start}
              aria-label={t.a11y.previous}
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-icon disabled:opacity-35"
              onClick={() => scroll(1)}
              disabled={edges.end}
              aria-label={t.a11y.next}
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <ul
        ref={list}
        onScroll={update}
        className="no-scrollbar mt-5 flex snap-x snap-mandatory scroll-px-[clamp(1rem,4vw,3rem)] gap-4 overflow-x-auto overscroll-x-contain px-[clamp(1rem,4vw,3rem)] pb-4 md:gap-5 [@media(min-width:92rem)]:scroll-px-[calc((100vw-92rem)/2+3rem)] [@media(min-width:92rem)]:px-[calc((100vw-92rem)/2+3rem)]"
      >
        {children.map((child, i) => (
          <li key={i} className={`shrink-0 snap-start ${itemClass}`}>
            {child}
          </li>
        ))}
      </ul>
    </section>
  );
}
