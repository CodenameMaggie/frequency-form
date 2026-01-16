'use client';

/**
 * AI Body Scanner Component
 * Uses camera capture with auto-detection and user-guided point selection
 * Supports close quarters (3-4 feet) scanning
 */

import { useRef, useState, useCallback, useEffect } from 'react';

interface BodyMeasurements {
  bust: string;
  waist: string;
  hips: string;
  height_feet: string;
  height_inches: string;
  shoulder_width: string;
  arm_length: string;
  inseam: string;
  leg_length: string;
  torso_length: string;
  body_type?: string;
  torso_type?: 'short' | 'average' | 'long';
  recommended_silhouettes?: string[];
}

interface Point {
  x: number;
  y: number;
}

interface BodyScannerProps {
  onMeasurementsComplete: (measurements: BodyMeasurements) => void;
  onCancel: () => void;
}

// Measurement point definitions
const MEASUREMENT_POINTS = [
  { id: 'head_top', label: 'Top of head', instruction: 'Tap the very top of your head' },
  { id: 'left_shoulder', label: 'Left shoulder', instruction: 'Tap the edge of your left shoulder' },
  { id: 'right_shoulder', label: 'Right shoulder', instruction: 'Tap the edge of your right shoulder' },
  { id: 'bust_left', label: 'Left bust', instruction: 'Tap the widest point on your left side at bust level' },
  { id: 'bust_right', label: 'Right bust', instruction: 'Tap the widest point on your right side at bust level' },
  { id: 'waist_left', label: 'Left waist', instruction: 'Tap your left side at your natural waist (narrowest point)' },
  { id: 'waist_right', label: 'Right waist', instruction: 'Tap your right side at your natural waist' },
  { id: 'hip_left', label: 'Left hip', instruction: 'Tap the widest point of your left hip' },
  { id: 'hip_right', label: 'Right hip', instruction: 'Tap the widest point of your right hip' },
  { id: 'crotch', label: 'Crotch', instruction: 'Tap at your crotch level' },
  { id: 'ankle', label: 'Ankles', instruction: 'Tap at your ankle level' },
];

export default function BodyScanner({ onMeasurementsComplete, onCancel }: BodyScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<'calibrate' | 'capture' | 'points' | 'review' | 'confirm'>('calibrate');
  const [editableMeasurements, setEditableMeasurements] = useState<BodyMeasurements | null>(null);
  const [calibrationHeight, setCalibrationHeight] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [points, setPoints] = useState<Record<string, Point>>({});
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [personDetected, setPersonDetected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<string>('Waiting for you to appear...');
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFrameRef = useRef<ImageData | null>(null);
  const stableFrameCountRef = useRef(0);

  // Detect person in frame using motion and skin tone detection
  const detectPerson = useCallback(() => {
    if (!videoRef.current || !detectionCanvasRef.current) return false;

    const video = videoRef.current;
    const canvas = detectionCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    // Set canvas to smaller size for faster processing
    canvas.width = 160;
    canvas.height = 120;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Count skin-tone pixels and significant movement
    let skinPixels = 0;
    let centerPixels = 0;
    let motionPixels = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const centerRadius = canvas.width * 0.35;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const pixelIndex = i / 4;
      const x = pixelIndex % canvas.width;
      const y = Math.floor(pixelIndex / canvas.width);

      // Check for skin tones (works for various skin colors)
      const isSkinTone =
        r > 60 && g > 40 && b > 20 &&
        r > g && r > b &&
        Math.abs(r - g) > 15 &&
        r - b > 15;

      if (isSkinTone) {
        skinPixels++;
        // Check if in center region
        const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        if (distFromCenter < centerRadius) {
          centerPixels++;
        }
      }

      // Detect motion by comparing with last frame
      if (lastFrameRef.current) {
        const lastR = lastFrameRef.current.data[i];
        const lastG = lastFrameRef.current.data[i + 1];
        const lastB = lastFrameRef.current.data[i + 2];
        const diff = Math.abs(r - lastR) + Math.abs(g - lastG) + Math.abs(b - lastB);
        if (diff > 50) motionPixels++;
      }
    }

    lastFrameRef.current = imageData;

    const totalPixels = canvas.width * canvas.height;
    const skinPercentage = (skinPixels / totalPixels) * 100;
    const centerPercentage = (centerPixels / totalPixels) * 100;
    const motionPercentage = (motionPixels / totalPixels) * 100;

    // Person is detected if there's enough skin tone in center and not too much motion (holding still)
    const hasEnoughPresence = skinPercentage > 3 && centerPercentage > 1;
    const isStable = motionPercentage < 5;

    if (hasEnoughPresence) {
      if (isStable) {
        stableFrameCountRef.current++;
        if (stableFrameCountRef.current > 10) {
          setDetectionStatus('Perfect! Hold still...');
          return true;
        } else {
          setDetectionStatus('Good position! Hold still...');
        }
      } else {
        stableFrameCountRef.current = Math.max(0, stableFrameCountRef.current - 2);
        setDetectionStatus('Stay still for auto-capture...');
      }
    } else {
      stableFrameCountRef.current = 0;
      setDetectionStatus('Position yourself in the frame...');
    }

    return false;
  }, []);

  // Start camera with auto-detection
  const startCamera = useCallback(async () => {
    try {
      setStep('capture');
      setPersonDetected(false);
      setCountdown(null);
      stableFrameCountRef.current = 0;
      lastFrameRef.current = null;

      // Request camera - use environment (back) camera on mobile for easier self-scanning
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isMobile ? 'environment' : 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
      });

      streamRef.current = stream;
      await new Promise(resolve => setTimeout(resolve, 100));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsCameraActive(true);
            // Start person detection
            detectionIntervalRef.current = setInterval(() => {
              if (detectPerson()) {
                setPersonDetected(true);
              }
            }, 200);
          }).catch((playErr) => {
            console.error('Video play failed:', playErr);
            setError('Could not start video playback. Please try again.');
          });
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied. Please allow camera access to use the body scanner.');
      setStep('calibrate');
    }
  }, [detectPerson]);

  // Auto-capture countdown when person is detected
  useEffect(() => {
    if (personDetected && step === 'capture' && countdown === null) {
      setCountdown(3);
    }
  }, [personDetected, step, countdown]);

  // Countdown timer
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownIntervalRef.current = setTimeout(() => {
        // Re-check if person is still stable
        if (detectPerson()) {
          setCountdown(countdown - 1);
        } else {
          // Person moved, reset countdown
          setCountdown(null);
          setPersonDetected(false);
          stableFrameCountRef.current = 0;
        }
      }, 1000);
    } else if (countdown === 0) {
      capturePhoto();
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearTimeout(countdownIntervalRef.current);
      }
    };
  }, [countdown, detectPerson]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearTimeout(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setPersonDetected(false);
    setCountdown(null);
  }, []);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw image (mirror for front camera)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);

    stopCamera();
    setStep('points');
    setCurrentPointIndex(0);
    setPoints({});
  }, [stopCamera]);

  // Handle point click on image
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (currentPointIndex >= MEASUREMENT_POINTS.length) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const currentPoint = MEASUREMENT_POINTS[currentPointIndex];
    const newPoints = { ...points, [currentPoint.id]: { x, y } };
    setPoints(newPoints);

    if (currentPointIndex < MEASUREMENT_POINTS.length - 1) {
      setCurrentPointIndex(currentPointIndex + 1);
    } else {
      calculateMeasurements(newPoints);
    }
  }, [currentPointIndex, points]);

  // Calculate measurements from points
  const calculateMeasurements = useCallback((pts: Record<string, Point>) => {
    const heightInches = parseInt(calibrationHeight);
    if (!heightInches) return;

    const headTop = pts['head_top'];
    const ankle = pts['ankle'];
    const pixelHeight = ankle.y - headTop.y;
    const pixelsPerInch = pixelHeight / heightInches;

    const circumferenceMultiplier = 2.5;

    const shoulderWidthPx = Math.abs(pts['right_shoulder'].x - pts['left_shoulder'].x);
    const shoulderInches = Math.round((shoulderWidthPx / pixelsPerInch) * 100) / 10;

    const bustWidthPx = Math.abs(pts['bust_right'].x - pts['bust_left'].x);
    const bustCircumference = Math.round((bustWidthPx / pixelsPerInch) * circumferenceMultiplier);

    const waistWidthPx = Math.abs(pts['waist_right'].x - pts['waist_left'].x);
    const waistCircumference = Math.round((waistWidthPx / pixelsPerInch) * circumferenceMultiplier);

    const hipWidthPx = Math.abs(pts['hip_right'].x - pts['hip_left'].x);
    const hipCircumference = Math.round((hipWidthPx / pixelsPerInch) * circumferenceMultiplier);

    const inseamPx = pts['ankle'].y - pts['crotch'].y;
    const inseamInches = Math.round((inseamPx / pixelsPerInch) * 10) / 10;

    // Leg length (from hip to ankle - outer leg measurement)
    const hipY = (pts['hip_left'].y + pts['hip_right'].y) / 2;
    const legLengthPx = pts['ankle'].y - hipY;
    const legLengthInches = Math.round((legLengthPx / pixelsPerInch) * 10) / 10;

    // Torso length (from shoulder to hip)
    const shoulderY = (pts['left_shoulder'].y + pts['right_shoulder'].y) / 2;
    const torsoLengthPx = hipY - shoulderY;
    const torsoLengthInches = Math.round((torsoLengthPx / pixelsPerInch) * 10) / 10;

    const armLengthInches = Math.round(shoulderInches * 1.5 * 10) / 10;

    const heightFeet = Math.floor(heightInches / 12);
    const heightRemainder = heightInches % 12;

    // Determine torso type based on torso-to-leg ratio
    // Average ratio is around 0.6-0.7 (torso is shorter than legs)
    const torsoLegRatio = torsoLengthInches / legLengthInches;
    let torsoType: 'short' | 'average' | 'long' = 'average';
    if (torsoLegRatio < 0.55) {
      torsoType = 'short';
    } else if (torsoLegRatio > 0.75) {
      torsoType = 'long';
    }

    let bodyType = 'rectangle';
    let silhouettes: string[] = [];

    const bustHipDiff = Math.abs(bustCircumference - hipCircumference);
    const waistBustRatio = waistCircumference / bustCircumference;
    const waistHipRatio = waistCircumference / hipCircumference;

    if (bustHipDiff <= 2 && waistBustRatio <= 0.75) {
      bodyType = 'hourglass';
      silhouettes = ['wrap', 'fit_and_flare', 'belted', 'bodycon'];
    } else if (hipCircumference > bustCircumference + 3 && waistHipRatio <= 0.8) {
      bodyType = 'pear';
      silhouettes = ['a_line', 'empire_waist', 'boat_neck', 'structured_shoulder'];
    } else if (bustCircumference > hipCircumference + 3) {
      bodyType = 'inverted_triangle';
      silhouettes = ['a_line', 'wide_leg', 'v_neck', 'flared_skirt'];
    } else if (waistBustRatio >= 0.85 && waistHipRatio >= 0.85) {
      bodyType = 'apple';
      silhouettes = ['empire_waist', 'wrap', 'a_line', 'v_neck'];
    } else {
      bodyType = 'rectangle';
      silhouettes = ['belted', 'peplum', 'layered', 'ruffled'];
    }

    const calculatedMeasurements: BodyMeasurements = {
      bust: String(bustCircumference),
      waist: String(waistCircumference),
      hips: String(hipCircumference),
      height_feet: String(heightFeet),
      height_inches: String(heightRemainder),
      shoulder_width: String(shoulderInches),
      arm_length: String(armLengthInches),
      inseam: String(inseamInches),
      leg_length: String(legLengthInches),
      torso_length: String(torsoLengthInches),
      body_type: bodyType,
      torso_type: torsoType,
      recommended_silhouettes: silhouettes,
    };

    setMeasurements(calculatedMeasurements);
    setEditableMeasurements(calculatedMeasurements);
    setStep('review');
  }, [calibrationHeight]);

  // Undo last point
  const undoLastPoint = useCallback(() => {
    if (currentPointIndex > 0) {
      const prevPoint = MEASUREMENT_POINTS[currentPointIndex - 1];
      const newPoints = { ...points };
      delete newPoints[prevPoint.id];
      setPoints(newPoints);
      setCurrentPointIndex(currentPointIndex - 1);
    }
  }, [currentPointIndex, points]);

  // Handle calibration completion
  const handleCalibrationComplete = useCallback(() => {
    const heightInches = parseInt(calibrationHeight);
    if (!heightInches || heightInches < 48 || heightInches > 96) {
      setError('Please enter a valid height between 4\'0" and 8\'0"');
      return;
    }
    setError(null);
    startCamera();
  }, [calibrationHeight, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Render calibration step
  if (step === 'calibrate') {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#f5f3ee]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#c8b28a]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#c8b28a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h3 className="font-serif text-2xl text-[#1f2937] mb-2">Body Scanner</h3>
          <p className="text-[#6b7280]">Auto-capture when you're in position</p>
        </div>

        <div className="mb-6">
          <label className="block text-xs text-[#9ca3af] uppercase tracking-wider mb-2">
            Enter your height for calibration *
          </label>
          <div className="flex gap-4">
            <select
              value={Math.floor(parseInt(calibrationHeight || '0') / 12) || ''}
              onChange={(e) => {
                const feet = parseInt(e.target.value) || 0;
                const inches = parseInt(calibrationHeight || '0') % 12;
                setCalibrationHeight(String(feet * 12 + inches));
              }}
              className="flex-1 px-4 py-3 border border-[#e5e7eb] rounded-lg focus:border-[#c8b28a] focus:outline-none text-lg"
            >
              <option value="">Feet</option>
              {[4, 5, 6, 7].map(ft => (
                <option key={ft} value={ft}>{ft} ft</option>
              ))}
            </select>
            <select
              value={parseInt(calibrationHeight || '0') % 12 || ''}
              onChange={(e) => {
                const feet = Math.floor(parseInt(calibrationHeight || '0') / 12);
                const inches = parseInt(e.target.value) || 0;
                setCalibrationHeight(String(feet * 12 + inches));
              }}
              className="flex-1 px-4 py-3 border border-[#e5e7eb] rounded-lg focus:border-[#c8b28a] focus:outline-none text-lg"
            >
              <option value="">Inches</option>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(inch => (
                <option key={inch} value={inch}>{inch} in</option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <div className="bg-[#f5f3ee] p-6 rounded-lg mb-6">
          <h4 className="font-medium text-[#1f2937] mb-3">How it works:</h4>
          <ul className="space-y-2 text-sm text-[#6b7280]">
            <li className="flex items-start gap-2">
              <span className="text-[#c8b28a]">1.</span>
              <span>Position yourself so your full body is visible (3-6 feet works great)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#c8b28a]">2.</span>
              <span>Camera will auto-capture when you hold still</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#c8b28a]">3.</span>
              <span>Tap key points on your body to calculate measurements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#c8b28a]">4.</span>
              <span>Wear fitted clothing for best accuracy</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-[#e5e7eb] text-[#6b7280] rounded-lg hover:bg-[#f5f3ee] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCalibrationComplete}
            disabled={!calibrationHeight || parseInt(calibrationHeight) < 48}
            className="flex-1 py-3 bg-[#1f2937] text-white rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-50"
          >
            Start Scanner
          </button>
        </div>
      </div>
    );
  }

  // Render capture step
  if (step === 'capture') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[#f5f3ee]">
        <div className="relative">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '3/4' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
              style={{ transform: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'none' : 'scaleX(-1)' }}
            />
            <canvas ref={canvasRef} className="hidden" />
            <canvas ref={detectionCanvasRef} className="hidden" />

            {/* Body guide overlay - more flexible for closer distances */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Outer frame guide */}
                <rect x="15" y="3" width="70" height="94" fill="none" stroke="rgba(200,178,138,0.4)" strokeWidth="0.3" strokeDasharray="3,3" rx="5" />
                {/* Center line */}
                <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(200,178,138,0.2)" strokeWidth="0.3" strokeDasharray="2,4" />
                {/* Head area */}
                <ellipse cx="50" cy="12" rx="12" ry="9" fill="none" stroke="rgba(200,178,138,0.4)" strokeWidth="0.3" strokeDasharray="2,2" />
                {/* Shoulder line */}
                <line x1="25" y1="25" x2="75" y2="25" stroke="rgba(200,178,138,0.3)" strokeWidth="0.3" strokeDasharray="2,2" />
                {/* Body outline */}
                <path d="M 35 25 Q 30 45 32 65 Q 35 85 38 95" fill="none" stroke="rgba(200,178,138,0.3)" strokeWidth="0.3" strokeDasharray="2,2" />
                <path d="M 65 25 Q 70 45 68 65 Q 65 85 62 95" fill="none" stroke="rgba(200,178,138,0.3)" strokeWidth="0.3" strokeDasharray="2,2" />
              </svg>
            </div>

            {/* Countdown overlay */}
            {countdown !== null && countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-32 h-32 rounded-full bg-[#c8b28a] flex items-center justify-center animate-pulse">
                  <span className="text-6xl font-bold text-white">{countdown}</span>
                </div>
              </div>
            )}

            {/* Detection status */}
            <div className={`absolute bottom-4 left-4 right-4 px-4 py-3 rounded-lg text-white text-center transition-colors ${
              personDetected ? 'bg-green-600/80' : 'bg-black/60'
            }`}>
              <p className="text-sm font-medium">{detectionStatus}</p>
              {!personDetected && (
                <p className="text-xs mt-1 opacity-75">Stand in view and hold still to auto-capture</p>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => {
                stopCamera();
                setStep('calibrate');
              }}
              className="flex-1 py-3 border border-[#e5e7eb] text-[#6b7280] rounded-lg hover:bg-[#f5f3ee] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={capturePhoto}
              disabled={!isCameraActive}
              className="flex-1 py-3 bg-[#1f2937] text-white rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Capture Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render point selection step
  if (step === 'points' && capturedImage) {
    const currentPoint = MEASUREMENT_POINTS[currentPointIndex];
    const progress = (currentPointIndex / MEASUREMENT_POINTS.length) * 100;

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[#f5f3ee]">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[#6b7280] mb-1">
            <span>Marking points</span>
            <span>{currentPointIndex}/{MEASUREMENT_POINTS.length}</span>
          </div>
          <div className="h-2 bg-[#f5f3ee] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#c8b28a] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current instruction */}
        {currentPoint && (
          <div className="bg-[#1f2937] text-white p-4 rounded-lg mb-4">
            <div className="text-xs text-[#c8b28a] uppercase tracking-wider mb-1">{currentPoint.label}</div>
            <div className="text-sm">{currentPoint.instruction}</div>
          </div>
        )}

        {/* Image with points */}
        <div
          className="relative bg-gray-100 rounded-lg overflow-hidden cursor-crosshair"
          style={{ aspectRatio: '3/4' }}
          onClick={handleImageClick}
        >
          <img
            src={capturedImage}
            alt="Captured body"
            className="w-full h-full object-cover"
          />

          {/* Marked points */}
          {Object.entries(points).map(([id, point]) => (
            <div
              key={id}
              className="absolute w-4 h-4 bg-[#c8b28a] border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg"
              style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
            />
          ))}

          {/* Connection lines for symmetrical points */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {points['left_shoulder'] && points['right_shoulder'] && (
              <line
                x1={`${points['left_shoulder'].x * 100}%`}
                y1={`${points['left_shoulder'].y * 100}%`}
                x2={`${points['right_shoulder'].x * 100}%`}
                y2={`${points['right_shoulder'].y * 100}%`}
                stroke="#c8b28a"
                strokeWidth="2"
              />
            )}
            {points['bust_left'] && points['bust_right'] && (
              <line
                x1={`${points['bust_left'].x * 100}%`}
                y1={`${points['bust_left'].y * 100}%`}
                x2={`${points['bust_right'].x * 100}%`}
                y2={`${points['bust_right'].y * 100}%`}
                stroke="#c8b28a"
                strokeWidth="2"
              />
            )}
            {points['waist_left'] && points['waist_right'] && (
              <line
                x1={`${points['waist_left'].x * 100}%`}
                y1={`${points['waist_left'].y * 100}%`}
                x2={`${points['waist_right'].x * 100}%`}
                y2={`${points['waist_right'].y * 100}%`}
                stroke="#c8b28a"
                strokeWidth="2"
              />
            )}
            {points['hip_left'] && points['hip_right'] && (
              <line
                x1={`${points['hip_left'].x * 100}%`}
                y1={`${points['hip_left'].y * 100}%`}
                x2={`${points['hip_right'].x * 100}%`}
                y2={`${points['hip_right'].y * 100}%`}
                stroke="#c8b28a"
                strokeWidth="2"
              />
            )}
          </svg>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={undoLastPoint}
            disabled={currentPointIndex === 0}
            className="flex-1 py-3 border border-[#e5e7eb] text-[#6b7280] rounded-lg hover:bg-[#f5f3ee] transition-colors disabled:opacity-50"
          >
            Undo
          </button>
          <button
            onClick={() => {
              setCapturedImage(null);
              setPoints({});
              startCamera();
            }}
            className="flex-1 py-3 border border-[#e5e7eb] text-[#6b7280] rounded-lg hover:bg-[#f5f3ee] transition-colors"
          >
            Retake Photo
          </button>
        </div>
      </div>
    );
  }

  // Render review/edit step
  if (step === 'review' && editableMeasurements) {
    const updateMeasurement = (key: keyof BodyMeasurements, value: string) => {
      setEditableMeasurements(prev => prev ? { ...prev, [key]: value } : null);
    };

    const measurementFields = [
      { key: 'bust' as const, label: 'Bust', suffix: '"', min: 20, max: 60 },
      { key: 'waist' as const, label: 'Waist', suffix: '"', min: 20, max: 50 },
      { key: 'hips' as const, label: 'Hips', suffix: '"', min: 25, max: 60 },
      { key: 'shoulder_width' as const, label: 'Shoulders', suffix: '"', min: 10, max: 25 },
      { key: 'torso_length' as const, label: 'Torso Length', suffix: '"', min: 12, max: 25 },
      { key: 'arm_length' as const, label: 'Arm Length', suffix: '"', min: 15, max: 35 },
      { key: 'leg_length' as const, label: 'Leg Length', suffix: '"', min: 25, max: 50 },
      { key: 'inseam' as const, label: 'Inseam', suffix: '"', min: 20, max: 40 },
    ];

    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#f5f3ee]">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#c8b28a]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#c8b28a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="font-serif text-2xl text-[#1f2937] mb-2">Review & Adjust</h3>
          <p className="text-[#6b7280]">Verify your measurements and make any corrections</p>
        </div>

        {/* Height (special handling) */}
        <div className="mb-6">
          <label className="block text-xs text-[#9ca3af] uppercase tracking-wider mb-2">Height</label>
          <div className="flex gap-4">
            <select
              value={editableMeasurements.height_feet}
              onChange={(e) => updateMeasurement('height_feet', e.target.value)}
              className="flex-1 px-4 py-3 border border-[#e5e7eb] rounded-lg focus:border-[#c8b28a] focus:outline-none"
            >
              {[4, 5, 6, 7].map(ft => (
                <option key={ft} value={ft}>{ft} ft</option>
              ))}
            </select>
            <select
              value={editableMeasurements.height_inches}
              onChange={(e) => updateMeasurement('height_inches', e.target.value)}
              className="flex-1 px-4 py-3 border border-[#e5e7eb] rounded-lg focus:border-[#c8b28a] focus:outline-none"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(inch => (
                <option key={inch} value={inch}>{inch} in</option>
              ))}
            </select>
          </div>
        </div>

        {/* Other measurements */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {measurementFields.map(field => (
            <div key={field.key}>
              <label className="block text-xs text-[#9ca3af] uppercase tracking-wider mb-2">
                {field.label}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={editableMeasurements[field.key]}
                  onChange={(e) => updateMeasurement(field.key, e.target.value)}
                  min={field.min}
                  max={field.max}
                  step="0.5"
                  className="w-full px-4 py-3 pr-8 border border-[#e5e7eb] rounded-lg focus:border-[#c8b28a] focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">{field.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        {editableMeasurements.body_type && (
          <div className="bg-[#f5f3ee] p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#9ca3af] uppercase tracking-wider mb-1">Body Type</div>
                <div className="text-lg font-medium text-[#1f2937] capitalize">{editableMeasurements.body_type.replace('_', ' ')}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#9ca3af] uppercase tracking-wider mb-1">Best Silhouettes</div>
                <div className="flex flex-wrap justify-end gap-1">
                  {editableMeasurements.recommended_silhouettes?.slice(0, 2).map(s => (
                    <span key={s} className="px-2 py-1 bg-[#c8b28a]/30 text-[#1f2937] text-xs rounded capitalize">
                      {s.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-[#9ca3af] text-center mb-6">
          Tip: For best accuracy, verify key measurements (bust, waist, hips) with a tape measure.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => {
              setStep('calibrate');
              setMeasurements(null);
              setEditableMeasurements(null);
              setCapturedImage(null);
              setPoints({});
            }}
            className="flex-1 py-3 border border-[#e5e7eb] text-[#6b7280] rounded-lg hover:bg-[#f5f3ee] transition-colors"
          >
            Rescan
          </button>
          <button
            onClick={() => {
              setMeasurements(editableMeasurements);
              setStep('confirm');
            }}
            className="flex-1 py-3 bg-[#1f2937] text-white rounded-lg hover:bg-[#374151] transition-colors"
          >
            Confirm Measurements
          </button>
        </div>
      </div>
    );
  }

  // Render final confirmation step - "Confirm All"
  if (step === 'confirm' && measurements) {
    const torsoTypeLabel = {
      short: 'Short Torso / Long Legs',
      average: 'Balanced Proportions',
      long: 'Long Torso / Short Legs'
    };

    const torsoTypeDescription = {
      short: 'Higher rise bottoms and crop tops work well for you',
      average: 'Most standard cuts will fit your proportions',
      long: 'Low rise bottoms and longer tops balance your frame'
    };

    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#f5f3ee]">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#c8b28a]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#c8b28a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-serif text-2xl text-[#1f2937] mb-2">Confirm All Measurements</h3>
          <p className="text-[#6b7280]">Please verify everything looks correct before saving</p>
        </div>

        {/* Key measurements highlight */}
        <div className="bg-[#f5f3ee] p-5 rounded-lg mb-6">
          <div className="text-xs text-[#9ca3af] uppercase tracking-wider mb-3">Key Measurements</div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-light text-[#1f2937]">{measurements.bust}"</div>
              <div className="text-xs text-[#6b7280]">Bust</div>
            </div>
            <div>
              <div className="text-2xl font-light text-[#1f2937]">{measurements.waist}"</div>
              <div className="text-xs text-[#6b7280]">Waist</div>
            </div>
            <div>
              <div className="text-2xl font-light text-[#1f2937]">{measurements.hips}"</div>
              <div className="text-xs text-[#6b7280]">Hips</div>
            </div>
            <div>
              <div className="text-2xl font-light text-[#1f2937]">{measurements.height_feet}'{measurements.height_inches}"</div>
              <div className="text-xs text-[#6b7280]">Height</div>
            </div>
          </div>
        </div>

        {/* Proportion info - important for non-standard proportions */}
        <div className="bg-[#1f2937] text-white p-5 rounded-lg mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-xs text-[#c8b28a] uppercase tracking-wider mb-1">Your Proportions</div>
              <div className="text-lg font-medium capitalize mb-1">
                {measurements.torso_type ? torsoTypeLabel[measurements.torso_type] : 'Balanced'}
              </div>
              <div className="text-sm text-white/70">
                {measurements.torso_type ? torsoTypeDescription[measurements.torso_type] : ''}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#c8b28a] uppercase tracking-wider mb-1">Torso / Legs</div>
              <div className="text-lg">{measurements.torso_length}" / {measurements.leg_length}"</div>
            </div>
          </div>
        </div>

        {/* All measurements grid */}
        <div className="mb-6">
          <div className="text-xs text-[#9ca3af] uppercase tracking-wider mb-3">All Measurements</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Shoulders', value: measurements.shoulder_width },
              { label: 'Torso', value: measurements.torso_length },
              { label: 'Arm Length', value: measurements.arm_length },
              { label: 'Leg Length', value: measurements.leg_length },
              { label: 'Inseam', value: measurements.inseam },
            ].map(item => (
              <div key={item.label} className="bg-white border border-[#e5e7eb] p-3 rounded-lg text-center">
                <div className="text-lg text-[#1f2937]">{item.value}"</div>
                <div className="text-xs text-[#9ca3af]">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Body type and silhouettes */}
        {measurements.body_type && (
          <div className="flex items-center justify-between bg-[#f5f3ee] p-4 rounded-lg mb-6">
            <div>
              <div className="text-xs text-[#9ca3af] uppercase tracking-wider mb-1">Body Shape</div>
              <div className="text-lg font-medium text-[#1f2937] capitalize">{measurements.body_type.replace('_', ' ')}</div>
            </div>
            <div className="flex gap-2">
              {measurements.recommended_silhouettes?.slice(0, 3).map(s => (
                <span key={s} className="px-2 py-1 bg-[#c8b28a]/30 text-[#1f2937] text-xs rounded capitalize">
                  {s.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="font-medium text-amber-800 text-sm">Does everything look right?</div>
              <div className="text-amber-700 text-xs mt-1">
                These measurements will be used for personalized style recommendations.
                If anything seems off, tap "Go Back & Edit" to make corrections.
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setStep('review')}
            className="flex-1 py-3 border border-[#e5e7eb] text-[#6b7280] rounded-lg hover:bg-[#f5f3ee] transition-colors"
          >
            Go Back & Edit
          </button>
          <button
            onClick={() => onMeasurementsComplete(measurements)}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Yes, Save My Measurements
          </button>
        </div>
      </div>
    );
  }

  return null;
}
