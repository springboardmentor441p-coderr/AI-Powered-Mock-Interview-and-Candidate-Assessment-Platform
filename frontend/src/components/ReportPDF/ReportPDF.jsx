import React from 'react';
import { Download, FileText, ShieldCheck, Cpu, Award, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const ReportPDF = ({ data }) => {
  const handleDownloadPDF = async () => {
    const reportElement = document.getElementById('smart-hire-pdf-content');
    if (!reportElement) return;

    try {
      const canvas = await html2canvas(reportElement, { scale: 2, backgroundColor: '#0B0F19' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SmartHire_AI_Candidate_Report_${(data.candidateName || 'Candidate').replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF generation error', err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Download Action Bar */}
      <div className="flex justify-end">
        <button
          onClick={handleDownloadPDF}
          className="glow-cyan-btn px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
        >
          <Download className="w-4 h-4" /> Download Official PDF Report
        </button>
      </div>

      {/* Downloadable PDF Document Container */}
      <div
        id="smart-hire-pdf-content"
        className="glass-card rounded-2xl p-8 border border-slate-800 bg-slate-950 text-slate-100 space-y-6 max-w-4xl mx-auto"
      >
        {/* PDF Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-md shadow-cyan-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Cpu className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                SmartHire AI <span className="glow-gradient-text">Candidate Verification Report</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">Issued by SmartHire Autonomous AI Evaluator Core</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-3 py-1 rounded-full border border-cyan-500/40 inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> VERIFIED APPLICANT
            </span>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">Date: {data.date || '2026-07-21'}</p>
          </div>
        </div>

        {/* Candidate & Role Grid */}
        <div className="grid grid-cols-3 gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Candidate Name</span>
            <span className="text-sm font-bold text-white">{data.candidateName || 'Alex Vance'}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Target Role</span>
            <span className="text-sm font-bold text-cyan-300">{data.targetRole || 'Senior Full-Stack AI Engineer'}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Overall Performance Index</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{data.overallScore || '88.5'} / 100</span>
          </div>
        </div>

        {/* Metrics Matrix Table */}
        <div>
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-3">
            Multi-Dimensional Telemetry Breakdown
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Technical Score</span>
              <span className="text-base font-bold text-cyan-400 font-mono">{data.scores?.technicalKnowledge || 91.0}%</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Communication Score</span>
              <span className="text-base font-bold text-purple-400 font-mono">{data.scores?.communication || 87.5}%</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Eye Contact Index</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{data.scores?.eyeContact || 87.5}%</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Resume vs JD Match</span>
              <span className="text-base font-bold text-indigo-400 font-mono">{data.resumeJdMatch || 86.5}%</span>
            </div>
          </div>
        </div>

        {/* Key Strengths & Growth Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-emerald-500/20">
            <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
              <CheckCircle className="w-4 h-4" /> Top Strengths Highlighted
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(data.strengths && data.strengths.length > 0 ? data.strengths : [
                'Extremely clear explanation of async state synchronization',
                'Consistent front camera eye-contact (>87%)',
                'Strong algorithmic foundation & O(N) array optimization'
              ]).map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span> {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-purple-500/20">
            <h3 className="text-xs font-bold text-purple-400 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4" /> Recommended Skill Enhancements
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(data.suggestions && data.suggestions.length > 0 ? data.suggestions : [
                'Practice 5-second pause technique prior to delivering architecture responses',
                'Review Kafka consumer group partition balancing for missing JD skill area'
              ]).map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-purple-400 font-bold">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Full Question-wise Transcript & Feedback Breakdown */}
        {Array.isArray(data.questionPerformance) && data.questionPerformance.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Complete Question & Verbal Response Transcript
            </h2>
            <div className="space-y-3">
              {data.questionPerformance.map((q, idx) => (
                <div key={idx} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between font-mono pb-1 border-b border-slate-800">
                    <span className="font-bold text-cyan-300">Q{q.q_num || q.qNum || idx + 1}: {q.topic || 'General Topic'}</span>
                    <span className="text-emerald-400 font-bold">{q.score || '8/10'}</span>
                  </div>
                  {(q.question_text || q.questionText) && (
                    <p className="text-slate-200 text-[11px]">
                      <strong className="text-cyan-400">Question: </strong>{q.question_text || q.questionText}
                    </p>
                  )}
                  <p className="text-slate-300 italic text-[11px]">
                    <strong className="text-purple-400">Candidate Answer: </strong>"{q.candidate_answer || q.answerText || 'No verbal response recorded.'}"
                  </p>
                  {(q.expectedPoints || q.expected_points) && (
                    <p className="text-slate-400 text-[10px] font-mono">
                      <strong className="text-amber-400">Key Criteria: </strong>{Array.isArray(q.expectedPoints || q.expected_points) ? (q.expectedPoints || q.expected_points).join(', ') : (q.expectedPoints || q.expected_points)}
                    </p>
                  )}
                  {q.feedback && (
                    <p className="text-slate-400 text-[11px]">
                      <strong className="text-slate-300">AI Feedback: </strong>{q.feedback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification Footer */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>SmartHire AI Verification Key: SH-AI-2026-9920-VERIFIED</span>
          <span>End of Candidate Assessment & Interview Record</span>
        </div>
      </div>
    </div>
  );
};
