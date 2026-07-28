import React, { useState } from 'react';
import { Settings as SettingsIcon, Camera, Mic, Sliders, Shield, Bell, CheckCircle } from 'lucide-react';

export const Settings = () => {
  const [camera, setCamera] = useState('Integrated HD Webcam (1080p)');
  const [microphone, setMicrophone] = useState('Built-in Array Microphone');
  const [visionSensitivity, setVisionSensitivity] = useState(85);
  const [speechSensitivity, setSpeechSensitivity] = useState(90);
  const [saved, setSaved] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Audio / Video & Telemetry Settings
        </h1>
        <p className="text-xs text-slate-400 font-mono">Configure camera hardware, microphone spectrum parameters, and privacy</p>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* AV Device Selection */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" /> Hardware Peripheral Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Webcam Hardware</label>
                <select
                  value={camera}
                  onChange={(e) => setCamera(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none"
                >
                  <option>Integrated HD Webcam (1080p)</option>
                  <option>Logitech StreamCam Ultra</option>
                  <option>Virtual Vision Feed Simulator</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Microphone Input</label>
                <select
                  value={microphone}
                  onChange={(e) => setMicrophone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none"
                >
                  <option>Built-in Array Microphone</option>
                  <option>Blue Yeti USB Microphone</option>
                  <option>Realtek High Definition Audio</option>
                </select>
              </div>
            </div>
          </div>

          {/* AI Vision & Speech Sensitivity */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h2 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" /> Vision & Audio AI Model Sensitivity
            </h2>

            <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                  <span>Eye Contact & Facial Landmark Sensitivity</span>
                  <span className="font-mono text-cyan-400 font-bold">{visionSensitivity}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={visionSensitivity}
                  onChange={(e) => setVisionSensitivity(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                  <span>Speech Pitch & Pause Threshold</span>
                  <span className="font-mono text-purple-400 font-bold">{speechSensitivity}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={speechSensitivity}
                  onChange={(e) => setSpeechSensitivity(Number(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saved && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Hardware settings saved!
              </span>
            )}
            <button
              type="submit"
              className="glow-cyan-btn px-6 py-2.5 rounded-xl font-bold text-xs text-white ml-auto cursor-pointer"
            >
              Save Hardware Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
