import React from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, FileText, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AssessmentResult = () => {
  const { assessmentResult } = useApp();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Result Overview Header */}
      <div className="glass-card rounded-2xl p-8 border border-purple-500/30 text-center space-y-4 bg-slate-950/90 relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 p-0.5 mx-auto shadow-xl shadow-purple-500/30">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Award className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black text-white">AI Skill Assessment Evaluation</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Automatic question verification & technical depth audit</p>
        </div>

        <div className="inline-flex items-center gap-6 bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 font-mono block">Overall Score</span>
            <span className="text-3xl font-black text-purple-400 font-mono">{assessmentResult.score}%</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-400 font-mono block">Completion Time</span>
            <span className="text-sm font-bold text-slate-200 font-mono">{assessmentResult.timeTaken}</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-400 font-mono block">Verification Status</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> PASSED
            </span>
          </div>
        </div>
      </div>

      {/* Question-wise Breakdown Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
          Question-Wise Score Audit
        </h2>

        <div className="space-y-3">
          {assessmentResult.breakdown.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-purple-950 text-purple-400 border border-purple-500/30 flex items-center justify-center font-mono text-xs font-bold">
                  Q{idx + 1}
                </span>
                <div>
                  <span className="text-xs font-bold text-white block">{item.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.type} Question</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-mono font-bold text-emerald-400">{item.score}% Score</span>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link
          to="/assessment"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 border border-slate-800 flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retake Assessment
        </Link>
        <Link
          to="/interview-setup"
          className="glow-cyan-btn px-6 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 cursor-pointer"
        >
          Proceed to Mock Interview <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
