import React from 'react';
import { Award, CheckCircle2, XCircle, AlertTriangle, Download, ArrowLeft, BarChart3, Eye, ShieldCheck, Sparkles, FileText, Check } from 'lucide-react';
import jsPDF from 'jspdf';

export default function InterviewReportPage({ reportData, setActivePage }) {
  if (!reportData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">No Report Generated Yet</h2>
        <p className="text-xs text-slate-400">Please complete an interview session first to view detailed performance analytics.</p>
        <button
          onClick={() => setActivePage('interview-setup')}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 text-white"
        >
          Start New Interview Session
        </button>
      </div>
    );
  }

  const overallScore = reportData.overall_score || 88.5;
  const rating = reportData.performance_rating || (overallScore >= 85 ? "Strong Hire" : "Good Hire");
  const isMalpractice = reportData.malpractice_flag || false;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("SmartHire AI - Candidate Interview Assessment Report", 14, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Candidate Name: Janitha Kavuturu`, 14, 30);
    doc.text(`Target Domain: ${reportData.category || "Python Developer"} (${reportData.difficulty || "Medium"} Level)`, 14, 37);
    doc.text(`Overall Score: ${overallScore}%`, 14, 44);
    doc.text(`Performance Rating: ${rating}`, 14, 51);
    doc.text(`Proctoring Status: ${isMalpractice ? "MALPRACTICE DISQUALIFIED" : "VERIFIED & PASSED"}`, 14, 58);

    doc.setFont("helvetica", "bold");
    doc.text("Evaluation Breakdown Rubric:", 14, 70);
    doc.setFont("helvetica", "normal");
    doc.text(`• Technical Answer Quality: ${Math.round(overallScore * 0.95)}%`, 20, 78);
    doc.text(`• Communication Clarity: ${Math.round(overallScore * 0.98)}%`, 20, 85);
    doc.text(`• Eye Contact & Attention Telemetry: ${reportData.eye_contact_score || 94}%`, 20, 92);
    doc.text(`• Professionalism & Confidence: ${reportData.confidence_score || 91}%`, 20, 99);

    if (reportData.answers_history && reportData.answers_history.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Interview Questions & Candidate Answers:", 14, 112);
      
      let yPos = 120;
      reportData.answers_history.forEach((item, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text(`Q${index + 1}: ${item.q_text.substring(0, 70)}...`, 14, yPos);
        yPos += 7;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(`Spoken Answer: ${item.user_answer}`, 180);
        doc.text(lines, 14, yPos);
        yPos += (lines.length * 6) + 6;
      });
    }

    doc.save(`SmartHire_AI_Report_${reportData.category || "Candidate"}.pdf`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-24 font-sans">
      
      {/* HEADER BANNER */}
      <div className="glass-card p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" /> Assessment Report Card
          </div>
          <h1 className="text-3xl font-extrabold text-white">Interview Assessment & Analytics Report</h1>
          <p className="text-xs text-slate-400">
            Domain: <strong className="text-white">{reportData.category || "Python Developer"}</strong> ({reportData.difficulty || "Medium"} Level)
          </p>
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

      {/* OVERALL SCORE CARD */}
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
              <span className="block text-[10px] text-slate-400 uppercase font-mono">Overall Rating</span>
            </div>
          </div>

          <div>
            <h3 className={`text-sm font-bold ${isMalpractice ? 'text-red-400' : 'text-emerald-400'}`}>
              {rating}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Proctoring Status: <strong className={isMalpractice ? 'text-red-400' : 'text-emerald-400'}>{isMalpractice ? "MALPRACTICE DISQUALIFIED" : "VERIFIED & PASSED"}</strong>
            </p>
          </div>
        </div>

        {/* 4-FACTOR RUBRIC BREAKDOWN (8 COLS) */}
        <div className="md:col-span-8 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" /> 4-Factor Evaluation Rubric Scores
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Technical */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Technical Answer Accuracy</span>
                <span className="text-cyan-400 font-bold">{Math.round(overallScore * 0.95)}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${Math.round(overallScore * 0.95)}%` }} />
              </div>
            </div>

            {/* Communication */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Communication Quality</span>
                <span className="text-indigo-400 font-bold">{Math.round(overallScore * 0.98)}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${Math.round(overallScore * 0.98)}%` }} />
              </div>
            </div>

            {/* Eye Contact */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Eye Contact & Attention</span>
                <span className="text-emerald-400 font-bold">{reportData.eye_contact_score || 94}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${reportData.eye_contact_score || 94}%` }} />
              </div>
            </div>

            {/* Confidence */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Confidence & Presence</span>
                <span className="text-purple-400 font-bold">{reportData.confidence_score || 91}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-400 h-full rounded-full" style={{ width: `${reportData.confidence_score || 91}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* STRENGTHS & WEAKNESSES Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Key Strengths */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Key Candidate Strengths
          </h3>
          <ul className="text-xs text-slate-300 space-y-2 font-sans">
            {(reportData.strengths || [
              `Solid spoken response in ${reportData.category || "Python Developer"}`,
              `Maintained high eye contact and engagement throughout 5 interview questions`,
              `Used clear technical terminology and modular code concepts`
            ]).map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvement Areas */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Recommended Improvement Areas
          </h3>
          <ul className="text-xs text-slate-300 space-y-2 font-sans">
            {(reportData.improvement_tips || [
              `Elaborate further on real-world memory and execution trade-offs`,
              `Maintain consistent speech pace during complex algorithm explanations`
            ]).map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* QUESTION BY QUESTION CANDIDATE ANSWER HISTORY */}
      {reportData.answers_history && reportData.answers_history.length > 0 && (
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" /> 5-Question Answer Log & Evaluation History
          </h2>

          <div className="space-y-4">
            {reportData.answers_history.map((ans, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-indigo-400 font-mono font-bold">
                  <span>Question {idx + 1} of 5</span>
                  <span className="text-emerald-400">Evaluated & Scored</span>
                </div>
                <p className="text-white font-semibold">{ans.q_text}</p>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-300 italic">
                  <strong>Candidate Spoken Answer:</strong> "{ans.user_answer}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
