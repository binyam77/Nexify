import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent, TouchEvent } from "react";

interface LongPressOptions {
  delayMs?: number;
  moveThreshold?: number;
}

/**
 * ረዘም ብሎ መያዝ (450ms)። ጣት ከ moveThreshold በላይ ከተንቀሳቀሰ (scroll) ይሰረዛል።
 * - bind: በ element ላይ የሚሰፋ (spread) ባህሪያት
 * - wasLongPress(): ረዥም ተጭኖ ከተፈጸመ በኋላ የሚመጣውን click ለማስቆም (አንድ ጊዜ true ይመልሳል)
 */
export function useLongPress(
  onLongPress: () => void,
  { delayMs = 450, moveThreshold = 10 }: LongPressOptions = {},
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);
  const callbackRef = useRef(onLongPress);

  useEffect(() => {
    callbackRef.current = onLongPress;
  });

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  }, []);

  const begin = useCallback(
    (x: number, y: number) => {
      cancel();
      firedRef.current = false;
      startRef.current = { x, y };
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        timerRef.current = null;
        callbackRef.current();
      }, delayMs);
    },
    [cancel, delayMs],
  );

  useEffect(() => cancel, [cancel]);

  const bind = {
    onMouseDown: (e: MouseEvent<HTMLElement>) => {
      if (e.button === 0) begin(e.clientX, e.clientY);
    },
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: (e: TouchEvent<HTMLElement>) => {
      const t = e.touches[0];
      begin(t.clientX, t.clientY);
    },
    onTouchMove: (e: TouchEvent<HTMLElement>) => {
      const start = startRef.current;
      if (!start) return;
      const t = e.touches[0];
      if (
        Math.abs(t.clientX - start.x) > moveThreshold ||
        Math.abs(t.clientY - start.y) > moveThreshold
      ) {
        cancel();
      }
    },
    onTouchEnd: cancel,
    onTouchCancel: cancel,
    // ቀኝ-ክሊክ ወይም የ ስልክ ረዥም-ተጭኖ context menu
    onContextMenu: (e: MouseEvent<HTMLElement>) => {
      e.preventDefault();
      cancel();
      firedRef.current = true;
      callbackRef.current();
    },
  };

  const wasLongPress = () => {
    if (!firedRef.current) return false;
    firedRef.current = false;
    return true;
  };

  return { bind, wasLongPress };
}
