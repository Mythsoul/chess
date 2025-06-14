import { useState, useEffect } from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import socket from "../utils/socket"
import GamePage from "./GamePage"

export default function GameRoute() {
  const { gameRoute } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [gameData, setGameData] = useState(null)
  const [playerColor, setPlayerColor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isReconnecting, setIsReconnecting] = useState(false)

  useEffect(() => {
    // If we have state from navigation (from joining a game), use it
    if (location.state?.playerColor && location.state?.gameData) {
      setPlayerColor(location.state.playerColor)
      setGameData(location.state.gameData)
      setLoading(false)
      return
    }

    // Otherwise, check if this is a reconnection scenario
    const handleGameAccess = async () => {
      try {
        // First, try to get basic game info
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/game/${gameRoute}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Game not found")
          } else {
            setError("Failed to load game")
          }
          return
        }

        const game = await response.json()
        
        // Check if user is authenticated and part of this game
        if (user && (game.whitePlayer.id === user.id || game.blackPlayer.id === user.id)) {
          // User is a player - attempt to reconnect if game is active
          if (game.status === 'active') {
            setIsReconnecting(true)
            attemptReconnection(game)
          } else {
            // Game is finished, show as spectator
            setGameData(game)
            setPlayerColor(game.whitePlayer.id === user.id ? 'white' : 'black')
            setLoading(false)
          }
        } else {
          // User is not part of this game
          if (game.status === 'completed') {
            // Allow spectating finished games (if not both guests)
            const bothGuests = game.whitePlayer.email?.includes('@chess.local') && game.blackPlayer.email?.includes('@chess.local')
            if (!bothGuests) {
              setGameData(game)
              setPlayerColor(null) // Spectator
              setLoading(false)
            } else {
              setError("Game not found")
            }
          } else {
            setError("You are not authorized to view this game")
          }
        }
      } catch (err) {
        console.error('Error fetching game:', err)
        setError("Failed to load game")
        setLoading(false)
      }
    }

    const attemptReconnection = (game) => {
      // Emit reconnection event
      socket.emit('reconnect_to_game', {
        gameRoute,
        userData: user
      })
      
      // Set up listeners for reconnection response
      const handleReconnectSuccess = (data) => {
        console.log('Reconnection successful:', data)
        setGameData(data.gameState)
        setPlayerColor(data.playerColor)
        setIsReconnecting(false)
        setLoading(false)
        socket.off('game_reconnected', handleReconnectSuccess)
        socket.off('reconnect_failed', handleReconnectFailed)
      }
      
      const handleReconnectFailed = (data) => {
        console.log('Reconnection failed:', data.error)
        setError(data.error || 'Failed to reconnect to game')
        setIsReconnecting(false)
        setLoading(false)
        socket.off('game_reconnected', handleReconnectSuccess)
        socket.off('reconnect_failed', handleReconnectFailed)
      }
      
      socket.on('game_reconnected', handleReconnectSuccess)
      socket.on('reconnect_failed', handleReconnectFailed)
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (isReconnecting) {
          handleReconnectFailed({ error: 'Reconnection timeout' })
        }
      }, 10000)
    }

    handleGameAccess()
  }, [gameRoute, location.state, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-300 text-xl">Loading game...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-400 mb-4">{error}</h1>
          <button 
            onClick={() => navigate('/')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return <GamePage playerColor={playerColor} gameData={gameData} gameRoute={gameRoute} />
}
