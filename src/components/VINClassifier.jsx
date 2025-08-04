// https://teachablemachine.withgoogle.com/models/9Bzs0t7VU/  


import React, { useRef, useEffect, useState } from 'react';
import * as tmImage from '@teachablemachine/image';

const modelURL = 'https://teachablemachine.withgoogle.com/models/9Bzs0t7VU//model.json';
const metadataURL = 'https://teachablemachine.withgoogle.com/models/9Bzs0t7VU//metadata.json';

const VINClassifier = () => {
  const videoRef = useRef(null);
  const [label, setLabel] = useState('');
  const [model, setModel] = useState(null);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const loadModel = async () => {
    const loadedModel = await tmImage.load(modelURL, metadataURL);
    setModel(loadedModel);
  };

  const predictLoop = async () => {
    if (!model || !videoRef.current) return;

    const prediction = await model.predict(videoRef.current);
    const best = prediction.reduce((prev, curr) => (curr.probability > prev.probability ? curr : prev));
    setLabel(`${best.className} (${(best.probability * 100).toFixed(2)}%)`);

    requestAnimationFrame(predictLoop);
  };

  useEffect(() => {
    startCamera();
    loadModel();
  }, []);

  useEffect(() => {
    if (model) predictLoop();
  }, [model]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <h2 className="text-xl font-semibold">Metal vs Paper Classifier</h2>
      <div className="w-[300px] h-[200px] rounded overflow-hidden relative border-4 border-blue-500">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>
      <p className="text-lg font-medium text-green-700 bg-gray-100 px-4 py-2 rounded shadow">
        Prediction: {label || 'Scanning...'}
      </p>
    </div>
  );
};

export default VINClassifier;
