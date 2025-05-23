import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { forgotPassword } from 'easy.auth98'
import { FaSpinner, FaArrowLeft, FaEnvelope, FaCheck } from 'react-icons/fa'
import { authConfig } from '../../config/auth'

export default function ForgotPasswordForm({ onBackToLogin }) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    try {
      const result = await forgotPassword(email, authConfig.applicationUrl)

      if (result.success) {
        setIsSuccess(true)
      } else {
        setError(result.message || 'Failed to send reset email. Please try again.')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputVariants = {
    focus: {
      scale: 1.02,
      boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)',
      transition: { duration: 0.2 }
    },
    blur: {
      scale: 1,
      boxShadow: '0 0 0 0px rgba(16, 185, 129, 0)',
      transition: { duration: 0.2 }
    }
  }

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Header */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <motion.div
          className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
        >
          <FaEnvelope className="text-white text-xl" />
        </motion.div>
        
        <motion.h2 
          className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent mb-2"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          Forgot Password?
        </motion.h2>
        
        <motion.p 
          className="text-slate-400"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          No worries! Enter your email and we'll send you a reset link
        </motion.p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-400 text-sm"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <motion.div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <motion.input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all duration-300"
                placeholder="Enter your email address"
                required
                variants={inputVariants}
                whileFocus="focus"
                initial="blur"
                animate="blur"
              />
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              whileHover={{ scale: isLoading ? 1 : 1.02, y: isLoading ? 0 : -2 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <FaSpinner />
                  </motion.div>
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <FaEnvelope />
                  Send Reset Link
                </>
              )}
            </motion.button>

            {/* Back to Login */}
            <motion.div className="text-center">
              <motion.button
                type="button"
                onClick={onBackToLogin}
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-300"
                whileHover={{ scale: 1.05, x: -5 }}
              >
                <FaArrowLeft />
                Back to Login
              </motion.button>
            </motion.div>
          </motion.form>
        ) : (
          <motion.div
            className="text-center space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Success Icon */}
            <motion.div
              className="w-20 h-20 bg-gradient-to-r from-emerald-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.2, 
                type: "spring", 
                stiffness: 300, 
                damping: 20 
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <FaCheck className="text-white text-2xl" />
              </motion.div>
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold text-slate-200 mb-3">
                Check Your Email
              </h3>
              <p className="text-slate-400 mb-2">
                We've sent a password reset link to:
              </p>
              <p className="text-emerald-400 font-medium text-lg">
                {email}
              </p>
            </motion.div>

            {/* Instructions */}
            <motion.div
              className="bg-slate-800/50 border border-slate-600/50 rounded-xl p-4 text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <h4 className="font-medium text-slate-200 mb-2">Next Steps:</h4>
              <ul className="text-sm text-slate-400 space-y-1">
                <motion.li 
                  className="flex items-start gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <span className="text-emerald-400 mt-0.5">•</span>
                  Check your email inbox (and spam folder)
                </motion.li>
                <motion.li 
                  className="flex items-start gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <span className="text-emerald-400 mt-0.5">•</span>
                  Click the reset link in the email
                </motion.li>
                <motion.li 
                  className="flex items-start gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <span className="text-emerald-400 mt-0.5">•</span>
                  Create your new password
                </motion.li>
                <motion.li 
                  className="flex items-start gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <span className="text-emerald-400 mt-0.5">•</span>
                  Return here to sign in with your new password
                </motion.li>
              </ul>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <motion.button
                onClick={onBackToLogin}
                className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaArrowLeft />
                Back to Login
              </motion.button>
              
              <motion.button
                onClick={() => {
                  setIsSuccess(false)
                  setEmail('')
                  setError('')
                }}
                className="w-full bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 font-medium py-3 px-4 rounded-xl transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Send Another Email
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
