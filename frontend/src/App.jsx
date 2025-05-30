
import { useState, useEffect } from "react"
import socket from "./utils/socket"
import GamePage from "./pages/GamePage"
import { motion, AnimatePresence } from "framer-motion"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { signOut } from 'easy.auth98'
import { FaUser, FaSignOutAlt, FaUserCircle } from 'react-icons/fa'
import AuthModal from "./components/auth/AuthModal"
import "./config/auth" // Initialize auth configuration

function AppContent() {
  const { isAuthenticated, user } = useAuth()
  const [status, setStatus] = useState("")
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [playerColor, setPlayerColor] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server")
      setIsConnected(true)
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
    })

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error)
      setStatus("Connection error! Please try again.")
      setIsConnected(false)
      setIsLoading(false)
    })

    socket.on("waiting", (data) => {
      setStatus(data.message)
    })

    socket.on("game_start", (data) => {
      setStatus("Game starting!")
      setPlayerColor(data.color)
      setIsLoading(false)

      // Add a small delay for smoother transition
      setTimeout(() => {
        setIsGameStarted(true)
      }, 500)
    })

    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("connect_error")
      socket.off("waiting")
      socket.off("game_start")
    }
  }, [])

  const handleJoinGame = () => {
    setStatus("Finding opponent...")
    setIsLoading(true)
    
    // Send user info with the game request
    const playerInfo = isAuthenticated 
      ? { 
          id: user?.id || 'anonymous', 
          username: user?.username || 'Anonymous', 
          email: user?.email || 'guest@chess.com',
          isGuest: false 
        }
      : {
          id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          username: 'Guest',
          email: 'guest@chess.com', 
          isGuest: true
        }
    
    socket.emit("init_game", { player: playerInfo })
  }

  const handleAuthSuccess = (data) => {
    setShowAuthModal(false)
    // Optionally auto-start game after login
    if (isConnected) {
      setTimeout(() => {
        handleJoinGame()
      }, 1000)
    }
  }

  if (isGameStarted) {
    return <GamePage playerColor={playerColor} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
      {/* User Status - Top Right */}
      <motion.div 
        className="absolute top-6 right-6 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {isAuthenticated ? (
          <motion.div 
            className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl px-4 py-3"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full flex items-center justify-center">
                <FaUserCircle className="text-white text-lg" />
              </div>
              <div>
                <p className="text-slate-200 font-medium text-sm">{user?.username}</p>
                <p className="text-slate-400 text-xs">{user?.email}</p>
              </div>
            </motion.div>
            <motion.button
              onClick={() => signOut()}
              className="text-slate-400 hover:text-red-400 p-1 rounded-lg transition-colors duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Sign Out"
            >
              <FaSignOutAlt />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div className="flex gap-3">
            {/* Guest indicator */}
            <motion.div 
              className="flex items-center gap-2 bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-xl px-3 py-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-6 h-6 bg-gradient-to-r from-slate-600 to-slate-500 rounded-full flex items-center justify-center">
                <FaUser className="text-slate-300 text-xs" />
              </div>
              <span className="text-slate-300 text-sm font-medium">Playing as Guest</span>
            </motion.div>
            
            <motion.button
              onClick={() => setShowAuthModal(true)}
              className="bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 text-slate-300 px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaUser />
              Sign In
            </motion.button>
            <motion.button
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaUserCircle />
              Sign Up
            </motion.button>
          </motion.div>
        )}
      </motion.div>
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-emerald-500/20"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: Math.random() * 0.5 + 0.3,
            }}
            animate={{
              y: [null, Math.random() * -100 - 50],
              opacity: [null, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Chess pieces floating in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {["♔", "♕", "♖", "♗", "♘", "♙", "♚", "♛", "♜", "♝", "♞", "♟"].map((piece, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl text-slate-600/20"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              rotate: Math.random() * 360,
              opacity: Math.random() * 0.3 + 0.1,
            }}
            animate={{
              y: [null, Math.random() * 200 - 100],
              x: [null, Math.random() * 200 - 100],
              rotate: [null, Math.random() * 360],
              opacity: [null, Math.random() * 0.3 + 0.1],
            }}
            transition={{
              duration: Math.random() * 20 + 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            {piece}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="text-center p-4 md:p-8 max-w-2xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Main Logo/Title */}
        <motion.div
          className="mb-12"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            Chess Master
          </motion.h1>
          <motion.div
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 flex justify-center space-x-1 sm:space-x-2"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {["♔", "♛", "♜", "♝", "♞", "♟"].map((piece, i) => (
              <motion.span
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{
                  scale: 1.2,
                  rotate: [0, 10, -10, 0],
                  transition: { duration: 0.5 },
                }}
              >
                {piece}
              </motion.span>
            ))}
          </motion.div>
          <motion.p
            className="text-slate-300 text-lg sm:text-xl leading-relaxed px-4 sm:px-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Experience the ultimate online chess battle. Play against opponents from around the world in real-time
            matches.
          </motion.p>
        </motion.div>

        {/* Connection Status */}
        <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          <motion.div
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${isConnected ? "bg-emerald-900/50 text-emerald-400" : "bg-red-900/50 text-red-400"}`}
            animate={{
              boxShadow: isConnected
                ? ["0 0 0 rgba(16, 185, 129, 0)", "0 0 20px rgba(16, 185, 129, 0.5)", "0 0 0 rgba(16, 185, 129, 0)"]
                : ["0 0 0 rgba(239, 68, 68, 0)", "0 0 20px rgba(239, 68, 68, 0.5)", "0 0 0 rgba(239, 68, 68, 0)"],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <motion.div
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-red-400"}`}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            ></motion.div>
            <span className="text-sm font-medium">{isConnected ? "Connected" : "Disconnected"}</span>
          </motion.div>
        </motion.div>

        {/* Play Button */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, type: "spring", stiffness: 300, damping: 30 }}
        >
          <motion.button
            className="group relative bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-2xl text-lg sm:text-xl md:text-2xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-400/50 overflow-hidden"
            onClick={handleJoinGame}
            disabled={!isConnected || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-400/20"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 1 }}
            />

            <motion.span
              className="relative z-10 flex items-center justify-center gap-2"
              animate={{
                textShadow: [
                  "0 0 0px rgba(255,255,255,0)",
                  "0 0 10px rgba(255,255,255,0.5)",
                  "0 0 0px rgba(255,255,255,0)",
                ],
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              {isLoading ? (
                <>
                  <motion.svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </motion.svg>
                  Finding Game...
                </>
              ) : (
                <>🎯 Play Now</>
              )}
            </motion.span>
          </motion.button>
        </motion.div>

        {/* Status Message */}
        <AnimatePresence>
          {status && (
            <motion.div
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-xl p-4 mb-8"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <div className="flex items-center justify-center space-x-3">
                <motion.div
                  className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                ></motion.div>
                <motion.p
                  className="text-emerald-400 font-medium text-lg"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                >
                  {status}
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Modal */}
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          defaultView="login"
        />

        {/* Features */}
   </motion.div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
