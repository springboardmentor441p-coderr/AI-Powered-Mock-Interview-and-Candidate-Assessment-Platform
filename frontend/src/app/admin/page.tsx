'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SAMPLE_QUESTION_BANK } from '../../data/mockData';
import { Question, InterviewTrack, DifficultyLevel } from '../../types';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2
} from 'lucide-react';

export default function AdminPage() {
  const { reports } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'users' | 'ai-config'>('overview');
  
  const [questions, setQuestions] = useState<Question[]>(SAMPLE_QUESTION_BANK);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('All Tracks');

  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionTopic, setNewQuestionTopic] = useState('');
  const [newQuestionTrack, setNewQuestionTrack] = useState<InterviewTrack>('Technical');
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState<DifficultyLevel>('Hard');
  const [newQuestionIdealAnswer, setNewQuestionIdealAnswer] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const q: Question = {
      id: `q-custom-${Date.now()}`,
      track: newQuestionTrack,
      text: newQuestionText,
      topic: newQuestionTopic || 'Custom Architecture',
      difficulty: newQuestionDifficulty,
      expectedKeyPoints: ['Key trade-offs evaluated', 'Core concepts stated accurately'],
      idealAnswer: newQuestionIdealAnswer || 'Comprehensive ideal technical blueprint.'
    };

    setQuestions([q, ...questions]);
    setNewQuestionText('');
    setNewQuestionTopic('');
    setNewQuestionIdealAnswer('');
    setShowAddForm(false);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) || q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrack = selectedTrack === 'All Tracks' || q.track === selectedTrack;
    return matchesSearch && matchesTrack;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Admin Control & Question Bank</h1>
              <p className="text-xs text-slate-500">Manage questions, question templates, user audit logs, and AI parameters</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-xs font-bold border border-purple-200">
            Platform Engine Status: Healthy
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 text-xs font-bold shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'overview' ? 'bg-purple-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Platform Overview
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'questions' ? 'bg-purple-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Question Bank Manager ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'users' ? 'bg-purple-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            User Audit Logs
          </button>
        </div>

        {/* 1. Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Platform Users</span>
                <p className="text-2xl font-extrabold text-slate-900">1,420</p>
                <span className="text-[11px] text-[#059669] font-bold">+12% this month</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Mock Sessions Conducted</span>
                <p className="text-2xl font-extrabold text-slate-900">8,940</p>
                <span className="text-[11px] text-[#059669] font-bold">99.8% Completion Rate</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Avg Candidate Score</span>
                <p className="text-2xl font-extrabold text-[#059669]">84%</p>
                <span className="text-[11px] text-slate-500">Standard deviation 8.2</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Proctoring Flag Rate</span>
                <p className="text-2xl font-extrabold text-indigo-600">1.8%</p>
                <span className="text-[11px] text-slate-500 font-bold">Low malpractice rate</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Question Bank Manager */}
        {activeTab === 'questions' && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions by keyword or topic..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none"
                >
                  <option value="All Tracks">All Tracks</option>
                  <option value="Technical">Technical</option>
                  <option value="HR">HR</option>
                  <option value="System Design">System Design</option>
                  <option value="Coding">Coding</option>
                </select>

                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <form onSubmit={handleAddQuestion} className="p-5 rounded-2xl bg-purple-50 border border-purple-200 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-900">
                  Add New Interview Question Template
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Track</label>
                    <select
                      value={newQuestionTrack}
                      onChange={(e) => setNewQuestionTrack(e.target.value as InterviewTrack)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    >
                      <option value="Technical">Technical</option>
                      <option value="HR">HR</option>
                      <option value="System Design">System Design</option>
                      <option value="Coding">Coding</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Topic Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Distributed Consensus"
                      value={newQuestionTopic}
                      onChange={(e) => setNewQuestionTopic(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Difficulty</label>
                    <select
                      value={newQuestionDifficulty}
                      onChange={(e) => setNewQuestionDifficulty(e.target.value as DifficultyLevel)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="FAANG">FAANG</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Question Prompt Text</label>
                  <textarea
                    required
                    placeholder="Enter full question text..."
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 h-20 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-purple-700 text-xs font-bold text-white shadow-sm"
                  >
                    Save Question Template
                  </button>
                </div>
              </form>
            )}

            {/* Questions List */}
            <div className="space-y-3">
              {filteredQuestions.map((q) => (
                <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-700">{q.track}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-700 font-semibold">{q.topic}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-bold">
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-900 font-semibold">{q.text}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* 3. User Audit Logs */}
        {activeTab === 'users' && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Active Candidates & Security Logs</h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <h4 className="font-bold text-slate-900">Alex Chen (alex.chen@devmail.io)</h4>
                <span className="text-slate-500">14 Sessions Completed • Average Score 89%</span>
              </div>
              <span className="text-[#059669] font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Verified Clean
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
