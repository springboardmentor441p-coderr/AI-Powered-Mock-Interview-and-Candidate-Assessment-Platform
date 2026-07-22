import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, Mic, Eye, Brain, BarChart3, FileText, Shield, ChevronRight, Star, Zap, Target, Users,
} from 'lucide-react';

const features = [
  {
    icon: <Brain size={24} />,
    title: 'AI-Generated Questions',
    desc: 'Personalized interview questions tailored to your resume, skills, and target role.',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: <Mic size={24} />,
    title: 'Speech Analysis',
    desc: 'Real-time transcription with filler-word detection, grammar checking, and pace analysis.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: <Eye size={24} />,
    title: 'Eye-Contact Tracking',
    desc: 'MediaPipe-powered face tracking measures eye contact and engagement throughout your interview.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Detailed Scoring',
    desc: 'Weighted scoring across Communication, Confidence, Technical, and Professionalism dimensions.',
    color: 'from-rose-500 to-pink-500',
  },
  {
    icon: <FileText size={24} />,
    title: 'Smart Resume Parsing',
    desc: 'Upload your PDF resume and let AI extract skills, experience, and technologies automatically.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: <Shield size={24} />,
    title: 'Actionable Feedback',
    desc: 'AI-generated strengths, weaknesses, and improvement suggestions after every session.',
    color: 'from-cyan-500 to-sky-500',
  },
];

const steps = [
  { num: '01', title: 'Upload Resume', desc: 'Upload your PDF resume for AI-powered skill extraction and question personalization.' },
  { num: '02', title: 'Configure Interview', desc: 'Choose interview type, difficulty level, and target domain to customize your session.' },
  { num: '03', title: 'Practice Live', desc: 'Answer questions with webcam and mic on. AI tracks your speech, eye contact, and confidence.' },
  { num: '04', title: 'Get Your Report', desc: 'Receive a detailed analysis with scores, radar charts, and personalized improvement tips.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* ── Floating Background Orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] rounded-full bg-violet-500/[0.03] blur-[100px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <Sparkles size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">SmartHire AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
            <Zap size={14} className="text-indigo-400" />
            <span className="text-xs font-medium text-indigo-300 tracking-wide uppercase">AI-Powered Interview Platform</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            <span className="text-slate-100">Ace Your Next</span>
            <br />
            <span className="gradient-text">Interview with AI</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 leading-relaxed mb-10">
            Practice with AI-generated interviews, get real-time speech analysis, eye-contact tracking,
            and personalized feedback to boost your interview confidence.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-base font-semibold shadow-xl shadow-indigo-500/25 transition-all flex items-center gap-2"
            >
              Start Practicing Free <ChevronRight size={18} />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-base font-medium transition-all"
            >
              I Already Have an Account
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap justify-center gap-6 mt-14 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-indigo-400" />
              <span>For <strong className="text-slate-300">Candidates</strong>, <strong className="text-slate-300">Recruiters</strong> & <strong className="text-slate-300">Institutes</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Target size={16} className="text-emerald-400" />
              <span>HR · Technical · Behavioral · Aptitude</span>
            </div>
            <div className="flex items-center gap-2">
              <Star size={16} className="text-amber-400" />
              <span>AI-Powered Scoring & Feedback</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features Grid ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need to <span className="gradient-text">Prepare</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            A complete interview preparation platform powered by artificial intelligence and real-time monitoring.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card-hover p-7 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Four simple steps from resume upload to detailed performance analysis.
          </p>
        </motion.div>

        <div className="space-y-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card p-6 flex items-center gap-6"
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/20 flex items-center justify-center">
                <span className="text-xl font-bold gradient-text">{s.num}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-1">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-emerald-600/20" />
          <div className="relative glass-card border-indigo-500/20 p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to <span className="gradient-text">Transform</span> Your Interview Skills?
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto mb-8">
              Join candidates using SmartHire AI to practice, improve, and land their dream jobs.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-base font-semibold shadow-xl shadow-indigo-500/25 transition-all"
            >
              <Sparkles size={18} /> Get Started — It's Free
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-slate-800/50 py-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} SmartHire AI. AI-powered interview preparation platform.</p>
      </footer>
    </div>
  );
}
