import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes } from 'react-icons/fa'
import { handleOAuthCallback } from 'easy.auth98'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'
import ForgotPasswordForm from './ForgotPasswordForm'

export default function AuthModal({ isOpen, onClose, onSuccess, defaultView = 'login' }) {
  const [currentView, setCurrentView] = useState(defaultView)
  const [isSuccess, setIsSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Handle OAuth callback when modal opens
  useEffect(() => {
    if (isOpen) {
      const oauthResult = handleOAuthCallback()
      if (oauthResult.success) {
        setIsSuccess(true)
        setSuccessMessage(`Successfully signed in with ${oauthResult.provider}!`)
        setTimeout(() => {
          onSuccess?.(oauthResult)
          onClose()
        }, 2000)
      } else if (oauthResult.error && oauthResult.error !== 'NO_TOKEN') {
        // Handle OAuth errors if needed
        console.error('OAuth error:', oauthResult.message)
      }
    }
  }, [isOpen, onSuccess, onClose])

  const handleClose = () => {
    setCurrentView(defaultView)
    setIsSuccess(false)
    setSuccessMessage('')
    onClose()
  }

  const handleAuthSuccess = (data) => {
    if (currentView === 'signup') {
      setIsSuccess(true)
      setSuccessMessage('Account created successfully! Please check your email for verification.')
      setTimeout(() => {
        onSuccess?.(data)
        handleClose()
      }, 2000)
    } else {
      onSuccess?.(data)
      handleClose()
    }
  }

  const modalVariants = {
    closed: {
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    open: {
      opacity: 1,
      scale: 1,
      y: 0
    }
  }

  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 }
  }

  const contentVariants = {
    login: { x: 0, opacity: 1 },
    signup: { x: 0, opacity: 1 },
    forgot: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial="closed"
        animate="open"
        exit="closed"
        variants={overlayVariants}
        transition={{ duration: 0.3 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden"
          variants={modalVariants}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 opacity-10">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-blue-600 to-purple-600"
              animate={{
                background: [
                  "linear-gradient(to bottom right, #10B981, #3B82F6, #8B5CF6)",
                  "linear-gradient(to bottom right, #3B82F6, #8B5CF6, #10B981)",
                  "linear-gradient(to bottom right, #8B5CF6, #10B981, #3B82F6)",
                  "linear-gradient(to bottom right, #10B981, #3B82F6, #8B5CF6)"
                ]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Close Button */}
          <motion.button
            className="absolute top-6 right-6 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all duration-300"
            onClick={handleClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaTimes size={14} />
          </motion.button>

          {/* Content */}
          <div className="relative z-10 p-8">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  className="text-center py-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-white text-xl"
                    >
                      ✓
                    </motion.div>
                  </motion.div>
                  
                  <motion.h2 
                    className="text-2xl font-bold text-slate-200 mb-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Success!
                  </motion.h2>
                  
                  <motion.p 
                    className="text-slate-400"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {successMessage}
                  </motion.p>
                  
                  <motion.div
                    className="mt-4 w-16 h-1 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full mx-auto"
                    initial={{ width: 0 }}
                    animate={{ width: '4rem' }}
                    transition={{ delay: 0.5, duration: 2 }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={currentView}
                  variants={contentVariants}
                  initial="exit"
                  animate={currentView}
                  exit="exit"
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  {currentView === 'login' && (
                    <LoginForm
                      onSuccess={handleAuthSuccess}
                      onSwitchToSignup={() => setCurrentView('signup')}
                      onForgotPassword={() => setCurrentView('forgot')}
                    />
                  )}

                  {currentView === 'signup' && (
                    <SignupForm
                      onSuccess={handleAuthSuccess}
                      onSwitchToLogin={() => setCurrentView('login')}
                    />
                  )}

                  {currentView === 'forgot' && (
                    <ForgotPasswordForm
                      onBackToLogin={() => setCurrentView('login')}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Navigation Dots */}
          {!isSuccess && (
            <motion.div
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              {['login', 'signup', 'forgot'].map((view) => (
                <motion.button
                  key={view}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentView === view
                      ? 'bg-emerald-400 w-6'
                      : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                  onClick={() => setCurrentView(view)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
