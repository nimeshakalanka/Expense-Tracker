"use client";

import { useMemo, useRef } from "react";

export function useReturnFocus() {
  const opener = useRef<HTMLElement | null>(null);

  return useMemo(
    () => ({
      onOpenAutoFocus: () => {
        let el = document.activeElement as HTMLElement | null;
        const menu = el?.closest<HTMLElement>("[role=menu]");
        if (menu?.id) el = document.querySelector<HTMLElement>(`[aria-controls="${menu.id}"]`);
        opener.current = el;
      },
      onCloseAutoFocus: (event: Event) => {
        const el = opener.current;
        opener.current = null;
        if (el?.isConnected) {
          event.preventDefault();
          el.focus();
        }
      },
    }),
    [],
  );
}
