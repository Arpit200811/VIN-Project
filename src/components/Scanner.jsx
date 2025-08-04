import React, { useRef, useEffect, useState } from "react";
import * as tmImage from "@teachablemachine/image";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Overlay.css";

const Scanner = () => {
  const videoRef = useRef(null);
  const [vin, setVin] = useState("");
  const [model, setModel] = useState(null);
  const [webcamStream, setWebcamStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [imageCapture, setImageCapture] = useState(null);
  const [isBarcodeFallbackEnabled, setIsBarcodeFallbackEnabled] = useState(true);

  const MODEL_URL = "https://teachablemachine.withgoogle.com/models/YOUR_MODEL_URL/";
  const BASE_URL = "https://vin-project-backend.onrender.com";

  // GPS helper
  const getGPS = () => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          console.warn("Geolocation error:", err);
          resolve({ latitude: null, longitude: null });
        }
      );
    });
  };

  // Send VIN + metadata to backend
  const sendScanToBackend = async (vinNumber, result = "detected") => {
    try {
      const coords = await getGPS();
      const ipRes = await axios.get("https://api.ipify.org?format=json");

      await axios.post(`${BASE_URL}/api/vin/scan`, {
        vin: vinNumber,
        result,
        lat: coords.latitude,
        lng: coords.longitude,
        ip: ipRes.data.ip,
      });

      toast.success("✅ VIN logged successfully");
    } catch (err) {
      console.error("Scan failed:", err);
      toast.error("❌ Failed to log VIN");
    }
  };

  // Load model
  const loadModel = async () => {
    toast.info("📦 Loading model...");
    try {
      const modelURL = `${MODEL_URL}model.json`;
      const metadataURL = `${MODEL_URL}metadata.json`;
      const loadedModel = await tmImage.load(modelURL, metadataURL);
      setModel(loadedModel);
      toast.success("✅ Model loaded");
    } catch (err) {
      console.error("Model load error:", err);
      toast.error("❌ Failed to load model");
    }
  };

  // Camera setup
  const setupCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setWebcamStream(stream);
      const track = stream.getVideoTracks()[0];
      const capture = new ImageCapture(track);
      setImageCapture(capture);
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("❌ Camera access failed");
    }
  };

  // Main detection loop
  const loop = async () => {
    if (!videoRef.current) return;

    // Teachable Machine
    if (model) {
      const prediction = await model.predict(videoRef.current);
      const match = prediction.find((p) => p.probability > 0.95);

      if (match && match.className !== vin) {
        setVin(match.className);
        toast.info(`🔍 VIN Detected: ${match.className}`);
        await sendScanToBackend(match.className, "metal"); // Example type
      }
    }

    // Barcode Fallback
    if (isBarcodeFallbackEnabled && "BarcodeDetector" in window) {
      const barcodeDetector = new BarcodeDetector({ formats: ["code_128", "code_39", "ean_13"] });
      try {
        const barcodes = await barcodeDetector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          if (code !== vin) {
            setVin(code);
            toast.info(`📦 Barcode Detected: ${code}`);
            await sendScanToBackend(code, "paper");
          }
        }
      } catch (err) {
        console.warn("Barcode detection error:", err);
      }
    }

    requestAnimationFrame(loop);
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const toggleTorch = async () => {
    if (!imageCapture) return toast.error("⚠️ Torch not supported");

    const track = webcamStream?.getVideoTracks()[0];
    const capabilities = track?.getCapabilities?.();

    if (capabilities?.torch) {
      try {
        await track.applyConstraints({ advanced: [{ torch: !isTorchOn }] });
        setIsTorchOn(!isTorchOn);
      } catch (err) {
        console.error("Torch error:", err);
        toast.error("❌ Torch control failed");
      }
    } else {
      toast.warning("⚠️ Torch not supported on this device");
    }
  };

  // Load model on mount
  useEffect(() => {
    loadModel();
  }, []);

  // Camera setup when facingMode changes
  useEffect(() => {
    setupCamera();
    return () => {
      if (webcamStream) webcamStream.getTracks().forEach((track) => track.stop());
    };
  }, [facingMode]);

  // Start loop when model is ready
  useEffect(() => {
    if (model && videoRef.current) {
      requestAnimationFrame(loop);
    }
  }, [model]);

  return (
    <div className="relative w-full flex flex-col items-center">
      <h2 className="text-xl font-bold mb-2">📸 VIN Scanner</h2>

      <div className="relative w-[300px] h-[200px] border-4 border-blue-500 rounded-md overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute top-0 left-0 w-full h-full border-4 border-dashed border-white pointer-events-none rounded-md" />
      </div>

      <p className="mt-4 text-lg">
        Detected VIN: <strong>{vin || "Scanning..."}</strong>
      </p>

      <div className="flex gap-3 mt-4">
        <button
          onClick={toggleCamera}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Switch to {facingMode === "environment" ? "Front" : "Back"} Camera
        </button>

        <button
          onClick={toggleTorch}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
        >
          {isTorchOn ? "Turn Off" : "Turn On"} Torch
        </button>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default Scanner;
