import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import axios from "axios";

const VINScanner = () => {
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);
  const [status, setStatus] = useState("Waiting...");
  const [streaming, setStreaming] = useState(false);

  // ✅ Model load
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await tf.loadLayersModel("/model/model.json");
        setModel(loadedModel);
        console.log("✅ Model loaded");
      } catch (err) {
        console.error("❌ Error loading model:", err);
      }
    };
    loadModel();
  }, []);

  // ✅ Start Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreaming(true);
        }
      } catch (err) {
        console.error("❌ Camera error:", err);
      }
    };
    startCamera();
  }, []);

  // ✅ VIN Validation
  const validateVIN = (vin) => /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);

  // ✅ GPS Fetch
  const getLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: null, lng: null });
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: null, lng: null })
      );
    });
  };

  // ✅ Main Detection Loop
  useEffect(() => {
    if (!model || !streaming) return;

    const interval = setInterval(async () => {
      try {
        if (!videoRef.current) return;

        // TODO: Replace with actual VIN OCR + classifier prediction
        
        const random = Math.random();
        if (random < 0.3) {
          setStatus("Stopped: Paper/Other detected ❌");
          return;
        }

        const detectedVIN = "1HGCM82633A123456"; 
        if (!validateVIN(detectedVIN)) {
          setStatus("Invalid VIN ❌");
          return;
        }

        const gps = await getLocation();

        // ✅ Save to backend
        await axios.post("http://localhost:5000/api/vin/scan", {
          vin: detectedVIN,
          lat: gps.lat,
          lng: gps.lng,
        });

        setStatus("✅ Saved to DB: " + detectedVIN);
      } catch (err) {
        console.error("❌ Detection error:", err);
        setStatus("Error in scanning...");
      }
    }, 5000); 

    return () => clearInterval(interval);
  }, [model, streaming]);

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-xl font-bold mb-2">📷 VIN Scanner</h2>

      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="border-4 border-white rounded-lg"
          width="400"
          height="300"
        />
        {/* White rectangle overlay */}
        <div className="absolute top-1/2 left-1/2 w-60 h-16 border-2 border-white -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <p className="mt-4 font-semibold">{status}</p>
    </div>
  );
};

export default VINScanner;
