import React, { useEffect, useRef, useState } from 'react';
import { useSensorySpace } from '../context/SensorySpaceContext';
import { Sliders, Volume2, Music, Save, FolderOpen, AlertCircle, Check } from 'lucide-react';

export default function CustomizableRoom() {
  const {
    isWebcamActive,
    webcamStream,
    globalSettings,
    setGlobalSettings,
    activeAudio,
    playEnvironmentalEffect,
    playLofiGenre
  } = useSensorySpace();

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [spaceName, setSpaceName] = useState('');
  const [savedPresets, setSavedPresets] = useState([]);
  const [saveStatus, setSaveStatus] = useState(''); 
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);

  useEffect(() => {
    if (isWebcamActive && webcamStream && videoRef.current) {
      videoRef.current.srcObject = webcamStream;
      videoRef.current.play().catch(e => console.log('Video play interrupted:', e));
    }
  }, [isWebcamActive, webcamStream]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      
      ctx.save();
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0f1319';
      ctx.fillRect(0, 0, w, h);

      if (isWebcamActive && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.globalAlpha = globalSettings.roomBrightness;
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        
        const vW = videoRef.current.videoWidth;
        const vH = videoRef.current.videoHeight;
        const scale = Math.max(w / vW, h / vH);
        const xOffset = (w - vW * scale) / 2;
        const yOffset = (h - vH * scale) / 2;
        
        ctx.drawImage(videoRef.current, xOffset, yOffset, vW * scale, vH * scale);
      } else {
        ctx.globalAlpha = globalSettings.roomBrightness;
        const gradient = ctx.createRadialGradient(w/2, h/2, 20, w/2, h/2, Math.max(w, h)/2);
        gradient.addColorStop(0, '#151c27');
        gradient.addColorStop(1, '#0f1319');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isWebcamActive, globalSettings.roomBrightness]);

  const fetchPresets = async () => {
    setIsLoadingPresets(true);
    try {
      const res = await fetch('http://localhost:5001/api/rooms/saved');
      if (res.ok) {
        const data = await res.json();
        setSavedPresets(data);
      }
    } catch (e) {
      console.warn('Failed to connect to backend api:', e);
    } finally {
      setIsLoadingPresets(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleSavePreset = async (e) => {
    e.preventDefault();
    if (!spaceName.trim()) return;

    setSaveStatus('');
    try {
      const payload = {
        spaceName,
        activeRoomType: 'customizable',
        visualBlur: globalSettings.blurAmount,
        noiseCutoff: globalSettings.noiseCancelCutoff,
        audioMix: {
          environmental: activeAudio.environmentalEffect,
          track: activeAudio.trackPlaying
        }
      };

      const res = await fetch('http://localhost:5001/api/rooms/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveStatus('success');
        setSpaceName('');
        fetchPresets();
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Save API Error:', err);
      setSaveStatus('error');
    }
  };

  const handleLoadPreset = (preset) => {
    setGlobalSettings({
      blurAmount: preset.visualBlur,
      roomBrightness: globalSettings.roomBrightness,
      noiseCancelCutoff: preset.noiseCutoff
    });

    if (preset.audioMix) {
      if (preset.audioMix.environmental) {
        playEnvironmentalEffect(preset.audioMix.environmental);
      }
      if (preset.audioMix.track) {
        playLofiGenre(preset.audioMix.track);
      }
    }
  };

  const getNoiseLevelDescription = () => {
    const val = globalSettings.noiseCancelCutoff;
    if (val <= 300) return 'Isolated Deep Hum (250Hz)';
    if (val <= 600) return 'Calming Muted Mumble (500Hz)';
    if (val <= 1200) return 'Ambient Chatter Muted (1000Hz)';
    return 'Bypass Mode';
  };

  const environmentEffects = [
    { id: 'none', label: 'mute fx' },
    { id: 'white-noise', label: 'white noise' },
    { id: 'rain', label: 'rain' },
    { id: 'ocean', label: 'ocean waves' },
    { id: 'wind', label: 'soft wind' },
    { id: 'night', label: 'night crickets' }
  ];

  const lofiGenres = [
    { id: 'none', label: 'mute music' },
    { id: 'indie-pop', label: 'indie pop' },
    { id: 'rock', label: 'soft rock' },
    { id: 'jazz', label: 'lo-fi jazz' },
    { id: 'classical', label: 'classical' },
    { id: 'ambient', label: 'ambient pad' }
  ];

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-[#0f1319] pt-20">
      
      {/* Left Viewport */}
      <div className="flex-1 relative min-h-[250px] lg:min-h-0 bg-[#0a0d14] overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5">
        <video
          ref={videoRef}
          playsInline
          muted
          className="hidden"
        />
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover transition-all duration-300"
          style={{ filter: `blur(${globalSettings.blurAmount}px)` }}
        />
        <div className="absolute top-4 left-4 bg-[#121720]/80 px-3 py-1.5 rounded-lg border border-white/5 text-[10px] tracking-wide text-gray-400 pointer-events-none">
          Isolation Shield Viewport
        </div>
      </div>

      {/* Right Controls Panel */}
      <div className="w-full lg:w-[420px] p-6 md:p-8 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-80px)] select-none">
        
        {/* Section 1: Visual Settings */}
        <div className="glass-card rounded-xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-calm-blue border-b border-white/5 pb-2">
            <Sliders className="w-4 h-4" />
            <h2 className="text-[11px] uppercase tracking-wider font-bold">Visual Settings</h2>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Dimmer Level (Brightness)</span>
              <span className="font-semibold text-white">{Math.round(globalSettings.roomBrightness * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={globalSettings.roomBrightness}
              onChange={(e) => setGlobalSettings(prev => ({ ...prev, roomBrightness: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Isolation Blur Intensity</span>
              <span className="font-semibold text-white">{globalSettings.blurAmount}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={globalSettings.blurAmount}
              onChange={(e) => setGlobalSettings(prev => ({ ...prev, blurAmount: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>

        {/* Section 2: Acoustic Isolation */}
        <div className="glass-card rounded-xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-calm-green border-b border-white/5 pb-2">
            <Volume2 className="w-4 h-4" />
            <h2 className="text-[11px] uppercase tracking-wider font-bold">Acoustic Isolation</h2>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-col text-[11px] gap-0.5">
              <span className="text-gray-400">Microphone Noise Cancellation</span>
              <span className="font-semibold text-calm-green text-[10px]">{getNoiseLevelDescription()}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={100 - Math.round(((globalSettings.noiseCancelCutoff - 250) / 1750) * 100)}
              onChange={(e) => {
                const sliderVal = parseInt(e.target.value);
                const frequencyVal = 2000 - (sliderVal / 100) * 1750;
                setGlobalSettings(prev => ({ ...prev, noiseCancelCutoff: frequencyVal }));
              }}
              className="w-full"
            />
          </div>

          <div className="space-y-2 border-t border-white/5 pt-3">
            <span className="text-[10px] text-gray-400 block mb-2 font-semibold uppercase tracking-wider">Environmental Sound Effects</span>
            <div className="grid grid-cols-3 gap-2">
              {environmentEffects.map((fx) => (
                <button
                  key={fx.id}
                  onClick={() => playEnvironmentalEffect(fx.id)}
                  className={`py-1.5 px-2 rounded-lg text-[9px] font-bold border transition-all duration-150 cursor-pointer uppercase tracking-wider ${
                    activeAudio.environmentalEffect === fx.id
                      ? 'bg-calm-blue/15 text-calm-blue border-calm-blue/30 shadow-sm'
                      : 'bg-white/3 text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {fx.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Procedural Synthesizer */}
        <div className="glass-card rounded-xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-calm-pink border-b border-white/5 pb-2">
            <Music className="w-4 h-4" />
            <h2 className="text-[11px] uppercase tracking-wider font-bold">Lo-Fi Synthesizer</h2>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-gray-400 block mb-2 font-semibold uppercase tracking-wider">Procedural Instrument Tracks</span>
            <div className="grid grid-cols-3 gap-2">
              {lofiGenres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => playLofiGenre(genre.id)}
                  className={`py-1.5 px-2 rounded-lg text-[9px] font-bold border transition-all duration-150 cursor-pointer uppercase tracking-wider ${
                    activeAudio.trackPlaying === genre.id
                      ? 'bg-calm-pink/15 text-calm-pink border-calm-pink/30 shadow-sm'
                      : 'bg-white/3 text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {genre.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Presets Profiles Manager */}
        <div className="glass-card rounded-xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-calm-green border-b border-white/5 pb-2">
            <FolderOpen className="w-4 h-4" />
            <h2 className="text-[11px] uppercase tracking-wider font-bold text-white">Save Current Shield</h2>
          </div>

          <form onSubmit={handleSavePreset} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. library focus"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              className="flex-1 bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-calm-green/40"
              maxLength={20}
              required
            />
            <button
              type="submit"
              className="bg-calm-green hover:bg-[#8ebfa0] text-[#0f1319] rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          </form>

          {saveStatus === 'success' && (
            <div className="flex items-center gap-1.5 text-calm-green text-xs py-1">
              <Check className="w-3.5 h-3.5" />
              <span>Preset saved successfully!</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-rose-400 text-xs py-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Could not connect to API server.</span>
            </div>
          )}

          {/* List of saved presets */}
          <div className="space-y-2 border-t border-white/5 pt-3">
            <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block">Saved Shield Profiles</span>
            {isLoadingPresets ? (
              <p className="text-xs text-gray-500">Loading presets...</p>
            ) : savedPresets.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No saved presets yet.</p>
            ) : (
              <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                {savedPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleLoadPreset(preset)}
                    className="w-full text-left bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-2.5 flex justify-between items-center transition-all cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{preset.spaceName}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5">
                        Blur: {preset.visualBlur}px | Noise Cutoff: {Math.round(preset.noiseCutoff)}Hz
                      </div>
                    </div>
                    <span className="text-[9px] bg-calm-green/10 text-calm-green border border-calm-green/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                      Load
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
