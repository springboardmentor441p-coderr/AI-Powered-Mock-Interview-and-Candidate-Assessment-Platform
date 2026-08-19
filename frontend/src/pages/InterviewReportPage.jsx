import React from 'react';
import { Award, CheckCircle2, XCircle, AlertTriangle, Download, ArrowLeft, BarChart3, Eye, ShieldCheck, Sparkles, FileText, Check, HelpCircle, User, Info } from 'lucide-react';
import jsPDF from 'jspdf';
import { getStoredUser } from '../services/api';

export default function InterviewReportPage({ reportData, finalReport, setActivePage, currentUser }) {
  const activeReport = reportData || finalReport;
  const user = currentUser || getStoredUser();

  if (!activeReport) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4 font-sans">
        <h2 className="text-xl font-bold text-white">No Interview Assessment Report Available</h2>
        <p className="text-xs text-slate-400">Please complete an interview session with Mira to generate your AI performance report.</p>
        <button
          onClick={() => setActivePage('interview-setup')}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 text-white shadow-lg"
        >
          Start Interview Session with Mira
        </button>
      </div>
    );
  }

  const history = activeReport.answers_history || [];
  const configuredQuestionsCount = activeReport.configured_question_count || activeReport.total_questions_count || history.length || 5;
  
  const answeredCount = activeReport.answered_questions_count !== undefined 
    ? activeReport.answered_questions_count 
    : history.filter(a => a.is_answered || (a.user_answer && a.user_answer !== "Not answered")).length;
    
  const unansweredCount = activeReport.unanswered_questions_count !== undefined 
    ? activeReport.unanswered_questions_count 
    : Math.max(0, configuredQuestionsCount - answeredCount);

  const overallScore = activeReport.overall_score !== undefined ? activeReport.overall_score : 0.0;
  const rating = activeReport.performance_rating || (overallScore >= 80 ? "Strong Hire" : (overallScore >= 60 ? "Passable Candidate" : "Needs Improvement"));
  const isMalpractice = activeReport.malpractice_flag || false;

  const candName = activeReport.candidate?.full_name || user?.full_name || "Candidate User";
  const candEmail = activeReport.candidate?.email || user?.email || "candidate@smarthire.ai";
  const candRole = activeReport.candidate?.role || user?.role || "Candidate";
  const endedReason = activeReport.ended_reason || activeReport.status || "completed";

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("SmartHire-AI - Candidate Interview Assessment Report", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Candidate Name: ${candName} (${candEmail})`, 14, 30);
    doc.text(`AI Interviewer: Mira`, 14, 37);
    doc.text(`Target Domain: ${activeReport.category || "Software Engineering"} (${activeReport.difficulty || "Medium"} Level)`, 14, 44);
    doc.text(`Overall Score: ${overallScore}%`, 14, 51);
    doc.text(`Performance Rating: ${rating}`, 14, 58);
    doc.text(`Questions Configured: ${configuredQuestionsCount} | Answered: ${answeredCount} | Unanswered: ${unansweredCount}`, 14, 65);
    doc.text(`Completion Status: ${endedReason}`, 14, 72);

    doc.setFont("helvetica", "bold");
    doc.text("Question-by-Question Detailed Assessment:", 14, 84);
    
    let yPos = 92;
    history.forEach((item, index) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`Q${index + 1}: ${item.q_text ? item.q_text.substring(0, 75) : ""}...`, 14, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.text(`Status: ${item.is_answered ? "Answered" : "Unanswered"} | Technical Score: ${item.technical_score || 0}%`, 14, yPos);
      yPos += 6;
      const lines = doc.splitTextToSize(`Candidate Answer: ${item.user_answer || "Not answered"}`, 180);
      doc.text(lines, 14, yPos);
      yPos += (lines.length * 5) + 6;
    });

    doc.save(`SmartHire_AI_Report_${candName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-24 font-sans">
      
      {/* HEADER BANNER WITH CANDIDATE PROFILE INFO */}
      <div className="glass-card p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" /> Official Mira Assessment Report
          </div>
          <h1 className="text-3xl font-extrabold text-white">AI Interview Assessment Report</h1>
          
          <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3 font-mono pt-1">
            <span>Candidate: <strong className="text-white">{candName}</strong></span>
            <span>• Email: <strong className="text-cyan-400">{candEmail}</strong></span>
            <span>• Domain: <strong className="text-white">{activeReport.category || "Software Engineering"}</strong> ({activeReport.difficulty || "Medium"} Level)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('interview-setup')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-800 text-slate-300 hover:text-white"
          >
            ← Retake Interview
          </button>
          
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg flex items-center gap-2 hover:scale-105 transition-all"
          >
            <Download className="w-4 h-4" /> Download PDF Report
          </button>
        </div>
      </div>

      {/* STATUS BANNERS */}
      {endedReason === "ended_by_candidate" ? (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-3 shadow-lg">
          <Info className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <strong className="block text-cyan-200">Completion Reason: Ended by Candidate</strong>
            <span>Interview ended by candidate before completing all questions. Recorded answers were evaluated.</span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong className="block text-emerald-200">Completion Reason: Completed Successfully</strong>
            <span>Interview completed all {configuredQuestionsCount} configured questions successfully.</span>
          </div>
        </div>
      )}

      {/* METRICS DASHBOARD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 block text-[11px]">Configured Question Count</span>
          <div className="text-lg font-bold text-indigo-400">{configuredQuestionsCount} Questions</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 block text-[11px]">Questions Answered</span>
          <div className="text-lg font-bold text-emerald-400">{answeredCount} of {configuredQuestionsCount}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 block text-[11px]">Questions Unanswered</span>
          <div className="text-lg font-bold text-amber-400">{unansweredCount} of {configuredQuestionsCount}</div>
        </div>
      </div>

      {/* OVERALL SCORE & SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* OVERALL SCORE GAUGES (4 COLS) */}
        <div className="md:col-span-4 glass-card p-6 rounded-3xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="72" cy="72" r="60" stroke="#1e293b" strokeWidth="12" fill="transparent" />
              <circle 
                cx="72" 
                cy="72" 
                r="60" 
                stroke={isMalpractice ? "#ef4444" : "#6366f1"} 
                strokeWidth="12" 
                fill="transparent" 
                strokeDasharray="377" 
                strokeDashoffset={377 - (377 * (overallScore / 100))} 
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold text-white font-mono">{overallScore}%</span>
              <span className="block text-[10px] text-slate-400 uppercase font-mono">Overall Score</span>
            </div>
          </div>

          <div>
            <h3 className={`text-sm font-bold ${isMalpractice ? 'text-red-400' : 'text-emerald-400'}`}>
              {rating}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Answered: <strong className="text-emerald-400">{answeredCount}</strong> | Unanswered: <strong className="text-amber-400">{unansweredCount}</strong>
            </p>
          </div>
        </div>

        {/* FACTOR RUBRIC BREAKDOWN (8 COLS) */}
        <div className="md:col-span-8 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" /> Evaluation Summary
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Technical Score */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Technical Performance</span>
                <span className="text-cyan-400 font-bold">{activeReport.technical_score !== undefined ? activeReport.technical_score : overallScore}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${activeReport.technical_score !== undefined ? activeReport.technical_score : overallScore}%` }} />
              </div>
            </div>

            {/* Communication Score */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Communication & Clarity</span>
                <span className="text-indigo-400 font-bold">{activeReport.communication_score !== undefined ? activeReport.communication_score : overallScore}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${activeReport.communication_score !== undefined ? activeReport.communication_score : overallScore}%` }} />
              </div>
            </div>

            {/* Questions Answered Stats */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Questions Answered</span>
                <span className="text-emerald-400 font-bold">{answeredCount} of {configuredQuestionsCount}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(answeredCount / max(configuredQuestionsCount, 1)) * 100}%` }} />
              </div>
            </div>

            {/* Questions Unanswered Stats */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Questions Unanswered</span>
                <span className="text-amber-400 font-bold">{unansweredCount} of {configuredQuestionsCount}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(unansweredCount / max(configuredQuestionsCount, 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* QUESTION-BY-QUESTION EVALUATION BREAKDOWN */}
      {history.length > 0 && (
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" /> Question-by-Question Evaluation Breakdown
          </h2>

          <div className="space-y-6">
            {history.map((item, idx) => {
              const isAns = item.is_answered || (item.user_answer && item.user_answer !== "Not answered");
              return (
                <div key={idx} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                  
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-indigo-400 font-bold text-xs">
                      Question {idx + 1} of {configuredQuestionsCount} • Skill Assessed: <span className="text-cyan-400">{item.skill_focus || activeReport.category || "Technical"}</span>
                    </span>

                    <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                      isAns 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      {isAns ? <CheckCircle2 className="w-3 h-3" /> : <HelpCircle className="w-3 h-3" />}
                      Status: {isAns ? "Answered" : "Unanswered"}
                    </span>
                  </div>

                  <p className="text-white font-semibold text-xs leading-relaxed">
                    {item.q_text}
                  </p>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-300 font-sans italic">
                    <span className="text-amber-400 font-mono not-italic font-bold block text-[11px] mb-1">Candidate Spoken Answer:</span>
                    "{item.user_answer || "Not answered"}"
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60 font-mono text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Technical Score:</span>{' '}
                      <strong className={isAns ? "text-cyan-400" : "text-slate-500"}>
                        {isAns ? `${item.technical_score || 80}%` : "0% (Unanswered)"}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Clarity Score:</span>{' '}
                      <strong className={isAns ? "text-indigo-400" : "text-slate-500"}>
                        {isAns ? `${item.clarity_score || 80}%` : "0% (Unanswered)"}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 md:col-span-1">
                      <span className="text-slate-400">Evaluation:</span>{' '}
                      <span className="text-slate-300 italic">{item.feedback || (isAns ? "Evaluated" : "Question skipped")}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

function max(a, b) {
  return a > b ? a : b;
}
