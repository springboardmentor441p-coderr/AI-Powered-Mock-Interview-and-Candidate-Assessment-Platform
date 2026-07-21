import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Eye, EyeOff, Save, CheckCircle, User, Award } from 'lucide-react';
import api from '../services/api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('keys'); // keys, profile
  
  // API Keys
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  
  // Profile
  const [fullName, setFullName] = useState(localStorage.getItem('full_name') || '');
  const [skills, setSkills] = useState('');
  const [summary, setSummary] = useState('');
  
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load local keys
    setGeminiKey(localStorage.getItem('gemini_api_key') || '');
    setOpenaiKey(localStorage.getItem('openai_api_key') || '');
    
    // Fetch profile from db
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/users/profile');
        const { parsed_skills, summary: profileSummary } = response.data;
        if (parsed_skills) {
          setSkills(parsed_skills.join(', '));
        }
        if (profileSummary) {
          setSummary(profileSummary);
        }
      } catch (err) {
        console.error('Failed to load profile settings:', err);
      }
    };
    
    if (localStorage.getItem('role') === 'candidate') {
      fetchProfile();
    }
  }, []);

  const handleSaveKeys = (e) => {
    e.preventDefault();
    setStatusMsg('');
    
    try {
      if (geminiKey.trim()) {
        localStorage.setItem('gemini_api_key', geminiKey.trim());
      } else {
        localStorage.removeItem('gemini_api_key');
      }
      
      if (openaiKey.trim()) {
        localStorage.setItem('openai_api_key', openaiKey.trim());
      } else {
        localStorage.removeItem('openai_api_key');
      }
      
      setStatusMsg('API Keys saved successfully. The system will now use active AI processing.');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      setStatusMsg('Failed to save API keys.');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    setLoading(true);
    
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      await api.put('/api/users/profile', {
        parsed_skills: skillsArray,
        summary: summary
      });
      
      setStatusMsg('Profile details updated successfully.');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      setStatusMsg('Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-cyan-500/10 rounded-xl">
          <SettingsIcon className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
          <p className="text-sm text-gray-400">Configure your assessment profile and AI connections</p>
        </div>
      </div>

      {statusMsg && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4 rounded-xl text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-8">
        <button
          onClick={() => setActiveTab('keys')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'keys' 
              ? 'border-cyan-500 text-cyan-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          AI Configurations
        </button>
        {localStorage.getItem('role') === 'candidate' && (
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'profile' 
                ? 'border-cyan-500 text-cyan-400' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Candidate Profile
          </button>
        )}
      </div>

      {/* Keys Tab */}
      {activeTab === 'keys' && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" />
            Integrate Generative AI Providers
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Configure your private keys to toggle from Mock simulation to **live Generative AI assessments**. 
            These keys are stored locally on your device and are passed in requests securely.
          </p>

          <form onSubmit={handleSaveKeys} className="space-y-6">
            {/* Gemini */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Google Gemini API Key</label>
              <div className="relative">
                <input
                  type={showGemini ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-4 top-3.5 text-gray-500 hover:text-white"
                >
                  {showGemini ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">Recommended. Powers smart resume parsing and real-time questions.</p>
            </div>

            {/* OpenAI */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">OpenAI API Key (Alternative)</label>
              <div className="relative">
                <input
                  type={showOpenai ? 'text' : 'password'}
                  placeholder="sk-proj-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenai(!showOpenai)}
                  className="absolute right-4 top-3.5 text-gray-500 hover:text-white"
                >
                  {showOpenai ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save AI Settings
            </button>
          </form>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            Resume Profile Settings
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Review or manually adjust the parsed profile criteria used for mock interview generation.
          </p>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Account Name</label>
              <input
                type="text"
                disabled
                value={fullName}
                className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-gray-400 focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Skills (Comma Separated)</label>
              <textarea
                rows={2}
                placeholder="Python, React, JavaScript, SQL, Docker..."
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200"
              />
              <p className="text-xs text-gray-500 mt-1.5">Injecting precise technical tags generates customized matching questions.</p>
            </div>

            {/* Summary */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Professional Summary</label>
              <textarea
                rows={4}
                placeholder="A brief professional summary..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile Info
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
