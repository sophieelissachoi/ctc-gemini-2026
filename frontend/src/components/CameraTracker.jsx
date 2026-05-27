import React, { useEffect, useRef, useState } from 'react';
import { useSensorySpace } from '../context/SensorySpaceContext';
import { Camera, MousePointer, HelpCircle } from 'lucide-react';

export default function CameraTracker() {
  const {
    isWebcamActive,
    webcamStream,
    updateHandLandmarks,
    handGesture
  } = useSensorySpace();

  const [useCameraTracking, setUseCameraTracking] = useState(true);
  const [showHelp, setShowHelp] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const prevFrameRef = useRef(null);
  const smoothedCentroidRef = useRef({ x: 0.5, y: 0.5 });
  const animationRef = useRef(null);

  const [flatMode, setFlatMode] = useState(true);
  const [pinchMode, setPinchMode] = useState(false);

  // Handle keys for testing gestures
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setPinchMode(true);
        updateHandLandmarks(null, { isPinching: true });
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setFlatMode(prev => {
          const next = !prev;
          updateHandLandmarks(null, { isFlat: next });
          return next;
        });
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setPinchMode(false);
        updateHandLandmarks(null, { isPinching: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    updateHandLandmarks(null, { isFlat: flatMode, isPinching: pinchMode });
  }, [flatMode, pinchMode]);

  // Set up video stream
  useEffect(() => {
    if (isWebcamActive && webcamStream && videoRef.current) {
      videoRef.current.srcObject = webcamStream;
      videoRef.current.play().catch(e => console.log('Tracker video play interrupted:', e));
    }
  }, [isWebcamActive, webcamStream]);

  // Camera Motion-Differencing Loop
  useEffect(() => {
    if (!isWebcamActive || !useCameraTracking) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;

    const detectMotion = () => {
      if (video.readyState >= 2) {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const length = frame.data.length;

        let sumX = 0;
        let sumY = 0;
        let count = 0;

        if (prevFrameRef.current) {
          const prevData = prevFrameRef.current.data;
          const currData = frame.data;

          for (let i = 0; i < length; i += 4) {
            const rDiff = Math.abs(currData[i] - prevData[i]);
            const gDiff = Math.abs(currData[i+1] - prevData[i+1]);
            const bDiff = Math.abs(currData[i+2] - prevData[i+2]);
            const diff = rDiff + gDiff + bDiff;

            if (diff > 65) {
              const pixelIndex = i / 4;
              const px = pixelIndex % canvas.width;
              const py = Math.floor(pixelIndex / canvas.width);
              
              sumX += px;
              sumY += py;
              count++;

              // Render calming green dots for motion tracking points
              currData[i] = 124;
              currData[i+1] = 169;
              currData[i+2] = 130;
            }
          }

          ctx.putImageData(frame, 0, 0);
        }

        prevFrameRef.current = frame;

        if (count > 15) {
          const targetX = sumX / count / canvas.width;
          const targetY = sumY / count / canvas.height;

          const k = 0.15;
          const nextX = smoothedCentroidRef.current.x * (1 - k) + targetX * k;
          const nextY = smoothedCentroidRef.current.y * (1 - k) + targetY * k;

          const dx = nextX - smoothedCentroidRef.current.x;
          const dy = nextY - smoothedCentroidRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          smoothedCentroidRef.current = { x: nextX, y: nextY };

          const landmarks = Array.from({ length: 21 }, (_, idx) => {
            if (idx === 8) return { x: nextX, y: nextY };
            if (idx === 4) return { x: nextX + (pinchMode ? 0 : 0.05), y: nextY + (pinchMode ? 0 : 0.05) };
            return { x: nextX, y: nextY + 0.1 };
          });

          updateHandLandmarks(landmarks, { velocity: dist });
        } else {
          updateHandLandmarks(null, { velocity: handGesture.velocity * 0.8 });
        }
      }

      animationRef.current = requestAnimationFrame(detectMotion);
    };

    animationRef.current = requestAnimationFrame(detectMotion);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isWebcamActive, useCameraTracking, pinchMode, updateHandLandmarks]);

  // Mouse tracking simulator fallback
  useEffect(() => {
    if (useCameraTracking && isWebcamActive) return;

    const handleMouseMove = (e) => {
      const nextX = e.clientX / window.innerWidth;
      const nextY = e.clientY / window.innerHeight;

      const dx = nextX - smoothedCentroidRef.current.x;
      const dy = nextY - smoothedCentroidRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      smoothedCentroidRef.current = { x: nextX, y: nextY };

      const landmarks = Array.from({ length: 21 }, (_, idx) => {
        if (idx === 8) return { x: nextX, y: nextY };
        if (idx === 4) return { x: nextX + (pinchMode ? 0 : 0.05), y: nextY + (pinchMode ? 0 : 0.05) };
        return { x: nextX, y: nextY + 0.1 };
      });

      updateHandLandmarks(landmarks, { velocity: dist });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [useCameraTracking, isWebcamActive, pinchMode, updateHandLandmarks]);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
      {/* Guides Tooltip Card */}
      {showHelp && (
        <div className="w-72 glass-panel rounded-xl p-4 text-[10px] text-gray-300 border border-white/5 space-y-2 shadow-xl">
          <div className="flex justify-between items-center border-b border-white/5 pb-1">
            <span className="font-bold text-calm-blue uppercase tracking-wider">Gestures Quick Guide</span>
            <button onClick={() => setShowHelp(false)} className="text-gray-500 hover:text-white cursor-pointer font-bold">✕</button>
          </div>
          <div className="space-y-1 text-gray-400">
            <p><strong className="text-white">Mouse Cursor:</strong> Moves the active finger tip target coordinate.</p>
            <p><strong className="text-white">[Spacebar] / Click-Hold:</strong> Triggers pinch gesture (melts candle wax).</p>
            <p><strong className="text-white">[Shift] Key:</strong> Toggle flat palm vs knuckles mode (attracts/repels fish).</p>
            <p><strong className="text-white">Camera Centroid:</strong> Focuses centroid tracking on movements.</p>
          </div>
        </div>
      )}

      {/* Controller HUD */}
      <div className="flex items-center gap-3 bg-[#121720]/90 backdrop-blur-md rounded-xl p-3 border border-white/5 shadow-2xl">
        <button
          onClick={() => setUseCameraTracking(p => !p)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
            useCameraTracking && isWebcamActive
              ? 'bg-calm-green/10 text-calm-green border-calm-green/20'
              : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
          }`}
        >
          {useCameraTracking && isWebcamActive ? (
            <>
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Tracking</span>
            </>
          ) : (
            <>
              <MousePointer className="w-3.5 h-3.5" />
              <span>Mouse Simulation</span>
            </>
          )}
        </button>

        {useCameraTracking && isWebcamActive && (
          <div className="relative w-16 h-12 rounded-lg bg-black border border-white/10 overflow-hidden">
            <video ref={videoRef} playsInline muted className="hidden" />
            <canvas ref={canvasRef} className="w-full h-full object-cover" />
            <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-calm-green animate-ping" />
          </div>
        )}

        <div className="flex flex-col gap-1 text-[8px] uppercase font-bold text-gray-400 pr-1">
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${flatMode ? 'bg-calm-blue' : 'bg-calm-pink'}`} />
            <span>{flatMode ? 'Flat Palm' : 'Knuckles'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${pinchMode ? 'bg-calm-pink' : 'bg-gray-600'}`} />
            <span>{pinchMode ? 'Pinching' : 'Open'}</span>
          </div>
        </div>

        <button
          onClick={() => setShowHelp(p => !p)}
          className="text-gray-500 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
