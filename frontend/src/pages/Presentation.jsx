import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Printer,
  Sparkles,
  ShieldCheck,
  Cpu,
  Video,
  FileText,
  Award,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Camera,
  Bot,
  Brain,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Play
} from 'lucide-react';

export const Presentation = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides = [
    // Slide 1: Cover Slide
    {
      id: 1,
      tag: "Project Keynote Presentation",
      title: "Smart AI — Autonomous Mock Interview & Candidate Assessment Platform",
      subtitle: "End-to-End Virtual Technical Interviewer with Zero-Latency Voice Synthesis, Vision AI Proctoring & Instant LLM Candidate Scoring",
      type: "cover",
      metrics: [
        { label: "AI Presenter", val: "Advika (Female Voice)" },
        { label: "Vision Proctoring", val: "MediaPipe + COCO-SSD" },
        { label: "Speech Engine", val: "0ms Latency Web Speech" },
        { label: "Backend", val: "FastAPI + Python + LLM" }
      ]
    },
    // Slide 2: Problem Statement
    {
      id: 2,
      tag: "Market Needs & Challenge",
      title: "Traditional Technical Recruiting Bottlenecks",
      subtitle: "Why conventional screening interviews fail to scale in modern remote hiring environments",
      type: "problem",
      points: [
        {
          icon: Clock,
          title: "Engineering Time Drain",
          desc: "Senior developers spend 15+ hours per week conducting repetitive screening interviews instead of shipping core product features."
        },
        {
          icon: AlertTriangle,
          title: "Unconscious Bias & Subjectivity",
          desc: "Human interviewers vary in grading strictness, leading to inconsistent candidate evaluation standards across teams."
        },
        {
          icon: Eye,
          title: "Remote Interview Integrity Risks",
          desc: "High rates of tab switching, secondary monitors, mobile phone usage, and proxy candidates in unproctored remote calls."
        },
        {
          icon: FileText,
          title: "Delayed Feedback & Manual Reporting",
          desc: "Assembling evaluation scorecards takes days, delaying hiring decisions and creating poor candidate experience."
        }
      ]
    },
    // Slide 3: Executive Solution
    {
      id: 3,
      tag: "The Smart AI Solution",
      title: "Autonomous Virtual AI Interviewer & Assessment Engine",
      subtitle: "A fully automated, 24/7 technical screening platform powered by conversational & computer vision AI",
      type: "solution",
      features: [
        {
          icon: Bot,
          title: "Advika AI Presenter",
          desc: "Interactive female presenter speaking questions hands-free with natural pitch modulation and zero artificial latency."
        },
        {
          icon: ShieldCheck,
          title: "AI Proctoring Shield",
          desc: "MediaPipe 468-point 3D facial landmark mesh + TensorFlow COCO-SSD real-time mobile phone object detection."
        },
        {
          icon: Brain,
          title: "Adaptive Probing Engine",
          desc: "Background LLM analysis that dynamically generates follow-up questions when skill gaps are identified."
        },
        {
          icon: Award,
          title: "Automated Candidate Scorecard",
          desc: "Instant question-by-question scoring, resume claim validation, job capability mapping, and downloadable PDF reports."
        }
      ]
    },
    // Slide 4: System Architecture
    {
      id: 4,
      tag: "Technical Architecture",
      title: "End-to-End System Integration Flow",
      subtitle: "Decoupled React frontend + FastAPI backend + local browser ML inference",
      type: "architecture",
      components: [
        { name: "React 18 Frontend", role: "Vite SPA, TailwindCSS, State Management & Canvas Rendering" },
        { name: "Web Speech Engine", role: "Hands-free speech synthesis (`Advika`) & continuous speech recognition" },
        { name: "Browser ML Pipeline", role: "MediaPipe Face Mesh (4-face detection) + TensorFlow COCO-SSD (Phone detection)" },
        { name: "FastAPI REST Server", role: "Uvicorn ASGI backend handling session persistence, LLM evaluation & video uploads" },
        { name: "LLM Scoring Engine", role: "Groq / OpenAI async API evaluation against Resume & Job Description criteria" },
        { name: "Proctor Media Archive", role: "Full-length 1080p WebM video recording storage with instant browser playback" }
      ]
    },
    // Slide 5: Voice Synthesis Engine
    {
      id: 5,
      tag: "Conversational Core",
      title: "Advika: Instant Female AI Presenter Engine",
      subtitle: "Optimized speech synthesis & recognition pipeline engineered for 0ms voice latency",
      type: "voice",
      details: [
        { title: "Exclusive Female Voice Target", text: "Filtered voice selection prioritizing Zira, Samantha, Jenny, and Eva while strictly eliminating male system voices." },
        { title: "Snappy Conversational Cadence", text: "Speech rate tuned to 1.05 with pitch at 1.35 for crisp, natural, energetic female presenter delivery." },
        { title: "Non-Blocking Speech Recognition", text: "Microphone reactivates 0ms after AI finishes speaking, using 220ms silence detection for instant response." },
        { title: "Hands-Free Voice Commands", text: "Natural voice navigation handling 'next', 'I'm done', 'that's it', 'repeat question', and 'end session'." }
      ]
    },
    // Slide 6: Vision AI Proctoring
    {
      id: 6,
      tag: "Security & Integrity",
      title: "Real-Time Vision AI Proctoring Shield",
      subtitle: "Browser-side computer vision tracking candidate behavior without uploading raw video streams",
      type: "proctoring",
      items: [
        { label: "Multi-Face Detection", desc: "Monitors frame for 2+ people; triggers instant warning or auto-disqualification." },
        { label: "Mobile Phone AI Detector", desc: "TensorFlow COCO-SSD object model running at 300ms intervals flags cell phones & gadgets." },
        { label: "Eye Gaze & Head Pose", desc: "Tracks head pitch/yaw/roll and alerts candidate on sustained off-camera gaze (>20 frames)." },
        { label: "Fullscreen & Tab Lockdown", desc: "Enforces proctored lockdown; tab switching or exiting fullscreen assigns 0.0/10 (0%) score." }
      ]
    },
    // Slide 7: Non-Blocking Evaluation
    {
      id: 7,
      tag: "Performance & Responsiveness",
      title: "Asynchronous LLM Candidate Evaluation",
      subtitle: "High-speed background candidate evaluation pipeline preventing UI bottlenecks",
      type: "performance",
      metrics: [
        { name: "Question Transition Latency", val: "0ms", desc: "Next question presents instantly without waiting for backend API roundtrips" },
        { name: "Background Answer Evaluation", val: "Async", desc: "FastAPI processes LLM candidate answer grading non-blockingly" },
        { name: "Silence Detection Window", val: "220ms", desc: "Candidate pauses trigger instant speech processing" },
        { name: "Auto Disqualification Score", val: "0.0 / 10", desc: "Security violations lock final report to 0% with clear audit reason" }
      ]
    },
    // Slide 8: Video & Media Archiving
    {
      id: 8,
      tag: "Evidence & Auditability",
      title: "Recorded Proctor Video Archive & Playback",
      subtitle: "Full-length 1080p WebM recording stored safely in backend server storage",
      type: "media",
      features: [
        "Unified WebM MediaStream combining candidate 720p webcam feed + crisp microphone audio",
        "Automatic background chunk upload (`/api/v1/interview/upload-recording/{session_id}`)",
        "Direct HTML5 video player integration on assessment results page with seek & speed controls",
        "One-click Download Video File button for recruiter archive & legal compliance audits"
      ]
    },
    // Slide 9: Candidate Scorecard
    {
      id: 9,
      tag: "Reporting & Insights",
      title: "Automated Candidate Scorecard & PDF Report Engine",
      subtitle: "Multi-dimensional candidate assessment across skills, integrity, and job fit",
      type: "reporting",
      sections: [
        { name: "Overall Score & Performance Level", desc: "0.0 to 10.0 quantitative rating with status badge (Strong / Competent / Disqualified)" },
        { name: "Category Skill Breakdown", desc: "Technical Skills, System Architecture, Communication, Behavioral, and Resume Knowledge" },
        { name: "Question-by-Question Review", desc: "Displays exact asked questions, candidate verbal response transcripts, and AI feedback" },
        { name: "Resume & JD Validation Matrix", desc: "Verifies candidate resume claims against spoken interview evidence and job criteria" }
      ]
    },
    // Slide 10: Complete Tech Stack
    {
      id: 10,
      tag: "Technology Stack",
      title: "Production Tech Stack & Framework Matrix",
      subtitle: "Built with modern, open, high-performance web and AI technologies",
      type: "stack",
      layers: [
        { category: "Frontend Core", tech: "React 18, Vite, React Router DOM v6, Context API, Lucide Icons" },
        { category: "Styling & Design System", tech: "Vanilla CSS Tokens, TailwindCSS, Glassmorphism UI, Responsive Grid" },
        { category: "Voice & Audio", tech: "Web Speech API (Synthesis & Recognition), Web Audio API, Pitch Modulation" },
        { category: "Computer Vision AI", tech: "MediaPipe Face Mesh (CDN), TensorFlow COCO-SSD (MobileNet v2), HTML5 Canvas" },
        { category: "Backend Engine", tech: "Python 3.10+, FastAPI, Uvicorn ASGI Server, Pydantic, SQLite & SQLAlchemy ORM" },
        { category: "LLM & AI Models", tech: "Groq / OpenAI API, Custom Dynamic Probing & Evaluation Prompt Engineering" }
      ]
    },
    // Slide 11: Business Impact & ROI
    {
      id: 11,
      tag: "Business Value",
      title: "Recruiting Efficiency & Business Impact",
      subtitle: "Quantifiable ROI for enterprise talent acquisition and engineering teams",
      type: "roi",
      stats: [
        { num: "80%", label: "Screening Time Saved", text: "Recruiters evaluate candidate reports in 3 minutes instead of 45-minute live calls" },
        { num: "10x", label: "Candidate Throughput", text: "Concurrently interview thousands of applicants 24/7 without calendar friction" },
        { num: "100%", label: "Standardized Grading", text: "Eliminates subjective interviewer bias through structured criteria prompts" },
        { num: "0", label: "Proctoring Blind Spots", text: "Continuous automated monitoring detects cheat attempts and impersonation" }
      ]
    },
    // Slide 12: Roadmap & Conclusion
    {
      id: 12,
      tag: "Future Vision",
      title: "Technical Roadmap & Closing Summary",
      subtitle: "Expanding autonomous candidate assessment into enterprise ecosystem",
      type: "roadmap",
      milestones: [
        { phase: "Phase 1 (Completed)", title: "Advika Voice Presenter, MediaPipe Proctoring, Dynamic Q&A, PDF Reports & WebM Video Storage" },
        { phase: "Phase 2 (Upcoming)", title: "Live Collaborative Code Editor Sandbox with real-time AST syntax & complexity scoring" },
        { phase: "Phase 3 (Enterprise)", title: "Native ATS Integration Plugins (Greenhouse, Lever, Workday) & SSO Authentication" },
        { phase: "Phase 4 (Global)", title: "Multi-Lingual Voice Support (Spanish, Hindi, German, Japanese) & Micro-Expression Sentiment" }
      ]
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-[#070A12] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header Bar */}
      <header className="px-6 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold font-mono">
            AI
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              Smart AI Interview Platform <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">Project Slide Deck Keynote • Slide {currentSlide + 1} of {slides.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Print Slide Deck / Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" /> Print PDF
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen (F)"}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            Launch Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Slide Viewer Canvas */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-[#070A12] via-[#0B0F1D] to-[#070A12]">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

        {/* Active Slide Card */}
        <div className="w-full max-w-5xl aspect-[16/9] min-h-[520px] bg-slate-950/90 border border-cyan-500/30 rounded-3xl p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden">
          
          {/* Top Slide Tag Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/90 px-3 py-1 rounded-full border border-cyan-500/30 uppercase tracking-wider font-bold">
              {slide.tag}
            </span>
            <span className="text-xs font-mono text-slate-500 font-bold">
              SLIDE {String(slide.id).padStart(2, '0')} / {slides.length}
            </span>
          </div>

          {/* Slide Main Content Body */}
          <div className="my-auto py-4 space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                {slide.title}
              </h2>
              <p className="text-xs md:text-sm text-slate-400 font-mono mt-1 max-w-3xl">
                {slide.subtitle}
              </p>
            </div>

            {/* Render Slide Types */}
            {slide.type === 'cover' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                {slide.metrics.map((m, i) => (
                  <div key={i} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
                    <span className="text-[11px] font-mono text-slate-400 uppercase block">{m.label}</span>
                    <span className="text-sm font-bold text-cyan-300 font-mono block">{m.val}</span>
                  </div>
                ))}
              </div>
            )}

            {slide.type === 'problem' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slide.points.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <div key={i} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-950 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-red-300 font-mono">{p.title}</h3>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {slide.type === 'solution' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slide.features.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="bg-slate-900/60 p-4 rounded-2xl border border-cyan-500/20 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-cyan-300 font-mono">{f.title}</h3>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {slide.type === 'architecture' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {slide.components.map((c, i) => (
                  <div key={i} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                    <span className="font-bold text-cyan-400 font-mono block">{i + 1}. {c.name}</span>
                    <p className="text-[11px] text-slate-400 leading-normal">{c.role}</p>
                  </div>
                ))}
              </div>
            )}

            {slide.type === 'voice' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slide.details.map((d, i) => (
                  <div key={i} className="bg-slate-900/60 p-4 rounded-2xl border border-purple-500/20 space-y-1">
                    <span className="text-xs font-bold text-purple-300 font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> {d.title}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{d.text}</p>
                  </div>
                ))}
              </div>
            )}

            {slide.type === 'proctoring' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {slide.items.map((it, i) => (
                  <div key={i} className="bg-slate-900/80 p-3.5 rounded-xl border border-amber-500/30 text-xs space-y-1">
                    <span className="font-bold text-amber-400 font-mono block text-[11px]">{it.label}</span>
                    <p className="text-[10px] text-slate-400 leading-snug">{it.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {slide.type === 'performance' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {slide.metrics.map((m, i) => (
                  <div key={i} className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30 text-center space-y-1">
                    <span className="text-2xl font-black text-emerald-400 font-mono block">{m.val}</span>
                    <span className="text-[11px] font-bold text-slate-200 block font-mono">{m.name}</span>
                    <p className="text-[10px] text-slate-400 leading-tight">{m.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {slide.type === 'media' && (
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                {slide.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            )}

            {slide.type === 'reporting' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slide.sections.map((sec, i) => (
                  <div key={i} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-cyan-300 font-mono block">{sec.name}</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{sec.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {slide.type === 'stack' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {slide.layers.map((l, i) => (
                  <div key={i} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
                    <strong className="text-cyan-400 font-mono block mb-0.5 text-[11px]">{l.category}:</strong>
                    <span className="text-slate-300 font-mono text-[11px]">{l.tech}</span>
                  </div>
                ))}
              </div>
            )}

            {slide.type === 'roi' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {slide.stats.map((st, i) => (
                  <div key={i} className="bg-slate-900/80 p-4 rounded-2xl border border-cyan-500/30 text-center space-y-1">
                    <span className="text-3xl font-black text-cyan-400 font-mono block">{st.num}</span>
                    <span className="text-xs font-bold text-white block font-mono">{st.label}</span>
                    <p className="text-[10px] text-slate-400 leading-tight">{st.text}</p>
                  </div>
                ))}
              </div>
            )}

            {slide.type === 'roadmap' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slide.milestones.map((m, i) => (
                  <div key={i} className="bg-slate-900/60 p-4 rounded-2xl border border-purple-500/30 space-y-1">
                    <span className="text-[10px] font-mono text-purple-400 uppercase font-bold block">{m.phase}</span>
                    <p className="text-xs text-slate-300 font-mono leading-relaxed">{m.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Footer Controls */}
          <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slides.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    currentSlide === idx ? 'bg-cyan-400 w-6' : 'bg-slate-700 hover:bg-slate-500'
                  }`}
                  title={`Go to Slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className={`p-2 rounded-xl border font-mono text-xs flex items-center gap-1 transition-all ${
                  currentSlide === 0
                    ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600'
                    : 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-cyan-300 cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                onClick={nextSlide}
                disabled={currentSlide === slides.length - 1}
                className={`px-4 py-2 rounded-xl font-bold font-mono text-xs flex items-center gap-1 transition-all ${
                  currentSlide === slides.length - 1
                    ? 'opacity-40 cursor-not-allowed border border-slate-800 bg-slate-900 text-slate-600'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-lg shadow-cyan-500/20'
                }`}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
