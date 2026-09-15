import React, { useEffect, useState } from 'react';
import { Bot, Volume2, Activity, Sparkles, Cpu, Mic, CheckCircle2 } from 'lucide-react';

export const INTERVIEW_STATES = {
  SPEAKING: "speaking",
  LISTENING: "listening",
  ANALYZING: "analyzing",
  GENERATING: "generating",
  READY: "ready"
};

export const AIAvatar = ({ currentQuestion, isSpeaking, interviewState = INTERVIEW_STATES.SPEAKING, personality = "Senior AI Technical Presenter" }) => {
  const [pulseScale, setPulseScale] = useState(1);
  const [headTilt, setHeadTilt] = useState(0);
  const [breathingY, setBreathingY] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  // High-resolution photorealistic AI Presenter image
  const presenterImageUrl = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80";

  const effectiveState = isSpeaking ? INTERVIEW_STATES.SPEAKING : interviewState;

  // Human Micro-Movements: Head Nodding & Speaking Motion
  useEffect(() => {
    let interval;
    if (effectiveState === INTERVIEW_STATES.SPEAKING) {
      interval = setInterval(() => {
        setPulseScale(1 + Math.random() * 0.08);
        setHeadTilt((Math.random() - 0.5) * 4);
      }, 140);
    } else if (effectiveState === INTERVIEW_STATES.ANALYZING || effectiveState === INTERVIEW_STATES.GENERATING) {
      interval = setInterval(() => {
        setPulseScale(1 + Math.sin(Date.now() / 200) * 0.03);
        setHeadTilt((Math.random() - 0.5) * 2);
      }, 200);
    } else {
      setPulseScale(1);
      setHeadTilt(0);
    }
    return () => clearInterval(interval);
  }, [effectiveState]);

  // Subtle Natural Human Breathing Motion
  useEffect(() => {
    const breathInterval = setInterval(() => {
      setBreathingY(Math.sin(Date.now() / 1200) * 3);
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

  const [displayedText, setDisplayedText] = useState('');

  // Synchronized Subtitle / Typewriter Effect as AI Speaks
  useEffect(() => {
    if (!currentQuestion) {
      setDisplayedText('');
      return;
    }

    if (effectiveState === INTERVIEW_STATES.SPEAKING) {
      setDisplayedText('');
      const words = currentQuestion.split(' ');
      let wordIndex = 0;

      const interval = setInterval(() => {
        if (wordIndex < words.length) {
          setDisplayedText(words.slice(0, wordIndex + 1).join(' '));
          wordIndex++;
        } else {
          clearInterval(interval);
        }
      }, 140); // 140ms per word matches 120-130 WPM AI presenter speech rate

      return () => clearInterval(interval);
    } else {
      setDisplayedText(currentQuestion);
    }
  }, [currentQuestion, effectiveState]);

  return (
    <div className="relative glass-card rounded-2xl p-6 border border-cyan-500/30 flex flex-col items-center justify-between overflow-hidden w-full h-full min-h-[380px] bg-slate-950/90 shadow-2xl">
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

        {/* State Machine Status Badge */}
        <div className="flex items-center gap-2">
          {effectiveState === INTERVIEW_STATES.SPEAKING && (
            <span className="flex items-center gap-1.5 text-xs text-cyan-300 font-bold bg-cyan-950/90 px-3 py-1 rounded-full border border-cyan-500/50 animate-pulse shadow-md">
              <Volume2 className="w-4 h-4 text-cyan-400" /> 🔊 AI is speaking...
            </span>
          )}
          {effectiveState === INTERVIEW_STATES.LISTENING && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold bg-emerald-950/90 px-3 py-1 rounded-full border border-emerald-500/50 animate-pulse shadow-md">
              <Mic className="w-4 h-4 text-emerald-400" /> 🎤 Listening to your answer... <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </span>
          )}
          {effectiveState === INTERVIEW_STATES.ANALYZING && (
            <span className="flex items-center gap-1.5 text-xs text-purple-300 font-bold bg-purple-950/90 px-3 py-1 rounded-full border border-purple-500/50 animate-pulse shadow-md">
              <Cpu className="w-4 h-4 text-purple-400 animate-spin" /> 🤖 Analyzing your answer...
            </span>
          )}
          {effectiveState === INTERVIEW_STATES.GENERATING && (
            <span className="flex items-center gap-1.5 text-xs text-amber-300 font-bold bg-amber-950/90 px-3 py-1 rounded-full border border-amber-500/50 animate-pulse shadow-md">
              <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" /> 🤖 Preparing next question...
            </span>
          )}
          {effectiveState === INTERVIEW_STATES.READY && (
            <span className="flex items-center gap-1.5 text-xs text-slate-300 font-bold bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> System Ready
            </span>
          )}
        </div>
      </div>

      {/* Photorealistic AI Avatar Presenter Canvas */}
      <div className="relative my-2 w-48 h-48 sm:w-56 sm:h-56 rounded-full p-1.5 bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 shadow-2xl flex items-center justify-center">
        {/* Pulsing Voice Wave Outer Aura */}
        {effectiveState === INTERVIEW_STATES.SPEAKING && (
          <div
            className="absolute inset-0 rounded-full border-2 border-cyan-400/60 animate-ping pointer-events-none"
            style={{ animationDuration: '1.8s' }}
          />
        )}

        <div
          className="relative w-full h-full rounded-full overflow-hidden bg-slate-950 border-2 border-slate-900 shadow-inner flex items-center justify-center transition-transform duration-100"
          style={{
            transform: `translateY(${breathingY}px) rotate(${headTilt}deg) scale(${pulseScale})`
          }}
        >
          {/* Photorealistic Presenter Avatar Image */}
          <img
            src={presenterImageUrl}
            alt="AI Virtual Presenter Advika"
            className="w-full h-full object-cover object-top filter brightness-[1.05] contrast-[1.05]"
          />

          {/* Realistic Eyelid Blinking Overlay */}
          {isBlinking && (
            <div className="absolute top-[32%] left-[25%] right-[25%] h-3 bg-[#3a251e] rounded-full z-20 transition-all duration-75" />
          )}

          {/* Bottom Gradient Fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

          {/* Dynamic Speech Lip-Sync Waveform Bars */}
          {effectiveState === INTERVIEW_STATES.SPEAKING && (
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

      {/* Current AI Question & State Display Box */}
      <div className="w-full bg-slate-900/90 rounded-xl p-4 border border-slate-800 text-slate-200 z-10 space-y-1 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" /> Current Question Prompt:
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            {effectiveState}
          </span>
        </div>
        <p className="text-xs sm:text-sm font-medium leading-relaxed text-white">
          "{displayedText}"
          {effectiveState === INTERVIEW_STATES.SPEAKING && displayedText !== currentQuestion && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-400 animate-pulse align-middle rounded-sm" />
          )}
        </p>
      </div>
    </div>
  );
};
