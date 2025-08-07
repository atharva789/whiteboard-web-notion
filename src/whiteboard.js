import React, { useEffect, useRef, useState } from 'react';

const Whiteboard = ({ boardId }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [ctx, setCtx] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [color, setColor] = useState('#000000');
  const [isEraser, setIsEraser] = useState(false);
  const [pathBuffer, setPathBuffer] = useState([]);
  const [paths, setPaths] = useState([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // 🖼️ Resize + Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    context.lineJoin = 'round';
    context.lineCap = 'round';

    setCtx(context);
    restoreFromLocal();
  }, []);

  // 💾 Save strokes
  useEffect(() => {
    localStorage.setItem(`board-${boardId}`, JSON.stringify(paths));
  }, [paths]);

  const restoreFromLocal = () => {
    const data = localStorage.getItem(`board-${boardId}`);
    if (data) {
      const parsed = JSON.parse(data);
      setPaths(parsed);
      redrawPaths(parsed);
    }
  };

  const redrawPaths = (pathsToDraw) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (let p of pathsToDraw) {
      context.strokeStyle = p.color;
      context.lineWidth = p.isEraser ? 30 : 3;
      context.beginPath();
      for (let i = 1; i < p.points.length; i++) {
        const a = p.points[i - 1];
        const b = p.points[i];
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
      }
      context.stroke();
    }
  };

  const getPointerPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale,
    };
  };

  const handlePointerDown = (e) => {
    if (e.pointerType === 'touch') return;
    const pos = getPointerPos(e);
    setIsDrawing(true);
    setLastPos(pos);
    setPathBuffer([pos]);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || e.pointerType === 'touch') return;
    const newPos = getPointerPos(e);
    const updatedBuffer = [...pathBuffer, newPos].slice(-30);
    setPathBuffer(updatedBuffer);

    detectScribble(updatedBuffer);

    ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
    ctx.lineWidth = isEraser ? 30 : 3;
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(newPos.x, newPos.y);
    ctx.stroke();

    setLastPos(newPos);
  };

  const handlePointerUp = () => {
    if (pathBuffer.length > 1) {
      setPaths(prev => [...prev, { points: pathBuffer, color: isEraser ? '#FFFFFF' : color, isEraser }]);
    }
    setIsDrawing(false);
    setPathBuffer([]);
  };

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
      const cx = canvasRef.current.getContext('2d');
      cx.clearRect(minX - 20, minY - 20, maxX - minX + 40, maxY - minY + 40);
      setPathBuffer([]);
    }
  };

  // 🤏 Pinch-to-zoom handling
  useEffect(() => {
    const el = containerRef.current;
    let lastTouchDist = null;

    const getTouchDist = (e) => {
      const [a, b] = e.touches;
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        const dist = getTouchDist(e);
        if (lastTouchDist != null) {
          const delta = dist - lastTouchDist;
          const newScale = Math.max(0.5, Math.min(3, scale + delta * 0.005));
          setScale(newScale);
        }
        lastTouchDist = dist;
        e.preventDefault();
      }
    };

    const resetTouch = () => lastTouchDist = null;

    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', resetTouch);
    el.addEventListener('touchcancel', resetTouch);

    return () => {
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', resetTouch);
      el.removeEventListener('touchcancel', resetTouch);
    };
  }, [scale]);

  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: offset.y,
          left: offset.x,
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* UI Controls */}
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
        {['#000000', '#FFFFFF', '#ff0000', '#00cc00', '#0000ff', '#ffff00', '#ff00ff'].map(c => (
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
    </div>
  );
};

export default Whiteboard;
