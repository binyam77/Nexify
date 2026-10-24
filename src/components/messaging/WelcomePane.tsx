import { Users } from "lucide-react";

// ምንም chat ሳይመረጥ በ ዴስክቶፕ የሚታይ ባዶ ማያ (በ ስልክ ዝርዝሩ ብቻ ይታያል)
export default function WelcomePane() {
  return (
    <div className="hidden h-full flex-1 flex-col items-center justify-center bg-surface p-8 text-center md:flex">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <Users className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-text-primary">
        Welcome to Nexify Community
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-text-secondary">
        Select a chat from the list, or search to find public channels and
        groups.
      </p>
    </div>
  );
}
