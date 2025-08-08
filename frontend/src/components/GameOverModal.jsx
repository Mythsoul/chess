import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTrophy, FaHandshake, FaFlag, FaClock, FaHome, FaRedo } from 'react-icons/fa'
import { useSpring, animated } from '@react-spring/web'

const GameOverModal = ({ isOpen, result, playerColor, onClose, onNewGame }) => {
  const [{ scale, opacity }, api] = useSpring(() => ({
    scale: 0.8,
    opacity: 0,
    config: { tension: 200, friction: 20 }
  }))

  React.useEffect(() => {
    if (isOpen) {
      api.start({ scale: 1, opacity: 1 })
    } else {
      api.start({ scale: 0.8, opacity: 0 })
    }
  }, [isOpen, api])

  const getResultIcon = () => {
    switch (result?.reason) {
      case 'checkmate':
        return <FaTrophy className="w-16 h-16 text-yellow-400" />
      case 'draw':
      case 'draw_agreement':
      case 'stalemate':
        return <FaHandshake className="w-16 h-16 text-blue-400" />
      case 'resignation':
        return <FaFlag className="w-16 h-16 text-red-400" />
      case 'abandonment':
        return <FaClock className="w-16 h-16 text-orange-400" />
      default:
        return <FaTrophy className="w-16 h-16 text-gray-400" />
    }
  }

  const getResultMessage = () => {
    if (!result) return "Game Over"
    
    // Use the playerResult field from backend
    const playerResult = result.playerResult
    
    switch (result.reason) {
      case 'checkmate':
        return playerResult === 'win' ? "Victory by Checkmate!" : "Defeat by Checkmate"
      case 'draw':
      case 'draw_agreement':
        return "Draw by Agreement"
      case 'stalemate':
        return "Draw by Stalemate"
      case 'resignation':
        return playerResult === 'win' ? "Victory by Resignation" : "Defeat by Resignation"
      case 'abandonment':
        return playerResult === 'win' ? "Victory by Abandonment" : "Loss by Abandonment"
      default:
        return "Game Over"
    }
  }

  const getResultColor = () => {
    if (!result) return "text-gray-400"
    
    if (result.reason === 'draw' || result.reason === 'draw_agreement' || result.reason === 'stalemate') {
      return "text-blue-400"
    }
    
    return result.playerResult === 'win' ? "text-green-400" : "text-red-400"
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <animated.div
              style={{ scale, opacity }}
              className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-600/50 max-w-md w-full"
            >
              {/* Floating particles */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-white/20"
                    initial={{
                      x: Math.random() * 400,
                      y: Math.random() * 400,
                      opacity: 0
                    }}
                    animate={{
                      y: [null, -50],
                      opacity: [0, 0.6, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: Math.random() * 3 + 2,
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10 text-center space-y-6">
                {/* Result Icon */}
                <motion.div
                  className="flex justify-center"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  {getResultIcon()}
                </motion.div>

                {/* Result Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className={`text-3xl font-bold ${getResultColor()}`}>
                    {getResultMessage()}
                  </h2>
                  {result?.reason && (
                    <p className="text-slate-400 mt-2 capitalize">
                      Reason: {result.reason.replace('_', ' ')}
                    </p>
                  )}
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  className="flex gap-3 justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.button
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600/90 hover:bg-blue-500/90 text-white rounded-xl transition-all duration-200 backdrop-blur-sm"
                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onNewGame}
                  >
                    <FaRedo className="w-4 h-4" />
                    New Game
                  </motion.button>
                  
                  <motion.button
                    className="flex items-center gap-2 px-6 py-3 bg-slate-600/90 hover:bg-slate-500/90 text-white rounded-xl transition-all duration-200 backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                  >
                    <FaHome className="w-4 h-4" />
                    Home
                  </motion.button>
                </motion.div>
              </div>
            </animated.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default GameOverModal
