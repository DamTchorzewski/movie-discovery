import { useEffect, type RefObject } from "react";

// A click on the backdrop of a modal <dialog> (the dialog element itself, outside its content)
// closes it. Escape is handled by the browser; this only adds the pointer path.
export function useLightDismiss(ref: RefObject<HTMLDialogElement | null>) {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onClick = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };
    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, [ref]);
}
