import { useState, useEffect, useRef, useCallback } from "react";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "./contact";
import {
  Check,
  Leaf,
  CalendarDays,
  ClipboardCheck,
  Bell,
  Award,
  Users,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  Menu,
  X,
  ShieldCheck,
  Building2,
  Hourglass,
  LogIn,
  ChevronDown,
  UserPlus,
  User,
  CheckCircle2,
} from "lucide-react";

import Login from "./Login";
import Register from "./Register";
import UserDashboard from "./UserDashboard";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";
import OrganizerLogin from "./OrganizerLogin";
import OrganizerRegister from "./OrganizerRegister";
import OrganizerDashboard from "./OrganizerDashboard";

import ForgotPassword from "./ForgotPassword";
import VerifyResetCode from "./VerifyResetCode";
import ResetPassword from "./ResetPassword";
import PasswordResetSuccess from "./PasswordResetSuccess";

import volunteer from "./assets/voluteer.jpg";


/* =========================================================
   ECOTASK LOGO
========================================================= */

function EcoTaskLogo({ light = false }) {
  return (
    <div className="flex items-center font-black tracking-tight">
      <span
        className={`text-[26px] ${
          light ? "text-white" : "text-[#1f5133]"
        }`}
      >
        Ec
      </span>

      <div className="mx-[3px] flex h-[31px] w-[31px] items-center justify-center rounded-full border-[3px] border-[#4ade80] bg-[#075f2b]">
        <svg
          width="18"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 19V5"
            stroke="#86EFAC"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M6.5 10.5L12 5L17.5 10.5"
            stroke="#86EFAC"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <span
        className={`text-[26px] ${
          light ? "text-white" : "text-[#1f5133]"
        }`}
      >
        Task
      </span>
    </div>
  );
}


/* =========================================================
   LANDING PAGE
========================================================= */

// Adds the "eco-reveal-in" class to .eco-reveal elements as they scroll into view.
// Cards in the same row get a small delay so they appear one after another.
function useScrollReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const items = [...root.querySelectorAll(".eco-reveal")];

    items.forEach((el) => {
      const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("eco-reveal"));
      el.style.setProperty("--eco-reveal-delay", `${siblings.indexOf(el) * 110}ms`);
    });

    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("eco-reveal-in"));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("eco-reveal-in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef]);
}

function SectionTag({ children, light = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] ${
      light ? "bg-white/10 text-green-300" : "bg-green-100 text-green-700"
    }`}>
      <Leaf size={13} />
      {children}
    </span>
  );
}

function IconTile({ icon: Icon, dark = false }) {
  return (
    <span className={`landing-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
      dark ? "bg-white/10 text-green-300" : "bg-green-100 text-green-700"
    }`}>
      <Icon size={20} />
    </span>
  );
}

function FloatingLeaf({ className, size, delay }) {
  return (
    <Leaf
      aria-hidden="true"
      size={size}
      className={`landing-leaf pointer-events-none absolute z-[1] text-green-400/30 ${className}`}
      style={{ animationDelay: delay }}
      fill="currentColor"
    />
  );
}

const HOW_IT_WORKS = [
  { icon: UserPlus, title: "Create an account", text: "Sign up with your email and confirm the 6-digit code." },
  { icon: MapPin, title: "Join an activity", text: "Browse clean-ups, tree planting and more near you." },
  { icon: CheckCircle2, title: "Show up and help", text: "The organizer marks your attendance on the day." },
  { icon: Award, title: "Get your certificate", text: "Download your participation certificate as a PDF." },
];

const FEATURES = [
  { icon: MapPin, title: "Discover activities", text: "By location, schedule, and open slots." },
  { icon: Users, title: "Join activities", text: "Register for community-led initiatives in one click." },
  { icon: CalendarDays, title: "Manage your schedule", text: "Keep track of upcoming activities." },
  { icon: ClipboardCheck, title: "Track participation", text: "A record of every activity you joined." },
  { icon: Bell, title: "Announcements", text: "Updates, reminders, and community news." },
  { icon: Award, title: "Certificates", text: "Issued by the organizer, downloadable as PDF." },
];

const FAQS = [
  { q: "How do I become an organizer?", a: "Apply as an organizer and upload a verification document. The EcoTask admin reviews it, and once approved you can post activities." },
  { q: "How do I get my certificate?", a: "After the activity, the organizer marks attendance and issues certificates. You can download yours from your dashboard." },
  { q: "Can I leave an activity after joining?", a: "Yes. You can leave an activity from your dashboard before it happens." },
];

const NAV_LINKS = [
  { id: "how", label: "Home" },
  { id: "join", label: "Join" },
  { id: "features", label: "Features" },
  { id: "contacts", label: "Contact" },
];

function LandingPage({ onGetStarted, onLogin, onAdmin, onOrganizer, onOrganizerRegister }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const rootRef = useRef(null);
  const loginRef = useRef(null);

  useScrollReveal(rootRef);

  // Close the "Log in" menu when clicking anywhere else.
  useEffect(() => {
    if (!loginOpen) return undefined;
    const close = (e) => {
      if (loginRef.current && !loginRef.current.contains(e.target)) setLoginOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [loginOpen]);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  const primaryBtn = "landing-btn inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 font-bold text-black shadow-[0_8px_20px_-8px_rgba(34,197,94,0.7)] transition hover:-translate-y-px hover:bg-green-400 active:scale-95";
  const ghostBtn = "landing-btn inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 font-bold text-white transition hover:bg-white/10 active:scale-95";
  const card = "eco-reveal landing-card rounded-2xl border border-green-100 bg-white";

  return (
    <div ref={rootRef} className="min-h-screen w-full overflow-x-hidden bg-[#f5faf6] text-[#12351f]">

      {/* ================= NAVBAR ================= */}
      <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#061c10]/95 backdrop-blur-md">
        <nav className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
          <button onClick={() => scrollToSection("home")} className="shrink-0" aria-label="EcoTask home">
            <EcoTaskLogo light />
          </button>

          <div className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-sm font-semibold text-white/80 transition hover:text-green-400"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Log in menu: Volunteer / Organizer */}
            <div ref={loginRef} className="relative">
              <button
                onClick={() => setLoginOpen(!loginOpen)}
                aria-expanded={loginOpen}
                className={`${ghostBtn} px-3 py-2.5 text-sm sm:px-4`}
              >
                <LogIn size={16} />
                Log in
                <ChevronDown size={15} className={`transition-transform ${loginOpen ? "rotate-180" : ""}`} />
              </button>

              {loginOpen && (
                <div className="landing-pop absolute right-0 top-[calc(100%+8px)] w-64 rounded-2xl bg-white p-1.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.35)]">
                  <button
                    onClick={() => { setLoginOpen(false); onLogin(); }}
                    className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition hover:bg-green-50"
                  >
                    <IconTile icon={User} />
                    <span>
                      <span className="block text-sm font-bold text-[#12351f]">Volunteer</span>
                      <span className="text-xs text-gray-500">Join and track activities</span>
                    </span>
                  </button>
                  <button
                    onClick={() => { setLoginOpen(false); onOrganizer(); }}
                    className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition hover:bg-green-50"
                  >
                    <IconTile icon={Building2} />
                    <span>
                      <span className="block text-sm font-bold text-[#12351f]">Organizer</span>
                      <span className="text-xs text-gray-500">Manage your activities</span>
                    </span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-2 text-white md:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={25} /> : <Menu size={25} />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="landing-pop border-t border-white/10 bg-[#061c10] px-4 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="rounded-lg px-4 py-3 text-left text-sm font-semibold text-white hover:bg-white/10"
                >
                  {link.label}
                </button>
              ))}
              <div className="my-2 h-px bg-white/10" />
              <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-white/40">Volunteer</p>
              <div className="grid grid-cols-2 gap-2 px-2">
                <button onClick={onGetStarted} className={`${primaryBtn} px-3 py-2.5 text-sm`}>Sign up</button>
                <button onClick={onLogin} className={`${ghostBtn} px-3 py-2.5 text-sm`}>Log in</button>
              </div>
              <p className="px-4 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-white/40">Organizer</p>
              <div className="grid grid-cols-2 gap-2 px-2">
                <button onClick={onOrganizerRegister} className={`${ghostBtn} px-3 py-2.5 text-sm`}>Apply</button>
                <button onClick={onOrganizer} className={`${ghostBtn} px-3 py-2.5 text-sm`}>Log in</button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>

        {/* ================= HERO ================= */}
        <section id="home" className="relative scroll-mt-[72px] overflow-hidden bg-[#00140d] pt-[72px] text-white">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={volunteer}
              alt="Volunteers holding young plants"
              className="landing-hero-img h-full w-full object-cover object-center"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#00150d] via-[#002417]/90 to-[#002416]/55" />

          <FloatingLeaf className="right-[12%] top-[22%]" size={46} delay="0s" />
          <FloatingLeaf className="bottom-[18%] right-[30%] hidden sm:block" size={30} delay="-2s" />
          <FloatingLeaf className="bottom-[34%] right-[6%]" size={36} delay="-4s" />

          <div className="relative z-10 mx-auto max-w-[1200px] px-4 pb-20 pt-16 sm:px-6 md:pb-28 md:pt-24">
            <p className="landing-up text-xs font-extrabold uppercase tracking-[0.22em] text-green-400" style={{ animationDelay: "100ms" }}>
              Welcome to EcoTask
            </p>

            <h1 className="landing-up mt-4 max-w-3xl text-[40px] font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl" style={{ animationDelay: "220ms" }}>
              Volunteer for a <span className="text-green-400">greener community.</span>
            </h1>

            <p className="landing-up mt-5 max-w-xl text-base leading-7 text-white/85 md:text-lg" style={{ animationDelay: "340ms" }}>
              Find local environmental activities, sign up in one click, and earn a
              certificate for every activity you complete.
            </p>

            <div className="landing-up mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "460ms" }}>
              <button onClick={onGetStarted} className={`${primaryBtn} px-7 py-4 text-[15px]`}>
                Join as Volunteer
                <ArrowRight size={18} />
              </button>
              <button onClick={onOrganizerRegister} className={`${ghostBtn} border-green-400/60 bg-black/20 px-7 py-4 text-[15px] backdrop-blur-sm hover:border-green-400 hover:bg-green-500/15`}>
                Apply as Organizer
                <ArrowRight size={18} className="text-green-400" />
              </button>
            </div>

            <div className="landing-up mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/75" style={{ animationDelay: "580ms" }}>
              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-400" /> Free for volunteers</span>
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-400" /> Organizers verified by admin</span>
              <span className="flex items-center gap-2"><Award size={16} className="text-green-400" /> PDF certificates</span>
            </div>
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section id="how" className="scroll-mt-[72px] px-4 py-20 sm:px-6 md:py-24">
          <div className="mx-auto max-w-[1200px]">
            <div className="eco-reveal mx-auto max-w-2xl text-center">
              <SectionTag>How it works</SectionTag>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-[42px]">
                From sign-up to <span className="text-green-600">certificate</span> in 4 steps.
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((step, index) => (
                <div key={step.title} className={`${card} relative p-6`}>
                  <span className="absolute right-5 top-4 text-4xl font-black leading-none text-green-100">{index + 1}</span>
                  <IconTile icon={step.icon} />
                  <h3 className="mt-4 text-[17px] font-bold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-gray-600">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= TWO WAYS TO TAKE PART ================= */}
        <section id="join" className="scroll-mt-[72px] bg-white px-4 py-20 sm:px-6 md:py-24">
          <div className="mx-auto max-w-[1200px]">
            <div className="eco-reveal mx-auto max-w-2xl text-center">
              <SectionTag>Get started</SectionTag>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-[42px]">
                Two ways to <span className="text-green-600">take part.</span>
              </h2>
              <p className="mt-3 text-gray-600">Pick the one that fits you.</p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Volunteer */}
              <div className={`${card} flex flex-col p-7 md:p-8`}>
                <IconTile icon={User} />
                <h3 className="mt-4 text-2xl font-black">I'm a Volunteer</h3>
                <p className="mt-1 text-sm text-gray-600">For community members who want to help.</p>
                <ul className="my-6 grid gap-2.5 text-sm">
                  {["Discover and join activities near you", "Get reminders and announcements", "Track your participation history", "Download certificates"].map((item) => (
                    <li key={item} className="flex items-start gap-2.5"><CheckCircle2 size={18} className="mt-px shrink-0 text-green-500" />{item}</li>
                  ))}
                </ul>
              </div>

              {/* Organizer */}
              <div className="eco-reveal landing-card flex flex-col rounded-2xl bg-gradient-to-br from-[#00150d] to-[#075f2b] p-7 text-white md:p-8">
                <IconTile icon={Building2} dark />
                <h3 className="mt-4 text-2xl font-black">I'm an Organizer</h3>
                <p className="mt-1 text-sm text-white/75">For schools, LGUs, and groups that run eco activities.</p>
                <ul className="my-6 grid gap-2.5 text-sm">
                  {["Post activities with tasks and volunteer limits", "See who joined and mark attendance", "Issue certificates in one click", "Send updates to your volunteers"].map((item) => (
                    <li key={item} className="flex items-start gap-2.5"><CheckCircle2 size={18} className="mt-px shrink-0 text-green-400" />{item}</li>
                  ))}
                </ul>
                <p className="mt-auto flex items-center gap-1.5 text-xs text-white/60">
                  <Hourglass size={13} /> Applications are reviewed by the EcoTask admin before you can post activities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= KEY FEATURES ================= */}
        <section id="features" className="scroll-mt-[72px] px-4 py-20 sm:px-6 md:py-24">
          <div className="mx-auto max-w-[1200px]">
            <div className="eco-reveal mx-auto max-w-2xl text-center">
              <SectionTag>Key features</SectionTag>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-[42px]">
                Everything in <span className="text-green-600">one place.</span>
              </h2>
              <p className="mt-3 text-gray-600">EcoTask brings environmental activity tools together in one simple platform.</p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className={`${card} flex gap-4 p-5`}>
                  <IconTile icon={feature.icon} />
                  <div>
                    <h4 className="font-bold">{feature.title}</h4>
                    <p className="mt-0.5 text-sm text-gray-600">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CONTACT + FAQ ================= */}
        <section id="contacts" className="scroll-mt-[72px] bg-white px-4 py-20 sm:px-6 md:py-24">
          <div className="mx-auto grid max-w-[1200px] items-start gap-12 lg:grid-cols-2">
            <div className="eco-reveal">
              <SectionTag>Contact</SectionTag>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-[42px]">
                Have questions? <span className="text-green-600">We'd love to help.</span>
              </h2>
              <p className="mt-4 max-w-lg text-gray-600">
                For questions, suggestions, or information about EcoTask, reach out through our contact details.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  { icon: Mail, label: "Email", value: SUPPORT_EMAIL },
                  { icon: Phone, label: "Phone", value: SUPPORT_PHONE },
                  { icon: MapPin, label: "Location", value: "Pangasinan, Philippines" },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4">
                    <IconTile icon={icon} />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                      <p className="font-semibold">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="eco-reveal">
              <SectionTag>FAQ</SectionTag>
              <div className="mt-5 space-y-2.5">
                {FAQS.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div key={faq.q} className={`rounded-2xl border transition ${isOpen ? "border-green-200 bg-green-50/60" : "border-green-100 bg-[#f8fcf9]"}`}>
                      <button
                        onClick={() => setOpenFaq(isOpen ? -1 : index)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold"
                      >
                        {faq.q}
                        <ChevronDown size={18} className={`shrink-0 text-green-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                        <p className="overflow-hidden px-5 text-sm leading-6 text-gray-600">
                          <span className="block pb-4">{faq.a}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#061c10] px-4 py-10 text-white sm:px-6">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <EcoTaskLogo light />
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
              Making environmental participation easier, one task at a time.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-white/65">
            {NAV_LINKS.map((link) => (
              <button key={link.id} onClick={() => scrollToSection(link.id)} className="transition hover:text-green-400">
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-[1200px] flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <span>© 2026 EcoTask. All rights reserved.</span>
          <button onClick={onAdmin} className="flex items-center gap-1.5 transition hover:text-green-400">
            <ShieldCheck size={13} />
            Admin Portal
          </button>
        </div>
      </footer>
    </div>
  );
}


/* =========================================================
   REGISTRATION SUCCESS
========================================================= */

function RegistrationSubmitted({ onBack }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black">

      <div className="absolute inset-0">
        <img
          src={volunteer}
          alt="Volunteers helping the environment"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-[#00150d]/95 via-[#00351f]/80 to-[#002417]/60" />

      <div className="relative z-20 mx-6 w-full max-w-md rounded-xl bg-white px-8 py-9 text-center shadow-2xl">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-500">
          <Check
            size={34}
            strokeWidth={2}
            className="text-green-500"
          />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-[#215b36]">
          Registration Submitted!
        </h2>

        <p className="mt-4 text-sm leading-6 text-gray-700">
          Your volunteer account has been successfully registered.
        </p>

        <p className="mt-3 text-sm leading-6 text-gray-700">
          You can now log in to your EcoTask account.
        </p>

        <button
          onClick={onBack}
          className="mt-7 w-full rounded-lg bg-green-500 px-6 py-3 text-sm font-bold text-black transition hover:bg-green-400 active:scale-95"
        >
          Back to Login
        </button>

      </div>
    </div>
  );
}


/* =========================================================
   ORGANIZER APPLICATION SUBMITTED
========================================================= */

function OrganizerSubmitted({ onBack }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black">

      <div className="absolute inset-0">
        <img
          src={volunteer}
          alt="Volunteers helping the environment"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-[#00150d]/95 via-[#00351f]/80 to-[#002417]/60" />

      <div className="relative z-20 mx-6 w-full max-w-md rounded-xl bg-white px-8 py-9 text-center shadow-2xl">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-50">
          <Hourglass size={30} className="text-amber-500" />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-[#215b36]">
          Application Submitted!
        </h2>

        <p className="mt-4 text-sm leading-6 text-gray-700">
          Your organizer account and documents were sent to the EcoTask admin for review.
        </p>

        <p className="mt-3 text-sm leading-6 text-gray-700">
          You can log in anytime to check your status. You'll be able to post activities once the admin approves your account.
        </p>

        <button
          onClick={onBack}
          className="mt-7 w-full rounded-lg bg-green-500 px-6 py-3 text-sm font-bold text-black transition hover:bg-green-400 active:scale-95"
        >
          Go to Organizer Login
        </button>

      </div>
    </div>
  );
}


/* =========================================================
   MAIN APP
========================================================= */

/* =========================================================
   REMEMBER THE CURRENT PAGE (survives a browser refresh)
========================================================= */

const PAGE_KEY = "ecotaskPage";
const RESET_FROM_KEY = "ecotaskResetFrom";

// Dashboards need a saved login; without one, refresh goes to the landing page.
const DASHBOARD_AUTH = {
  dashboard: "userInfo",
  admin: "adminInfo",
  organizer: "organizerInfo",
};

const isLoggedIn = (storageKey) => {
  try {
    return Boolean(JSON.parse(localStorage.getItem(storageKey) || "{}").token);
  } catch {
    return false;
  }
};

const getInitialPage = () => {
  let saved = "";
  try { saved = sessionStorage.getItem(PAGE_KEY) || ""; } catch { /* private mode */ }
  if (!saved) return "landing";
  const authKey = DASHBOARD_AUTH[saved];
  if (authKey && !isLoggedIn(authKey)) return "landing";
  return saved;
};

const readResetFrom = () => {
  try { return sessionStorage.getItem(RESET_FROM_KEY) || "login"; } catch { return "login"; }
};

/* =========================================================
   PAGE TRANSITION CURTAIN
========================================================= */

const CURTAIN_IN_MS = 420;
const CURTAIN_OUT_MS = 480;

function PageCurtain({ phase }) {
  return (
    <div
      aria-hidden="true"
      className={`ecotask-curtain ecotask-curtain-${phase} fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#00140d] via-[#075f2b] to-[#16a34a]`}
    >
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-green-400/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="ecotask-curtain-logo relative flex flex-col items-center gap-4">
        <EcoTaskLogo light />
        <Leaf className="ecotask-curtain-leaf text-green-300" size={26} />
      </div>
    </div>
  );
}


/* =========================================================
   LOGOUT CARD
   Small card on the landing page after logging out.
   Closes itself after LOGOUT_CARD_MS (the green bar shows
   the time left) or with the X.
========================================================= */

const LOGOUT_CARD_MS = 6000;

function LogoutCard({ name, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, LOGOUT_CARD_MS);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="ecotask-toast-enter fixed left-1/2 top-20 z-[60] w-[min(470px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-green-200 bg-white text-gray-900 shadow-[0_18px_40px_rgba(4,33,15,0.25)]"
    >
      <div className="flex items-start gap-3.5 p-4 pr-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
          <CheckCircle2 size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold">You've logged out</p>
          <p className="mt-0.5 text-[13px] leading-5 text-gray-600 [overflow-wrap:anywhere]">
            {name ? `See you next time, ${name}! ` : "See you next time! "}
            Your account is safely signed out on this device.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>
      <div className="h-1 bg-green-50">
        <div className="ecotask-toast-timer h-full bg-green-500" style={{ animationDuration: `${LOGOUT_CARD_MS}ms` }} />
      </div>
    </div>
  );
}

// Name for the goodbye message, read before the login info is deleted.
const readLogoutName = (storageKey) => {
  try {
    const info = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (storageKey === "userInfo") return String(info.name || "").trim().split(/\s+/)[0] || "";
    if (storageKey === "organizerInfo") return info.organizationName || info.name || "";
    return info.name || "";
  } catch {
    return "";
  }
};


function App() {
  const [page, setPage] = useState(getInitialPage);
  // Shown on the landing page right after logging out: { name } or null.
  const [logoutNotice, setLogoutNotice] = useState(null);
  const closeLogoutNotice = useCallback(() => setLogoutNotice(null), []);

  // Save the page every time it changes, so a refresh reopens it.
  useEffect(() => {
    try { sessionStorage.setItem(PAGE_KEY, page); } catch { /* private mode */ }
  }, [page]);

  // Page transition: a green curtain slides up, the page switches behind it,
  // then the curtain slides away. phase: null | "in" | "out"
  const [curtain, setCurtain] = useState(null);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const goTo = (next) => {
    if (next === page) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || curtain) {
      setPage(next);
      window.scrollTo(0, 0);
      return;
    }
    setCurtain("in");
    timers.current.push(setTimeout(() => {
      setPage(next);
      window.scrollTo(0, 0);
      setCurtain("out");
    }, CURTAIN_IN_MS));
    timers.current.push(setTimeout(() => setCurtain(null), CURTAIN_IN_MS + CURTAIN_OUT_MS));
  };
  const [userEmail, setUserEmail] = useState("");

  // Forgot password: the code confirmed on "Check Your Email",
  // passed to the Reset Password page.
  const [resetCode, setResetCode] = useState("");

  // Which login page started "Forgot Password" ("login" or "organizer-login"),
  // so the reset pages send the user back to the right one.
  const [resetFrom, setResetFrom] = useState(readResetFrom);

  useEffect(() => {
    try { sessionStorage.setItem(RESET_FROM_KEY, resetFrom); } catch { /* private mode */ }
  }, [resetFrom]);

  // Log out: delete the saved token so it can't be reused, go home,
  // and show the "You've logged out" card once the page has switched.
  const logout = (storageKey) => {
    const name = readLogoutName(storageKey);
    localStorage.removeItem(storageKey);
    setLogoutNotice(null);
    goTo("landing");
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const delay = reduceMotion ? 0 : CURTAIN_IN_MS + CURTAIN_OUT_MS;
    timers.current.push(setTimeout(() => setLogoutNotice({ name }), delay));
  };

  const logoutVolunteer = () => logout("userInfo");
  const logoutAdmin = () => logout("adminInfo");
  const logoutOrganizer = () => logout("organizerInfo");

  const content = (() => {
  /* ORGANIZER PAGES */

  if (page === "organizer-login") {
    return (
      <OrganizerLogin
        onBack={() => goTo("landing")}
        onRegister={() => goTo("organizer-register")}
        onLogin={() => goTo("organizer")}
        onForgotPassword={() => {
          setResetFrom("organizer-login");
          goTo("forgot-password");
        }}
      />
    );
  }

  if (page === "organizer-register") {
    return (
      <OrganizerRegister
        onBack={() => goTo("landing")}
        onLogin={() => goTo("organizer-login")}
        onRegistered={() => goTo("organizer-submitted")}
      />
    );
  }

  if (page === "organizer-submitted") {
    return <OrganizerSubmitted onBack={() => goTo("organizer-login")} />;
  }

  if (page === "organizer") {
    return <OrganizerDashboard onLogout={logoutOrganizer} />;
  }

  /* USER DASHBOARD */

  if (page === "dashboard") {
    return <UserDashboard onLogout={logoutVolunteer} />;
  }


  /* ADMIN LOGIN */

  if (page === "admin-login") {
    return (
      <AdminLogin
        onBack={() => {
          goTo("landing");
        }}
        onAdminLogin={() => {
          goTo("admin");
        }}
        onForgotPassword={() => {
          setResetFrom("admin-login");
          goTo("forgot-password");
        }}
      />
    );
  }


  /* ADMIN DASHBOARD */

  if (page === "admin") {
    return (
      <AdminDashboard
        onLogout={logoutAdmin}
      />
    );
  }


  /* LOGIN */

  if (page === "login") {
    return (
      <Login
        onBack={() => {
          goTo("landing");
        }}
        onRegister={() => {
          goTo("register");
        }}
        onLogin={() => {
          goTo("dashboard");
        }}
        onForgotPassword={() => {
          setResetFrom("login");
          goTo("forgot-password");
        }}
      />
    );
  }


  /* REGISTER */

  if (page === "register") {
    return (
      <Register
        onBack={() => {
          goTo("landing");
        }}
        onLogin={() => {
          goTo("login");
        }}
        onRegister={() => {
          goTo("registration-submitted");
        }}
      />
    );
  }

  /* REGISTRATION SUCCESS */

  if (page === "registration-submitted") {
    return (
      <RegistrationSubmitted
        onBack={() => {
          goTo("login");
        }}
      />
    );
  }


  /* FORGOT PASSWORD */

  if (page === "forgot-password") {
    return (
      <ForgotPassword
        onBack={() => {
          goTo(resetFrom);
        }}
        onSendCode={(email) => {
          setUserEmail(email);
          setResetCode("");
          goTo("verification-code");
        }}
      />
    );
  }


  /* VERIFICATION CODE (checks the code with the server) */

  if (page === "verification-code") {
    return (
      <VerifyResetCode
        email={userEmail}
        onBack={() => {
          goTo("forgot-password");
        }}
        onVerified={(code) => {
          setResetCode(code);
          goTo("reset-password");
        }}
      />
    );
  }


  /* RESET PASSWORD (only asks for the new password) */

  if (page === "reset-password") {
    return (
      <ResetPassword
        email={userEmail}
        code={resetCode}
        onBack={() => {
          goTo("verification-code");
        }}
        onResetSuccess={() => {
          setResetCode("");
          goTo("password-success");
        }}
      />
    );
  }


  /* PASSWORD RESET SUCCESS */

  if (page === "password-success") {
    return (
      <PasswordResetSuccess
        onBackToLogin={() => {
          goTo(resetFrom);
        }}
      />
    );
  }


  /* LANDING PAGE */

  return (
    <LandingPage
      onGetStarted={() => {
        goTo("register");
      }}
      onLogin={() => {
        goTo("login");
      }}
      onAdmin={() => {
        goTo("admin-login");
      }}
      onOrganizer={() => {
        goTo("organizer-login");
      }}
      onOrganizerRegister={() => {
        goTo("organizer-register");
      }}
    />
  );
  })();

  return (
    <>
      <div key={page} className="ecotask-route-fade">
        {content}
      </div>
      {page === "landing" && logoutNotice && (
        <LogoutCard name={logoutNotice.name} onClose={closeLogoutNotice} />
      )}
      {curtain && <PageCurtain phase={curtain} />}
    </>
  );
}


export default App;
