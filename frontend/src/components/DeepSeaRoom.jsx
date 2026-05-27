import React, { useEffect, useRef } from 'react';
import { useSensorySpace } from '../context/SensorySpaceContext';
import { Waves } from 'lucide-react';

export default function DeepSeaRoom() {
  const {
    isWebcamActive,
    webcamStream,
    handLandmarks,
    handGesture,
    playPop
  } = useSensorySpace();

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const bubblesRef = useRef([]);
  const particlesRef = useRef([]);
  const fishRef = useRef([]);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    bubblesRef.current = Array.from({ length: 10 }, () => createBubble(canvas.width, canvas.height, true));
    fishRef.current = Array.from({ length: 3 }, (_, idx) => createFish(canvas.width, canvas.height, idx));

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (isWebcamActive && webcamStream && videoRef.current) {
      videoRef.current.srcObject = webcamStream;
      videoRef.current.play().catch(err => console.log('Video play interrupted:', err));
    }
  }, [isWebcamActive, webcamStream]);

  const createBubble = (width, height, randomizeY = false) => {
    // Colors mapped to calming theme: green, blue, pink
    const bubbleColors = [
      { border: 'rgba(127, 168, 179, 0.45)', fill: 'rgba(127, 168, 179, 0.12)' }, // calm-blue
      { border: 'rgba(124, 169, 130, 0.45)', fill: 'rgba(124, 169, 130, 0.12)' }, // calm-green
      { border: 'rgba(216, 167, 177, 0.45)', fill: 'rgba(216, 167, 177, 0.12)' }  // calm-pink
    ];
    const color = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];

    return {
      x: Math.random() * width,
      y: randomizeY ? Math.random() * height : height + 50,
      radius: 18 + Math.random() * 20,
      speedY: 1.2 + Math.random() * 1.8,
      speedX: 0,
      wobbleSpeed: 0.015 + Math.random() * 0.02,
      wobbleAmount: 2 + Math.random() * 4,
      wobbleOffset: Math.random() * 100,
      color
    };
  };

  const spawnParticles = (x, y, color = 'rgba(127, 168, 179, 0.6)') => {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.2);
      const speed = 1.5 + Math.random() * 3.0;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.8 + Math.random() * 2.2,
        alpha: 1.0,
        decay: 0.025 + Math.random() * 0.02,
        color
      });
    }
  };

  const createFish = (width, height, id) => {
    // Fish colors mapped exactly to muted green, blue, pink
    const colors = [
      { body: '#7ca982', accent: '#a5d6a7' }, // Muted green (sage)
      { body: '#7fa8b3', accent: '#aed8f2' }, // Muted blue (slate)
      { body: '#d8a7b1', accent: '#f5d6dc' }  // Muted pink (dusty)
    ];
    const color = colors[id % colors.length];

    return {
      id,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      size: 32 + Math.random() * 10,
      targetX: Math.random() * width,
      targetY: Math.random() * height,
      color,
      wobbleOffset: Math.random() * 100,
      state: 'wander',
      stateTimer: 0
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.save();
      ctx.clearRect(0, 0, width, height);
      
      if (isWebcamActive && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        
        const vW = videoRef.current.videoWidth;
        const vH = videoRef.current.videoHeight;
        const scale = Math.max(width / vW, height / vH);
        const xOffset = (width - vW * scale) / 2;
        const yOffset = (height - vH * scale) / 2;
        
        ctx.drawImage(videoRef.current, xOffset, yOffset, vW * scale, vH * scale);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0a0d14'); // dark slate
        grad.addColorStop(1, '#131822'); // deep ocean
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();

      let indexFinger = null;
      let handCenter = null;

      if (handLandmarks && handLandmarks.length > 8) {
        indexFinger = {
          x: handLandmarks[8].x * width,
          y: handLandmarks[8].y * height
        };
        handCenter = {
          x: handLandmarks[0].x * width,
          y: handLandmarks[0].y * height
        };
      }

      // Update Bubbles
      bubblesRef.current.forEach((bubble, idx) => {
        bubble.wobbleOffset += bubble.wobbleSpeed;
        bubble.x += Math.sin(bubble.wobbleOffset) * 0.4;
        bubble.y -= bubble.speedY;

        if (bubble.y < -bubble.radius) {
          bubblesRef.current[idx] = createBubble(width, height);
          return;
        }

        if (indexFinger) {
          const dx = bubble.x - indexFinger.x;
          const dy = bubble.y - indexFinger.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bubble.radius + 12) {
            playPop();
            spawnParticles(bubble.x, bubble.y, bubble.color.border);
            bubblesRef.current[idx] = createBubble(width, height);
            return;
          }
        }

        // Draw Bubble
        ctx.beginPath();
        const bubbleGrad = ctx.createRadialGradient(
          bubble.x - bubble.radius * 0.25,
          bubble.y - bubble.radius * 0.25,
          bubble.radius * 0.05,
          bubble.x,
          bubble.y,
          bubble.radius
        );
        bubbleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        bubbleGrad.addColorStop(0.5, bubble.color.fill);
        bubbleGrad.addColorStop(1, bubble.color.border);
        
        ctx.fillStyle = bubbleGrad;
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.arc(
          bubble.x - bubble.radius * 0.3,
          bubble.y - bubble.radius * 0.3,
          bubble.radius * 0.12,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      // Update Particles
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particlesRef.current.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Update Fish
      fishRef.current.forEach(fish => {
        const isFlatHand = handGesture.isFlat;
        const velocitySpike = handGesture.velocity > 0.04;

        if (handCenter && isFlatHand && !velocitySpike) {
          fish.state = 'attract';
          fish.targetX = handCenter.x;
          fish.targetY = handCenter.y;
        } 
        else if (handCenter && (velocitySpike || !isFlatHand)) {
          fish.state = 'repel';
          const dx = fish.x - handCenter.x;
          const dy = fish.y - handCenter.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 280) {
            const dirX = dist > 0 ? dx / dist : Math.random() - 0.5;
            const dirY = dist > 0 ? dy / dist : Math.random() - 0.5;
            fish.targetX = fish.x + dirX * 500;
            fish.targetY = fish.y + dirY * 500;
          }
        } 
        else {
          fish.state = 'wander';
          fish.stateTimer--;
          if (fish.stateTimer <= 0) {
            fish.targetX = Math.random() * width;
            fish.targetY = Math.random() * height;
            fish.stateTimer = 150 + Math.random() * 150;
          }
        }

        const targetDx = fish.targetX - fish.x;
        const targetDy = fish.targetY - fish.y;
        const targetDist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
        
        let maxSpeed = fish.state === 'repel' ? 10 : fish.state === 'attract' ? 3.0 : 1.2;
        let accel = fish.state === 'repel' ? 0.5 : fish.state === 'attract' ? 0.15 : 0.04;

        if (targetDist > 10) {
          const steerX = (targetDx / targetDist) * maxSpeed;
          const steerY = (targetDy / targetDist) * maxSpeed;

          fish.vx += (steerX - fish.vx) * accel;
          fish.vy += (steerY - fish.vy) * accel;
        }

        fish.x += fish.vx;
        fish.y += fish.vy;

        if (fish.x < -80) fish.x = width + 80;
        if (fish.x > width + 80) fish.x = -80;
        if (fish.y < -80) fish.y = height + 80;
        if (fish.y > height + 80) fish.y = -80;

        const angle = Math.atan2(fish.vy, fish.vx);
        fish.wobbleOffset += fish.state === 'repel' ? 0.22 : fish.state === 'attract' ? 0.1 : 0.05;
        const tailWiggle = Math.sin(fish.wobbleOffset) * 0.3;

        // Draw Fish
        ctx.save();
        ctx.translate(fish.x, fish.y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.fillStyle = fish.color.body;
        ctx.ellipse(0, 0, fish.size, fish.size * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = fish.color.accent;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Eye
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(fish.size * 0.45, -fish.size * 0.1, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = '#1e293b';
        ctx.arc(fish.size * 0.5, -fish.size * 0.1, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.save();
        ctx.translate(-fish.size, 0);
        ctx.rotate(tailWiggle);
        ctx.beginPath();
        ctx.fillStyle = fish.color.accent;
        ctx.moveTo(0, 0);
        ctx.lineTo(-fish.size * 0.45, -fish.size * 0.4);
        ctx.lineTo(-fish.size * 0.35, 0);
        ctx.lineTo(-fish.size * 0.45, fish.size * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Fins
        ctx.beginPath();
        ctx.fillStyle = fish.color.accent;
        ctx.ellipse(-fish.size * 0.1, fish.size * 0.28, fish.size * 0.18, fish.size * 0.08, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-fish.size * 0.1, -fish.size * 0.28, fish.size * 0.18, fish.size * 0.08, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Target reticle
      if (indexFinger) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(127, 168, 179, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.arc(indexFinger.x, indexFinger.y, 7, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = 'rgba(127, 168, 179, 0.7)';
        ctx.arc(indexFinger.x, indexFinger.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isWebcamActive, handLandmarks, handGesture]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0d14]">
      <video
        ref={videoRef}
        playsInline
        muted
        className="hidden"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'blur(12px)' }}
      />

      {/* Calming, soft blending colors overlay */}
      <div className="absolute inset-0 bg-[#0f1319]/80 mix-blend-color-burn pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1319]/95 via-transparent to-[#0f1319]/40 pointer-events-none" />

      {/* Calming text hud */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10 text-center gap-1 opacity-55">
        <div className="flex items-center gap-1.5 text-calm-blue">
          <Waves className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase tracking-wider font-semibold">Deep Sea Preset Active</span>
        </div>
        <p className="text-[9px] text-gray-400 max-w-sm">
          {handLandmarks && handLandmarks.length > 0 
            ? (handGesture.isFlat 
                ? "Fish swim toward your palm. Pop the bubble spheres." 
                : "Knuckles detected. Fish drift away.")
            : "Hover your cursor over bubble spheres to pop them."
          }
        </p>
      </div>
    </div>
  );
}
