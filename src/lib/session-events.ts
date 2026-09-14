// Tiny pub-sub so api-client.ts (a plain module, no React) can tell
// AuthContext "the session is truly over" (refresh itself failed) without
// importing React or the context directly — AuthContext subscribes once
// and clears its own user/token state in response.
type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeToSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifySessionExpired(): void {
  listeners.forEach((listener) => listener());
}
