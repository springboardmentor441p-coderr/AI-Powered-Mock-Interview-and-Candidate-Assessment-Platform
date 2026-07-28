import React from 'react';
import { Mic, Sparkles } from 'lucide-react';

export const SpeechToText = ({ transcriptText = '', isListening = true }) => {
  return (
    <div className="glass-card rounded-2xl p-4 border border-cyan-500/30 flex items-center justify-between bg-slate-950/90 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
          <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse text-cyan-400' : 'text-slate-500'}`} />
        </div>
        <div>
          <span className="text-xs font-bold text-white flex items-center gap-2">
            Direct Voice Microphone Active <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </span>
          <p className="text-[11px] font-mono text-slate-300 mt-0.5">
            {transcriptText ? (
              <span className="text-cyan-300 font-bold">Heard: "{transcriptText}"</span>
            ) : (
              "Speak directly into your microphone. AI is listening in real-time..."
            )}
          </p>
        </div>
      </div>

      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/90 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-sm shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Hands-Free Voice Listening
      </span>
    </div>
  );
};
