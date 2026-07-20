import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Settings, 
  UserCheck, 
  PieChart, 
  ArrowRight, 
  Lock,
  Globe
} from 'lucide-react';

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="flex flex-col gap-24 py-16 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center text-center gap-6 py-12 md:py-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-bold text-xs tracking-wider uppercase mb-4"
        >
          <Lock className="h-3 w-3" /> Secure digital voting
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl text-white leading-tight"
        >
          The Secure Voting Platform <br />
          <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Built For Custom Elections
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="text-slate-400 text-lg md:text-xl max-w-2xl font-light"
        >
          Fully customizable candidates, structural row locking transactions, and instant visual analysis. Host any digital election from college boards to executive clubs.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 mt-8"
        >
          <Link 
            to="/register" 
            className="flex items-center justify-center gap-2 px-8 h-12 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-lg shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:translate-y-[-1px] transition-all"
          >
            <span>Get Started</span>
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
          <a 
            href="#features" 
            className="flex items-center justify-center px-8 h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg border border-white/10 transition-all hover:translate-y-[-1px]"
          >
            Learn More
          </a>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="flex flex-col gap-12 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
          <h2 className="text-3xl font-extrabold text-white">Full-Featured Security Architecture</h2>
          <p className="text-slate-400">Engineered with modern cryptographic concepts, ensuring election integrity, privacy, and speed.</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={itemVariants} className="glass-card p-6 rounded-xl flex flex-col gap-4">
            <div className="bg-brand-primary/20 p-3 rounded-lg border border-brand-primary/30 w-fit">
              <Settings className="h-6 w-6 text-brand-primary" />
            </div>
            <h3 className="text-lg font-bold text-white">Dynamic Configuration</h3>
            <p className="text-slate-400 text-sm font-light">Define custom schemas and toggle visual fields for candidates. Fits any election template dynamically.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card p-6 rounded-xl flex flex-col gap-4">
            <div className="bg-brand-secondary/20 p-3 rounded-lg border border-brand-secondary/30 w-fit">
              <ShieldCheck className="h-6 w-6 text-brand-secondary" />
            </div>
            <h3 className="text-lg font-bold text-white">Double-Vote Row Lock</h3>
            <p className="text-slate-400 text-sm font-light">Uses PostgreSQL transaction isolation locks blocking concurrent requests. Strict one-person-one-vote rules.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card p-6 rounded-xl flex flex-col gap-4">
            <div className="bg-brand-success/20 p-3 rounded-lg border border-brand-success/30 w-fit">
              <UserCheck className="h-6 w-6 text-brand-success" />
            </div>
            <h3 className="text-lg font-bold text-white">Voter Approvals</h3>
            <p className="text-slate-400 text-sm font-light">Email verification OTP tokens and administrative checks ensuring eligible voter registrations.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card p-6 rounded-xl flex flex-col gap-4">
            <div className="bg-brand-warning/20 p-3 rounded-lg border border-brand-warning/30 w-fit">
              <PieChart className="h-6 w-6 text-brand-warning" />
            </div>
            <h3 className="text-lg font-bold text-white">Live Results Analytics</h3>
            <p className="text-slate-400 text-sm font-light">Dynamic Bar and Pie rendering charts. Generate and download complete PDF and CSV voter tally reports.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="flex flex-col gap-12 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
          <h2 className="text-3xl font-extrabold text-white">How the Platform Works</h2>
          <p className="text-slate-400">A clean step-by-step voting layout designed for seamless user interaction.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 hidden md:block -z-10"></div>
          
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-brand-primary flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-brand-primary/20">1</div>
            <h4 className="text-base font-bold text-white">Register Profile</h4>
            <p className="text-slate-400 text-xs font-light max-w-[200px]">Sign up with basic details and verify your email via 6-digit OTP code.</p>
          </div>

          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-300 border border-white/5">2</div>
            <h4 className="text-base font-bold text-white">Access Elections</h4>
            <p className="text-slate-400 text-xs font-light max-w-[200px]">Enter active panels. If private, system validates eligibility requirements.</p>
          </div>

          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-300 border border-white/5">3</div>
            <h4 className="text-base font-bold text-white">Cast Vote</h4>
            <p className="text-slate-400 text-xs font-light max-w-[200px]">Compare candidate profiles rendering only active custom fields, and click Vote.</p>
          </div>

          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-300 border border-white/5">4</div>
            <h4 className="text-base font-bold text-white">Analyze Audit</h4>
            <p className="text-slate-400 text-xs font-light max-w-[200px]">Review live chart data and cryptographic logs for completed elections.</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="glass-panel p-8 md:p-12 rounded-2xl flex flex-col md:flex-row items-center gap-8 scroll-mt-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-secondary/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="flex-1 flex flex-col gap-4">
          <span className="text-brand-secondary font-bold text-xs tracking-wider uppercase">Open Audit Design</span>
          <h2 className="text-3xl font-extrabold text-white">Secure. Flexible. Trustworthy.</h2>
          <p className="text-slate-400 font-light leading-relaxed">
            SecureVote is designed to bridge the gap between simple, hardcoded ballot forms and overly complex government architectures. We provide a relational, fully normalized system where the database is dynamically structured. Toggling attributes creates a customized candidate creation form and card structure immediately, requiring zero code adjustments or migrations.
          </p>
        </div>
        <div className="flex-1 w-full bg-slate-950/40 p-6 rounded-xl border border-white/5">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="h-2 w-2 rounded-full bg-brand-primary mt-2"></div>
              <div>
                <h5 className="font-bold text-white text-sm">PostgreSQL Row Locks</h5>
                <p className="text-slate-400 text-xs font-light">Direct session blocking preventing voting race conditions.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-2 w-2 rounded-full bg-brand-primary mt-2"></div>
              <div>
                <h5 className="font-bold text-white text-sm">Security Audit Logs</h5>
                <p className="text-slate-400 text-xs font-light">Every action is tracked, noting IP addresses and user mappings.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-2 w-2 rounded-full bg-brand-primary mt-2"></div>
              <div>
                <h5 className="font-bold text-white text-sm">SMTP Verification Codes</h5>
                <p className="text-slate-400 text-xs font-light">OTP delivery safeguards account activation and reset credentials.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="flex flex-col gap-12 max-w-3xl mx-auto w-full scroll-mt-24">
        <div className="text-center flex flex-col gap-3">
          <h2 className="text-3xl font-extrabold text-white">Contact Our Team</h2>
          <p className="text-slate-400">Have questions about running private organizational elections? Get in touch.</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); alert('Message sent simulated!'); }} className="glass-panel p-8 rounded-xl flex flex-col gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Full Name</label>
              <input type="text" required className="glass-input h-10 px-3 rounded-lg text-sm" placeholder="John Doe" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Email Address</label>
              <input type="email" required className="glass-input h-10 px-3 rounded-lg text-sm" placeholder="john@example.com" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400">Message Description</label>
            <textarea required rows={4} className="glass-input p-3 rounded-lg text-sm resize-none" placeholder="Details about your election scope..."></textarea>
          </div>
          <button type="submit" className="h-11 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-lg text-sm transition-colors mt-2">
            Send Inquiry message
          </button>
        </form>
      </section>
    </div>
  );
}
