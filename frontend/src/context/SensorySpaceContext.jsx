/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef } from 'react';

const SensorySpaceContext = createContext();

export const useSensorySpace = () => {
  const context = useContext(SensorySpaceContext);
  if (!context) {
    throw new Error('useSensorySpace must be used within a SensorySpaceProvider');
  }
  return context;
};

export const SensorySpaceProvider = ({ children }) => {
  // 1. Room & Settings State
  const [currentRoom, setCurrentRoom] = useState('deep-sea'); // 'deep-sea' | 'customizable' | 'fidget-space'
  const [globalSettings, setGlobalSettings] = useState({
    blurAmount: 12,        // px
    roomBrightness: 0.8,   // 0.0 to 1.0 multiplier
    noiseCancelCutoff: 1000 // Hz, mapped from noise slider
  });
  const [activeAudio, setActiveAudio] = useState({
    trackPlaying: 'none',        // 'none' | 'indie-pop' | 'rock' | 'jazz' | 'classical' | 'ambient'
    environmentalEffect: 'none'  // 'none' | 'rain' | 'ocean' | 'wind' | 'night' | 'white-noise'
  });
  const [fidgetTool, setFidgetTool] = useState('none'); // 'none' | 'brush' | 'wax' | 'tap'
  
  // Hand Landmarks representation: MediaPipe layout (0-20). We'll initialize with default values.
  // landmark 8 = index finger tip, landmark 4 = thumb tip, landmark 0 = wrist/palm
  const [handLandmarks, setHandLandmarks] = useState([]);
  const [handGesture, setHandGesture] = useState({
    isPinching: false,
    isFlat: true,
    velocity: 0
  });

  // Media Streams & Web Audio API Refs
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [videoElement, setVideoElement] = useState(null);
  const [micVolume, setMicVolume] = useState(0); // for visualizer feedback
  const [webcamStream, setWebcamStream] = useState(null);

  const webcamStreamRef = useRef(null);
  const micStreamRef = useRef(null);

  // Audio Context & Synth Node Refs
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  
  // Microphone nodes
  const micSourceRef = useRef(null);
  const micFilterRef = useRef(null);
  const micAnalyserRef = useRef(null);
  
  // Ambient Sound nodes
  const ambientNoiseSourceRef = useRef(null);
  const ambientFilterRef = useRef(null);
  const ambientGainRef = useRef(null);
  const ambientLfoRef = useRef(null);
  const ambientLfoGainRef = useRef(null);
  const nightIntervalRef = useRef(null);

  // Fidget Brush nodes
  const brushNoiseSourceRef = useRef(null);
  const brushFilterRef = useRef(null);
  const brushGainRef = useRef(null);
  const brushPannerRef = useRef(null);

  // Fidget Wax nodes
  const waxIntervalRef = useRef(null);

  // Lo-Fi Sequencer Refs
  const sequencerIntervalRef = useRef(null);
  const seqBeatCountRef = useRef(0);



  // Monitor settings changes and update real-time audio nodes
  useEffect(() => {
    if (audioCtxRef.current && masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(globalSettings.roomBrightness, audioCtxRef.current.currentTime, 0.05);
    }
  }, [globalSettings.roomBrightness]);

  useEffect(() => {
    if (audioCtxRef.current && micFilterRef.current) {
      micFilterRef.current.frequency.setTargetAtTime(globalSettings.noiseCancelCutoff, audioCtxRef.current.currentTime, 0.1);
    }
  }, [globalSettings.noiseCancelCutoff]);

  const stopStreams = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(t => t.stop());
      webcamStreamRef.current = null;
      setWebcamStream(null);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    setIsWebcamActive(false);
    setIsMicActive(false);
  };

  const stopAllAudio = () => {
    if (nightIntervalRef.current) clearInterval(nightIntervalRef.current);
    if (waxIntervalRef.current) clearInterval(waxIntervalRef.current);
    if (sequencerIntervalRef.current) clearInterval(sequencerIntervalRef.current);

    if (ambientNoiseSourceRef.current) {
      try { ambientNoiseSourceRef.current.stop(); } catch { /* already stopped */ }
      ambientNoiseSourceRef.current = null;
    }
    if (ambientLfoRef.current) {
      try { ambientLfoRef.current.stop(); } catch { /* already stopped */ }
      ambientLfoRef.current = null;
    }
    if (brushNoiseSourceRef.current) {
      try { brushNoiseSourceRef.current.stop(); } catch { /* already stopped */ }
      brushNoiseSourceRef.current = null;
    }
  };

  // Clean up all audio on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      stopStreams();
    };
  }, []);

  // Helper: Create a White Noise AudioBuffer
  const createNoiseBuffer = () => {
    if (!audioCtxRef.current) return null;
    const bufferSize = audioCtxRef.current.sampleRate * 2; // 2 seconds of noise
    const buffer = audioCtxRef.current.createBuffer(1, bufferSize, audioCtxRef.current.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  // Initial setup: Activate Shield
  const activateSensoryShield = async () => {
    if (isShieldActive) return;

    try {
      // 1. Initialize Web Audio Context
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Create Master Gain node for brightness / master volume control
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(globalSettings.roomBrightness, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // 2. Request Camera
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false
        });
        webcamStreamRef.current = videoStream;
        setWebcamStream(videoStream);
        setIsWebcamActive(true);
      } catch (camErr) {
        console.warn('Camera permission denied or unavailable:', camErr);
      }

      // 3. Request Microphone
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
          video: false
        });
        micStreamRef.current = audioStream;
        setIsMicActive(true);

        // Pipe microphone to lowpass filter node
        const source = ctx.createMediaStreamSource(audioStream);
        micSourceRef.current = source;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(globalSettings.noiseCancelCutoff, ctx.currentTime);
        filter.Q.setValueAtTime(1, ctx.currentTime);
        micFilterRef.current = filter;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        micAnalyserRef.current = analyser;

        // Route: Mic -> Filter -> Analyser -> Master Gain
        source.connect(filter);
        filter.connect(analyser);
        analyser.connect(masterGain);

        // Micro-loop to fetch real-time mic volume for dashboard visualizer
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVolume = () => {
          if (!micAnalyserRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          setMicVolume(average / 128); // normalize roughly
          requestAnimationFrame(updateVolume);
        };
        updateVolume();

      } catch (micErr) {
        console.warn('Microphone permission denied or unavailable:', micErr);
      }

      // Resume context if suspended (browser security)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      setIsShieldActive(true);
      return true;
    } catch (e) {
      console.error('Error activating sensory shield:', e);
      return false;
    }
  };

  // ----------------------------------------------------
  // ASMR / Sound Effects Synthesizer Section
  // ----------------------------------------------------

  // Synthesize a brief pop sound (Deep Sea room / fidget pops)
  const playPop = (freq = 150) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Quick pitch sweep oscillator
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(masterGainRef.current);
    
    // Pop characteristics: quick rising pitch, extremely fast decay
    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 2.5, now + 0.05);
    
    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    osc.start(now);
    osc.stop(now + 0.1);
  };

  // Synthesize mechanical keyboard damped tap (Fidget room Tapping Pad)
  const playTap = (baseFreq = 120) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    // Resonant damped sine wave simulation
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.05);

    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    // Combine with a little crackle of noise for the mechanical keyboard "clack"
    const clickNoise = ctx.createBufferSource();
    clickNoise.buffer = createNoiseBuffer();
    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(2500, now);
    clickFilter.Q.setValueAtTime(3, now);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.03, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);

    clickNoise.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(masterGainRef.current);

    osc.connect(gainNode);
    gainNode.connect(masterGainRef.current);

    osc.start(now);
    clickNoise.start(now);

    osc.stop(now + 0.1);
    clickNoise.stop(now + 0.05);
  };

  // Fidget Brush Sound: swept highpass noise with stereo panner
  const startBrush = () => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    if (brushNoiseSourceRef.current) return; // already running

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer();
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.Q.setValueAtTime(1, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now); // start silent

    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(0, now);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(masterGainRef.current);
      brushPannerRef.current = panner;
    } else {
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGainRef.current);
    }

    noise.start(now);

    brushNoiseSourceRef.current = noise;
    brushFilterRef.current = filter;
    brushGainRef.current = gain;
  };

  const updateBrush = (speed, pan = 0) => {
    if (!audioCtxRef.current || !brushFilterRef.current || !brushGainRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    
    // Normalize speed (0 to 1) and map to sweeping filter cutoff and gain
    const gainVal = Math.min(speed * 0.18, 0.25); // max volume
    const filterFreq = 1200 + (speed * 4200); // 1200Hz to 5400Hz

    brushGainRef.current.gain.setTargetAtTime(gainVal, now, 0.05);
    brushFilterRef.current.frequency.setTargetAtTime(filterFreq, now, 0.08);

    if (brushPannerRef.current) {
      brushPannerRef.current.pan.setTargetAtTime(pan, now, 0.05);
    }
  };

  const stopBrush = () => {
    if (brushNoiseSourceRef.current) {
      try {
        brushNoiseSourceRef.current.stop();
      } catch { /* already stopped */ }
      brushNoiseSourceRef.current = null;
      brushFilterRef.current = null;
      brushGainRef.current = null;
      brushPannerRef.current = null;
    }
  };

  // High-quality Tapping Chime synthesizer (FM/Additive hybrid)
  const playNiceChime = (freq, type = 'chime') => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(masterGainRef.current);

    if (type === 'chime') {
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 3.01, now); // slightly detuned harmonic for metallic ring

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.08, now + 0.004);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.7);
      osc2.stop(now + 0.7);
    } else if (type === 'kalimba') {
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.0, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.003);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      // Add a tiny pluck noise burst at start
      const click = ctx.createBufferSource();
      click.buffer = createNoiseBuffer();
      const clickFilter = ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(3200, now);
      clickFilter.Q.setValueAtTime(5, now);
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.02, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

      click.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(masterGainRef.current);

      click.start(now);
      click.stop(now + 0.02);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } else if (type === 'woodblock') {
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq * 1.4, now);
      osc1.frequency.exponentialRampToValueAtTime(freq * 0.75, now + 0.035);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.16, now + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc1.start(now);
      osc1.stop(now + 0.1);
    }
  };

  // Wax Cracking crunchy snaps sound effect
  const playCrackingSound = (intensity = 0.5) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    const snaps = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < snaps; i++) {
      const snapTime = now + i * (0.012 + Math.random() * 0.025);
      
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer();
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800 + Math.random() * 3800, snapTime);
      filter.Q.setValueAtTime(5, snapTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, snapTime);
      gain.gain.linearRampToValueAtTime(0.05 * intensity, snapTime + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, snapTime + 0.005 + Math.random() * 0.008);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGainRef.current);

      noise.start(snapTime);
      noise.stop(snapTime + 0.03);
    }
  };

  // Squeaking/Squelching Squishy sound effect
  const playSquishSound = (intensity = 0.5) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    // Pitch sweep lowpass noise
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer();

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, now);
    filter.frequency.exponentialRampToValueAtTime(140, now + 0.15);
    filter.Q.setValueAtTime(1.2, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.04 * intensity, now + 0.025);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGainRef.current);

    noise.start(now);
    noise.stop(now + 0.2);
  };

  // Wax Melting: granular snaps/crackles
  const startWaxMelting = () => {
    if (waxIntervalRef.current) return;
    if (!audioCtxRef.current || !masterGainRef.current) return;

    const ctx = audioCtxRef.current;

    // Trigger crackling sounds at randomized fast intervals
    waxIntervalRef.current = setInterval(() => {
      // Add random chance of pop to sound granular and irregular
      if (Math.random() > 0.4) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(masterGainRef.current);
        
        osc.type = 'sine';
        // High frequency snaps
        const freq = 3000 + Math.random() * 4000;
        osc.frequency.setValueAtTime(freq, now);
        
        gainNode.gain.setValueAtTime(0.0, now);
        gainNode.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.05, now + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.005 + Math.random() * 0.01);
        
        osc.start(now);
        osc.stop(now + 0.03);
      }
    }, 40);
  };

  const stopWaxMelting = () => {
    if (waxIntervalRef.current) {
      clearInterval(waxIntervalRef.current);
      waxIntervalRef.current = null;
    }
  };

  // ----------------------------------------------------
  // Environmental Ambient Synthesizers
  // ----------------------------------------------------
  const playEnvironmentalEffect = (effect) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Stop active environmental nodes
    if (ambientNoiseSourceRef.current) {
      try { ambientNoiseSourceRef.current.stop(); } catch { /* already stopped */ }
      ambientNoiseSourceRef.current = null;
    }
    if (ambientLfoRef.current) {
      try { ambientLfoRef.current.stop(); } catch { /* already stopped */ }
      ambientLfoRef.current = null;
    }
    if (nightIntervalRef.current) {
      clearInterval(nightIntervalRef.current);
      nightIntervalRef.current = null;
    }

    setActiveAudio(prev => ({ ...prev, environmentalEffect: effect }));
    if (effect === 'none') return;

    const now = ctx.currentTime;
    
    // Create base nodes
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer();
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainRef.current);

    ambientNoiseSourceRef.current = noise;
    ambientFilterRef.current = filter;
    ambientGainRef.current = gain;

    switch (effect) {
      case 'white-noise':
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now); // soft white/pink-ish noise
        gain.gain.setValueAtTime(0.08, now);
        noise.start(now);
        break;

      case 'rain':
        // Highpass & Lowpass crackly noise
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.Q.setValueAtTime(0.8, now);
        gain.gain.setValueAtTime(0.06, now);
        noise.start(now);

        // Schedule random small drops using a fast interval modulator
        nightIntervalRef.current = setInterval(() => {
          if (Math.random() > 0.6) {
            const drop = ctx.createOscillator();
            const dropGain = ctx.createGain();
            drop.connect(dropGain);
            dropGain.connect(masterGainRef.current);
            
            drop.type = 'sine';
            drop.frequency.setValueAtTime(1500 + Math.random() * 1000, ctx.currentTime);
            
            dropGain.gain.setValueAtTime(0, ctx.currentTime);
            dropGain.gain.linearRampToValueAtTime(0.005, ctx.currentTime + 0.002);
            dropGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02);
            
            drop.start();
            drop.stop(ctx.currentTime + 0.05);
          }
        }, 100);
        break;

      case 'ocean': {
        // Noise with an LFO modulating the gain slowly (4-6s swell cycle)
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);
        gain.gain.setValueAtTime(0.05, now);

        const oceanLfo = ctx.createOscillator();
        oceanLfo.type = 'sine';
        oceanLfo.frequency.setValueAtTime(0.15, now); // ~6.6 seconds cycle

        const oceanLfoGain = ctx.createGain();
        oceanLfoGain.gain.setValueAtTime(0.04, now); // modulation depth

        oceanLfo.connect(oceanLfoGain);
        oceanLfoGain.connect(gain.gain); // Modulate gain
        
        oceanLfo.start(now);
        noise.start(now);

        ambientLfoRef.current = oceanLfo;
        ambientLfoGainRef.current = oceanLfoGain;
        break;
      }

      case 'wind': {
        // Deep brown/pink noise with sweeping bandpass filter
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.Q.setValueAtTime(2.0, now); // highly resonant
        gain.gain.setValueAtTime(0.08, now);

        // Sweeping filter LFO
        const windLfo = ctx.createOscillator();
        windLfo.type = 'sine';
        windLfo.frequency.setValueAtTime(0.08, now); // ~12s cycle

        const windLfoGain = ctx.createGain();
        windLfoGain.gain.setValueAtTime(180, now); // frequency modulation range (+/- 180Hz)

        windLfo.connect(windLfoGain);
        windLfoGain.connect(filter.frequency); // Modulate filter frequency

        windLfo.start(now);
        noise.start(now);

        ambientLfoRef.current = windLfo;
        ambientLfoGainRef.current = windLfoGain;
        break;
      }

      case 'night': {
        // Crickets chirping procedurally, background low hum
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, now);
        gain.gain.setValueAtTime(0.04, now); // low room rumble
        noise.start(now);

        // Crickets
        const playCricketChirp = () => {
          const chirpTime = ctx.currentTime;
          // Crickets chirp in sets of 3 or 4 quick pulses
          const pulses = 3 + Math.floor(Math.random() * 2);
          for (let i = 0; i < pulses; i++) {
            const timeOffset = chirpTime + (i * 0.06);
            
            const cricketOsc = ctx.createOscillator();
            const cricketGain = ctx.createGain();
            
            cricketOsc.connect(cricketGain);
            cricketGain.connect(masterGainRef.current);
            
            cricketOsc.type = 'sine';
            cricketOsc.frequency.setValueAtTime(3800 + Math.random() * 200, timeOffset);
            
            // Rapid pulse envelope
            cricketGain.gain.setValueAtTime(0, timeOffset);
            cricketGain.gain.linearRampToValueAtTime(0.008, timeOffset + 0.01);
            cricketGain.gain.exponentialRampToValueAtTime(0.0001, timeOffset + 0.04);
            
            cricketOsc.start(timeOffset);
            cricketOsc.stop(timeOffset + 0.05);
          }
        };

        // Chirp every 1.5 to 3 seconds
        nightIntervalRef.current = setInterval(() => {
          if (Math.random() > 0.3) {
            playCricketChirp();
          }
        }, 1200);
        break;
      }

      default:
        break;
    }
  };

  // ----------------------------------------------------
  // Procedural Lo-Fi Music Generator (Chord Sequencer)
  // ----------------------------------------------------
  const playLofiGenre = (genre) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;

    // Stop current sequencer if running
    if (sequencerIntervalRef.current) {
      clearInterval(sequencerIntervalRef.current);
      sequencerIntervalRef.current = null;
    }

    setActiveAudio(prev => ({ ...prev, trackPlaying: genre }));
    if (genre === 'none') return;

    seqBeatCountRef.current = 0;

    // Genre-specific configurations (BPM, Chords, Synth style)
    let bpm = 72; // slow lo-fi tempo
    let chordProgression = [];

    // Chords defined as frequencies (Hz)
    // Cmaj7 (C3, E3, G3, B3): [130.81, 164.81, 196.00, 246.94]
    // Am9 (A2, C3, E3, G3, B3): [110.00, 130.81, 164.81, 196.00, 246.94]
    // Dm7 (D3, F3, A3, C4): [146.83, 174.61, 220.00, 261.63]
    // G7sus4 / G7 (G2, D3, F3, B3): [98.00, 146.83, 174.61, 246.94]
    const chordPacks = {
      'jazz': [
        [110.00, 164.81, 196.00, 246.94, 293.66], // Am9
        [146.83, 174.61, 220.00, 261.63, 311.13], // Dm9
        [98.00, 146.83, 174.61, 246.94, 293.66],  // G9
        [130.81, 164.81, 196.00, 246.94, 329.63]  // Cmaj9
      ],
      'ambient': [
        [65.41, 130.81, 196.00, 293.66, 392.00],  // C2/C3/G3/D4/G4 open chord
        [87.31, 174.61, 220.00, 329.63, 440.00],  // F2/F3/A3/E4/A4 open chord
        [73.42, 146.83, 220.00, 293.66, 440.00],  // D2/D3/A3/D4/A4 open chord
        [98.00, 196.00, 246.94, 293.66, 392.00]   // G2/G3/B3/D4/G4 open chord
      ],
      'classical': [
        [130.81, 196.00, 261.63, 329.63], // C major arpeggio
        [146.83, 220.00, 293.66, 349.23], // D minor arpeggio
        [164.81, 246.94, 329.63, 392.00], // E minor arpeggio
        [130.81, 174.61, 261.63, 349.23]  // F major arpeggio
      ],
      'indie-pop': [
        [130.81, 164.81, 196.00, 246.94], // Cmaj7
        [174.61, 220.00, 261.63, 329.63], // Fmaj7
        [164.81, 196.00, 246.94, 329.63], // Em7
        [146.83, 174.61, 220.00, 261.63]  // Dm7
      ],
      'rock': [
        [110.00, 164.81, 220.00], // A power chord
        [146.83, 220.00, 293.66], // D power chord
        [98.00, 146.83, 196.00],  // G power chord
        [130.81, 196.00, 261.63]  // C power chord
      ]
    };

    chordProgression = chordPacks[genre] || chordPacks['ambient'];
    const stepDuration = 60 / bpm / 2; // eighth notes

    // Evolve Sequencer Loop
    const scheduleNextBeat = () => {
      const now = ctx.currentTime;
      const step = seqBeatCountRef.current;
      const measure = Math.floor(step / 8) % 4; // 8 steps per chord measure
      const beatInMeasure = step % 8;

      const currentChord = chordProgression[measure];

      // 1. Play Soft Pad Chord on step 0
      if (beatInMeasure === 0) {
        currentChord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          const pFilter = ctx.createBiquadFilter();

          osc.type = genre === 'rock' ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          pFilter.type = 'lowpass';
          // Filter sweeps for ambient, stays low for jazz, is slightly brighter for indie
          const filterCutoff = genre === 'ambient' ? 300 : genre === 'rock' ? 450 : 600;
          pFilter.frequency.setValueAtTime(filterCutoff, now);
          pFilter.Q.setValueAtTime(1, now);

          // Evolving volume envelope for soft lo-fi pad
          gainNode.gain.setValueAtTime(0, now);
          // Slow attack
          gainNode.gain.linearRampToValueAtTime(genre === 'ambient' ? 0.025 : 0.04, now + 1.2);
          // Evolve decay
          gainNode.gain.setValueAtTime(genre === 'ambient' ? 0.025 : 0.04, now + 2.5);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + stepDuration * 7.8);

          osc.connect(pFilter);
          pFilter.connect(gainNode);
          gainNode.connect(masterGainRef.current);

          osc.start(now);
          osc.stop(now + stepDuration * 8.0);
        });
      }

      // 2. Play Beats (Ambient & Classical have NO harsh drums, just soft heartbeat/taps)
      const playDrum = (type) => {
        if (type === 'kick') {
          const kickOsc = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kickOsc.connect(kickGain);
          kickGain.connect(masterGainRef.current);

          kickOsc.frequency.setValueAtTime(120, now);
          kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

          kickGain.gain.setValueAtTime(0.2, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          kickOsc.start(now);
          kickOsc.stop(now + 0.15);
        } else if (type === 'snare') {
          // Noise snare
          const snareNoise = ctx.createBufferSource();
          snareNoise.buffer = createNoiseBuffer();
          const snareFilter = ctx.createBiquadFilter();
          snareFilter.type = 'bandpass';
          snareFilter.frequency.setValueAtTime(1000, now);

          const snareGain = ctx.createGain();
          snareGain.gain.setValueAtTime(0.06, now);
          snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

          snareNoise.connect(snareFilter);
          snareFilter.connect(snareGain);
          snareGain.connect(masterGainRef.current);

          snareNoise.start(now);
          snareNoise.stop(now + 0.15);
        } else if (type === 'hat') {
          // Closed hat
          const hatNoise = ctx.createBufferSource();
          hatNoise.buffer = createNoiseBuffer();
          const hatFilter = ctx.createBiquadFilter();
          hatFilter.type = 'highpass';
          hatFilter.frequency.setValueAtTime(7000, now);

          const hatGain = ctx.createGain();
          hatGain.gain.setValueAtTime(0.02, now);
          hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

          hatNoise.connect(hatFilter);
          hatFilter.connect(hatGain);
          hatGain.connect(masterGainRef.current);

          hatNoise.start(now);
          hatNoise.stop(now + 0.04);
        }
      };

      // Apply drum patterns based on genre
      if (genre !== 'ambient' && genre !== 'classical') {
        // Indie Pop / Rock / Jazz drums
        // Beat indices: 0, 1, 2, 3, 4, 5, 6, 7 (eighth notes)
        // Standard Boom-Clack: Kick on 0, 4, Snare on 2, 6, Hats on 1, 3, 5, 7
        if (beatInMeasure === 0 || beatInMeasure === 3) {
          playDrum('kick');
        }
        if (beatInMeasure === 4) {
          playDrum('snare');
        }
        if (beatInMeasure % 2 === 1) {
          playDrum('hat');
        }
      } else if (genre === 'ambient') {
        // Slow soft deep pulse on 0
        if (beatInMeasure === 0) {
          const kickOsc = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kickOsc.connect(kickGain);
          kickGain.connect(masterGainRef.current);

          kickOsc.frequency.setValueAtTime(60, now);
          kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

          kickGain.gain.setValueAtTime(0.08, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

          kickOsc.start(now);
          kickOsc.stop(now + 0.3);
        }
      }

      // 3. Play Random Lead Arpeggio Melody
      // Jazz, Classical, and Ambient have sweet melodic notes playing occasionally
      if (genre === 'jazz' && (beatInMeasure === 2 || beatInMeasure === 5 || beatInMeasure === 7)) {
        if (Math.random() > 0.4) {
          // Play a note from the chord shifted up an octave
          const baseNote = currentChord[Math.floor(Math.random() * currentChord.length)];
          const melodyFreq = baseNote * 2.0;

          const melOsc = ctx.createOscillator();
          const melGain = ctx.createGain();
          const melFilter = ctx.createBiquadFilter();

          melOsc.type = 'triangle';
          melOsc.frequency.setValueAtTime(melodyFreq, now);

          melFilter.type = 'lowpass';
          melFilter.frequency.setValueAtTime(800, now);

          melGain.gain.setValueAtTime(0, now);
          melGain.gain.linearRampToValueAtTime(0.02, now + 0.05);
          melGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

          melOsc.connect(melFilter);
          melFilter.connect(melGain);
          melGain.connect(masterGainRef.current);

          melOsc.start(now);
          melOsc.stop(now + 0.5);
        }
      } else if (genre === 'classical') {
        // Arpeggiate chord notes consecutively based on beat
        const noteIdx = beatInMeasure % currentChord.length;
        const melodyFreq = currentChord[noteIdx] * 2.0; // arpeggiate one octave up

        const melOsc = ctx.createOscillator();
        const melGain = ctx.createGain();
        
        melOsc.type = 'sine';
        melOsc.frequency.setValueAtTime(melodyFreq, now);

        melGain.gain.setValueAtTime(0, now);
        melGain.gain.linearRampToValueAtTime(0.025, now + 0.01);
        melGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

        melOsc.connect(melGain);
        melGain.connect(masterGainRef.current);

        melOsc.start(now);
        melOsc.stop(now + 0.4);
      } else if (genre === 'indie-pop' && (beatInMeasure === 3 || beatInMeasure === 6)) {
        // Bright bell-like synth tap
        const melodyFreq = currentChord[Math.floor(Math.random() * currentChord.length)] * 4.0; // two octaves up

        const melOsc = ctx.createOscillator();
        const melGain = ctx.createGain();
        
        melOsc.type = 'sine';
        melOsc.frequency.setValueAtTime(melodyFreq, now);

        melGain.gain.setValueAtTime(0, now);
        melGain.gain.linearRampToValueAtTime(0.03, now + 0.005);
        melGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        melOsc.connect(melGain);
        melGain.connect(masterGainRef.current);

        melOsc.start(now);
        melOsc.stop(now + 0.2);
      }

      seqBeatCountRef.current++;
    };

    // Run the scheduler immediately, then loop every stepDuration ms
    scheduleNextBeat();
    sequencerIntervalRef.current = setInterval(scheduleNextBeat, stepDuration * 1000);
  };

  // State update helper for hand landmarks
  const updateHandLandmarks = (landmarks, gestureInfo = {}) => {
    setHandLandmarks(landmarks);
    setHandGesture(prev => ({
      ...prev,
      ...gestureInfo
    }));
  };

  return (
    <SensorySpaceContext.Provider value={{
      currentRoom,
      setCurrentRoom,
      globalSettings,
      setGlobalSettings,
      activeAudio,
      fidgetTool,
      setFidgetTool,
      handLandmarks,
      updateHandLandmarks,
      handGesture,
      
      // Control flags
      isShieldActive,
      isWebcamActive,
      isMicActive,
      micVolume,
      videoElement,
      setVideoElement,
      webcamStream,
      
      // Action methods
      activateSensoryShield,
      stopStreams,
      
      // Synthesizer hooks
      playPop,
      playTap,
      startBrush,
      updateBrush,
      stopBrush,
      startWaxMelting,
      stopWaxMelting,
      playEnvironmentalEffect,
      playLofiGenre,
      playNiceChime,
      playCrackingSound,
      playSquishSound
    }}>
      {children}
    </SensorySpaceContext.Provider>
  );
};
