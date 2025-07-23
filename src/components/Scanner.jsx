// src/components/Scanner.jsx
import React, { useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Scanner() {
  const webcamRef = useRef(null);
  const [vin, setVin] = useState("");

  const MODEL_URL = "https://teachablemachine.withgoogle.com/models/YOUR_MODEL_URL/";

  let model, webcam, maxPredictions;

  // Load the Teachable Machine model
  const loadModel = async () => {
    toast.info("📦 Loading model...");
    try {
      const modelURL = MODEL_URL + "model.json";
      const metadataURL = MODEL_URL + "metadata.json";

      model = await tmImage.load(modelURL, metadataURL);
      maxPredictions = model.getTotalClasses();

      toast.success("✅ Model loaded successfully");
    } catch (error) {
      console.error("Model loading failed", error);
      toast.error("❌ Failed to load model");
    }
  };

  // Start webcam and prediction loop
  const startWebcam = async () => {
    try {
      webcam = new tmImage.Webcam(400, 300, true); // width, height, flip
      await webcam.setup(); // request access to webcam
      await webcam.play();
      webcamRef.current.appendChild(webcam.canvas);
      toast.success("📷 Webcam started");

      window.requestAnimationFrame(loop);
    } catch (err) {
      toast.error("❌ Webcam access denied");
    }
  };

  // Prediction loop
  const loop = async () => {
    webcam.update(); // update webcam frame
    await predict();
    window.requestAnimationFrame(loop);
  };

  // Predict VIN using the model
  const predict = async () => {
    if (!model || !webcam) return;
    const prediction = await model.predict(webcam.canvas);

    prediction.forEach(async (p) => {
      if (p.probability > 0.95) {
        if (p.className !== vin) {
          setVin(p.className);
          toast.info(`🔍 VIN Detected: ${p.className}`);
          await logVIN(p.className);
        }
      }
    });
  };

  // Log VIN with location
  const logVIN = async (vinNumber) => {
    toast.info("📡 Getting location...");
    try {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );

      const location = `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`;
      await axios.put(`http://localhost:5000/api/vin/${vinNumber}`, {
        location,
      });

      toast.success("✅ VIN logged successfully");
    } catch (err) {
      console.error("Logging error:", err);
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
      <div ref={webcamRef} className="border rounded-md shadow-md" />
      <p className="mt-4">
        Detected VIN: <strong>{vin || "Scanning..."}</strong>
      </p>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}
