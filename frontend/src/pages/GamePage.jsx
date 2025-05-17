import { useEffect, useState } from 'react';
import socket from '../utils/socket';
import Chessboard from '../components/Chessboard';

export default function GamePage({ playerColor }) {
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    socket.on('gameUpdate', (update) => {
      setGameState(update);
    });

    socket.on('gameOver', (result) => {
      console.log('Game Over:', result);
    });

    return () => {
      socket.off('gameUpdate');
      socket.off('gameOver');
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-2xl bg-gray-800 rounded-lg p-4 mb-4">
            {/* Game status */}
            <div className="text-center mb-4">
              <p className="text-xl font-bold">
                Playing as {playerColor.toUpperCase()}
              </p>
            </div>
            
            {/* Replace chess board placeholder with actual board */}
            <div className="w-full max-w-2xl mb-4">
              <Chessboard playerColor={playerColor} />
            </div>
          </div>
          
          {/* Game controls */}
          <div className="flex gap-4">
            <button className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
              Resign
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              Offer Draw
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
