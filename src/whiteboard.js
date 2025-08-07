import React, { useRef, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  push
} from 'firebase/database';

// --- Firebase Config ---

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};


// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const strokesRef = ref(db, 'boards/board123/strokes');

export default function Whiteboard() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.touchAction = 'none';

    const unsubscribe = onValue(strokesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const strokes = Object.values(data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let stroke of strokes) {
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
      }
    });

    return () => unsubscribe();
  }, []);

  const draw = (x, y, pressure) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = pressure * 4 || 2;
    ctx.strokeStyle = '#000';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerDown = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const pressure = e.pressure || 0.5;
    setIsDrawing(true);
    setCurrentStroke([{ x, y, pressure }]);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    const x = e.clientX;
    const y = e.clientY;
    const pressure = e.pressure || 0.5;
    draw(x, y, pressure);
    setCurrentStroke((prev) => [...prev, { x, y, pressure }]);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      push(strokesRef, currentStroke);
    }
    setCurrentStroke([]);
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ width: '100vw', height: '100vh', background: '#fff' }}
    />
  );
}
