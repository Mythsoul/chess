import React, { createContext, useContext } from 'react'
import { useAuth as useEasyAuth, useSession } from 'easy.auth98'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const auth = useEasyAuth()
  const session = useSession()

  const value = {
    ...auth,
    session: session.data,
    sessionStatus: session.status,
    updateSession: session.update
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
