import React, { useEffect, useRef, useState } from 'react';

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [color, setColor] = useState('#000000');
  const [isEraser, setIsEraser] = useState(false);
  const [pathBuffer, setPathBuffer] = useState([]);

  // Resize canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Setup drawing styles
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handlePointerDown = (e) => {
    if (e.pointerType === 'touch') return; // block palm/finger

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    setIsDrawing(true);
    setLastPos(pos);
    setPathBuffer([pos]);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || e.pointerType === 'touch') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const newPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const updatedPath = [...pathBuffer, newPos].slice(-30);
    setPathBuffer(updatedPath);
    detectScribble(updatedPath);

    ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
    ctx.lineWidth = isEraser ? 30 : 3;

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(newPos.x, newPos.y);
    ctx.stroke();

    setLastPos(newPos);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    setPathBuffer([]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
    };
  });

  const detectScribble = (path) => {
    if (path.length < 10) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of path) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    const area = (maxX - minX) * (maxY - minY);
    const tight = area < 10000;

    const turns = path.reduce((acc, _, i, arr) => {
      if (i < 2) return acc;
      const a = arr[i - 2], b = arr[i - 1], c = arr[i];
      const ang = Math.abs(Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(b.y - a.y, b.x - a.x));
      return acc + (ang > 0.7 ? 1 : 0);
    }, 0);

    if (tight && turns > 8) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(minX - 20, minY - 20, maxX - minX + 40, maxY - minY + 40);
      setPathBuffer([]);
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          touchAction: 'none',
          zIndex: 0
        }}
      />

      <div style={{
        position: 'fixed',
        top: 10,
        left: 10,
        zIndex: 10,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        display: 'flex',
        gap: 10
      }}>
        {['#000000', '#ff0000', '#00cc00', '#0000ff', '#ffff00', '#ff00ff'].map(c => (
          <button
            key={c}
            onClick={() => { setColor(c); setIsEraser(false); }}
            style={{
              backgroundColor: c,
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: color === c && !isEraser ? '2px solid black' : '1px solid #ccc'
            }}
          />
        ))}
        <button onClick={() => setIsEraser(!isEraser)}>
          {isEraser ? 'Pen' : 'Eraser'}
        </button>
      </div>
    </>
  );
};

export default Whiteboard;
