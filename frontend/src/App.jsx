import { useState, useEffect } from 'react';
import socket from './utils/socket';
import GamePage from './pages/GamePage';

function App() {
  const [status, setStatus] = useState('');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setStatus('Connection error! Please try again.');
    });

    socket.on('waiting', (data) => {
      setStatus(data.message);
    });

    socket.on('game_start', (data) => {
      setStatus('Game starting!');
      setPlayerColor(data.color);
      setIsGameStarted(true);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('waiting');
      socket.off('game_start');
    };
  }, []);

  const handleJoinGame = () => {
    setStatus('Finding opponent...');
    socket.emit('init_game');
  };

  if (isGameStarted) {
    return <GamePage playerColor={playerColor} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-white mb-4">Chess Game</h1>
        <p className="text-gray-400 text-xl mb-8">Play chess online with other players</p>
        <button 
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-xl transition-colors"
          onClick={handleJoinGame}
        >
          Play Now
        </button>
        {status && (
          <p className="mt-4 text-yellow-400 italic">{status}</p>
        )}
      </div>
    </div>
  );
}

export default App;
