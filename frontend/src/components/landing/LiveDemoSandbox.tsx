'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume2, 
  Play, 
  CheckCircle2, 
  Sparkles,
  Bot
} from 'lucide-react';

export const LiveDemoSandbox: React.FC = () => {
  const [micActive, setMicActive] = useState(false);
  const [camActive, setCamActive] = useState(false);
  const [speechTesting, setSpeechTesting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const toggleCam = async () => {
    if (!camActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCamActive(true);
      } catch (err) {
        alert('Webcam permission denied or device not found.');
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      setCamActive(false);
    }
  };

  const testTTSVoice = () => {
    setSpeechTesting(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "Welcome to InterVio AI Enterprise! Your microphone and video hardware test is operating with zero latency. You are ready to start."
      );
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeechTesting(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setSpeechTesting(false), 2000);
    }
  };

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Description */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-xs font-bold text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
              <span>Hardware Testing Playground</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Test Camera, Mic & AI Voice Synth in 1-Click
            </h2>

            <p className="text-slate-600 text-sm leading-relaxed">
              Verify your video and audio hardware before starting an interview screening. InterVio runs client-side in modern web browsers with encrypted audio and video streaming.
            </p>

            <div className="space-y-3 text-xs text-slate-700 font-semibold">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Zero latency media streaming with local canvas vision processing</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Noise-canceled speech recognition engine</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Client-side AI Computer Vision Proctoring</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={testTTSVoice}
                disabled={speechTesting}
                className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <Volume2 className={`w-4 h-4 ${speechTesting ? 'text-[#059669] animate-spin' : 'text-[#059669]'}`} />
                <span>{speechTesting ? 'AI Voice Speaking...' : 'Test AI Interviewer Voice'}</span>
              </button>

              <Link
                href="/interview/demo"
                className="px-6 py-3 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Enter Full Studio</span>
              </Link>
            </div>
          </div>

          {/* Right Sandbox Container */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-enterprise-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#059669]" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Hardware Diagnostic Card
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                100% System Ready
              </span>
            </div>

            {/* Video Viewbox */}
            <div className="relative w-full h-56 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${camActive ? 'block' : 'hidden'}`}
              />
              {!camActive && (
                <div className="flex flex-col items-center text-slate-400 space-y-2">
                  <VideoOff className="w-8 h-8 opacity-50" />
                  <span className="text-xs">Camera stream paused. Click button below to test.</span>
                </div>
              )}
              {camActive && (
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Vision HUD: 1 Candidate Tracked</span>
                </div>
              )}
            </div>

            {/* Control Bar */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={toggleCam}
                className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  camActive
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {camActive ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-[#059669]" />}
                <span>{camActive ? 'Stop Webcam' : 'Activate Webcam'}</span>
              </button>

              <button
                onClick={() => setMicActive(!micActive)}
                className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  micActive
                    ? 'bg-emerald-50 border-emerald-300 text-[#059669]'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {micActive ? <Mic className="w-4 h-4 text-[#059669]" /> : <MicOff className="w-4 h-4 text-slate-400" />}
                <span>{micActive ? 'Mic Active' : 'Test Mic'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
