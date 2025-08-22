// src/components/VINScanner.jsx
import React, { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import Swal from "sweetalert2";
import axios from "axios";
import { extractBestVIN, isValidVINChecksum } from "../utils/vinUtils";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function VINScanner() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [detectedVIN, setDetectedVIN] = useState("");
  const [busy, setBusy] = useState(false);
  const [boxColor, setBoxColor] = useState("border-blue-500");

  // 🔔 Beep + vibration feedback
  const feedback = () => {
    const audio = new Audio("/sounds/beep.mp3");
    audio.play().catch(() => {});
    if (navigator.vibrate) navigator.vibrate([200, 120, 200]);
  };

  // 🎥 Start camera
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error("Camera error:", err);
      Swal.fire("Camera Error", err.message || "Unable to open camera", "error");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode]);

  // 🧠 OCR every ~1.5s
  useEffect(() => {
    const id = setInterval(() => runOCR(), 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedVIN, busy]);

  const runOCR = async () => {
    if (busy) return;
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    setBusy(true);
    try {
      const fullW = video.videoWidth;
      const fullH = video.videoHeight;
      const cropW = Math.floor(fullW * 0.9);
      const cropH = Math.floor(fullH * 0.25);
      const sx = Math.floor((fullW - cropW) / 2);
      const sy = Math.floor((fullH - cropH) / 2);

      const canvas = document.createElement("canvas");
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, cropW, cropH);

      const { data } = await Tesseract.recognize(canvas, "eng", {
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      });

      const best = extractBestVIN(data.text || "");
      if (best && best !== detectedVIN) {
        if (isValidVINChecksum(best)) {
          setDetectedVIN(best);
          setBoxColor("border-green-500");
          feedback();
          await saveVIN(best);
          setTimeout(() => setBoxColor("border-blue-500"), 1500);
        }
      }
    } catch (err) {
      console.error("OCR error:", err);
    } finally {
      setBusy(false);
    }
  };

  // 💾 Save VIN API
  const saveVIN = async (vin) => {
    try {
      const res = await axios.post(`${API_BASE}/api/vin/save`, { vin });
      if (res.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Saved",
          text: `VIN ${vin} saved successfully`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Info", res.data?.message || "Saved", "info");
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err.message;
      if (status === 409) {
        Swal.fire({
          icon: "warning",
          title: "Duplicate",
          text: `VIN ${vin} already exists`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Error", msg || "Failed to save", "error");
      }
    }
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h2 className="text-xl font-bold mb-3">📷 VIN Auto Scanner (OCR)</h2>

      <div className="relative w-full max-w-[720px] aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {/* Overlay band */}
        <div
          className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border-4 ${boxColor} transition-colors`}
          style={{ width: "80%", height: "22%" }}
        >
          <div
            className="absolute left-0 w-full h-[3px] bg-white/80"
            style={{ animation: "scanline 2s linear infinite" }}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setFacingMode((p) => (p === "user" ? "environment" : "user"))}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow"
        >
          🔄 Switch Camera
        </button>
        <button
          onClick={() => setDetectedVIN("")}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg shadow"
        >
          ♻️ Reset
        </button>
      </div>

      <p className="mt-3 font-semibold">
        Detected VIN: <span className="text-green-700">{detectedVIN || "—"}</span>
      </p>

      <style>{`
        @keyframes scanline { 
          0% { top: 8%; } 
          100% { top: 90%; } 
        }
      `}</style>
    </div>
  );
}
