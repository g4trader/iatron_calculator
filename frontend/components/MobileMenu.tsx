"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

/** Native modal provides focus containment and makes the rest of the page inert. */
export function MobileMenu({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  function close() {
    dialog.current?.close();
  }
  return (
    <div className="ped-mobile-menu">
      <button
        ref={trigger}
        type="button"
        aria-label="Abrir menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        <Menu aria-hidden="true" />
      </button>
      <dialog
        ref={dialog}
        className="ped-menu-dialog"
        aria-labelledby={titleId}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const targets = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex="0"]',
          )).filter((element) => element.getClientRects().length > 0);
          const first = targets[0];
          const last = targets[targets.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="ped-menu-panel">
          <div className="ped-menu-heading">
            <h2 id={titleId}>Navegação</h2>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={close}
              autoFocus
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <nav
            aria-label="Menu móvel"
            onClick={(event) => {
              if ((event.target as Element).closest("a")) close();
            }}
          >
            {children}
          </nav>
        </div>
      </dialog>
    </div>
  );
}
