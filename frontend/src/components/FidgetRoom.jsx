import React, { useEffect, useRef, useState } from 'react';
import { useSensorySpace } from '../context/SensorySpaceContext';
import { Brush, Flame, Grid3X3, Info, Sparkles, RefreshCw, Volume2 } from 'lucide-react';

export default function FidgetRoom() {
  const {
    handLandmarks,
    handGesture,
    startBrush,
    updateBrush,
    stopBrush,
    playNiceChime,
    playCrackingSound,
    playSquishSound
  } = useSensorySpace();

  const [activeTool, setActiveTool] = useState('squish'); // 'squish' | 'brush' | 'tap'
  const [soundType, setSoundType] = useState('kalimba'); // 'kalimba' | 'chime' | 'woodblock'
  
  // Immersive Background Canvas Ref
  const bgCanvasRef = useRef(null);
  const bgBubblesRef = useRef([]);

  // Squishies State
  const squishyCanvasRef = useRef(null);
  const squishiesRef = useRef([]);
  const activeSquishIndexRef = useRef(null);

  // Brush Microphone Canvas Ref
  const brushCanvasRef = useRef(null);
  const isBrushingRef = useRef(false);

  // Keypad Grid for Tapping
  const keysGrid = [
    { label: 'C3', freq: 130.81, color: 'from-calm-blue/15 to-calm-blue/5 border-calm-blue/20 text-calm-blue hover:bg-calm-blue/10' },
    { label: 'D3', freq: 146.83, color: 'from-calm-green/15 to-calm-green/5 border-calm-green/20 text-calm-green hover:bg-calm-green/10' },
    { label: 'E3', freq: 164.81, color: 'from-calm-pink/15 to-calm-pink/5 border-calm-pink/20 text-calm-pink hover:bg-calm-pink/10' },
    { label: 'G3', freq: 196.00, color: 'from-calm-blue/15 to-calm-blue/5 border-calm-blue/20 text-calm-blue hover:bg-calm-blue/10' },
    { label: 'A3', freq: 220.00, color: 'from-calm-green/15 to-calm-green/5 border-calm-green/20 text-calm-green hover:bg-calm-green/10' },
    { label: 'C4', freq: 261.63, color: 'from-calm-pink/15 to-calm-pink/5 border-calm-pink/20 text-calm-pink hover:bg-calm-pink/10' },
    { label: 'D4', freq: 293.66, color: 'from-calm-blue/15 to-calm-blue/5 border-calm-blue/20 text-calm-blue hover:bg-calm-blue/10' },
    { label: 'E4', freq: 329.63, color: 'from-calm-green/15 to-calm-green/5 border-calm-green/20 text-calm-green hover:bg-calm-green/10' },
    { label: 'G4', freq: 392.00, color: 'from-calm-pink/15 to-calm-pink/5 border-calm-pink/20 text-calm-pink hover:bg-calm-pink/10' },
    { label: 'A4', freq: 440.00, color: 'from-calm-blue/15 to-calm-blue/5 border-calm-blue/20 text-calm-blue hover:bg-calm-blue/10' },
    { label: 'C5', freq: 523.25, color: 'from-calm-green/15 to-calm-green/5 border-calm-green/20 text-calm-green hover:bg-calm-green/10' },
    { label: 'E5', freq: 659.25, color: 'from-calm-pink/15 to-calm-pink/5 border-calm-pink/20 text-calm-pink hover:bg-calm-pink/10' }
  ];

  const [activeKeyPresses, setActiveKeyPresses] = useState({});

  // 1. Immersive Deep-Sea Background Loop
  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext('2d');
    
    const handleResize = () => {
      bgCanvas.width = bgCanvas.parentElement.clientWidth;
      bgCanvas.height = bgCanvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Spawn slow background bubbles
    bgBubblesRef.current = Array.from({ length: 25 }, () => ({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height + 50,
      radius: 2 + Math.random() * 5,
      speedY: 0.15 + Math.random() * 0.3,
      wobbleOffset: Math.random() * 100,
      wobbleSpeed: 0.005 + Math.random() * 0.01
    }));

    let animationId;
    const renderBg = () => {
      const w = bgCanvas.width;
      const h = bgCanvas.height;

      // Deep ocean gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, '#060a0f');
      gradient.addColorStop(1, '#0e1520');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Bioluminescent background lighting swells
      const pulseTime = Date.now() * 0.0006;
      ctx.save();
      const glowGrad = ctx.createRadialGradient(
        w / 2 + Math.sin(pulseTime) * 120, h / 2, 50, 
        w / 2 + Math.sin(pulseTime) * 120, h / 2, Math.max(w, h) * 0.65
      );
      glowGrad.addColorStop(0, 'rgba(143, 185, 196, 0.05)'); // serene blue
      glowGrad.addColorStop(0.5, 'rgba(230, 176, 186, 0.03)'); // serene pink
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // Render bubbles
      bgBubblesRef.current.forEach(bubble => {
        bubble.wobbleOffset += bubble.wobbleSpeed;
        bubble.x += Math.sin(bubble.wobbleOffset) * 0.08;
        bubble.y -= bubble.speedY;

        if (bubble.y < -bubble.radius) {
          bubble.y = h + 10;
          bubble.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(143, 185, 196, 0.12)';
        ctx.lineWidth = 1;
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      animationId = requestAnimationFrame(renderBg);
    };

    renderBg();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // 2. Initialize Squishies (Octopus, Sea Star, Turtle)
  useEffect(() => {
    if (activeTool !== 'squish') return;
    const canvas = squishyCanvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const scaleFactor = canvas.width < 500 ? 0.75 : 1.0;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const buildSquishies = () => [
      {
        id: 'octopus',
        name: 'Cute Octopus',
        color: '#e6b0ba', // serene pink
        waxColor: '#d69fa9',
        x: cx - 180 * scaleFactor,
        y: cy - 20,
        originalX: cx - 180 * scaleFactor,
        originalY: cy - 20,
        radius: 40 * scaleFactor,
        hasWax: true,
        waxDurability: 100,
        cracks: [],
        deformX: 1.0,
        deformY: 1.0,
        shards: []
      },
      {
        id: 'starfish',
        name: 'Little Starfish',
        color: '#a7d0cd', // serene green
        waxColor: '#96bfbc',
        x: cx,
        y: cy - 20,
        originalX: cx,
        originalY: cy - 20,
        radius: 42 * scaleFactor,
        hasWax: true,
        waxDurability: 100,
        cracks: [],
        deformX: 1.0,
        deformY: 1.0,
        shards: []
      },
      {
        id: 'turtle',
        name: 'Tiny Turtle',
        color: '#8fb9c4', // serene blue
        waxColor: '#7fa9b4',
        x: cx + 180 * scaleFactor,
        y: cy - 20,
        originalX: cx + 180 * scaleFactor,
        originalY: cy - 20,
        radius: 40 * scaleFactor,
        hasWax: true,
        waxDurability: 100,
        cracks: [],
        deformX: 1.0,
        deformY: 1.0,
        shards: []
      }
    ];

    squishiesRef.current = buildSquishies();

    const handleResize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      const factor = canvas.width < 500 ? 0.75 : 1.0;
      const ncx = canvas.width / 2;
      const ncy = canvas.height / 2;
      
      // Update coordinates
      squishiesRef.current[0].x = ncx - 180 * factor;
      squishiesRef.current[0].y = ncy - 20;
      squishiesRef.current[0].originalX = ncx - 180 * factor;
      squishiesRef.current[0].originalY = ncy - 20;
      squishiesRef.current[0].radius = 40 * factor;

      squishiesRef.current[1].x = ncx;
      squishiesRef.current[1].y = ncy - 20;
      squishiesRef.current[1].originalX = ncx;
      squishiesRef.current[1].originalY = ncy - 20;
      squishiesRef.current[1].radius = 42 * factor;

      squishiesRef.current[2].x = ncx + 180 * factor;
      squishiesRef.current[2].y = ncy - 20;
      squishiesRef.current[2].originalX = ncx + 180 * factor;
      squishiesRef.current[2].originalY = ncy - 20;
      squishiesRef.current[2].radius = 40 * factor;
    };
    window.addEventListener('resize', handleResize);

    // Squishy Drawing Loop
    let animationId;
    const ctx = canvas.getContext('2d');
    
    const drawSquishies = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      squishiesRef.current.forEach(sq => {
        // Elastic rebound physics
        sq.deformX += (1.0 - sq.deformX) * 0.12;
        sq.deformY += (1.0 - sq.deformY) * 0.12;

        ctx.save();
        ctx.translate(sq.x, sq.y);
        ctx.scale(sq.deformX, sq.deformY);

        // A. Draw base soft squishy shape
        ctx.beginPath();
        if (sq.id === 'octopus') {
          // Octopus Head
          ctx.arc(0, -10, sq.radius * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = sq.color;
          ctx.fill();
          // Draw simple legs
          ctx.fillStyle = sq.color;
          for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.ellipse(-25 + i * 10, sq.radius * 0.6, 6, 12, Math.sin(Date.now()*0.005 + i)*0.2, 0, Math.PI * 2);
            ctx.fill();
          }
        } 
        else if (sq.id === 'starfish') {
          // Starfish 5 points
          for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const px = Math.cos(angle) * sq.radius * 1.1;
            const py = Math.sin(angle) * sq.radius * 1.1;
            ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = sq.color;
          ctx.fill();
        } 
        else if (sq.id === 'turtle') {
          // Turtle shell shape
          ctx.ellipse(0, 0, sq.radius * 1.1, sq.radius * 0.9, 0, 0, Math.PI * 2);
          ctx.fillStyle = sq.color;
          ctx.fill();
          // Flippers
          ctx.fillStyle = sq.color;
          ctx.beginPath();
          ctx.ellipse(-sq.radius*0.9, -sq.radius*0.6, 8, 18, -Math.PI/4, 0, Math.PI*2); // left top
          ctx.ellipse(sq.radius*0.9, -sq.radius*0.6, 8, 18, Math.PI/4, 0, Math.PI*2); // right top
          ctx.fill();
          // Head
          ctx.beginPath();
          ctx.arc(0, -sq.radius, 12, 0, Math.PI*2);
          ctx.fill();
        }

        // Draw Adorable Eyes
        ctx.beginPath();
        ctx.fillStyle = '#0a0f18';
        ctx.arc(-10, -5, 3.5, 0, Math.PI * 2);
        ctx.arc(10, -5, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(-11, -6, 1.2, 0, Math.PI * 2);
        ctx.arc(9, -6, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // B. Draw Wax Shell Layer if coated
        if (sq.hasWax) {
          ctx.save();
          ctx.translate(sq.x, sq.y);
          ctx.scale(sq.deformX, sq.deformY);

          // Draw translucent outer shell
          ctx.beginPath();
          ctx.arc(0, 0, sq.radius * 1.12, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.fill();
          ctx.strokeStyle = sq.waxColor;
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // Render cracks
          ctx.beginPath();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.8;
          sq.cracks.forEach(c => {
            ctx.moveTo(c.x1, c.y1);
            ctx.lineTo(c.x2, c.y2);
          });
          ctx.stroke();
          ctx.restore();
        }

        // C. Update and Draw Shards (Wax pieces breaking off)
        sq.shards.forEach((shard, idx) => {
          shard.x += shard.vx;
          shard.y += shard.vy;
          shard.vy += 0.18; // gravity
          shard.alpha -= 0.015;

          if (shard.alpha <= 0) {
            sq.shards.splice(idx, 1);
            return;
          }

          ctx.save();
          ctx.globalAlpha = shard.alpha;
          ctx.fillStyle = sq.waxColor;
          ctx.beginPath();
          ctx.arc(shard.x, shard.y, shard.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      });

      // Target reticle / finger coordinate feedback
      if (handLandmarks && handLandmarks.length > 8) {
        const x = handLandmarks[8].x * canvas.width;
        const y = handLandmarks[8].y * canvas.height;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(230, 176, 186, 0.4)';
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(drawSquishies);
    };

    drawSquishies();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [activeTool, handLandmarks]);

  // Click-Squish interaction helper
  const handleSquishStart = (clientX, clientY) => {
    const canvas = squishyCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    squishiesRef.current.forEach((sq, idx) => {
      const dx = clickX - sq.x;
      const dy = clickY - sq.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < sq.radius * 1.2) {
        activeSquishIndexRef.current = idx;
        triggerSquishAction(sq);
      }
    });
  };

  const triggerSquishAction = (sq) => {
    // Compress shapes
    sq.deformX = 1.25;
    sq.deformY = 0.72;

    if (sq.hasWax) {
      // Crack the wax!
      sq.waxDurability -= 18;
      playCrackingSound(0.7);

      // Add a random crack line
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = angle1 + (Math.random() - 0.5) * Math.PI * 0.7;
      sq.cracks.push({
        x1: Math.cos(angle1) * sq.radius * 0.6,
        y1: Math.sin(angle1) * sq.radius * 0.6,
        x2: Math.cos(angle2) * sq.radius * 1.05,
        y2: Math.sin(angle2) * sq.radius * 1.05
      });

      // Spawn falling wax shards
      for (let i = 0; i < 4; i++) {
        sq.shards.push({
          x: sq.x + (Math.random() - 0.5) * sq.radius * 0.8,
          y: sq.y + (Math.random() - 0.5) * sq.radius * 0.8,
          vx: (Math.random() - 0.5) * 3,
          vy: -2 - Math.random() * 3,
          size: 2.2 + Math.random() * 3.5,
          alpha: 1.0
        });
      }

      if (sq.waxDurability <= 0) {
        sq.hasWax = false;
        playSquishSound(1.0); // Big pop!
        // Burst of shards
        for (let i = 0; i < 15; i++) {
          sq.shards.push({
            x: sq.x + (Math.random() - 0.5) * sq.radius,
            y: sq.y + (Math.random() - 0.5) * sq.radius,
            vx: (Math.random() - 0.5) * 5,
            vy: -4 - Math.random() * 4,
            size: 1.8 + Math.random() * 4.5,
            alpha: 1.0
          });
        }
      }
    } else {
      // Squish the soft toy
      playSquishSound(0.85);
    }
  };

  const handleSquishEnd = () => {
    activeSquishIndexRef.current = null;
  };

  // Recoat wax handler
  const recoatWax = () => {
    if (activeTool !== 'squish') return;
    playSquishSound(0.4);
    squishiesRef.current.forEach(sq => {
      sq.hasWax = true;
      sq.waxDurability = 100;
      sq.cracks = [];
      sq.deformX = 0.82;
      sq.deformY = 1.25; // squash downwards on landing
    });
  };

  // 3. Brush on ASMR Microphone setup
  useEffect(() => {
    if (activeTool !== 'brush') {
      stopBrush();
      isBrushingRef.current = false;
      return;
    }

    const canvas = brushCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    let prevPointer = { x: 0, y: 0, time: 0 };
    let micLeft = { x: canvas.width / 2 - 130, y: canvas.height / 2, r: 52 };
    let micRight = { x: canvas.width / 2 + 130, y: canvas.height / 2, r: 52 };

    const handleResize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      micLeft = { x: canvas.width / 2 - 130, y: canvas.height / 2, r: 52 };
      micRight = { x: canvas.width / 2 + 130, y: canvas.height / 2, r: 52 };
    };
    window.addEventListener('resize', handleResize);

    // Render Microphone elements
    let animationId;
    const drawMicrophone = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const time = Date.now();

      // Render stand
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2 + 80);
      ctx.lineTo(w / 2, h - 80);
      ctx.stroke();

      // Crossbar
      ctx.beginPath();
      ctx.moveTo(w / 2 - 130, h / 2 + 60);
      ctx.lineTo(w / 2 + 130, h / 2 + 60);
      ctx.stroke();
      ctx.restore();

      // Draw Left Capsule
      drawCapsule(micLeft, 'L', '#8fb9c4');
      // Draw Right Capsule
      drawCapsule(micRight, 'R', '#e6b0ba');

      // Draw brush wave feedback if actively brushing
      if (isBrushingRef.current && prevPointer.x > 0) {
        ctx.beginPath();
        ctx.arc(prevPointer.x, prevPointer.y, 25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fill();
      }

      animationId = requestAnimationFrame(drawMicrophone);
    };

    const drawCapsule = (mic, label, activeColor) => {
      ctx.save();
      // Draw stand mount
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(mic.x, mic.y + 40);
      ctx.lineTo(mic.x, mic.y + 70);
      ctx.stroke();

      // Outer casing capsule glow
      const distToPointer = getPointerProximity(mic.x, mic.y);
      const isNear = distToPointer < mic.r * 1.5;

      if (isNear) {
        ctx.shadowBlur = 18;
        ctx.shadowColor = activeColor;
      }

      // Metal base
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.beginPath();
      ctx.roundRect(mic.x - 22, mic.y, 44, 45, [0, 0, 8, 8]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Fuzzy mic windscreen body
      ctx.beginPath();
      ctx.arc(mic.x, mic.y - 12, mic.r, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(mic.x, mic.y - 15, 2, mic.x, mic.y - 12, mic.r);
      grad.addColorStop(0, 'rgba(40, 52, 70, 0.95)');
      grad.addColorStop(1, 'rgba(18, 24, 38, 0.95)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = isNear ? activeColor : 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Fuzz hairs overlay (renders texture)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 0.8;
      const hairs = 40;
      for (let i = 0; i < hairs; i++) {
        const a = (i * Math.PI * 2) / hairs;
        const offset = Math.sin(Date.now() * 0.003 + i) * 1.5;
        const x1 = mic.x + Math.cos(a) * (mic.r - 2);
        const y1 = (mic.y - 12) + Math.sin(a) * (mic.r - 2);
        const x2 = mic.x + Math.cos(a) * (mic.r + 4 + offset);
        const y2 = (mic.y - 12) + Math.sin(a) * (mic.r + 4 + offset);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Mic Label text
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, mic.x, mic.y + 20);

      ctx.restore();
    };

    const getPointerProximity = (x, y) => {
      if (handLandmarks && handLandmarks.length > 8) {
        const hx = handLandmarks[8].x * canvas.width;
        const hy = handLandmarks[8].y * canvas.height;
        return Math.sqrt((x - hx)**2 + (y - hy)**2);
      }
      return prevPointer.x > 0 ? Math.sqrt((x - prevPointer.x)**2 + (y - prevPointer.y)**2) : 9999;
    };

    const handlePointerBrush = (px, py) => {
      const time = Date.now();
      const dx = px - prevPointer.x;
      const dy = py - prevPointer.y;
      const dt = time - prevPointer.time;

      if (dt > 12 && prevPointer.time > 0) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = Math.min(dist / dt * 2.0, 1.0);

        // Left Mic hover check
        const distLeft = Math.sqrt((px - micLeft.x)**2 + (py - micLeft.y)**2);
        // Right Mic hover check
        const distRight = Math.sqrt((px - micRight.x)**2 + (py - micRight.y)**2);

        if (distLeft < micLeft.r * 1.3) {
          if (!isBrushingRef.current) {
            startBrush();
            isBrushingRef.current = true;
          }
          updateBrush(speed, -0.85); // stereo pan left
        } else if (distRight < micRight.r * 1.3) {
          if (!isBrushingRef.current) {
            startBrush();
            isBrushingRef.current = true;
          }
          updateBrush(speed, 0.85); // stereo pan right
        } else {
          if (isBrushingRef.current) {
            stopBrush();
            isBrushingRef.current = false;
          }
        }
      }
      prevPointer = { x: px, y: py, time };
    };

    // Mouse movement callback
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      handlePointerBrush(px, py);
    };

    const handleMouseLeave = () => {
      stopBrush();
      isBrushingRef.current = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    drawMicrophone();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationId);
      stopBrush();
      isBrushingRef.current = false;
    };
  }, [activeTool, handLandmarks]);

  // 4. Keyboard / Pad interaction methods
  const handleKeyTap = (keyIndex) => {
    const key = keysGrid[keyIndex];
    if (!key) return;

    playNiceChime(key.freq, soundType);

    setActiveKeyPresses(prev => ({ ...prev, [keyIndex]: true }));
    setTimeout(() => {
      setActiveKeyPresses(prev => ({ ...prev, [keyIndex]: false }));
    }, 150);
  };
  // Keyboard Space/Shift hooks simulation for gestures
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (activeTool === 'squish') {
          triggerSquishAction(squishiesRef.current[1]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  // Camera tracker simulation fallback coordinate check for tap keys
  useEffect(() => {
    if (activeTool !== 'tap' || !handLandmarks || handLandmarks.length <= 8) return;

    const indexX = handLandmarks[8].x;
    const indexY = handLandmarks[8].y;

    if (indexX >= 0.25 && indexX <= 0.75 && indexY >= 0.25 && indexY <= 0.75) {
      const col = Math.floor(((indexX - 0.25) / 0.5) * 4);
      const row = Math.floor(((indexY - 0.25) / 0.5) * 3);
      const gridIndex = Math.min(11, Math.max(0, row * 4 + col));

      if (!activeKeyPresses[gridIndex] && Math.random() > 0.85) {
        const key = keysGrid[gridIndex];
        if (key) {
          playNiceChime(key.freq, soundType);
          setTimeout(() => {
            setActiveKeyPresses(prev => ({ ...prev, [gridIndex]: true }));
            setTimeout(() => {
              setActiveKeyPresses(prev => ({ ...prev, [gridIndex]: false }));
            }, 150);
          }, 0);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handLandmarks, activeTool, soundType]);

  return (
    <div className="relative w-full h-full min-h-screen select-none overflow-hidden">
      {/* Background canvas that sways and renders underwater scene */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full -z-20" />

      <div className="w-full h-full flex flex-col items-center justify-center pt-24 px-6 relative z-10">
        
        {/* Tool selectors (mint green, serene blue, soft rose quartz) */}
        <div className="flex bg-black/35 border border-white/5 p-1 rounded-xl mb-6 z-10 shadow-lg">
          <button
            onClick={() => setActiveTool('squish')}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer uppercase tracking-wider ${
              activeTool === 'squish'
                ? 'bg-calm-pink/15 text-calm-pink border border-calm-pink/20 shadow-inner'
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Wax Squishies
          </button>

          <button
            onClick={() => setActiveTool('brush')}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer uppercase tracking-wider ${
              activeTool === 'brush'
                ? 'bg-calm-blue/15 text-calm-blue border border-calm-blue/20 shadow-inner'
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Brush className="w-3.5 h-3.5" />
            ASMR Mic Brush
          </button>

          <button
            onClick={() => setActiveTool('tap')}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer uppercase tracking-wider ${
              activeTool === 'tap'
                ? 'bg-calm-green/15 text-calm-green border border-calm-green/20 shadow-inner'
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            Chime Keypad
          </button>
        </div>

        {/* Main interactive sandboxes */}
        <div className="flex-1 w-full max-w-4xl glass-panel rounded-2xl relative overflow-hidden flex flex-col justify-between mb-8 min-h-[380px] shadow-2xl">
          
          {/* A. Wax Squishies Mode */}
          {activeTool === 'squish' && (
            <div className="absolute inset-0 w-full h-full flex flex-col">
              <canvas
                ref={squishyCanvasRef}
                onMouseDown={(e) => handleSquishStart(e.clientX, e.clientY)}
                onMouseUp={handleSquishEnd}
                className="w-full h-full flex-1 cursor-pointer"
              />
              
              <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                <button
                  onClick={recoatWax}
                  className="bg-white/5 hover:bg-white/10 border border-white/8 px-3.5 py-2 rounded-xl text-[10px] font-bold text-white transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5 active:scale-95 shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Dip in Wax
                </button>
              </div>

              <div className="absolute top-4 left-4 flex items-center gap-2 text-[10.5px] text-gray-400 pointer-events-none bg-black/25 px-2.5 py-1.5 rounded-lg border border-white/5 font-medium tracking-wide">
                <Info className="w-3.5 h-3.5 text-calm-pink" />
                <span>Click on squishies to fracture the outer wax shell, then squeeze the soft toys!</span>
              </div>
            </div>
          )}

          {/* B. ASMR Mic Brushing Mode */}
          {activeTool === 'brush' && (
            <div className="absolute inset-0 w-full h-full">
              <canvas
                ref={brushCanvasRef}
                className="w-full h-full cursor-crosshair"
              />
              <div className="absolute top-4 left-4 flex items-center gap-2 text-[10.5px] text-gray-400 pointer-events-none bg-black/25 px-2.5 py-1.5 rounded-lg border border-white/5 font-medium tracking-wide">
                <Info className="w-3.5 h-3.5 text-calm-blue" />
                <span>Hover and move pointer quickly over Left/Right fuzzy wind protectors to hear binaural sound waves.</span>
              </div>
            </div>
          )}

          {/* C. Tapping Pad Mode */}
          {activeTool === 'tap' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-black/10">
              
              {/* Instrument Selectors */}
              <div className="flex bg-black/25 p-1 rounded-xl mb-4 border border-white/5 z-10 gap-1.5">
                {['kalimba', 'chime', 'woodblock'].map(type => (
                  <button
                    key={type}
                    onClick={() => setSoundType(type)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                      soundType === type
                        ? 'bg-calm-green/15 text-calm-green border border-calm-green/20'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {type === 'kalimba' ? 'Forest Kalimba' : type === 'chime' ? 'Crystal Chime' : 'Raindrop Block'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-3.5 max-w-xl w-full p-4 z-10">
                {keysGrid.map((key, index) => {
                  const isPressed = activeKeyPresses[index];
                  return (
                    <button
                      key={index}
                      onClick={() => handleKeyTap(index)}
                      className={`h-20 rounded-2xl border-b-4 font-bold flex flex-col items-center justify-center transition-all duration-75 cursor-pointer relative bg-gradient-to-b ${key.color} ${
                        isPressed
                          ? 'translate-y-1 border-b-0 opacity-90 scale-95 shadow-sm'
                          : 'hover:scale-[1.02] active:translate-y-1 active:border-b-0 shadow-md'
                      }`}
                    >
                      <span className="text-white text-xs tracking-widest font-extrabold heading-font">{key.label}</span>
                      <span className="text-[8px] text-gray-400 mt-1 font-semibold">{Math.round(key.freq)} Hz</span>
                    </button>
                  );
                })}
              </div>

              <div className="absolute top-4 left-4 flex items-center gap-2 text-[10.5px] text-gray-400 pointer-events-none bg-black/25 px-2.5 py-1.5 rounded-lg border border-white/5 font-medium tracking-wide">
                <Info className="w-3.5 h-3.5 text-calm-green" />
                <span>Click directly on the keypad grid switches to play clear, sweet acoustic chimes.</span>
              </div>
            </div>
          )}

          {/* Footer HUD */}
          <div className="h-10 bg-black/35 border-t border-white/5 px-5 flex items-center justify-between text-[9px] text-gray-500 pointer-events-none z-10">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-calm-pink" />
              <span>Interactive Ocean-Immersive ASMR sandbox</span>
            </div>
            <div>
              {activeTool === 'squish' && (
                <span className="text-calm-pink font-bold uppercase tracking-wider">Squishy Physics Sandbox Mode</span>
              )}
              {activeTool === 'brush' && (
                <span className="text-calm-blue font-bold uppercase tracking-wider">Dual Binaural Mic Simulation</span>
              )}
              {activeTool === 'tap' && (
                <span className="text-calm-green font-bold uppercase tracking-wider">Preset: {soundType} Active</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
