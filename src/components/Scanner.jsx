// src/components/Scanner.jsx
import React, { useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Scanner() {
  const webcamContainerRef = useRef(null);
  const [vin, setVin] = useState("");

  const MODEL_URL = "https://teachablemachine.withgoogle.com/models/YOUR_MODEL_URL/"; // Replace with your model
  const BASEURL = "https://your-backend-url.com"; // Replace with your API base URL

  let model, webcam, maxPredictions;

  // Load Teachable Machine Model
  const loadModel = async () => {
    toast.info("📦 Loading model...");
    try {
      const modelURL = MODEL_URL + "model.json";
      const metadataURL = MODEL_URL + "metadata.json";

      model = await tmImage.load(modelURL, metadataURL);
      maxPredictions = model.getTotalClasses();
      toast.success("✅ Model loaded");
    } catch (err) {
      console.error(err);
      toast.error("❌ Model load failed");
    }
  };

  // Start webcam
  const startWebcam = async () => {
    try {
      webcam = new tmImage.Webcam(400, 300, true);
      await webcam.setup();
      await webcam.play();
      webcamContainerRef.current.innerHTML = ""; // Clear previous if any
      webcamContainerRef.current.appendChild(webcam.canvas);
      toast.success("📷 Webcam started");

      window.requestAnimationFrame(loop);
    } catch (err) {
      console.error("Webcam error:", err);
      toast.error("❌ Webcam failed");
    }
  };

  // Prediction loop
  const loop = async () => {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
  };

  // Predict
  const predict = async () => {
    if (!model || !webcam) return;

    const prediction = await model.predict(webcam.canvas);
    prediction.forEach(async (p) => {
      if (p.probability > 0.95 && p.className !== vin) {
        setVin(p.className);
        toast.info(`🔍 VIN Detected: ${p.className}`);
        await logVIN(p.className);
      }
    });
  };

  // Log VIN
  const logVIN = async (vinNumber) => {
    try {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );

      const location = `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`;
      await axios.put(`${BASEURL}/api/vin/${vinNumber}`, { location });
      toast.success("✅ VIN logged successfully");
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to log VIN");
    }
  };

  useEffect(() => {
    (async () => {
      await loadModel();
      await startWebcam();
    })();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📸 VIN Scanner</h2>
      <div
        ref={webcamContainerRef}
        className="w-[400px] h-[300px] border rounded-md shadow-lg overflow-hidden"
      />
      <p className="mt-4 text-lg">
        Detected VIN: <strong>{vin || "Scanning..."}</strong>
      </p>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}
