import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import HeroCanvas from '../components/HeroCanvas.jsx';
import SEO from '../components/SEO.jsx';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.2, 0.7, 0.2, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const features = [
  {
    title: 'Mentorship that fits your life',
    desc: 'Book sessions with mentors who have walked your exact path — filter by field, availability, and price.',
    tag: 'Mentorship',
  },
  {
    title: 'A marketplace built for makers',
    desc: 'Sell courses, digital products, handmade goods, or services — no middleman, your pricing.',
    tag: 'Marketplace',
  },
  {
    title: 'Success stories that inspire action',
    desc: 'Real journeys, categorized by field, so you can see exactly how someone got where you want to go.',
    tag: 'Stories',
  },
  {
    title: 'Communities that actually engage',
    desc: 'Small, moderated circles with posts, polls, and pinned resources — not another noisy feed.',
    tag: 'Community',
  },
  {
    title: 'Honest reviews, before you commit',
    desc: 'Rate and read reviews on companies, courses, bootcamps, and scholarships from women who lived it.',
    tag: 'Reviews',
  },
  {
    title: 'An AI career coach, always on',
    desc: 'Skill-gap analysis, resume feedback, and a learning path tailored to where you want to go next.',
    tag: 'AI Guidance',
  },
];

const testimonials = [
  {
    quote: 'I found my co-founder in a PrernaNode community. We shipped our MVP in six weeks.',
    name: 'Farah Idris',
    role: 'Founder, Loop',
  },
  {
    quote: 'The AI coach flagged a skill gap I didn\u2019t know I had. Two months later I passed the interview.',
    name: 'Wren Sokolova',
    role: 'Staff Engineer',
  },
  {
    quote: 'My marketplace shop went from a hobby to my full income in under a year.',
    name: 'Chidinma Obi',
    role: 'Ceramicist',
  },
];

const Section = ({ id, className = '', children }) => (
  <section id={id} className={`relative py-28 px-6 ${className}`}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

const Landing = () => {
  return (
    <div className="overflow-x-hidden">
      <SEO
        title="PrernaNode — Connect. Inspire. Rise."
        description="Mentorship, marketplace, communities, and AI-powered career tools for women — all in one place."
        path="/"
      />
      {/* HERO */}
      <section className="relative h-screen min-h-[720px] flex items-center overflow-hidden">
        <HeroCanvas />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-mist dark:to-void pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="flex flex-col items-center"
          >
            <motion.span
              variants={fadeUp}
              className="font-mono text-xs tracking-[0.2em] uppercase text-cyan mb-5 flex items-center gap-2"
            >
              <span className="w-5 h-px bg-cyan inline-block" />
              A universe built for women who rise
            </motion.span>
            <motion.h1
              variants={fadeUp}
              className="font-display font-extrabold leading-[0.98] tracking-tight text-[clamp(40px,8vw,88px)] bg-clip-text text-transparent bg-gradient-to-b from-ink dark:from-white via-violet/80 to-violet dark:to-violet"
            >
              Your spark
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold via-magenta to-violet">
                is closer than you think
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-xl text-ink/60 dark:text-white/60 text-lg leading-relaxed"
            >
              Learn from mentors who&rsquo;ve walked the path, showcase what you&rsquo;ve built, sell what
              you create, and find the community that gets it. One constellation. A million women
              rising together.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-4 justify-center">
              <Link
                to="/register"
                className="bg-gradient-to-r from-gold to-magenta text-void font-semibold px-8 py-4 rounded-full shadow-lg shadow-gold/20 hover:-translate-y-0.5 transition-transform"
              >
                Join PrernaNode
              </Link>
              <a
                href="#features"
                className="border border-black/10 dark:border-white/15 px-8 py-4 rounded-full hover:border-cyan transition-colors"
              >
                Explore features
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ABOUT */}
      <Section id="about">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <motion.div variants={fadeUp}>
            <span className="font-mono text-xs uppercase tracking-widest text-cyan">About PrernaNode</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl mt-3 mb-5">
              One platform, every stage of the climb
            </h2>
            <p className="text-ink/60 dark:text-white/60 leading-relaxed">
              PrernaNode combines professional networking, mentorship, a maker marketplace, honest
              reviews, and AI-guided career coaching into a single space built exclusively for women.
              No fragmented tools, no cold networking — just a constellation of people already a few
              steps ahead of you, and a system that helps you catch up fast.
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
            {[
              ['128K+', 'Women connected'],
              ['9,400', 'Mentors live'],
              ['54', 'Communities'],
              ['12K+', 'Marketplace listings'],
            ].map(([stat, label]) => (
              <div key={label} className="glass rounded-2xl p-6 text-center">
                <div className="font-display font-bold text-2xl">{stat}</div>
                <div className="text-xs font-mono text-ink/40 dark:text-white/40 uppercase mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </Section>

      {/* FEATURES */}
      <Section id="features" className="bg-white/40 dark:bg-deep/40">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="max-w-xl mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-cyan">Features</span>
          <h2 className="font-display font-bold text-3xl md:text-4xl mt-3">Everything you need to rise, in one place</h2>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="glass rounded-2xl p-7 hover:-translate-y-1 transition-transform duration-300"
            >
              <span className="font-mono text-[10px] uppercase tracking-wide text-cyan">{f.tag}</span>
              <h3 className="font-display font-semibold text-lg mt-3 mb-2">{f.title}</h3>
              <p className="text-sm text-ink/55 dark:text-white/55 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* PRICING */}
      <Section id="pricing">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="glass rounded-3xl p-12 text-center max-w-2xl mx-auto"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-gold">Pricing — coming soon</span>
          <h2 className="font-display font-bold text-3xl mt-3 mb-4">Free while we're in early access</h2>
          <p className="text-ink/60 dark:text-white/60 leading-relaxed">
            Every feature is free during early access. We'll announce pricing tiers here well before
            anything changes for existing members.
          </p>
        </motion.div>
      </Section>

      {/* COMMUNITY */}
      <Section id="community" className="bg-white/40 dark:bg-deep/40">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} className="text-center max-w-xl mx-auto mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-cyan">Community</span>
          <h2 className="font-display font-bold text-3xl md:text-4xl mt-3">Find your orbit</h2>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={stagger}
          className="grid sm:grid-cols-2 md:grid-cols-3 gap-4"
        >
          {['Women in AI', 'Women in Web Dev', 'Women in Cybersecurity', 'Women in Medicine', 'Women in Finance', 'Women in Startups'].map(
            (name) => (
              <motion.div key={name} variants={fadeUp} className="glass rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan to-violet flex items-center justify-center font-display font-bold text-sm shrink-0">
                  {name.split(' ').slice(-1)[0].slice(0, 2)}
                </div>
                <span className="font-display font-medium text-sm">{name}</span>
              </motion.div>
            )
          )}
        </motion.div>
      </Section>

      {/* TESTIMONIALS */}
      <Section id="testimonials">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} className="text-center max-w-xl mx-auto mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-cyan">Testimonials</span>
          <h2 className="font-display font-bold text-3xl md:text-4xl mt-3">What women say after they rise</h2>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-6"
        >
          {testimonials.map((t) => (
            <motion.div key={t.name} variants={fadeUp} className="glass rounded-2xl p-7">
              <p className="text-sm leading-relaxed text-ink/70 dark:text-white/75">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 mt-5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-magenta" />
                <div>
                  <div className="font-display text-sm font-semibold">{t.name}</div>
                  <div className="font-mono text-[10px] text-ink/40 dark:text-white/40 uppercase">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* CTA */}
      <Section>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          className="text-center rounded-3xl py-20 px-6 relative overflow-hidden glass"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet/20 via-magenta/10 to-transparent pointer-events-none" />
          <div className="relative">
            <h2 className="font-display font-bold text-3xl md:text-5xl mb-5">Connect. Inspire. Rise.</h2>
            <p className="text-ink/60 dark:text-white/60 max-w-md mx-auto mb-8">
              Your constellation is waiting. It takes less than two minutes to join.
            </p>
            <Link
              to="/register"
              className="inline-block bg-gradient-to-r from-gold to-magenta text-void font-semibold px-9 py-4 rounded-full hover:-translate-y-0.5 transition-transform"
            >
              Create your free account
            </Link>
          </div>
        </motion.div>
      </Section>
    </div>
  );
};

export default Landing;
