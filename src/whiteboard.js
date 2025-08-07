import React, { useRef, useEffect, useState } from 'react';

const Whiteboard = ({ boardId }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState('#000000');
  const [isEraser, setIsEraser] = useState(false);
  const [pathBuffer, setPathBuffer] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const handlePointerDown = (e) => {
      // Block finger touches for palm rejection
      if (e.pointerType === 'touch') return;

      e.preventDefault();
      setIsDrawing(true);
      setLastPos({ x: e.clientX, y: e.clientY });
      setPathBuffer([{ x: e.clientX, y: e.clientY }]);
    };

    const handlePointerMove = (e) => {
      if (!isDrawing || e.pointerType === 'touch') return;
      e.preventDefault();

      const newPoint = { x: e.clientX, y: e.clientY };
      const updatedBuffer = [...pathBuffer, newPoint].slice(-30);
      setPathBuffer(updatedBuffer);
      detectScribble(updatedBuffer);

      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
      ctx.lineWidth = isEraser ? 30 : 3;

      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(newPoint.x, newPoint.y);
      ctx.stroke();

      setLastPos(newPoint);
    };

    const handlePointerUp = () => {
      setIsDrawing(false);
      setPathBuffer([]);
    };

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
  }, [isDrawing, lastPos, color, isEraser, pathBuffer]);

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

    const turnCount = path.reduce((count, _, i, arr) => {
      if (i < 2) return count;
      const a = arr[i - 2], b = arr[i - 1], c = arr[i];
      const angle = Math.abs(Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(b.y - a.y, b.x - a.x));
      return count + (angle > 0.7 ? 1 : 0);
    }, 0);

    if (tight && turnCount > 8) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(minX - 20, minY - 20, maxX - minX + 40, maxY - minY + 40);
      setPathBuffer([]);
    }
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0 }} />

      <div style={{
        position: 'fixed',
        top: 10,
        left: 10,
        display: 'flex',
        gap: 10,
        zIndex: 10,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
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
