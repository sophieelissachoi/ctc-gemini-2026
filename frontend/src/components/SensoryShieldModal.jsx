import React, { useState } from 'react';
import { useSensorySpace } from '../context/SensorySpaceContext';
import { Shield, Eye, Mic, ShieldAlert, Cpu } from 'lucide-react';

export default function SensoryShieldModal() {
  const { isShieldActive, activateSensoryShield } = useSensorySpace();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isShieldActive) return null;

  const handleActivate = async () => {
    setLoading(true);
    setError('');
    const success = await activateSensoryShield();
    setLoading(false);
    if (!success) {
      setError('Could not initialize media streams. Please check your browser permissions for camera/microphone access.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1117]/95 backdrop-blur-md p-4">
      <div className="relative max-w-lg w-full glass-panel rounded-2xl p-8 md:p-10 border border-white/5 flex flex-col items-center text-center shadow-2xl">
        {/* Subtle, soft calming glow */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-calm-blue to-calm-green opacity-10 blur-xl -z-10 animate-pulse"></div>

        <div className="mb-6 p-4 bg-calm-blue/10 rounded-full border border-calm-blue/25 pulse-active">
          <Shield className="w-10 h-10 text-calm-blue" />
        </div>

        <h1 className="text-2xl font-bold tracking-wide text-white mb-2">
          Sensory Shield
        </h1>
        <p className="text-gray-400 text-xs md:text-sm mb-6 leading-relaxed">
          An interactive, sound-filtered decompression chamber. All video and audio streams are processed locally on your device to maintain total privacy.
        </p>

        {/* Feature list for ease of readability */}
        <div className="w-full text-left space-y-3.5 mb-6 bg-white/3 rounded-xl p-4.5 border border-white/5">
          <div className="flex gap-3.5 items-start">
            <div className="mt-0.5 p-1 bg-calm-green/10 rounded-lg text-calm-green border border-calm-green/10 shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Visual Defocusing</h3>
              <p className="text-[11px] text-gray-400 leading-normal">Webcam streams are mirrored and processed with soft blending layers to reduce sensory overload.</p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start">
            <div className="mt-0.5 p-1 bg-calm-blue/10 rounded-lg text-calm-blue border border-calm-blue/10 shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Acoustic Isolation</h3>
              <p className="text-[11px] text-gray-400 leading-normal">Pipes live microphone inputs through a lowpass frequency cutoff, dampening loud or chaotic background noise.</p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start">
            <div className="mt-0.5 p-1 bg-calm-pink/10 rounded-lg text-calm-pink border border-calm-pink/10 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">ASMR Synthesizers</h3>
              <p className="text-[11px] text-gray-400 leading-normal">Synthesizes ambient loops, gentle chord sequencers, and satisfying mechanical ASMR on demand.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="w-full mb-5 p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 flex items-start gap-2.5 text-left">
            <ShieldAlert className="w-4.5 h-4.5 text-rose-300 shrink-0 mt-0.5" />
            <p className="text-[11px] text-rose-300 leading-relaxed">{error}</p>
          </div>
        )}

        <button
          onClick={handleActivate}
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-calm-blue to-calm-green hover:opacity-95 text-[#0d1117] font-bold text-xs tracking-wider transition-all duration-200 hover:shadow-lg hover:shadow-calm-blue/10 active:scale-98 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="animate-spin h-4 w-4 text-[#0d1117]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Calibrating Shield...
            </span>
          ) : (
            'ACTIVATE SENSORY SHIELD'
          )}
        </button>
      </div>
    </div>
  );
}
