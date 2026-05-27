import React from 'react';
import { useSensorySpace } from '../context/SensorySpaceContext';
import { Compass, Waves, Sliders, Volume2, Video, VideoOff, Mic, MicOff, Music } from 'lucide-react';

export default function Dashboard() {
  const {
    currentRoom,
    setCurrentRoom,
    isWebcamActive,
    isMicActive,
    micVolume,
    activeAudio
  } = useSensorySpace();

  const rooms = [
    { id: 'deep-sea', name: 'Deep Sea Room', icon: Waves, color: 'text-calm-blue border-calm-blue/30 bg-calm-blue/5' },
    { id: 'customizable', name: 'Customizable Shield', icon: Sliders, color: 'text-calm-green border-calm-green/30 bg-calm-green/5' },
    { id: 'fidget-space', name: 'Fidget Space', icon: Compass, color: 'text-calm-pink border-calm-pink/30 bg-calm-pink/5' },
  ];

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[90%] glass-panel rounded-xl px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 border border-white/5 shadow-xl select-none">
      {/* Brand logo in calming green/blue */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-calm-blue to-calm-green flex items-center justify-center shadow-md">
          <span className="font-bold text-xs text-[#0f1319]">S</span>
        </div>
        <span className="font-bold text-xs tracking-wider text-white hidden sm:inline-block">
          SENSORY SHIELD
        </span>
      </div>

      {/* Navigation tabs */}
      <nav className="flex items-center bg-black/20 p-0.5 rounded-lg border border-white/5">
        {rooms.map(room => {
          const Icon = room.icon;
          const isActive = currentRoom === room.id;
          return (
            <button
              key={room.id}
              onClick={() => setCurrentRoom(room.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? `bg-white/5 text-white border border-white/5`
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'scale-105' : ''}`} />
              <span>{room.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Hardware Status */}
      <div className="flex items-center gap-3 text-xs">
        {/* Active sound displays */}
        <div className="hidden lg:flex items-center gap-3 text-gray-400 bg-black/15 px-2.5 py-1 rounded-lg border border-white/5">
          {activeAudio.environmentalEffect !== 'none' && (
            <span className="flex items-center gap-1.5 text-calm-blue">
              <Volume2 className="w-3 h-3 animate-pulse" />
              <span className="text-[10px] lowercase font-medium">{activeAudio.environmentalEffect}</span>
            </span>
          )}
          {activeAudio.trackPlaying !== 'none' && (
            <span className="flex items-center gap-1.5 text-calm-green">
              <Music className="w-3 h-3 animate-bounce" />
              <span className="text-[10px] lowercase font-medium">{activeAudio.trackPlaying}</span>
            </span>
          )}
        </div>

        {/* Media feeds status */}
        <div className="flex items-center gap-2">
          {/* Camera Feed */}
          <div
            title={isWebcamActive ? 'Camera Connected' : 'Camera Blocked'}
            className={`p-1.5 rounded-lg border transition-all duration-300 ${
              isWebcamActive
                ? 'bg-calm-green/10 border-calm-green/20 text-calm-green'
                : 'bg-rose-500/10 border-rose-500/10 text-rose-400'
            }`}
          >
            {isWebcamActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
          </div>

          {/* Microphone Feed */}
          <div
            title={isMicActive ? 'Microphone Connected' : 'Microphone Blocked'}
            className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all duration-300 ${
              isMicActive
                ? 'bg-calm-blue/10 border-calm-blue/20 text-calm-blue'
                : 'bg-rose-500/10 border-rose-500/10 text-rose-400'
            }`}
          >
            {isMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            
            {/* Soft level visualizer */}
            {isMicActive && (
              <div className="w-5 h-2.5 flex items-end gap-0.5 overflow-hidden">
                <div
                  className="w-0.5 bg-calm-blue rounded-t-sm transition-all duration-75"
                  style={{ height: `${Math.max(15, micVolume * 80)}%` }}
                />
                <div
                  className="w-0.5 bg-calm-blue rounded-t-sm transition-all duration-75"
                  style={{ height: `${Math.max(15, micVolume * 120 * 0.7)}%` }}
                />
                <div
                  className="w-0.5 bg-calm-blue rounded-t-sm transition-all duration-75"
                  style={{ height: `${Math.max(15, micVolume * 60 * 0.5)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
