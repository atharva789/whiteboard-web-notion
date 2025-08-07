import React, { useRef, useEffect, useState } from 'react';

const Whiteboard = ({ boardId }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState('#000000');
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';

    const handlePointerDown = (e) => {
      // Palm rejection: ignore finger touches
      if (e.pointerType === 'touch') return;

      setIsDrawing(true);
      setLastPos({ x: e.clientX, y: e.clientY });
    };

    const handlePointerMove = (e) => {
      if (!isDrawing) return;
      if (e.pointerType === 'touch') return;

      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
      ctx.lineWidth = isEraser ? 30 : 3;

      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(e.clientX, e.clientY);
      ctx.stroke();

      setLastPos({ x: e.clientX, y: e.clientY });
    };

    const handlePointerUp = () => setIsDrawing(false);

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
  }, [isDrawing, lastPos, color, isEraser]);

  return (
    <>
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0 }} />
      
      {/* Tools UI */}
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
        {/* Color Palette */}
        {['#000000', '#ff0000', '#00cc00', '#0000ff', '#ffff00', '#ff00ff'].map(c => (
          <button
            key={c}
            onClick={() => { setColor(c); setIsEraser(false); }}
            style={{
              backgroundColor: c,
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: color === c ? '2px solid black' : '1px solid #ccc'
            }}
          />
        ))}
        
        {/* Tool Toggle */}
        <button onClick={() => setIsEraser(!isEraser)}>
          {isEraser ? 'Pen' : 'Eraser'}
        </button>
      </div>
    </>
  );
};

export default Whiteboard;
