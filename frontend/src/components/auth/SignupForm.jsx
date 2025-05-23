import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signUp, signInWithOAuth } from 'easy.auth98'
import { FaEye, FaEyeSlash, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'
import { FaGithub, FaFacebook } from 'react-icons/fa'
import { authConfig } from '../../config/auth'

export default function SignupForm({ onSuccess, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [fieldValidation, setFieldValidation] = useState({})

  // Real-time validation
  const validateField = (name, value) => {
    let error = ''
    let isValid = true

    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!value) {
          error = 'Email is required'
          isValid = false
        } else if (!emailRegex.test(value)) {
          error = 'Please enter a valid email address'
          isValid = false
        }
        break

      case 'username':
        if (!value) {
          error = 'Username is required'
          isValid = false
        } else if (value.length < 3) {
          error = 'Username must be at least 3 characters'
          isValid = false
        } else if (value.length > 20) {
          error = 'Username must be less than 20 characters'
          isValid = false
        } else if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          error = 'Username can only contain letters, numbers, hyphens, and underscores'
          isValid = false
        }
        break

      case 'password':
        if (!value) {
          error = 'Password is required'
          isValid = false
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters'
          isValid = false
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          error = 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
          isValid = false
        }
        break

      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password'
          isValid = false
        } else if (value !== formData.password) {
          error = 'Passwords do not match'
          isValid = false
        }
        break
    }

    return { error, isValid }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Real-time validation
    const validation = validateField(name, value)
    setFieldValidation(prev => ({
      ...prev,
      [name]: validation.isValid
    }))

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    // Revalidate confirm password when password changes
    if (name === 'password' && formData.confirmPassword) {
      const confirmValidation = validateField('confirmPassword', formData.confirmPassword)
      setFieldValidation(prev => ({
        ...prev,
        confirmPassword: confirmValidation.isValid
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // Validate all fields
    const validationErrors = {}
    Object.keys(formData).forEach(key => {
      const validation = validateField(key, formData[key])
      if (!validation.isValid) {
        validationErrors[key] = validation.error
      }
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setIsLoading(false)
      return
    }

    try {
      const result = await signUp(
        formData.email,
        formData.password,
        formData.username,
        authConfig.applicationUrl,
        authConfig.emailConfig
      )

      if (result.success) {
        onSuccess?.(result.data)
      } else {
        if (result.details && typeof result.details === 'object') {
          setErrors(result.details)
        } else {
          setErrors({
            general: result.message || 'Registration failed. Please try again.'
          })
        }
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

  const getValidationIcon = (fieldName) => {
    if (!formData[fieldName]) return null
    if (fieldValidation[fieldName] === true) {
      return <FaCheck className="text-emerald-400" />
    } else if (fieldValidation[fieldName] === false) {
      return <FaTimes className="text-red-400" />
    }
    return null
  }

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Signup Header */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <motion.h2 
          className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-emerald-500 bg-clip-text text-transparent mb-2"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          Join the Game
        </motion.h2>
        <motion.p 
          className="text-slate-400"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Create your account and start playing chess
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
          Sign up with Google
        </motion.button>

        <motion.button
          type="button"
          onClick={() => handleOAuthLogin('github')}
          className="w-full flex items-center justify-center gap-3 bg-gray-900/50 hover:bg-gray-900/70 backdrop-blur-sm border border-slate-600/50 rounded-xl px-4 py-3 text-slate-300 font-medium transition-all duration-300"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaGithub className="text-xl" />
          Sign up with GitHub
        </motion.button>

        <motion.button
          type="button"
          onClick={() => handleOAuthLogin('facebook')}
          className="w-full flex items-center justify-center gap-3 bg-blue-600/50 hover:bg-blue-600/70 backdrop-blur-sm border border-slate-600/50 rounded-xl px-4 py-3 text-slate-300 font-medium transition-all duration-300"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaFacebook className="text-xl" />
          Sign up with Facebook
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

      {/* Signup Form */}
      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {/* Username Field */}
        <motion.div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Username
          </label>
          <div className="relative">
            <motion.input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full bg-slate-800/50 border rounded-xl px-4 py-3 pr-10 text-slate-200 placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                errors.username 
                  ? 'border-red-500 focus:border-red-400' 
                  : fieldValidation.username === true
                  ? 'border-emerald-500 focus:border-emerald-400'
                  : 'border-slate-600/50 focus:border-emerald-500'
              }`}
              placeholder="Choose a username"
              required
              variants={inputVariants}
              whileFocus="focus"
              initial="blur"
              animate="blur"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getValidationIcon('username')}
            </div>
          </div>
          {errors.username && (
            <motion.p 
              className="mt-2 text-sm text-red-400"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {errors.username}
            </motion.p>
          )}
        </motion.div>

        {/* Email Field */}
        <motion.div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <motion.input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full bg-slate-800/50 border rounded-xl px-4 py-3 pr-10 text-slate-200 placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                errors.email 
                  ? 'border-red-500 focus:border-red-400' 
                  : fieldValidation.email === true
                  ? 'border-emerald-500 focus:border-emerald-400'
                  : 'border-slate-600/50 focus:border-emerald-500'
              }`}
              placeholder="Enter your email"
              required
              variants={inputVariants}
              whileFocus="focus"
              initial="blur"
              animate="blur"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getValidationIcon('email')}
            </div>
          </div>
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
              className={`w-full bg-slate-800/50 border rounded-xl px-4 py-3 pr-20 text-slate-200 placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                errors.password 
                  ? 'border-red-500 focus:border-red-400' 
                  : fieldValidation.password === true
                  ? 'border-emerald-500 focus:border-emerald-400'
                  : 'border-slate-600/50 focus:border-emerald-500'
              }`}
              placeholder="Create a strong password"
              required
              variants={inputVariants}
              whileFocus="focus"
              initial="blur"
              animate="blur"
            />
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              {getValidationIcon('password')}
            </div>
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
          {errors.password && (
            <motion.p 
              className="mt-2 text-sm text-red-400"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {errors.password}
            </motion.p>
          )}
          {/* Password strength indicator */}
          {formData.password && (
            <motion.div 
              className="mt-2 space-y-1"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <div className="flex space-x-1">
                {[
                  formData.password.length >= 8,
                  /[a-z]/.test(formData.password),
                  /[A-Z]/.test(formData.password),
                  /\d/.test(formData.password)
                ].map((valid, i) => (
                  <div 
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      valid ? 'bg-emerald-400' : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400">
                Password must contain: 8+ characters, lowercase, uppercase, number
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Confirm Password Field */}
        <motion.div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <motion.input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full bg-slate-800/50 border rounded-xl px-4 py-3 pr-20 text-slate-200 placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                errors.confirmPassword 
                  ? 'border-red-500 focus:border-red-400' 
                  : fieldValidation.confirmPassword === true
                  ? 'border-emerald-500 focus:border-emerald-400'
                  : 'border-slate-600/50 focus:border-emerald-500'
              }`}
              placeholder="Confirm your password"
              required
              variants={inputVariants}
              whileFocus="focus"
              initial="blur"
              animate="blur"
            />
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              {getValidationIcon('confirmPassword')}
            </div>
            <motion.button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </motion.button>
          </div>
          {errors.confirmPassword && (
            <motion.p 
              className="mt-2 text-sm text-red-400"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {errors.confirmPassword}
            </motion.p>
          )}
        </motion.div>

        {/* Terms and Privacy */}
        <motion.div className="text-sm text-slate-400 text-center">
          By signing up, you agree to our{' '}
          <motion.a 
            href="#" 
            className="text-emerald-400 hover:text-emerald-300 transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
          >
            Terms of Service
          </motion.a>{' '}
          and{' '}
          <motion.a 
            href="#" 
            className="text-emerald-400 hover:text-emerald-300 transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
          >
            Privacy Policy
          </motion.a>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </motion.button>
      </motion.form>

      {/* Switch to Login */}
      <motion.div 
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <p className="text-slate-400">
          Already have an account?{' '}
          <motion.button
            onClick={onSwitchToLogin}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
          >
            Sign in here
          </motion.button>
        </p>
      </motion.div>
    </motion.div>
  )
}
