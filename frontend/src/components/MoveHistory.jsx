import { useState, useEffect } from 'react'
import { FaChevronLeft, FaChevronRight, FaFastBackward, FaFastForward } from 'react-icons/fa'

export default function MoveHistory({ 
  moveHistory = [], 
  currentMoveIndex = -1, 
  onMoveSelect,
  isViewingHistory = false 
}) {
  const [selectedMoveIndex, setSelectedMoveIndex] = useState(-1)

  // Update selected move when current move changes
  useEffect(() => {
    if (!isViewingHistory) {
      setSelectedMoveIndex(currentMoveIndex)
    }
  }, [currentMoveIndex, isViewingHistory])

  const handleMoveClick = (index) => {
    setSelectedMoveIndex(index)
    if (onMoveSelect) {
      onMoveSelect(index)
    }
  }

  const goToMove = (index) => {
    const clampedIndex = Math.max(-1, Math.min(moveHistory.length - 1, index))
    handleMoveClick(clampedIndex)
  }

  const goToStart = () => goToMove(-1)
  const goToPrevious = () => goToMove(selectedMoveIndex - 1)
  const goToNext = () => goToMove(selectedMoveIndex + 1)
  const goToEnd = () => goToMove(moveHistory.length - 1)

  const formatMove = (move, index) => {
    const moveNum = Math.floor(index / 2) + 1
    const isWhite = index % 2 === 0
    
    // Add symbols for special moves
    let moveText = move.san || `${move.from}-${move.to}`
    if (move.captured) moveText = moveText.replace('x', '×')
    if (move.promotion) moveText += '=' + move.promotion.toUpperCase()
    
    return { moveText, moveNum, isWhite }
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 w-64 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Moves</h3>
        {moveHistory.length > 0 && (
          <div className="text-xs text-slate-400">
            {selectedMoveIndex + 1}/{moveHistory.length}
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      {moveHistory.length > 0 && (
        <div className="flex items-center justify-center gap-1 mb-3 p-2 bg-slate-700 rounded">
          <button
            onClick={goToStart}
            disabled={selectedMoveIndex <= -1}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Go to start"
          >
            <FaFastBackward size={12} />
          </button>
          <button
            onClick={goToPrevious}
            disabled={selectedMoveIndex <= -1}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous move"
          >
            <FaChevronLeft size={12} />
          </button>
          <button
            onClick={goToNext}
            disabled={selectedMoveIndex >= moveHistory.length - 1}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next move"
          >
            <FaChevronRight size={12} />
          </button>
          <button
            onClick={goToEnd}
            disabled={selectedMoveIndex >= moveHistory.length - 1}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Go to end"
          >
            <FaFastForward size={12} />
          </button>
        </div>
      )}

      {/* Move List */}
      <div className="flex-1 max-h-64 overflow-y-auto space-y-1">
        {moveHistory.length === 0 ? (
          <div className="text-slate-400 text-sm text-center py-4">
            No moves yet
          </div>
        ) : (
          <div className="space-y-1">
            {/* Starting position */}
            <div 
              className={`text-sm p-2 rounded cursor-pointer transition-colors ${
                selectedMoveIndex === -1 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-slate-700 text-slate-300'
              }`}
              onClick={() => handleMoveClick(-1)}
            >
              <span className="text-slate-400">Start</span>
            </div>

            {/* Move pairs */}
            {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, pairIndex) => {
              const whiteIndex = pairIndex * 2
              const blackIndex = pairIndex * 2 + 1
              const whiteMove = moveHistory[whiteIndex]
              const blackMove = moveHistory[blackIndex]

              return (
                <div key={pairIndex} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 w-6 text-right">{pairIndex + 1}.</span>
                  
                  {/* White move */}
                  <div 
                    className={`flex-1 p-1 rounded cursor-pointer transition-colors ${
                      selectedMoveIndex === whiteIndex 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-slate-700 text-white'
                    }`}
                    onClick={() => handleMoveClick(whiteIndex)}
                  >
                    {formatMove(whiteMove, whiteIndex).moveText}
                  </div>
                  
                  {/* Black move */}
                  {blackMove && (
                    <div 
                      className={`flex-1 p-1 rounded cursor-pointer transition-colors ${
                        selectedMoveIndex === blackIndex 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:bg-slate-700 text-slate-300'
                      }`}
                      onClick={() => handleMoveClick(blackIndex)}
                    >
                      {formatMove(blackMove, blackIndex).moveText}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Status indicator */}
      {isViewingHistory && (
        <div className="mt-2 text-xs text-center text-yellow-400 bg-yellow-400/10 p-2 rounded">
          Viewing history - Click "Go to end" to return to current position
        </div>
      )}
    </div>
  )
}
