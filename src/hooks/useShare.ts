import { useToast } from './useToast';

interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Native share sheet on mobile, clipboard copy fallback on desktop —
 * same two branches as the old copyLink() in home.html.
 * TODO: POST to /api/shares once a backend exists (dropped the old
 * logShareToDatabase() call since it always failed silently).
 */
export function useShare(data: ShareData) {
  const { message, visible, showToast } = useToast();

  async function share(): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share(data);
        showToast('Shared successfully!');
        return true;
      } catch {
        // user closed the native share sheet — nothing to do
      }
      return false;
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