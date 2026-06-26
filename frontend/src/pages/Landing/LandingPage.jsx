import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineChevronDown,
  HiOutlineClock,
  HiOutlineCode,
  HiOutlineDeviceMobile,
  HiOutlineGlobeAlt,
  HiOutlineLightningBolt,
  HiOutlineMail,
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlineShare,
  HiOutlineSparkles,
  HiOutlineTerminal,
} from 'react-icons/hi';
import './LandingPage.css';

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Languages', href: '#languages' },
  { label: 'Playground', href: '#playground' },
  { label: 'Docs', href: '#docs' },
];

const AI_AUTH_PATH = '/login?redirect=/compiler&ai=1';
const AI_COMPILER_PATH = '/compiler?ai=1';

const languages = [
  { name: 'Python', speed: 'Ready in 0.12s', accent: 'coral', snippet: 'print("focus")' },
  { name: 'C', speed: 'Ready in 0.18s', accent: 'sage', snippet: 'printf("steady");' },
  { name: 'C++', speed: 'Ready in 0.21s', accent: 'lavender', snippet: 'cout << "build";' },
  { name: 'Java', speed: 'Ready in 0.34s', accent: 'coral', snippet: 'System.out.println();' },
  { name: 'JavaScript', speed: 'Ready in 0.09s', accent: 'sage', snippet: 'console.log("calm");' },
];

const features = [
  {
    title: 'Instant execution',
    text: 'Run code quickly with a clean console that keeps output easy to scan.',
    icon: HiOutlineLightningBolt,
    tone: 'coral',
  },
  {
    title: 'Syntax highlighting',
    text: 'A Monaco-inspired editor surface for readable, language-aware code.',
    icon: HiOutlineCode,
    tone: 'lavender',
  },
  {
    title: 'AI Assistant',
    text: 'Get guided help for generating, debugging, explaining, and improving code after signing in.',
    icon: HiOutlineSparkles,
    tone: 'sage',
    href: AI_AUTH_PATH,
    requiresAuth: true,
  },
  {
    title: 'Save code history',
    text: 'Return to earlier attempts without rebuilding your flow from memory.',
    icon: HiOutlineClock,
    tone: 'sage',
  },
  {
    title: 'Mobile coding support',
    text: 'Write, run, and review snippets from a compact interface on the go.',
    icon: HiOutlineDeviceMobile,
    tone: 'coral',
  },
  {
    title: 'Share snippets',
    text: 'Copy and share working examples for study sessions, classes, or reviews.',
    icon: HiOutlineShare,
    tone: 'lavender',
  },
];

const steps = [
  {
    title: 'Write your code',
    text: 'Pick a language and settle into a focused editor.',
  },
  {
    title: 'Compile instantly',
    text: 'Run your program and keep the feedback loop light.',
  },
  {
    title: 'Run and share',
    text: 'Review output, save history, and pass snippets along.',
  },
];

const testimonials = [
  {
    quote: 'Finally an online compiler that feels peaceful to use.',
    name: 'Aarav, CS student',
    rotate: 'left',
  },
  {
    quote: 'Coding here feels less stressful.',
    name: 'Mira, bootcamp learner',
    rotate: 'right',
  },
  {
    quote: 'Perfect for students and beginners.',
    name: 'Dev, lab mentor',
    rotate: 'left',
  },
];

const faqs = [
  {
    question: 'Which languages does CompileX support?',
    answer: 'CompileX supports Python, C, C++, Java, and JavaScript, with a workspace designed for fast switching between languages.',
  },
  {
    question: 'Can I use CompileX on mobile?',
    answer: 'Yes. The interface is mobile-first, so you can write, run, and review code from smaller screens without losing the essentials.',
  },
  {
    question: 'Does CompileX save my code?',
    answer: 'CompileX keeps your current editor state locally and can save run history when you are signed in.',
  },
  {
    question: 'Is the compiler good for beginners?',
    answer: 'Yes. The interface keeps output, input, and language controls simple so learners can focus on code instead of setup.',
  },
];

function useRevealOnScroll() {
  useEffect(() => {
    const items = document.querySelectorAll('[data-reveal]');

    if (!('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);
}

function Logo() {
  return (
    <Link to="/" className="landing-logo" aria-label="CompileX home">
      <span className="landing-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="img">
          <path d="M7 8.5 10.5 12 7 15.5" />
          <path d="M13 16h4" />
        </svg>
      </span>
      <span>CompileX</span>
    </Link>
  );
}

function SectionHeading({ eyebrow, title, handwritten, text }) {
  return (
    <div className="section-heading" data-reveal>
      <p className="section-eyebrow">{eyebrow}</p>
      <h2>
        {title}
        {handwritten && <span className="handwritten"> {handwritten}</span>}
      </h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function EditorPreview() {
  return (
    <div className="browser-preview" data-reveal>
      <div className="browser-topbar">
        <div className="window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="browser-pill">compilex.app/playground</div>
      </div>
      <div className="browser-grid">
        <div className="preview-editor">
          <div className="preview-tabs">
            <span className="active">main.py</span>
            <span>input.txt</span>
          </div>
          <pre>
            <code>{`def greet(name):
    mood = "calm"
    return f"Hello {name}, stay {mood}."

print(greet("developer"))`}</code>
          </pre>
        </div>
        <div className="preview-console">
          <div className="console-header">
            <span>Output</span>
            <span className="status-dot">success</span>
          </div>
          <div className="console-output">
            <p>Hello developer, stay calm.</p>
            <p>Process finished in 0.12s</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LanguageCard({ language }) {
  return (
    <article className={`language-card accent-${language.accent}`} data-reveal>
      <div>
        <span>{language.speed}</span>
        <code>{language.snippet}</code>
      </div>
      <h3>{language.name}</h3>
    </article>
  );
}

function FeatureCard({ feature, index }) {
  const Icon = feature.icon;
  const CardTag = feature.href ? Link : 'article';
  const linkProps = feature.href
    ? { to: feature.href, 'aria-label': `${feature.title}: ${feature.text}` }
    : {};

  return (
    <CardTag
      className={`feature-card tone-${feature.tone} feature-${index + 1} ${feature.href ? 'feature-link-card' : ''}`}
      data-reveal
      {...linkProps}
    >
      <div className="feature-icon">
        <Icon />
      </div>
      <h3>{feature.title}</h3>
      <p>{feature.text}</p>
    </CardTag>
  );
}

function CompilerPhone({ variant = 'main' }) {
  return (
    <div className={`phone-mockup phone-${variant}`} data-reveal>
      <div className="phone-speaker" />
      <div className="phone-screen">
        <div className="phone-tabs">
          <span className="active">Python</span>
          <span>C++</span>
          <span>JS</span>
        </div>
        <div className="phone-editor">
          <span className="line muted">1</span>
          <span className="code keyword">def</span>
          <span className="code"> focus():</span>
          <span className="line muted">2</span>
          <span className="code indent">return "ready"</span>
          <span className="line muted">3</span>
          <span className="code cursor">print(focus())</span>
        </div>
        <button className="phone-run" type="button">
          <HiOutlinePlay />
          Run Code
        </button>
        <div className="phone-console">
          <span>Console</span>
          <p>ready</p>
          <small>0.12s runtime</small>
        </div>
        <label className="phone-input">
          <span>Input</span>
          <input value="student" readOnly />
        </label>
      </div>
    </div>
  );
}

function FAQItem({ item, open, onToggle }) {
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button type="button" onClick={onToggle} aria-expanded={open}>
        <span>{item.question}</span>
        <HiOutlinePlus />
      </button>
      <div className="faq-answer">
        <p>{item.answer}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(0);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const aiFeatureHref = user ? AI_COMPILER_PATH : AI_AUTH_PATH;

  useRevealOnScroll();

  const setCompilerTheme = () => {
    try {
      localStorage.setItem('compilex-theme', 'soft-focus');
    } catch {
      // Ignore storage failures in restricted browsers.
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail('');
  };

  return (
    <main className="landing-page">
      <div className="landing-grain" aria-hidden="true" />
      <div className="ambient-blob blob-coral" aria-hidden="true" />
      <div className="ambient-blob blob-lavender" aria-hidden="true" />

      <nav className="landing-nav" aria-label="Primary navigation">
        <Logo />
        <div className="landing-nav-links" aria-label="Landing sections">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <Link className="landing-nav-cta" to="/compiler" onClick={setCompilerTheme}>
          Start Coding
        </Link>
      </nav>

      <section className="hero-section" id="top">
        <div className="hero-content" data-reveal>
          <span className="hero-badge">
            <HiOutlineSparkles />
            Now supporting 5 languages
          </span>
          <h1>
            Compile and run code in a <span className="handwritten">calmer</span>, smarter way.
          </h1>
          <p>
            A lightweight online compiler designed for focused coding, instant execution, and
            distraction-free learning.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/compiler" onClick={setCompilerTheme}>
              <HiOutlineTerminal />
              Launch Compiler
            </Link>
            <a className="button button-secondary" href="#features">
              See Features
              <HiOutlineChevronDown />
            </a>
          </div>
        </div>
        <EditorPreview />
      </section>

      <section className="landing-section languages-section" id="languages">
        <SectionHeading
          eyebrow="Supported languages"
          title="Five familiar runtimes, one peaceful workspace."
          text="Start from the language you already know, then switch contexts without breaking concentration."
        />
        <div className="language-scroll" aria-label="Supported languages">
          {languages.map((language) => (
            <LanguageCard key={language.name} language={language} />
          ))}
        </div>
      </section>

      <section className="landing-section features-section" id="features">
        <SectionHeading
          eyebrow="Soft productivity"
          title="All the practical tools, without the noise."
          handwritten="Focus"
          text="CompileX keeps the essentials close: code, run controls, output, history, sharing, and signed-in AI help."
        />
        <div className="feature-grid">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              feature={feature.requiresAuth ? { ...feature, href: aiFeatureHref } : feature}
              index={index}
            />
          ))}
        </div>
      </section>

      <section className="landing-section playground-section" id="playground">
        <SectionHeading
          eyebrow="Live playground preview"
          title="A compiler that feels designed for your hands."
          text="The coding surface is compact, readable, and ready for real input and output."
        />
        <div className="phone-stage">
          <CompilerPhone variant="side sage" />
          <CompilerPhone variant="main" />
          <CompilerPhone variant="side lavender" />
        </div>
      </section>

      <section className="landing-section flow-section">
        <SectionHeading
          eyebrow="How it works"
          title="A small loop for better coding momentum."
          text="Write, run, understand, repeat. CompileX keeps the rhythm simple."
        />
        <div className="step-flow">
          {steps.map((step, index) => (
            <article className="step-card" key={step.title} data-reveal>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section testimonials-section">
        <SectionHeading
          eyebrow="Community notes"
          title="A softer place to practice."
          text="For learners, mentors, and builders who want their tools to feel a little more human."
        />
        <div className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <article className={`testimonial-card rotate-${testimonial.rotate}`} key={testimonial.name} data-reveal>
              <p>"{testimonial.quote}"</p>
              <span>{testimonial.name}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section faq-section" id="docs">
        <SectionHeading
          eyebrow="FAQ"
          title="A few calm answers before you start."
          text="Everything here is tuned for quick experiments and steady learning."
        />
        <div className="faq-panel" data-reveal>
          {faqs.map((item, index) => (
            <FAQItem
              key={item.question}
              item={item}
              open={activeFaq === index}
              onToggle={() => setActiveFaq(activeFaq === index ? -1 : index)}
            />
          ))}
        </div>
      </section>

      <section className="final-cta-section">
        <div className="cta-blob cta-coral" aria-hidden="true" />
        <div className="cta-blob cta-sage" aria-hidden="true" />
        <div className="final-cta-content" data-reveal>
          <span className="section-eyebrow">Ready when you are</span>
          <h2>Your browser can feel like home for coding.</h2>
          <p>Start writing and running code instantly with CompileX.</p>
          <form className="waitlist-form" onSubmit={handleSubmit}>
            <label htmlFor="waitlist-email" className="sr-only">
              Email address
            </label>
            <HiOutlineMail aria-hidden="true" />
            <input
              id="waitlist-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setSubmitted(false);
              }}
              required
            />
            <button type="submit">Join</button>
          </form>
          {submitted && <p className="form-note">You are on the list. Welcome to the quiet workspace.</p>}
        </div>
      </section>

      <footer className="landing-footer">
        <Logo />
        <div className="footer-links">
          <a href="#features">Product</a>
          <a href="#languages">Languages</a>
          <a href="#docs">Docs</a>
          <a href="mailto:hello@compilex.dev">Contact</a>
        </div>
        <div className="footer-status">
          <HiOutlineGlobeAlt />
          <span>Built for focused coding sessions</span>
        </div>
      </footer>
    </main>
  );
}
