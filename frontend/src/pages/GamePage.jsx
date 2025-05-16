import { useEffect, useState } from 'react';
import socket from '../utils/socket';

export default function GamePage() {
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    socket.on('gameUpdate', (update) => {
      setGameState(update);
    });

    socket.on('gameOver', (result) => {
      // Handle game over
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
              <p className="text-xl">
                {gameState ? `Current Turn: ${gameState.turn}` : 'Waiting...'}
              </p>
            </div>
            
            {/* Chessboard placeholder */}
            <div className="aspect-square w-full bg-gray-700 rounded-lg">
              {/* Add actual chessboard later */}
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
