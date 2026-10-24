import { useEffect, useRef } from "react";
import type { Message } from "../../types";

/**
 * አዲስ መልዕክት ሲመጣ ወደ ታች ይሸብልላል — ግን ተጠቃሚው ወደ ላይ ሄዶ እያነበበ ከሆነ አያቋርጥም።
 * ይሸብልላል: አዲስ chat ሲከፈት፣ ከታች አቅራቢያ ከሆንን፣ ወይም እኔ ራሴ ከላክኩ።
 */
export function useAutoScroll(chatId: string, messages: Message[]) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const lastChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    const isNewChat = lastChatIdRef.current !== chatId;
    lastChatIdRef.current = chatId;
    const last = messages[messages.length - 1];
    if (isNewChat || stickToBottomRef.current || last?.isSentByMe) {
      endRef.current?.scrollIntoView({
        behavior: isNewChat ? "auto" : "smooth",
      });
    }
  }, [chatId, messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 160;
  };

  return { scrollRef, endRef, onScroll };
}
