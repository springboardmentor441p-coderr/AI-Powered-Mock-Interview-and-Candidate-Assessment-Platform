import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

const DEFAULT_AVATAR = "/avatar.png";
const BACKEND_AVATAR_PATH = "s:\\SmartHireAI\\frontend\\public\\avatar.png";

export default function AIInterviewerAvatar({ text, onClipEnd, status, isIdle }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    if (!text || isIdle) return;

    let mounted = true;
    const generateAndPlay = async () => {
      setIsGenerating(true);
      setVideoUrl(null);
      
      try {
        const res = await api.generateAvatarClip({ text, avatar_url: BACKEND_AVATAR_PATH });
        if (!mounted) return;
        
        if (res.video_url) {
          setVideoUrl(res.video_url);
        } else {
          // Fallback to TTS and idle image
          fallbackToTTS(text);
        }
      } catch (err) {
        console.error("Avatar generation failed:", err);
        if (mounted) fallbackToTTS(text);
      } finally {
        if (mounted) setIsGenerating(false);
      }
    };

    generateAndPlay();

    return () => {
      mounted = false;
      audioRef.current?.pause();
      if (videoRef.current) videoRef.current.pause();
    };
  }, [text, isIdle]);

  const fallbackToTTS = async (fallbackText) => {
    try {
      const blob = await api.tts(fallbackText);
      const url = URL.createObjectURL(blob);
      audioRef.current.src = url;
      audioRef.current.onended = () => { if (onClipEnd) onClipEnd(); };
      audioRef.current.play();
    } catch {
      // Ultimate fallback: just wait a second and proceed
      setTimeout(() => { if (onClipEnd) onClipEnd(); }, 1500);
    }
  };

  const handleVideoEnded = () => {
    if (onClipEnd) onClipEnd();
  };

  // Determine border and glow colors based on interview status
  const getContainerStyle = () => {
    if (status === 'asking') return 'border-primary shadow-[0_0_40px_rgba(0,240,255,0.3)] animate-pulse';
    if (status === 'listening') return 'border-error shadow-[0_0_40px_rgba(239,68,68,0.3)]';
    return 'border-outline-variant/20';
  };

  return (
    <div className="relative mb-6">
      <div className={`w-64 h-64 rounded-3xl overflow-hidden border-2 transition-all duration-300 ${getContainerStyle()} bg-surface-container-high relative flex items-center justify-center`}>
        
        {/* State 1: Generating Spinner */}
        {isGenerating && !videoUrl && (
          <div className="absolute inset-0 z-20 bg-surface-container-highest/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="font-mono-label text-mono-label text-primary uppercase animate-pulse">Generating Response...</span>
          </div>
        )}

        {/* State 2: Speaking Video */}
        {videoUrl && !isGenerating && status === 'asking' ? (
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            playsInline
            onEnded={handleVideoEnded}
            className="w-full h-full object-cover relative z-10"
          />
        ) : (
          /* State 3: Idle / Fallback Image */
          <div className="w-full h-full relative">
            <img src={DEFAULT_AVATAR} alt="AI Avatar" className="w-full h-full object-cover opacity-60 mix-blend-luminosity" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-surface-container-highest/60 backdrop-blur-md p-4 rounded-full">
                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${status === 'listening' ? 'bg-error/20' : 'bg-primary/20'}`}>
                  <span className={`material-symbols-outlined text-[28px] ${status === 'listening' ? 'text-error' : 'text-primary'}`}>
                    {status === 'listening' ? 'mic' : 'smart_toy'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Eye contact badge */}
      <div className="absolute top-3 right-3 bg-surface/80 backdrop-blur-md rounded-xl px-3 py-2 border border-outline-variant/10 text-center z-30">
        <span className="material-symbols-outlined text-primary text-[20px] block">visibility</span>
        <span className="font-mono-label text-mono-label text-primary text-[10px]">EYE CONTACT</span>
        <span className="font-mono-label text-mono-label text-primary-fixed-dim text-[10px] block">OPTIMIZED</span>
      </div>
    </div>
  );
}
