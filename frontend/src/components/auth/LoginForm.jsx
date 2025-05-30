import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn, signInWithOAuth } from 'easy.auth98'
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'
import { FaGithub, FaFacebook } from 'react-icons/fa'

export default function LoginForm({ onSuccess, onSwitchToSignup, onForgotPassword }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const result = await signIn(formData.email, formData.password)
      
      if (result.success) {
        onSuccess?.(result.data)
      } else {
        setErrors({ 
          general: result.message || 'Login failed. Please check your credentials.' 
        })
      }
    } catch (error) {
      setErrors({ 
        general: 'An unexpected error occurred. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = (provider) => {
    signInWithOAuth(provider, '/')
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
      {/* Login Header */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <motion.h2 
          className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent mb-2"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          Welcome Back
        </motion.h2>
        <motion.p 
          className="text-slate-400"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Sign in to continue your chess journey
        </motion.p>
      </motion.div>

      {/* OAuth Buttons */}
      <motion.div 
        className="space-y-3 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <motion.button
          type="button"
          onClick={() => handleOAuthLogin('google')}
          className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-slate-600/50 rounded-xl px-4 py-3 text-slate-300 font-medium transition-all duration-300"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <FcGoogle className="text-xl" />
          Continue with Google
        </motion.button>

        <motion.button
          type="button"
          onClick={() => handleOAuthLogin('github')}
          className="w-full flex items-center justify-center gap-3 bg-gray-900/50 hover:bg-gray-900/70 backdrop-blur-sm border border-slate-600/50 rounded-xl px-4 py-3 text-slate-300 font-medium transition-all duration-300"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaGithub className="text-xl" />
          Continue with GitHub
        </motion.button>

        <motion.button
          type="button"
          onClick={() => handleOAuthLogin('facebook')}
          className="w-full flex items-center justify-center gap-3 bg-blue-600/50 hover:bg-blue-600/70 backdrop-blur-sm border border-slate-600/50 rounded-xl px-4 py-3 text-slate-300 font-medium transition-all duration-300"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaFacebook className="text-xl" />
          Continue with Facebook
        </motion.button>
      </motion.div>

      {/* Divider */}
      <motion.div 
        className="flex items-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="flex-1 h-px bg-slate-600/50"></div>
        <span className="px-4 text-slate-400 text-sm">or</span>
        <div className="flex-1 h-px bg-slate-600/50"></div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {errors.general && (
          <motion.div
            className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-400 text-sm"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {errors.general}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Form */}
      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {/* Email Field */}
        <motion.div>
          <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="login-email">
            Email Address
          </label>
          <motion.input
            id="login-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full bg-slate-800/50 border rounded-xl px-4 py-3 text-slate-200 placeholder-slate-400 focus:outline-none transition-all duration-300 ${
              errors.email 
                ? 'border-red-500 focus:border-red-400' 
                : 'border-slate-600/50 focus:border-emerald-500'
            }`}
            placeholder="Enter your email"
            required
            autoComplete="email"
            variants={inputVariants}
            whileFocus="focus"
            initial="blur"
            animate="blur"
          />
          {errors.email && (
            <motion.p 
              className="mt-2 text-sm text-red-400"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {errors.email}
            </motion.p>
          )}
        </motion.div>

        {/* Password Field */}
        <motion.div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <div className="relative">
            <motion.input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 pr-12 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all duration-300"
              placeholder="Enter your password"
              required
              variants={inputVariants}
              whileFocus="focus"
              initial="blur"
              animate="blur"
            />
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </motion.button>
          </div>
        </motion.div>

        {/* Forgot Password */}
        <motion.div className="text-right">
          <motion.button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
          >
            Forgot your password?
          </motion.button>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading}
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
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </motion.button>
      </motion.form>

      {/* Switch to Signup */}
      <motion.div 
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <p className="text-slate-400">
          Don't have an account?{' '}
          <motion.button
            onClick={onSwitchToSignup}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
          >
            Sign up here
          </motion.button>
        </p>
      </motion.div>
    </motion.div>
  )
}
