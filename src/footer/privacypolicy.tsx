import { 
  ShieldCheck, 
  Lock, 
  TrendingUp, 
  Laptop, 
  Mail, 
  CheckCircle2, 
  ArrowLeft 
} from "lucide-react";

interface PrivacyProps {
  onNavigate?: (page: string) => void;
}

export default function Privacy({ onNavigate = () => {} }: PrivacyProps) {
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
            <ShieldCheck className="text-text-on-primary w-8 h-8 md:w-10 md:h-10 shrink-0" /> Privacy Policy
          </h1>
         
        </div>
      </header>

      <main className="flex-1 max-w-[900px] w-full my-10 mx-auto px-5">
        <article className="bg-surface border border-border rounded-2xl p-6 md:p-10 shadow-[0_15px_35px_rgba(0,0,0,0.08)]">
          
          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">1. Introduction</h2>
            <p className="text-text-primary mb-3 text-base"><strong className="text-text-primary font-semibold">Welcome to Nexify.</strong></p>
            <p className="text-text-primary mb-3 text-base">Your privacy is important to us. This Privacy Policy explains how Nexify collects, uses, and protects your information when you use our platform.</p>
            <p className="text-text-primary mb-3 text-base">By using Nexify, you agree to the terms outlined in this policy.</p>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">2. Information We Collect</h2>
            <p className="text-text-primary mb-3 text-base">We may collect the following types of information:</p>
            
            <div className="bg-surface-secondary py-[15px] px-5 rounded-lg mt-[15px] border-l-3 border-l-primary">
              <h3 className="text-base text-primary mb-2 flex items-center gap-2.5">
                <Lock className="w-4 h-4 shrink-0" /> Personal Information
              </h3>
              <ul className="list-none pl-1.5">
                <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                  <span className="absolute left-0 text-primary font-bold">✓</span>Username
                </li>
                <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                  <span className="absolute left-0 text-primary font-bold">✓</span>Email address
                </li>
                <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                  <span className="absolute left-0 text-primary font-bold">✓</span>Profile information <strong className="text-text-primary font-semibold">(bio, profile picture)</strong>
                </li>
              </ul>
            </div>

            <div className="bg-surface-secondary py-[15px] px-5 rounded-lg mt-[15px] border-l-3 border-l-primary">
              <h3 className="text-base text-primary mb-2 flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 shrink-0" /> Usage Information
              </h3>
              <ul className="list-none pl-1.5">
                <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                  <span className="absolute left-0 text-primary font-bold">✓</span>Videos you watch
                </li>
                <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                  <span className="absolute left-0 text-primary font-bold">✓</span>Likes, comments, and interactions
                </li>
                <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                  <span className="absolute left-0 text-primary font-bold">✓</span>Time spent on content
                </li>
              </ul>
            </div>

            <div className="bg-surface-secondary py-[15px] px-5 rounded-lg mt-[15px] border-l-3 border-l-primary">
              <h3 className="text-base text-primary mb-2 flex items-center gap-2.5">
                <Laptop className="w-4 h-4 shrink-0" /> Device Information
              </h3>
              <ul className="list-none pl-1.5">
                <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                  <span className="absolute left-0 text-primary font-bold">✓</span>Device type
                </li>
                <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                  <span className="absolute left-0 text-primary font-bold">✓</span>Browser type
                </li>
                <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                  <span className="absolute left-0 text-primary font-bold">✓</span>IP address <strong className="text-text-primary font-semibold">(basic location)</strong>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">3. How We Use Your Information</h2>
            <p className="text-text-primary mb-3 text-base">We use your data to:</p>
            <ul className="list-none pl-1.5">
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Provide and improve the Nexify platform
              </li>
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Personalize your content feed
              </li>
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Show relevant videos and suggestions
              </li>
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Improve user experience
              </li>
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Ensure security and prevent abuse
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">4. How We Protect Your Data</h2>
            <p className="text-text-primary mb-3 text-base">We take privacy seriously. We use:</p>
            <ul className="list-none pl-1.5">
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Secure systems to protect data
              </li>
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Limited access to personal information
              </li>
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Continuous monitoring for security risks
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">5. Sharing of Information</h2>
            <p className="text-text-primary mb-3 text-base">We do <strong className="text-text-primary font-semibold">NOT</strong> sell your personal data. We may share information only:</p>
            <ul className="list-none pl-1.5">
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>To comply with legal requirements
              </li>
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>To protect Nexify and its users
              </li>
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>With trusted services <strong className="text-text-primary font-semibold">(hosting, analytics)</strong>
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">6. Content and Visibility</h2>
            <ul className="list-none pl-1.5">
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Content you post may be visible to others
              </li>
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Public accounts can be viewed by anyone
              </li>
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Private accounts <strong className="text-text-primary font-semibold">(future feature)</strong> will limit visibility
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">7. Your Control and Choices</h2>
            <p className="text-text-primary mb-3 text-base">You have the right to:</p>
            <ul className="list-none pl-1.5">
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Edit your profile information
              </li>
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Delete your content
              </li>
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Control what you share
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">8. Account Deletion</h2>
            <p className="text-text-primary mb-3 text-base">You can request to delete your account. When deleted:</p>
            <ul className="list-none pl-1.5">
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Your profile will be removed
              </li>
              <li className="relative pl-[25px] mb-2 text-text-primary text-[15px]">
                <span className="absolute left-0 text-primary font-bold">✓</span>Your content may be deleted permanently
              </li>
            </ul>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">9. Children's Privacy</h2>
            <p className="text-text-primary mb-3 text-base"><strong className="text-text-primary font-semibold">Nexify is not intended for users under 13 years old.</strong></p>
            <p className="text-text-primary mb-3 text-base">We do not knowingly collect data from children.</p>
          </section>

          <section className="mb-[35px]">
            <h2 className="text-lg md:text-[22px] text-text-primary border-b-2 border-primary-border pb-2 mb-[15px] font-semibold">10. Changes to This Policy</h2>
            <p className="text-text-primary mb-3 text-base">We may update this Privacy Policy. Any changes will be posted on this page.</p>
          </section>

          <section className="mb-[35px] bg-primary-light p-[25px] rounded-xl border border-dashed border-primary-border text-center">
            <h2 className="text-lg md:text-[22px] text-text-primary mb-[15px] font-semibold inline-flex items-center gap-2 justify-center border-b-0 pb-0">
              11. Contact Us
            </h2>
            <p className="text-text-primary mb-3 text-base">If you have questions about this policy, contact us via email:</p>
            <a 
              href="mailto:binyamabrha75@gmail.com" 
              className="inline-flex items-center gap-2.5 bg-primary hover:bg-primary-hover text-text-on-primary no-underline py-3 px-[30px] rounded-lg font-semibold mt-2.5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Mail className="w-5 h-5 shrink-0" /> Contact Support
            </a>
          </section>

          <div className="text-center bg-primary-light border border-primary-border p-[15px] rounded-lg mt-10">
            <p className="text-primary font-semibold flex items-center justify-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-primary" /> By using Nexify, you agree to this Privacy Policy.
            </p>
          </div>

        </article>
      </main>

      <footer className="bg-primary py-[30px] px-5 text-center text-[14px] text-text-on-primary/70 border-t border-primary-border mt-auto w-full">
        <p className="mb-3">&copy; 2026 Nexify</p>
        <div className="flex justify-center gap-5">
          <a
            href="/footer/about"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("about");
            }}
            className="text-text-on-primary/70 no-underline transition-colors duration-200 hover:text-text-on-primary"
          >
            About
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