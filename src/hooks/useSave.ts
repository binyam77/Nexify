import { useLocalStorageState } from "./useLocalStorageState";

interface SaveState {
  saved: boolean;
  count: number;
}

// TODO: swap body >> POST /api/posts/:id/save (POstagraSQL: post_save tables)
export function useSave(postId: string, initialCount = 0) {
  const [state, setState] = useLocalStorageState<SaveState>(`save:${postId}`, {
    saved: false,
    count: initialCount,
  });

  function toggleSave() {
    setState((perv) => ({
      saved: !perv.saved,
      count: perv.saved ? perv.count - 1 : perv.count + 1,
    }));
  }
  return { saved: state.saved, count: state.count, toggleSave };
}
