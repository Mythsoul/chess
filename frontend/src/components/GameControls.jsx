import { FaFlag, FaHandshake, FaRedo, FaHome, FaClock, FaEye } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpring, animated } from '@react-spring/web'
import { useState } from 'react'

const ControlButton = ({ onClick, disabled, className, title, icon: Icon, variant = 'default', children }) => {
  const [isPressed, setIsPressed] = useState(false)
  
  const variants = {
    default: 'bg-slate-700/90 hover:bg-slate-600/90 border-slate-500',
    primary: 'bg-blue-600/90 hover:bg-blue-500/90 border-blue-400',
    warning: 'bg-amber-600/90 hover:bg-amber-500/90 border-amber-400',
    danger: 'bg-red-600/90 hover:bg-red-500/90 border-red-400',
    success: 'bg-green-600/90 hover:bg-green-500/90 border-green-400'
  }

  const [{ scale, boxShadow }, api] = useSpring(() => ({
    scale: 1,
    boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
    config: { tension: 300, friction: 20 }
  }))

  const handleMouseDown = () => {
    setIsPressed(true)
    api.start({ 
      scale: 0.95,
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.3)'
    })
  }

  const handleMouseUp = () => {
    setIsPressed(false)
    api.start({ 
      scale: 1,
      boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.25)'
    })
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <animated.button
        onClick={onClick}
        disabled={disabled}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`
          relative overflow-hidden p-4 text-white rounded-xl transition-all duration-300
          backdrop-blur-xl border-2 shadow-lg group
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-current
          ${variants[variant]} ${className}
        `}
        style={{ scale, boxShadow }}
        title={title}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Ripple effect */}
        {isPressed && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-xl"
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
        
        <div className="relative flex items-center justify-center gap-2">
          {Icon && (
            <motion.div
              animate={{ rotate: isPressed ? 10 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Icon className="w-5 h-5" />
            </motion.div>
          )}
          {children}
        </div>
      </animated.button>
    </motion.div>
  )
}

export default function GameControls({ 
  onResign, 
  onOfferDraw, 
  onFlipBoard, 
  onBackToHome, 
  gameStatus = 'playing'
}) {
  return (
    <motion.div 
      className="flex flex-col gap-3"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 200, 
        damping: 20,
        staggerChildren: 0.1
      }}
    >
      {/* Flip Board */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ControlButton
          onClick={onFlipBoard}
          icon={FaRedo}
          title="Flip Board"
          variant="primary"
        />
      </motion.div>
      
      {/* Offer Draw */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ControlButton
          onClick={onOfferDraw}
          disabled={gameStatus !== 'playing'}
          icon={FaHandshake}
          title="Offer Draw"
          variant="warning"
        />
      </motion.div>
      
      {/* Resign */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ControlButton
          onClick={onResign}
          disabled={gameStatus !== 'playing'}
          icon={FaFlag}
          title="Resign"
          variant="danger"
        />
      </motion.div>
      
      {/* Back to Home */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <ControlButton
          onClick={onBackToHome}
          icon={FaHome}
          title="Exit Game"
          variant="default"
        />
      </motion.div>
      
      {/* Game Status Indicator */}
      <motion.div
        className="mt-4 p-3 rounded-xl bg-slate-800/90 backdrop-blur-xl border-2 border-slate-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <FaClock className="w-4 h-4 text-emerald-400" />
          </motion.div>
          <span className="font-medium">
            {gameStatus === 'playing' ? 'Game Active' : 'Game Finished'}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
