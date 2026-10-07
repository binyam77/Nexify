// "05:17 AM" style formatting — Home's CommentCard/ReplyCard ብቻ ይጠቀማሉ።
// Profile's own comment component የራሱ ተመሳሳይ ውጤት ይሰጣል ተብሎ ይታሰባል፣ ግን
// Profile AI's ኮድ ስላላየን፣ ይህ ራሱ 1 ገለልተኛ implementation ነው.
export function formatCommentTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const hoursStr = hours.toString().padStart(2, "0");
  return `${hoursStr}:${minutes} ${period}`;
}
