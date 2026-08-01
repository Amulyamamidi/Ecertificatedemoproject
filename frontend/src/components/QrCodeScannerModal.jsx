import React, { useState, useEffect, useRef } from "react";
import { QrCode, Camera, Upload, X, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import jsQR from "jsqr";

export default function QrCodeScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [activeMode, setActiveMode] = useState("camera"); // "camera" or "upload"
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen && activeMode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode]);

  const startCamera = async () => {
    setError(null);
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Camera permission denied or camera unavailable. Try uploading a QR image file.");
      setScanning(false);
    }
  };

  const stopCamera = () => {
    setScanning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const processQrText = (text) => {
    if (!text) return null;
    let certId = text.trim();

    // Check if QR code contains a URL like http://localhost:3000/verify-by-id?id=0x...
    if (certId.includes("?")) {
      const urlParams = new URLSearchParams(certId.split("?")[1]);
      const extracted = urlParams.get("id") || urlParams.get("certId") || urlParams.get("hash");
      if (extracted) certId = extracted;
    } else if (certId.includes("/verify/")) {
      certId = certId.split("/verify/")[1];
    } else if (certId.includes("/timeline/")) {
      certId = certId.split("/timeline/")[1];
    }

    return certId;
  };

  const scanFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert"
    });

    if (code && code.data) {
      const extractedId = processQrText(code.data);
      if (extractedId) {
        stopCamera();
        onScanSuccess(extractedId);
        onClose();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleImageUpload = (e) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          const extractedId = processQrText(code.data);
          if (extractedId) {
            onScanSuccess(extractedId);
            onClose();
          } else {
            setError("QR Code scanned but no valid Certificate ID found.");
          }
        } else {
          setError("No QR code detected in this image. Please upload a clear QR code photo.");
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-900 text-white rounded-2xl shadow-md">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-blue-950">Certificate QR Code Scanner</h2>
              <p className="text-xs text-slate-500">Scan physical or PDF certificate QR code</p>
            </div>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveMode("camera")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeMode === "camera" ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="h-4 w-4" /> Live Camera
          </button>
          <button
            onClick={() => setActiveMode("upload")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeMode === "upload" ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload className="h-4 w-4" /> Upload QR Image
          </button>
        </div>

        {/* Mode Content */}
        {activeMode === "camera" ? (
          <div className="space-y-4">
            <div className="relative aspect-square max-w-xs mx-auto overflow-hidden rounded-2xl bg-black border-4 border-blue-900/30 shadow-inner flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning Overlay Box */}
              <div className="absolute inset-8 border-2 border-dashed border-emerald-400 rounded-xl pointer-events-none animate-pulse flex items-center justify-center">
                <span className="text-[10px] font-mono text-emerald-300 bg-slate-900/80 px-2 py-1 rounded-md uppercase font-bold">
                  Align QR Code
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-center text-xs text-slate-500">
              Hold the certificate's QR code in front of your camera to verify instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-center py-4">
            <label className="border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-8 cursor-pointer flex flex-col items-center justify-center gap-3 transition">
              <Upload className="h-10 w-10 text-blue-600" />
              <div>
                <p className="text-sm font-bold text-slate-800">Click to upload QR code image</p>
                <p className="text-xs text-slate-500 mt-1">Supports PNG, JPG, WEBP, or certificate screenshots</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
