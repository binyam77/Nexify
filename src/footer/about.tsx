import { Target, Eye, ArrowLeft } from "lucide-react";

interface AboutProps {
  onNavigate?: (page: string) => void;
}

export default function About({ onNavigate = () => {} }: AboutProps) {
  return (
    <div className="bg-bg text-text-primary min-h-screen flex flex-col font-sans leading-relaxed">
      <header className="relative bg-primary py-[60px] px-5 text-center border-b border-primary-border">
        <div className="absolute top-4 left-4">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 text-text-on-primary hover:opacity-80 transition-colors bg-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-0 outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>
        </div>
        <div className="max-w-[950px] mx-auto text-center">
          <h1 className="text-[36px] md:text-[48px] font-extrabold tracking-[1px] text-text-on-primary inline-flex items-center justify-center">
            About Nexify
          </h1>
          </div>
        
      </header>

      <main className="flex-1 max-w-[950px] w-full my-10 mx-auto px-5">
        <article className="bg-surface border border-border rounded-[20px] p-6 md:p-[50px] shadow-[0_20px_45px_rgba(0,0,0,0.08)]">
          
          <div className="mb-10 text-text-primary">
            <p className="text-lg md:text-[22px] font-medium text-text-primary leading-relaxed mb-5">
              Nexify is a social media platform where people share themselves by building a community with diverse individuals around the ideas they hold.
            </p>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed mb-5">
              Nexify connects creators and users in one place — this allows creators to build their audience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[25px] mb-10">
            <section className="bg-surface-secondary p-[30px] rounded-xl border border-border border-t-4 border-t-primary">
              <h2 className="text-xl md:text-2xl text-text-primary mb-[15px] font-bold flex items-center gap-3">
                <Target className="text-primary w-6 h-6 shrink-0" /> Our Mission
              </h2>
              <p className="text-text-secondary mb-2">Our mission is simple:</p>
              <p className="text-xl font-bold text-success my-[15px]">"Allowing people to share or gain new ideas by joining a community."</p>
             
            </section>

            <section className="bg-surface-secondary p-[30px] rounded-xl border border-border border-t-4 border-t-success">
              <h2 className="text-xl md:text-2xl text-text-primary mb-[15px] font-bold flex items-center gap-3">
                <Eye className="text-success w-6 h-6 shrink-0" /> Our Vision
              </h2>
              <p className="text-text-secondary mb-3">We aim to build a global platform where millions of people:</p>
              <ul className="list-none m-0 p-0">
                <li className="relative pl-[28px] mb-3 text-text-secondary text-base">
                  <span className="absolute left-0 text-primary">⚡</span> Learn something new every day
                </li>
                <li className="relative pl-[28px] mb-3 text-text-secondary text-base">
                  <span className="absolute left-0 text-primary">⚡</span> Share knowledge with others
                </li>
                <li className="relative pl-[28px] mb-3 text-text-secondary text-base">
                  <span className="absolute left-0 text-primary">⚡</span> Empowering creators to rapidly reach their audience
                </li>
              </ul>
            </section>
          </div>

         

          

         

        </article>
      </main>

      <footer className="bg-primary py-[30px] px-5 text-center text-[14px] text-text-on-primary/70 border-t border-primary-border mt-auto w-full">
        <p className="mb-3">&copy; 2026 Nexify</p>
        <div className="flex justify-center gap-5">
          <a
            href="/footer/privacy"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("privacy");
            }}
            className="text-text-on-primary/70 no-underline transition-colors duration-200 hover:text-text-on-primary"
          >
            Privacy Policy
          </a>
          <a
            href="/footer/terms"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("terms");
            }}
            className="text-text-on-primary/70 no-underline transition-colors duration-200 hover:text-text-on-primary"
          >
            Terms & Service
          </a>
          <a
            href="/footer/contact"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("contact");
            }}
            className="text-text-on-primary/70 no-underline transition-colors duration-200 hover:text-text-on-primary"
          >
            Contact
          </a>
          <a
            href="/footer/helps"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("helps");
            }}
            className="text-text-on-primary/70 no-underline transition-colors duration-200 hover:text-text-on-primary"
          >
            Help
          </a>
        </div>
      </footer>
    </div>
  );
}