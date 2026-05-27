import { useEffect, useRef } from 'react';
import { useSensorySpace } from '../context/SensorySpaceContext';
import { Waves } from 'lucide-react';

export default function DeepSeaRoom() {
  const {
    isWebcamActive,
    webcamStream,
    handLandmarks,
    handGesture,
    playPop,
    playNiceChime
  } = useSensorySpace();

  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const videoRef = useRef(null);
  
  const bubblesRef = useRef([]);
  const particlesRef = useRef([]);
  const fishRef = useRef([]);
  const jellyfishRef = useRef([]);
  const kelpRef = useRef([]);
  const ripplesRef = useRef([]);
  
  const animationFrameRef = useRef(null);

  const createBubble = (width, height, randomizeY = false) => {
    const bubbleColors = [
      { border: 'rgba(143, 185, 196, 0.45)', fill: 'rgba(143, 185, 196, 0.12)' }, // serene blue
      { border: 'rgba(167, 208, 205, 0.45)', fill: 'rgba(167, 208, 205, 0.12)' }, // serene green
      { border: 'rgba(230, 176, 186, 0.45)', fill: 'rgba(230, 176, 186, 0.12)' }  // serene pink
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

  const spawnParticles = (x, y, color = 'rgba(143, 185, 196, 0.6)') => {
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
    const colors = [
      { body: '#a7d0cd', accent: '#c6e8e5' }, // calming mint
      { body: '#8fb9c4', accent: '#bcdde6' }, // serene blue
      { body: '#e6b0ba', accent: '#f5d3d8' }  // gentle rose
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
      stateTimer: 0,
      spinTime: 0
    };
  };

  const createJellyfish = (width, height, id) => {
    const colors = [
      'rgba(230, 176, 186, 0.75)', // gentle rose
      'rgba(143, 185, 196, 0.75)'  // serene blue
    ];
    const color = colors[id % colors.length];

    return {
      id,
      x: width * (0.25 + id * 0.4 + Math.random() * 0.1),
      y: height + 80 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.5 - Math.random() * 0.6,
      size: 26 + Math.random() * 8,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.02,
      glow: 0,
      state: 'swim',
      color
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      bgCanvas.width = window.innerWidth;
      bgCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Spawn starting items
    bubblesRef.current = Array.from({ length: 12 }, () => createBubble(canvas.width, canvas.height, true));
    fishRef.current = Array.from({ length: 4 }, (_, idx) => createFish(canvas.width, canvas.height, idx));
    jellyfishRef.current = Array.from({ length: 2 }, (_, idx) => createJellyfish(canvas.width, canvas.height, idx));

    // Initialize Swaying Bioluminescent Kelp
    const kelpStalksCount = Math.floor(canvas.width / 95);
    const tempKelp = [];
    for (let i = 0; i < kelpStalksCount; i++) {
      const kelpX = 50 + i * 95 + (Math.random() - 0.5) * 30;
      const heightVal = 180 + Math.random() * 150;
      const segmentCount = 6;
      const segments = [];
      for (let j = 0; j < segmentCount; j++) {
        segments.push({
          x: kelpX,
          y: canvas.height - (j / (segmentCount - 1)) * heightVal,
          ox: kelpX,
          oy: canvas.height - (j / (segmentCount - 1)) * heightVal,
          vx: 0,
          vy: 0
        });
      }
      const colors = ['#a7d0cd', '#8fb9c4', '#e6b0ba'];
      const stalkColor = colors[Math.floor(Math.random() * colors.length)];
      tempKelp.push({
        segments,
        color: stalkColor,
        glowIntensity: 0,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.008 + Math.random() * 0.012
      });
    }
    kelpRef.current = tempKelp;

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

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // 1. Trigger ripple
    ripplesRef.current.push({
      x: clickX,
      y: clickY,
      radius: 5,
      maxRadius: 200,
      opacity: 0.8,
      speed: 4.8
    });

    // 2. Play droplet sound
    playPop(200);

    // 3. Trigger spin on clicked fish
    fishRef.current.forEach(fish => {
      const dx = fish.x - clickX;
      const dy = fish.y - clickY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < fish.size + 15) {
        fish.spinTime = 30; // 30 frames
        fish.vx *= 3.5;
        fish.vy *= 3.5;
        playNiceChime(523.25, 'kalimba');
      }
    });

    // 4. Trigger pulse and glow on clicked jellyfish
    jellyfishRef.current.forEach(jelly => {
      const dx = jelly.x - clickX;
      const dy = jelly.y - clickY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < jelly.size + 15) {
        jelly.glow = 1.0;
        jelly.vy = -6; // push up
        playNiceChime(392.00, 'chime');
        // Spawn bubbles from jellyfish
        for (let i = 0; i < 5; i++) {
          bubblesRef.current.push({
            x: jelly.x + (Math.random() - 0.5) * 30,
            y: jelly.y,
            radius: 8 + Math.random() * 10,
            speedY: 2 + Math.random() * 2,
            speedX: (Math.random() - 0.5) * 1.5,
            wobbleSpeed: 0.02,
            wobbleAmount: 3,
            wobbleOffset: Math.random() * 100,
            color: { border: 'rgba(255, 255, 255, 0.45)', fill: 'rgba(255, 255, 255, 0.12)' }
          });
        }
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;
    const ctx = canvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const time = Date.now();

      // Render Blurred Background on bgCanvas
      bgCtx.save();
      bgCtx.clearRect(0, 0, width, height);
      if (isWebcamActive && videoRef.current && videoRef.current.readyState >= 2) {
        bgCtx.translate(width, 0);
        bgCtx.scale(-1, 1);
        
        const vW = videoRef.current.videoWidth;
        const vH = videoRef.current.videoHeight;
        const scale = Math.max(width / vW, height / vH);
        const xOffset = (width - vW * scale) / 2;
        const yOffset = (height - vH * scale) / 2;
        
        bgCtx.drawImage(videoRef.current, xOffset, yOffset, vW * scale, vH * scale);
      } else {
        const grad = bgCtx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#04070a'); // extra dark background
        grad.addColorStop(1, '#0c121b');
        bgCtx.fillStyle = grad;
        bgCtx.fillRect(0, 0, width, height);
      }
      bgCtx.restore();

      // Clear main foreground canvas for crisp renderings
      ctx.clearRect(0, 0, width, height);

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

      // Update and Draw Ripples
      ripplesRef.current.forEach((rip, rIdx) => {
        rip.radius += rip.speed;
        rip.opacity -= 0.012;
        if (rip.opacity <= 0) {
          ripplesRef.current.splice(rIdx, 1);
          return;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(143, 185, 196, ${rip.opacity * 0.45})`;
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#8fb9c4';
        ctx.stroke();
        ctx.restore();
      });

      // Update and Draw Kelp Stalks
      kelpRef.current.forEach(stalk => {
        stalk.glowIntensity = Math.max(0, stalk.glowIntensity - 0.015);

        stalk.segments.forEach((seg, sIdx) => {
          if (sIdx === 0) return; // base is anchored

          // Swaying current physics
          const sway = Math.sin(time * stalk.swaySpeed + stalk.swayPhase) * (sIdx * 2.2);
          seg.x = seg.ox + sway;

          // Pointer collision displacement
          if (indexFinger) {
            const dx = seg.x - indexFinger.x;
            const dy = seg.y - indexFinger.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              const pushForce = (100 - dist) * 0.35;
              const pushAngle = Math.atan2(dy, dx);
              seg.x += Math.cos(pushAngle) * pushForce;
              
              stalk.glowIntensity = Math.min(1.0, stalk.glowIntensity + 0.15);

              // Spawn tiny glowing spores
              if (Math.random() > 0.93) {
                particlesRef.current.push({
                  x: seg.x,
                  y: seg.y,
                  vx: (Math.random() - 0.5) * 0.8,
                  vy: -0.6 - Math.random() * 0.5,
                  radius: 1.2 + Math.random() * 1.8,
                  alpha: 1.0,
                  decay: 0.015 + Math.random() * 0.015,
                  color: stalk.color
                });
              }
            }
          }
        });

        // Draw Kelp Stalk
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(stalk.segments[0].x, stalk.segments[0].y);
        for (let j = 1; j < stalk.segments.length - 1; j++) {
          const xc = (stalk.segments[j].x + stalk.segments[j+1].x) / 2;
          const yc = (stalk.segments[j].y + stalk.segments[j+1].y) / 2;
          ctx.quadraticCurveTo(stalk.segments[j].x, stalk.segments[j].y, xc, yc);
        }
        ctx.quadraticCurveTo(
          stalk.segments[stalk.segments.length-1].x,
          stalk.segments[stalk.segments.length-1].y,
          stalk.segments[stalk.segments.length-1].x,
          stalk.segments[stalk.segments.length-1].y
        );

        ctx.strokeStyle = stalk.color;
        ctx.lineWidth = 3.5 + stalk.glowIntensity * 5.0;
        ctx.lineCap = 'round';
        if (stalk.glowIntensity > 0) {
          ctx.shadowBlur = stalk.glowIntensity * 16;
          ctx.shadowColor = stalk.color;
        }
        ctx.stroke();
        ctx.restore();
      });

      // Update and Draw Bubbles
      bubblesRef.current.forEach((bubble, idx) => {
        bubble.wobbleOffset += bubble.wobbleSpeed;
        bubble.x += Math.sin(bubble.wobbleOffset) * 0.4;
        bubble.y -= bubble.speedY;

        // Apply ripples forces to bubbles
        ripplesRef.current.forEach(rip => {
          const rDx = bubble.x - rip.x;
          const rDy = bubble.y - rip.y;
          const rDist = Math.sqrt(rDx * rDx + rDy * rDy);
          if (rDist < rip.radius + 35 && rDist > rip.radius - 35) {
            const pushFactor = (1 - rDist / rip.maxRadius) * 2.2;
            const pushAngle = Math.atan2(rDy, rDx);
            bubble.x += Math.cos(pushAngle) * pushFactor;
            bubble.y += Math.sin(pushAngle) * pushFactor;
          }
        });

        if (bubble.y < -bubble.radius) {
          bubblesRef.current[idx] = createBubble(width, height);
          return;
        }

        if (indexFinger) {
          const dx = bubble.x - indexFinger.x;
          const dy = bubble.y - indexFinger.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bubble.radius + 12) {
            // Melodic pentatonic notes
            const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
            const pitch = notes[Math.floor((bubble.x / width) * notes.length)] || 329.63;
            playPop(pitch);
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
        bubbleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        bubbleGrad.addColorStop(0.5, bubble.color.fill);
        bubbleGrad.addColorStop(1, bubble.color.border);
        
        ctx.fillStyle = bubbleGrad;
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.arc(
          bubble.x - bubble.radius * 0.3,
          bubble.y - bubble.radius * 0.3,
          bubble.radius * 0.12,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      // Update and Draw Particles
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

      // Update and Draw Jellyfish
      jellyfishRef.current.forEach((jelly, jIdx) => {
        jelly.pulsePhase += jelly.pulseSpeed;
        jelly.glow = Math.max(0, jelly.glow - 0.015);

        const isContracting = Math.sin(jelly.pulsePhase) > 0.65;
        if (isContracting) {
          jelly.vy += (-1.3 - jelly.vy) * 0.18;
          jelly.vx += ((Math.random() - 0.5) * 0.8 - jelly.vx) * 0.12;
        } else {
          jelly.vy += (-0.3 - jelly.vy) * 0.04;
          jelly.vx += (0 - jelly.vx) * 0.04;
        }

        // Pointer proximity interactions
        if (indexFinger) {
          const dx = jelly.x - indexFinger.x;
          const dy = jelly.y - indexFinger.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            if (handGesture.isFlat) {
              jelly.vx += (dx > 0 ? -0.18 : 0.18);
              jelly.vy += (dy > 0 ? -0.15 : 0.15);
            } else {
              jelly.vx += (dx > 0 ? 0.45 : -0.45);
              jelly.vy += (dy > 0 ? 0.45 : -0.45);
            }
          }

          if (dist < jelly.size + 15 && Math.random() > 0.98 && jelly.glow < 0.15) {
            jelly.glow = 1.0;
            playNiceChime(392.00, 'chime');
          }
        }

        // Apply ripples forces to jellyfish
        ripplesRef.current.forEach(rip => {
          const rDx = jelly.x - rip.x;
          const rDy = jelly.y - rip.y;
          const rDist = Math.sqrt(rDx * rDx + rDy * rDy);
          if (rDist < rip.radius + 40 && rDist > rip.radius - 40) {
            const pushFactor = (1 - rDist / rip.maxRadius) * 2.8;
            const pushAngle = Math.atan2(rDy, rDx);
            jelly.vx += Math.cos(pushAngle) * pushFactor;
            jelly.vy += Math.sin(pushAngle) * pushFactor;
          }
        });

        // Cap speeds
        jelly.vx = Math.max(-2.5, Math.min(2.5, jelly.vx));
        jelly.vy = Math.max(-3.5, Math.min(1.5, jelly.vy));

        jelly.x += jelly.vx;
        jelly.y += jelly.vy;

        if (jelly.y < -80) {
          jellyfishRef.current[jIdx] = createJellyfish(width, height, jIdx);
          return;
        }
        if (jelly.x < -80) jelly.x = width + 80;
        if (jelly.x > width + 80) jelly.x = -80;

        // Draw Jellyfish Bell
        ctx.save();
        ctx.translate(jelly.x, jelly.y);

        const bellContraction = 1 + Math.sin(jelly.pulsePhase) * 0.18;
        const bellW = jelly.size * bellContraction;
        const bellH = jelly.size * (1 - Math.sin(jelly.pulsePhase) * 0.08) * 0.85;

        // Glow ring
        if (jelly.glow > 0) {
          ctx.beginPath();
          ctx.ellipse(0, 0, bellW * 1.35, bellH * 1.35, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${jelly.glow * 0.18})`;
          ctx.fill();
        }

        // Bell body
        ctx.beginPath();
        ctx.ellipse(0, 0, bellW, bellH, 0, 0, Math.PI * 2);
        
        const jellyGrad = ctx.createRadialGradient(0, -bellH * 0.2, 2, 0, 0, bellW);
        jellyGrad.addColorStop(0, jelly.glow > 0 ? '#ffffff' : jelly.color);
        jellyGrad.addColorStop(0.5, jelly.color.replace('0.75', '0.42'));
        jellyGrad.addColorStop(1, jelly.color.replace('0.75', '0.04'));
        ctx.fillStyle = jellyGrad;
        ctx.fill();

        ctx.strokeStyle = jelly.color;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Core glow
        ctx.beginPath();
        ctx.ellipse(0, bellH * 0.15, bellW * 0.42, bellH * 0.42, 0, 0, Math.PI * 2);
        ctx.fillStyle = jelly.glow > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.35)';
        ctx.fill();

        // Tentacles (bezier sway)
        const tentaclesCount = 4;
        for (let t = 0; t < tentaclesCount; t++) {
          const tx = -bellW * 0.65 + (t / (tentaclesCount - 1)) * bellW * 1.3;
          const swayVal = Math.sin(time * 0.0035 + t * 0.85 + jelly.pulsePhase) * 14;
          
          ctx.beginPath();
          ctx.moveTo(tx, bellH * 0.38);
          ctx.bezierCurveTo(
            tx + swayVal * 0.5, bellH * 1.25,
            tx - swayVal * 0.5, bellH * 2.3,
            tx + swayVal, bellH * 3.6
          );
          ctx.strokeStyle = jelly.color.replace('0.75', '0.35');
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        ctx.restore();
      });

      // Update and Draw Fish
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

        // Apply ripples forces to fish
        ripplesRef.current.forEach(rip => {
          const rDx = fish.x - rip.x;
          const rDy = fish.y - rip.y;
          const rDist = Math.sqrt(rDx * rDx + rDy * rDy);
          if (rDist < rip.radius + 40 && rDist > rip.radius - 40) {
            const pushFactor = (1 - rDist / rip.maxRadius) * 5.0;
            const pushAngle = Math.atan2(rDy, rDx);
            fish.vx += Math.cos(pushAngle) * pushFactor;
            fish.vy += Math.sin(pushAngle) * pushFactor;
          }
        });

        const speedLimit = fish.state === 'repel' ? 12 : 3.8;
        const currentSpeed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
        if (currentSpeed > speedLimit) {
          fish.vx = (fish.vx / currentSpeed) * speedLimit;
          fish.vy = (fish.vy / currentSpeed) * speedLimit;
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

        // Update spin flip
        if (fish.spinTime && fish.spinTime > 0) {
          fish.spinTime--;
        } else {
          fish.spinTime = 0;
        }

        // Draw Fish
        ctx.save();
        ctx.translate(fish.x, fish.y);
        
        let rotationOffset = 0;
        let scaleX = 1.0;
        let scaleY = 1.0;
        if (fish.spinTime > 0) {
          const progress = (30 - fish.spinTime) / 30;
          rotationOffset = progress * Math.PI * 2;
          scaleX = 1.0 + Math.sin(progress * Math.PI) * 0.45; // stretch and squish
          scaleY = 1.0 / scaleX;
        }
        
        ctx.rotate(angle + rotationOffset);
        ctx.scale(scaleX, scaleY);

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
        ctx.fillStyle = '#0a0f18';
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
        ctx.strokeStyle = 'rgba(143, 185, 196, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.arc(indexFinger.x, indexFinger.y, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = 'rgba(143, 185, 196, 0.7)';
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
  }, [isWebcamActive, handLandmarks, handGesture, playNiceChime, playPop]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#080c10]">
      <video
        ref={videoRef}
        playsInline
        muted
        className="hidden"
      />
      {/* Blurred background canvas for camera / gradient backdrop */}
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'blur(24px)' }}
      />
      {/* Foreground canvas for high-fidelity interactive animations */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 w-full h-full cursor-pointer"
      />

      {/* Calming, soft blending colors overlay */}
      <div className="absolute inset-0 bg-[#080c10]/75 mix-blend-color-burn pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080c10]/95 via-transparent to-[#080c10]/35 pointer-events-none" />

      {/* Calming text hud */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10 text-center gap-1 opacity-55">
        <div className="flex items-center gap-1.5 text-calm-blue">
          <Waves className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase tracking-widest font-extrabold heading-font">Deep Seapreset active</span>
        </div>
        <p className="text-[9.5px] text-gray-400 max-w-sm font-medium tracking-wide">
          {handLandmarks && handLandmarks.length > 0 
            ? (handGesture.isFlat 
                ? "Fish swim toward your palm. Click to send ripples." 
                : "Knuckles detected. Fish drift away.")
            : "Click to generate water ripples. Tap fish or jellyfish to interact."
          }
        </p>
      </div>
    </div>
  );
}
