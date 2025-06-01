import { FaFlag, FaHandshake, FaRedo, FaHome } from 'react-icons/fa'

export default function GameControls({ 
  onResign, 
  onOfferDraw, 
  onFlipBoard, 
  onBackToHome, 
  gameStatus = 'playing'
}) {
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onFlipBoard}
        className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
        title="Flip Board"
      >
        <FaRedo className="w-4 h-4" />
      </button>
      
      <button
        onClick={onOfferDraw}
        disabled={gameStatus !== 'playing'}
        className="p-2 bg-amber-600 hover:bg-amber-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Offer Draw"
      >
        <FaHandshake className="w-4 h-4" />
      </button>
      
      <button
        onClick={onResign}
        disabled={gameStatus !== 'playing'}
        className="p-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Resign"
      >
        <FaFlag className="w-4 h-4" />
      </button>
      
      <button
        onClick={onBackToHome}
        className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
        title="Exit Game"
      >
        <FaHome className="w-4 h-4" />
      </button>
    </div>
  )
}
