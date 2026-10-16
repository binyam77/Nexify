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
    <div className="bg-bg text-text-primary min-h-screen flex flex-col font-sans leading-relaxed">
      <header className="relative bg-primary py-[50px] px-5 text-center border-b border-primary-border">
        <div className="absolute top-4 left-4">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 text-text-on-primary hover:opacity-80 transition-colors bg-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-0 outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>
        </div>
        <div className="max-w-[900px] mx-auto text-center">
          <h1 className="text-[32px] md:text-[42px] font-extrabold tracking-[1px] text-text-on-primary mb-2 flex items-center justify-center gap-[15px]">
            <Gavel className="text-text-on-primary w-8 h-8 md:w-10 md:h-10 shrink-0" /> Terms & Service
          </h1>
          <p className="text-text-on-primary/70 text-[15px] italic">Last Updated: Sep 12, 2026</p>
        </div>
      </header>

      <main className="flex-1 max-w-[900px] w-full my-10 mx-auto px-5">
        <article className="bg-surface border border-border rounded-2xl p-6 md:p-10 shadow-[0_15px_35px_rgba(0,0,0,0.08)]">
          
          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">1. Introduction</h2>
            <p className="text-text-primary mb-3 text-base"><strong className="text-text-primary font-semibold">Welcome to Nexify.</strong></p>
            <p className="text-text-primary mb-3 text-base">By accessing or using Nexify, you agree to be bound by these Terms and Conditions.</p>
            <p className="text-text-primary mb-3 text-base">If you do not agree, please do not use the platform.</p>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">2. User Accounts</h2>
            <p className="text-text-primary mb-3 text-base">To use certain features, you may need to create an account. You agree to:</p>
            <ul className="list-none pl-[5px]">
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Provide accurate information
              </li>
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Keep your login details secure
              </li>
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Be responsible for all activity under your account
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">3. Use of the Platform</h2>
            <p className="text-text-primary mb-3 text-base">Nexify allows users to:</p>
            <ul className="list-none pl-[5px]">
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Watch and share content
              </li>
               <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Creating Channel and Group
              </li>
               <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Messaging in private chat
              </li>
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Post videos, images, and text
              </li>
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Interact with others <strong className="text-text-primary font-semibold">(like, comment, follow)</strong>
              </li>
            </ul>
          </section>

          <section className="mb-[35px] bg-error-light border border-error-border p-5 rounded-lg">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-b-error-border pb-2 mb-[15px] font-semibold">4. Prohibited Activities</h2>
            <p className="text-text-primary mb-3 text-base">You agree <strong className="text-text-primary font-semibold">NOT</strong> to:</p>
            <ul className="list-none pl-[5px]">
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-error font-bold">✕</span>Post harmful, illegal, or abusive content
              </li>
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-error font-bold">✕</span>Harass, threaten, or harm other users
              </li>
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-error font-bold">✕</span>Share false or misleading information
              </li>
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-error font-bold">✕</span>Upload viruses or harmful code
              </li>
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-error font-bold">✕</span>Attempt to hack or disrupt the platform
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">5. Content Ownership</h2>
            <ul className="list-none pl-[5px]">
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>You own the content you post.
              </li>
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>By posting, you give Nexify permission to display and share your content on the platform.
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">6. Content Responsibility</h2>
            <p className="text-text-primary mb-3 text-base">You are responsible for what you post.</p>
            <p className="text-text-primary mb-3 text-base">Nexify is not responsible for user-generated content.</p>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">7. Account Suspension or Termination</h2>
            <p className="text-text-primary mb-3 text-base">We may suspend or remove accounts that:</p>
            <ul className="list-none pl-[5px]">
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Violate these Terms
              </li>
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Harm other users
              </li>
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Abuse the platform
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">8. Privacy</h2>
            <p className="text-text-primary mb-3 text-base"><strong className="text-text-primary font-semibold">Your use of Nexify is also governed by our Privacy Policy.</strong></p>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">9. Changes to the Service</h2>
            <p className="text-text-primary mb-3 text-base">Nexify may:</p>
            <ul className="list-none pl-[5px]">
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Update features
              </li>
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Modify the platform
              </li>
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Improve services at any time
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">10. Limitation of Liability</h2>
            <p className="text-text-primary mb-3 text-base">Nexify is not responsible for:</p>
            <ul className="list-none pl-[5px]">
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Loss of data
              </li>
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Service interruptions
              </li>
              <li className="relative pl-[25px] mb-2.5 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>User behavior or content
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">11. Governing Law</h2>
            <p className="text-text-primary mb-3 text-base">These Terms are governed by applicable laws in your region.</p>
          </section>

          <section className="mb-[35px] bg-primary-light p-[25px] rounded-xl border border-dashed border-primary-border text-center">
            <h2 className="text-lg md:text-[22px] text-text-primary mb-[15px] font-semibold inline-flex items-center gap-2 justify-center border-b-0 pb-0">
              Contact Information
            </h2>
            <p className="text-text-primary mb-3 text-base">For questions about these Terms, feel free to contact us via email:</p>
            <a 
              href="mailto:binyamabrha75@gmail.com" 
              className="inline-flex items-center gap-2.5 bg-primary hover:bg-primary-hover text-text-on-primary no-underline py-3 px-[30px] rounded-lg font-semibold mt-2.5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Mail className="w-5 h-5 shrink-0" /> Contact Support
            </a>
          </section>

          <div className="text-center bg-primary-light border border-primary-border p-[15px] rounded-lg mt-10">
            <p className="text-primary font-semibold flex items-center justify-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-primary" /> By using Nexify, you agree to these Terms and Conditions.
            </p>
          </div>

        </article>
      </main>

      <footer className="bg-primary py-[30px] px-5 text-center text-[14px] text-text-on-primary/70 border-t border-primary-border mt-auto w-full">
      
        <div className="flex justify-center gap-5">
          
          <a
            href="/footer/privacypolicy"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("privacypolicy");
            }}
            className="text-text-on-primary/70 no-underline transition-colors duration-200 hover:text-text-on-primary"
          >
            Privacy Policy
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
          <p className="mb-3">&copy; 2026 Nexify</p>
      </footer>
    </div>
  );
}