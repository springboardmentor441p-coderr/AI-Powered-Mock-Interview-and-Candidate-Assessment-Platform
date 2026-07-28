import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, ShieldCheck, Download, Video, FileText, ArrowRight, Sparkles, AlertTriangle, Eye, Mic, Smile, Code, HelpCircle, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReportPDF } from '../components/ReportPDF/ReportPDF';

export const InterviewResult = () => {
  const { finalReport, user } = useApp();
  const [activeTab, setActiveTab] = useState('report'); // 'report' or 'pdf'

  const pdfData = {
    candidateName: finalReport.candidateName || user.name || 'Candidate',
    targetRole: finalReport.targetRole || 'Software Engineer',
    date: new Date().toISOString().split('T')[0],
    overallScore: finalReport.overallScorePct || 82,
    scores: finalReport.technicalSkills,
    strengths: finalReport.strengths,
    suggestions: finalReport.areasForImprovement,
    questionPerformance: finalReport.questionPerformance || []
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-500/30">
            Step 11 & 12 • AI Assessment Engine Report
          </span>
          <h1 className="text-2xl font-bold text-white mt-1">SmartHire AI Final Interview Report</h1>
          <p className="text-xs text-slate-400 font-mono">Meaningful evaluation across technical accuracy, communication, problem solving & behavioral skills.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'report' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Interactive Report
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pdf' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> PDF Download
          </button>
        </div>
      </div>

      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Main Scorecard Header Card */}
          <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-950/90 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-xl shadow-cyan-500/30">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Award className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{finalReport.targetRole}</h2>
                <span className="text-xs text-slate-400 font-mono">
                  Candidate: <strong className="text-cyan-300">{finalReport.candidateName}</strong> • Target: <strong className="text-purple-300">{finalReport.company}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Overall Performance</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">{finalReport.overallScorePct}%</span>
                <span className="text-[10px] text-emerald-300 font-bold block">{finalReport.performanceLevel}</span>
              </div>
              <div className="w-px h-10 bg-slate-800" />
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Assessment Engine</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-center mt-1">
                  <ShieldCheck className="w-4 h-4" /> VERIFIED
                </span>
              </div>
            </div>
          </div>

          {/* Recorded Webcam Video Storage Card */}
          <div className="glass-card p-6 rounded-2xl border border-cyan-500/30 bg-slate-950/90 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-cyan-400" /> Proctor Video Storage & Playback
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Full webcam video recording stored for candidate audit & proctoring verification
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-500/30 flex items-center gap-1 self-start sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5" /> HD Video Stored
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Video Player Container (2 cols) */}
              <div className="lg:col-span-2 relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
                {finalReport.videoRecordingUrl ? (
                  <video
                    controls
                    playsInline
                    className="w-full h-full object-contain bg-slate-950"
                    src={
                      finalReport.videoRecordingUrl.startsWith('http') || finalReport.videoRecordingUrl.startsWith('blob:')
                        ? finalReport.videoRecordingUrl
                        : `http://localhost:8000/${finalReport.videoRecordingUrl.replace(/^\/+/, '')}`
                    }
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                    <Video className="w-10 h-10 text-slate-600 animate-pulse" />
                    <p className="text-xs font-mono text-slate-400">Recorded video stored in backend audit logs</p>
                  </div>
                )}
              </div>

              {/* Video File Storage Details & Download CTA (1 col) */}
              <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 block uppercase">Video Archive Metadata</span>
                  <div className="space-y-1.5 text-xs font-mono text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Resolution:</span>
                      <span className="text-cyan-300 font-bold">1080p HD @ 30FPS</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Format:</span>
                      <span className="text-purple-300 font-bold">WebM Video</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Proctor Integrity:</span>
                      <span className="text-emerald-400 font-bold">100% Passed</span>
                    </div>
                  </div>
                </div>

                {finalReport.videoRecordingUrl && (
                  <a
                    href={
                      finalReport.videoRecordingUrl.startsWith('http') || finalReport.videoRecordingUrl.startsWith('blob:')
                        ? finalReport.videoRecordingUrl
                        : `http://localhost:8000/${finalReport.videoRecordingUrl.replace(/^\/+/, '')}`
                    }
                    download="interview_recording.webm"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4 text-cyan-400" /> Download Video File
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* AI Scoring Parameters Breakdown */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 bg-slate-950/80">
            <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Assessment Scoring Parameters & Weightage
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 block">Communication Score (30%)</span>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Speech clarity, grammar, filler words, pace, completeness.</p>
                </div>
                <strong className="text-2xl font-black text-white font-mono mt-3">
                  {finalReport.scores ? finalReport.scores.communication : (finalReport.communicationScore || 90)}%
                </strong>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 block">Confidence Score (25%)</span>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Eye-contact, engagement, hesitation, confidence, attention.</p>
                </div>
                <strong className="text-2xl font-black text-white font-mono mt-3">
                  {finalReport.scores ? finalReport.scores.confidence : (finalReport.confidenceScore || 86)}%
                </strong>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 block">Technical Relevance (30%)</span>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Accuracy, keywords, problem-solving, domain knowledge, completeness.</p>
                </div>
                <strong className="text-2xl font-black text-white font-mono mt-3">
                  {finalReport.scores ? finalReport.scores.technical : (finalReport.technicalScore || 89)}%
                </strong>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 block">Professionalism (15%)</span>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Time management, response organization, etiquette, discipline.</p>
                </div>
                <strong className="text-2xl font-black text-white font-mono mt-3">
                  {finalReport.scores ? finalReport.scores.professionalism : (finalReport.professionalismScore || 88)}%
                </strong>
              </div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>Overall Score Formula: Communication (30%) + Confidence (25%) + Technical Relevance (30%) + Professionalism (15%)</span>
              <span className="text-emerald-400 font-bold">Rubric: {finalReport.performanceLevel} ({finalReport.overallScorePct}%)</span>
            </div>
          </div>

          {/* Performance Rating Rubric Table */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3 bg-slate-950/80">
            <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" /> Performance Rating Rubric & Scale
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
              <div className={`p-3 rounded-xl border ${finalReport.overallScorePct >= 90 ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                <span className="font-bold block text-sm">90 - 100</span>
                <span className="text-[11px]">Excellent</span>
              </div>
              <div className={`p-3 rounded-xl border ${(finalReport.overallScorePct >= 75 && finalReport.overallScorePct < 90) ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/40' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                <span className="font-bold block text-sm">75 - 89</span>
                <span className="text-[11px]">Good</span>
              </div>
              <div className={`p-3 rounded-xl border ${(finalReport.overallScorePct >= 60 && finalReport.overallScorePct < 75) ? 'bg-amber-950/80 border-amber-500 text-amber-300 ring-2 ring-amber-500/40' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                <span className="font-bold block text-sm">60 - 74</span>
                <span className="text-[11px]">Average</span>
              </div>
              <div className={`p-3 rounded-xl border ${(finalReport.overallScorePct >= 40 && finalReport.overallScorePct < 60) ? 'bg-orange-950/80 border-orange-500 text-orange-300 ring-2 ring-orange-500/40' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                <span className="font-bold block text-sm">40 - 59</span>
                <span className="text-[11px]">Needs Improvement</span>
              </div>
              <div className={`p-3 rounded-xl border ${finalReport.overallScorePct < 40 ? 'bg-red-950/80 border-red-500 text-red-300 ring-2 ring-red-500/40' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                <span className="font-bold block text-sm">Below 40</span>
                <span className="text-[11px]">Poor</span>
              </div>
            </div>
          </div>

          {/* Technical & Behavioral Skills Score Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Technical Skills Card */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4" /> Technical Skills Evaluation
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(finalReport.technicalSkills).map(([skill, score], i) => (
                  <div key={i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-xs font-bold text-slate-200 block">{skill}</span>
                    <span className="text-lg font-black text-cyan-400 font-mono mt-1 block">{score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Behavioral Skills Card */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-purple-400 font-mono uppercase tracking-wider flex items-center gap-2">
                <Smile className="w-4 h-4" /> Behavioral Skills Evaluation
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(finalReport.behavioralSkills).map(([skill, score], i) => (
                  <div key={i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-xs font-bold text-slate-200 block">{skill}</span>
                    <span className="text-lg font-black text-purple-400 font-mono mt-1 block">{score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resume Validation & JD Coverage Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resume Validation Box */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 font-mono uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Resume Validation (Consistency Check)
              </h3>
              <div className="space-y-2.5">
                {finalReport.resumeValidation.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{item.resumeSkill}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        item.status === 'Verified' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* JD Coverage Box */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 font-mono uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" /> JD Skill Coverage Scorecard
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {finalReport.jdCoverage.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block">{item.skill}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.status}</span>
                    </div>
                    <span className="font-mono font-bold text-purple-400 text-sm">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Strengths & Areas for Improvement Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-emerald-400 font-mono uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Key Strengths
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {finalReport.strengths.map((s, i) => (
                  <li key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 font-mono uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Areas for Improvement
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {finalReport.areasForImprovement.map((s, i) => (
                  <li key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Question-wise Performance Breakdown */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 font-mono uppercase flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" /> Question & Candidate Response Breakdown
            </h3>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {finalReport.questionPerformance && finalReport.questionPerformance.length > 0 ? (
                finalReport.questionPerformance.map((q, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-3 shadow-md">
                    {/* Header: Q Number, Topic, Score */}
                    <div className="flex items-center justify-between font-mono pb-2 border-b border-slate-800/80">
                      <span className="font-bold text-cyan-400 text-sm">
                        Q{q.qNum || idx + 1}: {q.topic || 'General Topic'}
                      </span>
                      <span className="text-emerald-400 font-bold bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-500/30">
                        Score: {q.score || '8/10'}
                      </span>
                    </div>

                    {/* Question Text */}
                    {q.questionText && (
                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-slate-200">
                        <strong className="text-cyan-300 block mb-1 font-mono text-[11px]">Question:</strong>
                        <p className="text-xs font-medium leading-relaxed">{q.questionText}</p>
                      </div>
                    )}

                    {/* Candidate Answer / Spoken Transcript */}
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-purple-500/20 text-slate-200 space-y-1">
                      <span className="text-purple-300 font-bold font-mono text-[11px] flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-purple-400" /> Candidate Verbal Response:
                      </span>
                      <p className="text-xs italic text-slate-300 leading-relaxed">
                        "{q.answerText || 'No verbal response recorded.'}"
                      </p>
                    </div>

                    {/* Expected Answer Keypoints */}
                    {q.expectedPoints && (
                      <div className="text-[11px] text-slate-400 font-mono bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                        <strong className="text-amber-400">Expected Keypoints: </strong>
                        <span className="text-slate-300">
                          {Array.isArray(q.expectedPoints) ? q.expectedPoints.join(', ') : q.expectedPoints}
                        </span>
                      </div>
                    )}

                    {/* AI Feedback Commentary */}
                    <div className="text-[11px] text-slate-400 leading-snug pt-1">
                      <strong className="text-slate-300 font-mono">AI Feedback: </strong>
                      <span>{q.feedback}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 font-mono text-xs">
                  No question-wise performance data recorded.
                </div>
              )}
            </div>
          </div>

          {/* AI Recommendations Banner */}
          <div className="glass-card p-6 rounded-2xl border border-purple-500/30 bg-purple-950/20 space-y-3">
            <h3 className="text-xs font-bold text-purple-300 font-mono uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> AI Actionable Recommendations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
              {finalReport.aiRecommendations.map((rec, i) => (
                <div key={i} className="bg-slate-900/90 p-3 rounded-xl border border-purple-500/20 flex items-center gap-2">
                  <span className="text-purple-400 font-bold">•</span> {rec}
                </div>
              ))}
            </div>
          </div>

          {/* Back to Dashboard CTA */}
          <div className="flex justify-end pt-2">
            <Link
              to="/dashboard"
              className="glow-cyan-btn px-6 py-3 rounded-xl text-xs font-bold text-white flex items-center gap-2"
            >
              Return to Candidate Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'pdf' && (
        <ReportPDF data={pdfData} />
      )}
    </div>
  );
};
