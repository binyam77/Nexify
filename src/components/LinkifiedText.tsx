import { Fragment } from "react";

// http(s):// ወይም www. የሚጀምሩ ብቻ link ይሆናሉ (javascript: ወዘተ በጭራሽ አይመሳሰሉም)
const URL_REGEX = /((?:https?:\/\/|www\.)[^\s<]*[^\s<.,;:!?)"'\]])/gi;

export default function LinkifiedText({ text }: { text: string }) {
  // capture group ስላለ ጎዶሎ index (1,3,5..) ሁሉ URL match ነው
  const parts = text.split(URL_REGEX);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          const href = part.startsWith("www.") ? `https://${part}` : part;
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:underline break-all"
            >
              {part}
            </a>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
