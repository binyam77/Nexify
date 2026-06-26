import { Target, Eye, Star, Users, GraduationCap, Rocket, Brain } from "lucide-react";

interface AboutProps {
  onNavigate?: (page: string) => void;
}

export default function About({ onNavigate = () => {} }: AboutProps) {
  return (
    <div className="bg-white text-gray-800 min-h-screen flex flex-col font-sans leading-relaxed">
      <header className="bg-gradient-to-br from-blue-700 to-blue-600 py-[60px] px-5 text-center border-b border-white/10">
        <div className="max-w-[950px] mx-auto text-center">
          <h1 className="text-[36px] md:text-[48px] font-extrabold tracking-[1px] text-white inline-flex items-center justify-center">
            About Nex<span className="inline-flex items-center justify-center mx-[-2px]"><p className="text-[#10b981] text-[36px] md:text-[44px] drop-shadow-[0_0_15px_rgba(16,185,129,0.7)] inline-block m-0 p-0 leading-none font-bold">i</p></span>fy
          </h1>
          <p className="text-blue-300 text-sm md:text-base uppercase tracking-[4px] mt-2.5 font-semibold">Content Meets Purpose</p>
        </div>
      </header>

      <main className="flex-1 max-w-[950px] w-full my-10 mx-auto px-5">
        <article className="bg-white border border-gray-800/10 rounded-[20px] p-6 md:p-[50px] shadow-[0_20px_45px_rgba(0,0,0,0.08)]">
          
          <div className="mb-10 text-gray-800">
            <p className="text-lg md:text-[22px] font-medium text-gray-900 leading-relaxed mb-5">
              Nexify is a next-generation social platform built for a new kind of user — not to scroll, but to grow.
            </p>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-5">
              In a world where most platforms focus only on entertainment, Nexify is designed to combine <strong className="font-bold text-gray-900">short-form video with real value.</strong> Every swipe is an opportunity to learn, improve, and discover something meaningful.
            </p>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-5">
              Nexify brings together creators, learners, and builders in one place — where content is not just watched, but experienced with purpose.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[25px] mb-10">
            <section className="bg-gray-800/[0.03] p-[30px] rounded-xl border border-gray-800/[0.07] border-t-4 border-t-blue-600">
              <h2 className="text-xl md:text-2xl text-gray-900 mb-[15px] font-bold flex items-center gap-3">
                <Target className="text-blue-600 w-6 h-6 shrink-0" /> Our Mission
              </h2>
              <p className="text-gray-700 mb-2">Our mission is simple:</p>
              <p className="text-xl font-bold text-[#10b981] my-[15px]">"To turn screen time into growth time."</p>
              <p className="text-gray-700">
                We believe that social media should not only capture attention, but also <strong className="font-bold text-gray-900">add value to people's lives.</strong>
              </p>
            </section>

            <section className="bg-gray-800/[0.03] p-[30px] rounded-xl border border-gray-800/[0.07] border-t-4 border-t-emerald-500">
              <h2 className="text-xl md:text-2xl text-gray-900 mb-[15px] font-bold flex items-center gap-3">
                <Eye className="text-emerald-500 w-6 h-6 shrink-0" /> Our Vision
              </h2>
              <p className="text-gray-700 mb-3">We aim to build a global platform where millions of people:</p>
              <ul className="list-none m-0 p-0">
                <li className="relative pl-[28px] mb-3 text-gray-700 text-base">
                  <span className="absolute left-0 text-blue-600">⚡</span> Learn something new every day
                </li>
                <li className="relative pl-[28px] mb-3 text-gray-700 text-base">
                  <span className="absolute left-0 text-blue-600">⚡</span> Share knowledge with others
                </li>
                <li className="relative pl-[28px] mb-3 text-gray-700 text-base">
                  <span className="absolute left-0 text-blue-600">⚡</span> Build better habits through content
                </li>
              </ul>
            </section>
          </div>

          <section className="bg-blue-600/[0.04] border border-blue-600/[0.15] p-6 md:p-[35px] rounded-[14px] mb-10">
            <h2 className="text-xl md:text-2xl text-blue-600 mb-[15px] font-bold flex items-center gap-3">
              <Star className="text-blue-600 w-6 h-6 shrink-0" /> What Makes Nexify Different
            </h2>
            <ul className="list-none m-0 p-0">
              <li className="relative pl-[28px] mb-3 text-gray-700 text-base">
                <span className="absolute left-0 text-blue-600">⚡</span> Short video with purpose — not just entertainment
              </li>
              <li className="relative pl-[28px] mb-3 text-gray-700 text-base">
                <span className="absolute left-0 text-blue-600">⚡</span> Learning-driven content <strong className="font-bold text-gray-900">(coding, business, mindset, skills, etc..)</strong>
              </li>
              <li className="relative pl-[28px] mb-3 text-gray-700 text-base">
                <span className="absolute left-0 text-blue-600">⚡</span> A platform that helps users grow, not waste time
              </li>
              <li className="relative pl-[28px] mb-3 text-gray-700 text-base">
                <span className="absolute left-0 text-blue-600">⚡</span> A community built on value, not noise
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl md:text-2xl text-gray-900 mb-[15px] font-bold flex items-center gap-3">
              <img src="" alt="" className="hidden" />
              <Users className="text-blue-600 w-6 h-6 shrink-0" /> Nexify Is For
            </h2>
            <div className="flex flex-col gap-[15px] mt-[15px]">
              <div className="bg-gray-800/[0.04] py-[18px] px-[25px] rounded-lg text-base flex items-center gap-[15px] border-l-4 border-l-blue-600 text-gray-800">
                <GraduationCap className="text-blue-600 w-5 h-5 shrink-0" /> Creators who want to teach and inspire
              </div>
              <div className="bg-gray-800/[0.04] py-[18px] px-[25px] rounded-lg text-base flex items-center gap-[15px] border-l-4 border-l-blue-600 text-gray-800">
                <Rocket className="text-blue-600 w-5 h-5 shrink-0" /> Users who want to grow, not just scroll
              </div>
              <div className="bg-gray-800/[0.04] py-[18px] px-[25px] rounded-lg text-base flex items-center gap-[15px] border-l-4 border-l-blue-600 text-gray-800">
                <Brain className="text-blue-600 w-5 h-5 shrink-0" /> Builders, thinkers, and future leaders
              </div>
            </div>
          </section>

          <div className="text-center bg-gradient-to-br from-blue-600/[0.07] to-blue-300/[0.07] border border-gray-800/10 p-6 md:p-[35px] rounded-2xl mt-[50px]">
            <h3 className="text-[14px] uppercase tracking-[2px] text-gray-800/50 mb-2.5 font-semibold">Final Message</h3>
            <p className="text-gray-700 mb-2">Nexify is not just another social media app.</p>
            <p className="text-[18px] md:text-[24px] font-extrabold text-[#10b981] mt-1">It is a platform where content meets purpose.</p>
          </div>

        </article>
      </main>

      <footer className="bg-[#1d4ed8] py-[30px] px-5 text-center text-[14px] text-white/70 border-t border-white/10 mt-auto w-full">
        <p className="mb-3">&copy; 2026 Nexify</p>
        <div className="flex justify-center gap-5">
          <a
            href="/footer/privacy"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("privacy");
            }}
            className="text-white/70 no-underline transition-colors duration-200 hover:text-blue-300"
          >
            Privacy
          </a>
          <a
            href="/footer/terms"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("terms");
            }}
            className="text-white/70 no-underline transition-colors duration-200 hover:text-blue-300"
          >
            Terms
          </a>
          <a
            href="/footer/contact"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("contact");
            }}
            className="text-white/70 no-underline transition-colors duration-200 hover:text-blue-300"
          >
            Contact
          </a>
          <a
            href="/footer/helps"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("helps");
            }}
            className="text-white/70 no-underline transition-colors duration-200 hover:text-blue-300"
          >
            Help
          </a>
        </div>
      </footer>
    </div>
  );
}
