import { useState, type FormEvent } from "react";
import {
  Send,
  AlertTriangle,
  Bug,
  Key,
  AlertCircle,
  Briefcase,
  Globe,
  Clock,
  MailOpen,
  ArrowLeft,
} from "lucide-react";

interface ContactProps {
  onNavigate?: (page: string) => void;
}

export default function Contact({ onNavigate = () => {} }: ContactProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: "general",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
      setFormData({ name: "", email: "", reason: "general", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

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
        <div className="max-w-[1200px] mx-auto text-center">
          <h1 className="text-[32px] md:text-[42px] font-extrabold tracking-[1px] text-text-on-primary flex items-center justify-center gap-1">
            Contact Nexify
          </h1>
          <p className="text-text-on-primary/70 text-base tracking-[2px] mt-2 uppercase font-medium">
            We'd love to hear from you
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] w-full my-10 mx-auto px-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10">
          <div className="flex flex-col gap-[25px]">
            <section className="bg-surface border border-border border-t-4 border-t-primary rounded-xl p-[25px] shadow-[0_10px_25px_rgba(0,0,0,0.07)]">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-3 text-text-primary">
                <Send className="text-primary w-5 h-5 shrink-0" /> Feedback &
                Suggestions
              </h2>
              <p className="text-text-primary text-[15px]">
                <strong>Have an idea to improve Nexify?</strong> We are always
                working to make Nexify better. Send us your suggestions and help
                shape the future of the platform.
              </p>
            </section>

            <section className="bg-surface border border-border border-t-4 border-t-error rounded-xl p-[25px] shadow-[0_10px_25px_rgba(0,0,0,0.07)]">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-3 text-text-primary">
                <AlertTriangle className="text-error w-5 h-5 shrink-0" /> Report
                a Problem
              </h2>
              <p className="text-text-primary text-[15px]">
                If you experience any issues such as:
              </p>
              <ul className="list-none my-[15px] p-0 flex flex-col gap-2">
                <li className="text-[15px] text-text-primary flex items-center gap-3">
                  <Bug className="text-error w-4 h-4 shrink-0" /> Bugs &
                  Technical Glitches
                </li>
                <li className="text-[15px] text-text-primary flex items-center gap-3">
                  <Key className="text-error w-4 h-4 shrink-0" /> Login &
                  Account Problems
                </li>
                <li className="text-[15px] text-text-primary flex items-center gap-3">
                  <AlertCircle className="text-error w-4 h-4 shrink-0" />{" "}
                  Content Issues
                </li>
              </ul>
              <p className="italic text-text-muted text-[15px]">
                Please contact us with details so we can fix it quickly.
              </p>
            </section>

            <section className="bg-surface border border-border border-t-4 border-t-primary rounded-xl p-[25px] shadow-[0_10px_25px_rgba(0,0,0,0.07)]">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-3 text-text-primary">
                <Briefcase className="text-primary w-5 h-5 shrink-0" /> Business
                & Partnerships
              </h2>
              <p className="text-text-primary text-[15px]">
                For business inquiries, collaborations, or partnerships, feel
                free to reach out directly to our team.
              </p>
            </section>

            <div className="bg-primary-light border border-border p-[25px] rounded-xl">
              <p className="text-[15px] text-text-primary">
                <Globe className="text-primary w-5 h-5 inline-block mr-1 align-text-bottom shrink-0" />{" "}
                <strong>
                  Nexify is more than a platform — it's a global community
                  focused on growth, learning, and meaningful content.
                </strong>{" "}
                We are building the future of social media — together.
              </p>
            </div>
          </div>

          <div className="form-side">
            <div className="bg-surface border border-border rounded-2xl p-6 md:p-[35px] shadow-[0_15px_35px_rgba(0,0,0,0.07)] lg:sticky lg:top-[30px]">
              <h2 className="text-2xl font-bold mb-2.5 flex items-center gap-3 text-text-primary">
                <MailOpen className="text-icon-primary w-6 h-6 shrink-0" /> Send
                a Message
              </h2>
              <p className="text-text-secondary text-[15px] mb-[25px]">
                Whether you have questions, feedback, or ideas — feel free to
                reach out.
              </p>

              {submitted && (
                <div className="bg-success-light border border-success-border text-success p-4 rounded-xl mb-4 text-sm font-semibold">
                  Thank you! Your message has been sent successfully. We'll
                  reply within 24 to 48 hours.
                </div>
              )}

              <form
                id="contactForm"
                onSubmit={handleSubmit}
                className="flex flex-col gap-5"
              >
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="userName"
                    className="text-sm text-text-primary font-medium"
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="userName"
                    placeholder="Enter your name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full py-3 px-4 bg-input-bg border border-input-border rounded-lg text-input-text placeholder-input-placeholder text-[15px] outline-none transition-colors duration-300 focus:border-input-focus"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="userEmail"
                    className="text-sm text-text-primary font-medium"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="userEmail"
                    placeholder="Enter your email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full py-3 px-4 bg-input-bg border border-input-border rounded-lg text-input-text placeholder-input-placeholder text-[15px] outline-none transition-colors duration-300 focus:border-input-focus"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="messageReason"
                    className="text-sm text-text-primary font-medium"
                  >
                    Reason for Contact
                  </label>
                  <select
                    id="messageReason"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    className="w-full py-3 px-4 bg-input-bg border border-input-border rounded-lg text-input-text text-[15px] outline-none transition-colors duration-300 focus:border-input-focus appearance-none"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="feedback">Feedback & Suggestions</option>
                    <option value="bug">Report a Problem</option>
                    <option value="business">Business & Partnerships</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="userMessage"
                    className="text-sm text-text-primary font-medium"
                  >
                    Your Message
                  </label>
                  <textarea
                    id="userMessage"
                    rows={5}
                    placeholder="Write your message here..."
                    required
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full py-3 px-4 bg-input-bg border border-input-border rounded-lg text-input-text placeholder-input-placeholder text-[15px] outline-none transition-colors duration-300 focus:border-input-focus resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full p-3.5 bg-primary hover:bg-primary-hover text-text-on-primary rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg mt-2.5 border-0 outline-none"
                >
                  Send Message
                </button>
              </form>

              <div className="text-center mt-[25px] pt-5 border-t border-border text-sm text-text-primary">
                <p>
                  <Clock className="text-primary w-4 h-4 inline-block mr-1 align-middle shrink-0" />{" "}
                  Response Time: <strong>24 - 48 Hours</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-primary py-[30px] px-5 text-center text-sm text-text-on-primary/70 border-t border-primary-border mt-auto w-full">
        <p className="mb-3">&copy; 2026 Nexify</p>
        <div className="flex justify-center gap-5">
          <a
            href="/footer/privacy"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("privacypolicy");
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
