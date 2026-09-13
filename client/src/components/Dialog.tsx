import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export type DialogSize = "sm" | "md" | "lg" | "xl";

export interface DialogProps {
  /** Controls visibility. Rendered into document.body via portal when true, null when false. */
  open: boolean;
  /** Called on Escape. Overlay clicks intentionally do not close, to avoid accidental data loss. */
  onClose: () => void;
  /** id of the visible heading rendered inside the dialog. */
  labelledBy: string;
  /** id of the visible description rendered inside the dialog, if any. */
  describedBy?: string;
  /** Panel width. Defaults to "sm" (matches the Remove-Hours modal). */
  size?: DialogSize;
  children: ReactNode;
}

const SIZE_CLASSES: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return nodes.filter((el) => el.getClientRects().length > 0);
}

/**
 * Shared accessible dialog primitive (REPORT F-02, Phase 1 pilot).
 *
 * Dependency-free: React + react-dom/createPortal only (both already in
 * client/package.json). Contract: role="dialog", aria-modal="true",
 * labelled via aria-labelledby, Escape closes, Tab/Shift+Tab is trapped
 * inside the panel, initial focus goes to [data-autofocus] (else the first
 * focusable), focus returns to the trigger on close, background #root content
 * is hidden from assistive tech (aria-hidden + inert) and body scroll is
 * locked while open. All background state is restored on close/unmount.
 */
export default function Dialog({
  open,
  onClose,
  labelledBy,
  describedBy,
  size = "sm",
  children,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Ref indirection so callers may pass inline onClose closures without
  // re-running the open effect (which would reset focus) on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const root = document.getElementById("root");
    const prevAriaHidden = root?.getAttribute("aria-hidden") ?? null;
    const prevInert = root?.getAttribute("inert") ?? null;
    const prevOverflow = document.body.style.overflow;

    // Initial focus: explicit [data-autofocus] target, else first focusable.
    const autofocusTarget = panel.querySelector<HTMLElement>("[data-autofocus]");
    const firstFocusable = getFocusableElements(panel)[0];
    (autofocusTarget ?? firstFocusable)?.focus();

    // Hide background content from assistive tech + lock scroll while open.
    // The portal mounts under document.body (outside #root), so the dialog
    // itself is never hidden by this.
    root?.setAttribute("aria-hidden", "true");
    root?.setAttribute("inert", "");
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = getFocusableElements(panel);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      if (root) {
        if (prevAriaHidden === null) root.removeAttribute("aria-hidden");
        else root.setAttribute("aria-hidden", prevAriaHidden);
        if (prevInert === null) root.removeAttribute("inert");
        else root.setAttribute("inert", prevInert);
      }
      document.body.style.overflow = prevOverflow;
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [open ]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={`bg-[var(--surface)] rounded-[3px] p-6 w-full ${SIZE_CLASSES[size]}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
