import { useState, type FormEvent } from "react";
import { Zap, ChevronRight, ArrowLeft } from "lucide-react";

interface HelpsProps {
  onNavigate?: (page: string) => void;
}

export default function Helps({ onNavigate = () => {} }: HelpsProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (subject && message) {
      setSubmitted(true);
      setSubject("");
      setMessage("");
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <div className="bg-white text-gray-800 min-h-screen flex flex-col font-sans">
      <div className="help-page-wrapper flex flex-col min-h-screen">
        
        <main className="main-help-container flex-1 flex justify-center items-center py-[60px] px-5 bg-[#f0f4ff]">
          <div className="help-content-card w-full max-w-[680px] bg-white border border-gray-800/[0.08] p-6 md:p-10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            
            <header className="help-header text-center mb-[35px]">
              <div className="help-logo text-[28px] font-extrabold mb-[15px] flex items-center justify-center gap-2.5">
                <Zap className="lightning-icon text-[#2563eb] filter drop-shadow-[0_0_8px_#2563eb] w-6 h-6 animate-pulse" />
                <span>Help</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1.5">How can we help you?</h1>
              <p className="text-sm text-gray-800/55">Find answers to frequently asked questions or contact our support team.</p>
            </header>

            <section className="faq-section">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Frequently Asked Questions</h2>
              
              <div className="faq-list flex flex-col gap-3">
                <div className="faq-item bg-gray-800/[0.04] rounded-lg p-4">
                  <div className="faq-question font-semibold text-[15px] text-gray-900 flex items-center gap-1.5">
                    <ChevronRight className="text-[#2563eb] w-4 h-4 shrink-0" />
                    <span>How do I change my password?</span>
                  </div>
                  <div className="faq-answer mt-2 text-[13.5px] text-gray-800 leading-relaxed pl-3.5 border-l-2 border-l-[#2563eb]/40">
                    <p>Go to <strong>Settings</strong> from the main menu, scroll down to the account info section, enter your new password, and click <strong>Save</strong>.</p>
                  </div>
                </div>

                <div className="faq-item bg-gray-800/[0.04] rounded-lg p-4">
                  <div className="faq-question font-semibold text-[15px] text-gray-900 flex items-center gap-1.5">
                    <ChevronRight className="text-[#2563eb] w-4 h-4 shrink-0" />
                    <span>Can I make my profile private?</span>
                  </div>
                  <div className="faq-answer mt-2 text-[13.5px] text-gray-800 leading-relaxed pl-3.5 border-l-2 border-l-[#2563eb]/40">
                    <p>Yes! In <strong>Settings</strong>, under the <strong>Privacy</strong> section, select "Private (Only Followers/Members)" and click <strong>Save</strong>.</p>
                  </div>
                </div>

                <div className="faq-item bg-gray-800/[0.04] rounded-lg p-4">
                  <div className="faq-question font-semibold text-[15px] text-gray-900 flex items-center gap-1.5">
                    <ChevronRight className="text-[#2563eb] w-4 h-4 shrink-0" />
                    <span>How do I upload videos?</span>
                  </div>
                  <div className="faq-answer mt-2 text-[13.5px] text-gray-800 leading-relaxed pl-3.5 border-l-2 border-l-[#2563eb]/40">
                    <p>Video upload features are accessible via the creation tab. Stay tuned for Nexify Creator Studio updates!</p>
                  </div>
                </div>
              </div>
            </section>

            <hr className="section-divider border-none border-t border-gray-800/10 my-[35px]" />

            <section className="contact-support-section">
              <h3 className="text-lg font-bold mb-4 text-gray-900">Contact Support</h3>
              
              {submitted && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-4 rounded-xl mb-4 text-sm font-semibold">
                  Ticket submitted successfully! We'll look into it.
                </div>
              )}

              <form onSubmit={handleSubmit} className="support-form flex flex-col gap-4">
                <div className="form-group flex flex-col gap-1.5">
                  <label htmlFor="support-subject" className="text-xs font-semibold text-gray-800/60">Subject</label>
                  <input 
                    type="text" 
                    id="support-subject" 
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What issue are you facing?"
                    className="w-full p-3 bg-gray-800/[0.04] border border-gray-800/[0.12] rounded-lg text-gray-800 text-sm outline-none transition-colors duration-200 focus:border-[#2563eb]"
                  />
                </div>
                <div className="form-group flex flex-col gap-1.5">
                  <label htmlFor="support-message" className="text-xs font-semibold text-gray-800/60">Message</label>
                  <textarea 
                    id="support-message" 
                    rows={4} 
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your problem in detail..."
                    className="w-full p-3 bg-gray-800/[0.04] border border-gray-800/[0.12] rounded-lg text-gray-800 text-sm outline-none transition-colors duration-200 focus:border-[#2563eb] resize-none"
                  />
                </div>
                <button 
                  type="submit" 
                  className="submit-help-btn bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] border-none text-white font-bold text-sm py-3 px-7 rounded-lg cursor-pointer self-start transition-transform duration-200 hover:scale-[1.02] active:scale-95 outline-none"
                >
                  Submit Ticket
                </button>
              </form>
            </section>

            <div className="back-home-container mt-[25px] text-center">
              <a 
                href="/modules/home/home.html" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("about");
                }}
                className="back-home-link inline-flex items-center gap-1.5 text-xs text-gray-800/40 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </a>
            </div>

          </div>
        </main>

        <footer className="help-footer bg-[#1d4ed8] py-6 px-5 border-t border-white/10">
          <div className="footer-container max-w-[680px] mx-auto flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0 text-center md:text-left">
            <div className="footer-links flex gap-5 text-xs text-white/70">
              <a 
                href="/footer/about/about.html" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("about");
                }}
                className="hover:text-white transition-colors duration-200"
              >
                About
              </a>
              <a 
                href="/footer/privacy/privacy.html" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("privacy");
                }}
                className="hover:text-white transition-colors duration-200"
              >
                Privacy
              </a>
              <a 
                href="/footer/terms/terms.html" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("terms");
                }}
                className="hover:text-white transition-colors duration-200"
              >
                Terms
              </a>
              <a 
                href="/footer/contact/contact.html" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("contact");
                }}
                className="hover:text-white transition-colors duration-200"
              >
                Contact
              </a>
            </div>
            <p className="copyright text-xs text-white/50">&copy; 2026 Nexify</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
