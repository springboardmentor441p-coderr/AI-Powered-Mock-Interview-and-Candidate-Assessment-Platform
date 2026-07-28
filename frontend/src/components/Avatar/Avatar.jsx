import React, { useEffect, useState } from 'react';
import { Bot, Volume2, Activity, Sparkles, UserCheck } from 'lucide-react';

export const AIAvatar = ({ currentQuestion, isSpeaking, personality = "Senior AI Technical Presenter" }) => {
  const [pulseScale, setPulseScale] = useState(1);
  const [headTilt, setHeadTilt] = useState(0);
  const [breathingY, setBreathingY] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  // High-resolution photorealistic AI Presenter image
  const presenterImageUrl = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80";

  // Human Micro-Movements: Head Nodding & Speaking Motion
  useEffect(() => {
    let interval;
    if (isSpeaking) {
      interval = setInterval(() => {
        setPulseScale(1 + Math.random() * 0.08);
        setHeadTilt((Math.random() - 0.5) * 4); // Lifelike head tilt (-2deg to +2deg)
      }, 140);
    } else {
      setPulseScale(1);
      setHeadTilt(0);
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Subtle Natural Human Breathing Motion
  useEffect(() => {
    const breathInterval = setInterval(() => {
      setBreathingY(Math.sin(Date.now() / 1200) * 3); // 3px subtle chest breathing motion
    }, 50);

    return () => clearInterval(breathInterval);
  }, []);

  // Realistic Eye Blinking Timer (Every 3.5s)
  useEffect(() => {
    const blinkTimer = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);
    }, 3500);

    return () => clearInterval(blinkTimer);
  }, []);

  return (
    <div className="relative glass-card rounded-2xl p-6 border border-cyan-500/30 flex flex-col items-center justify-between overflow-hidden w-full min-h-[380px] bg-slate-950/90 shadow-2xl">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-purple-500/5 to-transparent pointer-events-none" />

      {/* Top Header */}
      <div className="w-full flex items-center justify-between z-10 mb-2">
        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-cyan-500/30 shadow-sm">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white">Advika (AI Presenter)</span>
          <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full font-mono">
            {personality}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isSpeaking ? (
            <span className="flex items-center gap-1.5 text-xs text-cyan-300 font-bold bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-500/50 animate-pulse shadow-md">
              <Volume2 className="w-4 h-4 text-cyan-400" /> Presenter Speaking...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Listening to Candidate
            </span>
          )}
        </div>
      </div>

      {/* LIFELIKE AI VIRTUAL PRESENTER AVATAR FRAME */}
      <div className="relative flex items-center justify-center my-4">
        {/* Glowing Aura Rings */}
        <div
          className={`absolute w-48 h-48 rounded-full border-2 transition-all duration-200 ${
            isSpeaking ? 'border-cyan-400/80 shadow-xl shadow-cyan-500/30' : 'border-slate-800'
          }`}
          style={{ transform: `scale(${pulseScale * 1.1})` }}
        />

        {/* Photorealistic Human Presenter Frame with Breathing & Head Movements */}
        <div
          className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-cyan-400/70 p-1 bg-gradient-to-tr from-cyan-500 via-purple-500 to-indigo-600 shadow-2xl overflow-hidden z-10 transition-transform duration-150"
          style={{
            transform: `scale(${pulseScale}) translateY(${breathingY}px) rotate(${headTilt}deg)`
          }}
        >
          <img
            src={presenterImageUrl}
            alt="AI Virtual Presenter"
            className="w-full h-full object-cover rounded-full filter brightness-105 contrast-105"
          />

          {/* Eye Blinking Overlay Effect */}
          {isBlinking && (
            <div className="absolute top-[32%] left-[25%] right-[25%] h-3 bg-[#3a251e] rounded-full z-20 transition-all duration-75" />
          )}

          {/* Bottom Gradient Fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

          {/* Dynamic Speech Lip-Sync Waveform Bars */}
          {isSpeaking && (
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1 z-20">
              {[0.4, 0.9, 1, 0.6, 0.8, 0.5, 0.7].map((h, idx) => (
                <div
                  key={idx}
                  className="w-1 bg-cyan-400 rounded-full shadow-md shadow-cyan-400 transition-all duration-100"
                  style={{
                    height: `${Math.max(4, h * 18 * pulseScale)}px`
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current AI Question Display Box */}
      <div className="w-full bg-slate-900/90 rounded-xl p-4 border border-slate-800 text-slate-200 z-10 space-y-1 shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
          <Sparkles className="w-3.5 h-3.5" /> Current Question Prompt:
        </div>
        <p className="text-xs sm:text-sm font-medium leading-relaxed text-white">
          "{currentQuestion}"
        </p>
      </div>
    </div>
  );
};
