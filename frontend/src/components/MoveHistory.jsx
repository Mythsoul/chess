export default function MoveHistory({ moveHistory = [] }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 w-64">
      <h3 className="text-white font-semibold mb-3">Moves</h3>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {moveHistory.length === 0 ? (
          <div className="text-slate-400 text-sm text-center py-4">
            No moves yet
          </div>
        ) : (
          moveHistory.map((move, index) => {
            const moveNum = Math.floor(index / 2) + 1
            const isWhite = index % 2 === 0
            
            return (
              <div key={index} className="text-sm flex items-center gap-2">
                {isWhite && (
                  <span className="text-slate-400 w-6">{moveNum}.</span>
                )}
                <span className={isWhite ? 'text-white' : 'text-slate-300'}>
                  {move.san || `${move.from}-${move.to}`}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
