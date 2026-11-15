import { useEffect, useState } from "react";

interface KeyboardState {
  inset: number; // keyboard ቁመት (px)፣ ከተዘጋ 0
  viewportHeight: number | null; // keyboard ሲከፈት የሚታየው ቁመት፣ ካልሆነ null
}

// ከዚህ በታች ያለ ለውጥ keyboard አይደለም (ለምሳሌ browser address bar ሲጠፋ/ሲታይ ~56px)
const KEYBOARD_THRESHOLD_PX = 80;

export function useKeyboardInset(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    inset: 0,
    viewportHeight: null,
  });

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    // iOS ገጹን ሲያሸብለው (offsetTop) ጭምር ይቆጥራል። Browser ራሱ layout ን ካሳነሰ
    // (innerHeight ከ vv.height ጋር አብሮ ከቀነሰ) inset 0 ይሆናል፣ ሁለት ጊዜ አይስተካከልም።
    const update = () => {
      const inset = Math.max(
        0,
        Math.round(window.innerHeight - vv.height - vv.offsetTop),
      );
      const next: KeyboardState =
        inset > KEYBOARD_THRESHOLD_PX
          ? { inset, viewportHeight: Math.round(vv.height) }
          : { inset: 0, viewportHeight: null };
      setState((prev) =>
        prev.inset === next.inset && prev.viewportHeight === next.viewportHeight
          ? prev
          : next,
      );
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return state;
}
