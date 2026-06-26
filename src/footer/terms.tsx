import { 
  Gavel, 
  Mail, 
  CheckCircle2, 
  ArrowLeft 
} from "lucide-react";

interface TermsProps {
  onNavigate?: (page: string) => void;
}

export default function Terms({ onNavigate = () => {} }: TermsProps) {
  return (
    <div className="bg-white text-gray-800 min-h-screen flex flex-col font-sans leading-relaxed">
      <header className="relative bg-gradient-to-br from-[#1d4ed8] to-[#2563eb] py-[50px] px-5 text-center border-b border-white/10">
        <div className="absolute top-4 left-4">
          <button
            onClick={() => onNavigate("about")}
            className="flex items-center gap-2 text-white hover:text-blue-200 transition-colors bg-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-0 outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to About
          </button>
        </div>
        <div className="max-w-[900px] mx-auto text-center">
          <h1 className="text-[32px] md:text-[42px] font-extrabold tracking-[1px] bg-gradient-to-r from-white to-[#93c5fd] bg-clip-text text-transparent mb-2 flex items-center justify-center gap-[15px]">
            <Gavel className="text-white w-8 h-8 md:w-10 md:h-10 shrink-0 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" /> Terms & Conditions
          </h1>
          <p className="text-white/50 text-[15px] italic">Last Updated: April 09, 2026</p>
        </div>
      </header>

      <main className="flex-1 max-w-[900px] w-full my-10 mx-auto px-5">
        <article className="bg-white border border-gray-800/10 rounded-2xl p-6 md:p-10 shadow-[0_15px_35px_rgba(0,0,0,0.08)]">
          
          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-gray-900 border-b-2 border-blue-600/30 pb-2 mb-[15px] font-semibold">1. Introduction</h2>
            <p className="text-gray-800 mb-3 text-base"><strong className="text-gray-950 font-semibold">Welcome to Nexify.</strong></p>
            <p className="text-gray-800 mb-3 text-base">By accessing or using Nexify, you agree to be bound by these Terms and Conditions.</p>
            <p className="text-gray-800 mb-3 text-base">If you do not agree, please do not use the platform.</p>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-gray-900 border-b-2 border-blue-600/30 pb-2 mb-[15px] font-semibold">2. User Accounts</h2>
            <p className="text-gray-800 mb-3 text-base">To use certain features, you may need to create an account. You agree to:</p>
            <ul className="list-none pl-[5px]">
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>Provide accurate information
              </li>
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>Keep your login details secure
              </li>
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>Be responsible for all activity under your account
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-gray-900 border-b-2 border-blue-600/30 pb-2 mb-[15px] font-semibold">3. Use of the Platform</h2>
            <p className="text-gray-800 mb-3 text-base">Nexify allows users to:</p>
            <ul className="list-none pl-[5px]">
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>Watch and share content
              </li>
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>Post videos, images, and text
              </li>
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>Interact with others <strong className="text-gray-950 font-semibold">(like, comment, follow)</strong>
              </li>
            </ul>
          </section>

          <section className="mb-[35px] bg-[rgba(234,67,53,0.05)] border border-[rgba(234,67,53,0.2)] p-5 rounded-lg">
            <h2 className="text-lg md:text-[22px] text-gray-900 border-b-2 border-b-[#ea4335]/40 pb-2 mb-[15px] font-semibold">4. Prohibited Activities</h2>
            <p className="text-gray-800 mb-3 text-base">You agree <strong className="text-gray-950 font-semibold">NOT</strong> to:</p>
            <ul className="list-none pl-[5px]">
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-[#ea4335] font-bold">✕</span>Post harmful, illegal, or abusive content
              </li>
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-[#ea4335] font-bold">✕</span>Harass, threaten, or harm other users
              </li>
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-[#ea4335] font-bold">✕</span>Share false or misleading information
              </li>
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-[#ea4335] font-bold">✕</span>Upload viruses or harmful code
              </li>
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-[#ea4335] font-bold">✕</span>Attempt to hack or disrupt the platform
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-gray-900 border-b-2 border-blue-600/30 pb-2 mb-[15px] font-semibold">5. Content Ownership</h2>
            <ul className="list-none pl-[5px]">
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>You own the content you post.
              </li>
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>By posting, you give Nexify permission to display and share your content on the platform.
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-gray-900 border-b-2 border-blue-600/30 pb-2 mb-[15px] font-semibold">6. Content Responsibility</h2>
            <p className="text-gray-800 mb-3 text-base">You are responsible for what you post.</p>
            <p className="text-gray-800 mb-3 text-base">Nexify is not responsible for user-generated content.</p>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-gray-900 border-b-2 border-blue-600/30 pb-2 mb-[15px] font-semibold">7. Account Suspension or Termination</h2>
            <p className="text-gray-800 mb-3 text-base">We may suspend or remove accounts that:</p>
            <ul className="list-none pl-[5px]">
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>Violate these Terms
              </li>
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>Harm other users
              </li>
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>Abuse the platform
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-gray-900 border-b-2 border-blue-600/30 pb-2 mb-[15px] font-semibold">8. Privacy</h2>
            <p className="text-gray-800 mb-3 text-base"><strong className="text-gray-950 font-semibold">Your use of Nexify is also governed by our Privacy Policy.</strong></p>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-gray-900 border-b-2 border-blue-600/30 pb-2 mb-[15px] font-semibold">9. Changes to the Service</h2>
            <p className="text-gray-800 mb-3 text-base">Nexify may:</p>
            <ul className="list-none pl-[5px]">
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>Update features
              </li>
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>Modify the platform
              </li>
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>Improve services at any time
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-gray-900 border-b-2 border-blue-600/30 pb-2 mb-[15px] font-semibold">10. Limitation of Liability</h2>
            <p className="text-gray-800 mb-3 text-base">Nexify is not responsible for:</p>
            <ul className="list-none pl-[5px]">
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>Loss of data
              </li>
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>Service interruptions
              </li>
              <li className="relative pl-[25px] mb-2.5 text-gray-800 text-[15px]">
                <span className="absolute left-0 text-blue-600 font-bold">✓</span>User behavior or content
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-gray-900 border-b-2 border-blue-600/30 pb-2 mb-[15px] font-semibold">11. Governing Law</h2>
            <p className="text-gray-800 mb-3 text-base">These Terms are governed by applicable laws in your region.</p>
          </section>

          <section className="mb-[35px] bg-[#2563eb]/[0.08] p-[25px] rounded-xl border border-dashed border-[#2563eb]/40 text-center">
            <h2 className="text-lg md:text-[22px] text-gray-900 mb-[15px] font-semibold inline-flex items-center gap-2 justify-center border-b-0 pb-0">
              Contact Information
            </h2>
            <p className="text-gray-800 mb-3 text-base">For questions about these Terms, feel free to contact us via email:</p>
            <a 
              href="mailto:binyamabrha75@gmail.com" 
              className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white no-underline py-3 px-[30px] rounded-lg font-semibold mt-2.5 shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,99,235,0.5)]"
            >
              <Mail className="w-5 h-5 shrink-0" /> Contact Support
            </a>
          </section>

          <div className="text-center bg-blue-300/10 border border-blue-300/40 p-[15px] rounded-lg mt-10">
            <p className="text-blue-600 font-semibold flex items-center justify-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#2563eb]" /> By using Nexify, you agree to these Terms and Conditions.
            </p>
          </div>

        </article>
      </main>

      <footer className="bg-[#1d4ed8] py-[30px] px-5 text-center text-[14px] text-white/70 border-t border-white/10 mt-auto w-full">
        <p className="mb-3">&copy; 2026 Nexify</p>
        <div className="flex justify-center gap-5">
          <a
            href="/footer/about"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("about");
            }}
            className="text-white/70 no-underline transition-colors duration-200 hover:text-[#93c5fd]"
          >
            About
          </a>
          <a
            href="/footer/privacy"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("privacy");
            }}
            className="text-white/70 no-underline transition-colors duration-200 hover:text-[#93c5fd]"
          >
            Privacy
          </a>
          <a
            href="/footer/contact"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("contact");
            }}
            className="text-white/70 no-underline transition-colors duration-200 hover:text-[#93c5fd]"
          >
            Contact
          </a>
          <a
            href="/footer/helps"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("helps");
            }}
            className="text-white/70 no-underline transition-colors duration-200 hover:text-[#93c5fd]"
          >
            Help
          </a>
        </div>
      </footer>
    </div>
  );
}
