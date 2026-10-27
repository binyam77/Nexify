import { useToast } from './useToast';

interface ShareData {
  title: string;
  text: string;
  url: string;
}

// Touch device (ሞባይል/ታብሌት) ላይ ብቻ native share sheet። Desktop ላይ የ OS share
// dialog ያስቸግራል፣ ተጠቃሚዎች "Copy link" ይጠብቃሉ።
function prefersNativeShare(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: coarse)').matches === true
  );
}

/**
 * Share ሲጠናቀቅ ብቻ true ይመልሳል (ጠሪው ያን ብቻ ይቆጥራል)፦
 *  - ተጠቃሚው native sheet ን ሲሰርዝ (AbortError) → false፣ ምንም toast የለም
 *  - native share በሌላ ምክንያት ቢወድቅ → ሊንኩን ወደ clipboard ይቀዳል
 */
export function useShare(data: ShareData) {
  const { message, visible, showToast } = useToast();

  async function share(): Promise<boolean> {
    if (prefersNativeShare()) {
      try {
        await navigator.share(data);
        return true;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return false;
        // ሌላ ስህተት → ከታች ወደ clipboard ይወርዳል
      }
    }
    try {
      await navigator.clipboard.writeText(data.url);
      showToast('Link copied! 🔗');
      return true;
    } catch {
      showToast('Could not copy the link. Please try again.');
      return false;
    }
  }

  return { share, toastMessage: message, toastVisible: visible };
}