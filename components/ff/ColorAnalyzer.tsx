'use client';

/**
 * AI Color Analyzer Component
 * Uses face photo to analyze skin tone, undertones, and determine color season
 */

import { useRef, useState, useCallback, useEffect } from 'react';

interface ColorProfile {
  color_season: string;
  color_season_subtype: string;
  skin_undertone: string;
  skin_depth: string;
  best_colors: Array<{ hex: string; name: string }>;
  best_metals: string[];
  contrast_level: string;
}

interface ColorAnalyzerProps {
  onAnalysisComplete: (profile: ColorProfile) => void;
  onCancel: () => void;
}

// Color palettes by season
const COLOR_PALETTES: Record<string, Array<{ hex: string; name: string }>> = {
  spring: [
    { hex: '#FF6B6B', name: 'coral' },
    { hex: '#FFE4B5', name: 'warm ivory' },
    { hex: '#98D8C8', name: 'seafoam' },
    { hex: '#F7DC6F', name: 'buttercup' },
    { hex: '#85C1E9', name: 'sky blue' },
    { hex: '#FADBD8', name: 'peach' },
    { hex: '#A9DFBF', name: 'mint' },
    { hex: '#F5B041', name: 'marigold' }
  ],
  summer: [
    { hex: '#D7BDE2', name: 'lavender' },
    { hex: '#AED6F1', name: 'powder blue' },
    { hex: '#F5B7B1', name: 'dusty rose' },
    { hex: '#D5DBDB', name: 'soft gray' },
    { hex: '#A9CCE3', name: 'periwinkle' },
    { hex: '#D5F5E3', name: 'sage' },
    { hex: '#EBDEF0', name: 'mauve' },
    { hex: '#AEB6BF', name: 'slate' }
  ],
  autumn: [
    { hex: '#D35400', name: 'burnt orange' },
    { hex: '#8B4513', name: 'saddle brown' },
    { hex: '#CD853F', name: 'camel' },
    { hex: '#556B2F', name: 'olive' },
    { hex: '#800020', name: 'burgundy' },
    { hex: '#D2691E', name: 'rust' },
    { hex: '#F4A460', name: 'terracotta' },
    { hex: '#2E4A3E', name: 'forest' }
  ],
  winter: [
    { hex: '#1C1C1C', name: 'jet black' },
    { hex: '#FFFFFF', name: 'pure white' },
    { hex: '#DC143C', name: 'true red' },
    { hex: '#4169E1', name: 'royal blue' },
    { hex: '#008080', name: 'teal' },
    { hex: '#800080', name: 'purple' },
    { hex: '#C0C0C0', name: 'silver' },
    { hex: '#000080', name: 'navy' }
  ]
};

export default function ColorAnalyzer({ onAnalysisComplete, onCancel }: ColorAnalyzerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<'intro' | 'capture' | 'analyzing' | 'review'>('intro');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colorProfile, setColorProfile] = useState<ColorProfile | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setStep('capture');
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;
      await new Promise(resolve => setTimeout(resolve, 100));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsCameraActive(true);
          }).catch((playErr) => {
            console.error('Video play failed:', playErr);
            setError('Could not start video. Please try again.');
          });
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied. Please allow camera access.');
      setStep('intro');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Auto-capture with countdown
  const startCountdown = useCallback(() => {
    setCountdown(3);
  }, []);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      capturePhoto();
    }
  }, [countdown]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Mirror image
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    stopCamera();
    setCountdown(null);
    analyzeColors(ctx, canvas.width, canvas.height);
  }, [stopCamera]);

  // Analyze colors from face region
  const analyzeColors = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    setStep('analyzing');

    // Sample center region (face area)
    const faceX = width * 0.3;
    const faceY = height * 0.15;
    const faceW = width * 0.4;
    const faceH = height * 0.5;

    const imageData = ctx.getImageData(faceX, faceY, faceW, faceH);
    const data = imageData.data;

    let totalR = 0, totalG = 0, totalB = 0;
    let skinPixels = 0;

    // Sample skin-tone pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Basic skin detection
      if (r > 60 && g > 40 && b > 20 && r > g && r > b) {
        totalR += r;
        totalG += g;
        totalB += b;
        skinPixels++;
      }
    }

    if (skinPixels < 100) {
      // Fallback: sample center pixels anyway
      for (let i = 0; i < data.length; i += 4) {
        totalR += data[i];
        totalG += data[i + 1];
        totalB += data[i + 2];
        skinPixels++;
      }
    }

    const avgR = totalR / skinPixels;
    const avgG = totalG / skinPixels;
    const avgB = totalB / skinPixels;

    // Determine undertone
    let undertone: string;
    const warmth = avgR - avgB;
    if (warmth > 30) {
      undertone = 'warm';
    } else if (warmth < -10) {
      undertone = 'cool';
    } else {
      undertone = 'neutral';
    }

    // Determine skin depth
    const brightness = (avgR + avgG + avgB) / 3;
    let depth: string;
    if (brightness > 200) depth = 'fair';
    else if (brightness > 170) depth = 'light';
    else if (brightness > 140) depth = 'medium';
    else if (brightness > 100) depth = 'olive';
    else depth = 'deep';

    // Determine contrast (simplified)
    let contrast: string;
    if (depth === 'fair' || depth === 'deep') {
      contrast = 'high';
    } else {
      contrast = 'medium';
    }

    // Determine season
    let season: string;
    let subtype: string;

    if (undertone === 'warm' || undertone === 'neutral') {
      if (depth === 'fair' || depth === 'light') {
        season = 'spring';
        subtype = contrast === 'high' ? 'bright' : 'light';
      } else {
        season = 'autumn';
        subtype = depth === 'deep' ? 'deep' : 'soft';
      }
    } else {
      if (depth === 'fair' || depth === 'light') {
        season = 'summer';
        subtype = contrast === 'high' ? 'light' : 'soft';
      } else {
        season = 'winter';
        subtype = depth === 'deep' ? 'deep' : 'cool';
      }
    }

    const metals = ['spring', 'autumn'].includes(season)
      ? ['gold', 'bronze', 'copper']
      : ['silver', 'platinum', 'white gold'];

    const profile: ColorProfile = {
      color_season: season,
      color_season_subtype: subtype,
      skin_undertone: undertone,
      skin_depth: depth,
      best_colors: COLOR_PALETTES[season],
      best_metals: metals,
      contrast_level: contrast
    };

    // Simulate analysis time
    setTimeout(() => {
      setColorProfile(profile);
      setStep('review');
    }, 2000);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Intro step
  if (step === 'intro') {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#f5f3ee]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#c8b28a]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#c8b28a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h3 className="font-serif text-2xl text-[#1f2937] mb-2">Color Analysis</h3>
          <p className="text-[#6b7280]">Discover your perfect color palette</p>
        </div>

        <div className="bg-[#f5f3ee] p-6 rounded-lg mb-6">
          <h4 className="font-medium text-[#1f2937] mb-3">How it works:</h4>
          <ul className="space-y-2 text-sm text-[#6b7280]">
            <li className="flex items-start gap-2">
              <span className="text-[#c8b28a]">1.</span>
              <span>Take a photo of your face in natural lighting</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#c8b28a]">2.</span>
              <span>AI analyzes your skin tone and undertones</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#c8b28a]">3.</span>
              <span>Get your personalized color season and palette</span>
            </li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
            </svg>
            <div>
              <div className="font-medium text-amber-800 text-sm">Best Results Tip</div>
              <div className="text-amber-700 text-xs mt-1">
                Use natural daylight, no makeup, and face the light source directly for the most accurate analysis.
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-[#e5e7eb] text-[#6b7280] rounded-lg hover:bg-[#f5f3ee] transition-colors"
          >
            Back
          </button>
          <button
            onClick={startCamera}
            className="flex-1 py-3 bg-[#1f2937] text-white rounded-lg hover:bg-[#374151] transition-colors"
          >
            Start Color Analysis
          </button>
        </div>
      </div>
    );
  }

  // Capture step
  if (step === 'capture') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[#f5f3ee]">
        <div className="relative">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Face guide overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-64 border-2 border-dashed border-[#c8b28a]/60 rounded-full" />
            </div>

            {/* Countdown overlay */}
            {countdown !== null && countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-24 h-24 rounded-full bg-[#c8b28a] flex items-center justify-center animate-pulse">
                  <span className="text-5xl font-bold text-white">{countdown}</span>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 px-4 py-3 rounded-lg text-white text-center">
              <p className="text-sm">Position your face in the oval guide</p>
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
                setStep('intro');
              }}
              className="flex-1 py-3 border border-[#e5e7eb] text-[#6b7280] rounded-lg hover:bg-[#f5f3ee] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={startCountdown}
              disabled={!isCameraActive || countdown !== null}
              className="flex-1 py-3 bg-[#1f2937] text-white rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Capture Photo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Analyzing step
  if (step === 'analyzing') {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#f5f3ee]">
        <div className="text-center">
          {capturedImage && (
            <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-[#c8b28a]">
              <img src={capturedImage} alt="Your photo" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="animate-spin w-12 h-12 border-4 border-[#c8b28a] border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="font-serif text-xl text-[#1f2937] mb-2">Analyzing Your Colors...</h3>
          <p className="text-[#6b7280] text-sm">Detecting skin tone, undertones, and contrast</p>
        </div>
      </div>
    );
  }

  // Review step
  if (step === 'review' && colorProfile) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#f5f3ee]">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            {capturedImage && (
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#c8b28a]">
                <img src={capturedImage} alt="Your photo" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="text-left">
              <div className="text-xs text-[#c8b28a] uppercase tracking-wider">Your Color Season</div>
              <div className="text-3xl font-serif text-[#1f2937] capitalize">{colorProfile.color_season}</div>
              <div className="text-sm text-[#6b7280] capitalize">{colorProfile.color_season_subtype}</div>
            </div>
          </div>
        </div>

        {/* Analysis details */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#f5f3ee] p-3 rounded-lg text-center">
            <div className="text-xs text-[#9ca3af] uppercase tracking-wider mb-1">Undertone</div>
            <div className="text-lg text-[#1f2937] capitalize">{colorProfile.skin_undertone}</div>
          </div>
          <div className="bg-[#f5f3ee] p-3 rounded-lg text-center">
            <div className="text-xs text-[#9ca3af] uppercase tracking-wider mb-1">Depth</div>
            <div className="text-lg text-[#1f2937] capitalize">{colorProfile.skin_depth}</div>
          </div>
          <div className="bg-[#f5f3ee] p-3 rounded-lg text-center">
            <div className="text-xs text-[#9ca3af] uppercase tracking-wider mb-1">Contrast</div>
            <div className="text-lg text-[#1f2937] capitalize">{colorProfile.contrast_level}</div>
          </div>
        </div>

        {/* Color palette */}
        <div className="mb-6">
          <div className="text-xs text-[#9ca3af] uppercase tracking-wider mb-3">Your Best Colors</div>
          <div className="grid grid-cols-8 gap-2">
            {colorProfile.best_colors.map((color) => (
              <div key={color.hex} className="text-center">
                <div
                  className="w-full aspect-square rounded-lg border border-[#e5e7eb]"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {colorProfile.best_colors.slice(0, 4).map((color) => (
              <span key={color.hex} className="text-xs text-[#6b7280] capitalize">{color.name}</span>
            ))}
            <span className="text-xs text-[#9ca3af]">+ more</span>
          </div>
        </div>

        {/* Best metals */}
        <div className="bg-[#1f2937] text-white p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#c8b28a] uppercase tracking-wider mb-1">Best Metals</div>
              <div className="flex gap-2">
                {colorProfile.best_metals.map((metal) => (
                  <span key={metal} className="capitalize">{metal}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              {colorProfile.best_metals.includes('gold') ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border border-yellow-400" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 border border-gray-300" />
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              setCapturedImage(null);
              setColorProfile(null);
              startCamera();
            }}
            className="flex-1 py-3 border border-[#e5e7eb] text-[#6b7280] rounded-lg hover:bg-[#f5f3ee] transition-colors"
          >
            Retake Photo
          </button>
          <button
            onClick={() => onAnalysisComplete(colorProfile)}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Confirm Colors
          </button>
        </div>
      </div>
    );
  }

  return null;
}
