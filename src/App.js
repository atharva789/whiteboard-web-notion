import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import Whiteboard from './whiteboard';
import { v4 as uuidv4 } from 'uuid';

const WhiteboardWrapper = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!boardId) {
      const newBoardId = uuidv4();
      navigate(`/board/${newBoardId}`, { replace: true });
    }
  }, [boardId, navigate]);

  if (!boardId) return null;
  return <Whiteboard boardId={boardId} />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WhiteboardWrapper />} />
        <Route path="/board/:boardId" element={<WhiteboardWrapper />} />
      </Routes>
    </Router>
  );
}

export default App;
