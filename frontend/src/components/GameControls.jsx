import { motion } from 'framer-motion'
import { FaFlag, FaHandshake, FaRotate, FaHome, FaHistory } from 'react-icons/fa'

export default function GameControls({ 
  onResign, 
  onOfferDraw, 
  onFlipBoard, 
  onBackToHome, 
  moveHistory = [],
  currentPlayer = 'white',
  gameStatus = 'playing'
}) {
  const controlButtons = [
    {
      id: 'resign',
      label: 'Resign',
      icon: FaFlag,
      onClick: onResign,
      bgColor: 'from-red-600 to-red-500',
      hoverColor: 'from-red-500 to-red-400',
      disabled: gameStatus !== 'playing'
    },
    {
      id: 'draw',
      label: 'Offer Draw',
      icon: FaHandshake,
      onClick: onOfferDraw,
      bgColor: 'from-amber-600 to-amber-500',
      hoverColor: 'from-amber-500 to-amber-400',
      disabled: gameStatus !== 'playing'
    },
    {
      id: 'flip',
      label: 'Flip Board',
      icon: FaRotate,
      onClick: onFlipBoard,
      bgColor: 'from-blue-600 to-blue-500',
      hoverColor: 'from-blue-500 to-blue-400',
      disabled: false
    },
    {
      id: 'home',
      label: 'Exit Game',
      icon: FaHome,
      onClick: onBackToHome,
      bgColor: 'from-slate-600 to-slate-500',
      hoverColor: 'from-slate-500 to-slate-400',
      disabled: false
    }
  ]

  return (
    <motion.div 
      className="bg-slate-800/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-600/60 w-full max-w-4xl"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 15, 
        delay: 1.0,
        duration: 0.8
      }}
      whileHover={{
        boxShadow: "0 0 60px rgba(0,0,0,0.7)",
        scale: 1.01,
        transition: { duration: 0.4, ease: "easeOut" }
      }}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Game Controls */}
        <div className="flex-1">
          <motion.h3 
            className="text-slate-300 text-lg font-semibold mb-4 flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <FaHistory className="text-emerald-400" />
            Game Controls
          </motion.h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {controlButtons.map((button, index) => (
              <motion.button
                key={button.id}
                onClick={button.onClick}
                disabled={button.disabled}
                aria-label={button.label}
                aria-disabled={button.disabled}
                tabIndex={button.disabled ? -1 : 0}
                className={`
                  relative overflow-hidden rounded-xl px-4 py-3 text-white font-medium text-sm
                  bg-gradient-to-r ${button.bgColor} 
                  hover:bg-gradient-to-r hover:${button.hoverColor}
                  focus:bg-gradient-to-r focus:${button.hoverColor}
                  focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-300 flex items-center justify-center gap-2
                  border border-white/10
                `}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: 1.3 + index * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
                whileHover={{ 
                  scale: button.disabled ? 1 : 1.05, 
                  y: button.disabled ? 0 : -2,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ 
                  scale: button.disabled ? 1 : 0.98,
                  transition: { duration: 0.1 }
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.8 }}
                />
                <button.icon className="text-lg relative z-10" />
                <span className="relative z-10">{button.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Move History */}
        <div className="flex-1">
          <motion.h3 
            className="text-slate-300 text-lg font-semibold mb-4 flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <FaHistory className="text-blue-400" />
            Move History
          </motion.h3>
          
          <motion.div 
            className="bg-slate-900/50 rounded-xl p-4 max-h-32 overflow-y-auto border border-slate-700/50"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            {moveHistory.length > 0 ? (
              <div className="space-y-1">
                {moveHistory.slice(-6).map((move, index) => (
                  <motion.div
                    key={index}
                    className="flex justify-between text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 + index * 0.05, duration: 0.4 }}
                  >
                    <span className="text-slate-400">
                      {Math.floor(index / 2) + Math.floor((moveHistory.length - 6) / 2) + 1}.
                      {index % 2 === 0 ? '' : '..'}
                    </span>
                    <motion.span 
                      className="text-emerald-400 font-mono"
                      whileHover={{ 
                        scale: 1.1, 
                        color: "#10b981",
                        transition: { duration: 0.2 } 
                      }}
                    >
                      {move.from}{move.to}
                    </motion.span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.p 
                className="text-slate-500 text-sm text-center italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.6 }}
              >
                No moves yet...
              </motion.p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Game Status Indicator */}
      <motion.div 
        className="mt-6 pt-4 border-t border-slate-700/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className={`w-3 h-3 rounded-full ${
                gameStatus === 'playing' 
                  ? 'bg-emerald-400' 
                  : gameStatus === 'finished' 
                    ? 'bg-red-400' 
                    : 'bg-amber-400'
              }`}
              animate={{ 
                scale: gameStatus === 'playing' ? [1, 1.3, 1] : 1,
                opacity: gameStatus === 'playing' ? [1, 0.7, 1] : 1
              }}
              transition={{ 
                duration: 2, 
                repeat: gameStatus === 'playing' ? Number.POSITIVE_INFINITY : 0 
              }}
            />
            <span className="text-slate-300 text-sm font-medium">
              Status: <span className="text-emerald-400 capitalize">{gameStatus}</span>
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-slate-300 text-sm font-medium">
              Current Turn: 
            </span>
            <motion.div 
              className="flex items-center gap-2"
              animate={{ 
                opacity: [0.7, 1, 0.7],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Number.POSITIVE_INFINITY, 
                ease: "easeInOut" 
              }}
            >
              <div className={`w-4 h-4 rounded-full ${
                currentPlayer === 'white' ? 'bg-slate-200' : 'bg-slate-800 border border-slate-600'
              }`} />
              <span className="text-emerald-400 font-medium capitalize">{currentPlayer}</span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
