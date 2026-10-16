import { useState, type FormEvent } from "react";
import {  ArrowLeft } from "lucide-react";

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
    <div className="bg-bg text-text-primary min-h-screen flex flex-col font-sans">
      <div className="help-page-wrapper flex flex-col min-h-screen">
        
        <main className="main-help-container flex-1 flex justify-center items-center py-[60px] px-5 bg-bg">
          <div className="help-content-card w-full max-w-[680px] bg-surface border border-border p-6 md:p-10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            
            <header className="help-header text-center mb-[35px]">
              <div className="help-logo text-[28px] font-extrabold mb-[15px] flex items-center justify-center gap-2.5">
                
                <span>Help</span>
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-1.5">How can we help you?</h1>
              <p className="text-sm text-text-secondary">Find answers to frequently asked questions or contact our support team.</p>
            </header>

          

            <hr className="section-divider border-none border-t border-divider my-[35px]" />

            <section className="contact-support-section">
              <h3 className="text-lg font-bold mb-4 text-text-primary">Contact Support</h3>
              
              {submitted && (
                <div className="bg-success-light border border-success-border text-success p-4 rounded-xl mb-4 text-sm font-semibold">
                  Ticket submitted successfully! We'll look into it.
                </div>
              )}

              <form onSubmit={handleSubmit} className="support-form flex flex-col gap-4">
                <div className="form-group flex flex-col gap-1.5">
                  <label htmlFor="support-subject" className="text-xs font-semibold text-text-secondary">Subject</label>
                  <input 
                    type="text" 
                    id="support-subject" 
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What issue are you facing?"
                    className="w-full p-3 bg-input-bg border border-input-border rounded-lg text-input-text placeholder-input-placeholder text-sm outline-none transition-colors duration-200 focus:border-input-focus"
                  />
                </div>
                <div className="form-group flex flex-col gap-1.5">
                  <label htmlFor="support-message" className="text-xs font-semibold text-text-secondary">Message</label>
                  <textarea 
                    id="support-message" 
                    rows={4} 
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your problem in detail..."
                    className="w-full p-3 bg-input-bg border border-input-border rounded-lg text-input-text placeholder-input-placeholder text-sm outline-none transition-colors duration-200 focus:border-input-focus resize-none"
                  />
                </div>
                <button 
                  type="submit" 
                  className="submit-help-btn bg-primary hover:bg-primary-hover border-none text-text-on-primary font-bold text-sm py-3 px-7 rounded-lg cursor-pointer self-start transition-transform duration-200 hover:scale-[1.02] active:scale-95 outline-none"
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
                  onNavigate("home");
                }}
                className="back-home-link inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors duration-200 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </a>
            </div>

          </div>
        </main>

        <footer className="help-footer bg-primary py-6 px-5 border-t border-primary-border">
          <div className="footer-container max-w-[680px] mx-auto flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0 text-center md:text-left">
            <div className="footer-links flex gap-5 text-xs text-text-on-primary/70">
              
              <a 
                href="/footer/privacy/privacy.html" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("privacypolicy");
                }}
                className="hover:text-text-on-primary transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a 
                href="/footer/terms/terms.html" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("terms");
                }}
                className="hover:text-text-on-primary transition-colors duration-200"
              >
                Terms & Service
              </a>
             
            </div>
            <p className="copyright text-xs text-text-on-primary/50">&copy; 2026 Nexify</p>
          </div>
        </footer>

      </div>
    </div>
  );
}