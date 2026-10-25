import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  RefreshCw, 
  Sparkles, 
  AlertCircle, 
  Check, 
  FlipHorizontal,
  Image as ImageIcon,
  Smartphone
} from 'lucide-react';

export default function CameraModal({ isOpen, onClose, onAnalyze, initialCategory = 'Lunch' }) {
  const [streamActive, setStreamActive] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState(null);
  const [userContext, setUserContext] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // back camera default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingStream, setIsStartingStream] = useState(false);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const nativeCameraInputRef = useRef(null);

  // Initialize camera when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(initialCategory);
      startCamera();
    } else {
      stopCamera();
      resetState();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    setIsStartingStream(true);
    
    // Check if mediaDevices API is available
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError("WebRTC camera stream not supported by this browser. Use the native camera button below.");
      setIsStartingStream(false);
      setStreamActive(false);
      return;
    }

    try {
      if (videoRef.current && videoRef.current.srcObject) {
        stopCamera();
      }

      let stream = null;

      // Attempt 1: Flexible ideal facingMode without restrictive resolution locks
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode }
          },
          audio: false
        });
      } catch (err1) {
        console.warn("Attempt 1 (ideal facingMode) failed, trying fallback constraints...", err1);
        // Attempt 2: Exact string facingMode or general video
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false
          });
        } catch (err2) {
          console.warn("Attempt 2 (string facingMode) failed, trying generic video...", err2);
          // Attempt 3: Any video device
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.setAttribute('playsinline', 'true');
        
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            setStreamActive(true);
            setCameraError(null);
          } catch (playErr) {
            console.warn("Auto-play error on mobile:", playErr);
            // Some mobile browsers need explicit user touch to play video
            setStreamActive(true);
          }
        };
      }
    } catch (err) {
      console.warn("Unable to access camera stream:", err);
      let message = "Camera permission denied or camera unavailable.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = "Camera access was denied. Tap 'Take Photo' below to use your phone's native camera.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = "No camera hardware detected. You can upload an image or describe your meal.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = "Camera is currently in use by another app. Tap 'Take Photo' for native camera.";
      }
      setCameraError(message);
      setStreamActive(false);
    } finally {
      setIsStartingStream(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      } catch (e) {
        console.warn("Error stopping stream tracks:", e);
      }
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  const resetState = () => {
    setCapturedBlob(null);
    setCapturedDataUrl(null);
    setUserContext('');
    setCameraError(null);
    setIsSubmitting(false);
  };

  // Capture current frame from WebRTC video to canvas
  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        setCapturedDataUrl(canvas.toDataURL('image/jpeg', 0.9));
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  // Handle uploaded or captured image from input (native camera or file)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedBlob(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedDataUrl(event.target.result);
      };
      reader.readAsDataURL(file);
      stopCamera();
    }
    // Reset file input value so same photo can be re-selected if retried
    e.target.value = '';
  };

  // Switch between front/rear camera
  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedBlob(null);
    setCapturedDataUrl(null);
    startCamera();
  };

  // Trigger analysis
  const handleSubmit = async () => {
    if (!capturedBlob && !userContext.trim()) return;
    setIsSubmitting(true);
    try {
      await onAnalyze({
        imageBlob: capturedBlob,
        textPrompt: userContext,
        category: selectedCategory,
        previewUrl: capturedDataUrl
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const canSubmit = Boolean(capturedBlob || userContext.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Log Meal with AI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live camera, phone snapshot, or describe your plate
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-slate-950 aspect-video sm:aspect-[4/3] w-full flex items-center justify-center overflow-hidden">
          
          {capturedDataUrl ? (
            /* Captured / Uploaded Image Preview */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img 
                src={capturedDataUrl} 
                alt="Captured meal" 
                className="w-full h-full object-contain"
              />
              <button
                onClick={handleRetake}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 text-white text-xs font-semibold backdrop-blur-md hover:bg-slate-800 transition-all shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retake
              </button>
            </div>
          ) : streamActive ? (
            /* Live WebRTC Camera Feed */
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Camera Overlays */}
              <div className="absolute inset-0 pointer-events-none border-2 border-white/20 m-6 rounded-2xl flex flex-col justify-between p-3">
                <div className="text-[11px] font-medium text-white/80 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm self-center">
                  Align plate inside frame
                </div>
              </div>

              {/* Camera flip & phone native buttons */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition-all"
                  title="Open Phone Camera App"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition-all"
                  title="Switch Camera (Front/Back)"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Shutter Button & Fallbacks */}
              <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-4">
                <button
                  type="button"
                  onClick={handleSnap}
                  className="w-16 h-16 rounded-full border-4 border-white bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-black/40 flex items-center justify-center text-white"
                  title="Snap photo"
                >
                  <Camera className="w-7 h-7" />
                </button>
              </div>
            </div>
          ) : (
            /* Camera Unavailable or Off - Mobile Friendly Choice View */
            <div className="p-6 text-center flex flex-col items-center justify-center text-slate-300 w-full max-w-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-emerald-400 mb-3 border border-slate-700">
                <Camera className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-200 mb-1">
                {cameraError ? "Camera Permissions / Standby" : "Capture Food Photo"}
              </p>
              <p className="text-xs text-slate-400 max-w-xs mb-4">
                {cameraError || "Take a live photo using your phone camera or select from your gallery."}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
                {/* Dedicated Native Camera Button (uses capture="environment" on phones) */}
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  <Camera className="w-4 h-4" /> Take Photo (Camera)
                </button>

                {/* Gallery File Selector Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 active:scale-95"
                >
                  <Upload className="w-4 h-4" /> Photo Gallery
                </button>
              </div>

              {cameraError && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Live Web Stream
                </button>
              )}
            </div>
          )}

          {/* Native Phone Camera Input (Direct mobile camera trigger) */}
          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Standard Gallery File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Form Inputs & Controls */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          
          {/* Meal Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Meal Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Context / Text-Only Logging Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                Food Context / Manual Entry
                <span className="text-[10px] font-normal text-slate-400">
                  {capturedBlob ? "(Optional notes)" : "(Type dishes e.g. Moong Dal, Dosa)"}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Camera className="w-3 h-3" /> Camera
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Upload className="w-3 h-3" /> Gallery
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                rows={2}
                placeholder="e.g. 1 bowl yellow moong dal tadka with 2 rotis and curd..."
                className="w-full text-xs sm:text-sm rounded-xl p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`flex-[2] py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 text-white shadow-lg transition-all ${
                !canSubmit || isSubmitting
                  ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] shadow-emerald-500/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Decomposing Plate with Gemini...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze with Gemini AI
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
