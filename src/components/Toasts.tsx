import { AnimatePresence, motion } from "motion/react";
import { useEffect, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { useI18n } from "../i18n";

interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(text: string, action?: Toast["action"]) {
  const item = { id: nextId++, text, action };
  toasts = [...toasts.slice(-2), item];
  emit();
  return item.id;
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
  );
}

function ToastItem({ item }: { item: Toast }) {
  const { t } = useI18n();
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(item.id), item.action ? 7000 : 4000);
    return () => window.clearTimeout(timer);
  }, [item]);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-line bg-surface py-2 pr-2 pl-4 text-sm shadow-pop"
    >
      <span className="flex-1">{item.text}</span>
      {item.action && (
        <button
          type="button"
          className="btn min-h-9 px-3 text-accent-text"
          onClick={() => {
            item.action?.run();
            dismiss(item.id);
          }}
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        className="btn btn-icon min-h-9 w-9 text-muted"
        aria-label={t.a11y.close}
        onClick={() => dismiss(item.id)}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </motion.li>
  );
}

export function Toaster() {
  const items = useToasts();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:bottom-6"
    >
      <ul className="flex w-full max-w-md flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <ToastItem key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
