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
    { id: 'deep-sea', name: 'Deep Sea Room', icon: Waves, color: 'text-calm-blue' },
    { id: 'customizable', name: 'Customizable Shield', icon: Sliders, color: 'text-calm-green' },
    { id: 'fidget-space', name: 'Fidget Space', icon: Compass, color: 'text-calm-pink' },
  ];

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[90%] glass-panel rounded-2xl px-6 py-3 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Brand logo in calming green/blue */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-calm-blue to-calm-green flex items-center justify-center shadow-md shadow-calm-blue/10">
          <span className="font-extrabold text-xs text-[#0a0f18] tracking-wider">S</span>
        </div>
        <span className="font-bold text-xs tracking-widest text-white/90 hidden sm:inline-block font-sans uppercase">
          SENSORY SHIELD
        </span>
      </div>

      {/* Navigation tabs */}
      <nav className="flex items-center bg-black/35 p-1 rounded-xl border border-white/5">
        {rooms.map(room => {
          const Icon = room.icon;
          const isActive = currentRoom === room.id;
          return (
            <button
              key={room.id}
              onClick={() => setCurrentRoom(room.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                isActive
                  ? `bg-white/[0.08] text-white border border-white/10 shadow-sm shadow-black/20`
                  : 'text-gray-400 hover:text-white/90 hover:bg-white/[0.02] border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? 'scale-110 ' + room.color : 'text-gray-400'}`} />
              <span>{room.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Hardware Status */}
      <div className="flex items-center gap-3 text-xs">
        {/* Active sound displays */}
        <div className="hidden lg:flex items-center gap-2.5 text-gray-400 bg-black/25 px-3 py-1.5 rounded-xl border border-white/5">
          {activeAudio.environmentalEffect !== 'none' && (
            <span className="flex items-center gap-1.5 text-calm-blue font-semibold tracking-wide">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span className="text-[10px] uppercase font-bold text-xs">{activeAudio.environmentalEffect}</span>
            </span>
          )}
          {activeAudio.environmentalEffect !== 'none' && activeAudio.trackPlaying !== 'none' && (
            <span className="w-1 h-1 rounded-full bg-white/20" />
          )}
          {activeAudio.trackPlaying !== 'none' && (
            <span className="flex items-center gap-1.5 text-calm-green font-semibold tracking-wide">
              <Music className="w-3.5 h-3.5 animate-bounce" />
              <span className="text-[10px] uppercase font-bold text-xs">{activeAudio.trackPlaying}</span>
            </span>
          )}
          {activeAudio.environmentalEffect === 'none' && activeAudio.trackPlaying === 'none' && (
            <span className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase">Acoustic Shield Active</span>
          )}
        </div>

        {/* Media feeds status */}
        <div className="flex items-center gap-2">
          {/* Camera Feed */}
          <div
            title={isWebcamActive ? 'Camera Connected' : 'Camera Blocked'}
            className={`p-2 rounded-xl border transition-all duration-300 ${
              isWebcamActive
                ? 'bg-calm-green/10 border-calm-green/20 text-calm-green shadow-sm shadow-calm-green/5'
                : 'bg-rose-500/10 border-rose-500/10 text-rose-400'
            }`}
          >
            {isWebcamActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
          </div>

          {/* Microphone Feed */}
          <div
            title={isMicActive ? 'Microphone Connected' : 'Microphone Blocked'}
            className={`flex items-center gap-2 p-2 rounded-xl border transition-all duration-300 ${
              isMicActive
                ? 'bg-calm-blue/10 border-calm-blue/20 text-calm-blue shadow-sm shadow-calm-blue/5'
                : 'bg-rose-500/10 border-rose-500/10 text-rose-400'
            }`}
          >
            {isMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            
            {/* Soft level visualizer */}
            {isMicActive && (
              <div className="w-6 h-3 flex items-end gap-0.5 overflow-hidden">
                <div
                  className="w-0.5 bg-calm-blue rounded-t-full transition-all duration-75"
                  style={{ height: `${Math.max(15, micVolume * 80)}%` }}
                />
                <div
                  className="w-0.5 bg-calm-blue rounded-t-full transition-all duration-75"
                  style={{ height: `${Math.max(15, micVolume * 120 * 0.7)}%` }}
                />
                <div
                  className="w-0.5 bg-calm-blue rounded-t-full transition-all duration-75"
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
