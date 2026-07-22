import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../services/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, TrendingUp, AlertTriangle, Lightbulb, Loader2, Download, Calendar, Target, Gauge } from 'lucide-react';

export default function Report() {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/interview/${sessionId}/report`)
      .then(({ data }) => {
        setReport(data.report);
        setSession(data.session || null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load report'));
  }, [sessionId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-rose-400 font-medium">
        {error}
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-indigo-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="text-lg font-medium">Analyzing your performance...</p>
      </div>
    );
  }

  const chartData = [
    { subject: 'Communication', score: report.communicationScore, fullMark: 100 },
    { subject: 'Confidence', score: report.confidenceScore, fullMark: 100 },
    { subject: 'Technical', score: report.technicalScore, fullMark: 100 },
    { subject: 'Professionalism', score: report.professionalismScore, fullMark: 100 },
  ];

  const scoreCards = [
    { label: 'Communication', score: report.communicationScore, weight: '30%', color: 'from-blue-500 to-cyan-500' },
    { label: 'Confidence', score: report.confidenceScore, weight: '25%', color: 'from-violet-500 to-purple-500' },
    { label: 'Technical', score: report.technicalScore, weight: '30%', color: 'from-emerald-500 to-teal-500' },
    { label: 'Professionalism', score: report.professionalismScore, weight: '15%', color: 'from-amber-500 to-orange-500' },
  ];

  const ratingColors = {
    Excellent: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Good: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Average: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'Needs Improvement': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    Poor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };

  // Find dominant emotion across all responses
  let dominantEmotionStr = 'Neutral';
  if (session && session.responseIds) {
    const emotionTotals = {};
    session.responseIds.forEach(res => {
      if (res.visualMetrics && res.visualMetrics.emotionScores) {
        Object.entries(res.visualMetrics.emotionScores).forEach(([emotion, score]) => {
          emotionTotals[emotion] = (emotionTotals[emotion] || 0) + score;
        });
      }
    });
    
    let maxEmotion = '';
    let maxScore = 0;
    Object.entries(emotionTotals).forEach(([emotion, score]) => {
      if (score > maxScore) {
        maxScore = score;
        maxEmotion = emotion;
      }
    });
    
    if (maxEmotion) {
      dominantEmotionStr = maxEmotion.charAt(0).toUpperCase() + maxEmotion.slice(1);
    }
  }

  function handlePrint() {
    window.print();
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between mb-8 no-print"
        >
          <div>
            <h1 className="text-3xl font-bold gradient-text">
              Interview Analysis
            </h1>
            <p className="text-slate-400 mt-1">Detailed breakdown of your performance</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={16} /> Download PDF
            </button>
            <Link 
              to="/dashboard" 
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Dashboard
            </Link>
          </div>
        </motion.div>

        {/* Interview Metadata */}
        {session && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 mb-8 no-print"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm">
              <Target size={14} className="text-indigo-400" />
              <span className="text-slate-400">Type:</span>
              <span className="text-slate-200 capitalize font-medium">{session.type}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm">
              <Gauge size={14} className="text-emerald-400" />
              <span className="text-slate-400">Difficulty:</span>
              <span className="text-slate-200 capitalize font-medium">{session.difficulty}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm">
              <Calendar size={14} className="text-cyan-400" />
              <span className="text-slate-400">Date:</span>
              <span className="text-slate-200 font-medium">{new Date(report.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-slate-400">Primary Emotion:</span>
              <span className="text-slate-200 font-medium">{dominantEmotionStr}</span>
            </div>
          </motion.div>
        )}

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Top Row: Score + Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overall Score */}
            <motion.div variants={itemVariants} className="glass-card p-8 text-center relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-emerald-400" />
              <div className="mx-auto bg-emerald-400/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-emerald-400">
                <Award size={32} />
              </div>
              <p className="text-sm text-slate-400 mb-2 uppercase tracking-widest font-medium">Overall Score</p>
              <p className="text-7xl font-bold text-slate-100 mb-4">{Math.round(report.overallScore)}</p>
              <span className={`inline-block px-4 py-1.5 rounded-full font-semibold tracking-wide border ${ratingColors[report.rating] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                {report.rating}
              </span>
            </motion.div>

            {/* Radar Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-6 h-[400px]">
              <h3 className="text-slate-300 font-medium mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-400" /> Competency Breakdown
              </h3>
              <ResponsiveContainer width="100%" height="90%">
                <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 13 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                    itemStyle={{ color: '#34d399' }}
                  />
                  <Radar name="Score" dataKey="score" stroke="#34d399" strokeWidth={2} fill="#34d399" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Score Breakdown Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {scoreCards.map((card, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="glass-card p-5 text-center"
              >
                <div className={`w-full h-1.5 rounded-full bg-gradient-to-r ${card.color} mb-4`} />
                <p className="text-sm text-slate-400 mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-slate-100">{Math.round(card.score)}</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Weight: {card.weight}</p>
              </motion.div>
            ))}
          </div>

          {/* AI Feedback */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeedbackBlock 
              title="Strengths" 
              icon={<TrendingUp size={20} />} 
              items={report.strengths} 
              color="emerald" 
            />
            <FeedbackBlock 
              title="Weaknesses" 
              icon={<AlertTriangle size={20} />} 
              items={report.weaknesses} 
              color="rose" 
            />
            <FeedbackBlock 
              title="Suggestions" 
              icon={<Lightbulb size={20} />} 
              items={report.suggestions} 
              color="cyan" 
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FeedbackBlock({ title, icon, items, color }) {
  if (!items || items.length === 0) return null;

  const colorConfig = {
    emerald: {
      icon: 'text-emerald-400',
      iconBg: 'bg-emerald-400/10',
      border: 'border-emerald-500/20',
      marker: 'marker:text-emerald-500',
    },
    rose: {
      icon: 'text-rose-400',
      iconBg: 'bg-rose-400/10',
      border: 'border-rose-500/20',
      marker: 'marker:text-rose-500',
    },
    cyan: {
      icon: 'text-cyan-400',
      iconBg: 'bg-cyan-400/10',
      border: 'border-cyan-500/20',
      marker: 'marker:text-cyan-500',
    },
  };

  const c = colorConfig[color] || colorConfig.emerald;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 ${c.border}`}
    >
      <div className={`flex items-center gap-3 mb-5 pb-3 border-b border-slate-700/50 ${c.icon}`}>
        <div className={`p-2 rounded-lg ${c.iconBg}`}>{icon}</div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <ul className={`list-disc list-outside ml-4 space-y-3 text-slate-300 text-sm leading-relaxed ${c.marker}`}>
        {items.map((item, i) => (
          <li key={i} className="pl-1">{item}</li>
        ))}
      </ul>
    </motion.div>
  );
}
