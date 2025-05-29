import { motion } from "framer-motion"

export default function LoadingSpinner({ 
  size = "md", 
  message = "Loading...", 
  showMessage = true 
}) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12", 
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  }

  const containerVariants = {
    start: {
      transition: {
        staggerChildren: 0.2
      }
    },
    end: {
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const circleVariants = {
    start: {
      y: "0%"
    },
    end: {
      y: "100%"
    }
  }

  const circleTransition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: "reverse",
    ease: "easeInOut"
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Chess-themed spinner */}
      <motion.div
        className={`${sizeClasses[size]} relative`}
        initial="start"
        animate="end"
        variants={containerVariants}
      >
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-emerald-400/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Rotating chess piece */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-emerald-400"
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <span className={`${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-3xl' : 'text-5xl'} font-bold`}>
            ♔
          </span>
        </motion.div>

        {/* Spinning dots */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              className="absolute w-2 h-2 bg-emerald-400 rounded-full"
              style={{
                top: "50%",
                left: "50%",
                transformOrigin: `${size === 'sm' ? '12px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '48px'} 0`,
                transform: `rotate(${index * 90}deg) translateX(-50%) translateY(-50%)`
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Loading message */}
      {showMessage && message && (
        <motion.div
          className="text-slate-300 text-center space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="font-medium">{message}</p>
          
          {/* Bouncing dots */}
          <motion.div
            className="flex justify-center space-x-1"
            variants={containerVariants}
            initial="start"
            animate="end"
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-emerald-400 rounded-full"
                variants={circleVariants}
                transition={{
                  ...circleTransition,
                  delay: index * 0.1
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
