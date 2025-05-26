import { useEffect, useState } from "react"
import socket from "../utils/socket"
import Chessboard from "../components/Chessboard"
import GameControls from "../components/GameControls"
import MoveHistory from "../components/MoveHistory"
import { motion, AnimatePresence } from "framer-motion"
import { FaChessKing } from "react-icons/fa"

export default function GamePage({ playerColor }) {
  const [gameState, setGameState] = useState(null)
  const [timeLeft, setTimeLeft] = useState({ white: 600, black: 600 }) // 10 minutes each
  const [boardFlipped, setBoardFlipped] = useState(false)
  const [moveHistory, setMoveHistory] = useState([])
  const [gameStatus, setGameStatus] = useState('playing')

  useEffect(() => {
    socket.on("gameUpdate", (update) => {
      setGameState(update)
    })

    socket.on("gameOver", (result) => {
      console.log("Game Over:", result)
    })

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (gameState?.turn === "w" && prev.white > 0) {
          return { ...prev, white: prev.white - 1 }
        } else if (gameState?.turn === "b" && prev.black > 0) {
          return { ...prev, black: prev.black - 1 }
        }
        return prev
      })
    }, 1000)

    return () => {
      socket.off("gameUpdate")
      socket.off("gameOver")
      clearInterval(timer)
    }
  }, [gameState])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getTimeClass = (seconds) => {
    if (seconds < 30) return "text-red-400"
    if (seconds < 60) return "text-amber-400"
    return "text-white"
  }

  // Game control handlers
  const handleResign = () => {
    if (window.confirm('Are you sure you want to resign?')) {
      socket.emit('resign')
      setGameStatus('finished')
    }
  }

  const handleOfferDraw = () => {
    if (window.confirm('Are you sure you want to offer a draw?')) {
      socket.emit('offer_draw')
    }
  }

  const handleFlipBoard = () => {
    setBoardFlipped(!boardFlipped)
  }

  const handleBackToHome = () => {
    if (gameStatus === 'playing') {
      if (window.confirm('Are you sure you want to leave the game?')) {
        socket.emit('leave_game')
        window.location.href = '/'
      }
    } else {
      window.location.href = '/'
    }
  }

  // Get effective player color based on board flip
  const getEffectivePlayerColor = () => {
    return boardFlipped ? (playerColor === 'white' ? 'black' : 'white') : playerColor
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Ultra-smooth background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-emerald-500/8"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: Math.random() * 0.4 + 0.1,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              y: [null, Math.random() * -300 - 100],
              x: [null, Math.random() * 200 - 100],
              opacity: [null, 0],
              scale: [null, Math.random() * 1.5 + 0.5],
              rotate: [0, Math.random() * 360]
            }}
            transition={{
              duration: Math.random() * 20 + 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Enhanced floating chess pieces */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {["♔", "♕", "♖", "♗", "♘", "♙"].map((piece, i) => (
          <motion.div
            key={i}
            className="absolute text-8xl text-slate-600/4"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              rotate: Math.random() * 360,
              opacity: Math.random() * 0.08 + 0.02,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              y: [null, Math.random() * 400 - 200],
              x: [null, Math.random() * 400 - 200],
              rotate: [null, Math.random() * 720 + 360],
              opacity: [null, Math.random() * 0.08 + 0.02],
              scale: [null, Math.random() * 0.8 + 0.4],
            }}
            transition={{
              duration: Math.random() * 40 + 40,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            {piece}
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col items-center space-y-10">
          {/* Ultra-smooth Header */}
          <motion.div
            className="text-center space-y-8"
            initial={{ y: -60, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              delay: 0.1,
              duration: 1.2
            }}
          >
            <motion.h1 
              className="text-7xl font-bold bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-8"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                textShadow: [
                  "0 0 0px rgba(255,255,255,0)", 
                  "0 0 20px rgba(255,255,255,0.3)", 
                  "0 0 0px rgba(255,255,255,0)"
                ]
              }}
              transition={{ 
                backgroundPosition: { duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                textShadow: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
              }}
            >
              Chess Master
            </motion.h1>
            
            <div className="flex items-center justify-center space-x-16">
              {/* Enhanced Player timers */}
              <motion.div
                className="bg-slate-800/95 backdrop-blur-xl rounded-2xl px-8 py-5 border border-slate-600/60 shadow-2xl"
                initial={{ x: -80, opacity: 0, rotateY: 45 }}
                animate={{ x: 0, opacity: 1, rotateY: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 20,
                  delay: 0.3,
                  duration: 1
                }}
                whileHover={{ 
                  scale: 1.08,
                  boxShadow: "0 0 50px rgba(0,0,0,0.6)",
                  transition: { duration: 0.4, ease: "easeOut" }
                }}
              >
                <motion.div 
                  className="text-slate-300 text-sm font-medium mb-1"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                >
                  Black
                </motion.div>
                <motion.div 
                  className={`font-mono text-3xl font-bold ${getTimeClass(timeLeft.black)}`}
                  animate={timeLeft.black < 30 ? { 
                    scale: [1, 1.15, 1],
                    textShadow: ["0 0 0px rgba(239, 68, 68, 0)", "0 0 15px rgba(239, 68, 68, 0.8)", "0 0 0px rgba(239, 68, 68, 0)"]
                  } : {}}
                  transition={{ 
                    duration: 1.2, 
                    repeat: timeLeft.black < 30 ? Number.POSITIVE_INFINITY : 0,
                    ease: "easeInOut"
                  }}
                >
                  {formatTime(timeLeft.black)}
                </motion.div>
              </motion.div>

              <motion.div 
                className="text-slate-400 text-4xl font-bold"
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 1, 0.5],
                  rotateZ: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut"
                }}
              >
                VS
              </motion.div>

              <motion.div
                className="bg-slate-800/95 backdrop-blur-xl rounded-2xl px-8 py-5 border border-slate-600/60 shadow-2xl"
                initial={{ x: 80, opacity: 0, rotateY: -45 }}
                animate={{ x: 0, opacity: 1, rotateY: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 20,
                  delay: 0.3,
                  duration: 1
                }}
                whileHover={{ 
                  scale: 1.08,
                  boxShadow: "0 0 50px rgba(0,0,0,0.6)",
                  transition: { duration: 0.4, ease: "easeOut" }
                }}
              >
                <motion.div 
                  className="text-slate-300 text-sm font-medium mb-1"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                >
                  White
                </motion.div>
                <motion.div 
                  className={`font-mono text-3xl font-bold ${getTimeClass(timeLeft.white)}`}
                  animate={timeLeft.white < 30 ? { 
                    scale: [1, 1.15, 1],
                    textShadow: ["0 0 0px rgba(239, 68, 68, 0)", "0 0 15px rgba(239, 68, 68, 0.8)", "0 0 0px rgba(239, 68, 68, 0)"]
                  } : {}}
                  transition={{ 
                    duration: 1.2, 
                    repeat: timeLeft.white < 30 ? Number.POSITIVE_INFINITY : 0,
                    ease: "easeInOut"
                  }}
                >
                  {formatTime(timeLeft.white)}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Game Layout with Board and Controls */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 w-full max-w-7xl">
            <div className="flex-1 flex justify-center">
              <Chessboard 
                playerColor={getEffectivePlayerColor()} 
                boardFlipped={boardFlipped} 
              />
            </div>
            
            <motion.div 
              className="flex-shrink-0 space-y-6"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15, 
                delay: 0.6,
                duration: 1
              }}
            >
              <GameControls
                onResign={handleResign}
                onOfferDraw={handleOfferDraw}
                onFlipBoard={handleFlipBoard}
                onBackToHome={handleBackToHome}
                boardFlipped={boardFlipped}
                gameStatus={gameStatus}
              />
              
              <MoveHistory
                moveHistory={moveHistory}
                currentMoveIndex={moveHistory.length - 1}
              />
            </motion.div>
          </div>

          {/* Enhanced Game Info Panel */}
          <motion.div
            className="bg-slate-800/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-slate-600/60 w-full max-w-2xl"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15, 
              delay: 0.8,
              duration: 1
            }}
            whileHover={{
              boxShadow: "0 0 60px rgba(0,0,0,0.7)",
              scale: 1.02,
              transition: { duration: 0.4, ease: "easeOut" }
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <motion.div
                className="space-y-4"
                whileHover={{ 
                  scale: 1.08,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <div className="text-slate-400 text-sm font-medium">Your Color</div>
                <motion.div 
                  className={`text-4xl font-bold flex items-center justify-center gap-3 ${playerColor === "white" ? "text-slate-100" : "text-slate-600"}`}
                  animate={{ 
                    textShadow: playerColor === "white" 
                      ? ["0 0 0px rgba(255,255,255,0)", "0 0 20px rgba(255,255,255,0.6)", "0 0 0px rgba(255,255,255,0)"]
                      : ["0 0 0px rgba(0,0,0,0)", "0 0 20px rgba(0,0,0,0.6)", "0 0 0px rgba(0,0,0,0)"],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut"
                  }}
                >
                  <motion.div
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <FaChessKing />
                  </motion.div>
                  {playerColor.toUpperCase()}
                </motion.div>
              </motion.div>

              <motion.div
                className="space-y-4"
                whileHover={{ 
                  scale: 1.08,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
              >
                <div className="text-slate-400 text-sm font-medium">Game Mode</div>
                <motion.div 
                  className="text-white font-semibold text-xl"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                    Rapid • 10+0
                  </span>
                </motion.div>
              </motion.div>

              <motion.div
                className="space-y-4"
                whileHover={{ 
                  scale: 1.08,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.6 }}
              >
                <div className="text-slate-400 text-sm font-medium">Status</div>
                <div className="text-emerald-400 font-semibold flex items-center justify-center gap-3">
                  <motion.span 
                    className="relative flex h-4 w-4"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  >
                    <motion.span 
                      className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                      animate={{ scale: [1, 2.5, 1], opacity: [0.75, 0, 0.75] }}
                      transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
                    />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 shadow-lg"></span>
                  </motion.span>
                  <motion.span
                    animate={{ 
                      opacity: [0.7, 1, 0.7],
                      textShadow: ["0 0 0px rgba(16, 185, 129, 0)", "0 0 10px rgba(16, 185, 129, 0.6)", "0 0 0px rgba(16, 185, 129, 0)"]
                    }}
                    transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  >
                    In Progress
                  </motion.span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
