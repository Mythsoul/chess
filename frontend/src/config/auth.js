import { configure } from 'easy.auth98'

// Configure EasyAuth SDK
configure({
  
  timeout: 15000,
  tokenCookies: {
    access: 'chess_access_token',
    refresh: 'chess_refresh_token'
  },
  tokenExpiry: {
    access: 30 * 60, // 30 minutes
    refresh: 14 * 24 * 60 * 60 // 14 days
  }
})

export const authConfig = {
  emailConfig: {
    sendVerificationEmail: true,
  },
  applicationUrl: typeof window !== 'undefined' ? window.location.origin : ''
}
