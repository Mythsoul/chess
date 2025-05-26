import { motion } from "framer-motion"
import { FaChessPawn, FaChessRook, FaChessKnight, FaChessBishop, FaChessQueen, FaChessKing } from "react-icons/fa"

const pieceIcons = {
  'p': FaChessPawn, 'P': FaChessPawn,
  'r': FaChessRook, 'R': FaChessRook,
  'n': FaChessKnight, 'N': FaChessKnight,
  'b': FaChessBishop, 'B': FaChessBishop,
  'q': FaChessQueen, 'Q': FaChessQueen,
  'k': FaChessKing, 'K': FaChessKing
}

export default function MoveHistory({ moveHistory = [], currentMoveIndex = -1 }) {
  const formatMove = (move, index) => {
    const moveNumber = Math.floor(index / 2) + 1
    const isWhiteMove = index % 2 === 0
    
    return {
      number: isWhiteMove ? moveNumber : null,
      notation: move.san || move.notation || `${move.from}-${move.to}`,
      piece: move.piece,
      isWhite: isWhiteMove
    }
  }

  const getPieceIcon = (piece) => {
    if (!piece) return null
    const Icon = pieceIcons[piece]
    return Icon ? <Icon className="inline w-4 h-4" /> : null
  }

  return (
    <motion.div
      className="bg-slate-800/95 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/60 shadow-2xl w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 15, 
        delay: 0.4,
        duration: 0.8
      }}
      whileHover={{
        boxShadow: "0 0 40px rgba(0,0,0,0.6)",
        scale: 1.01,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
    >
      <motion.h3 
        className="text-xl font-bold text-white mb-4 flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <motion.span
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          📜
        </motion.span>
        Move History
      </motion.h3>
      
      {moveHistory.length === 0 ? (
        <motion.div 
          className="text-slate-400 text-center py-8 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          No moves yet. Make your first move!
        </motion.div>
      ) : (
        <motion.div 
          className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 pr-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <div className="space-y-1">
            {moveHistory.map((move, index) => {
              const formattedMove = formatMove(move, index)
              const isCurrentMove = index === currentMoveIndex
              const isEvenMove = index % 2 === 0
              
              return (
                <motion.div
                  key={index}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                    isCurrentMove 
                      ? 'bg-emerald-500/20 border border-emerald-500/30' 
                      : 'hover:bg-slate-700/50'
                  } ${isEvenMove ? 'bg-slate-700/20' : ''}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: 0.8 + (index * 0.05), 
                    duration: 0.3,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    backgroundColor: isCurrentMove ? 'rgba(16, 185, 129, 0.15)' : 'rgba(71, 85, 105, 0.3)',
                    transition: { duration: 0.2 }
                  }}
                >
                  {formattedMove.number && (
                    <span className="text-slate-400 text-sm font-mono w-6 text-right">
                      {formattedMove.number}.
                    </span>
                  )}
                  
                  <div className="flex items-center gap-2 flex-1">
                    <span className={`text-sm ${formattedMove.isWhite ? 'text-slate-200' : 'text-slate-400'}`}>
                      {getPieceIcon(formattedMove.piece)}
                    </span>
                    
                    <motion.span 
                      className={`font-mono font-medium ${
                        isCurrentMove 
                          ? 'text-emerald-300' 
                          : formattedMove.isWhite 
                            ? 'text-white' 
                            : 'text-slate-300'
                      }`}
                      whileHover={{ 
                        scale: 1.05,
                        textShadow: isCurrentMove ? "0 0 10px rgba(16, 185, 129, 0.6)" : "0 0 5px rgba(255, 255, 255, 0.3)",
                        transition: { duration: 0.2 }
                      }}
                    >
                      {formattedMove.notation}
                    </motion.span>
                  </div>
                  
                  {isCurrentMove && (
                    <motion.span
                      className="text-emerald-400 text-xs"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                        delay: 0.1
                      }}
                    >
                      ●
                    </motion.span>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
      
      {moveHistory.length > 0 && (
        <motion.div 
          className="mt-4 pt-4 border-t border-slate-600/30 text-center text-slate-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            {moveHistory.length} moves played
          </motion.span>
        </motion.div>
      )}
    </motion.div>
  )
}
