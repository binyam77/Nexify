import { useLayoutEffect, useRef } from "react";
import type { Message } from "../../types";

/**
 * አዲስ መልዕክት ሲመጣ ወደ ታች ይሸብልላል — ግን ተጠቃሚው ወደ ላይ ሄዶ እያነበበ ከሆነ አያቋርጥም።
 * ይሸብልላል: አዲስ chat ሲከፈት፣ ከታች አቅራቢያ ከሆንን፣ ወይም እኔ ራሴ ከላክኩ።
 *
 * የቆዩ መልዕክቶች ከላይ ሲጨመሩ (prepend) ደግሞ ማንበብ የጀመርንበት ቦታ እንዳይዘል
 * የ scroll ቦታን በተጨመረው ቁመት ልክ እናስተካክላለን።
 */
export function useAutoScroll(chatId: string, messages: Message[]) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const lastChatIdRef = useRef<string | null>(null);
  const prevRef = useRef<{
    firstId?: string;
    lastId?: string;
    length: number;
    scrollHeight: number;
  }>({ length: 0, scrollHeight: 0 });

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const isNewChat = lastChatIdRef.current !== chatId;
    lastChatIdRef.current = chatId;

    const first = messages[0];
    const last = messages[messages.length - 1];
    const prev = prevRef.current;

    // የመጀመሪያው መልዕክት ተቀይሮ የመጨረሻው ከቀጠለ እና ብዛቱ ከጨመረ = ከላይ ተጨመረ
    const prepended =
      !isNewChat &&
      prev.firstId !== undefined &&
      first?.id !== prev.firstId &&
      last?.id === prev.lastId &&
      messages.length > prev.length;

    if (el && prepended) {
      el.scrollTop += el.scrollHeight - prev.scrollHeight;
    } else if (isNewChat || stickToBottomRef.current || last?.isSentByMe) {
      endRef.current?.scrollIntoView({
        behavior: isNewChat ? "auto" : "smooth",
      });
    }

    prevRef.current = {
      firstId: first?.id,
      lastId: last?.id,
      length: messages.length,
      scrollHeight: el?.scrollHeight ?? 0,
    };
  }, [chatId, messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 160;
  };

  return { scrollRef, endRef, onScroll };
}
