import React, { useEffect, useRef, useState } from 'react';
import { useSensorySpace } from '../context/SensorySpaceContext';
import { Brush, Flame, Grid3X3, Info, Sparkles } from 'lucide-react';

export default function FidgetRoom() {
  const {
    handLandmarks,
    handGesture,
    playTap,
    startBrush,
    updateBrush,
    stopBrush,
    startWaxMelting,
    stopWaxMelting
  } = useSensorySpace();

  const [activeTool, setActiveTool] = useState('brush');
  
  // Brush Canvas Ref
  const brushCanvasRef = useRef(null);
  const prevBrushPosRef = useRef({ x: 0, y: 0, time: 0 });

  // Wax Canvas Ref
  const waxCanvasRef = useRef(null);
  const waxHeightRef = useRef(180);
  const waxDripsRef = useRef([]);
  const waxFrameRef = useRef(null);

  // Keypad Grid for Tapping (re-mapped to beautiful, soft calming color classes)
  const keysGrid = [
    { label: 'C2', freq: 65.41, color: 'from-calm-blue/15 to-calm-blue/5 border-calm-blue/20 text-calm-blue hover:bg-calm-blue/10' },
    { label: 'D2', freq: 73.42, color: 'from-calm-green/15 to-calm-green/5 border-calm-green/20 text-calm-green hover:bg-calm-green/10' },
    { label: 'E2', freq: 82.41, color: 'from-calm-pink/15 to-calm-pink/5 border-calm-pink/20 text-calm-pink hover:bg-calm-pink/10' },
    { label: 'G2', freq: 98.00, color: 'from-calm-blue/15 to-calm-blue/5 border-calm-blue/20 text-calm-blue hover:bg-calm-blue/10' },
    { label: 'A2', freq: 110.00, color: 'from-calm-green/15 to-calm-green/5 border-calm-green/20 text-calm-green hover:bg-calm-green/10' },
    { label: 'C3', freq: 130.81, color: 'from-calm-pink/15 to-calm-pink/5 border-calm-pink/20 text-calm-pink hover:bg-calm-pink/10' },
    { label: 'D3', freq: 146.83, color: 'from-calm-blue/15 to-calm-blue/5 border-calm-blue/20 text-calm-blue hover:bg-calm-blue/10' },
    { label: 'E3', freq: 164.81, color: 'from-calm-green/15 to-calm-green/5 border-calm-green/20 text-calm-green hover:bg-calm-green/10' },
    { label: 'G3', freq: 196.00, color: 'from-calm-pink/15 to-calm-pink/5 border-calm-pink/20 text-calm-pink hover:bg-calm-pink/10' },
    { label: 'A3', freq: 220.00, color: 'from-calm-blue/15 to-calm-blue/5 border-calm-blue/20 text-calm-blue hover:bg-calm-blue/10' },
    { label: 'C4', freq: 261.63, color: 'from-calm-green/15 to-calm-green/5 border-calm-green/20 text-calm-green hover:bg-calm-green/10' },
    { label: 'D4', freq: 293.66, color: 'from-calm-pink/15 to-calm-pink/5 border-calm-pink/20 text-calm-pink hover:bg-calm-pink/10' }
  ];

  const [activeKeyPresses, setActiveKeyPresses] = useState({});

  // Brush Setup
  useEffect(() => {
    if (activeTool !== 'brush') {
      stopBrush();
      return;
    }

    const canvas = brushCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    ctx.fillStyle = '#0f1319';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    startBrush();

    const handleResize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      ctx.fillStyle = '#0f1319';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      stopBrush();
    };
  }, [activeTool]);

  // Track brush speed via landmarks
  useEffect(() => {
    if (activeTool !== 'brush' || !handLandmarks || handLandmarks.length <= 8) return;

    const canvas = brushCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const x = handLandmarks[8].x * canvas.width;
    const y = handLandmarks[8].y * canvas.height;
    const time = Date.now();

    const dx = x - prevBrushPosRef.current.x;
    const dy = y - prevBrushPosRef.current.y;
    const dt = time - prevBrushPosRef.current.time;

    if (dt > 10 && prevBrushPosRef.current.time > 0) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = dist / dt;

      updateBrush(Math.min(speed * 1.5, 1));

      // Draw soft brush streaks matching calm-blue
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = `rgba(127, 168, 179, ${Math.min(speed * 0.45, 0.35)})`;
      ctx.lineWidth = 15 + Math.min(speed * 25, 35);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(prevBrushPosRef.current.x, prevBrushPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Draw soft secondary calm-green glowing dust
      if (speed > 0.35) {
        ctx.fillStyle = 'rgba(124, 169, 130, 0.5)';
        ctx.beginPath();
        ctx.arc(x + (Math.random() - 0.5) * 35, y + (Math.random() - 0.5) * 35, 1.5 + Math.random() * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.fillStyle = 'rgba(15, 19, 25, 0.025)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    prevBrushPosRef.current = { x, y, time };
  }, [handLandmarks, activeTool]);

  const handleBrushMouseMove = (e) => {
    if (activeTool !== 'brush') return;
    const canvas = brushCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = Date.now();

    const dx = x - prevBrushPosRef.current.x;
    const dy = y - prevBrushPosRef.current.y;
    const dt = time - prevBrushPosRef.current.time;

    if (dt > 10 && prevBrushPosRef.current.time > 0) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = dist / dt;

      updateBrush(Math.min(speed * 1.5, 1));

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = `rgba(127, 168, 179, ${Math.min(speed * 0.35, 0.3)})`;
      ctx.lineWidth = 18 + Math.min(speed * 18, 25);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(prevBrushPosRef.current.x, prevBrushPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = 'rgba(15, 19, 25, 0.02)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    prevBrushPosRef.current = { x, y, time };
  };

  // Wax Melting Rendering
  useEffect(() => {
    if (activeTool !== 'wax') {
      stopWaxMelting();
      if (waxFrameRef.current) cancelAnimationFrame(waxFrameRef.current);
      return;
    }

    const canvas = waxCanvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const ctx = canvas.getContext('2d');
    
    const renderWax = () => {
      const w = canvas.width;
      const h = canvas.height;
      
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0f1319';
      ctx.fillRect(0, 0, w, h);

      // Calming soft pink ambient thermal glow
      ctx.save();
      const pulseTime = Date.now() * 0.002;
      const gradient = ctx.createRadialGradient(
        w / 2, h / 2 - 40, 5, 
        w / 2, h / 2 - 40, 130 + Math.sin(pulseTime) * 12
      );
      gradient.addColorStop(0, 'rgba(216, 167, 177, 0.06)'); // calm-pink
      gradient.addColorStop(0.5, 'rgba(127, 168, 179, 0.03)'); // calm-blue
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      const isPinching = handGesture.isPinching;

      if (isPinching) {
        startWaxMelting();
        if (waxHeightRef.current > 40) {
          waxHeightRef.current -= 0.12;
        }

        if (Math.random() > 0.82) {
          waxDripsRef.current.push({
            x: w / 2 + (Math.random() - 0.5) * 65,
            y: h / 2 - 40 + (180 - waxHeightRef.current),
            vy: 1.2 + Math.random() * 2.0,
            radius: 3.5 + Math.random() * 4.5,
            color: Math.random() > 0.5 ? '#d8a7b1' : '#7fa8b3', // pink / blue wax drips
            splashed: false
          });
        }
      } else {
        stopWaxMelting();
      }

      // Draw drips
      waxDripsRef.current.forEach((drip, idx) => {
        drip.y += drip.vy;

        const floorY = h - 100;
        if (drip.y >= floorY && !drip.splashed) {
          drip.splashed = true;
          drip.y = floorY;
          drip.vy = 0;
          drip.radius = drip.radius * 1.6;
        }

        if (drip.splashed) {
          drip.radius -= 0.025;
          if (drip.radius <= 0.5) {
            waxDripsRef.current.splice(idx, 1);
            return;
          }
        }

        ctx.beginPath();
        ctx.fillStyle = drip.color;
        ctx.arc(drip.x, drip.y, Math.max(1, drip.radius), 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Muted Pink Candle Body
      const candleW = 85;
      const candleH = waxHeightRef.current;
      const candleX = w / 2 - candleW / 2;
      const candleY = h / 2 - 40 + (180 - candleH);

      ctx.save();
      const candleGrad = ctx.createLinearGradient(candleX, candleY, candleX + candleW, candleY);
      candleGrad.addColorStop(0, '#c7929d'); // darker pink
      candleGrad.addColorStop(0.5, '#d8a7b1'); // calm-pink base
      candleGrad.addColorStop(1, '#ad7b85'); // darker pink
      ctx.fillStyle = candleGrad;
      
      ctx.beginPath();
      ctx.roundRect(candleX, candleY, candleW, candleH, [6, 6, 2, 2]);
      ctx.fill();

      // Melted top pool
      ctx.beginPath();
      ctx.fillStyle = '#f5d6dc'; // light pink
      ctx.ellipse(w / 2, candleY, candleW / 2, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wick
      ctx.beginPath();
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 2.5;
      ctx.moveTo(w / 2, candleY);
      ctx.lineTo(w / 2, candleY - 12);
      ctx.stroke();

      // Flicker flame (soft amber/yellow)
      ctx.beginPath();
      const flicker = Math.sin(Date.now() * 0.04) * 1.5;
      const flameGrad = ctx.createRadialGradient(
        w / 2 + flicker, candleY - 20, 1,
        w / 2 + flicker, candleY - 20, 12
      );
      flameGrad.addColorStop(0, '#fffbeb');
      flameGrad.addColorStop(0.5, '#fde047'); // soft yellow
      flameGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      
      ctx.fillStyle = flameGrad;
      ctx.moveTo(w / 2 + flicker, candleY - 12);
      ctx.quadraticCurveTo(w / 2 - 8 + flicker, candleY - 20, w / 2 + flicker, candleY - 32);
      ctx.quadraticCurveTo(w / 2 + 8 + flicker, candleY - 20, w / 2 + flicker, candleY - 12);
      ctx.fill();

      // Melted wax pile on floor
      ctx.fillStyle = '#c7929d';
      ctx.beginPath();
      ctx.ellipse(w / 2, h - 100, 75 + (180 - candleH) * 0.45, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      waxFrameRef.current = requestAnimationFrame(renderWax);
    };

    renderWax();

    return () => {
      stopWaxMelting();
      if (waxFrameRef.current) cancelAnimationFrame(waxFrameRef.current);
    };
  }, [activeTool, handGesture.isPinching]);

  const resetCandle = () => {
    waxHeightRef.current = 180;
    waxDripsRef.current = [];
  };

  const handleKeyTap = (keyIndex) => {
    const key = keysGrid[keyIndex];
    if (!key) return;

    playTap(key.freq);

    setActiveKeyPresses(prev => ({ ...prev, [keyIndex]: true }));
    setTimeout(() => {
      setActiveKeyPresses(prev => ({ ...prev, [keyIndex]: false }));
    }, 150);
  };

  // Grid keys coordinate mapping
  useEffect(() => {
    if (activeTool !== 'tap' || !handLandmarks || handLandmarks.length <= 8) return;

    const indexX = handLandmarks[8].x;
    const indexY = handLandmarks[8].y;

    if (indexX >= 0.2 && indexX <= 0.8 && indexY >= 0.25 && indexY <= 0.75) {
      const col = Math.floor(((indexX - 0.2) / 0.6) * 3);
      const row = Math.floor(((indexY - 0.25) / 0.5) * 4);
      const gridIndex = Math.min(11, Math.max(0, row * 3 + col));

      if (!activeKeyPresses[gridIndex] && Math.random() > 0.82) {
        handleKeyTap(gridIndex);
      }
    }
  }, [handLandmarks, activeTool]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f1319] pt-24 px-6 select-none">
      
      {/* Tool switcher tab selectors in calm green, blue, pink */}
      <div className="flex bg-black/25 border border-white/5 p-1 rounded-xl mb-6 z-10">
        <button
          onClick={() => setActiveTool('brush')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
            activeTool === 'brush'
              ? 'bg-calm-blue/15 text-calm-blue border border-calm-blue/20'
              : 'text-gray-400 hover:text-white border border-transparent'
          }`}
        >
          <Brush className="w-3.5 h-3.5" />
          Fabric Brush
        </button>

        <button
          onClick={() => setActiveTool('wax')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
            activeTool === 'wax'
              ? 'bg-calm-pink/15 text-calm-pink border border-calm-pink/20'
              : 'text-gray-400 hover:text-white border border-transparent'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Wax Melting
        </button>

        <button
          onClick={() => setActiveTool('tap')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
            activeTool === 'tap'
              ? 'bg-calm-green/15 text-calm-green border border-calm-green/20'
              : 'text-gray-400 hover:text-white border border-transparent'
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          Tapping Pad
        </button>
      </div>

      {/* Main interaction space */}
      <div className="flex-1 w-full max-w-4xl glass-panel rounded-2xl border border-white/5 shadow-xl relative overflow-hidden flex flex-col justify-between mb-8 min-h-[350px]">
        
        {/* Brush Mode */}
        {activeTool === 'brush' && (
          <div className="absolute inset-0 w-full h-full">
            <canvas
              ref={brushCanvasRef}
              onMouseMove={handleBrushMouseMove}
              onMouseLeave={stopBrush}
              onMouseEnter={startBrush}
              className="w-full h-full cursor-crosshair"
            />
            <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[10px] text-gray-500 pointer-events-none">
              <Info className="w-3.5 h-3.5" />
              <span>Drag your pointer across the canvas to synthesize fabric-brush sounds.</span>
            </div>
          </div>
        )}

        {/* Wax Melting Mode */}
        {activeTool === 'wax' && (
          <div className="absolute inset-0 w-full h-full flex flex-col">
            <canvas
              ref={waxCanvasRef}
              className="w-full h-full flex-1"
            />
            
            <div className="absolute bottom-4 right-4 z-10 flex gap-2">
              <button
                onClick={resetCandle}
                className="bg-white/5 hover:bg-white/10 border border-white/5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold text-white transition-colors cursor-pointer uppercase tracking-wider"
              >
                Reset Candle
              </button>
            </div>

            <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[10px] text-gray-500 pointer-events-none">
              <Info className="w-3.5 h-3.5" />
              <span>Hold left-click or press [Spacebar] to melt the wax candle.</span>
            </div>
          </div>
        )}

        {/* Tapping Pad */}
        {activeTool === 'tap' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-black/15">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3.5 max-w-xl w-full p-4">
              {keysGrid.map((key, index) => {
                const isPressed = activeKeyPresses[index];
                return (
                  <button
                    key={index}
                    onClick={() => handleKeyTap(index)}
                    className={`h-20 rounded-xl border-b-4 font-bold flex flex-col items-center justify-center transition-all duration-75 cursor-pointer relative bg-gradient-to-b ${key.color} ${
                      isPressed
                        ? 'translate-y-1 border-b-0 opacity-90 scale-98 shadow-sm'
                        : 'hover:scale-[1.01] active:translate-y-1 active:border-b-0'
                    }`}
                  >
                    <span className="text-white text-xs tracking-wider font-extrabold">{key.label}</span>
                    <span className="text-[8px] text-gray-400 mt-0.5">{Math.round(key.freq)} Hz</span>
                  </button>
                );
              })}
            </div>

            <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[10px] text-gray-500 pointer-events-none">
              <Info className="w-3.5 h-3.5" />
              <span>Click or tap the switches directly to hear damped sine-wave tones.</span>
            </div>
          </div>
        )}

        {/* Footer HUD */}
        <div className="h-9 bg-black/20 border-t border-white/5 px-5 flex items-center justify-between text-[9px] text-gray-500 pointer-events-none z-10">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-calm-pink" />
            <span>Interactive ASMR sandbox environment</span>
          </div>
          <div>
            {handGesture.isPinching && activeTool === 'wax' && (
              <span className="text-calm-pink font-bold uppercase tracking-wider animate-pulse">Pinch Active: Melting Candle...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
