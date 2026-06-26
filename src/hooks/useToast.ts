import { useState, useRef, useCallback } from 'react';

/** Shows a message that auto-hides after `duration` ms (the share toast). */
export function useToast(duration = 2500) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> |undefined>(undefined);

  const showToast = useCallback(
    (text: string) => {
      setMessage(text);
      setVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setVisible(false), duration);
    },
    [duration],
  );

  return { message, visible, showToast };
}