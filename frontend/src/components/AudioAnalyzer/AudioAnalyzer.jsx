import React, { useState, useEffect } from 'react';
import { Mic, Volume2, Zap, Gauge, PauseCircle, Activity } from 'lucide-react';

export const AudioAnalyzer = ({ isMicOn = true }) => {
  const [wpm, setWpm] = useState(135);
  const [pitch, setPitch] = useState('Stable (142 Hz)');
  const [volumeLevel, setVolumeLevel] = useState(72);
  const [pauseCount, setPauseCount] = useState(2);
  const [waveform, setWaveform] = useState([35, 60, 45, 80, 55, 90, 70, 40, 65, 85, 50, 75]);

  useEffect(() => {
    let interval;
    if (isMicOn) {
      interval = setInterval(() => {
        // Dynamic waveform animation
        setWaveform(prev => prev.map(() => Math.floor(Math.random() * 70) + 20));
        setVolumeLevel(Math.floor(Math.random() * 25) + 65);
        setWpm(Math.floor(Math.random() * 15) + 130);
      }, 200);
    } else {
      setWaveform(new Array(12).fill(10));
      setVolumeLevel(0);
    }
    return () => clearInterval(interval);
  }, [isMicOn]);

  return (
    <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className={`w-4 h-4 ${isMicOn ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-xs font-bold text-slate-200">Voice Acoustic Analyzer</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
          Fluency: Excellent (94%)
        </span>
      </div>

      {/* Real-time Spectrum Waveform */}
      <div className="w-full bg-slate-950 rounded-xl p-3 border border-slate-800/80 flex items-center justify-center gap-1.5 h-14">
        {waveform.map((height, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-indigo-400 transition-all duration-150"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Pacing (WPM)</span>
          <span className="text-xs font-bold text-cyan-300 font-mono">{wpm} WPM</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Pitch Stability</span>
          <span className="text-xs font-bold text-purple-300 font-mono">142 Hz</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Volume</span>
          <span className="text-xs font-bold text-emerald-300 font-mono">{volumeLevel} dB</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Micro Pauses</span>
          <span className="text-xs font-bold text-indigo-300 font-mono">{pauseCount} Natural</span>
        </div>
      </div>
    </div>
  );
};
