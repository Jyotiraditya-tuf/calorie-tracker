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
  Image as ImageIcon
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

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

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
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        stopCamera();
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err) {
      console.warn("Unable to access camera:", err);
      setCameraError(
        err.name === 'NotAllowedError' 
          ? "Camera permission denied. You can still upload a photo or type food items below."
          : "Camera not available on this device. Please upload a meal photo or type items below."
      );
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
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

  // Capture current frame from video to canvas
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

  // Handle uploaded file from disk
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
                Snap photo or describe your plate
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
            /* Live Camera Feed */
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

              {/* Camera flip button */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-all"
                title="Switch Camera"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>

              {/* Shutter Button */}
              <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-6">
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
            /* Camera Unavailable or Off - Fallback Upload View */
            <div className="p-6 text-center flex flex-col items-center justify-center text-slate-300">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-emerald-400 mb-3 border border-slate-700">
                <ImageIcon className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-200 mb-1">
                {cameraError ? "Camera Access Offline" : "Live Camera Standby"}
              </p>
              <p className="text-xs text-slate-400 max-w-xs mb-4">
                {cameraError || "Upload a photo from your gallery or use manual text context below."}
              </p>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  <Upload className="w-4 h-4" /> Upload Meal Photo
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Try Camera
                </button>
              </div>
            </div>
          )}

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
                  {capturedBlob ? "(Optional notes)" : "(Type your meal)"}
                </span>
              </label>
              {!capturedBlob && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Upload className="w-3 h-3" /> Upload Photo
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                rows={2}
                placeholder="e.g. 200g grilled paneer with brown basmati rice and 1 tsp olive oil..."
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
