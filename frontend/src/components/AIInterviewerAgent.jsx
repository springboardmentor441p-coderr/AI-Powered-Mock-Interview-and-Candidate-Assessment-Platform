import React, { useRef, useEffect } from 'react';
import { Bot, Volume2, Mic, Sparkles } from 'lucide-react';

export default function AIInterviewerAgent({ isSpeaking, isListening, currentDialogue, currentQuestion, customVideoPath }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isSpeaking) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isSpeaking]);

  return (
    <div className="glass-card p-5 rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 space-y-4 shadow-2xl relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 blur-[60px] pointer-events-none"></div>

      {/* AI AGENT AVATAR / VIDEO DISPLAY PANEL */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex flex-col items-center justify-center">
        
        {customVideoPath ? (
          <video 
            ref={videoRef}
            src={customVideoPath} 
            loop 
            muted 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900/90 to-slate-950 relative p-4 text-center">
            {/* Animated Avatar Ring */}
            <div className={`w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 via-cyan-400 to-emerald-400 p-1 shadow-2xl transition-all ${
              isSpeaking ? 'animate-pulse ring-8 ring-cyan-500/30 scale-105' : ''
            }`}>
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-cyan-400">
                <Bot className="w-10 h-10" />
              </div>
            </div>

            {/* Speaking Status Pill */}
            <div className="mt-3">
              <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-md ${
                isSpeaking 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' 
                  : isListening
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}>
                {isSpeaking ? (
                  <> <Volume2 className="w-3.5 h-3.5 animate-bounce" /> Mira is speaking... </>
                ) : isListening ? (
                  <> <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Mira is listening... </>
                ) : (
                  <> <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Mira Ready </>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Video Overlay Badges */}
        <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur px-3 py-1 rounded-xl text-[10px] font-mono text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 shadow-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          Mira • AI Interviewer
        </div>

        <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur px-3 py-1 rounded-xl text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-md">
          <Sparkles className="w-3 h-3 text-emerald-400" /> Live Interviewer
        </div>

      </div>

      {/* AI AGENT LIVE DIALOGUE SPEECH BUBBLE */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wide block font-bold">
          Mira (Interviewer Prompt):
        </span>
        <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
          "{currentDialogue || "Welcome! Please turn on your camera and speak your answer out loud into the microphone."}"
        </p>
      </div>

    </div>
  );
}
