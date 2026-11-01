import { useEffect, useRef, type RefObject } from "react";
/** Restore focus and contain keyboard navigation inside the active overlay. */
export function useModalFocus(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  busy = false,
) {
  const close = useRef(onClose);
  const pending = useRef(busy);
  useEffect(() => {
    close.current = onClose;
    pending.current = busy;
  }, [onClose, busy]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = ref.current;
    const items = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ) ?? [],
      ).filter((el) => !el.hidden && !el.closest("[inert]"));
    items()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (!pending.current) close.current();
      }
      if (e.key === "Tab") {
        const list = items();
        if (!list.length) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey && document.activeElement === list[0]) {
          e.preventDefault();
          list.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === list.at(-1)) {
          e.preventDefault();
          list[0].focus();
        }
      }
    };
    panel?.addEventListener("keydown", key);
    return () => {
      panel?.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [ref]);
}
